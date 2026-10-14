const crypto = require('crypto');

// Derive consistent 32-byte key using SHA-256 over secret
const getEncryptionKey = () => {
  const secret =
    process.env.PASSWORD_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'fallback_vault_encryption_secret_key_12345';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypt plaintext string using AES-256-GCM
 * @param {string} plaintext
 * @returns {{ encrypted: string, iv: string, authTag: string }}
 */
const encryptPassword = (plaintext) => {
  if (!plaintext) {
    return { encrypted: '', iv: '', authTag: '' };
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Recommended IV size for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
};

/**
 * Decrypt ciphertext using AES-256-GCM and verify authentication tag
 * @param {string} encryptedHex
 * @param {string} ivHex
 * @param {string} authTagHex
 * @returns {string} plaintext
 */
const decryptPassword = (encryptedHex, ivHex, authTagHex) => {
  if (!encryptedHex || !ivHex || !authTagHex) {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed or data was tampered:', error.message);
    return '••••••••';
  }
};

/**
 * Calculate password strength score (0 to 100) and label
 * @param {string} password
 * @returns {{ score: number, label: 'Weak' | 'Medium' | 'Strong' | 'Very Strong' }}
 */
const evaluatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Weak' };

  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  score = Math.min(100, score);

  let label = 'Weak';
  if (score >= 80) label = 'Very Strong';
  else if (score >= 60) label = 'Strong';
  else if (score >= 40) label = 'Medium';

  return { score, label };
};

module.exports = {
  encryptPassword,
  decryptPassword,
  evaluatePasswordStrength,
};
