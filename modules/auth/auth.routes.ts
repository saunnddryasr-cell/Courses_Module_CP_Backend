/**
 * CoursePur Backend — Authentication Controller & Routes
 */

import { Router, Request, Response } from 'express';
import { OtpService } from './otp.service.js';
import { AuthService } from './auth.service.js';
import { optionalAuth } from './auth.middleware.js';
import { maskInstituteForPublic } from '../../shared/security/masking.js';

export const authRouter = Router();

authRouter.post('/otp/request', (req: Request, res: Response) => {
  const { phone, purpose } = req.body;
  if (!phone || !purpose) {
    res.status(400).json({ error: 'phone and purpose are required.' });
    return;
  }
  const result = OtpService.requestOtp(phone, purpose);
  res.json(result);
});

authRouter.post('/otp/verify', (req: Request, res: Response) => {
  const { phone, code, purpose } = req.body;
  if (!phone || !code || !purpose) {
    res.status(400).json({ error: 'phone, code, and purpose are required.' });
    return;
  }
  const result = OtpService.verifyOtp(phone, code, purpose);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

authRouter.post('/auth/login', (req: Request, res: Response) => {
  const {
    persona,
    verification_token,
    phone,
    google_id,
    email,
    password,
    name,
    primary_goal_exam_tag_id,
    referred_by_user_id,
    institute_id,
  } = req.body;

  if (persona === 'institute_admin') {
    if (!verification_token) {
      res.status(400).json({ error: 'verification_token required for institute admin login.' });
      return;
    }
    const sessionRes = AuthService.loginInstituteAdmin({ verification_token, institute_id });
    res.json(sessionRes);
    return;
  }

  if (persona === 'admin_user') {
    if (!email || !password) {
      res.status(400).json({ error: 'email and password required for admin login.' });
      return;
    }
    const sessionRes = AuthService.loginAdminUser({ email, password });
    res.json(sessionRes);
    return;
  }

  const sessionRes = AuthService.loginStudent({
    verification_token,
    phone,
    google_id,
    email,
    name,
    primary_goal_exam_tag_id,
    referred_by_user_id,
  });
  res.json(sessionRes);
});

authRouter.get('/auth/me', optionalAuth, (req: Request, res: Response) => {
  if (!req.authSession) {
    res.json({ authenticated: false, session: null });
    return;
  }
  res.json({
    authenticated: true,
    persona: req.authSession.persona,
    user: req.authSession.user,
    institute: req.authSession.institute ? maskInstituteForPublic(req.authSession.institute) : undefined,
    admin_user: req.authSession.admin_user,
  });
});

authRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    AuthService.logout(authHeader.substring(7).trim());
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});
