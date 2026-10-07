/**
 * CoursePur Backend — Institute Admin Panel Routes (Part 4.4)
 */

import { Router, Request, Response } from 'express';
import { db } from '../../shared/db/database.js';
import { requireInstitutePanel } from '../auth/auth.middleware.js';
import { ClaimsService } from '../claims/claims.service.js';
import crypto from 'crypto';

export const panelRouter = Router();

panelRouter.use(requireInstitutePanel);

panelRouter.get('/institute', (req: Request, res: Response) => {
  const instituteId = req.instituteId!;
  const institute = db.institutes.find((i) => i.id === instituteId);
  if (!institute) {
    res.status(404).json({ error: 'Institute not found.' });
    return;
  }
  // Unmasked profile to owner (Part 7.5 exception 1)
  res.json(institute);
});

panelRouter.patch('/institute', (req: Request, res: Response) => {
  const instituteId = req.instituteId!;
  const institute = db.institutes.find((i) => i.id === instituteId);
  if (!institute) {
    res.status(404).json({ error: 'Institute not found.' });
    return;
  }

  const { name, phone, email, description, locality, address, latitude, longitude, mode, fee_range_min, fee_range_max, photos, video_url, faculty, results_claims } = req.body;

  if (name && name.trim() !== institute.name) {
    res.status(400).json({
      error: 'Name changes cannot be updated directly from the panel. Submit a verified name change to platform moderation.',
    });
    return;
  }

  const now = new Date().toISOString();

  if (fee_range_min && Math.abs(fee_range_min - institute.fee_range_min) > 50000) {
    ClaimsService.flagDrasticChangeForAudit(institute.id, 'Drastic fee range modification');
  }

  if (description !== undefined) institute.description = description;
  if (locality !== undefined) institute.locality = locality;
  if (address !== undefined) institute.address = address;
  if (latitude !== undefined) institute.latitude = latitude;
  if (longitude !== undefined) institute.longitude = longitude;
  if (mode !== undefined) institute.mode = mode;
  if (fee_range_min !== undefined) institute.fee_range_min = Number(fee_range_min);
  if (fee_range_max !== undefined) institute.fee_range_max = Number(fee_range_max);
  if (photos !== undefined) institute.photos = photos;
  if (video_url !== undefined) institute.video_url = video_url;
  if (faculty !== undefined) institute.faculty = faculty;
  if (results_claims !== undefined) institute.results_claims = results_claims;
  if (phone !== undefined) institute.phone = phone;
  if (email !== undefined) institute.email = email;

  institute.updated_at = now;
  institute.last_updated_by_institute_at = now;

  res.json({ success: true, institute });
});

panelRouter.get('/batches', (req: Request, res: Response) => {
  const instituteId = req.instituteId!;
  const batches = db.institute_batches.filter((b) => b.institute_id === instituteId);
  res.json(batches);
});

panelRouter.post('/batches', (req: Request, res: Response) => {
  const instituteId = req.instituteId!;
  const { name, fee, duration, mode, schedule_text, start_date, description, exam_tag_id } = req.body;

  if (!name || fee === undefined || !duration || !exam_tag_id) {
    res.status(400).json({ error: 'name, fee, duration, and exam_tag_id are required.' });
    return;
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newBatch = {
    id: `batch_${crypto.randomUUID()}`,
    institute_id: instituteId,
    name: name.trim(),
    slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
    fee: Number(fee),
    duration: duration.trim(),
    mode: mode || 'hybrid',
    schedule_text: schedule_text || '',
    start_date: start_date || null,
    description: description || '',
    exam_tag_id,
    is_archived: false,
  };

  db.institute_batches.push(newBatch);
  res.status(201).json(newBatch);
});

panelRouter.patch('/batches/:id', (req: Request, res: Response) => {
  const instituteId = req.instituteId!;
  const batch = db.institute_batches.find((b) => b.id === req.params.id && b.institute_id === instituteId);
  if (!batch) {
    res.status(404).json({ error: 'Batch not found.' });
    return;
  }

  const { name, fee, duration, mode, schedule_text, start_date, description, is_archived } = req.body;
  if (name !== undefined) batch.name = name;
  if (fee !== undefined) batch.fee = Number(fee);
  if (duration !== undefined) batch.duration = duration;
  if (mode !== undefined) batch.mode = mode;
  if (schedule_text !== undefined) batch.schedule_text = schedule_text;
  if (start_date !== undefined) batch.start_date = start_date;
  if (description !== undefined) batch.description = description;
  if (is_archived !== undefined) batch.is_archived = Boolean(is_archived);

  res.json(batch);
});

panelRouter.get('/leads', (req: Request, res: Response) => {
  const instituteId = req.instituteId!;
  const leads = db.leads.filter((l) => l.institute_id === instituteId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json(leads);
});

panelRouter.patch('/leads/:id', (req: Request, res: Response) => {
  const instituteId = req.instituteId!;
  const lead = db.leads.find((l) => l.id === req.params.id && l.institute_id === instituteId);
  if (!lead) {
    res.status(404).json({ error: 'Lead not found.' });
    return;
  }
  if (req.body.contacted_by_institute !== undefined) {
    lead.contacted_by_institute = Boolean(req.body.contacted_by_institute);
  }
  res.json({ success: true, lead });
});
