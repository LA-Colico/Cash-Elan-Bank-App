import validator from "validator";

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Escape HTML entities
  let sanitized = validator.escape(input);

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

/**
 * Validate email address format
 */
export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

/**
 * Validate Philippine phone number
 * Accepts formats: +639XXXXXXXXX, 639XXXXXXXXX, 09XXXXXXXXX, 9XXXXXXXXX
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");

  // Check various valid formats
  if (phone.startsWith("+639") && cleaned.length === 12) {
    return true;
  }
  if (phone.startsWith("639") && cleaned.length === 12) {
    return true;
  }
  if (phone.startsWith("09") && cleaned.length === 11) {
    return true;
  }
  if (phone.startsWith("9") && cleaned.length === 10) {
    return true;
  }

  return false;
};

/**
 * Format phone number to international format (+639XXXXXXXXX)
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("639")) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith("09")) {
    return `+63${cleaned.substring(1)}`;
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    return `+63${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith("63")) {
    return `+${cleaned}`;
  }

  if (phone.startsWith("+63")) {
    return phone;
  }

  return `+63${cleaned}`;
};

/**
 * Validate transfer amount
 */
export const validateTransferAmount = (
  amount: number,
  maxSingleTransfer = 50000,
): boolean => {
  // Must be positive number
  if (amount <= 0) return false;

  // Maximum single transfer
  if (amount > maxSingleTransfer) return false;

  // Must have max 2 decimal places
  if (!Number.isInteger(amount * 100)) return false;

  return true;
};

/**
 * Validate OTP code (6 digits)
 */
export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

/**
 * Validate password strength
 * Requirements: min 8 chars, uppercase, lowercase, number
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumbers: boolean;
} => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  return {
    isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumbers,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
  };
};

/**
 * Validate account number (12 digits)
 */
export const validateAccountNumber = (accountNumber: string): boolean => {
  return /^\d{12}$/.test(accountNumber);
};

/**
 * Validate user ID (Firebase UID format)
 */
export const validateUserId = (userId: string): boolean => {
  return typeof userId === "string" && userId.length > 0 && userId.length <= 128;
};
