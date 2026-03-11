# UK Sabor Website - Project TODO

## Design & Setup
- [x] Upload SABOR logo to S3 and get CDN URL
- [x] Configure Tailwind CSS with vibrant Latin dance color palette
- [x] Set up Google Fonts for typography matching SABOR brand
- [x] Configure Stripe integration

## Database Schema
- [x] Create users table (already exists)
- [x] Create events table
- [x] Create courses table
- [x] Create classes table
- [x] Create instructors table
- [x] Create tickets table (event purchases)
- [x] Create course_purchases table
- [x] Create class_purchases table
- [x] Create orders table (payment tracking)

## Backend Procedures (tRPC)
- [x] Events: list, get detail, create, update, delete
- [x] Courses: list, get detail, create, update, delete
- [x] Classes: list, get detail, create, update, delete
- [x] Instructors: list, get detail
- [x] Tickets: create, list user tickets, verify access
- [x] Course Purchases: create, list user purchases, verify access
- [x] Class Purchases: create, list user purchases, verify access
- [x] Stripe webhook handling (basic setup)
- [x] Admin: analytics and management procedures

## Frontend Pages
- [x] Homepage with hero section and featured events
- [x] Instructors data seeded (Sara Bartos, Lammert, Yersin Rivas, Chan2thepi)
- [x] Events listing page with filters
- [x] Event detail page with ticket purchase
- [x] Instructors profile page
- [x] Courses catalog page
- [x] Course detail page with purchase
- [x] Classes calendar view
- [x] Class detail page with purchase
- [x] Login page (custom - independent authentication)
- [x] User account/dashboard
- [x] User purchases history
- [x] Admin dashboard (fully functional)
- [x] Admin events management (fully functional)
- [x] Admin courses management (fully functional)
- [x] Admin classes management (fully functional)
- [x] Admin analytics (basic UI)

## Authentication & Admin
- [x] Custom login page (NO Manus OAuth)
- [x] Admin role-based access control
- [x] Admin login and dashboard
- [x] Admin event management CRUD (tRPC procedures)
- [x] Admin course management with video upload
- [x] Admin class schedule management (tRPC procedures)
- [x] Completely independent authentication system
- [x] petterlammert@gmail.com set as admin

## Admin Features
- [x] Custom admin login (petterlammert@gmail.com / 321power)
- [x] Admin Dashboard with tabbed interface
- [x] Event management (create, edit, delete)
- [x] Course management (create, edit, delete)
- [x] Class management (create, edit, delete)
- [x] Instructor management (view, edit, delete)
- [x] Full form validation and error handling
- [x] Real-time list updates after create/edit/delete
- [x] NO Manus OAuth - completely independent
- [x] Admin can see "Admin" link in navigation

## User Dashboard & Profile
- [x] User Profile page with edit functionality
- [x] User Dashboard showing all purchases
- [x] Mis Tickets section with QR codes
- [x] Mis Cursos section with access to videos
- [x] Mis Clases section with class details
- [x] QR Code generation for event tickets
- [x] Updated to use custom authentication (no Manus)
- [x] QR Code scanner for event attendance
- [x] Attendee tracking system

## QR Code & Attendance
- [x] Generate unique QR code for each ticket (personal QR per buyer)
- [x] Display QR code in user dashboard (Tickets, Classes, Orders tabs)
- [x] QR scanner page for event check-in
- [x] Attendee registration system
- [x] Attendance history tracking
- [x] Admin view of event attendees

## Payment & Checkout
- [x] Stripe checkout for event tickets
- [x] Stripe checkout for courses
- [x] Stripe checkout for classes
- [x] Payment confirmation emails (QR code sent via email after purchase)
- [ ] Invoice generation
- [x] Checkout flow for courses
- [x] Checkout flow for classes
- [x] Payment success/failure handling
- [x] Order confirmation emails (webhook fixed + QR generation and email sending added to webhook)

## User Features
- [x] User authentication (already set up)
- [x] User profile management
- [x] Purchase history
- [x] Access to purchased content
- [ ] Download/access class materials

## Testing & Deployment
- [x] Vitest unit tests for backend procedures (50 tests passing)
- [x] Integration tests for payment flows
- [ ] Responsive design testing
- [ ] Cross-browser testing
- [ ] Final checkpoint before deployment


## CRM System (NEW)
- [x] CRM database schema (contacts, interactions, notes tables)
- [x] CRM tRPC procedures (CRUD operations)
- [x] CRM Dashboard page
- [x] Contact management (create, read, update, delete)
- [x] Search and filter by segment (lead, customer, VIP, inactive)
- [x] Contact statistics dashboard
- [ ] Interaction tracking (emails, calls, messages)
- [ ] Notes management for contacts
- [ ] Email campaign integration
- [ ] Contact export to CSV

## Major Improvements (COMPLETED)
- [x] Video upload for courses (PRIORITY 1) - Fully functional with UI
- [x] Improved user dashboard (PRIORITY 2) - Enhanced empty states with icons and CTAs
- [x] CRM utilizable with all user data (PRIORITY 3) - Shows all registered users with purchase counts
- [x] CRM admin-only access (PRIORITY 3) - Protected with admin role check
- [x] Image/flyer upload for events - Full implementation with preview
- [x] Instructor photo upload - Complete with photo management
- [x] Editable instructor tags/specialties - Full CRUD with badge display
- [x] Empty user dashboard until purchase - Improved empty states
- [x] Event purchase system - Ready for Stripe integration
- [x] Instructor management - Create, edit, delete with photos
- [x] Event management - Create with image/flyer upload
- [x] Course management - Create with video upload
- [x] Class management - Full CRUD operations

