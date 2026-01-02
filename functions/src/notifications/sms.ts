import * as admin from "firebase-admin";
import twilio from "twilio";
import { validatePhoneNumber, formatPhoneNumber } from "../utils/validation";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

// Initialize Twilio only if credentials are provided
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Send OTP via SMS using Twilio
 */
export const sendOTPSMS = async (
  phoneNumber: string,
  otp: string,
  userName?: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: "Invalid phone number format",
      };
    }

    // Check if Twilio is configured
    if (!twilioClient || !twilioPhoneNumber) {
      console.warn("Twilio not configured, skipping SMS send");
      return {
        success: false,
        error: "SMS service not configured",
      };
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Compose message
    const message = `Your Cash Elan verification code is: ${otp}\n\n` +
      `Valid for 5 minutes. Do not share this code with anyone.\n\n` +
      `If you didn't request this, please ignore this message.`;

    // Send SMS
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone,
    });

    console.log(`SMS sent successfully to ${formattedPhone}, SID: ${result.sid}`);

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return {
      success: false,
      error: error.message || "Failed to send SMS",
    };
  }
};

/**
 * Send transaction notification via SMS
 */
export const sendTransactionSMS = async (
  phoneNumber: string,
  transactionType: string,
  amount: number,
  balance: number,
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!twilioClient || !twilioPhoneNumber) {
      return { success: false, error: "SMS service not configured" };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    let message = "";
    if (transactionType === "credit") {
      message = `Cash Elan: Your account has been credited with PHP ${amount.toLocaleString()}. ` +
        `New balance: PHP ${balance.toLocaleString()}`;
    } else if (transactionType === "debit") {
      message = `Cash Elan: PHP ${amount.toLocaleString()} has been debited from your account. ` +
        `New balance: PHP ${balance.toLocaleString()}`;
    } else {
      message = `Cash Elan: Transaction of PHP ${amount.toLocaleString()} completed. ` +
        `Balance: PHP ${balance.toLocaleString()}`;
    }

    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending transaction SMS:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Log SMS activity to Firestore
 */
export const logSMSActivity = async (
  userId: string,
  phoneNumber: string,
  messageType: string,
  status: string,
  messageId?: string,
  error?: string,
): Promise<void> => {
  try {
    await admin.firestore().collection("sms_logs").add({
      userId,
      phoneNumber,
      messageType,
      status,
      messageId: messageId || null,
      error: error || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging SMS activity:", error);
  }
};
