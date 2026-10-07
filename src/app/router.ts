/**
 * CoursePur Backend — Central API Router
 */

import { Router } from 'express';
import { authRouter } from '../../modules/auth/auth.routes.js';
import { coursesRouter } from '../../modules/courses/courses.routes.js';
import { coachingRouter } from '../../modules/coaching/coaching.routes.js';
import { panelRouter } from '../../modules/coaching/panel.routes.js';
import { reviewsRouter } from '../../modules/reviews/reviews.routes.js';
import { leadsRouter } from '../../modules/leads/leads.routes.js';
import { taxonomyRouter } from '../../modules/taxonomy/taxonomy.routes.js';
import { collectionRouter } from '../../modules/collection/collection.routes.js';
import { guidesRouter } from '../../modules/guides/guides.routes.js';
import { calendarRouter } from '../../modules/exam-calendar/calendar.routes.js';
import { learningPathsRouter } from '../../modules/learning-paths/learning-paths.routes.js';
import { adminRouter } from '../../modules/admin/admin.routes.js';

export const appRouter = Router();

// Mount all modular routes
appRouter.use(authRouter);
appRouter.use(coursesRouter);
appRouter.use(coachingRouter);
appRouter.use('/panel', panelRouter);
appRouter.use(reviewsRouter);
appRouter.use(leadsRouter);
appRouter.use(taxonomyRouter);
appRouter.use(collectionRouter);
appRouter.use(guidesRouter);
appRouter.use(calendarRouter);
appRouter.use(learningPathsRouter);
appRouter.use(adminRouter);
