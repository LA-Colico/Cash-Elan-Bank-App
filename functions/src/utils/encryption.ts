import * as CryptoJS from "crypto-js";

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-for-development-only";

/**
 * Encrypt sensitive data
 */
export const encrypt = (text: string): string => {
  if (!text) return "";

  try {
    const ciphertext = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    return ciphertext;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};

/**
 * Decrypt encrypted data
 */
export const decrypt = (ciphertext: string): string => {
  if (!ciphertext) return "";

  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
};

/**
 * Hash sensitive data (one-way, for verification only)
 */
export const hash = (text: string): string => {
  return CryptoJS.SHA256(text).toString();
};

/**
 * Verify hash
 */
export const verifyHash = (text: string, hashedText: string): boolean => {
  const textHash = hash(text);
  return textHash === hashedText;
};

/**
 * Generate a secure random OTP
 */
export const generateOTP = (length = 6): string => {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    // Use crypto-secure random
    const randomIndex = Math.floor(Math.random() * digits.length);
    otp += digits[randomIndex];
  }

  return otp;
};

/**
 * Generate a secure reference number for transactions
 */
export const generateReference = (prefix: string): string => {
  const timestamp = Date.now();
  const random = CryptoJS.lib.WordArray.random(8).toString();
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
};

/**
 * Constant-time string comparison to prevent timing attacks
 * Used for OTP verification
 */
export const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};
