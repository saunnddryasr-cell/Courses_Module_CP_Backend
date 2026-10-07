/**
 * CoursePur Backend — In-Memory Database Store & Seed Data
 */

import {
  User,
  AdminUser,
  OtpVerification,
  VerificationToken,
  Session,
  ExamTag,
  CourseCategory,
  Institute,
  InstituteExamTag,
  InstituteBatch,
  Claim,
  ClaimAuditSample,
  MoocProvider,
  Course,
  CourseExamTag,
  CourseCategoryMap,
  CorrectionSubmission,
  LearningPath,
  LearningPathStep,
  IngestionJob,
  Review,
  Lead,
  SavedItem,
  Collection,
  CollectionItem,
  Guide,
  ExamKeyDate,
  Notification,
  AuditLog,
  IntegrationConfig,
  AffiliateProgram,
} from '../types/schema.js';
import { hashPassword, encryptSecret } from '../security/crypto.js';

export class DatabaseStore {
  users: User[] = [];
  admin_users: AdminUser[] = [];
  otp_verifications: OtpVerification[] = [];
  verification_tokens: VerificationToken[] = [];
  sessions: Session[] = [];

  exam_tags: ExamTag[] = [];
  course_categories: CourseCategory[] = [];

  institutes: Institute[] = [];
  institute_exam_tags: InstituteExamTag[] = [];
  institute_batches: InstituteBatch[] = [];
  claims: Claim[] = [];
  claim_audit_samples: ClaimAuditSample[] = [];

  mooc_providers: MoocProvider[] = [];
  affiliate_programs: AffiliateProgram[] = [];
  courses: Course[] = [];
  course_exam_tags: CourseExamTag[] = [];
  course_category_map: CourseCategoryMap[] = [];
  correction_submissions: CorrectionSubmission[] = [];
  learning_paths: LearningPath[] = [];
  learning_path_steps: LearningPathStep[] = [];
  ingestion_jobs: IngestionJob[] = [];

  reviews: Review[] = [];
  leads: Lead[] = [];
  saved_items: SavedItem[] = [];
  collections: Collection[] = [];
  collection_items: CollectionItem[] = [];
  guides: Guide[] = [];
  exam_key_dates: ExamKeyDate[] = [];
  notifications: Notification[] = [];
  audit_logs: AuditLog[] = [];
  integration_configs: IntegrationConfig[] = [];

  constructor() {
    this.seed();
  }

