import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import {db} from "./firebase";

/**
 * Robustly extract milliseconds from various timestamp formats
 * @param {unknown} ts - The timestamp value to convert
 * @return {number} Milliseconds since epoch, or 0 if invalid
 */
const getMillis = (ts: unknown): number => {
  if (!ts) return 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyTs = ts as any;
  if (typeof anyTs.toMillis === "function") return anyTs.toMillis(); // Firestore Timestamp
  if (typeof anyTs.seconds === "number") return anyTs.seconds * 1000; // FieldValue with seconds
  if (typeof anyTs._seconds === "number") return anyTs._seconds * 1000; // Serialized object
  const dateVal = new Date(anyTs).getTime();
  return isNaN(dateVal) ? 0 : dateVal; // Fallback if string/date
};

/**
 * Convert timestamp to seconds (for JSON serialization)
 * @param {unknown} ts - The timestamp value to convert
 * @return {number} Seconds since epoch, or 0 if invalid
 */
const timestampToSeconds = (ts: unknown): number => {
  const millis = getMillis(ts);
  return millis ? Math.floor(millis / 1000) : 0;
};

/**
 * Get call history for the authenticated user
 * Returns calls where user is either caller or callee, sorted by most recent
 */
export const getCallHistory = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const userId = context.auth.uid;
    console.log("Getting call history for user:", userId);
    const {limit = 50} = data ?? {};

    try {
      // Query calls where user is the caller
      const callerQuery = db.collection("calls")
        .where("caller_user_id", "==", userId)
        .orderBy("created_at", "desc")
        .limit(limit);

      // Query calls where user is the callee
      const calleeQuery = db.collection("calls")
        .where("callee_user_id", "==", userId)
        .orderBy("created_at", "desc")
        .limit(limit);

      console.log("Executing queries...");

      const [callerSnapshot, calleeSnapshot] = await Promise.all([
        callerQuery.get(),
        calleeQuery.get(),
      ]);

      console.log("Caller calls:", callerSnapshot.docs.length);
      console.log("Callee calls:", calleeSnapshot.docs.length);

      // Combine and deduplicate results
      const callsMap = new Map();

      callerSnapshot.forEach((doc) => {
        callsMap.set(doc.id, {
          id: doc.id,
          ...doc.data(),
        });
      });

      calleeSnapshot.forEach((doc) => {
        if (!callsMap.has(doc.id)) {
          callsMap.set(doc.id, {
            id: doc.id,
            ...doc.data(),
          });
        }
      });

      // Convert to array and sort by created_at
      const calls = Array.from(callsMap.values())
        .sort((a, b) => getMillis(b.created_at) - getMillis(a.created_at))
        .slice(0, limit);

      console.log("Total unique calls after deduplication:", calls.length);

      // Get user details for each call participant
      const userIds = new Set<string>();
      calls.forEach((call) => {
        if (call.caller_user_id) userIds.add(call.caller_user_id);
        if (call.callee_user_id) userIds.add(call.callee_user_id);
      });

      console.log("Fetching details for", userIds.size, "users");

      const userDetailsMap = new Map();
      if (userIds.size > 0) {
        const userDocs = await Promise.all(
          Array.from(userIds).map((uid) =>
            db.collection("public_users").doc(uid).get()
          )
        );

        userDocs.forEach((doc) => {
          if (doc.exists) {
            userDetailsMap.set(doc.id, doc.data());
          }
        });
      }

      const phoneMap = new Map<string, string | null>();
      if (userIds.size > 0) {
        const authUsers = await Promise.all(
          Array.from(userIds).map((uid) =>
            admin.auth().getUser(uid)
              .then((user) => [uid, user.phoneNumber ?? null] as const)
              .catch(() => [uid, null] as const)
          )
        );
        authUsers.forEach(([uid, phone]) => phoneMap.set(uid, phone));
      }

      // Enrich calls with user details
      const enrichedCalls = calls.map((call) => {
        const otherUserId = call.caller_user_id === userId ?
          call.callee_user_id : call.caller_user_id;

        const callerId = call.caller_user_id;

        const highestScore =
          callerId ? call[`${callerId}_highest_detection_score`] : undefined;

        const highestTimestamp =
          callerId ? call[`${callerId}_highest_detection_timestamp`] : undefined;

        const highestIsDeepfake =
          callerId ? call[`${callerId}_highest_is_deepfake`] : undefined;

        return {
          ...call, // preserve any dynamic detection fields
          id: call.id,
          caller_user_id: call.caller_user_id,
          callee_user_id: call.callee_user_id,
          created_at: timestampToSeconds(call.created_at),
          ended_at: timestampToSeconds(call.ended_at),
          updated_at: timestampToSeconds(call.updated_at ?? call.ended_at),
          status: call.status,
          duration: call.duration,
          is_caller: call.caller_user_id === userId,
          other_user: {
            ...(userDetailsMap.get(otherUserId) || {
              userId: otherUserId,
              displayName: "Unknown User",
            }),
            phoneNumber: phoneMap.get(otherUserId) ?? null,
          },
          ...(callerId ? {
            [`${callerId}_highest_detection_score`]: highestScore,
            [`${callerId}_highest_detection_timestamp`]: highestTimestamp,
            [`${callerId}_highest_is_deepfake`]: highestIsDeepfake,
          } : {}),
        };
      });

      console.log("Returning", enrichedCalls.length, "enriched calls");

      return {
        calls: enrichedCalls,
        hasMore: enrichedCalls.length === limit,
      };
    } catch (error: unknown) {
      console.error("Error fetching call history:", error);
      console.error("Error details:", error instanceof Error ? error.message : error);
      console.error("Error stack:", error instanceof Error ? error.stack : "");
      throw new functions.https.HttpsError(
        "internal",
        `Failed to fetch call history: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
);

/**
 * Update call status and metadata when call ends
 * Can be called by either participant
 */
export const endCall = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const {callId, duration, status = "completed"} = data ?? {};

    if (!callId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Call ID required"
      );
    }

    try {
      const callRef = db.collection("calls").doc(callId);
      const callDoc = await callRef.get();

      if (!callDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Call not found");
      }

      const callData = callDoc.data();

      // Verify user is a participant
      if (
        callData?.caller_user_id !== context.auth.uid &&
        callData?.callee_user_id !== context.auth.uid
      ) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Not a call participant"
        );
      }

      // Update call with end metadata
      await callRef.update({
        ended_at: new Date(),
        status: status,
        duration: duration || 0,
      });

      return {success: true};
    } catch (error) {
      console.error("Error ending call:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError("internal", "Failed to end call");
    }
  }
);

/**
 * Flag caller in global_blocked when a call ends with deepfake detection
 */
export const flagCallerOnCallEnd = functions.firestore
  .document("calls/{callId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return null;

    const callerId = after.caller_user_id as string | undefined;
    const calleeId = after.callee_user_id as string | undefined;
    if (!callerId) return null;

    // Only act once call is ended
    if (after.status !== "ended") return null;

    const callerKey = `${callerId}_highest_is_deepfake`;
    const calleeKey = calleeId ? `${calleeId}_highest_is_deepfake` : null;

    const afterCallerDeepfake = Boolean(after[callerKey]);
    const afterCalleeDeepfake = calleeKey ? Boolean(after[calleeKey]) : false;
    const afterIsDeepfake = afterCallerDeepfake || afterCalleeDeepfake;

    const beforeCallerDeepfake = Boolean(before[callerKey]);
    const beforeCalleeDeepfake = calleeKey ? Boolean(before[calleeKey]) : false;
    const beforeIsDeepfake = beforeCallerDeepfake || beforeCalleeDeepfake;

    // Trigger when: status just ended OR deepfake just became true
    const statusJustEnded = before.status !== "ended" && after.status === "ended";
    const deepfakeJustBecameTrue = !beforeIsDeepfake && afterIsDeepfake;

    if (!afterIsDeepfake || (!statusJustEnded && !deepfakeJustBecameTrue)) {
      return null;
    }

    const blockedRef = db.collection("global_blocked").doc(callerId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(blockedRef);
      const existingLabel = (snap.get("label") as string | undefined) || "";
      if (existingLabel.toLowerCase() === "blacklisted") {
        return;
      }

      tx.set(
        blockedRef,
        {
          userId: callerId,
          label: "flag",
          flaggedAt: admin.firestore.FieldValue.serverTimestamp(),
          flaggedBy: "system",
          lastCallId: context.params.callId,
        },
        {merge: true}
      );
    });

    return null;
  });