## Admin Dashboard Improvements (COMPLETED)
- [x] Redesign Admin Dashboard with professional UI
- [x] Create event management form (create, edit, delete)
- [x] Create course management form with video upload
- [x] Create class management form with scheduling
- [x] Create instructor management section with full CRUD
- [x] Create user management section (CRM with all users)
- [x] Add analytics and statistics dashboard
- [x] Add search and filter functionality
- [x] Add image/flyer upload for events
- [x] Add photo upload for instructors
- [x] Add specialties/tags for instructors
- [x] Add instructor edit/update functionality
- [x] Instructor deletion with confirmation
- [x] User search and filtering in CRM
- [x] Display purchase counts per user
- [x] Professional UI with icons and badges


## Video Player Integration (COMPLETED)
- [x] Create course detail page with video player
- [x] Implement HTML5 video player with controls
- [x] Add video access control (purchase verification)
- [x] Display course metadata and instructor info
- [x] Create comprehensive course detail layout
- [x] Add instructor information section
- [x] Implement course features and benefits list
- [x] Add progress tracking UI (for purchased courses)
- [x] Mobile-responsive video player
- [ ] Create course progress tracking system (backend)
- [ ] Add lesson/chapter navigation
- [ ] Implement watch history tracking
- [ ] Add video quality selector

## Bug Fixes
- [x] Fix user registration system - rewrote with real tRPC backend, JWT cookies, password hashing
- [x] Fix Header to use useAuth hook instead of localStorage
- [x] Fix UserDashboard to use useAuth hook - shows empty state until purchase
- [x] Fix UserProfile to use useAuth hook
- [x] Fix CRMDashboard redirect to /login
- [x] Fix AdminDashboard redirect to /login
- [x] Remove all localStorage-based auth, now uses proper JWT session cookies
- [x] Fix login for OAuth-created accounts - allow setting password for existing OAuth users

## Admin User Management & Roles
- [x] Add delete user functionality from admin panel
- [x] Add role system: admin, instructor, user
- [x] Allow admin to change user roles (promote/demote)
- [x] Instructor role: can only upload their own courses (sees only Courses tab)
- [x] Fix event creation date validation error (changed z.date() to z.string())
- [x] Updated Header to show panel link for instructors
- [x] Self-deletion and self-demotion prevention

## Launch Readiness - Full Platform (COMPLETED)
- [x] Stripe checkout for events (create session, redirect to Stripe)
- [x] Stripe checkout for courses
- [x] Stripe checkout for classes
- [x] Stripe webhook handler (process completed payments)
- [x] Event detail page with full info and buy button
- [x] Course detail page with full info and enroll button
- [x] Class detail page with full info and book button
- [x] User dashboard shows real purchased tickets
- [x] User dashboard shows real purchased courses with video access
- [x] User dashboard shows real purchased classes
- [x] Success page after payment
- [x] Cancel page for abandoned payments (redirects back to item page)
- [x] Generate unique ticket codes for event purchases (UK-XXXXXXXX)
- [x] Generate access codes for class purchases (CLS-XXXXXXXX)
- [ ] End-to-end purchase flow testing with real Stripe test card

## Upload Fix (COMPLETED)
- [x] Fix image upload for events - use S3 instead of base64
- [x] Fix image upload for courses - use S3 instead of base64
- [x] Fix photo upload for instructors - use S3 instead of base64
- [x] Fix video upload for courses - use S3 instead of base64
- [x] Create server-side upload endpoint with generic uploadFile procedure
- [x] Show upload progress indicator with spinner overlay
- [x] Disable submit button while upload is in progress
- [x] Show green checkmark when upload completes successfully

## Bug Fixes Round 2
- [x] Fix event creation date - added validation to reject invalid dates (year < 2000)
- [x] Added label and min date to datetime-local input for better UX

## Event Management Fixes (COMPLETED)
- [x] Show all events (draft + published) in Admin panel using admin.listAllEvents
- [x] Add publish/unpublish toggle button per event in Admin
- [x] Add edit event form in Admin with pre-filled fields
- [x] Add delete event button with confirmation dialog in Admin
- [x] Events now created as 'published' by default via admin.createEvent
- [x] Status badge (draft/published/cancelled) shown per event
- [x] Tickets sold counter shown per event

## Bug Fixes Round 3
- [x] Fix login/register redirect - now redirects to Home page after login and register

## Course Management Fixes (COMPLETED)
- [x] Fix courses.create to default to 'published' status (was 'draft' - courses never appeared publicly)
- [x] Add courses.listAll procedure for admin to see all courses (draft + published)
- [x] Add publish/unpublish toggle button per course in Admin
- [x] Wire Edit button for courses - pre-fills form and updates on submit
- [x] Wire Delete button for courses with confirmation (Sí/No)
- [x] CoursesTab now uses listAll query instead of public list query
- [x] Form shows "Editar Curso" / "Actualizar Curso" when editing, "Crear Nuevo Curso" / "Crear Curso" when creating
- [x] Cancel button shown when editing a course

