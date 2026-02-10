import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

/**
 * Writes an admin audit log entry to Firestore.
 * @param {functions.https.CallableContext} context Callable function context
 * @param {string} action Admin action name
 * @param {string} targetType Target entity type
 * @param {string} targetId Target entity ID
 * @return {Promise<void>}
 */
async function writeAudit(
  context: functions.https.CallableContext,
  action: string,
  targetType: string,
  targetId: string
): Promise<void> {
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

/**
 * Admin-only function to delete a review document.
 */
export const deleteReviewAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can delete reviews."
    );
  }

  const {reviewId} = data as {reviewId: string};

  if (!reviewId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing reviewId"
    );
  }

  // Logging for debugging
  const doc = await admin.firestore().collection("reviews").doc(reviewId).get();
  console.log(
    "deleteReviewAdmin called. reviewId:", reviewId,
    "doc.exists:", doc.exists,
    "actorUid:", context.auth?.uid,
    "admin:", context.auth?.token?.admin
  );

  if (!doc.exists) {
    throw new functions.https.HttpsError("not-found", "Review not found");
  }

  await admin.firestore()
    .collection("reviews")
    .doc(reviewId)
    .delete();

  await writeAudit(
    context,
    "DELETE_REVIEW",
    "REVIEW",
    reviewId
  );

  return {success: true};
});
