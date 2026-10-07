/**
 * CoursePur Backend — Guides & Content Hub Routes (Part 4.1)
 */

import { Router, Request, Response } from 'express';
import { db } from '../../shared/db/database.js';

export const guidesRouter = Router();

guidesRouter.get('/guides', (_req: Request, res: Response) => {
  res.json(db.guides.filter((g) => g.is_published));
});

guidesRouter.get('/guides/:slug', (req: Request, res: Response) => {
  const guide = db.guides.find((g) => g.slug === req.params.slug && g.is_published);
  if (!guide) {
    res.status(404).json({ error: 'Guide not found.' });
    return;
  }
  res.json(guide);
});
