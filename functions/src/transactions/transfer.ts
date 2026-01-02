import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { validateTransferAmount, validateUserId, sanitizeInput } from "../utils/validation";
import { generateReference } from "../utils/encryption";
import { checkRateLimit } from "../utils/rateLimiter";

interface TransferRequest {
  senderId: string;
  recipientId: string;
  recipientAccountNumber?: string;
  amount: number;
  description?: string;
  otpId: string; // OTP must be verified before transfer
}

/**
 * Cloud Function: Process Money Transfer
 * Securely transfers money between accounts with OTP verification
 */
export const processTransfer = functions.https.onCall(async (data: TransferRequest, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { senderId, recipientId, amount, description, otpId } = data;

  try {
    // Validate sender is the authenticated user
    if (context.auth.uid !== senderId) {
      throw new functions.https.HttpsError("permission-denied", "Cannot transfer from another user's account");
    }

    // Validate inputs
    if (!validateUserId(senderId) || !validateUserId(recipientId)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid user ID");
    }

    if (!validateTransferAmount(amount)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid transfer amount. Must be between PHP 1 and PHP 50,000",
      );
    }

    if (!otpId) {
      throw new functions.https.HttpsError("invalid-argument", "OTP verification required");
    }

    // Verify OTP was validated
    const otpDoc = await admin.firestore().collection("otps").doc(otpId).get();

    if (!otpDoc.exists) {
      throw new functions.https.HttpsError("not-found", "OTP not found");
    }

    const otpData = otpDoc.data()!;

    if (!otpData.used || !otpData.verifiedAt) {
      throw new functions.https.HttpsError("failed-precondition", "OTP must be verified first");
    }

    if (otpData.userId !== senderId || otpData.type !== "transfer") {
      throw new functions.https.HttpsError("permission-denied", "Invalid OTP for this operation");
    }

    // Check if OTP was verified recently (within last 5 minutes)
    const otpVerifiedAt = otpData.verifiedAt.toDate();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (otpVerifiedAt < fiveMinutesAgo) {
      throw new functions.https.HttpsError("deadline-exceeded", "OTP verification expired. Please verify again.");
    }

    // Rate limiting - max 10 transfers per hour
    const rateLimit = await checkRateLimit(senderId, "transfer", 10, 3600);

    if (!rateLimit.allowed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        `Transfer limit reached. Try again at ${rateLimit.resetAt.toLocaleTimeString()}`,
      );
    }

    // Sanitize description
    const sanitizedDescription = description ? sanitizeInput(description) : "Money Transfer";

    // Generate unique reference number
    const reference = generateReference("TRF");

    // Perform atomic transaction
    const result = await admin.firestore().runTransaction(async (transaction) => {
      const senderRef = admin.firestore().collection("users").doc(senderId);
      const recipientRef = admin.firestore().collection("users").doc(recipientId);

      const senderDoc = await transaction.get(senderRef);
      const recipientDoc = await transaction.get(recipientRef);

      if (!senderDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Sender account not found");
      }

      if (!recipientDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Recipient account not found");
      }

      const senderData = senderDoc.data()!;
      const recipientData = recipientDoc.data()!;

      // Verify sender account is active and verified
      if (!senderData.isActive || !senderData.isVerified) {
        throw new functions.https.HttpsError("failed-precondition", "Sender account not active or verified");
      }

      // Check if sender can transfer
      if (senderData.canTransfer === false) {
        throw new functions.https.HttpsError("permission-denied", "Transfer capability disabled");
      }

      const senderBalance = senderData.balance || 0;

      // Verify sufficient balance
      if (senderBalance < amount) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          `Insufficient balance. Available: PHP ${senderBalance.toLocaleString()}`,
        );
      }

      // Check daily transfer limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyTransfers = await admin.firestore()
        .collection("transactions")
        .where("senderId", "==", senderId)
        .where("type", "==", "transfer")
        .where("status", "==", "completed")
        .where("timestamp", ">=", today)
        .get();

      const dailyTotal = dailyTransfers.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      const dailyLimit = senderData.dailyTransferLimit || 50000;

      if (dailyTotal + amount > dailyLimit) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          `Daily transfer limit exceeded. Limit: PHP ${dailyLimit.toLocaleString()}, ` +
          `Used: PHP ${dailyTotal.toLocaleString()}`,
        );
      }

      // Update balances
      transaction.update(senderRef, {
        balance: admin.firestore.FieldValue.increment(-amount),
        lastTransactionAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.update(recipientRef, {
        balance: admin.firestore.FieldValue.increment(amount),
        lastTransactionAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create transaction records
      const transactionData = {
        senderId,
        senderName: `${senderData.firstName} ${senderData.lastName}`,
        senderAccountNumber: senderData.accountNumber,
        recipientId,
        recipientName: `${recipientData.firstName} ${recipientData.lastName}`,
        recipientAccountNumber: recipientData.accountNumber,
        amount,
        description: sanitizedDescription,
        reference,
        type: "transfer",
        status: "completed",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        otpId,
        metadata: {
          senderBalanceBefore: senderBalance,
          senderBalanceAfter: senderBalance - amount,
          recipientBalanceBefore: recipientData.balance || 0,
          recipientBalanceAfter: (recipientData.balance || 0) + amount,
        },
      };

      const txnRef = admin.firestore().collection("transactions").doc();
      transaction.set(txnRef, transactionData);

      // Mark OTP as consumed for transfer
      transaction.update(admin.firestore().collection("otps").doc(otpId), {
        consumed: true,
        consumedAt: admin.firestore.FieldValue.serverTimestamp(),
        transactionId: txnRef.id,
      });

      return {
        transactionId: txnRef.id,
        reference,
        senderBalanceAfter: senderBalance - amount,
        recipientBalanceAfter: (recipientData.balance || 0) + amount,
      };
    });

    console.log(`Transfer completed: ${reference}, Amount: PHP ${amount}, Sender: ${senderId}, Recipient: ${recipientId}`);

    // Return success response
    return {
      success: true,
      message: "Transfer completed successfully",
      transactionId: result.transactionId,
      reference: result.reference,
      amount,
      senderBalance: result.senderBalanceAfter,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error in processTransfer function:", error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError("internal", error.message || "Transfer failed");
  }
});

/**
 * Cloud Function: Get daily transfer summary
 */
export const getDailyTransferSummary = functions.https.onCall(async (data: { userId: string }, context) => {
  if (!context.auth || context.auth.uid !== data.userId) {
    throw new functions.https.HttpsError("permission-denied", "Unauthorized");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const transfers = await admin.firestore()
    .collection("transactions")
    .where("senderId", "==", data.userId)
    .where("type", "==", "transfer")
    .where("status", "==", "completed")
    .where("timestamp", ">=", today)
    .get();

  const totalAmount = transfers.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
  const count = transfers.size;

  const userDoc = await admin.firestore().collection("users").doc(data.userId).get();
  const userData = userDoc.data()!;
  const dailyLimit = userData.dailyTransferLimit || 50000;

  return {
    totalAmount,
    count,
    dailyLimit,
    remaining: Math.max(0, dailyLimit - totalAmount),
    percentUsed: (totalAmount / dailyLimit) * 100,
  };
});
