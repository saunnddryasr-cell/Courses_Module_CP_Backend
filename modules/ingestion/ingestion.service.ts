/**
 * CoursePur Backend — MOOC Catalog Ingestion Pipeline (Part 5)
 */

import crypto from 'crypto';
import { db } from '../../shared/db/database.js';
import { Course, IngestionJob, MoocProvider } from '../../shared/types/schema.js';
import { AppError } from '../../shared/errors/app-error.js';

export class IngestionService {
  static runProviderSync(providerId: string, customItems?: any[]): IngestionJob {
    const provider = db.mooc_providers.find((p) => p.id === providerId);
    if (!provider) throw new AppError(`Provider '${providerId}' not found.`, 404);

    const startTime = new Date().toISOString();
    let coursesAdded = 0;
    let coursesUpdated = 0;
    let coursesRemoved = 0;

    const incomingItems = customItems || [
      {
        source_course_id: `${provider.slug}_sync_01`,
        title: `${provider.name} Core Industry Curriculum`,
        instructor_name: 'Lead Mentors',
        description: 'Industry-standard curriculum synced from catalog API/scraper.',
        duration_text: '8 Weeks',
        level: 'beginner' as const,
        price: 1999,
        is_free: false,
        certificate_available: true,
        certificate_cost: 999,
        language: 'English',
        external_url: provider.website_url,
      },
    ];

    const incomingSourceIds = new Set(incomingItems.map((item) => item.source_course_id));

    for (const item of incomingItems) {
      const existing = db.courses.find((c) => c.provider_id === provider.id && c.source_course_id === item.source_course_id);
      const now = new Date().toISOString();

      if (existing) {
        // Protect manually overridden fields (Part 5.2)
        const overridden = existing.manually_overridden_fields || [];
        if (!overridden.includes('title')) existing.title = item.title;
        if (!overridden.includes('description')) existing.description = item.description;
        if (!overridden.includes('price')) existing.price = item.price;
        existing.ingestion_status = 'active';
        existing.last_synced_at = now;
        existing.updated_at = now;
        coursesUpdated += 1;
      } else {
        const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const newCourse: Course = {
          id: `crs_${crypto.randomUUID()}`,
          provider_id: provider.id,
          title: item.title,
          slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
          instructor_name: item.instructor_name,
          description: item.description,
          syllabus_text: null,
          duration_text: item.duration_text,
          level: item.level,
          price: item.price,
          is_free: item.is_free,
          certificate_available: item.certificate_available,
          certificate_cost: item.certificate_cost,
          language: item.language,
          external_url: item.external_url,
          source_course_id: item.source_course_id,
          ingestion_status: 'active',
          manually_overridden_fields: [],
          last_synced_at: now,
          created_at: now,
          updated_at: now,
        };
        db.courses.push(newCourse);
        coursesAdded += 1;
      }
    }

    // Courses present before but absent now are marked 'removed_at_source', NOT hard-deleted (Part 5.2)
    const existingCourses = db.courses.filter((c) => c.provider_id === provider.id);
    for (const c of existingCourses) {
      if (!incomingSourceIds.has(c.source_course_id) && c.ingestion_status === 'active') {
        c.ingestion_status = 'removed_at_source';
        c.updated_at = new Date().toISOString();
        coursesRemoved += 1;
      }
    }

    const job: IngestionJob = {
      id: `job_${crypto.randomUUID()}`,
      provider_id: provider.id,
      started_at: startTime,
      finished_at: new Date().toISOString(),
      courses_added: coursesAdded,
      courses_updated: coursesUpdated,
      courses_removed: coursesRemoved,
      error_count: 0,
      error_log: `Sync completed for ${provider.name}.`,
    };
    db.ingestion_jobs.push(job);
    return job;
  }
}
