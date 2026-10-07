/**
 * CoursePur Backend — Global Error Handler
 */

import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500;
  console.error('[API Error]', err);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.message || 'Internal server error occurred.',
  });
}
