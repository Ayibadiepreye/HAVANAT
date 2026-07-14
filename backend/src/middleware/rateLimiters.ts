import rateLimit from 'express-rate-limit';

// Critical: Login protection
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Critical: Registration spam prevention
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many accounts created. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Critical: Payment fraud prevention
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many payment attempts. Please contact support.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset protection
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP resend protection (email quota)
export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many verification requests. Please check your email.',
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP verification brute force protection
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many verification attempts. Please request a new code.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Content spam prevention
export const contentCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many submissions. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
