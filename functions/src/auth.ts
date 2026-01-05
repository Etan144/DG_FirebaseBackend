import * as functions from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

const auth = getAuth();
const db = getFirestore();

/**
 * Cloud Function: registerUser
 * - Enforces username uniqueness
 * - Creates Firebase Auth user
 * - Creates Firestore user profile
 * - Safe against race conditions
 */
export const registerUser = functions.https.onCall(
  async (data, context) => {
    const { email, password, username, displayName } = data;

    // -----------------------------
    // 1️⃣ Validate input
    // -----------------------------
    if (!email || !password || !username) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email, password, and username are required"
      );
    }

    const normalizedUsername = username.toLowerCase().trim();
    const usernameRef = db.collection("usernames").doc(normalizedUsername);

    // -----------------------------
    // 2️⃣ Reserve username (Firestore-only transaction)
    // -----------------------------
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(usernameRef);
      if (snap.exists) {
        throw new functions.https.HttpsError(
          "already-exists",
          "Username already taken"
        );
      }

      // Temporary reservation
      tx.set(usernameRef, { reserved: true });
    });

    // -----------------------------
    // 3️⃣ Create Firebase Auth user
    // -----------------------------
    let user;
    try {
      user = await auth.createUser({
        email,
        password,
        displayName: displayName || normalizedUsername,
      });
    } catch (error) {
      // Roll back username reservation if Auth creation fails
      await usernameRef.delete();
      throw error;
    }

    // -----------------------------
    // 4️⃣ Finalize Firestore records
    // -----------------------------
    await db.runTransaction(async (tx) => {
      // Bind username → uid
      tx.set(usernameRef, { uid: user.uid });

      // Create user profile
      tx.set(db.collection("users").doc(user.uid), {
        email,
        username: normalizedUsername,
        displayName: displayName || normalizedUsername,
        role: "REGISTERED",        // REGISTERED | ADMIN
        planTier: "FREE",          // FREE | PREMIUM
        verified: false,
        createdAtSeconds: Math.floor(Date.now() / 1000),
      });
    });

    return {
      uid: user.uid,
      message: "User registered successfully",
    };
  }
);
