import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { functions } from '../FirebaseConfig';

/**
 * Cloud Functions Helper Utilities
 * Provides easy-to-use wrappers for calling backend Cloud Functions
 */

// ========================================
// OTP FUNCTIONS
// ========================================

export interface SendOTPParams {
  userId: string;
  email?: string;
  phoneNumber?: string;
  userName?: string;
  operationType: 'login' | 'transfer' | 'withdrawal' | 'signup';
  deliveryMethod: 'sms' | 'email' | 'both';
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  otpId: string;
  expiresAt: string;
  attemptsLeft: number;
  deliveryStatus: {
    sms?: boolean;
    email?: boolean;
  };
}

/**
 * Send OTP via SMS and/or Email
 * Replaces the old client-side OTP generation
 */
export const sendOTP = async (params: SendOTPParams): Promise<SendOTPResponse> => {
  try {
    const sendOTPFunction = httpsCallable<SendOTPParams, SendOTPResponse>(functions, 'sendOTP');
    const result = await sendOTPFunction(params);
    return result.data;
  } catch (error: any) {
    console.error('Error calling sendOTP:', error);
    throw new Error(error.message || 'Failed to send OTP');
  }
};

export interface ValidateOTPParams {
  userId: string;
  otp: string;
  operationType: 'login' | 'transfer' | 'withdrawal' | 'signup';
  otpId?: string;
}

export interface ValidateOTPResponse {
  success: boolean;
  verified: boolean;
  message: string;
  otpId: string;
}

/**
 * Validate OTP code
 * Securely verifies OTP on the backend with timing-attack protection
 */
export const validateOTP = async (params: ValidateOTPParams): Promise<ValidateOTPResponse> => {
  try {
    const validateOTPFunction = httpsCallable<ValidateOTPParams, ValidateOTPResponse>(
      functions,
      'validateOTP'
    );
    const result = await validateOTPFunction(params);
    return result.data;
  } catch (error: any) {
    console.error('Error calling validateOTP:', error);
    throw new Error(error.message || 'Failed to validate OTP');
  }
};

export interface CheckPendingOTPParams {
  userId: string;
  operationType: string;
}

export interface CheckPendingOTPResponse {
  hasPending: boolean;
  otpId?: string;
  expiresAt?: string;
  deliveryMethod?: string;
}

/**
 * Check if user has a pending OTP
 */
export const checkPendingOTP = async (
  params: CheckPendingOTPParams
): Promise<CheckPendingOTPResponse> => {
  try {
    const checkPendingOTPFunction = httpsCallable<CheckPendingOTPParams, CheckPendingOTPResponse>(
      functions,
      'checkPendingOTP'
    );
    const result = await checkPendingOTPFunction(params);
    return result.data;
  } catch (error: any) {
    console.error('Error calling checkPendingOTP:', error);
    throw new Error(error.message || 'Failed to check pending OTP');
  }
};

// ========================================
// TRANSACTION FUNCTIONS
// ========================================

export interface ProcessTransferParams {
  senderId: string;
  recipientId: string;
  recipientAccountNumber?: string;
  amount: number;
  description?: string;
  otpId: string;
}

export interface ProcessTransferResponse {
  success: boolean;
  message: string;
  transactionId: string;
  reference: string;
  amount: number;
  senderBalance: number;
  timestamp: string;
}

/**
 * Process money transfer with OTP verification
 * Securely transfers money between accounts with atomic transactions
 */
export const processTransfer = async (
  params: ProcessTransferParams
): Promise<ProcessTransferResponse> => {
  try {
    const processTransferFunction = httpsCallable<ProcessTransferParams, ProcessTransferResponse>(
      functions,
      'processTransfer'
    );
    const result = await processTransferFunction(params);
    return result.data;
  } catch (error: any) {
    console.error('Error calling processTransfer:', error);
    throw new Error(error.message || 'Failed to process transfer');
  }
};

export interface GetDailyTransferSummaryParams {
  userId: string;
}

export interface GetDailyTransferSummaryResponse {
  totalAmount: number;
  count: number;
  dailyLimit: number;
  remaining: number;
  percentUsed: number;
}

/**
 * Get daily transfer summary for a user
 */
export const getDailyTransferSummary = async (
  params: GetDailyTransferSummaryParams
): Promise<GetDailyTransferSummaryResponse> => {
  try {
    const getDailyTransferSummaryFunction = httpsCallable<
      GetDailyTransferSummaryParams,
      GetDailyTransferSummaryResponse
    >(functions, 'getDailyTransferSummary');
    const result = await getDailyTransferSummaryFunction(params);
    return result.data;
  } catch (error: any) {
    console.error('Error calling getDailyTransferSummary:', error);
    throw new Error(error.message || 'Failed to get transfer summary');
  }
};

// ========================================
// ERROR HANDLING UTILITIES
// ========================================

/**
 * Parse Firebase Functions error and return user-friendly message
 */
export const parseFunctionsError = (error: any): string => {
  if (error.code) {
    switch (error.code) {
      case 'functions/unauthenticated':
        return 'You must be logged in to perform this action.';
      case 'functions/permission-denied':
        return 'You do not have permission to perform this action.';
      case 'functions/not-found':
        return 'The requested resource was not found.';
      case 'functions/already-exists':
        return 'This resource already exists.';
      case 'functions/resource-exhausted':
        return 'Too many requests. Please try again later.';
      case 'functions/failed-precondition':
        return error.message || 'Operation cannot be completed at this time.';
      case 'functions/invalid-argument':
        return error.message || 'Invalid input provided.';
      case 'functions/deadline-exceeded':
        return 'Request timed out. Please try again.';
      case 'functions/internal':
        return 'An internal error occurred. Please try again.';
      default:
        return error.message || 'An unknown error occurred.';
    }
  }

  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Wrapper function to call Cloud Functions with automatic error parsing
 */
export const callFunction = async <T, R>(
  functionName: string,
  params: T
): Promise<R> => {
  try {
    const cloudFunction = httpsCallable<T, R>(functions, functionName);
    const result = await cloudFunction(params);
    return result.data;
  } catch (error: any) {
    const errorMessage = parseFunctionsError(error);
    console.error(`Error calling ${functionName}:`, errorMessage);
    throw new Error(errorMessage);
  }
};