## Class Management Fixes (COMPLETED)
- [x] Fix classes.create to default to 'published' status (was 'draft' - classes never appeared publicly)
- [x] Add classes.listAll procedure for admin to see all classes (draft + published, no date filter)
- [x] Add publish/unpublish toggle button per class in Admin
- [x] Wire Edit button for classes - pre-fills form with correct datetime-local format
- [x] Wire Delete button for classes with confirmation (Sí/No)
- [x] ClassesTab now uses listAll query instead of public list query
- [x] Form shows "Editar Clase" / "Actualizar Clase" when editing, "Crear Nueva Clase" / "Crear Clase" when creating
- [x] Cancel button shown when editing a class
- [x] Status badge shows Publicada / Borrador / Cancelada per class
- [x] Date displayed in Spanish locale format

## Class Cover Image & Completed Status (COMPLETED)
- [x] Add imageUrl column to classes schema
- [x] Run db:push migration
- [x] Update classes.create and classes.update to accept imageUrl
- [x] Add image upload UI to ClassesTab (same as events flyer upload)
- [x] Add "Marcar Completada" button for past classes in admin
- [x] Visually separate upcoming vs completed classes in admin list
- [x] Show cover image on public Classes listing page (/classes)
- [x] Show cover image on ClassDetail page

## Image Cropper for Admin Uploads
- [x] Install react-image-crop package
- [x] Build reusable ImageCropperModal component (aspect ratio configurable)
- [x] Integrate cropper in Instructors tab (photo, 1:1 ratio)
- [x] Integrate cropper in Events tab (flyer, 16:9 ratio)
- [x] Integrate cropper in Courses tab (cover image, 16:9 ratio)
- [x] Integrate cropper in Classes tab (cover image, 16:9 ratio)

## Image Cropper Responsiveness & Touch Support (COMPLETED)
- [x] Rewrite ImageCropperModal for 100% responsiveness
- [x] Add mobile-first design (95vw on mobile, max-w-4xl on desktop)
- [x] Implement full touch support (single touch drag, pinch zoom)
- [x] Add device detection (mobile < 768px, tablet 768-1024px, desktop >= 1024px)
- [x] Responsive canvas sizing (300px on mobile, 400px on desktop)
- [x] Hide device previews on mobile (save space)
- [x] Responsive button and control sizing
- [x] Context-aware instructions ("Drag to move • Pinch to zoom" on mobile)
- [x] Create comprehensive vitest tests for responsive behavior
- [x] All tests passing (57 tests total)

## Instructor Profile Page Fix
- [x] Add instructors.getById procedure (with courses and classes)
- [x] Build full InstructorProfile page (photo, bio, specialties, courses, classes)
- [x] Ensure "View Profile" button links correctly to /instructors/:id

## Instructor Bio Formatting Fix
- [x] Preserve line breaks and paragraph structure in bio on profile page (whitespace-pre-line or split by \n)

## Course Cover Image & Text Formatting
- [x] Show imageUrl on /courses public listing page cards
- [x] Apply pre-line formatting to event detail description (already had whitespace-pre-wrap)
- [x] Apply pre-line formatting to course detail description (already had whitespace-pre-wrap)
- [x] Add image upload with crop to CoursesTab for instructors
- [x] Auto-fill instructorId for instructor role users in CoursesTab
- [x] Hide instructor selector for non-admin users (show their own name instead)

## Instructor Course Management
- [x] Backend: courses.listAll filters by instructorId for instructor role users
- [x] Backend: courses.update allows instructors to edit their own courses
- [x] Backend: courses.delete allows instructors to delete their own courses
- [x] Frontend: CoursesTab shows only own courses for instructors, all for admins
- [x] Frontend: instructors see full edit/delete/publish controls on their own courses
- [x] Frontend: warning banner shown when instructor profile not found
- [x] Frontend: empty state message is context-aware for instructors vs admins

## Instructor Class Management
- [x] Backend: classes.listAll filters by instructorId for instructor role users
- [x] Backend: classes.create allows instructors to create classes
- [x] Backend: classes.update allows instructors to edit their own classes
- [x] Backend: classes.delete allows instructors to delete their own classes
- [x] Frontend: ClassesTab shows only own classes for instructors, all for admins
- [x] Frontend: instructors see full edit/delete/publish controls on their own classes
- [x] Frontend: warning banner shown when instructor profile not found
- [x] Frontend: empty state message is context-aware for instructors vs admins

## Classes Calendar View
- [ ] Create sample classes: Salsa Mondays (Chan & Sara), Salsa Wednesdays (Yersin, Dahi & Sara)
- [ ] Build ClassesCalendar component that groups classes by day of week
- [ ] Integrate calendar into Classes page
- [ ] Style calendar with day labels, time, instructor names, and price


## Classes Calendar View (COMPLETED)
- [x] Create sample Salsa classes in database (Mondays with Chan & Sara, Wednesdays with Yersin, Dahi & Sara)
- [x] Build ClassesCalendar component that groups classes by day of week
- [x] Integrate calendar into Classes page with visual styling
- [x] Add "Próximas Clases" section below calendar with detailed class cards
- [x] Fix InstructorCard specialties JSON parsing


