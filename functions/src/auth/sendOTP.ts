import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendOTPSMS, logSMSActivity } from "../notifications/sms";
import { sendOTPEmail, logEmailActivity } from "../notifications/email";
import { generateOTP } from "../utils/encryption";
import { checkRateLimit } from "../utils/rateLimiter";
import { validatePhoneNumber, validateEmail } from "../utils/validation";

interface SendOTPRequest {
  userId: string;
  email?: string;
  phoneNumber?: string;
  userName?: string;
  operationType: "login" | "transfer" | "withdrawal" | "signup";
  deliveryMethod: "sms" | "email" | "both";
}

/**
 * Cloud Function: Send OTP via SMS and/or Email
 * This replaces the client-side OTP generation with secure server-side delivery
 */
export const sendOTP = functions.https.onCall(async (data: SendOTPRequest, context) => {
  // Verify user is authenticated (except for signup)
  if (data.operationType !== "signup" && !context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to request OTP",
    );
  }

  const { userId, email, phoneNumber, userName, operationType, deliveryMethod } = data;

  try {
    // Validate inputs
    if (!userId) {
      throw new functions.https.HttpsError("invalid-argument", "User ID is required");
    }

    if (deliveryMethod === "email" || deliveryMethod === "both") {
      if (!email || !validateEmail(email)) {
        throw new functions.https.HttpsError("invalid-argument", "Valid email is required");
      }
    }

    if (deliveryMethod === "sms" || deliveryMethod === "both") {
      if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
        throw new functions.https.HttpsError("invalid-argument", "Valid phone number is required");
      }
    }

    // Rate limiting check - max 5 OTP requests per hour
    const rateLimit = await checkRateLimit(userId, `otp_${operationType}`, 5, 3600);

    if (!rateLimit.allowed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        `Too many OTP requests. Please try again at ${rateLimit.resetAt.toLocaleTimeString()}`,
      );
    }

    // Generate secure 6-digit OTP
    const otp = generateOTP(6);

    // Calculate expiry time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store OTP in Firestore
    const otpData = {
      userId,
      otp,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
      used: false,
      type: operationType,
      email: email || null,
      phoneNumber: phoneNumber || null,
      failedAttempts: 0,
      deliveryMethod,
    };

    const otpRef = await admin.firestore().collection("otps").add(otpData);

    console.log(`OTP generated for user ${userId}, operation: ${operationType}, ID: ${otpRef.id}`);

    // Send OTP via requested delivery methods
    const results: any = {
      success: false,
      otpId: otpRef.id,
      deliveryStatus: {},
    };

    const displayName = userName || "User";

    // Send via SMS
    if (deliveryMethod === "sms" || deliveryMethod === "both") {
      const smsResult = await sendOTPSMS(phoneNumber!, otp, displayName);

      results.deliveryStatus.sms = smsResult.success;

      await logSMSActivity(
        userId,
        phoneNumber!,
        `otp_${operationType}`,
        smsResult.success ? "sent" : "failed",
        smsResult.messageId,
        smsResult.error,
      );

      if (smsResult.success) {
        results.success = true;
      }
    }

    // Send via Email
    if (deliveryMethod === "email" || deliveryMethod === "both") {
      const emailResult = await sendOTPEmail(email!, otp, displayName);

      results.deliveryStatus.email = emailResult.success;

      await logEmailActivity(
        userId,
        email!,
        `otp_${operationType}`,
        emailResult.success ? "sent" : "failed",
        emailResult.error,
      );

      if (emailResult.success) {
        results.success = true;
      }
    }

    // Update OTP document with delivery status
    await otpRef.update({
      deliveryStatus: results.deliveryStatus,
      deliveredAt: results.success ? admin.firestore.FieldValue.serverTimestamp() : null,
    });

    if (!results.success) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to deliver OTP via any method. Please try again later.",
      );
    }

    return {
      success: true,
      message: "OTP sent successfully",
      otpId: otpRef.id,
      expiresAt: expiresAt.toISOString(),
      attemptsLeft: rateLimit.attemptsLeft,
      deliveryStatus: results.deliveryStatus,
    };
  } catch (error: any) {
    console.error("Error in sendOTP function:", error);

    // If it's already a functions error, rethrow it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Otherwise wrap in internal error
    throw new functions.https.HttpsError("internal", error.message || "Failed to send OTP");
  }
});

/**
 * Cloud Function: Resend OTP
 */
export const resendOTP = functions.https.onCall(async (data: SendOTPRequest, context) => {
  // This is essentially the same as sendOTP, but we track it separately
  return sendOTP.run(data, context);
});
