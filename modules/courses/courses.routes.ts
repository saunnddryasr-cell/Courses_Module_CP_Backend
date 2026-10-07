/**
 * CoursePur Backend — Courses Module Routes (Part 4.2)
 */

import { Router, Request, Response } from 'express';
import { db } from '../../shared/db/database.js';
import crypto from 'crypto';

export const coursesRouter = Router();

coursesRouter.get('/courses', (req: Request, res: Response) => {
  const { category, provider, level, is_free, certificate, language, exam_tag, q } = req.query;

  let list = db.courses.filter((c) => c.ingestion_status === 'active');

  if (provider) {
    const prov = db.mooc_providers.find((p) => p.slug === provider || p.id === provider);
    if (prov) list = list.filter((c) => c.provider_id === prov.id);
  }

  if (level) list = list.filter((c) => c.level === level);
  if (is_free !== undefined) list = list.filter((c) => c.is_free === (is_free === 'true'));
  if (certificate !== undefined) list = list.filter((c) => c.certificate_available === (certificate === 'true'));
  if (language) list = list.filter((c) => c.language.toLowerCase() === String(language).toLowerCase());

  if (exam_tag) {
    const tag = db.exam_tags.find((t) => t.slug === exam_tag || t.id === exam_tag);
    if (tag) {
      const courseIds = db.course_exam_tags.filter((t) => t.exam_tag_id === tag.id).map((t) => t.course_id);
      list = list.filter((c) => courseIds.includes(c.id));
    }
  }

  if (category) {
    const cat = db.course_categories.find((cc) => cc.slug === category || cc.id === category);
    if (cat) {
      const courseIds = db.course_category_map.filter((m) => m.course_category_id === cat.id).map((m) => m.course_id);
      list = list.filter((c) => courseIds.includes(c.id));
    }
  }

  if (q) {
    const qStr = String(q).toLowerCase();
    list = list.filter(
      (c) => c.title.toLowerCase().includes(qStr) || c.description.toLowerCase().includes(qStr) || c.instructor_name.toLowerCase().includes(qStr)
    );
  }

  const hydrated = list.map((c) => {
    const prov = db.mooc_providers.find((p) => p.id === c.provider_id);
    return { ...c, provider: prov ? { id: prov.id, name: prov.name, slug: prov.slug, logo_url: prov.logo_url } : null };
  });

  res.json({ total: hydrated.length, courses: hydrated });
});

coursesRouter.get('/courses/compare', (req: Request, res: Response) => {
  const idsStr = String(req.query.ids || '');
  const ids = idsStr.split(',').map((id) => id.trim()).filter(Boolean);

  if (ids.length === 0) {
    res.status(400).json({ error: "Query parameter 'ids' is required (comma-separated)." });
    return;
  }

  const matches = db.courses
    .filter((c) => ids.includes(c.id) || ids.includes(c.slug))
    .map((c) => {
      const prov = db.mooc_providers.find((p) => p.id === c.provider_id);
      return { ...c, provider: prov ? { id: prov.id, name: prov.name, slug: prov.slug, logo_url: prov.logo_url } : null };
    });

  res.json(matches);
});

coursesRouter.get('/courses/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug;
  const course = db.courses.find((c) => c.slug === slug || c.id === slug);

  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const provider = db.mooc_providers.find((p) => p.id === course.provider_id);
  const examTags = db.course_exam_tags
    .filter((cet) => cet.course_id === course.id)
    .map((cet) => db.exam_tags.find((t) => t.id === cet.exam_tag_id))
    .filter(Boolean);

  res.json({ ...course, provider, exam_tags: examTags });
});

coursesRouter.post('/courses/:id/corrections', (req: Request, res: Response) => {
  const courseId = req.params.id;
  const course = db.courses.find((c) => c.id === courseId || c.slug === courseId);

  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const { submitted_field, suggested_value, submitter_note } = req.body;
  if (!submitted_field || !suggested_value) {
    res.status(400).json({ error: 'submitted_field and suggested_value are required.' });
    return;
  }

  const correction = {
    id: `cor_${crypto.randomUUID()}`,
    course_id: course.id,
    submitted_field,
    suggested_value,
    submitter_note: submitter_note || '',
    status: 'pending' as const,
    created_at: new Date().toISOString(),
  };

  db.correction_submissions.push(correction);
  res.status(201).json({ success: true, correction });
});

coursesRouter.get('/providers', (_req: Request, res: Response) => {
  const providers = db.mooc_providers.map((p) => {
    const courseCount = db.courses.filter((c) => c.provider_id === p.id && c.ingestion_status === 'active').length;
    return { ...p, active_courses_count: courseCount };
  });
  res.json(providers);
});

coursesRouter.get('/providers/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug;
  const provider = db.mooc_providers.find((p) => p.slug === slug || p.id === slug);

  if (!provider) {
    res.status(404).json({ error: 'Provider not found.' });
    return;
  }

  const courseCount = db.courses.filter((c) => c.provider_id === provider.id && c.ingestion_status === 'active').length;
  res.json({ ...provider, active_courses_count: courseCount });
});

coursesRouter.get('/providers/:slug/courses', (req: Request, res: Response) => {
  const slug = req.params.slug;
  const provider = db.mooc_providers.find((p) => p.slug === slug || p.id === slug);

  if (!provider) {
    res.status(404).json({ error: 'Provider not found.' });
    return;
  }

  const courses = db.courses.filter((c) => c.provider_id === provider.id && c.ingestion_status === 'active');
  res.json({ provider, courses });
});
