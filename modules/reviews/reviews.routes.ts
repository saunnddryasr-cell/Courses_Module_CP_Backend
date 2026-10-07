/**
 * CoursePur Backend — Reviews API Routes (Part 4.1 & Part 4.4)
 */

import { Router, Request, Response } from 'express';
import { db } from '../../shared/db/database.js';
import { ReviewsService } from './reviews.service.js';
import { requireInstitutePanel } from '../auth/auth.middleware.js';

export const reviewsRouter = Router();

reviewsRouter.post('/reviews', (req: Request, res: Response) => {
  try {
    const { verification_token, entity_type, entity_id, reviewer_user_id, rating, body_text } = req.body;
    if (!verification_token || !entity_type || !entity_id || !rating || !body_text) {
      res.status(400).json({ error: 'verification_token, entity_type, entity_id, rating, body_text required.' });
      return;
    }

    const review = ReviewsService.createReview({
      verification_token,
      entity_type,
      entity_id,
      reviewer_user_id,
      rating: Number(rating),
      body_text,
    });
    res.status(201).json(review);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

reviewsRouter.get('/reviews', (req: Request, res: Response) => {
  const entityType = String(req.query.entity_type || '');
  const entityId = String(req.query.entity_id || '');

  let results = db.reviews.filter((r) => r.status === 'visible');
  if (entityType) results = results.filter((r) => r.entity_type === entityType);
  if (entityId) results = results.filter((r) => r.entity_id === entityId);

  const sanitized = results.map((r) => ({
    ...r,
    reviewer_phone: `+91 ••••••••${r.reviewer_phone.slice(-4)}`,
  }));

  res.json(sanitized);
});

// Institute panel reply & dispute routes (Part 4.4)
reviewsRouter.post('/panel/reviews/:id/reply', requireInstitutePanel, (req: Request, res: Response) => {
  try {
    const instituteId = req.instituteId!;
    const { response_text } = req.body;
    if (!response_text?.trim()) {
      res.status(400).json({ error: 'response_text is required.' });
      return;
    }
    const updated = ReviewsService.replyToReview(req.params.id, instituteId, response_text);
    res.json({ success: true, review: updated });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

reviewsRouter.post('/panel/reviews/:id/dispute', requireInstitutePanel, (req: Request, res: Response) => {
  try {
    const instituteId = req.instituteId!;
    const { dispute_reason, dispute_note } = req.body;
    if (!dispute_reason || !dispute_note) {
      res.status(400).json({ error: 'dispute_reason and dispute_note are required.' });
      return;
    }
    const updated = ReviewsService.disputeReview(req.params.id, instituteId, dispute_reason, dispute_note);
    res.json({ success: true, review: updated });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});
