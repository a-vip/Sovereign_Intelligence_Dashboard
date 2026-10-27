import crypto from 'crypto';

const PBKDF2_ITERATIONS = 100000;
const LEGACY_PBKDF2_ITERATIONS = 1000;

function getSessionSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.DASHBOARD_API_TOKEN ||
    process.env.POSTGRES_URL ||
    'sovereign-default-hmac-key-2026-cambridge'
  );
}

/**
 * Hashes a plaintext password using PBKDF2-SHA512 (100,000 iterations) with a secure random salt.
 * Returns a string formatted as pbkdf2:iterations:salt:hash
 * @param {string} password 
 * @returns {string}
 */
export function hashPassword(password) {
  if (!password) throw new Error('Password is required');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
  return `pbkdf2:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored password hash string.
 * Supports both modern `pbkdf2:iterations:salt:hash` and legacy `salt:hash` (1,000 iterations).
 * Uses constant-time comparison (`crypto.timingSafeEqual`).
 * @param {string} password 
 * @param {string} storedPassword 
 * @returns {boolean}
 */
export function verifyPassword(password, storedPassword) {
  if (!password || !storedPassword) return false;
  try {
    const parts = storedPassword.split(':');
    let iterations = LEGACY_PBKDF2_ITERATIONS;
    let salt = '';
    let originalHash = '';

    if (parts.length === 4 && parts[0] === 'pbkdf2') {
      iterations = parseInt(parts[1], 10) || PBKDF2_ITERATIONS;
      salt = parts[2];
      originalHash = parts[3];
    } else if (parts.length === 2) {
      salt = parts[0];
      originalHash = parts[1];
    } else {
      return false;
    }

    const derived = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');
    const originalBuf = Buffer.from(originalHash, 'hex');
    if (derived.length !== originalBuf.length) return false;
    return crypto.timingSafeEqual(derived, originalBuf);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token for an authenticated user.
 */
export function signSessionToken(user) {
  const payload = {
    uid: user.id,
    email: user.email,
    role: user.role || 'analyst',
    tier: user.tier || 'free',
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed HMAC-SHA256 session token and returns the decoded payload or null.
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;
    const expectedSig = crypto
      .createHmac('sha256', getSessionSecret())
      .update(encodedPayload)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload.uid || (payload.exp && Date.now() > payload.exp)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

