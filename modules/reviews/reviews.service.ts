/**
 * CoursePur Backend — Reviews Service & Integrity Engine (Part 2.5, 7.2, 12.4)
 */

import crypto from 'crypto';
import { db } from '../../shared/db/database.js';
import { Review, EntityType, DisputeReason, ReviewStatus } from '../../shared/types/schema.js';
import { OtpService } from '../auth/otp.service.js';
import { AppError } from '../../shared/errors/app-error.js';

export class ReviewsService {
  static analyzeSentiment(text: string): number {
    const lower = text.toLowerCase();
    const positiveWords = ['great', 'excellent', 'amazing', 'best', 'superb', 'good', 'helpful', 'loved', 'fantastic'];
    const negativeWords = ['terrible', 'worst', 'horrible', 'waste', 'bad', 'scam', 'useless', 'rude', 'cheat', 'poor'];

    let score = 0;
    for (const w of positiveWords) if (lower.includes(w)) score += 1;
    for (const w of negativeWords) if (lower.includes(w)) score -= 1;

    if (score === 0) return 0;
    return score > 0 ? Math.min(1, score * 0.25) : Math.max(-1, score * 0.25);
  }

  static createReview(input: {
    verification_token: string;
    entity_type: EntityType;
    entity_id: string;
    reviewer_user_id?: string | null;
    rating: number;
    body_text: string;
  }) {
    const { phone } = OtpService.consumeVerificationToken(input.verification_token, 'review');
    const rating = Math.round(input.rating);
    if (rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5.', 400);
    if (!input.body_text?.trim() || input.body_text.trim().length < 5) {
      throw new AppError('Review text must be at least 5 characters.', 400);
    }

    // 1 review per reviewer_phone per entity_id (Part 7.2)
    const existing = db.reviews.find((r) => r.reviewer_phone === phone && r.entity_id === input.entity_id);
    if (existing) throw new AppError('A review from this phone number has already been recorded for this item.', 409);

    const polarity = this.analyzeSentiment(input.body_text);
    let initialStatus: ReviewStatus = 'visible';
    const hasMismatch = (rating >= 4 && polarity <= -0.5) || (rating <= 2 && polarity >= 0.5);
    if (hasMismatch) initialStatus = 'flagged'; // Auto-flag mismatch for moderator

    const now = new Date().toISOString();
    const review: Review = {
      id: `rev_${crypto.randomUUID()}`,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      reviewer_user_id: input.reviewer_user_id || null,
      reviewer_phone: phone,
      otp_verified_at: now,
      rating,
      body_text: input.body_text.trim(),
      institute_response: null,
      institute_response_at: null,
      dispute_status: 'none',
      dispute_reason: null,
      dispute_note: null,
      status: initialStatus,
      created_at: now,
    };

    db.reviews.push(review);
    return review;
  }

  static replyToReview(reviewId: string, instituteId: string, responseText: string): Review {
    const review = db.reviews.find((r) => r.id === reviewId);
    if (!review) throw new AppError('Review not found.', 404);
    if (review.entity_type !== 'institute' || review.entity_id !== instituteId) {
      throw new AppError('You can only reply to reviews for your own institute.', 403);
    }

    // Immutability: 409 conflict if already replied (Part 7.2)
    if (review.institute_response) {
      throw new AppError('Conflict: Institute response has already been published and is immutable.', 409);
    }

    review.institute_response = responseText.trim();
    review.institute_response_at = new Date().toISOString();
    return review;
  }

  static disputeReview(reviewId: string, instituteId: string, reason: DisputeReason, note: string): Review {
    const review = db.reviews.find((r) => r.id === reviewId);
    if (!review) throw new AppError('Review not found.', 404);
    if (review.entity_type !== 'institute' || review.entity_id !== instituteId) {
      throw new AppError('You can only dispute reviews for your own institute.', 403);
    }

    review.dispute_status = 'disputed';
    review.dispute_reason = reason;
    review.dispute_note = note.trim();
    return review;
  }

  static moderateReview(
    reviewId: string,
    action: { status?: ReviewStatus; dispute_resolution?: 'kept' | 'removed'; ban_reviewer_phone?: boolean }
  ): Review {
    const review = db.reviews.find((r) => r.id === reviewId);
    if (!review) throw new AppError('Review not found.', 404);

    if (action.status) review.status = action.status;
    if (action.dispute_resolution) {
      review.dispute_status = action.dispute_resolution === 'kept' ? 'resolved_kept' : 'resolved_removed';
      if (action.dispute_resolution === 'removed') review.status = 'removed';
    }
    return review;
  }
}
