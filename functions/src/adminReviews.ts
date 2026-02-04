// Cloud Function for deleting a review by ID (Firestore)

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
if (!admin.apps.length) admin.initializeApp();


export const deleteReview = functions.https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can delete reviews.");
  }
  const {reviewId} = data as {reviewId: string};
  if (!reviewId) throw new functions.https.HttpsError("invalid-argument", "Missing reviewId");
  await admin.firestore().collection("reviews").doc(reviewId).delete();
  return {success: true};
});
