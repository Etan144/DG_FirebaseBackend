// Firebase Admin SDK Cloud Function endpoints for user management
// (You must deploy these to your Firebase project backend)
// Example: getUsers, disableUser, deleteUser


import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

// List users (paginated)

export const listUsers = functions.https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can list users.");
  }
  const maxResults = 50;
  const users = await admin.auth().listUsers(maxResults);
  return users.users.map((u: admin.auth.UserRecord) => ({
    uid: u.uid,
    email: u.email,
    disabled: u.disabled,
    displayName: u.displayName || "",
    photoURL: u.photoURL || "",
  }));
});

// Disable/Enable user

export const setUserDisabled = functions.https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can disable users.");
  }
  const d = data as {uid: string; disabled: boolean};
  await admin.auth().updateUser(d.uid, {disabled: d.disabled});
  return {success: true};
});

// Delete user

export const deleteUser = functions.https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can delete users.");
  }
  const d = data as {uid: string};
  await admin.auth().deleteUser(d.uid);
  return {success: true};
});
