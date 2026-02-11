import * as functions from "firebase-functions/v1";
import {db} from "./firebase";

/**
 * Get audit logs (admin only)
 */
export const getAuditLogs = functions.https.onCall(
  async (data, context) => {
    if (!context.auth || context.auth.token.admin !== true) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin only",
      );
    }

    const limit = Math.min(data.limit ?? 50, 200);

    let query = db
      .collection("audit_logs")
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (data.action) {
      query = query.where("action", "==", data.action);
    }

    const snap = await query.get();

    return snap.docs.map((d) => ({
      id: d.id,
      action: d.get("action"),
      actor: d.get("actorEmail") ?? d.get("actorUid"),
      target: `${d.get("targetType")}: ${d.get("targetId")}`,
      timestamp: (d.get("createdAt") && typeof d.get("createdAt").toMillis === "function") ? d.get("createdAt").toMillis() : d.get("createdAt") || null,
      details: d.get("metadata") ?? {},
    }));
  }
);
