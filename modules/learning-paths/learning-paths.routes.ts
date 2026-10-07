/**
 * CoursePur Backend — Learning Paths Routes (Part 4.2)
 */

import { Router, Request, Response } from 'express';
import { db } from '../../shared/db/database.js';

export const learningPathsRouter = Router();

learningPathsRouter.get('/learning-paths', (_req: Request, res: Response) => {
  res.json(db.learning_paths.filter((lp) => lp.is_published));
});

learningPathsRouter.get('/learning-paths/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug;
  const path = db.learning_paths.find((lp) => (lp.slug === slug || lp.id === slug) && lp.is_published);

  if (!path) {
    res.status(404).json({ error: 'Learning path not found.' });
    return;
  }

  const steps = db.learning_path_steps
    .filter((s) => s.learning_path_id === path.id)
    .sort((a, b) => a.step_order - b.step_order)
    .map((step) => {
      const course = db.courses.find((c) => c.id === step.course_id);
      return { ...step, course };
    });

  const targetExam = path.target_exam_tag_id
    ? db.exam_tags.find((t) => t.id === path.target_exam_tag_id)
    : null;

  res.json({
    ...path,
    target_exam: targetExam,
    steps,
  });
});
