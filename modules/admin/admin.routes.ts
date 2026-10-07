/**
 * CoursePur Backend — Admin & Platform Moderation Routes (Part 4.5 & 4.6)
 */

import { Router, Request, Response } from 'express';
import { db } from '../../shared/db/database.js';
import { requireAdmin } from '../auth/auth.middleware.js';
import { IngestionService } from '../ingestion/ingestion.service.js';
import { ClaimsService } from '../claims/claims.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { NotificationsService } from '../notifications/notification.service.js';
import { hashPassword, maskSecret, encryptSecret } from '../../shared/security/crypto.js';
import crypto from 'crypto';

export const adminRouter = Router();

// ==========================================
// 4.5 CONTENT OPS — COURSE CATALOG
// ==========================================

adminRouter.get('/admin/courses', requireAdmin(['content_ops', 'moderator', 'platform_admin']), (_req, res) => {
  res.json(db.courses);
});

adminRouter.post('/admin/courses', requireAdmin(['content_ops', 'platform_admin']), (req: Request, res: Response) => {
  const { provider_id, title, instructor_name, description, duration_text, level, price, is_free, certificate_available, certificate_cost, language, external_url } = req.body;

  if (!provider_id || !title || !instructor_name) {
    res.status(400).json({ error: 'provider_id, title, and instructor_name are required.' });
    return;
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const now = new Date().toISOString();

  const newCourse = {
    id: `crs_${crypto.randomUUID()}`,
    provider_id,
    title,
    slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
    instructor_name,
    description: description || '',
    syllabus_text: req.body.syllabus_text || null,
    duration_text: duration_text || 'Self-paced',
    level: level || 'beginner',
    price: price !== undefined ? Number(price) : null,
    is_free: Boolean(is_free),
    certificate_available: Boolean(certificate_available),
    certificate_cost: certificate_cost !== undefined ? Number(certificate_cost) : null,
    language: language || 'English',
    external_url: external_url || '',
    source_course_id: `manual_${Date.now()}`,
    ingestion_status: 'active' as const,
    manually_overridden_fields: ['title', 'description'],
    last_synced_at: now,
    created_at: now,
    updated_at: now,
  };

  db.courses.push(newCourse);
  res.status(201).json(newCourse);
});

adminRouter.patch('/admin/courses/:id', requireAdmin(['content_ops', 'platform_admin']), (req: Request, res: Response) => {
  const course = db.courses.find((c) => c.id === req.params.id);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const allowed = ['title', 'instructor_name', 'description', 'syllabus_text', 'duration_text', 'level', 'price', 'is_free', 'certificate_available', 'certificate_cost', 'language', 'external_url'];
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      (course as any)[field] = req.body[field];
      if (!course.manually_overridden_fields.includes(field)) {
        course.manually_overridden_fields.push(field);
      }
    }
  }
  course.updated_at = new Date().toISOString();
  res.json(course);
});

adminRouter.delete('/admin/courses/:id', requireAdmin(['content_ops', 'platform_admin']), (req: Request, res: Response) => {
  const index = db.courses.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }
  db.courses[index].ingestion_status = 'removed_at_source'; // soft delete (Part 5.2)
  res.json({ success: true, message: 'Course marked removed_at_source.' });
});

adminRouter.get('/admin/providers', requireAdmin(['content_ops', 'moderator', 'platform_admin']), (_req, res) => {
  res.json(db.mooc_providers);
});

