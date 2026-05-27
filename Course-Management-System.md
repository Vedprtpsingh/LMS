# Course Management System — LMS Module
### React (Bootstrap + JSX) · Node.js · MySQL · Firebase Storage

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                   │
│   Instructor UI   │   Admin UI   │   Student UI         │
└────────────┬──────────────────────────────┬─────────────┘
             │                              │
             ▼                              ▼
┌────────────────────────┐    ┌─────────────────────────┐
│   Node.js REST API     │    │   Firebase Storage       │
│   (Express + JWT)      │    │   Videos · PDFs · Imgs   │
└────────────┬───────────┘    └─────────────────────────┘
             │
             ▼
┌────────────────────────┐
│   MySQL — lmsdb        │
│   (Existing users DB)  │
└────────────────────────┘
```

> **Note:** User data (students, instructors, admins) already exists in `lmsdb`. The Course Management module connects to this existing database — no new user tables are created.

---

## 2. Course Approval Workflow

```
Instructor                    Admin                     Student
    │                           │                          │
    │  1. Fill course details    │                          │
    │  2. Upload media           │                          │
    │  3. Submit for review      │                          │
    │──────────────────────────▶│                          │
    │                           │  4. Review content        │
    │                           │  5a. Approve ──────────▶ │ Visible
    │  5b. Reject + comments    │                          │
    │◀──────────────────────────│                          │
    │  6. Fix & resubmit        │                          │
    │──────────────────────────▶│                          │
    │                           │  7. Approve & Publish ──▶│ Visible
    │                           │  8. Archive (optional)   │
    │                           │──────────────────────────│ Hidden
```

---

## 3. Course Status State Machine

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
  [Instructor       │    ┌──────────┐   Submit    ┌─────────┐│
   creates] ───────▶│    │  DRAFT   │────────────▶│ PENDING ││
                    │    └──────────┘             └────┬────┘│
                    │       ▲  ▲                       │     │
                    │       │  │ Edit           ┌──────┴──┐  │
                    │       │  └────────────────│ REJECTED│  │
                    │       │     Instructor    └─────────┘  │
                    │       │     edits                  │   │
                    │       │                    ┌───────▼──┐│
                    │       │          Approve   │ APPROVED ││
                    │       │                    └────┬─────┘│
                    │       │                         │Publish│
                    │       │                    ┌────▼─────┐│
                    │       │                    │PUBLISHED ││
                    │       │                    └────┬─────┘│
                    │       │                         │Archive│
                    │       │                    ┌────▼─────┐│
                    │       │                    │ ARCHIVED ││
                    │       │                    └──────────┘│
                    │       │                         │Restore│
                    │       └─────────────────────────┘      │
                    └─────────────────────────────────────────┘
```

| State      | Visible To              | Editable | Next States              |
|------------|-------------------------|----------|--------------------------|
| DRAFT      | Instructor only         | ✅ Yes   | PENDING                  |
| PENDING    | Instructor + Admin      | ❌ No    | APPROVED · REJECTED      |
| APPROVED   | Instructor + Admin      | ❌ No    | PUBLISHED                |
| REJECTED   | Instructor + Admin      | ✅ Yes   | PENDING (resubmit)       |
| PUBLISHED  | Everyone (incl. students) | ❌ No  | ARCHIVED                 |
| ARCHIVED   | Admin only              | ❌ No    | PUBLISHED (restore)      |

---

## 4. User Roles & Permissions

```
                    ┌─────────────────────────────────────┐
                    │         Existing lmsdb Users         │
                    │  users table: role = INSTRUCTOR      │
                    │               role = ADMIN           │
                    │               role = STUDENT         │
                    └────────────┬────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
     ┌─────────────┐    ┌──────────────┐   ┌──────────────┐
     │ INSTRUCTOR  │    │    ADMIN     │   │   STUDENT    │
     └──────┬──────┘    └──────┬───────┘   └──────┬───────┘
            │                  │                  │
     ┌──────▼──────┐    ┌──────▼───────┐   ┌──────▼───────┐
     │ Create      │    │ View pending │   │ Browse        │
     │ Edit draft  │    │ Approve      │   │ published     │
     │ Upload media│    │ Reject +     │   │ Enroll        │
     │ Submit      │    │ comments     │   │ Watch videos  │
     │ Resubmit    │    │ Publish      │   │ Download PDFs │
     │ View own    │    │ Archive      │   │ Take quizzes  │
     │ dashboard   │    │ Manage users │   │ Track progress│
     │ View        │    │ Analytics    │   └──────────────┘
     │ feedback    │    └──────────────┘
     └─────────────┘
```

