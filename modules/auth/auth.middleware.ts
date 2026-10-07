/**
 * CoursePur Backend — Authentication & RBAC Middleware (Part 3.2)
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { AdminRole, Institute, User, Claim, AdminUser } from '../../shared/types/schema.js';

declare global {
  namespace Express {
    interface Request {
      authSession?: {
        persona: 'student' | 'institute_admin' | 'admin_user';
        user?: User;
        institute?: Institute;
        claim?: Claim;
        admin_user?: Omit<AdminUser, 'password_hash'>;
      };
      instituteId?: string;
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  const rawToken = authHeader.substring(7).trim();
  const resolved = AuthService.resolveSession(rawToken);
  if (resolved) {
    req.authSession = resolved;
    if (resolved.institute) req.instituteId = resolved.institute.id;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Bearer authorization header.' });
    return;
  }

  const rawToken = authHeader.substring(7).trim();
  const resolved = AuthService.resolveSession(rawToken);
  if (!resolved) {
    res.status(401).json({ error: 'Session is invalid or expired.' });
    return;
  }

  req.authSession = resolved;
  if (resolved.institute) req.instituteId = resolved.institute.id;
  next();
}

export function requireStudent(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.authSession?.persona !== 'student') {
      res.status(403).json({ error: 'Forbidden: Student account required.' });
      return;
    }
    next();
  });
}

export function requireInstitutePanel(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.authSession?.persona !== 'institute_admin' || !req.instituteId) {
      res.status(403).json({ error: 'Forbidden: Institute admin session required.' });
      return;
    }
    next();
  });
}

export function requireAdmin(allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    requireAuth(req, res, () => {
      if (req.authSession?.persona !== 'admin_user' || !req.authSession.admin_user) {
        res.status(403).json({ error: 'Forbidden: Staff admin credentials required.' });
        return;
      }

      const role = req.authSession.admin_user.role;
      if (!allowedRoles.includes(role)) {
        res.status(403).json({
          error: `Forbidden: Role '${role}' lacks permission. Required: [${allowedRoles.join(', ')}]`,
        });
        return;
      }
      next();
    });
  };
}
