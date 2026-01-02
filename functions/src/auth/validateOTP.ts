import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { timingSafeEqual } from "../utils/encryption";
import { validateOTP as validateOTPFormat } from "../utils/validation";
import { resetRateLimit } from "../utils/rateLimiter";

interface ValidateOTPRequest {
  userId: string;
  otp: string;
  operationType: "login" | "transfer" | "withdrawal" | "signup";
  otpId?: string; // Optional: specific OTP ID to validate
}

/**
 * Cloud Function: Validate OTP
 * Securely verifies OTP codes with timing-attack protection
 */
export const validateOTP = functions.https.onCall(async (data: ValidateOTPRequest, context) => {
  const { userId, otp, operationType, otpId } = data;

  try {
    // Validate inputs
    if (!userId) {
      throw new functions.https.HttpsError("invalid-argument", "User ID is required");
    }

    if (!otp || !validateOTPFormat(otp)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid OTP format. Must be 6 digits");
    }

    if (!operationType) {
      throw new functions.https.HttpsError("invalid-argument", "Operation type is required");
    }

    // Find the OTP record
    let otpQuery = admin.firestore()
      .collection("otps")
      .where("userId", "==", userId)
      .where("type", "==", operationType)
      .where("used", "==", false)
      .orderBy("timestamp", "desc")
      .limit(1);

    // If specific OTP ID provided, use it
    if (otpId) {
      const otpDoc = await admin.firestore().collection("otps").doc(otpId).get();

      if (!otpDoc.exists) {
        throw new functions.https.HttpsError("not-found", "OTP not found");
      }

      const otpData = otpDoc.data()!;

      // Verify it belongs to the user and operation
      if (otpData.userId !== userId || otpData.type !== operationType) {
        throw new functions.https.HttpsError("permission-denied", "Invalid OTP");
      }

      // Check if already used
      if (otpData.used) {
        throw new functions.https.HttpsError("failed-precondition", "OTP already used");
      }

      // Check expiration
      const expiryTime = otpData.expiresAt.toDate();
      if (new Date() > expiryTime) {
        throw new functions.https.HttpsError("deadline-exceeded", "OTP has expired. Please request a new one.");
      }

      // Check failed attempts (max 3)
      if (otpData.failedAttempts >= 3) {
        // Mark as used to prevent further attempts
        await otpDoc.ref.update({ used: true, lockedAt: admin.firestore.FieldValue.serverTimestamp() });
        throw new functions.https.HttpsError(
          "permission-denied",
          "Too many failed attempts. Please request a new OTP.",
        );
      }

      // Validate OTP using timing-safe comparison
      const isValid = timingSafeEqual(otp, otpData.otp);

      if (!isValid) {
        // Increment failed attempts
        await otpDoc.ref.update({
          failedAttempts: admin.firestore.FieldValue.increment(1),
        });

        const attemptsLeft = 3 - (otpData.failedAttempts + 1);

        throw new functions.https.HttpsError(
          "invalid-argument",
          `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`,
        );
      }

      // OTP is valid - mark as used
      await otpDoc.ref.update({
        used: true,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        enteredOTP: otp,
      });

      // Reset rate limit for this operation
      await resetRateLimit(userId, `otp_${operationType}`);

      console.log(`OTP verified successfully for user ${userId}, operation: ${operationType}`);

      return {
        success: true,
        verified: true,
        message: "OTP verified successfully",
        otpId: otpDoc.id,
      };
    } else {
      // Query-based validation (legacy support)
      const querySnapshot = await otpQuery.get();

      if (querySnapshot.empty) {
        throw new functions.https.HttpsError("not-found", "No valid OTP found. Please request a new one.");
      }

      const otpDoc = querySnapshot.docs[0];
      const otpData = otpDoc.data();

      // Check expiration
      const expiryTime = otpData.expiresAt.toDate();
      if (new Date() > expiryTime) {
        throw new functions.https.HttpsError("deadline-exceeded", "OTP has expired. Please request a new one.");
      }

      // Check failed attempts
      if (otpData.failedAttempts >= 3) {
        await otpDoc.ref.update({ used: true, lockedAt: admin.firestore.FieldValue.serverTimestamp() });
        throw new functions.https.HttpsError(
          "permission-denied",
          "Too many failed attempts. Please request a new OTP.",
        );
      }

      // Validate OTP
      const isValid = timingSafeEqual(otp, otpData.otp);

      if (!isValid) {
        await otpDoc.ref.update({
          failedAttempts: admin.firestore.FieldValue.increment(1),
        });

        const attemptsLeft = 3 - (otpData.failedAttempts + 1);

        throw new functions.https.HttpsError(
          "invalid-argument",
          `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`,
        );
      }

      // Mark as used
      await otpDoc.ref.update({
        used: true,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        enteredOTP: otp,
      });

      // Reset rate limit
      await resetRateLimit(userId, `otp_${operationType}`);

      console.log(`OTP verified successfully for user ${userId}, operation: ${operationType}`);

      return {
        success: true,
        verified: true,
        message: "OTP verified successfully",
        otpId: otpDoc.id,
      };
    }
  } catch (error: any) {
    console.error("Error in validateOTP function:", error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError("internal", error.message || "Failed to validate OTP");
  }
});

/**
 * Cloud Function: Check if user has pending OTP
 */
export const checkPendingOTP = functions.https.onCall(async (data: {
  userId: string;
  operationType: string;
}, context) => {
  const { userId, operationType } = data;

  if (!context.auth || context.auth.uid !== userId) {
    throw new functions.https.HttpsError("permission-denied", "Unauthorized");
  }

  const otpSnapshot = await admin.firestore()
    .collection("otps")
    .where("userId", "==", userId)
    .where("type", "==", operationType)
    .where("used", "==", false)
    .orderBy("timestamp", "desc")
    .limit(1)
    .get();

  if (otpSnapshot.empty) {
    return {
      hasPending: false,
    };
  }

  const otpData = otpSnapshot.docs[0].data();
  const expiryTime = otpData.expiresAt.toDate();
  const isExpired = new Date() > expiryTime;

  return {
    hasPending: !isExpired,
    otpId: otpSnapshot.docs[0].id,
    expiresAt: expiryTime.toISOString(),
    deliveryMethod: otpData.deliveryMethod,
  };
});