| Permission     | Instructor | Admin | Student |
|----------------|------------|-------|---------|
| Create course  | ✅         | ❌    | ❌      |
| Edit course    | ✅         | ❌    | ❌      |
| Upload media   | ✅         | ❌    | ❌      |
| Submit course  | ✅         | ❌    | ❌      |
| Review course  | ❌         | ✅    | ❌      |
| Approve/Reject | ❌         | ✅    | ❌      |
| Publish course | ❌         | ✅    | ❌      |
| Archive course | ❌         | ✅    | ❌      |
| Enroll         | ❌         | ❌    | ✅      |
| Watch/Download | ❌         | ❌    | ✅      |

---

## 5. Database Schema

> Tables below are **added** to the existing `lmsdb`. The `users` table already exists with `id`, `name`, `email`, `role`, etc.

```
lmsdb (existing)                 New tables added
─────────────────                ──────────────────────────────
users                            categories
 ├── id (PK)          ◀──────    courses
 ├── name                         ├── id (PK)
 ├── email                        ├── instructor_id (FK → users.id)
 ├── role                         ├── category_id  (FK → categories.id)
 └── ...                          ├── title
                                  ├── description
                                  ├── status  ENUM
                                  ├── level   ENUM
                                  ├── thumbnail_url  (Firebase URL)
                                  ├── price
                                  ├── language
                                  ├── avg_rating
                                  ├── enrollment_count
                                  ├── created_at
                                  ├── updated_at
                                  └── published_at

courses ◀──────────────────────  course_reviews
                                  ├── id (PK)
                                  ├── course_id   (FK → courses.id)
                                  ├── admin_id    (FK → users.id)
                                  ├── decision    ENUM: APPROVED|REJECTED
                                  ├── comment     TEXT
                                  └── reviewed_at

courses ◀──────────────────────  modules
                                  ├── id (PK)
                                  ├── course_id   (FK → courses.id)
                                  ├── title
                                  ├── sort_order
                                  └── is_free_preview

modules ◀──────────────────────  lessons
                                  ├── id (PK)
                                  ├── module_id   (FK → modules.id)
                                  ├── title
                                  ├── type        ENUM: VIDEO|PDF|QUIZ|TEXT
                                  ├── resource_url  (Firebase URL)
                                  ├── duration_seconds
                                  └── sort_order

lessons ◀──────────────────────  quizzes
                                  ├── id (PK)
                                  ├── lesson_id   (FK → lessons.id)
                                  ├── title
                                  ├── passing_score
                                  └── time_limit_mins

quizzes ◀──────────────────────  quiz_questions
                                  ├── id (PK)
                                  ├── quiz_id     (FK → quizzes.id)
                                  ├── question    TEXT
                                  ├── type        ENUM: MCQ|TRUE_FALSE|SHORT
                                  ├── options     JSON
                                  ├── correct_answer
                                  └── points

users   ◀──────────────────────  enrollments
courses ◀──────────────────────   ├── id (PK)
                                  ├── student_id  (FK → users.id)
                                  ├── course_id   (FK → courses.id)
                                  ├── enrolled_at
                                  ├── progress_percent
                                  └── completed_at

enrollments ◀──────────────────  progress
lessons     ◀──────────────────   ├── id (PK)
                                  ├── enrollment_id (FK → enrollments.id)
                                  ├── lesson_id   (FK → lessons.id)
                                  ├── completed   BOOLEAN
                                  ├── watch_seconds
                                  └── last_accessed

users  ◀───────────────────────  quiz_attempts
quizzes ◀──────────────────────   ├── id (PK)
                                  ├── student_id  (FK → users.id)
                                  ├── quiz_id     (FK → quizzes.id)
                                  ├── score
                                  ├── passed      BOOLEAN
                                  └── attempted_at

courses ◀──────────────────────  tags  +  course_tags
                                  tags: id · name · slug
                                  course_tags: course_id · tag_id
```

