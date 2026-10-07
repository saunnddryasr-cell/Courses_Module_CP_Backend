/**
 * CoursePur Backend — Saved Items & Collections Routes (Part 4.1)
 */

import { Router, Request, Response } from 'express';
import { db } from '../../shared/db/database.js';
import { requireStudent } from '../auth/auth.middleware.js';
import { maskInstituteForPublic } from '../../shared/security/masking.js';
import crypto from 'crypto';

export const collectionRouter = Router();

collectionRouter.get('/account/saved-items', requireStudent, (req: Request, res: Response) => {
  const userId = req.authSession!.user!.id;
  const items = db.saved_items.filter((s) => s.user_id === userId);

  const hydrated = items.map((s) => {
    let entityData: any = null;
    if (s.entity_type === 'course') entityData = db.courses.find((c) => c.id === s.entity_id);
    if (s.entity_type === 'institute') {
      const inst = db.institutes.find((i) => i.id === s.entity_id);
      entityData = inst ? maskInstituteForPublic(inst) : null;
    }
    return { ...s, entity: entityData };
  });

  res.json(hydrated);
});

collectionRouter.post('/saved-items', requireStudent, (req: Request, res: Response) => {
  const userId = req.authSession!.user!.id;
  const { entity_type, entity_id } = req.body;
  if (!entity_type || !entity_id) {
    res.status(400).json({ error: 'entity_type and entity_id required.' });
    return;
  }

  const existing = db.saved_items.find((s) => s.user_id === userId && s.entity_type === entity_type && s.entity_id === entity_id);
  if (existing) {
    res.json(existing);
    return;
  }

  const newItem = {
    id: `save_${crypto.randomUUID()}`,
    user_id: userId,
    entity_type,
    entity_id,
    created_at: new Date().toISOString(),
  };
  db.saved_items.push(newItem);
  res.status(201).json(newItem);
});

collectionRouter.delete('/saved-items/:id', requireStudent, (req: Request, res: Response) => {
  const userId = req.authSession!.user!.id;
  const idx = db.saved_items.findIndex((s) => s.id === req.params.id && s.user_id === userId);
  if (idx === -1) {
    res.status(404).json({ error: 'Saved item not found.' });
    return;
  }
  db.saved_items.splice(idx, 1);
  res.json({ success: true });
});

collectionRouter.get('/account/collections', requireStudent, (req: Request, res: Response) => {
  const userId = req.authSession!.user!.id;
  const cols = db.collections.filter((c) => c.user_id === userId);
  const hydrated = cols.map((col) => {
    const items = db.collection_items.filter((ci) => ci.collection_id === col.id);
    return { ...col, items_count: items.length, items };
  });
  res.json(hydrated);
});

collectionRouter.post('/account/collections', requireStudent, (req: Request, res: Response) => {
  const userId = req.authSession!.user!.id;
  const { title, is_public } = req.body;
  if (!title?.trim()) {
    res.status(400).json({ error: 'title is required.' });
    return;
  }

  const newCol = {
    id: `col_${crypto.randomUUID()}`,
    user_id: userId,
    title: title.trim(),
    is_public: Boolean(is_public),
    created_at: new Date().toISOString(),
  };
  db.collections.push(newCol);
  res.status(201).json(newCol);
});

collectionRouter.patch('/account/collections/:id', requireStudent, (req: Request, res: Response) => {
  const userId = req.authSession!.user!.id;
  const col = db.collections.find((c) => c.id === req.params.id && c.user_id === userId);
  if (!col) {
    res.status(404).json({ error: 'Collection not found.' });
    return;
  }
  if (req.body.title !== undefined) col.title = req.body.title.trim();
  if (req.body.is_public !== undefined) col.is_public = Boolean(req.body.is_public);
  res.json(col);
});

collectionRouter.delete('/account/collections/:id', requireStudent, (req: Request, res: Response) => {
  const userId = req.authSession!.user!.id;
  const idx = db.collections.findIndex((c) => c.id === req.params.id && c.user_id === userId);
  if (idx === -1) {
    res.status(404).json({ error: 'Collection not found.' });
    return;
  }
  db.collections.splice(idx, 1);
  db.collection_items = db.collection_items.filter((ci) => ci.collection_id !== req.params.id);
  res.json({ success: true });
});

collectionRouter.post('/account/collections/:id/items', requireStudent, (req: Request, res: Response) => {
  const userId = req.authSession!.user!.id;
  const col = db.collections.find((c) => c.id === req.params.id && c.user_id === userId);
  if (!col) {
    res.status(404).json({ error: 'Collection not found.' });
    return;
  }

  const { entity_type, entity_id } = req.body;
  const item = {
    id: `coli_${crypto.randomUUID()}`,
    collection_id: col.id,
    entity_type,
    entity_id,
    added_at: new Date().toISOString(),
  };
  db.collection_items.push(item);
  res.status(201).json(item);
});

// Public view of collection (Part 4.1 shareable target)
collectionRouter.get('/collections/:id/public', (req: Request, res: Response) => {
  const col = db.collections.find((c) => c.id === req.params.id);
  if (!col || !col.is_public) {
    res.status(404).json({ error: 'Public collection not found.' });
    return;
  }

  const items = db.collection_items.filter((ci) => ci.collection_id === col.id);
  const hydrated = items.map((ci) => {
    let entityData: any = null;
    if (ci.entity_type === 'course') entityData = db.courses.find((c) => c.id === ci.entity_id);
    if (ci.entity_type === 'institute') {
      const inst = db.institutes.find((i) => i.id === ci.entity_id);
      entityData = inst ? maskInstituteForPublic(inst) : null;
    }
    return { ...ci, entity: entityData };
  });

  res.json({ collection: col, items: hydrated });
});
