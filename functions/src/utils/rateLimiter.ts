import * as admin from "firebase-admin";

/**
 * Rate limiter to prevent abuse
 * Tracks attempts per user per action within a time window
 */
export const checkRateLimit = async (
  userId: string,
  action: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; attemptsLeft: number; resetAt: Date }> => {
  const now = Date.now();
  const key = `${userId}_${action}`;

  const limiterRef = admin.firestore().collection("rate_limits").doc(key);
  const limiterDoc = await limiterRef.get();

  // First attempt
  if (!limiterDoc.exists) {
    const resetAt = new Date(now + (windowSeconds * 1000));

    await limiterRef.set({
      attempts: 1,
      windowStart: now,
      expiresAt: now + (windowSeconds * 1000),
      action,
      userId,
    });

    return {
      allowed: true,
      attemptsLeft: maxAttempts - 1,
      resetAt,
    };
  }

  const data = limiterDoc.data()!;

  // Reset window if expired
  if (now > data.expiresAt) {
    const resetAt = new Date(now + (windowSeconds * 1000));

    await limiterRef.set({
      attempts: 1,
      windowStart: now,
      expiresAt: now + (windowSeconds * 1000),
      action,
      userId,
    });

    return {
      allowed: true,
      attemptsLeft: maxAttempts - 1,
      resetAt,
    };
  }

  // Check if exceeded
  if (data.attempts >= maxAttempts) {
    return {
      allowed: false,
      attemptsLeft: 0,
      resetAt: new Date(data.expiresAt),
    };
  }

  // Increment attempts
  await limiterRef.update({
    attempts: admin.firestore.FieldValue.increment(1),
  });

  return {
    allowed: true,
    attemptsLeft: maxAttempts - data.attempts - 1,
    resetAt: new Date(data.expiresAt),
  };
};

/**
 * Reset rate limit for a user action (e.g., after successful verification)
 */
export const resetRateLimit = async (userId: string, action: string): Promise<void> => {
  const key = `${userId}_${action}`;
  const limiterRef = admin.firestore().collection("rate_limits").doc(key);

  await limiterRef.delete();
};

/**
 * Check if IP address is rate limited (for anonymous actions)
 */
export const checkIPRateLimit = async (
  ipAddress: string,
  action: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; attemptsLeft: number }> => {
  const now = Date.now();
  const key = `ip_${ipAddress}_${action}`;

  const limiterRef = admin.firestore().collection("rate_limits").doc(key);
  const limiterDoc = await limiterRef.get();

  if (!limiterDoc.exists) {
    await limiterRef.set({
      attempts: 1,
      windowStart: now,
      expiresAt: now + (windowSeconds * 1000),
      action,
      ipAddress,
    });

    return { allowed: true, attemptsLeft: maxAttempts - 1 };
  }

  const data = limiterDoc.data()!;

  if (now > data.expiresAt) {
    await limiterRef.set({
      attempts: 1,
      windowStart: now,
      expiresAt: now + (windowSeconds * 1000),
      action,
      ipAddress,
    });

    return { allowed: true, attemptsLeft: maxAttempts - 1 };
  }

  if (data.attempts >= maxAttempts) {
    return { allowed: false, attemptsLeft: 0 };
  }

  await limiterRef.update({
    attempts: admin.firestore.FieldValue.increment(1),
  });

  return { allowed: true, attemptsLeft: maxAttempts - data.attempts - 1 };
};