---

## 6. Firebase Storage — File Upload Flow

```
Instructor Browser
       │
       │  1. Select file (video / PDF / thumbnail)
       │
       ▼
  React Frontend
       │
       │  2. Request signed upload URL from Node API
       │     POST /api/upload/signed-url
       │     Body: { fileType, mimeType, courseId }
       │
       ▼
  Node.js API
       │
       │  3. Generate Firebase signed URL
       │     (Admin SDK — firebase-admin)
       │
       ▼
  Firebase Storage
       │
       │  4. Return signed URL to frontend
       │
       ▼
  React Frontend
       │
       │  5. PUT file directly to Firebase Storage
       │     (bypasses Node — large file safe)
       │
       ▼
  Firebase Storage  ──▶  stores file
       │
       │  6. On upload complete, frontend sends
       │     file URL to Node API
       │     POST /api/lessons/  (resource_url = Firebase URL)
       │
       ▼
  MySQL lmsdb
       └── lessons.resource_url = "https://storage.googleapis.com/..."
```

### Upload Limits

| Asset      | Format        | Max Size  | Firebase Path                         |
|------------|---------------|-----------|---------------------------------------|
| Thumbnail  | JPG · PNG     | 5 MB      | `thumbnails/{courseId}/{filename}`    |
| Video      | MP4 · MOV     | 2 GB      | `videos/{courseId}/{moduleId}/{name}` |
| PDF        | PDF           | 50 MB     | `pdfs/{courseId}/{moduleId}/{name}`   |
| Caption    | SRT · VTT     | 1 MB      | `captions/{lessonId}/{name}`          |

---

## 7. REST API Endpoints

```
Authentication (uses existing lmsdb users)
─────────────────────────────────────────
POST   /api/auth/login              → JWT token
POST   /api/auth/logout

Courses
─────────────────────────────────────────
GET    /api/courses                 → list (filter by status, category, level)
GET    /api/courses/:id             → course detail
POST   /api/courses                 → create draft          [INSTRUCTOR]
PUT    /api/courses/:id             → update draft/rejected [INSTRUCTOR]
POST   /api/courses/:id/submit      → DRAFT → PENDING       [INSTRUCTOR]
POST   /api/courses/:id/resubmit    → REJECTED → PENDING    [INSTRUCTOR]
DELETE /api/courses/:id             → delete draft          [INSTRUCTOR]

Admin — Course Review
─────────────────────────────────────────
GET    /api/admin/courses/pending   → pending queue         [ADMIN]
POST   /api/admin/courses/:id/approve  → PENDING → APPROVED [ADMIN]
POST   /api/admin/courses/:id/reject   → PENDING → REJECTED [ADMIN]
POST   /api/admin/courses/:id/publish  → APPROVED → PUBLISHED [ADMIN]
POST   /api/admin/courses/:id/archive  → PUBLISHED → ARCHIVED [ADMIN]
POST   /api/admin/courses/:id/restore  → ARCHIVED → PUBLISHED [ADMIN]

Modules & Lessons
─────────────────────────────────────────
POST   /api/courses/:id/modules         → add module       [INSTRUCTOR]
PUT    /api/modules/:id                 → edit module      [INSTRUCTOR]
DELETE /api/modules/:id                 → delete module    [INSTRUCTOR]
POST   /api/modules/:id/lessons         → add lesson       [INSTRUCTOR]
PUT    /api/lessons/:id                 → edit lesson      [INSTRUCTOR]
DELETE /api/lessons/:id                 → delete lesson    [INSTRUCTOR]

File Upload
─────────────────────────────────────────
POST   /api/upload/signed-url           → Firebase signed URL [INSTRUCTOR]

Quizzes
─────────────────────────────────────────
POST   /api/lessons/:id/quiz            → create quiz      [INSTRUCTOR]
PUT    /api/quizzes/:id                 → update quiz      [INSTRUCTOR]
POST   /api/quizzes/:id/questions       → add question     [INSTRUCTOR]
PUT    /api/quiz-questions/:id          → edit question    [INSTRUCTOR]
POST   /api/quizzes/:id/attempt         → submit attempt   [STUDENT]

Enrollments & Progress
─────────────────────────────────────────
POST   /api/enrollments                 → enroll in course [STUDENT]
GET    /api/enrollments/my              → my enrollments   [STUDENT]
POST   /api/progress                    → mark lesson done [STUDENT]
GET    /api/progress/:enrollmentId      → get progress     [STUDENT]

Search
─────────────────────────────────────────
GET    /api/courses/search?q=&category=&level=&status=&sort=

Analytics (Admin)
─────────────────────────────────────────
GET    /api/admin/analytics/enrollments
GET    /api/admin/analytics/completion
GET    /api/admin/analytics/revenue
```

