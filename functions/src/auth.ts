import * as functions from "firebase-functions/v1";
import {auth, db} from "./firebase";

/**
 * Validate Singapore phone number format
 * Expected format: +65 followed by 8 digits starting with 6, 8, or 9
 * @param {string} phoneNumber - The phone number to validate
 * @return {boolean} True if valid Singapore phone number
 */
function isValidSingaporePhoneNumber(phoneNumber: string): boolean {
  // Singapore phone numbers: +65 followed by 8 digits starting with 6, 8, or 9
  const singaporePhoneRegex = /^\+65[689]\d{7}$/;
  return singaporePhoneRegex.test(phoneNumber.replace(/\s/g, ""));
}

/**
 * Generate a 6-digit verification code
 * @return {string} A 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * One-time function to add admin username to usernames collection
 * Call this once to fix the manually created admin
 */
export const fixAdminUsername = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const {username} = data ?? {};
    if (typeof username !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Username required");
    }

    const normalized = username.toLowerCase().trim();

    // Find user with this username in users collection
    const usersQuery = await db.collection("users")
      .where("username", "==", normalized)
      .limit(1)
      .get();

    if (usersQuery.empty) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    const userDoc = usersQuery.docs[0];
    const uid = userDoc.id;

    // Add to usernames collection
    await db.collection("usernames").doc(normalized).set({uid});

    return {
      success: true,
      message: `Added ${normalized} to usernames collection`,
      uid,
    };
  }
);

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

    // Check usernames collection (regular users)
    const usernameSnap = await db.collection("usernames").doc(normalized).get();
    if (usernameSnap.exists) {
      return {available: false};
    }

    // Also check users collection (for manually created admins)
    const usersQuery = await db.collection("users")
      .where("username", "==", normalized)
      .limit(1)
      .get();

    return {available: usersQuery.empty};
  }
);

/**
 * Claim username AND create user records
 * Admins can optionally specify a uid to create profiles for other users
 */
export const claimUsername = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const {username, displayName, uid: targetUid} = data ?? {};

    // Determine which UID to use
    let uid = context.auth.uid;

    // If targetUid is provided, verify caller is admin/owner
    if (typeof targetUid === "string" && targetUid.trim().length > 0) {
      const callerRole = context.auth.token.role;
      if (callerRole !== "admin" && callerRole !== "owner") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only admins can create profiles for other users"
        );
      }

      // Verify target user exists in Firebase Auth
      try {
        await auth.getUser(targetUid.trim());
        uid = targetUid.trim();
      } catch (error) {
        throw new functions.https.HttpsError("not-found", "Target user not found");
      }
    }

    if (typeof username !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Username required");
    }

    const normalized = username.toLowerCase().trim();
    const usernameRef = db.collection("usernames").doc(normalized);
    const userRef = db.collection("users").doc(uid);
    const publicRef = db.collection("public_users").doc(uid);

    // Check if this is being called by admin for another user
    const isAdminCreatingForOther = uid !== context.auth.uid;

    await db.runTransaction(async (tx) => {
      const nameSnap = await tx.get(usernameRef);
      if (nameSnap.exists) {
        throw new functions.https.HttpsError("already-exists", "Username taken");
      }

      tx.set(usernameRef, {uid});

      // If admin is creating for another user, don't set role yet (addAdminUser will set it)
      // Otherwise, set role to REGISTERED for normal user registration
      const userPayload: Record<string, string | number> = {
        username: normalized,
        displayName: displayName || normalized,
        createdAtSeconds: Math.floor(Date.now() / 1000),
      };

      if (!isAdminCreatingForOther) {
        userPayload.role = "REGISTERED";
      }

      tx.set(userRef, userPayload);

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

      // Only update role and admin-specific fields, preserve existing user data
      const payload: Record<string, unknown> = {
        role: "admin",
        needsVerificationOnFirstLogin: true,
        adminVerificationSent: false,
      };

      // Only set displayName if provided AND user doesn't already have one
      if (typeof displayName === "string" && displayName.trim().length > 0) {
        const userDoc = await db.collection("users").doc(targetUid).get();
        if (!userDoc.exists || !userDoc.data()?.displayName) {
          payload.displayName = displayName.trim();
        }
      }

      // Log for debugging
      functions.logger.info(`Setting admin role for UID: ${targetUid}`, payload);

      await db.collection("users").doc(targetUid).set(payload, {merge: true});

      // Also update public_users if it exists (preserve existing data)
      const publicUserRef = db.collection("public_users").doc(targetUid);
      const publicUserDoc = await publicUserRef.get();
      if (publicUserDoc.exists) {
        await publicUserRef.set({role: "admin"}, {merge: true});
      }

      return {success: true};
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError("internal", "Failed to add admin user");
    }
  }
);

/**
 * Generate an email verification link for a user by email.
 * Only callable by an admin or owner. Useful for accounts created by admins.
 */
export const generateAdminVerificationLink = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const callerRole = context.auth.token.role;
    if (callerRole !== "admin" && callerRole !== "owner") {
      throw new functions.https.HttpsError("permission-denied", "Admin access required");
    }

    const {email} = data ?? {};
    if (typeof email !== "string" || email.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "Email is required");
    }

    const normalizedEmail = email.trim();

    try {
      await auth.getUserByEmail(normalizedEmail); // ensure user exists
      const link = await auth.generateEmailVerificationLink(normalizedEmail);
      return {success: true, link};
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate verification link"
      );
    }
  }
);