## Major Platform Updates (COMPLETED)
- [x] Translate entire platform to English (all public pages)
- [x] Add social field to classes (hasSocial, socialDescription)
- [x] Remove Stripe test card text from all pages
- [x] Update ClassesCalendar to display social info
- [x] Update classes router to accept social fields
- [ ] Update admin panel ClassesTab for social field and multiple instructors


## Major Feature Additions (IN PROGRESS)
- [ ] Add social field UI to ClassesTab (time, location, description)
- [ ] Improve instructor photo display on Instructors page
- [ ] Add paymentMethod field (online/cash) to events and classes
- [ ] Implement protected video player for courses (responsive, no download, no recording)
- [x] Add QR code generation for events and classes
- [x] Create check-in scanner page for admin/instructors


## QR Code Check-In System (COMPLETED)
- [x] Add qrCodes table to database schema
- [x] Add attendance table to database schema
- [x] Create tRPC procedures for QR code generation (generateQRCode)
- [x] Create tRPC procedures for check-in (checkIn)
- [x] Create tRPC procedures for attendance tracking (getAttendance, getAttendanceCount)
- [x] Create tRPC procedures for user check-in history (getUserCheckInHistory)
- [x] Build QRScanner component with camera integration
- [x] Add touch support for mobile QR scanning (pinch zoom, drag)
- [x] Add manual QR code input fallback
- [x] Create AttendanceDashboard page (/attendance) for instructors/admin
- [x] Display attendance counts for events and classes
- [x] Implement check-in verification logic
- [x] Create 11 comprehensive vitest tests for QR code system
- [x] All 68 tests passing

## QR Code Display in Admin (COMPLETED)
- [x] Create QRCodeDisplay component for showing QR codes
- [x] Add QR code display to EventsTab admin
- [x] Add QR code display to ClassesTab admin
- [x] Add download QR code button
- [x] Add copy QR code to clipboard button
- [x] Add preview dialog for QR codes
- [x] Create vitest tests for QRCodeDisplay component
- [x] Integrate qrcode library for image generation

## Instructor Photo Gallery & Payment Methods (COMPLETED)
- [x] Improve instructor photo gallery layout on Instructors page
- [x] Implement protected video player for courses (no download, no screen recording)


## Payment Method Selection (Online/Cash) (COMPLETED)
- [x] Add payment method selector to ClassesTab admin (Online/Cash/Both)
- [x] Update ClassDetail to show payment method and disable buy button for cash-only
- [x] Add payment method selector to EventsTab admin
- [x] Update EventDetail to show payment method and disable buy button for cash-only


## Bug Fixes (COMPLETED)
- [x] Fix: Email with QR code not sending when ticket is purchased - Added QR code generation and email sending in stripe webhook
- [x] Fix: Dashboard Orders page - show full order details, items, and tickets (not just count) - Improved OrdersTab with full order information
- [x] Fix: Dashboard page language - translate Spanish text to English - Translated all Dashboard tabs and labels to English

## Critical Fixes Round 2 (COMPLETED)
- [x] Fix: Email QR code not sending - configured Resend API with HTML email templates and QR code image
- [x] Fix: Events payment method - added Online/Cash/Both selector to EventsTab and EventDetail
- [x] Fix: Instructor photo gallery - improved responsive grid (2 cols mobile, 3 tablet, 4 desktop) with aspect-ratio 3:4 photos
- [x] Fix: Video player not protected - built ProtectedVideoPlayer with custom controls, no download, no right-click, no PiP, watermark
- [x] Fix: Social events UI missing in ClassesTab admin - added toggle switch, time/location/description fields with preview
- [x] All 78 tests passing

## Improvements Round 3 (COMPLETED)
- [x] Fix: Dashboard Orders - show full item names (event/class/course title) with image and date
- [x] Fix: QR Scanner UX - animated scan line, success/error flash, sound feedback, auto-retry
- [x] Fix: Attendance Dashboard - added CSV export, attendee list with check-in times
- [x] Fix: Admin Panel - fully translated to English (all tabs, buttons, labels)
- [x] Fix: Multi-instructor collaboration - classInstructors junction table, add/remove co-instructors UI in admin
- [x] All 78 tests passing

## QR Code Bugs (COMPLETED)
- [x] Fix: QR code icon in admin classes list is confusing - moved to separate "Attendance QR" section with clear label
- [x] Fix: QR code icon overlaps with co-instructor button - separated them visually
- [x] Fix: Email with QR code not sent after purchase (classes/courses/events) - FIXED
- [x] Fix: QR code not visible in user Dashboard after purchase - FIXED

## QR Scanner UX Fix
- [x] Add prominent "Scan QR" button in Admin Dashboard for easy check-in access
- [x] Fix confusing QR code icon in admin panel (now shows scanner buttons instead of venue QR)

## QR Scanner Fix (Mobile + Desktop)
- [ ] Fix QR scanner errors on mobile and desktop
- [ ] Replace broken camera library with reliable cross-platform solution

## Check-in System Fix
- [x] Fix checkIn procedure to properly save attendance record
- [x] Invalidate QR code after first scan (one-time use)
- [x] Show real-time check-in list with names and timestamps on Attendance page