---

## 8. Frontend Pages & Components

### Instructor

```
/instructor
├── /dashboard            Stat cards · recent courses · alerts
├── /courses              Table: all my courses + status badges
├── /courses/new          Step 1 — basic info form (title, desc, category, level, tags)
├── /courses/:id/media    Step 2 — module builder + upload zone (video/PDF)
├── /courses/:id/quiz     Step 3 — quiz builder (MCQ / True-False / Short)
├── /courses/:id/preview  Final check before submit
└── /feedback             Rejection comments + resubmit button
```

### Admin

```
/admin
├── /dashboard            Stats · pending count alert
├── /review               Pending queue · 6-point checklist · approve/reject
├── /published            Published table · archive · feature toggle
├── /analytics            Bar charts: enrollments · completion · revenue
└── /users                User table · invite · deactivate
```

### Student

```
/student
├── /dashboard            Continue learning · progress bars
├── /browse               Course grid · search · filter · sort
├── /course/:id           Course detail · enroll CTA
├── /my-courses           Enrolled list + per-lesson progress
├── /learn/:id            Video player · PDF viewer · quiz
└── /progress             Weekly activity · quiz scores · streak
```

---

## 9. Video & PDF Feature — Component Flow

```
Video Upload (Instructor)
──────────────────────────────────────────────────────
  <VideoUploader courseId lessonId>
       │
       ├── Drag-and-drop zone  (MP4 / MOV · max 2 GB)
       ├── Progress bar (chunked upload to Firebase)
       ├── On complete → save URL to lessons table
       └── Optional: SRT/VTT caption upload


Video Playback (Student)
──────────────────────────────────────────────────────
  <VideoPlayer lessonId>
       │
       ├── Fetch resource_url from API
       ├── HTML5 <video> + Firebase signed URL (time-limited)
       ├── Track watch_seconds every 30s → POST /api/progress
       └── On 90% watched → mark lesson completed


PDF Upload (Instructor)
──────────────────────────────────────────────────────
  <PDFUploader courseId lessonId>
       │
       ├── File picker  (PDF · max 50 MB)
       ├── Upload to Firebase pdfs/ path
       └── Save URL to lessons.resource_url


PDF Viewer (Student)
──────────────────────────────────────────────────────
  <PDFViewer lessonId>
       │
       ├── Fetch signed URL from API
       ├── Render with react-pdf (PDF.js)
       ├── Download button → window.open(signedUrl)
       └── On view → mark lesson completed
```

---

## 10. Admin Review Checklist

```
Course submitted (PENDING)
         │
         ▼
  ┌──────────────────────────────────────┐
  │ Admin Review Checklist               │
  │                                      │
  │  ☐  Content quality — clear & accurate │
  │  ☐  Audio/video — good production    │
  │  ☐  Plagiarism — original content    │
  │  ☐  All modules complete             │
  │  ☐  No offensive material            │
  │  ☐  Quiz answers valid               │
  └──────────┬───────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
  All ✅         Any ❌
      │             │
      ▼             ▼
  APPROVE       REJECT
  (status →     (status →
  APPROVED)     REJECTED +
                comment saved
                to course_reviews)
```

