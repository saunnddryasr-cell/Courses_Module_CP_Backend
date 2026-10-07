/**
 * CoursePur Backend — Cryptography & Security Utilities
 */

import crypto from 'crypto';

export function generateOtpCode(): string {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

export function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function hashPassword(password: string, salt: string = 'coursepur_salt'): string {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export function verifyPassword(password: string, storedHash: string, salt: string = 'coursepur_salt'): boolean {
  return hashPassword(password, salt) === storedHash;
}

export function generateSecureToken(prefix: string = 'cpt_'): string {
  return `${prefix}${crypto.randomBytes(24).toString('hex')}`;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function encryptSecret(plainText: string): string {
  const buffer = Buffer.from(plainText, 'utf-8');
  return `enc:${buffer.toString('base64')}`;
}

export function decryptSecret(encryptedText: string): string {
  if (encryptedText.startsWith('enc:')) {
    const raw = encryptedText.substring(4);
    return Buffer.from(raw, 'base64').toString('utf-8');
  }
  return encryptedText;
}

export function maskSecret(secret: string): string {
  const plain = decryptSecret(secret);
  if (plain.length <= 4) return '••••';
  return `••••••••${plain.slice(-4)}`;
}
