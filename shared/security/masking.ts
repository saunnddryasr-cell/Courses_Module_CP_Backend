/**
 * CoursePur Backend — Serialization Layer Contact Masking (Part 7.5)
 */

import { Institute } from '../types/schema.js';

export type PublicInstitute = Omit<Institute, 'phone' | 'email' | 'moderation_notes'> & {
  phone_masked: boolean;
  email_masked: boolean;
};

export function maskInstituteForPublic(institute: Institute): PublicInstitute {
  const { phone: _p, email: _e, moderation_notes: _m, ...publicFields } = institute;
  return {
    ...publicFields,
    phone_masked: true,
    email_masked: true,
  };
}

export function maskInstitutesForPublic(institutes: Institute[]): PublicInstitute[] {
  return institutes.map(maskInstituteForPublic);
}
