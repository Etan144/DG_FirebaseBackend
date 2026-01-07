import * as functions from "firebase-functions/v1";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

/**
 * Check if a username is available (NO reservation)
 */
export const checkUsernameAvailable = functions.https.onCall(
  async (data) => {
    const {username} = data ?? {};

    if (typeof username !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Username is required"
      );
    }

    const normalized = username.toLowerCase().trim();

    if (normalized.length < 3) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Username must be at least 3 characters long"
      );
    }

    const ref = db.collection("usernames").doc(normalized);
    const snap = await ref.get();

    return {
      available: !snap.exists,
    };
  }
);

/**
 * Claim username AFTER email verification
 */
export const claimUsername = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Login required"
      );
    }

    const {username} = data ?? {};
    const uid = context.auth.uid;

    if (typeof username !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Username is required"
      );
    }

    const normalized = username.toLowerCase().trim();
    const usernameRef = db.collection("usernames").doc(normalized);
    const userRef = db.collection("users").doc(uid);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(usernameRef);

      if (snap.exists) {
        throw new functions.https.HttpsError(
          "already-exists",
          "Username already taken"
        );
      }

      tx.set(usernameRef, {uid});
      tx.set(userRef, {
        username: normalized,
        role: "REGISTERED",
        planTier: "FREE",
        createdAtSeconds: Math.floor(Date.now() / 1000),
      }, {merge: true});
    });

    return {
      success: true,
      username: normalized,
    };
  }
);
