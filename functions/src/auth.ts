import * as functions from "firebase-functions/v1";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

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

