import * as functions from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const auth = getAuth();
const db = getFirestore();

export const registerUser = functions.https.onCall(
  async (data, context) => {
    const { email, password, username, displayName } = data;

    if (!email || !password || !username) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing fields"
      );
    }

    const normalizedUsername = username.toLowerCase();

    const usernameRef = db.collection("usernames").doc(normalizedUsername);

    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(usernameRef);
      if (snap.exists) {
        throw new functions.https.HttpsError(
          "already-exists",
          "Username already taken"
        );
      }

      // Create Auth user
      const user = await auth.createUser({
        email,
        password,
        displayName,
      });

      // Reserve username
      tx.set(usernameRef, { uid: user.uid });

      // Create user profile
      tx.set(db.collection("users").doc(user.uid), {
        email,
        username: normalizedUsername,
        displayName,
        role: "REGISTERED",
        planTier: "FREE",
        verified: false,
        createdAtSeconds: Math.floor(Date.now() / 1000),
      });

      return { uid: user.uid };
    });
  }
);

