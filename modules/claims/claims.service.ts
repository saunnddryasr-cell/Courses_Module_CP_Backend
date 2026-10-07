/**
 * CoursePur Backend — Hybrid Risk-Based Claim Approval Engine (Part 7.1)
 */

import crypto from 'crypto';
import { db } from '../../shared/db/database.js';
import { Claim, Institute, AuditOutcome } from '../../shared/types/schema.js';
import { OtpService } from '../auth/otp.service.js';
import { AppError } from '../../shared/errors/app-error.js';

export class ClaimsService {
  static evaluateRisk(
    institute: Institute | null,
    claimantPhone: string,
    claimantName: string,
    deviceFingerprint: string,
    isNewSelfEntry: boolean
  ) {
    let score = 0;
    const signals: string[] = [];
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    // 1. phone_matches_listing (-30)
    if (institute?.phone) {
      if (institute.phone.replace(/\D/g, '').slice(-10) === claimantPhone.slice(-10)) {
        score -= 30;
        signals.push('phone_matches_listing');
      }
    }

    // 2. duplicate_active_claim (+40)
    if (institute) {
      const exists = db.claims.some(
        (c) =>
          c.institute_id === institute.id &&
          ['pending', 'auto_approved', 'approved'].includes(c.status)
      );
      if (exists) {
        score += 40;
        signals.push('duplicate_active_claim');
      }
    }

    // 3. high_velocity_phone (+50)
    const phoneClaims24h = db.claims.filter(
      (c) => c.claimant_phone === claimantPhone && c.created_at >= oneDayAgo
    );
    if (new Set(phoneClaims24h.map((c) => c.institute_id)).size >= 3) {
      score += 50;
      signals.push('high_velocity_phone');
    }

    // 4. high_velocity_device (+50)
    if (deviceFingerprint) {
      const devClaims = db.claims.filter(
        (c) => c.claimant_device_fingerprint === deviceFingerprint && c.created_at >= oneDayAgo
      );
      if (devClaims.length >= 2) {
        score += 50;
        signals.push('high_velocity_device');
      }
    }

    // 5. first_time_phone (+10)
    const hasHistory =
      db.users.some((u) => u.phone === claimantPhone) ||
      db.reviews.some((r) => r.reviewer_phone === claimantPhone) ||
      db.leads.some((l) => l.student_phone === claimantPhone) ||
      db.claims.some((c) => c.claimant_phone === claimantPhone);
    if (!hasHistory) {
      score += 10;
      signals.push('first_time_phone');
    }

    // 6. institute_has_prior_rejected_claim (+25)
    if (
      institute &&
      db.claims.some((c) => c.institute_id === institute.id && ['rejected', 'revoked'].includes(c.status))
    ) {
      score += 25;
      signals.push('institute_has_prior_rejected_claim');
    }

    // 7. new_institute_self_entry (+15)
    if (isNewSelfEntry) {
      score += 15;
      signals.push('new_institute_self_entry');
    }

    // 8. name_mismatch (+15)
    if (institute?.faculty?.length) {
      const match = institute.faculty.some((f) =>
        f.name.toLowerCase().includes(claimantName.toLowerCase())
      );
      if (!match) {
        score += 15;
        signals.push('name_mismatch');
      }
    }

    const finalScore = Math.max(0, Math.min(100, score));

    // ROUTING DECISION (Part 7.1.2)
    if (isNewSelfEntry || finalScore >= 30 || signals.includes('duplicate_active_claim')) {
      return {
        risk_score: finalScore,
        risk_signals: signals,
        review_mode: 'manual' as const,
        status: 'pending' as const,
      };
    }

    return {
      risk_score: finalScore,
      risk_signals: signals,
      review_mode: 'auto' as const,
      status: 'auto_approved' as const,
    };
  }

