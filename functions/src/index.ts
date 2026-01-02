import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Export authentication functions
export { sendOTP, resendOTP } from "./auth/sendOTP";
export { validateOTP, checkPendingOTP } from "./auth/validateOTP";

// Export transaction functions
export { processTransfer, getDailyTransferSummary } from "./transactions/transfer";

// You can add more exports as you create additional functions
// Example:
// export { processDeposit } from "./transactions/deposit";
// export { processWithdrawal } from "./transactions/withdrawal";
// export { sendPushNotification } from "./notifications/push";
// export { cleanupExpiredOTPs } from "./scheduled/cleanup";
