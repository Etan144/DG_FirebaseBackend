import * as functions from "firebase-functions/v1";
import {auth, db} from "./firebase";

/**
 * Check if a username is available
 */
export const checkUsernameAvailable = functions.https.onCall(
  async (data) => {
    const {username} = data ?? {};
    if (typeof username !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Username required");
    }

    const normalized = username.toLowerCase().trim();
    const snap = await db.collection("usernames").doc(normalized).get();

    return {available: !snap.exists};
  }
);

/**
 * Claim username AND create user records
 */
export const claimUsername = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const {username, displayName} = data ?? {};
    const uid = context.auth.uid;

    if (typeof username !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Username required");
    }

    const normalized = username.toLowerCase().trim();
    const usernameRef = db.collection("usernames").doc(normalized);
    const userRef = db.collection("users").doc(uid);
    const publicRef = db.collection("public_users").doc(uid);

    await db.runTransaction(async (tx) => {
      const nameSnap = await tx.get(usernameRef);
      if (nameSnap.exists) {
        throw new functions.https.HttpsError("already-exists", "Username taken");
      }

      tx.set(usernameRef, {uid});
      tx.set(userRef, {
        username: normalized,
        displayName: displayName || normalized,
        role: "REGISTERED",
        createdAtSeconds: Math.floor(Date.now() / 1000),
      });

      tx.set(publicRef, {
        username: normalized,
        displayName: displayName || normalized,
        createdAt: Date.now(),
      });
    });

    return {success: true};
  }
);

/**
 * Promote an existing user to admin.
 * Only callable by an admin or owner. Admins cannot self-promote.
 */
export const addAdminUser = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const callerRole = context.auth.token.role;
    if (callerRole !== "admin" && callerRole !== "owner") {
      throw new functions.https.HttpsError("permission-denied", "Admin access required");
    }

    const {uid, displayName} = data ?? {};
    if (typeof uid !== "string" || uid.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "User ID is required");
    }

    if (callerRole === "admin" && uid === context.auth.uid) {
      throw new functions.https.HttpsError(
          "permission-denied",
          "Admins cannot grant themselves admin access"
      );
    }

    const targetUid = uid.trim();

    try {
      await auth.getUser(targetUid); // Ensure user exists

      await auth.setCustomUserClaims(targetUid, {role: "admin"});

      await db.collection("users").doc(targetUid).set({
        role: "admin",
        ...(typeof displayName === "string" && displayName.trim().length > 0
          ? {displayName: displayName.trim()}
          : {}),
      }, {merge: true});

      return {success: true};
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError("internal", "Failed to add admin user");
    }
  }
);