---

## 11. Search & Filter

```
GET /api/courses/search

Query params:
  q          full-text on title + description
  category   category slug
  level      BEGINNER | INTERMEDIATE | ADVANCED
  status     published (student) | any (admin) | own (instructor)
  sort       latest | popular | rating | enrolled

Response:
  {
    total: number,
    page: number,
    courses: [ { id, title, thumbnail_url, instructor,
                 level, rating, enrollment_count, status } ]
  }
```

---

## 12. Project Folder Structure

```
project-root/
├── client/                        React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── instructor/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── CourseList.jsx
│   │   │   │   ├── CreateCourse.jsx
│   │   │   │   ├── UploadMedia.jsx
│   │   │   │   ├── QuizBuilder.jsx
│   │   │   │   └── Feedback.jsx
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── PendingReview.jsx
│   │   │   │   ├── Published.jsx
│   │   │   │   ├── Analytics.jsx
│   │   │   │   └── Users.jsx
│   │   │   └── student/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Browse.jsx
│   │   │       ├── CourseDetail.jsx
│   │   │       ├── Learn.jsx
│   │   │       └── Progress.jsx
│   │   ├── components/
│   │   │   ├── VideoUploader.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── PDFUploader.jsx
│   │   │   ├── PDFViewer.jsx
│   │   │   ├── CourseCard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── ReviewChecklist.jsx
│   │   ├── services/
│   │   │   ├── api.js              axios instance + JWT interceptor
│   │   │   └── firebase.js         Firebase Storage SDK
│   │   └── context/
│   │       └── AuthContext.jsx     role-based route guard
│
├── server/                        Node.js backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── modules.js
│   │   ├── lessons.js
│   │   ├── quizzes.js
│   │   ├── enrollments.js
│   │   ├── progress.js
│   │   ├── upload.js              Firebase signed URL generator
│   │   └── admin.js
│   ├── middleware/
│   │   ├── auth.js                JWT verify
│   │   └── role.js                requireRole('ADMIN') etc.
│   ├── models/                    MySQL query helpers
│   ├── config/
│   │   ├── db.js                  mysql2 pool → lmsdb
│   │   └── firebase.js            firebase-admin init
│   └── app.js
│
└── database/
    └── migrations/
        └── 001_course_management.sql   all new tables (no changes to users)
```

---

## 13. Environment Variables

```
# Server (.env)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lmsdb
DB_USER=root
DB_PASS=yourpassword

JWT_SECRET=your_jwt_secret

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Client (.env)
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_APP_ID=...
```

---

## 14. Key Implementation Notes

1. **Existing users** — Query `lmsdb.users` directly using `role` column. No changes to the users table.
2. **JWT auth** — On login, fetch user from `lmsdb.users`, sign JWT with `{ id, role }`. All protected routes verify role via middleware.
3. **Video upload** — Use Firebase signed URLs (PUT) from the client directly. Node API only generates the URL and saves the final Firebase path to MySQL after upload.
4. **PDF viewer** — Use `react-pdf` (PDF.js wrapper). Generate a short-lived Firebase signed URL server-side to prevent direct hotlinking.
5. **Progress tracking** — Video player sends `watch_seconds` heartbeat every 30 seconds. Lesson is marked complete at 90% watched.
6. **Course locking** — PENDING and APPROVED courses have `is_editable = false` enforced both at API level (middleware check on `status`) and in the frontend (form fields disabled).
7. **Rejection cycle** — When admin rejects, a row is inserted into `course_reviews` (decision=REJECTED, comment=…) and course status flips to REJECTED. Instructor fetches latest rejection comment via `GET /api/courses/:id/review`.
8. **Search** — Use MySQL `FULLTEXT` index on `courses(title, description)` with `MATCH … AGAINST` for the `q` param.
```