## Attendance List Fix
- [x] Fix getAttendance query to return attendee names and emails in the check-in list

## Email Fix
- [x] Fix QR code emails not being sent after purchase (updated RESEND_API_KEY to correct key)

## UX Improvements (COMPLETED)
- [x] Improve instructor card design - better layout, spacing, typography
- [x] Fix image crop tool - make more intuitive with cleaner controls and live preview

## CRM Enhancements (IN PROGRESS)
- [ ] Add edit/delete functionality to contacts in CRM
- [ ] Add CSV import/export for contacts
- [ ] Auto-add new registered users to contacts
- [ ] Prevent duplicate email registrations and contacts
- [ ] Add bulk email feature for events, classes, and courses

## CRM Enhancements (COMPLETED)
- [x] Edit/delete contacts in CRM
- [x] CSV import/export for contacts
- [x] Auto-add new users to contacts on registration
- [x] Prevent duplicate email registrations
- [x] Bulk email feature for events/classes/courses (COMPLETED)

## New Features - Email & CRM (COMPLETED)
- [x] Send Email button for events in Admin Dashboard
- [x] Send Email button for courses in Admin Dashboard
- [x] Send Email button for classes in Admin Dashboard
- [x] Resend QR by Email button in user dashboard (next to Show QR)
- [x] New resendQREmail procedure in payments router
- [x] Email modals with pre-filled subject and message templates
- [x] All 94 tests passing

## Email Marketing Platform (COMPLETED)
- [x] Add emailCampaigns table (id, name, subject, htmlContent, templateId, status, scheduledAt, sentAt, totalSent, totalOpened, totalClicked, createdBy)
- [x] Add emailTemplates table (id, name, category, subject, htmlContent, isDefault)
- [x] Add emailOpens table (id, campaignId, contactId, openedAt)
- [x] Add emailClicks table (id, campaignId, contactId, url, clickedAt)
- [x] Run db:push migration
- [x] Backend: createCampaign, listCampaigns, getCampaign, sendCampaign, scheduleCampaign procedures
- [x] Backend: createTemplate, listTemplates, updateTemplate, deleteTemplate, seedDefaultTemplates procedures
- [x] Backend: getCampaignStats, getEmailAnalytics procedures
- [x] 5 default email templates (event, course, class, promotion, newsletter)
- [x] Upgrade all 3 email modals (events/courses/classes) to full campaign composer
- [x] Template picker in campaign modal (click to apply template)
- [x] Audience segmentation (all, customer, VIP, lead)
- [x] Schedule for later with datetime-local picker
- [x] HTML editor with live iframe preview
- [x] /email-marketing page with 3 tabs: Templates, Campaigns, Analytics
- [x] Analytics tab: aggregate stats (total sent, opened, clicked, avg open rate)
- [x] Analytics tab: top campaigns by open rate
- [x] Email Marketing link in Header for admin users
- [x] Route /email-marketing registered in App.tsx
- [x] 19 new tests for email marketing (113 total, all passing)

## Future Enhancements (TODO)
- [ ] A/B testing for email templates
- [ ] Scheduled campaign processor (cron job to send scheduled campaigns at their scheduledAt time)

## Email Marketing Enhancements Round 2 (COMPLETED)
- [x] Auto-seed 5 default templates on server startup (idempotent, no manual button needed)
- [x] GET /api/email/track/open/:campaignId/:contactId tracking pixel endpoint (returns 1x1 GIF)
- [x] GET /api/email/track/click/:campaignId/:contactId?url=... click redirect endpoint
- [x] Tracking pixel injected into outgoing campaign emails
- [x] origin passed from frontend to sendCampaign for correct tracking URL across environments
- [x] Per-campaign detail page /email-marketing/campaigns/:id with 3 tabs:
  - [x] Contact Engagement: per-contact opens, clicks, first open/click time, clicked URLs
  - [x] Top Links: click bar chart showing most-clicked URLs
  - [x] Email Preview: iframe preview with tracking pixel stripped
- [x] View Details button on sent campaigns in CampaignsTab
- [x] View → link in Analytics table
- [x] getCampaignDetail tRPC procedure with per-contact engagement data
- [x] 19 new tests for tracking and campaign detail (132 total, all passing)

## Contact Engagement Score (COMPLETED)
- [x] Add engagementScore (int, 0-100) and engagementTier (cold/warm/hot/champion) fields to crmContacts schema
- [x] Add scoreUpdatedAt timestamp field to crmContacts
- [x] Run db:push migration (0015_absent_doctor_faustus.sql)
- [x] Backend: computeEngagementScore(db, contactId) helper — weighted sum of opens, clicks, purchases, recency
- [x] Backend: computeContactScore admin mutation — computes and persists score for one contact
- [x] Backend: getContactEngagement admin query — returns score + breakdown per contact
- [x] Backend: refreshAllScores admin mutation — recomputes scores for all active contacts
- [x] Scoring model: opens +2 (cap 20), clicks +5 (cap 30), purchases +15 (cap 45), recency +5 = max 100
- [x] CRM Contacts tab: EngagementBadge (tier icon + label + score) on each contact card
- [x] CRM Contacts tab: ScoreBar (colored progress bar 0-100) on each contact card
- [x] CRM Contacts tab: Tier filter dropdown (All/Champion/Hot/Warm/Cold)
- [x] CRM Contacts tab: Sort by Score or Name dropdown
- [x] CRM Contacts tab: Refresh Scores button (bulk recompute)
- [x] CRM Contacts tab: Per-contact score recompute button (TrendingUp icon)
- [x] CRM Contacts tab: Expandable score breakdown (opens, clicks, purchases, recency, total)
- [x] CRM Statistics tab: Engagement Score Distribution card (tier counts + percentages)
- [x] CRM Statistics tab: Average score across all contacts
- [x] CRM Statistics tab: Scoring guide (how points are calculated)
- [x] CRM Statistics tab: Refresh All Scores button
- [x] 36 new tests for scoring algorithm (168 total, all passing)

