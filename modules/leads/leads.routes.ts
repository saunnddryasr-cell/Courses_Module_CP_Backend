/**
 * CoursePur Backend — Leads API Routes (Part 4.3)
 */

import { Router, Request, Response } from 'express';
import { LeadsService } from './leads.service.js';

export const leadsRouter = Router();

leadsRouter.post('/leads', (req: Request, res: Response) => {
  try {
    const { verification_token, institute_id, batch_id, student_name, student_user_id, message, source_page } = req.body;

    if (!verification_token || !institute_id || !student_name) {
      res.status(400).json({ error: 'verification_token, institute_id, and student_name are required.' });
      return;
    }

    const result = LeadsService.submitLead({
      verification_token,
      institute_id,
      batch_id,
      student_name,
      student_user_id,
      message,
      source_page: source_page || 'profile',
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry lead captured and forwarded to institute.',
      lead: result.lead,
      institute_contact: result.institute_contact, // Unlocked now that lead exists!
      quality_score: result.quality_score,
    });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});