adminRouter.post('/admin/providers', requireAdmin(['content_ops', 'platform_admin']), (req: Request, res: Response) => {
  const { name, logo_url, description, ingestion_method, website_url, affiliate_program_id } = req.body;
  if (!name || !ingestion_method) {
    res.status(400).json({ error: 'name and ingestion_method required.' });
    return;
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const provider = {
    id: `prov_${crypto.randomUUID()}`,
    name: name.trim(),
    slug,
    logo_url: logo_url || '',
    description: description || '',
    ingestion_method,
    website_url: website_url || '',
    affiliate_program_id: affiliate_program_id || null,
  };
  db.mooc_providers.push(provider);
  res.status(201).json(provider);
});

adminRouter.get('/admin/ingestion/jobs', requireAdmin(['content_ops', 'platform_admin']), (_req, res) => {
  res.json(db.ingestion_jobs);
});

adminRouter.post('/admin/ingestion/jobs/:provider_id/run', requireAdmin(['content_ops', 'platform_admin']), (req: Request, res: Response) => {
  try {
    const job = IngestionService.runProviderSync(req.params.provider_id, req.body.catalog_items);
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

adminRouter.get('/admin/corrections', requireAdmin(['content_ops', 'moderator', 'platform_admin']), (_req, res) => {
  res.json(db.correction_submissions);
});

adminRouter.patch('/admin/corrections/:id', requireAdmin(['content_ops', 'platform_admin']), (req: Request, res: Response) => {
  const item = db.correction_submissions.find((c) => c.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Correction not found.' });
    return;
  }
  item.status = req.body.status;
  if (req.body.status === 'approved') {
    const course = db.courses.find((c) => c.id === item.course_id);
    if (course && item.submitted_field in course) {
      (course as any)[item.submitted_field] = item.suggested_value;
      if (!course.manually_overridden_fields.includes(item.submitted_field)) {
        course.manually_overridden_fields.push(item.submitted_field);
      }
      course.updated_at = new Date().toISOString();
    }
  }
  res.json(item);
});

adminRouter.get('/admin/exam-tags', requireAdmin(['content_ops', 'moderator', 'platform_admin']), (_req, res) => {
  res.json(db.exam_tags);
});

adminRouter.post('/admin/exam-tags/:id/merge', requireAdmin(['platform_admin']), (req: Request, res: Response) => {
  const source = db.exam_tags.find((t) => t.id === req.params.id);
  const target = db.exam_tags.find((t) => t.id === req.body.merge_into_id);
  if (!source || !target) {
    res.status(404).json({ error: 'Source or target tag not found.' });
    return;
  }
  db.course_exam_tags.forEach((cet) => {
    if (cet.exam_tag_id === source.id) cet.exam_tag_id = target.id;
  });
  db.institute_exam_tags.forEach((iet) => {
    if (iet.exam_tag_id === source.id) iet.exam_tag_id = target.id;
  });
  source.is_active = false;
  res.json({ success: true, message: `Merged '${source.name}' into '${target.name}'.` });
});

// ==========================================
// 4.6 PLATFORM ADMIN — INSTITUTES & TRUST
// ==========================================

adminRouter.get('/admin/institutes', requireAdmin(['moderator', 'platform_admin']), (_req, res) => {
  // Admin sees unmasked details and internal notes
  res.json(db.institutes);
});

adminRouter.patch('/admin/institutes/:id/name', requireAdmin(['platform_admin']), (req: Request, res: Response) => {
  const inst = db.institutes.find((i) => i.id === req.params.id);
  if (!inst) {
    res.status(404).json({ error: 'Institute not found.' });
    return;
  }
  const oldName = inst.name;
  inst.name = req.body.new_name.trim();
  inst.updated_at = new Date().toISOString();
  inst.moderation_notes += ` [Name updated from ${oldName} to ${inst.name}]`;
  ClaimsService.flagDrasticChangeForAudit(inst.id, `Name change from ${oldName} to ${inst.name}`);
  res.json({ success: true, institute: inst });
});

adminRouter.get('/admin/claims', requireAdmin(['moderator', 'platform_admin']), (req: Request, res: Response) => {
  const { review_mode, status } = req.query;
  let claims = db.claims;
  if (review_mode) claims = claims.filter((c) => c.review_mode === review_mode);
  if (status) claims = claims.filter((c) => c.status === status);

  const now = Date.now();
  const hydrated = claims.map((c) => {
    const ageHours = (now - new Date(c.created_at).getTime()) / (1000 * 3600);
    return { ...c, is_overdue: c.status === 'pending' && ageHours > 48, age_hours: Math.round(ageHours) };
  });
  res.json(hydrated);
});

adminRouter.patch('/admin/claims/:id', requireAdmin(['moderator', 'platform_admin']), (req: Request, res: Response) => {
  try {
    const adminId = req.authSession!.admin_user!.id;
    const claim = ClaimsService.decideClaim(req.params.id, adminId, req.body.decision);
    res.json({ success: true, claim });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

adminRouter.post('/admin/claims/:id/revoke', requireAdmin(['platform_admin']), (req: Request, res: Response) => {
  try {
    const adminId = req.authSession!.admin_user!.id;
    const claim = ClaimsService.revokeClaim(req.params.id, adminId, req.body.revoked_reason);
    res.json({ success: true, message: 'Claim revoked.', claim });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

adminRouter.get('/admin/claims/audit-samples', requireAdmin(['moderator', 'platform_admin']), (_req, res) => {
  res.json(db.claim_audit_samples);
});

adminRouter.get('/admin/reviews/flagged', requireAdmin(['moderator', 'platform_admin']), (req: Request, res: Response) => {
  const tab = req.query.tab;
  let reviews = db.reviews;
  if (tab === 'disputed') {
    reviews = reviews.filter((r) => r.dispute_status === 'disputed');
  } else {
    reviews = reviews.filter((r) => r.status === 'flagged' || r.dispute_status === 'disputed');
  }
  res.json(reviews);
});

adminRouter.patch('/admin/reviews/:id', requireAdmin(['moderator', 'platform_admin']), (req: Request, res: Response) => {
  try {
    const review = ReviewsService.moderateReview(req.params.id, {
      status: req.body.status,
      dispute_resolution: req.body.dispute_resolution,
      ban_reviewer_phone: req.body.ban_reviewer_phone,
    });
    res.json({ success: true, review });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

adminRouter.get('/admin/leads/export', requireAdmin(['platform_admin']), (_req, res) => {
  res.json(db.leads);
});

adminRouter.get('/admin/users', requireAdmin(['platform_admin']), (_req, res) => {
  res.json(db.admin_users.map(({ password_hash: _, ...safe }) => safe));
});

adminRouter.post('/admin/users', requireAdmin(['platform_admin']), (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !role) {
    res.status(400).json({ error: 'email, password, and role required.' });
    return;
  }
  const newAdmin = {
    id: `admin_usr_${crypto.randomUUID()}`,
    email: email.trim().toLowerCase(),
    password_hash: hashPassword(password),
    name: name || 'Admin User',
    role,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  db.admin_users.push(newAdmin);
  const { password_hash: _, ...safe } = newAdmin;
  res.status(201).json(safe);
});

adminRouter.get('/admin/settings/integrations', requireAdmin(['platform_admin']), (_req, res) => {
  const sanitized = db.integration_configs.map((c) => ({
    ...c,
    credentials_preview: maskSecret(c.credentials_encrypted),
    credentials_encrypted: undefined,
  }));
  res.json(sanitized);
});

adminRouter.patch('/admin/settings/integrations/:key', requireAdmin(['platform_admin']), (req: Request, res: Response) => {
  const config = db.integration_configs.find((c) => c.key === req.params.key);
  if (!config) {
    res.status(404).json({ error: 'Integration config not found.' });
    return;
  }
  if (req.body.is_enabled !== undefined) config.is_enabled = Boolean(req.body.is_enabled);
  if (req.body.provider_name) config.provider_name = req.body.provider_name;
  if (req.body.credentials) config.credentials_encrypted = encryptSecret(req.body.credentials);
  if (req.body.config_json) config.config_json = { ...config.config_json, ...req.body.config_json };
  config.updated_at = new Date().toISOString();
  res.json({ success: true, integration: config });
});

adminRouter.post('/admin/settings/integrations/:key/test', requireAdmin(['platform_admin']), (req: Request, res: Response) => {
  const result = NotificationsService.testIntegration(req.params.key);
  res.json(result);
});

adminRouter.get('/admin/reports/summary', requireAdmin(['moderator', 'platform_admin']), (_req, res) => {
  res.json({
    institutes: db.institutes.length,
    claimed_institutes: db.institutes.filter((i) => i.claim_status === 'claimed').length,
    courses: db.courses.length,
    leads: db.leads.length,
    reviews: db.reviews.length,
    pending_claims: db.claims.filter((c) => c.status === 'pending').length,
    users: db.users.length,
  });
});
