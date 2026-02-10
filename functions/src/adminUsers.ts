import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

/**
 * Writes an admin audit log entry to Firestore.
 * @param {functions.https.CallableContext} context Callable function context
 * @param {string} action Admin action name
 * @param {string} targetType Target entity type
 * @param {string} targetId Target entity ID
 * @param {Record<string, unknown>} metadata Additional structured metadata
 * @return {Promise<void>}
 */
async function writeAudit(
  context: functions.https.CallableContext,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
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

/**
 * Admin-only function to list Firebase Auth users.
 */
export const listUsers = functions.https.onCall(async (_data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can list users."
    );
  }

  const result = await admin.auth().listUsers(50);

  const userList = result.users.map((user) => ({
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    phoneNumber: user.phoneNumber || "",
    providerData: user.providerData || [],
    emailVerified: user.emailVerified,
    disabled: user.disabled ?? false, // Always include this
    creationTime: user.metadata.creationTime,
    lastSignInTime: user.metadata.lastSignInTime,
    customClaims: user.customClaims || {},
    multiFactor: user.multiFactor || {},
    tenantId: user.tenantId || null,
    tokensValidAfterTime: user.tokensValidAfterTime || null,
  }));
  return userList;
});

/**
 * Admin-only function to enable or disable a user account.
 */
export const setUserDisabled = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can disable users."
    );
  }

  const {uid, disabled} = data as {uid: string; disabled: boolean};

  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing uid"
    );
  }

  await admin.auth().updateUser(uid, {disabled});

  await writeAudit(
    context,
    disabled ? "DISABLE_USER" : "ENABLE_USER",
    "USER",
    uid,
    {disabled}
  );

  return {success: true};
});

/**
 * Admin-only function to permanently delete a user account.
 */
export const deleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can delete users."
    );
  }

  const {uid} = data as {uid: string};

  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing uid"
    );
  }

  await admin.auth().deleteUser(uid);

  await writeAudit(
    context,
    "DELETE_USER",
    "USER",
    uid
  );

  return {success: true};
});