/**
 * Check if verification email should be sent on first login (admin accounts only).
 * Returns shouldSend flag for client to send via Firebase Auth SDK.
 * Regular users get verification emails immediately after registration.
 */
export const checkSendVerificationOnFirstLogin = functions.https.onCall(
  async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const uid = context.auth.uid;

    try {
      const userRecord = await auth.getUser(uid);
      if (userRecord.emailVerified) {
        return {shouldSend: false, message: ""};
      }

      // Check database for role and verification status
      // (can't rely on token.role on first login before token refresh)
      const userRef = db.collection("users").doc(uid);
      let needsSend = false;

      await db.runTransaction(async (tx) => {
        const doc = await tx.get(userRef);
        if (!doc.exists) {
          return;
        }

        const data = doc.data();
        const userRole = data?.role as string | undefined;
        const needsVerification = data?.needsVerificationOnFirstLogin as boolean | undefined;
        const verificationSent = data?.adminVerificationSent as boolean | undefined;

        // Only send for admin/owner accounts that need verification and haven't been sent yet
        const isAdminOrOwner = userRole === "admin" || userRole === "owner";
        if (isAdminOrOwner && needsVerification && !verificationSent) {
          needsSend = true;
          tx.set(userRef, {
            adminVerificationSent: true,
            needsVerificationOnFirstLogin: false,
          }, {merge: true});
        }
      });

      if (needsSend) {
        return {
          shouldSend: true,
          message: "Verification link sent. Please verify your email before logging in.",
        };
      }

      return {shouldSend: false, message: ""};
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Failed to check verification status"
      );
    }
  }
);

/**
 * Send phone verification code to a Singapore phone number.
 * Stores the code in Firestore with expiration time (5 minutes).
 */
export const sendPhoneVerificationCode = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const {phoneNumber} = data ?? {};
    if (typeof phoneNumber !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Phone number required");
    }

    const normalizedPhone = phoneNumber.replace(/\s/g, "");

    // Validate Singapore phone number
    if (!isValidSingaporePhoneNumber(normalizedPhone)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid Singapore phone number. Must be +65 followed by 8 digits starting with 6, 8, or 9"
      );
    }

    const uid = context.auth.uid;
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    try {
      // Store verification code in Firestore
      await db.collection("phone_verifications").doc(uid).set({
        phoneNumber: normalizedPhone,
        code,
        expiresAt,
        createdAt: Date.now(),
        verified: false,
        attempts: 0,
      });

      // In production, you would integrate with an SMS provider like Twilio here
      // For now, log the code for testing purposes
      functions.logger.info(`Verification code for ${normalizedPhone}: ${code}`);

      return {
        success: true,
        message: "Verification code sent",
      };
    } catch (error) {
      functions.logger.error("Failed to send verification code:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send verification code"
      );
    }
  }
);

/**
 * Verify phone number with the provided code.
 */
export const verifyPhoneCode = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const {code} = data ?? {};
    if (typeof code !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Verification code required");
    }

    const uid = context.auth.uid;
    const verificationRef = db.collection("phone_verifications").doc(uid);

    try {
      const result = await db.runTransaction(async (tx) => {
        const doc = await tx.get(verificationRef);
        if (!doc.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            "No verification code found. Please request a new code."
          );
        }

        const data = doc.data();
        if (!data) {
          throw new functions.https.HttpsError(
            "not-found",
            "No verification data found. Please request a new code."
          );
        }

        const {
          code: storedCode,
          expiresAt,
          verified,
          attempts,
          phoneNumber,
        } = data as {
          code: string;
          expiresAt: number;
          verified: boolean;
          attempts: number;
          phoneNumber: string;
        };

        // Check if already verified
        if (verified) {
          throw new functions.https.HttpsError(
            "already-exists",
            "Phone number already verified"
          );
        }

        // Check expiration
        if (Date.now() > expiresAt) {
          throw new functions.https.HttpsError(
            "deadline-exceeded",
            "Verification code expired. Please request a new code."
          );
        }

        // Check attempts (max 3)
        if (attempts >= 3) {
          throw new functions.https.HttpsError(
            "resource-exhausted",
            "Too many failed attempts. Please request a new code."
          );
        }

        // Verify code
        if (code !== storedCode) {
          tx.update(verificationRef, {attempts: attempts + 1});
          throw new functions.https.HttpsError(
            "invalid-argument",
            "Invalid verification code"
          );
        }

        // Mark as verified
        tx.update(verificationRef, {
          verified: true,
          verifiedAt: Date.now(),
        });

        // Update user record with verified phone
        const userRef = db.collection("users").doc(uid);
        tx.set(
          userRef,
          {
            phoneNumber,
            phoneVerified: true,
            phoneVerifiedAt: Date.now(),
          },
          {merge: true}
        );

        return {phoneNumber};
      });

      return {
        success: true,
        message: "Phone number verified successfully",
        phoneNumber: result.phoneNumber,
      };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      functions.logger.error("Failed to verify phone code:", error);
      throw new functions.https.HttpsError("internal", "Failed to verify phone number");
    }
  }
);

/**
 * Check if user's phone number is verified.
 */
export const checkPhoneVerificationStatus = functions.https.onCall(
  async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const uid = context.auth.uid;

    try {
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        return {
          phoneVerified: false,
          phoneNumber: null,
        };
      }

      const data = userDoc.data();
      return {
        phoneVerified: data?.phoneVerified === true,
        phoneNumber: data?.phoneNumber || null,
      };
    } catch (error) {
      functions.logger.error("Failed to check phone verification status:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to check phone verification status"
      );
    }
  }
);

