import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

/* =========================
   AUDIT LOG WRITER
========================= */
async function writeAudit(
  context: functions.https.CallableContext,
  action: string,
  targetType: string,
  targetId: string
) {
  if (!context.auth) return;

  await admin.firestore().collection("audit_logs").add({
    actorUid: context.auth.uid,
    actorEmail: context.auth.token.email || null,
    action,
    targetType,
    targetId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/* =========================
   ADMIN DELETE REVIEW
========================= */
export const deleteReview = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can delete reviews.");
  }

  const { reviewId } = data as { reviewId: string };

  if (!reviewId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing reviewId");
  }

  await admin.firestore().collection("reviews").doc(reviewId).delete();

  await writeAudit(
    context,
    "DELETE_REVIEW",
    "REVIEW",
    reviewId
  );

  return { success: true };
});
