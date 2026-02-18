/**
 * Security Utilities
 * Handles validation, sanitization, and client-side rate limiting.
 */

// --- CRYPTOGRAPHY ---

export const hashString = async (text: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// --- VALIDATION ---

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  // Optional: Special character check
  // if (!/[!@#$%^&*]/.test(password)) {
  //   return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*).' };
  // }
  return { isValid: true };
};

export const validateEmail = (email: string): boolean => {
  // Basic RFC 5322 compliant regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// --- SANITIZATION ---

export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  // Basic HTML tag stripping to prevent XSS
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const sanitizeInput = (input: string, maxLength = 1000): string => {
  const sanitized = sanitizeHtml(input);
  return sanitized.slice(0, maxLength);
};

// --- RATE LIMITING ---

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitData {
  count: number;
  timestamp: number;
}

export const checkRateLimit = (identifier: string): { allowed: boolean; waitTimeMinutes?: number } => {
  const key = `rate_limit_${identifier}`;
  const now = Date.now();
  const stored = localStorage.getItem(key);

  if (!stored) {
    localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: now }));
    return { allowed: true };
  }

  const data: RateLimitData = JSON.parse(stored);

  // Check if window expired
  if (now - data.timestamp > WINDOW_MS) {
    localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: now }));
    return { allowed: true };
  }

  // Check count
  if (data.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((WINDOW_MS - (now - data.timestamp)) / 60000);
    return { allowed: false, waitTimeMinutes: remainingTime };
  }

  // Increment
  data.count += 1;
  localStorage.setItem(key, JSON.stringify(data));
  return { allowed: true };
};

export const resetRateLimit = (identifier: string) => {
  const key = `rate_limit_${identifier}`;
  localStorage.removeItem(key);
};