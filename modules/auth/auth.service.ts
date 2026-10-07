/**
 * CoursePur Backend — Multi-Persona Authentication Service (Part 3)
 */

import crypto from 'crypto';
import { db } from '../../shared/db/database.js';
import { User, Session, Claim } from '../../shared/types/schema.js';
import { OtpService } from './otp.service.js';
import { generateSecureToken, hashToken, verifyPassword } from '../../shared/security/crypto.js';
import { AppError } from '../../shared/errors/app-error.js';

export class AuthService {
  private static createSessionRecord(data: {
    userId?: string | null;
    instituteClaimId?: string | null;
    adminUserId?: string | null;
  }) {
    const rawToken = generateSecureToken('cp_sess_');
    const session: Session = {
      id: `sess_${crypto.randomUUID()}`,
      user_id: data.userId || null,
      institute_claim_id: data.instituteClaimId || null,
      admin_user_id: data.adminUserId || null,
      token_hash: hashToken(rawToken),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    db.sessions.push(session);
    return { token: rawToken, expiresAt: session.expires_at };
  }

  static loginStudent(input: {
    verification_token?: string;
    phone?: string;
    google_id?: string;
    email?: string;
    name?: string;
    primary_goal_exam_tag_id?: string;
    referred_by_user_id?: string;
  }) {
    let phone: string | null = null;
    if (input.verification_token) {
      phone = OtpService.consumeVerificationToken(input.verification_token, 'login').phone;
    } else if (input.phone) {
      phone = input.phone.trim().replace(/\D/g, '');
    }

    if (!phone && !input.google_id) {
      throw new AppError('Either phone verification token or Google ID is required.', 400);
    }

    let user = phone
      ? db.users.find((u) => u.phone === phone)
      : db.users.find((u) => u.google_id === input.google_id);

    if (!user) {
      let referrerId: string | null = null;
      if (input.referred_by_user_id) {
        const ref = db.users.find((u) => u.id === input.referred_by_user_id);
        if (ref) referrerId = ref.id;
      }

      user = {
        id: `usr_${crypto.randomUUID()}`,
        phone,
        email: input.email || null,
        google_id: input.google_id || null,
        name: input.name?.trim() || `Student ${phone ? phone.slice(-4) : ''}`,
        primary_goal_exam_tag_id: input.primary_goal_exam_tag_id || null,
        referred_by_user_id: referrerId, // Immutable referral attribution (Part 7.6)
        created_at: new Date().toISOString(),
      };
      db.users.push(user);
    }

    const { token, expiresAt } = this.createSessionRecord({ userId: user.id });
    return { token, expires_at: expiresAt, persona: 'student' as const, user };
  }

  static loginInstituteAdmin(input: { verification_token: string; institute_id?: string }) {
    const { phone } = OtpService.consumeVerificationToken(input.verification_token, 'login');
    const approvedClaims = db.claims.filter(
      (c) => c.claimant_phone === phone && (c.status === 'approved' || c.status === 'auto_approved')
    );

    if (approvedClaims.length === 0) {
      throw new AppError(`No approved institute claim found for phone +91 ${phone.slice(-10)}.`, 403);
    }

    let claim: Claim = approvedClaims[0];
    if (input.institute_id) {
      const match = approvedClaims.find((c) => c.institute_id === input.institute_id);
      if (match) claim = match;
    }

    const institute = db.institutes.find((i) => i.id === claim.institute_id);
    if (!institute) throw new AppError('Associated institute could not be found.', 404);

    const { token, expiresAt } = this.createSessionRecord({ instituteClaimId: claim.id });
    return {
      token,
      expires_at: expiresAt,
      persona: 'institute_admin' as const,
      institute: { id: institute.id, name: institute.name, slug: institute.slug },
    };
  }

  static loginAdminUser(input: { email: string; password: string }) {
    const admin = db.admin_users.find((a) => a.email.toLowerCase() === input.email.trim().toLowerCase());
    if (!admin || !admin.is_active || !verifyPassword(input.password, admin.password_hash)) {
      throw new AppError('Invalid email or password.', 401);
    }

    const { token, expiresAt } = this.createSessionRecord({ adminUserId: admin.id });
    const { password_hash: _, ...safeAdmin } = admin;
    return { token, expires_at: expiresAt, persona: 'admin_user' as const, admin_user: safeAdmin };
  }

  static resolveSession(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const session = db.sessions.find(
      (s) => s.token_hash === tokenHash && s.expires_at > new Date().toISOString()
    );
    if (!session) return null;

    if (session.user_id) {
      const user = db.users.find((u) => u.id === session.user_id);
      return user ? { session, persona: 'student' as const, user } : null;
    }

    if (session.institute_claim_id) {
      const claim = db.claims.find(
        (c) => c.id === session.institute_claim_id && (c.status === 'approved' || c.status === 'auto_approved')
      );
      if (!claim) return null;
      const institute = db.institutes.find((i) => i.id === claim.institute_id);
      return institute ? { session, persona: 'institute_admin' as const, claim, institute } : null;
    }

    if (session.admin_user_id) {
      const admin = db.admin_users.find((a) => a.id === session.admin_user_id && a.is_active);
      if (!admin) return null;
      const { password_hash: _, ...safeAdmin } = admin;
      return { session, persona: 'admin_user' as const, admin_user: safeAdmin };
    }
    return null;
  }

  static logout(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const idx = db.sessions.findIndex((s) => s.token_hash === tokenHash);
    if (idx !== -1) {
      db.sessions.splice(idx, 1);
      return true;
    }
    return false;
  }
}
