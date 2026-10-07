/**
 * CoursePur Backend — Taxonomy & Exam Prep Hub Assembly (Part 2.2, 4.1, 7.4)
 */

import { Router, Request, Response } from 'express';
import { db } from '../../shared/db/database.js';
import { maskInstitutesForPublic } from '../../shared/security/masking.js';

export const taxonomyRouter = Router();

taxonomyRouter.get('/exam-tags', (_req: Request, res: Response) => {
  res.json(db.exam_tags.filter((t) => t.is_active));
});

// Exam Prep Hub Assembly Logic (Part 7.4):
// Joins courses, institutes (masked), learning paths, and upcoming exam key dates in one call!
taxonomyRouter.get('/prep/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug;
  const examTag = db.exam_tags.find((t) => t.slug === slug && t.is_active);

  if (!examTag) {
    res.status(404).json({ error: `Exam tag '${slug}' not found.` });
    return;
  }

  const courseIds = db.course_exam_tags.filter((cet) => cet.exam_tag_id === examTag.id).map((cet) => cet.course_id);
  const courses = db.courses.filter((c) => courseIds.includes(c.id) && c.ingestion_status === 'active');

  const instituteIds = db.institute_exam_tags.filter((iet) => iet.exam_tag_id === examTag.id).map((iet) => iet.institute_id);
  const institutes = db.institutes.filter((i) => instituteIds.includes(i.id) && i.is_active && i.operating_status !== 'permanently_closed');

  const learningPaths = db.learning_paths.filter((lp) => lp.target_exam_tag_id === examTag.id && lp.is_published);

  const keyDates = db.exam_key_dates
    .filter((d) => d.exam_tag_id === examTag.id)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  res.json({
    exam_tag: examTag,
    courses,
    institutes: maskInstitutesForPublic(institutes),
    learning_paths: learningPaths,
    upcoming_dates: keyDates,
  });
});

taxonomyRouter.get('/search', (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();

  let courses = db.courses.filter((c) => c.ingestion_status === 'active');
  let institutes = db.institutes.filter((i) => i.is_active && i.operating_status !== 'permanently_closed');

  if (q) {
    courses = courses.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    institutes = institutes.filter(
      (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.city.toLowerCase().includes(q)
    );
  }

  res.json({
    query: q,
    counts: { courses: courses.length, institutes: institutes.length },
    courses: courses.slice(0, 20),
    institutes: maskInstitutesForPublic(institutes.slice(0, 20)),
  });
});
