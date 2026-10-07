/**
 * CoursePur Backend — Leads Engine & Contact Unlock (Part 2.5, 4.3, 7.5, 12.5)
 */

import crypto from 'crypto';
import { db } from '../../shared/db/database.js';
import { Lead, LeadSourcePage } from '../../shared/types/schema.js';
import { OtpService } from '../auth/otp.service.js';
import { AppError } from '../../shared/errors/app-error.js';

export class LeadsService {
  static scoreLeadQuality(message: string, studentPhone: string): number {
    let score = 50;
    if (message.length > 50) score += 20;
    else if (message.length > 20) score += 10;
    else score -= 10;

    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const leadsToday = db.leads.filter(
      (l) => l.student_phone === studentPhone && l.created_at >= oneDayAgo
    );
    if (leadsToday.length >= 4) score -= 30;

    return Math.max(10, Math.min(100, score));
  }

  static submitLead(input: {
    verification_token: string;
    institute_id: string;
    batch_id?: string | null;
    student_name: string;
    student_phone?: string;
    student_user_id?: string | null;
    message: string;
    source_page: LeadSourcePage;
  }) {
    const { phone } = OtpService.consumeVerificationToken(input.verification_token, 'lead');
    const institute = db.institutes.find((i) => i.id === input.institute_id);
    if (!institute) throw new AppError('Target institute not found.', 404);

    if (input.batch_id) {
      const batch = db.institute_batches.find((b) => b.id === input.batch_id);
      if (!batch || batch.institute_id !== institute.id) {
        throw new AppError('Specified batch does not belong to this institute.', 400);
      }
    }

    const now = new Date().toISOString();
    const lead: Lead = {
      id: `lead_${crypto.randomUUID()}`,
      institute_id: institute.id,
      batch_id: input.batch_id || null,
      student_name: input.student_name.trim(),
      student_phone: phone,
      student_user_id: input.student_user_id || null,
      message: input.message?.trim() || 'Inquiry regarding course schedules and admissions.',
      source_page: input.source_page || 'profile',
      contacted_by_institute: false,
      created_at: now,
    };

    db.leads.push(lead);

    db.notifications.push({
      id: `notif_${crypto.randomUUID()}`,
      user_id: null,
      recipient_type: 'institute',
      type: 'new_lead',
      payload: {
        lead_id: lead.id,
        institute_id: institute.id,
        student_name: lead.student_name,
        student_phone: lead.student_phone,
        message: lead.message,
      },
      sent_via: 'email',
      sent_at: now,
    });

    const qualityScore = this.scoreLeadQuality(lead.message, phone);

    // PART 7.5 CONTACT UNLOCK: Direct contact unlocked ONLY after lead capture event!
    return {
      lead,
      institute_contact: {
        phone: institute.phone,
        email: institute.email,
        address: institute.address,
        locality: institute.locality,
        city: institute.city,
      },
      quality_score: qualityScore,
    };
  }
}
