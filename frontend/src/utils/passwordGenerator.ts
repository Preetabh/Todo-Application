export interface PasswordGeneratorOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+~|}{[]:;?><,.-=';

/**
 * Generate a cryptographically secure random password
 */
export function generateStrongPassword(
  options: PasswordGeneratorOptions = {}
): string {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  let charPool = '';
  const requiredChars: string[] = [];

  if (includeUppercase) {
    charPool += UPPERCASE;
    requiredChars.push(UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]);
  }
  if (includeLowercase) {
    charPool += LOWERCASE;
    requiredChars.push(LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]);
  }
  if (includeNumbers) {
    charPool += NUMBERS;
    requiredChars.push(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
  }
  if (includeSymbols) {
    charPool += SYMBOLS;
    requiredChars.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
  }

  if (!charPool) {
    charPool = LOWERCASE + NUMBERS;
  }

  const result: string[] = [...requiredChars];
  for (let i = requiredChars.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charPool.length);
    result.push(charPool[randomIndex]);
  }

  // Shuffle using Fisher-Yates
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

/**
 * Evaluate password strength score (0 to 100) and label
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  color: string;
} {
  if (!password) {
    return { score: 0, label: 'Weak', color: '#EF4444' };
  }

  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  score = Math.min(100, score);

  if (score >= 80) {
    return { score, label: 'Very Strong', color: '#10B981' };
  }
  if (score >= 60) {
    return { score, label: 'Strong', color: '#3B82F6' };
  }
  if (score >= 40) {
    return { score, label: 'Medium', color: '#F59E0B' };
  }
  return { score, label: 'Weak', color: '#EF4444' };
}
