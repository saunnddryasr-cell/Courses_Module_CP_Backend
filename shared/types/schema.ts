/**
 * CoursePur Backend — Database Schema & Domain Types
 * Single Source of Truth matching Part 2 of Backend Specification v1
 */

// ==========================================
// 2.1 SHARED / IDENTITY
// ==========================================

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  google_id: string | null;
  name: string;
  primary_goal_exam_tag_id: string | null;
  referred_by_user_id: string | null; // Attribution only (Part 7.6)
  created_at: string;
}

export type AdminRole = 'content_ops' | 'moderator' | 'platform_admin';

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
}

export type OtpPurpose = 'login' | 'claim' | 'review' | 'lead';

export interface OtpVerification {
  id: string;
  phone: string;
  otp_code_hash: string;
  purpose: OtpPurpose;
  expires_at: string;
  verified_at: string | null;
  attempt_count: number;
}

export interface VerificationToken {
  token: string;
  phone: string;
  purpose: OtpPurpose;
  expires_at: string;
  used: boolean;
}

export interface Session {
  id: string;
  user_id: string | null;
  admin_user_id: string | null;
  institute_claim_id: string | null;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

// ==========================================
// 2.2 TAXONOMY (SHARED ACROSS BOTH VERTICALS)
// ==========================================

export type ExamCategory =
  | 'government_exam'
  | 'entrance_exam'
  | 'study_abroad'
  | 'professional_cert'
  | 'skill_training';

export interface ExamTag {
  id: string;
  name: string;
  category: ExamCategory;
  slug: string;
  description: string;
  is_active: boolean;
}

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

// ==========================================
// 2.3 COACHING / INSTITUTE MODULE
// ==========================================

export type InstituteMode = 'online' | 'offline' | 'hybrid';
export type OperatingStatus = 'active' | 'temporarily_closed' | 'permanently_closed';
export type ClaimStatus = 'unclaimed' | 'claimed' | 'pending_verification';
export type VerifiedVia = 'none' | 'otp' | 'document';
export type InstituteSource = 'manual_seed' | 'claimed_self_entry';

export interface FacultyMember {
  name: string;
  credential: string;
  photo_url?: string;
}

export interface Institute {
  id: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  locality: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string; // MASKED in public responses (Part 7.5)
  email: string; // MASKED in public responses (Part 7.5)
  mode: InstituteMode;
  category: ExamCategory;
  fee_range_min: number;
  fee_range_max: number;
  photos: string[];
  video_url: string | null;
  faculty: FacultyMember[];
  results_claims: string;
  established_year: number | null;
  operating_status: OperatingStatus;
  claim_status: ClaimStatus;
  verified_via: VerifiedVia;
  source: InstituteSource;
  moderation_notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_updated_by_institute_at: string;
}

export interface InstituteExamTag {
  institute_id: string;
  exam_tag_id: string;
}

export interface InstituteBatch {
  id: string;
  institute_id: string;
  name: string;
  slug: string;
  fee: number;
  duration: string;
  mode: InstituteMode;
  schedule_text: string;
  start_date: string | null;
  description: string;
  exam_tag_id: string;
  is_archived: boolean;
}

export type ClaimDecisionStatus = 'pending' | 'auto_approved' | 'approved' | 'rejected' | 'revoked';
export type ClaimReviewMode = 'auto' | 'manual';

export interface Claim {
  id: string;
  institute_id: string;
  claimant_name: string;
  claimant_phone: string;
  claimant_ip: string;
  claimant_device_fingerprint: string;
  otp_verified_at: string;
  status: ClaimDecisionStatus;
  review_mode: ClaimReviewMode;
  risk_score: number;
  risk_signals: string[];
  decided_by_admin_id: string | null;
  decided_at: string | null;
  revoked_reason: string | null;
  created_at: string;
}

export type AuditOutcome = 'confirmed_legitimate' | 'confirmed_fraudulent' | 'inconclusive';

export interface ClaimAuditSample {
  id: string;
  claim_id: string;
  sampled_at: string;
  reviewed_by_admin_id: string | null;
  outcome: AuditOutcome | null;
  notes: string;
}

// ==========================================
// 2.4 COURSES / MOOC MODULE
// ==========================================

export type IngestionMethod = 'api' | 'scrape' | 'manual';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type IngestionStatus = 'active' | 'stale' | 'removed_at_source';

export interface AffiliateProgram {
  id: string;
  provider_id: string;
  name: string;
  param_key: string;
  commission_rate: string;
}

export interface MoocProvider {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  description: string;
  ingestion_method: IngestionMethod;
  website_url: string;
  affiliate_program_id: string | null;
}

export interface Course {
  id: string;
  provider_id: string;
  title: string;
  slug: string;
  instructor_name: string;
  description: string;
  syllabus_text: string | null;
  duration_text: string;
  level: CourseLevel;
  price: number | null;
  is_free: boolean;
  certificate_available: boolean;
  certificate_cost: number | null;
  language: string;
  external_url: string;
  source_course_id: string;
  ingestion_status: IngestionStatus;
  manually_overridden_fields: string[];
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface CourseExamTag {
  course_id: string;
  exam_tag_id: string;
}

export interface CourseCategoryMap {
  course_id: string;
  course_category_id: string;
}

export type CorrectionStatus = 'pending' | 'approved' | 'rejected';

export interface CorrectionSubmission {
  id: string;
  course_id: string;
  submitted_field: string;
  suggested_value: string;
  submitter_note: string;
  status: CorrectionStatus;
  created_at: string;
}

export interface LearningPath {
  id: string;
  title: string;
  slug: string;
  target_exam_tag_id: string | null;
  description: string;
  is_published: boolean;
}

export interface LearningPathStep {
  id: string;
  learning_path_id: string;
  course_id: string;
  step_order: number;
  rationale_text: string;
}

export interface IngestionJob {
  id: string;
  provider_id: string;
  started_at: string;
  finished_at: string | null;
  courses_added: number;
  courses_updated: number;
  courses_removed: number;
  error_count: number;
  error_log: string;
}

// ==========================================
// 2.5 SHARED ENGAGEMENT LAYER
// ==========================================

export type EntityType = 'course' | 'mooc_provider' | 'institute';
export type DisputeStatus = 'none' | 'disputed' | 'resolved_kept' | 'resolved_removed';
export type DisputeReason = 'fake_spam' | 'factually_incorrect' | 'policy_violation';
export type ReviewStatus = 'visible' | 'flagged' | 'removed';

export interface Review {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  reviewer_user_id: string | null;
  reviewer_phone: string;
  otp_verified_at: string;
  rating: number;
  body_text: string;
  institute_response: string | null;
  institute_response_at: string | null;
  dispute_status: DisputeStatus;
  dispute_reason: DisputeReason | null;
  dispute_note: string | null;
  status: ReviewStatus;
  created_at: string;
}

export type LeadSourcePage = 'profile' | 'batch' | 'compare' | 'search_result';

export interface Lead {
  id: string;
  institute_id: string;
  batch_id: string | null;
  student_name: string;
  student_phone: string;
  student_user_id: string | null;
  message: string;
  source_page: LeadSourcePage;
  contacted_by_institute: boolean;
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  entity_type: 'course' | 'institute';
  entity_id: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  title: string;
  is_public: boolean;
  created_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  entity_type: 'course' | 'institute';
  entity_id: string;
  added_at: string;
}

export interface Guide {
  id: string;
  title: string;
  slug: string;
  body: string;
  exam_tag_id: string | null;
  author_admin_id: string;
  is_published: boolean;
  published_at: string | null;
}

export interface ExamKeyDate {
  id: string;
  exam_tag_id: string;
  event_name: string;
  event_date: string;
  notes: string | null;
  created_by_admin_id: string;
}

export type NotificationType =
  | 'new_lead'
  | 'new_review'
  | 'profile_stale_nudge'
  | 'saved_course_price_drop'
  | 'saved_institute_new_batch'
  | 'exam_deadline_reminder';

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export interface Notification {
  id: string;
  user_id: string | null;
  recipient_type: 'student' | 'institute';
  type: NotificationType;
  payload: Record<string, unknown>;
  sent_via: NotificationChannel;
  sent_at: string;
}

export interface AuditLog {
  id: string;
  actor_type: 'admin_user' | 'institute_claim' | 'system';
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export type IntegrationCategory = 'ai_tools' | 'messaging' | 'payment' | 'search' | 'maps' | 'other';
export type IntegrationTestStatus = 'untested' | 'success' | 'failed';

export interface IntegrationConfig {
  id: string;
  key: string;
  category: IntegrationCategory;
  display_name: string;
  provider_name: string;
  is_enabled: boolean;
  is_required: boolean;
  credentials_encrypted: string;
  config_json: Record<string, unknown>;
  last_tested_at: string | null;
  last_test_status: IntegrationTestStatus;
  updated_by_admin_id: string | null;
  updated_at: string;
}