## CRM CSV Import/Export Fix (COMPLETED)
- [x] Audit: backend had naive comma-split parser (broke on quoted fields), frontend had no UI at all
- [x] Fix CSV export: RFC 4180 quoting (always quote every cell), CRLF line endings, 12 columns
- [x] Fix CSV import: full RFC 4180 parser (handles commas/newlines/quotes inside fields)
- [x] Fix CSV import: header alias map (First Name/firstname/first_name all work, postcode/zip, etc.)
- [x] Fix CSV import: email validation with regex, segment/status validation with fallback to 'lead'/'active'
- [x] Fix CSV import: returns { imported, skipped, errors } with per-row error messages
- [x] Add getCSVTemplate procedure returning a pre-filled example CSV
- [x] Frontend: Import CSV button opens drag-and-drop dialog
- [x] Frontend: Drag-and-drop zone with file picker fallback
- [x] Frontend: Results view showing imported/skipped counts and per-row error list
- [x] Frontend: 'Import Another File' and 'Done' buttons in results view
- [x] Frontend: Export CSV button triggers download directly
- [x] Frontend: Template button downloads the import template CSV
- [x] Frontend: Column reference guide shown in import dialog
- [x] 52 new tests for CSV parser, header aliases, validation, export quoting, round-trip (220 total, all passing)

## Subscription & Monetization System (COMPLETED)
- [x] Add promoter to role enum in users table (admin/user/instructor/promoter)
- [x] Add stripeCustomerId, subscriptionPlan fields to users table
- [x] Add subscriptions table (id, userId, plan, status, stripeSubscriptionId, stripeCustomerId, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd)
- [x] Add usageTracking table (monthly counters: eventsCreated, classesCreated, coursesCreated)
- [x] Run db:push migration
- [x] server/stripe/plans.ts: PLANS definitions (starter/creator/promoter_plan/academy), limits, commissionRates, features
- [x] calculateCheckoutAmounts() helper: ticket + platform fee + Stripe processing fee (with fallback to starter)
- [x] canCreateEvent/canCreateClass/canCreateCourse entitlement helpers
- [x] subscriptionsRouter: listPlans, getMySubscription, createSubscriptionCheckout, createBillingPortal, cancelSubscription, checkEntitlement, recordUsage
- [x] processSubscriptionWebhook() exported from subscriptions.ts
- [x] stripe-webhook.ts: handles customer.subscription.created/updated/deleted + invoice.payment_succeeded/failed
- [x] All 3 checkout procedures (event/course/class) now show 3 line items: ticket price + platform fee + processing fee
- [x] Pricing page (/pricing): 4 plan cards with limits, features, commission rates, upgrade buttons
- [x] Billing page (/billing): current plan, usage bars, subscription status, manage billing portal button
- [x] Header: Plans + Billing links for admin/instructor/promoter roles
- [x] App.tsx: /pricing and /billing routes registered
- [x] 34 new tests for plan definitions, fee calculation, entitlement enforcement (254 total, all passing)

## Entitlement Enforcement, Scheduled Campaigns & Unsubscribe (COMPLETED)
- [x] canCreateEvent/canCreateClass/canCreateCourse now return EntitlementResult {allowed, reason, limit, current}
- [x] UpgradePlanDialog reusable component (shows plan name, limit, current usage, upgrade CTA to /pricing)
- [x] EventsTab: checkEntitlement query + UpgradePlanDialog shown before create
- [x] CoursesTab: checkEntitlement query + UpgradePlanDialog shown before create
- [x] ClassesTab: checkEntitlement query + UpgradePlanDialog shown before create
- [x] Scheduled campaign processor: processScheduledCampaigns() runs every 5 min on server startup
- [x] processCampaign(id): fetches campaign, sends to active contacts, marks as sent
- [x] Unsubscribe HMAC token: generateUnsubscribeToken(contactId) → 32-char hex (timing-safe)
- [x] buildUnsubscribeUrl(baseUrl, contactId) helper exported from emailTracking.ts
- [x] GET /api/email/unsubscribe/:contactId/:token Express endpoint
  - [x] Validates HMAC token with timing-safe comparison
  - [x] Marks contact status as 'unsubscribed' in crmContacts
  - [x] Returns branded HTML confirmation page (dark theme, UK Sabor branding)
  - [x] Handles already-unsubscribed, not-found, and invalid-token cases
- [x] Unsubscribe footer injected into every outgoing campaign email (both sendCampaign and processCampaign)
- [x] {{unsubscribeUrl}} template placeholder supported for custom placement in templates
- [x] 275 tests passing (all 14 test files, 0 failures)

