import * as functions from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

export const createUserProfile = functions.auth.user().onCreate(
  async (user) => {
    await db.collection("users").doc(user.uid).set({
      email: user.email,
      username: user.email?.split("@")[0],
      displayName: user.displayName ?? user.email,
      role: "RegisteredUser",                       // RegisteredUser or Admin
      planTier: "free",                             // free | premium
      verified: user.emailVerified ?? false,
      createdAt: new Date(),
    });
  }
);
