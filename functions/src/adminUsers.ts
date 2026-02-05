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
  targetId: string,
  metadata: Record<string, unknown> = {}
) {
  if (!context.auth) return;

  await admin.firestore().collection("audit_logs").add({
    actorUid: context.auth.uid,
    actorEmail: context.auth.token.email || null,
    action,
    targetType,
    targetId,
    metadata,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/* =========================
   LIST USERS
========================= */
export const listUsers = functions.https.onCall(async (_data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can list users.");
  }

  const users = await admin.auth().listUsers(50);

  return users.users.map(u => ({
    uid: u.uid,
    email: u.email,
    disabled: u.disabled,
    displayName: u.displayName || "",
    photoURL: u.photoURL || "",
    creationTime: u.metadata.creationTime,
    lastSignInTime: u.metadata.lastSignInTime,
  }));
});

/* =========================
   ENABLE / DISABLE USER
========================= */
export const setUserDisabled = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can disable users.");
  }

  const { uid, disabled } = data as { uid: string; disabled: boolean };

  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "Missing uid");
  }

  await admin.auth().updateUser(uid, { disabled });

  await writeAudit(
    context,
    disabled ? "DISABLE_USER" : "ENABLE_USER",
    "USER",
    uid,
    { disabled }
  );

  return { success: true };
});

/* =========================
   DELETE USER
========================= */
export const deleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can delete users.");
  }

  const { uid } = data as { uid: string };

  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "Missing uid");
  }

  await admin.auth().deleteUser(uid);

  await writeAudit(
    context,
    "DELETE_USER",
    "USER",
    uid
  );

  return { success: true };
});
