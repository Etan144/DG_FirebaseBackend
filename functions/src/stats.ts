import {onSchedule} from "firebase-functions/v2/scheduler";
import * as functions from "firebase-functions/v1";
import {db} from "./firebase";

/* =========================
   HELPERS
========================= */

/**
 * Get YYYY-MM-DD id for today in Singapore time (UTC+8)
 * @return {string}
 */
function todayId(): string {
  const now = new Date();
  // Singapore is UTC+8
  const sgTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return sgTime.toISOString().slice(0, 10);
}

/* =========================
   CORE AGGREGATION LOGIC
========================= */

/**
 * Recompute aggregate detection statistics from calls collection
 * @return {Promise<void>}
 */
async function recomputeStats(): Promise<void> {
  const snap = await db.collection("calls").get();

  // Map to store highest values per caller_user_id
  const userStats: Record<string, {
    highest_detection_score?: number;
    highest_is_deepfake?: boolean;
    is_deepfake?: boolean;
  }> = {};

  snap.forEach((doc) => {
    const data = doc.data();
    // For each key, check if it matches the pattern for a caller_user_id attribute
    for (const [k, v] of Object.entries(data)) {
      // Example: 1szB7XJ4koPOhbFnCWhTVltAudP2_highest_detection_score
      const match = k.match(/^([A-Za-z0-9]+)_highest_detection_score$/);
      if (match && typeof v === "number") {
        const userId = match[1];
        if (!userStats[userId]) userStats[userId] = {};
        const prevScore = userStats[userId]?.highest_detection_score;
        if (prevScore === undefined || v > prevScore) {
          userStats[userId].highest_detection_score = v;
        }
      }
      const matchDeepfake = k.match(/^([A-Za-z0-9]+)_highest_is_deepfake$/);
      if (matchDeepfake && typeof v === "boolean") {
        const userId = matchDeepfake[1];
        if (!userStats[userId]) userStats[userId] = {};
        userStats[userId].highest_is_deepfake = v;
      }
      const matchIsDeepfake = k.match(/^([A-Za-z0-9]+)_is_deepfake$/);
      if (matchIsDeepfake && typeof v === "boolean") {
        const userId = matchIsDeepfake[1];
        if (!userStats[userId]) userStats[userId] = {};
        userStats[userId].is_deepfake = v;
      }
    }
  });

  // Aggregate metrics
  const scores: number[] = [];
  let deepfakeCount = 0;
  const total = snap.size; // total number of call documents
  snap.forEach((doc) => {
    const data = doc.data();
    for (const [k, v] of Object.entries(data)) {
      // caller_user_id_highest_detection_score
      if (k.match(/^[A-Za-z0-9]+_highest_detection_score$/) && typeof v === "number") {
        scores.push(v);
      }
      // caller_user_id_highest_is_deepfake
      if (k.match(/^[A-Za-z0-9]+_highest_is_deepfake$/) && typeof v === "boolean" && v === true) {
        deepfakeCount++;
      }
    }
  });

  const avg = scores.length > 0 ?
    scores.reduce((a, b) => a + b, 0) / scores.length :
    0;

  const stats = {
    avg_confidence: avg,
    deepfake_rate: total > 0 ? deepfakeCount / total : 0,
    total_scans: total,
    updated_at: new Date(),
  };

  // global snapshot
  await db.collection("aggregate_stats")
    .doc("global")
    .set(stats);

  // daily trend snapshot
  await db.collection("aggregate_stats_daily")
    .doc(todayId())
    .set(stats);
}

/* =========================
   SCHEDULED — DAILY
========================= */

/**
 * Scheduled daily recompute at 12:00 AM Singapore time (UTC+8)
 */
export const recomputeStatsDaily = onSchedule(
  "0 16 * * *",
  async (): Promise<void> => {
    await recomputeStats();
  }
);

/* =========================
   CALLABLE — MANUAL
========================= */

/**
 * Admin callable recompute
 */
export const recomputeStatsNow = functions.https.onCall(
  async (_data, context): Promise<{success: boolean}> => {
    if (!context.auth || context.auth.token.admin !== true) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin only"
      );
    }

    await recomputeStats();
    return {success: true};
  }
);
