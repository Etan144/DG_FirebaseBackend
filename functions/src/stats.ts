import {onSchedule} from "firebase-functions/v2/scheduler";
import * as functions from "firebase-functions/v1";
import {db} from "./firebase";

/* =========================
   HELPERS
========================= */

/**
 * Get YYYY-MM-DD id for today
 * @return {string}
 */
function todayId(): string {
  return new Date().toISOString().slice(0, 10);
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

  const scores: number[] = [];
  let deepfakeCount = 0;
  let total = 0;

  snap.forEach((doc) => {
    const data = doc.data();

    for (const [k, v] of Object.entries(data)) {
      if (k.endsWith("_detection_score") && typeof v === "number") {
        scores.push(v);
        total++;
      }

      if (k.endsWith("_is_deepfake") && v === true) {
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
 * Scheduled daily recompute
 */
export const recomputeStatsDaily = onSchedule(
  "every 24 hours",
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
