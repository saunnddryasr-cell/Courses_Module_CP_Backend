/**
 * CoursePur Backend — OTP Service (Part 2.1 & Part 8)
 */

import crypto from 'crypto';
import { db } from '../../shared/db/database.js';
import { OtpPurpose, VerificationToken } from '../../shared/types/schema.js';
import { generateOtpCode, hashOtp, generateSecureToken } from '../../shared/security/crypto.js';
import { AppError } from '../../shared/errors/app-error.js';

export class OtpService {
  static requestOtp(phone: string, purpose: OtpPurpose) {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new AppError('Valid phone number (at least 10 digits) is required.', 400);
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentRequests = db.otp_verifications.filter(
      (v) => v.phone === cleanPhone && v.expires_at > oneHourAgo
    );

    if (recentRequests.length >= 5) {
      throw new AppError('Rate limit exceeded: Maximum 5 OTP requests per hour per phone number.', 429);
    }

    const rawCode = generateOtpCode();
    const otpHash = hashOtp(rawCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    db.otp_verifications.push({
      id: `otp_${crypto.randomUUID()}`,
      phone: cleanPhone,
      otp_code_hash: otpHash,
      purpose,
      expires_at: expiresAt,
      verified_at: null,
      attempt_count: 0,
    });

    return {
      success: true,
      message: `OTP sent to +91 ${cleanPhone.slice(-10)}. Valid for 5 minutes.`,
      phone: cleanPhone,
      purpose,
      expires_in_seconds: 300,
      dev_preview_code: rawCode,
    };
  }

  static verifyOtp(phone: string, code: string, purpose: OtpPurpose) {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const now = new Date().toISOString();
    const record = db.otp_verifications
      .filter((v) => v.phone === cleanPhone && v.purpose === purpose && v.verified_at === null)
      .sort((a, b) => b.expires_at.localeCompare(a.expires_at))[0];

    if (!record) return { success: false, message: 'No active OTP found. Please request a new OTP.' };
    if (record.expires_at < now) return { success: false, message: 'OTP has expired.' };
    if (record.attempt_count >= 3) return { success: false, message: 'Maximum attempts (3) exceeded.' };

    record.attempt_count += 1;
    if (hashOtp(code.trim()) !== record.otp_code_hash) {
      return { success: false, message: `Invalid OTP. ${3 - record.attempt_count} attempts left.` };
    }

    record.verified_at = now;
    const verificationToken: VerificationToken = {
      token: generateSecureToken('vtok_'),
      phone: cleanPhone,
      purpose,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      used: false,
    };
    db.verification_tokens.push(verificationToken);

    return {
      success: true,
      message: 'OTP verified successfully.',
      verification_token: verificationToken.token,
      expires_at: verificationToken.expires_at,
    };
  }

  static consumeVerificationToken(token: string, requiredPurpose: OtpPurpose) {
    const record = db.verification_tokens.find((t) => t.token === token);
    if (!record) throw new AppError('Invalid verification token.', 401);
    if (record.used) throw new AppError('Verification token has already been used.', 409);
    if (new Date().toISOString() > record.expires_at) throw new AppError('Token has expired.', 401);
    if (record.purpose !== requiredPurpose) {
      throw new AppError(`Token purpose mismatch. Expected '${requiredPurpose}', found '${record.purpose}'.`, 403);
    }
    record.used = true;
    return { phone: record.phone };
  }
}