  seed(): void {
    const now = new Date().toISOString();

    // 1. Admin Users
    this.admin_users = [
      {
        id: 'admin_usr_01',
        email: 'admin@coursepur.com',
        name: 'Super Admin',
        password_hash: hashPassword('Admin@123'),
        role: 'platform_admin',
        is_active: true,
        created_at: now,
      },
      {
        id: 'admin_usr_02',
        email: 'moderator@coursepur.com',
        name: 'Trust Moderator',
        password_hash: hashPassword('Moderator@123'),
        role: 'moderator',
        is_active: true,
        created_at: now,
      },
      {
        id: 'admin_usr_03',
        email: 'content@coursepur.com',
        name: 'Content Ops Specialist',
        password_hash: hashPassword('Content@123'),
        role: 'content_ops',
        is_active: true,
        created_at: now,
      },
    ];

    // 2. Exam Tags
    this.exam_tags = [
      {
        id: 'tag_upsc',
        name: 'UPSC Civil Services',
        category: 'government_exam',
        slug: 'upsc',
        description: 'Comprehensive preparation for IAS, IPS, and IFS civil services examinations.',
        is_active: true,
      },
      {
        id: 'tag_jee',
        name: 'JEE Main & Advanced',
        category: 'entrance_exam',
        slug: 'jee',
        description: 'Engineering entrance examinations for premier IITs and NITs.',
        is_active: true,
      },
      {
        id: 'tag_neet',
        name: 'NEET UG',
        category: 'entrance_exam',
        slug: 'neet',
        description: 'National Eligibility Entrance Test for medical undergraduate admissions.',
        is_active: true,
      },
      {
        id: 'tag_ielts',
        name: 'IELTS Academic',
        category: 'study_abroad',
        slug: 'ielts',
        description: 'English proficiency testing for study abroad and global migration.',
        is_active: true,
      },
      {
        id: 'tag_cfa',
        name: 'CFA Level 1',
        category: 'professional_cert',
        slug: 'cfa',
        description: 'Chartered Financial Analyst credential covering global investment analysis.',
        is_active: true,
      },
      {
        id: 'tag_fullstack',
        name: 'Full Stack Web Development',
        category: 'skill_training',
        slug: 'fullstack-web-dev',
        description: 'Modern front-end, back-end, database, and cloud engineering skills.',
        is_active: true,
      },
    ];

    // 3. Course Categories
    this.course_categories = [
      { id: 'cat_prog', name: 'Programming & CS', slug: 'programming', parent_id: null },
      { id: 'cat_data', name: 'Data Science & AI', slug: 'data-science', parent_id: null },
      { id: 'cat_finance', name: 'Finance & Accounting', slug: 'finance', parent_id: null },
      { id: 'cat_testprep', name: 'Test Preparation', slug: 'test-prep', parent_id: null },
      { id: 'cat_lang', name: 'Language Learning', slug: 'languages', parent_id: null },
    ];

    // 4. Sample Users (Students)
    this.users = [
      {
        id: 'usr_student_01',
        phone: '9876543210',
        email: 'rahul.student@example.com',
        google_id: null,
        name: 'Rahul Sharma',
        primary_goal_exam_tag_id: 'tag_upsc',
        referred_by_user_id: null,
        created_at: now,
      },
      {
        id: 'usr_student_02',
        phone: '9812345678',
        email: 'ananya.sen@example.com',
        google_id: 'goog_123456789',
        name: 'Ananya Sen',
        primary_goal_exam_tag_id: 'tag_jee',
        referred_by_user_id: 'usr_student_01',
        created_at: now,
      },
    ];

    // 5. Providers & Affiliate Programs
    this.affiliate_programs = [
      {
        id: 'aff_coursera',
        provider_id: 'prov_coursera',
        name: 'Coursera Impact Network',
        param_key: 'ranMID=40335',
        commission_rate: '15-45%',
      },
    ];

    this.mooc_providers = [
      {
        id: 'prov_coursera',
        name: 'Coursera',
        slug: 'coursera',
        logo_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop',
        description: 'Online learning platform offering degrees, specializations, and university courses.',
        ingestion_method: 'api',
        website_url: 'https://www.coursera.org',
        affiliate_program_id: 'aff_coursera',
      },
      {
        id: 'prov_udemy',
        name: 'Udemy',
        slug: 'udemy',
        logo_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=128&auto=format&fit=crop',
        description: 'Global teaching marketplace connecting millions of learners to practical skills.',
        ingestion_method: 'scrape',
        website_url: 'https://www.udemy.com',
        affiliate_program_id: null,
      },
      {
        id: 'prov_edx',
        name: 'edX',
        slug: 'edx',
        logo_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=128&auto=format&fit=crop',
        description: 'Online learning destination founded by Harvard and MIT.',
        ingestion_method: 'manual',
        website_url: 'https://www.edx.org',
        affiliate_program_id: null,
      },
      {
        id: 'prov_nptel',
        name: 'NPTEL (IITs & IISc)',
        slug: 'nptel',
        logo_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=128&auto=format&fit=crop',
        description: 'National Programme on Technology Enhanced Learning by Indian Institutes of Technology.',
        ingestion_method: 'scrape',
        website_url: 'https://nptel.ac.in',
        affiliate_program_id: null,
      },
    ];

    // 6. Courses
    this.courses = [
      {
        id: 'crs_01',
        provider_id: 'prov_coursera',
        title: 'Machine Learning Specialization',
        slug: 'machine-learning-specialization',
        instructor_name: 'Andrew Ng',
        description: 'Master fundamental AI concepts and build practical machine learning skills.',
        syllabus_text: 'Supervised Learning, Neural Networks, Unsupervised Learning, Recommender Systems.',
        duration_text: '3 months at 10 hours/week',
        level: 'beginner',
        price: 3999,
        is_free: false,
        certificate_available: true,
        certificate_cost: 3999,
        language: 'English',
        external_url: 'https://www.coursera.org/specializations/machine-learning-introduction',
        source_course_id: 'coursera_ml_spec_v2',
        ingestion_status: 'active',
        manually_overridden_fields: [],
        last_synced_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'crs_02',
        provider_id: 'prov_coursera',
        title: 'Python for Everybody Specialization',
        slug: 'python-for-everybody',
        instructor_name: 'Charles Severance (Dr. Chuck)',
        description: 'Learn to Program and Analyze Data with Python.',
        syllabus_text: 'Programming basics, Data structures, Web scraping, Databases.',
        duration_text: '4 months at 6 hours/week',
        level: 'beginner',
        price: null,
        is_free: true,
        certificate_available: true,
        certificate_cost: 2999,
        language: 'English',
        external_url: 'https://www.coursera.org/specializations/python',
        source_course_id: 'coursera_py4e_01',
        ingestion_status: 'active',
        manually_overridden_fields: [],
        last_synced_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'crs_03',
        provider_id: 'prov_udemy',
        title: 'The Complete 2026 Web Development Bootcamp',
        slug: 'complete-web-development-bootcamp',
        instructor_name: 'Dr. Angela Yu',
        description: 'Become a Full-Stack Web Developer with HTML, CSS, Javascript, Node, React, and MongoDB.',
        syllabus_text: 'Frontend basics, backend APIs, authentication, full stack projects.',
        duration_text: '65.5 hours on-demand video',
        level: 'beginner',
        price: 599,
        is_free: false,
        certificate_available: true,
        certificate_cost: 0,
        language: 'English',
        external_url: 'https://www.udemy.com/course/the-complete-web-development-bootcamp/',
        source_course_id: 'udemy_angela_webbootcamp',
        ingestion_status: 'active',
        manually_overridden_fields: [],
        last_synced_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'crs_04',
        provider_id: 'prov_nptel',
        title: 'Constitutional Law & Governance in India',
        slug: 'constitutional-law-governance-india',
        instructor_name: 'Prof. Ramesh K. (NLSIU)',
        description: 'Study of Indian Constitution, Fundamental Rights, and Judicial Architecture for UPSC Aspirants.',
        syllabus_text: 'Preamble, Fundamental Rights, Union Executive, Judicial Review.',
        duration_text: '12 Weeks',
        level: 'intermediate',
        price: 0,
        is_free: true,
        certificate_available: true,
        certificate_cost: 1000,
        language: 'English',
        external_url: 'https://nptel.ac.in/courses/109105123',
        source_course_id: 'nptel_law_2026',
        ingestion_status: 'active',
        manually_overridden_fields: ['syllabus_text'],
        last_synced_at: now,
        created_at: now,
        updated_at: now,
      },
    ];

    this.course_exam_tags = [
      { course_id: 'crs_01', exam_tag_id: 'tag_fullstack' },
      { course_id: 'crs_03', exam_tag_id: 'tag_fullstack' },
      { course_id: 'crs_04', exam_tag_id: 'tag_upsc' },
    ];

    this.course_category_map = [
      { course_id: 'crs_01', course_category_id: 'cat_data' },
      { course_id: 'crs_02', course_category_id: 'cat_prog' },
      { course_id: 'crs_03', course_category_id: 'cat_prog' },
      { course_id: 'crs_04', course_category_id: 'cat_testprep' },
    ];

    // 7. Institutes (Coaching)
    this.institutes = [
      {
        id: 'inst_vision_ias',
        name: 'Vision IAS',
        slug: 'vision-ias',
        description: 'India premier research and training institute for Civil Services Examination (UPSC CSE).',
        city: 'Delhi',
        locality: 'Karol Bagh',
        address: 'B-19, Pusa Road, Karol Bagh, New Delhi 110005',
        latitude: 28.6448,
        longitude: 77.1895,
        phone: '918448449550',
        email: 'info@visionias.in',
        mode: 'hybrid',
        category: 'government_exam',
        fee_range_min: 125000,
        fee_range_max: 215000,
        photos: [
          'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop',
        ],
        video_url: null,
        faculty: [
          { name: 'Ajay Kumar', credential: 'M.A. Political Science, 14 yrs UPSC exp' },
        ],
        results_claims: 'Over 650+ selections in UPSC CSE 2024.',
        established_year: 2008,
        operating_status: 'active',
        claim_status: 'claimed',
        verified_via: 'otp',
        source: 'manual_seed',
        moderation_notes: 'Verified via director phone OTP.',
        is_active: true,
        created_at: now,
        updated_at: now,
        last_updated_by_institute_at: now,
      },
      {
        id: 'inst_allen_kota',
        name: 'Allen Career Institute',
        slug: 'allen-career-institute',
        description: 'Pioneering coaching institute for JEE Advanced, JEE Main, and NEET-UG in Kota.',
        city: 'Kota',
        locality: 'Indra Vihar',
        address: 'Sankalp, CP-6, Indra Vihar, Kota, Rajasthan 324005',
        latitude: 25.1387,
        longitude: 75.8364,
        phone: '917442757575',
        email: 'info@allen.ac.in',
        mode: 'offline',
        category: 'entrance_exam',
        fee_range_min: 140000,
        fee_range_max: 230000,
        photos: [
          'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop',
        ],
        video_url: null,
        faculty: [
          { name: 'B. M. Sharma', credential: 'IIT Kharagpur Alum, Physics Mentor' },
        ],
        results_claims: 'AIR 1, 2, 3 in JEE Advanced 2024.',
        established_year: 1988,
        operating_status: 'active',
        claim_status: 'claimed',
        verified_via: 'otp',
        source: 'manual_seed',
        moderation_notes: 'Seeded verified profile.',
        is_active: true,
        created_at: now,
        updated_at: now,
        last_updated_by_institute_at: now,
      },
      {
        id: 'inst_vajiram',
        name: 'Vajiram & Ravi',
        slug: 'vajiram-and-ravi',
        description: 'Renowned legacy institute specializing in General Studies & Optional subjects for UPSC.',
        city: 'Delhi',
        locality: 'Old Rajinder Nagar',
        address: '9-B, Bada Bazar Marg, Old Rajinder Nagar, New Delhi 110060',
        latitude: 28.6415,
        longitude: 77.1782,
        phone: '911141007400',
        email: 'admission@vajiramandravi.com',
        mode: 'offline',
        category: 'government_exam',
        fee_range_min: 160000,
        fee_range_max: 240000,
        photos: [],
        video_url: null,
        faculty: [
          { name: 'P. Ravindran', credential: 'M.A., Founding Member' },
        ],
        results_claims: 'Training civil servants since 1976.',
        established_year: 1976,
        operating_status: 'active',
        claim_status: 'unclaimed',
        verified_via: 'none',
        source: 'manual_seed',
        moderation_notes: 'Unclaimed directory entry.',
        is_active: true,
        created_at: now,
        updated_at: now,
        last_updated_by_institute_at: now,
      },
      {
        id: 'inst_british_council',
        name: 'British Council English & IELTS Prep',
        slug: 'british-council-ielts',
        description: 'Official test provider and preparation partner offering structured IELTS modules.',
        city: 'Delhi',
        locality: 'Connaught Place',
        address: '17 Kasturba Gandhi Marg, Connaught Place, New Delhi 110001',
        latitude: 28.6289,
        longitude: 77.2219,
        phone: '911204569000',
        email: 'india.enquiries@britishcouncil.org',
        mode: 'hybrid',
        category: 'study_abroad',
        fee_range_min: 14500,
        fee_range_max: 32000,
        photos: [],
        video_url: null,
        faculty: [],
        results_claims: '94% students achieve Band 7.5 or above.',
        established_year: 1948,
        operating_status: 'active',
        claim_status: 'unclaimed',
        verified_via: 'none',
        source: 'manual_seed',
        moderation_notes: 'Seeded directory profile.',
        is_active: true,
        created_at: now,
        updated_at: now,
        last_updated_by_institute_at: now,
      },
      {
        id: 'inst_closed_coaching',
        name: 'Apex Academy (Old Campus)',
        slug: 'apex-academy-old-campus',
        description: 'Permanently closed coaching facility for historical tracking.',
        city: 'Delhi',
        locality: 'Mukherjee Nagar',
        address: 'Mukherjee Nagar, Delhi 110009',
        latitude: null,
        longitude: null,
        phone: '911199887766',
        email: 'closed@apex.com',
        mode: 'offline',
        category: 'government_exam',
        fee_range_min: 50000,
        fee_range_max: 75000,
        photos: [],
        video_url: null,
        faculty: [],
        results_claims: '',
        established_year: 2012,
        operating_status: 'permanently_closed',
        claim_status: 'unclaimed',
        verified_via: 'none',
        source: 'manual_seed',
        moderation_notes: 'Shut down operations in late 2024.',
        is_active: true,
        created_at: now,
        updated_at: now,
        last_updated_by_institute_at: now,
      },
    ];

    this.institute_exam_tags = [
      { institute_id: 'inst_vision_ias', exam_tag_id: 'tag_upsc' },
      { institute_id: 'inst_allen_kota', exam_tag_id: 'tag_jee' },
      { institute_id: 'inst_allen_kota', exam_tag_id: 'tag_neet' },
      { institute_id: 'inst_vajiram', exam_tag_id: 'tag_upsc' },
      { institute_id: 'inst_british_council', exam_tag_id: 'tag_ielts' },
    ];

    // 8. Institute Batches
    this.institute_batches = [
      {
        id: 'batch_vision_01',
        institute_id: 'inst_vision_ias',
        name: 'GS Foundation Course 2027 (Pre-cum-Mains)',
        slug: 'gs-foundation-2027',
        fee: 185000,
        duration: '11 Months',
        mode: 'hybrid',
        schedule_text: 'Mon-Fri 08:30 AM - 11:30 AM',
        start_date: '2026-11-15',
        description: 'Holistic coverage of GS Paper I, II, III, IV, Essay and Current Affairs.',
        exam_tag_id: 'tag_upsc',
        is_archived: false,
      },
      {
        id: 'batch_vision_02',
        institute_id: 'inst_vision_ias',
        name: 'Weekend GS Prelims Crash Course',
        slug: 'weekend-gs-prelims-crash',
        fee: 45000,
        duration: '3 Months',
        mode: 'online',
        schedule_text: 'Sat & Sun 10:00 AM - 04:00 PM',
        start_date: '2026-12-01',
        description: 'High-yield prelims revision series with 35 sectional & mock tests.',
        exam_tag_id: 'tag_upsc',
        is_archived: false,
      },
      {
        id: 'batch_allen_01',
        institute_id: 'inst_allen_kota',
        name: 'Nurture Batch (Class 11 to JEE Advanced 2028)',
        slug: 'nurture-batch-jee-2028',
        fee: 165000,
        duration: '2 Years',
        mode: 'offline',
        schedule_text: 'Mon-Sat 02:00 PM - 07:30 PM',
        start_date: '2026-10-25',
        description: '2-year classroom course targeting top 100 ranks in JEE Advanced.',
        exam_tag_id: 'tag_jee',
        is_archived: false,
      },
    ];

    // 9. Claims
    this.claims = [
      {
        id: 'clm_approved_01',
        institute_id: 'inst_vision_ias',
        claimant_name: 'Ajay Kumar (Director)',
        claimant_phone: '918448449550',
        claimant_ip: '103.21.244.12',
        claimant_device_fingerprint: 'fp_desk_chrome_8921',
        otp_verified_at: now,
        status: 'approved',
        review_mode: 'auto',
        risk_score: 10,
        risk_signals: ['phone_matches_listing'],
        decided_by_admin_id: 'admin_usr_01',
        decided_at: now,
        revoked_reason: null,
        created_at: now,
      },
      {
        id: 'clm_pending_sample',
        institute_id: 'inst_british_council',
        claimant_name: 'Vikram Mehta',
        claimant_phone: '9899112233',
        claimant_ip: '49.36.128.45',
        claimant_device_fingerprint: 'fp_mob_safari_3301',
        otp_verified_at: now,
        status: 'pending',
        review_mode: 'manual',
        risk_score: 40,
        risk_signals: ['first_time_phone', 'name_mismatch'],
        decided_by_admin_id: null,
        decided_at: null,
        revoked_reason: null,
        created_at: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
      },
    ];

    // 10. Reviews
    this.reviews = [
      {
        id: 'rev_01',
        entity_type: 'institute',
        entity_id: 'inst_vision_ias',
        reviewer_user_id: 'usr_student_01',
        reviewer_phone: '9876543210',
        otp_verified_at: now,
        rating: 5,
        body_text: 'The test series and mentorship for GS Paper 2 and 4 are phenomenal.',
        institute_response: 'Thank you Rahul! Wishing you the very best for the upcoming Mains exams.',
        institute_response_at: now,
        dispute_status: 'none',
        dispute_reason: null,
        dispute_note: null,
        status: 'visible',
        created_at: now,
      },
      {
        id: 'rev_disputed_02',
        entity_type: 'institute',
        entity_id: 'inst_allen_kota',
        reviewer_user_id: null,
        reviewer_phone: '9123456789',
        otp_verified_at: now,
        rating: 1,
        body_text: 'Absolute waste of money. Classrooms were dirty.',
        institute_response: null,
        institute_response_at: null,
        dispute_status: 'disputed',
        dispute_reason: 'fake_spam',
        dispute_note: 'Student never registered in our Kota branch.',
        status: 'visible',
        created_at: now,
      },
      {
        id: 'rev_03',
        entity_type: 'course',
        entity_id: 'crs_01',
        reviewer_user_id: 'usr_student_02',
        reviewer_phone: '9812345678',
        otp_verified_at: now,
        rating: 5,
        body_text: 'Andrew Ng makes complex gradient descent feel intuitive.',
        institute_response: null,
        institute_response_at: null,
        dispute_status: 'none',
        dispute_reason: null,
        dispute_note: null,
        status: 'visible',
        created_at: now,
      },
    ];

    // 11. Leads
    this.leads = [
      {
        id: 'lead_01',
        institute_id: 'inst_vision_ias',
        batch_id: 'batch_vision_01',
        student_name: 'Pooja Verma',
        student_phone: '9877112233',
        student_user_id: null,
        message: 'Interested in fee discount or scholarship test for GS Foundation 2027.',
        source_page: 'batch',
        contacted_by_institute: false,
        created_at: now,
      },
    ];

    // 12. Saved Items & Collections
    this.saved_items = [
      {
        id: 'save_01',
        user_id: 'usr_student_01',
        entity_type: 'course',
        entity_id: 'crs_01',
        created_at: now,
      },
    ];

    this.collections = [
      {
        id: 'col_01',
        user_id: 'usr_student_01',
        title: 'My 2027 UPSC Preparation Master Bundle',
        is_public: true,
        created_at: now,
      },
    ];

    this.collection_items = [
      {
        id: 'coli_01',
        collection_id: 'col_01',
        entity_type: 'institute',
        entity_id: 'inst_vision_ias',
        added_at: now,
      },
    ];

    // 13. Exam Key Dates
    this.exam_key_dates = [
      {
        id: 'date_upsc_01',
        exam_tag_id: 'tag_upsc',
        event_name: 'UPSC CSE 2027 Notification Released',
        event_date: '2027-02-10',
        notes: 'Online application opens on upsconline.nic.in',
        created_by_admin_id: 'admin_usr_03',
      },
      {
        id: 'date_upsc_02',
        exam_tag_id: 'tag_upsc',
        event_name: 'UPSC CSE 2027 Preliminary Examination',
        event_date: '2027-05-23',
        notes: 'General Studies Paper I & Paper II (CSAT)',
        created_by_admin_id: 'admin_usr_03',
      },
    ];

    // 14. Guides
    this.guides = [
      {
        id: 'gd_01',
        title: 'How to Choose Between Offline and Hybrid UPSC Coaching in Delhi',
        slug: 'offline-vs-hybrid-upsc-coaching-delhi',
        body: 'Choosing the right preparation mode is pivotal for civil services aspirants.',
        exam_tag_id: 'tag_upsc',
        author_admin_id: 'admin_usr_03',
        is_published: true,
        published_at: now,
      },
    ];

    // 15. Learning Paths
    this.learning_paths = [
      {
        id: 'lp_01',
        title: 'Zero to Production Full Stack Engineer',
        slug: 'zero-to-production-full-stack-engineer',
        target_exam_tag_id: 'tag_fullstack',
        description: 'Complete roadmap from basic HTML/CSS through Node.js and cloud deployment.',
        is_published: true,
      },
    ];

    this.learning_path_steps = [
      {
        id: 'lps_01',
        learning_path_id: 'lp_01',
        course_id: 'crs_02',
        step_order: 1,
        rationale_text: 'Learn programming fundamentals and data structures.',
      },
    ];

    // 16. Integration Configs
    this.integration_configs = [
      {
        id: 'cfg_sms',
        key: 'sms_msg91',
        category: 'messaging',
        display_name: 'MSG91 Indian SMS Gateway',
        provider_name: 'MSG91',
        is_enabled: true,
        is_required: true,
        credentials_encrypted: encryptSecret('auth_key_msg91_live_sec_7782'),
        config_json: { sender_id: 'CRSPUR' },
        last_tested_at: now,
        last_test_status: 'success',
        updated_by_admin_id: 'admin_usr_01',
        updated_at: now,
      },
      {
        id: 'cfg_email',
        key: 'email_transactional',
        category: 'messaging',
        display_name: 'Transactional Email Service',
        provider_name: 'Resend',
        is_enabled: true,
        is_required: true,
        credentials_encrypted: encryptSecret('re_live_992109841029481'),
        config_json: { from_email: 'notifications@coursepur.com' },
        last_tested_at: now,
        last_test_status: 'success',
        updated_by_admin_id: 'admin_usr_01',
        updated_at: now,
      },
      {
        id: 'cfg_whatsapp',
        key: 'whatsapp_business',
        category: 'messaging',
        display_name: 'WhatsApp Business API',
        provider_name: 'Twilio Gupshup',
        is_enabled: false,
        is_required: false,
        credentials_encrypted: encryptSecret(''),
        config_json: { template: 'new_lead_alert' },
        last_tested_at: null,
        last_test_status: 'untested',
        updated_by_admin_id: null,
        updated_at: now,
      },
    ];

    // 17. Ingestion Jobs
    this.ingestion_jobs = [
      {
        id: 'job_01',
        provider_id: 'prov_coursera',
        started_at: new Date(Date.now() - 86400000).toISOString(),
        finished_at: new Date(Date.now() - 86400000 + 120000).toISOString(),
        courses_added: 2,
        courses_updated: 0,
        courses_removed: 0,
        error_count: 0,
        error_log: 'Catalog API sync completed with HTTP 200 OK.',
      },
    ];
  }
}

export const db = new DatabaseStore();