  static submitClaim(input: {
    verification_token: string;
    institute_id?: string;
    new_institute?: any;
    claimant_name: string;
    claimant_ip?: string;
    claimant_device_fingerprint?: string;
  }) {
    const { phone } = OtpService.consumeVerificationToken(input.verification_token, 'claim');
    const isNew = Boolean(input.new_institute && !input.institute_id);
    let targetInstitute: Institute;

    if (isNew) {
      const slug = input.new_institute.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      targetInstitute = {
        id: `inst_${crypto.randomUUID()}`,
        name: input.new_institute.name,
        slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
        description: input.new_institute.description || '',
        city: input.new_institute.city,
        locality: input.new_institute.locality || '',
        address: input.new_institute.address || '',
        latitude: null,
        longitude: null,
        phone,
        email: '',
        mode: input.new_institute.mode || 'hybrid',
        category: input.new_institute.category || 'government_exam',
        fee_range_min: input.new_institute.fee_range_min || 0,
        fee_range_max: input.new_institute.fee_range_max || 0,
        photos: [],
        video_url: null,
        faculty: [],
        results_claims: '',
        established_year: null,
        operating_status: 'active',
        claim_status: 'pending_verification',
        verified_via: 'none',
        source: 'claimed_self_entry',
        moderation_notes: 'Created via self-entry.',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated_by_institute_at: new Date().toISOString(),
      };
      db.institutes.push(targetInstitute);
    } else {
      const found = db.institutes.find((i) => i.id === input.institute_id);
      if (!found) throw new AppError('Target institute not found.', 404);
      targetInstitute = found;
    }

    const evalResult = this.evaluateRisk(
      targetInstitute,
      phone,
      input.claimant_name,
      input.claimant_device_fingerprint || '',
      isNew
    );

    const now = new Date().toISOString();
    const claim: Claim = {
      id: `clm_${crypto.randomUUID()}`,
      institute_id: targetInstitute.id,
      claimant_name: input.claimant_name,
      claimant_phone: phone,
      claimant_ip: input.claimant_ip || '127.0.0.1',
      claimant_device_fingerprint: input.claimant_device_fingerprint || '',
      otp_verified_at: now,
      status: evalResult.status,
      review_mode: evalResult.review_mode,
      risk_score: evalResult.risk_score,
      risk_signals: evalResult.risk_signals,
      decided_by_admin_id: null,
      decided_at: evalResult.status === 'auto_approved' ? now : null,
      revoked_reason: null,
      created_at: now,
    };
    db.claims.push(claim);

    if (claim.status === 'auto_approved') {
      targetInstitute.claim_status = 'claimed';
      targetInstitute.verified_via = 'otp';
    }

    return { claim, institute: targetInstitute };
  }

  static flagDrasticChangeForAudit(instituteId: string, reason: string): void {
    const claim = db.claims.find(
      (c) =>
        c.institute_id === instituteId &&
        (c.status === 'approved' || c.status === 'auto_approved')
    );
    if (!claim) return;

    const claimAgeDays = (Date.now() - new Date(claim.created_at).getTime()) / (1000 * 3600 * 24);
    if (claimAgeDays <= 7) {
      const alreadySampled = db.claim_audit_samples.some((s) => s.claim_id === claim.id);
      if (!alreadySampled) {
        db.claim_audit_samples.push({
          id: `aud_${crypto.randomUUID()}`,
          claim_id: claim.id,
          sampled_at: new Date().toISOString(),
          reviewed_by_admin_id: null,
          outcome: null,
          notes: `Drastic alteration within 7 days: ${reason}`,
        });
      }
    }
  }

  static decideClaim(claimId: string, adminId: string, decision: 'approve' | 'reject') {
    const claim = db.claims.find((c) => c.id === claimId && c.status === 'pending');
    if (!claim) throw new AppError('Pending claim not found.', 404);

    const now = new Date().toISOString();
    claim.status = decision === 'approve' ? 'approved' : 'rejected';
    claim.decided_by_admin_id = adminId;
    claim.decided_at = now;

    const institute = db.institutes.find((i) => i.id === claim.institute_id);
    if (institute && decision === 'approve') {
      institute.claim_status = 'claimed';
      institute.verified_via = 'otp';
    }
    return claim;
  }

  static revokeClaim(claimId: string, adminId: string, revokedReason: string) {
    const claim = db.claims.find((c) => c.id === claimId);
    if (!claim) throw new AppError('Claim not found.', 404);

    const now = new Date().toISOString();
    claim.status = 'revoked';
    claim.revoked_reason = revokedReason;
    claim.decided_by_admin_id = adminId;
    claim.decided_at = now;

    const institute = db.institutes.find((i) => i.id === claim.institute_id);
    if (institute) {
      institute.claim_status = 'unclaimed';
      institute.verified_via = 'none';
    }
    return claim;
  }
}
