/**
 * CoursePur Backend — Express Application Server
 */

import express from 'express';
import cors from 'cors';
import { appRouter } from './router.js';
import { errorHandler } from './error-handler.js';
import { requestLogger } from './middleware.js';
import { db } from '../../shared/db/database.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Health check endpoint (Part 4.1)
  app.get(['/health', '/api/health', '/health/live'], (_req, res) => {
    res.json({
      status: 'ok',
      service: 'CoursePur Backend Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      entities: {
        institutes: db.institutes.length,
        courses: db.courses.length,
        users: db.users.length,
        claims: db.claims.length,
        leads: db.leads.length,
        reviews: db.reviews.length,
      },
    });
  });

  // Root endpoint serving pure headless API descriptor (no UI)
  app.get('/', (_req, res) => {
    res.json({
      service: 'CoursePur Backend API (Single Source of Truth v1)',
      status: 'online',
      version: '1.0.0',
      modules: [
        'auth (OTP & multi-persona JWT/Session)',
        'courses (MOOC catalog, compare, corrections)',
        'coaching (Institutes, batches, contact masking)',
        'claims (Hybrid risk scoring & auto-approval)',
        'reviews (Polymorphic, sentiment analysis, dispute)',
        'leads (Student inquiries & contact unlock)',
        'taxonomy (Exam Prep Hub, tags, search)',
        'collections (Saved items & public bundles)',
        'guides (Content Hub articles)',
        'exam-calendar (Key dates timeline)',
        'learning-paths (Curated roadmaps)',
        'ingestion (Coursera, Udemy, NPTEL sync)',
        'notifications (Email, SMS, WhatsApp adapters)',
        'admin (Moderation queues, platform ops, RBAC)',
      ],
      documentation: 'See README and Backend Specification v1',
    });
  });

  // Mount API endpoints both at root and with /api prefix
  app.use('/api', appRouter);
  app.use('/', appRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(` CoursePur Backend API running on port ${PORT}`);
    console.log(` Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`======================================================\n`);
  });

  return server;
}