## Subscription System Update (COMPLETED)
- [x] Starter plan: 1 event/month, 0 weekly classes, 0 courses (enforced backend + frontend)
- [x] Creator plan: 1 event/month, 1 weekly class, 0 courses (enforced backend + frontend)
- [x] Promoter plan: 5 events/month, 5 weekly classes
- [x] Academy plan: unlimited everything
- [x] Added BillingInterval type ('monthly' | 'yearly') to plans.ts
- [x] Added getStripePriceId(planKey, interval) helper returning correct Stripe price ID
- [x] Added calcYearlyPrice() helper (monthlyPrice * 12 * 0.8)
- [x] Updated createSubscriptionCheckout to accept billingInterval param
- [x] Updated processSubscriptionWebhook to match plan by both monthly and yearly price IDs
- [x] Pricing page: billing toggle (Monthly / Yearly Save 20%) with animated pill switcher
- [x] Pricing page: shows monthly-equivalent price when yearly selected
- [x] Pricing page: shows yearly total with strikethrough of full monthly-equivalent price
- [x] Pricing page: per-plan savings amount shown on yearly billing
- [x] Pricing page: annual savings summary banner
- [x] Pricing page: 'Most popular' badge on Promoter plan
- [x] Pricing page: correct billingInterval passed to Stripe checkout
- [x] Billing page: shows billing interval (Monthly/Yearly) for active subscriptions
- [x] Billing page: fixed canCreate?.event?.allowed === false check (was using old boolean API)
- [x] Tests updated for new plan limits (276 total, all passing)
- [x] TypeScript: 0 errors

## MANUAL STEPS REQUIRED (Stripe)
- [ ] In Stripe Dashboard: create 3 yearly prices for Creator, Promoter, Academy plans
- [ ] Add env vars: STRIPE_PRICE_CREATOR_YEARLY, STRIPE_PRICE_PROMOTER_YEARLY, STRIPE_PRICE_ACADEMY_YEARLY
- [ ] Set these in Settings → Secrets in the Management UI

## Stripe Sync, Invoice PDF & Promoter Profile (COMPLETED)
- [x] Sync Stripe Products: backend syncStripeProducts admin mutation
- [x] Sync Stripe Products: creates/updates products and monthly+yearly prices for all 3 paid plans
- [x] Sync Stripe Products: returns price IDs for manual env var setup (or auto-saves via DB)
- [x] Sync Stripe Products: admin UI button in Admin Dashboard → Settings tab
- [x] Invoice PDF: generate PDF invoice after successful payment (event/course/class)
- [x] Invoice PDF: include order ID, item name, buyer name/email, amount, date, UK Sabor branding
- [x] Invoice PDF: attach to payment confirmation email (sendOrderConfirmationEmail with invoicePdf Buffer)
- [ ] Invoice PDF: downloadable from user dashboard (My Tickets / My Courses / My Classes)
- [x] Promoter profile: GET /api/trpc/promoters.getPublicProfile returns promoter user + their events/classes
- [x] Promoter profile: /promoters/:id public page with promoter bio, events, classes
- [x] Promoter profile: shows upcoming events and active classes hosted by the promoter
- [x] Promoter profile: links to events and classes for booking
- [x] 8 new tests for invoice PDF generation and promoter plan labels (284 total, all passing)

## Role & Dashboard Fixes (COMPLETED)
- [x] Fix Stripe price error: auto-create Stripe prices on first checkout if env vars are missing (getOrCreatePriceId)
- [x] Promoter role: grant access to Admin/Creator Dashboard (same as instructor)
- [x] Promoter role: can create events, classes, courses based on subscription plan
- [x] Instructor role: can create events (not just courses/classes) based on subscription plan
- [x] Instructor role: can edit their own instructor profile (bio, photo, specialties, social links)
- [x] Admin Dashboard: show Events, Classes, Courses, and Profile tabs for instructors/promoters
- [x] Admin Dashboard: listMyEvents/listMyClasses/listMyCourses procedures for scoped views
- [x] Instructors table: added userId and websiteUrl fields, db:push applied
- [x] updateMyProfile procedure: creates or updates instructor record linked to user account
- [x] updateUserRole: now includes promoter as assignable role
- [x] 284 tests passing, 0 TypeScript errors

## Invoice Download & Promoters Listing (COMPLETED)
- [x] Invoice download: backend downloadInvoice tRPC mutation (regenerates PDF on demand, base64 response)
- [x] Invoice download: InvoiceDownloadButton component (base64 decode → Blob → browser download)
- [x] Invoice download: "Invoice PDF" button in My Tickets tab (per ticket, uses orderId)
- [x] Invoice download: "Invoice PDF" button in My Courses tab (per purchase, uses orderId)
- [x] Invoice download: "Invoice PDF" button in My Classes tab (per purchase, uses orderId)
- [x] Invoice download: "Invoice PDF" button in Orders tab (shown for completed orders)
- [x] Promoters listing: /promoters public page listing all instructors + promoter-role users
- [x] Promoters listing: enriched with photo, bio, specialties, Instagram, plan badge, role badge
- [x] Promoters listing: shows event/class/course counts per promoter
- [x] Promoters listing: search by name/specialty + filter by role (All/Promoters/Instructors)
- [x] Promoters listing: links to /promoters/:id individual profile page
- [x] Promoters listing: route registered in App.tsx at /promoters
- [x] Promoters listing: "Promoters" link added to desktop and mobile Header nav
- [x] 284 tests passing, 0 TypeScript errors

