/**
 * CoursePur Backend — Exam Key Dates Calendar Routes (Part 4.1)
 */

import { Router, Request, Response } from 'express';
import { db } from '../../shared/db/database.js';

export const calendarRouter = Router();

calendarRouter.get('/calendar', (req: Request, res: Response) => {
  const examTagId = req.query.exam_tag ? String(req.query.exam_tag) : null;
  let dates = db.exam_key_dates;

  if (examTagId) {
    dates = dates.filter((d) => d.exam_tag_id === examTagId);
  }

  const hydrated = dates
    .map((d) => {
      const tag = db.exam_tags.find((t) => t.id === d.exam_tag_id);
      return {
        ...d,
        exam_name: tag ? tag.name : 'Unknown',
        exam_category: tag ? tag.category : 'other',
      };
    })
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  res.json(hydrated);
});
