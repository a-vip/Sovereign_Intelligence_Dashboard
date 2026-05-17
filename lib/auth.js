import crypto from 'crypto';

/**
 * Hashes a plaintext password using PBKDF2 with a secure random salt.
 * Returns a string formatted as salt:hash
 * @param {string} password 
 * @returns {string}
 */
export function hashPassword(password) {
  if (!password) throw new Error('Password is required');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored salt:hash string.
 * Returns true if the password is correct, false otherwise.
 * @param {string} password 
 * @param {string} storedPassword 
 * @returns {boolean}
 */
export function verifyPassword(password, storedPassword) {
  if (!password || !storedPassword) return false;
  try {
    const parts = storedPassword.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
