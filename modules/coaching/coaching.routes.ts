/**
 * CoursePur Backend — Coaching & Institutes Module Routes (Part 4.3 & Part 7.5)
 */

import { Router, Request, Response } from 'express';
import { db } from '../../shared/db/database.js';
import { maskInstitutesForPublic, maskInstituteForPublic } from '../../shared/security/masking.js';
import { ClaimsService } from '../claims/claims.service.js';

export const coachingRouter = Router();

coachingRouter.get('/institutes', (req: Request, res: Response) => {
  const { exam_tag, city, mode, fee_max, verified_only, include_closed, q } = req.query;

  let list = db.institutes.filter((i) => i.is_active);

  if (include_closed !== 'true') {
    list = list.filter((i) => i.operating_status !== 'permanently_closed');
  }

  if (city) {
    list = list.filter((i) => i.city.toLowerCase() === String(city).toLowerCase());
  }

  if (mode) {
    list = list.filter((i) => i.mode === mode);
  }

  if (verified_only === 'true') {
    list = list.filter((i) => i.claim_status === 'claimed' && i.verified_via !== 'none');
  }

  if (fee_max) {
    list = list.filter((i) => i.fee_range_min <= Number(fee_max));
  }

  if (exam_tag) {
    const tag = db.exam_tags.find((t) => t.slug === exam_tag || t.id === exam_tag);
    if (tag) {
      const instIds = db.institute_exam_tags.filter((iet) => iet.exam_tag_id === tag.id).map((iet) => iet.institute_id);
      list = list.filter((i) => instIds.includes(i.id));
    }
  }

  if (q) {
    const qStr = String(q).toLowerCase();
    list = list.filter(
      (i) => i.name.toLowerCase().includes(qStr) || i.description.toLowerCase().includes(qStr) || i.city.toLowerCase().includes(qStr)
    );
  }

  const sanitized = maskInstitutesForPublic(list).map((inst) => {
    const batchesCount = db.institute_batches.filter((b) => b.institute_id === inst.id && !b.is_archived).length;
    const tags = db.institute_exam_tags
      .filter((iet) => iet.institute_id === inst.id)
      .map((iet) => db.exam_tags.find((t) => t.id === iet.exam_tag_id))
      .filter(Boolean);

    return { ...inst, active_batches_count: batchesCount, exam_tags: tags };
  });

  res.json({ total: sanitized.length, institutes: sanitized });
});

coachingRouter.get('/institutes/compare', (req: Request, res: Response) => {
  const idsStr = String(req.query.ids || '');
  const ids = idsStr.split(',').map((id) => id.trim()).filter(Boolean);

  if (ids.length === 0) {
    res.status(400).json({ error: "Query parameter 'ids' is required (comma-separated)." });
    return;
  }

  const matches = db.institutes.filter((i) => ids.includes(i.id) || ids.includes(i.slug));
  const sanitized = maskInstitutesForPublic(matches).map((inst) => {
    const batches = db.institute_batches.filter((b) => b.institute_id === inst.id && !b.is_archived);
    return { ...inst, batches };
  });

  res.json(sanitized);
});

coachingRouter.get('/institutes/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug;
  const institute = db.institutes.find((i) => i.slug === slug || i.id === slug);

  if (!institute) {
    res.status(404).json({ error: 'Institute not found.' });
    return;
  }

  const batches = db.institute_batches.filter((b) => b.institute_id === institute.id && !b.is_archived);
  const examTags = db.institute_exam_tags
    .filter((iet) => iet.institute_id === institute.id)
    .map((iet) => db.exam_tags.find((t) => t.id === iet.exam_tag_id))
    .filter(Boolean);

  const reviews = db.reviews.filter((r) => r.entity_type === 'institute' && r.entity_id === institute.id && r.status === 'visible');
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  const publicData = maskInstituteForPublic(institute);

  res.json({
    ...publicData,
    batches,
    exam_tags: examTags,
    stats: {
      review_count: reviews.length,
      average_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    },
  });
});

coachingRouter.get('/institutes/:slug/batches/:batch_slug', (req: Request, res: Response) => {
  const { slug, batch_slug } = req.params;
  const institute = db.institutes.find((i) => i.slug === slug || i.id === slug);

  if (!institute) {
    res.status(404).json({ error: 'Institute not found.' });
    return;
  }

  const batch = db.institute_batches.find(
    (b) => b.institute_id === institute.id && (b.slug === batch_slug || b.id === batch_slug)
  );

  if (!batch) {
    res.status(404).json({ error: 'Batch not found.' });
    return;
  }

  const examTag = db.exam_tags.find((t) => t.id === batch.exam_tag_id);

  res.json({
    batch,
    exam_tag: examTag,
    institute: maskInstituteForPublic(institute),
  });
});

coachingRouter.post('/claims', (req: Request, res: Response) => {
  try {
    const { verification_token, institute_id, new_institute, claimant_name, claimant_device_fingerprint } = req.body;

    if (!verification_token || !claimant_name) {
      res.status(400).json({ error: 'verification_token and claimant_name are required.' });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const result = ClaimsService.submitClaim({
      verification_token,
      institute_id,
      new_institute,
      claimant_name,
      claimant_ip: clientIp,
      claimant_device_fingerprint: claimant_device_fingerprint || 'fp_client',
    });

    res.status(201).json({
      success: true,
      claim: result.claim,
      institute: maskInstituteForPublic(result.institute),
    });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});