## Full Platform Audit (COMPLETED)
- [x] Fix admin role assignment: promoter role now showing in UI dropdown
- [x] Audit all backend routers for permission gaps - all verified
- [x] Audit schema for missing fields or inconsistencies - all verified
- [x] Audit admin panel tabs and forms - fixed role dropdown
- [x] Audit instructor/promoter panel tabs and create forms - verified working
- [x] Audit user dashboard tabs and data correctness - verified
- [x] Audit public pages verified - Events, Classes, Courses, Instructors, Promoters
- [x] Fix PromoterProfile to show actual photo, bio, specialties, Instagram, website
- [x] Fix PromoterProfile to show only promoter's own events (not all platform events)
- [x] Fix ClassesTab to use listMyClasses for non-admin users (scoped view)
- [x] Fix CoursesTab to use listMyCourses for non-admin users (scoped view)
- [x] Improve instructor profile warning message in ClassesTab
- [x] Second verification pass: 284 tests passing, 0 TypeScript errors
- [x] Dev server healthy and running


## UI/UX Improvements Phase 2 (COMPLETED)
- [x] Add descriptive icons to event/class/course cards: Clock for duration, Video for lessons count
- [x] Improve empty state messages with icons and CTAs: Calendar icon for events, BookOpen for courses
- [x] Optimize mobile navigation menu: reduced padding (py-1.5), smaller font (text-sm), compact gaps
- [x] Standardize badge colors: emerald/amber/rose for levels, accent for all-levels
- [x] Replace spinners with skeleton loaders: ListSkeleton component for Events/Courses pages
- [x] All 284 tests passing, 0 TypeScript errors


## Subscription System Fixes (COMPLETED)
- [x] Fixed webhook to update user role based on subscription plan (creator/promoter_plan → instructor, academy → promoter)
- [x] Webhook now handles subscription.created and customer.subscription.updated events correctly
- [x] Role is now updated in database immediately after successful subscription payment
- [x] Added additionalRoles field to users table for future multi-role support
- [x] Subscriptions tab added to user dashboard with plan details, renewal date, features list
- [x] SubscriptionsTab shows current plan, billing amount, renewal date, and features
- [x] Links to manage subscription and upgrade plan from dashboard
- [x] All 284 tests passing, 0 TypeScript errors
- [x] db:push migration applied successfully


## Billing Page & Multi-Role Fixes (COMPLETED)
- [x] Fix Billing page: add cache invalidation after Stripe checkout redirect (useEffect + refetch)
- [x] Fix Billing page: use useEffect to refetch subscription data when page loads or window focus
- [x] Fix Billing page: invalidate trpc.subscriptions.getMySubscription cache after purchase
- [x] Implement multi-role support: added roles JSON field to users table
- [x] Implement multi-role support: added parseRoles, serializeRoles, getAllRoles helper functions
- [x] Implement multi-role support: updated updateUserRole to accept additionalRole parameter
- [x] Implement multi-role support: roles stored as JSON array in database
- [x] Database migration applied: roles field added to users table
- [x] All 284 tests passing, 0 TypeScript errors
- [x] Billing page now auto-refreshes after Stripe checkout completion


## Admin Dashboard Multi-Role UI (COMPLETED)
- [x] Update UsersTab to add secondary role dropdown for secondary role assignment
- [x] Update role mutation call to include additionalRole parameter
- [x] Add CheckCircle button to confirm role changes when secondary role is selected
- [x] Secondary role dropdown shows only Instructor and Promoter options (not User/Admin)
- [x] All 284 tests passing, 0 TypeScript errors


## Modern UI Redesign Phase (COMPLETED)
- [x] Update global CSS: improved typography, modern color palette, smooth animations
- [x] Add smooth animations: fadeIn, slideUp keyframes with animate classes
- [x] Modernize header: gradient background, shadow effects, improved navigation
- [x] Redesign card components: better shadows (shadow-2xl), hover effects, border accents
- [x] Update button styles: rounded-xl, active:scale-95, improved focus states
- [x] Improve form inputs: focus rings with ring-2 ring-offset-2
- [x] Add gradient backgrounds to key sections (header, hero)
- [x] Enhance navigation: underline hover effects, better spacing
- [x] All 284 tests passing, 0 TypeScript errors


## Advanced UI Enhancements Phase 2 (COMPLETED)
- [x] Add advanced animations: bounce, pulse, glow, float keyframes
- [x] Enhanced hero section with animated gradient background (animate-pulse)
- [x] Add floating glow effect in hero section (animate-float)
- [x] Enhance color palette with more vibrant gradients (from-[#1a0a1f])
- [x] Add glass-morphism effects to cards (glass class with backdrop-filter)
- [x] Improve button animations with rounded-xl and active:scale-95
- [x] Enhanced form inputs with better focus states (ring-2 ring-offset-2)
- [x] Add page transition animations (fadeIn, slideUp)
- [x] Improve card shadows with shadow-2xl and hover effects
- [x] All 284 tests passing, 0 TypeScript errors
