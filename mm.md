# 📚 Course Management Module
### React (JSX + Bootstrap) · Node.js / Express · MySQL (`lmsdb`) · Firebase Storage
> Inspired by [adilmohak/django-lms](https://github.com/adilmohak/django-lms) — ported to the React + Node stack

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [System Architecture](#2-system-architecture)
3. [Course Approval Workflow](#3-course-approval-workflow)
4. [Course State Machine](#4-course-state-machine)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Database Schema](#6-database-schema)  
   6a. [ER Diagram (text)](#6a-er-diagram)  
   6b. [SQL DDL](#6b-sql-ddl)
7. [Firebase Storage — Upload Flow](#7-firebase-storage--upload-flow)
8. [REST API Reference](#8-rest-api-reference)
9. [Frontend Pages & Components](#9-frontend-pages--components)
10. [Component Tree](#10-component-tree)
11. [Video & PDF Feature Flow](#11-video--pdf-feature-flow)
12. [Admin Review Checklist Flow](#12-admin-review-checklist-flow)
13. [Search, Filter & Sort](#13-search-filter--sort)
14. [Analytics Dashboard](#14-analytics-dashboard)
15. [Project Folder Structure](#15-project-folder-structure)
16. [Other Modules to Integrate](#16-other-modules-to-integrate)
17. [Environment Variables](#17-environment-variables)
18. [Key Implementation Notes](#18-key-implementation-notes)

---

## 1. Module Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     COURSE MANAGEMENT MODULE                    │
│                                                                 │
│  django-lms equivalent features → ported to React + Node stack  │
│                                                                 │
│  ✅ Course add / drop          ✅ Module & lesson builder        │
│  ✅ Approval workflow          ✅ Video / PDF upload              │
│  ✅ Grade & assessment         ✅ Online quiz engine              │
│  ✅ Progress tracking          ✅ Student enrollment              │
│  ✅ Admin dashboard            ✅ Instructor dashboard            │
│  ✅ Search & filter            ✅ Analytics & reports             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    React Frontend (JSX + Bootstrap)              │
│                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   │ Instructor   │  │    Admin     │  │      Student         │  │
│   │   UI         │  │     UI       │  │        UI            │  │
│   └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└──────────┼────────────────┼───────────────────────┼─────────────┘
           │                │                       │
           ▼                ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│           Axios HTTP Client  +  JWT Interceptor                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │  REST / JSON
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Node.js / Express API                          │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  Auth    │  │ Courses  │  │  Admin   │  │ Upload (signed  │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  URL generator) │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬────────┘  │
│       └─────────────┴─────────────┴─────────────────┘           │
│                             │                                    │
│   JWT Middleware   ·   Role Guard   ·   Error Handler            │
└──────────────────────────────┬───────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
┌──────────────────────┐          ┌─────────────────────────────┐
│   MySQL — lmsdb      │          │   Firebase Storage           │
│  (existing DB)       │          │                             │
│  ─────────────────   │          │  thumbnails/{courseId}/      │
│  users (existing)    │          │  videos/{courseId}/          │
│  + 12 new tables     │          │  pdfs/{courseId}/            │
└──────────────────────┘          │  captions/{lessonId}/        │
                                  └─────────────────────────────┘
```

> **`lmsdb` note:** The `users` table already exists with `id`, `name`, `email`, `password_hash`, `role`. All new tables reference `users.id` as a foreign key — no changes to the users table.

---

## 3. Course Approval Workflow

```
 INSTRUCTOR                        ADMIN                      STUDENT
─────────────────────────────────────────────────────────────────────
     │                               │                           │
     │  [1] Fill course details      │                           │
     │      Title · Desc · Category  │                           │
     │      Level · Tags · Thumbnail │                           │
     │                               │                           │
     │  [2] Build modules & lessons  │                           │
     │      Upload videos + PDFs     │                           │
     │      Add quizzes              │                           │
     │                               │                           │
     │  [3] Preview & submit ───────▶│                           │
     │      Status → PENDING         │                           │
     │                               │  [4] Reviews content      │
     │                               │  ─ 6-point checklist ─    │
     │                               │                           │
     │                               │  [5a] APPROVE             │
     │                               │      Status → APPROVED    │
     │                               │      Publish ────────────▶│ visible
     │                               │      Status → PUBLISHED   │
     │                               │                           │
     │  [5b] REJECT ◀────────────────│                           │
     │       Status → REJECTED       │                           │
     │       Comment saved           │                           │
     │                               │                           │
     │  [6] Read comments            │                           │
     │      Edit course              │                           │
     │      Resubmit ───────────────▶│                           │
     │                               │  [7] Re-review            │
     │                               │      Approve → Publish ──▶│ visible
     │                               │                           │
     │                               │  [8] Archive (optional)   │
     │                               │      Status → ARCHIVED ──▶│ hidden
─────────────────────────────────────────────────────────────────────
```

---

## 4. Course State Machine

```
                           ┌─────────────────────────────────────┐
  Instructor creates       │                                     │
  ─────────────────▶  ┌────▼─────┐                              │
                       │  DRAFT   │◀─────────────────────────┐  │
                       └────┬─────┘   Instructor edits       │  │
                            │  Submit                        │  │
                            ▼                                │  │
                       ┌──────────┐                          │  │
                       │ PENDING  │                          │  │
                       └────┬─────┘                          │  │
                   ┌────────┴────────┐                       │  │
                   │                 │                       │  │
               Approve           Reject                      │  │
                   │                 │                       │  │
                   ▼                 ▼                       │  │
            ┌──────────┐      ┌──────────┐                  │  │
            │ APPROVED │      │ REJECTED │──────────────────┘  │
            └────┬─────┘      └──────────┘  Instructor edits   │
                 │  Publish                 & resubmits         │
                 ▼                                              │
           ┌───────────┐                                        │
           │ PUBLISHED │                                        │
           └────┬──────┘                                        │
                │  Archive                                      │
                ▼                                               │
           ┌──────────┐   Restore                              │
           │ ARCHIVED │──────────────────────────────────────▶ │
           └──────────┘                                        │
                                                               │
       (cycle: ARCHIVED → PUBLISHED, not back to DRAFT)        │
                                                               │
```

### State Reference Table

| State       | Visible To                  | Editable | API Lock                  |
|-------------|-----------------------------|---------:|---------------------------|
| `DRAFT`     | Instructor only             | ✅ Yes   | No lock                   |
| `PENDING`   | Instructor + Admin          | ❌ No    | Middleware blocks PUT      |
| `APPROVED`  | Instructor + Admin          | ❌ No    | Middleware blocks PUT      |
| `REJECTED`  | Instructor + Admin          | ✅ Yes   | No lock                   |
| `PUBLISHED` | Everyone (incl. students)   | ❌ No    | Middleware blocks PUT      |
| `ARCHIVED`  | Admin only                  | ❌ No    | Middleware blocks PUT      |

---

## 5. User Roles & Permissions

```
                    lmsdb.users  (existing table)
                    ───────────────────────────────
                    id · name · email · role · ...
                          │
         ┌────────────────┼───────────────────┐
         ▼                ▼                   ▼
  ┌────────────┐   ┌────────────┐   ┌──────────────┐
  │ INSTRUCTOR │   │   ADMIN    │   │   STUDENT    │
  └─────┬──────┘   └─────┬──────┘   └──────┬───────┘
        │                │                  │
  ┌─────▼──────┐   ┌─────▼──────┐   ┌──────▼───────┐
  │ Create     │   │ View queue │   │ Browse       │
  │ Edit draft │   │ Approve    │   │ published    │
  │ Upload     │   │ Reject +   │   │ Enroll       │
  │ media      │   │ comments   │   │ Watch video  │
  │ Submit     │   │ Publish    │   │ Download PDF │
  │ Resubmit   │   │ Archive    │   │ Take quizzes │
  │ View own   │   │ Restore    │   │ Track own    │
  │ feedback   │   │ Analytics  │   │ progress     │
  └────────────┘   └────────────┘   └──────────────┘
```

### Permission Matrix

| Action          | Instructor | Admin | Student |
|-----------------|:----------:|:-----:|:-------:|
| Create course   | ✅         | ❌    | ❌      |
| Edit course     | ✅ (own)   | ❌    | ❌      |
| Upload media    | ✅         | ❌    | ❌      |
| Submit / Resubmit | ✅       | ❌    | ❌      |
| Review course   | ❌         | ✅    | ❌      |
| Approve / Reject| ❌         | ✅    | ❌      |
| Publish / Archive | ❌       | ✅    | ❌      |
| Enroll          | ❌         | ❌    | ✅      |
| Watch / Download| ❌         | ❌    | ✅ (enrolled) |
| Take quiz       | ❌         | ❌    | ✅ (enrolled) |
| View analytics  | partial    | ✅    | ❌      |

---

## 6. Database Schema

### 6a. ER Diagram

```
lmsdb (existing)
────────────────────────────────────────────────────────────────────
 users
  id (PK) · name · email · password_hash · role · avatar_url · ...

────────────────────────────────────────────────────────────────────
NEW TABLES added to lmsdb
────────────────────────────────────────────────────────────────────

 categories                        tags
  id (PK)                           id (PK)
  name                              name
  slug                              slug
  parent_id (FK → categories.id)
                     ┌──────────────────────────────────────┐
                     │              courses                  │
                     │  id (PK)                              │
 users ──────────────┤  instructor_id (FK → users.id)        │
 categories ─────────┤  category_id  (FK → categories.id)   │
                     │  title                                │
                     │  description                          │
                     │  status  ENUM                         │
                     │  level   ENUM                         │
                     │  thumbnail_url  (Firebase URL)        │
                     │  price · language                     │
                     │  avg_rating · enrollment_count        │
                     │  created_at · updated_at              │
                     │  published_at                         │
                     └──────────────┬───────────────────────┘
                                    │
          ┌─────────────────────────┼──────────────────────────┐
          │                         │                          │
          ▼                         ▼                          ▼
  course_reviews               course_tags               enrollments
  id (PK)                      course_id (FK)            id (PK)
  course_id (FK)               tag_id    (FK)            student_id   (FK → users.id)
  admin_id  (FK → users.id)                              course_id    (FK → courses.id)
  decision  ENUM                                         enrolled_at
  comment   TEXT                                         progress_percent
  reviewed_at                                            completed_at
                                    │
                                    ▼
                                 modules
                                  id (PK)
                                  course_id (FK → courses.id)
                                  title · sort_order
                                  is_free_preview
                                    │
                                    ▼
                                 lessons
                                  id (PK)
                                  module_id (FK → modules.id)
                                  title
                                  type  ENUM: VIDEO|PDF|QUIZ|TEXT
                                  resource_url  (Firebase URL)
                                  duration_seconds · sort_order
                                    │
                         ┌──────────┤
                         │          │
                         ▼          ▼
                      quizzes    progress
                      id (PK)    id (PK)
                      lesson_id  enrollment_id (FK → enrollments.id)
                      title      lesson_id     (FK → lessons.id)
                      passing_   completed  BOOLEAN
                       score     watch_seconds
                      time_limit last_accessed
                         │
                         ▼
                    quiz_questions
                      id (PK)
                      quiz_id (FK → quizzes.id)
                      question · type ENUM
                      options  JSON
                      correct_answer · points
                         │
                         ▼
                    quiz_attempts
                      id (PK)
                      student_id (FK → users.id)
                      quiz_id    (FK → quizzes.id)
                      score · passed · attempted_at
```

---

### 6b. SQL DDL

```sql
-- ─────────────────────────────────────────────────────────────
-- Run against existing lmsdb
-- users table already exists — do NOT drop or alter it
-- ─────────────────────────────────────────────────────────────

USE lmsdb;

-- Categories (hierarchical — parent_id allows sub-categories)
CREATE TABLE categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    slug        VARCHAR(100)  NOT NULL UNIQUE,
    parent_id   INT UNSIGNED  NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tags
CREATE TABLE tags (
    id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(50) NOT NULL UNIQUE,
    slug  VARCHAR(50) NOT NULL UNIQUE
);

-- Courses (core table)
CREATE TABLE courses (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    instructor_id     INT UNSIGNED NOT NULL,
    category_id       INT UNSIGNED NULL,
    title             VARCHAR(200) NOT NULL,
    description       TEXT,
    status            ENUM('DRAFT','PENDING','APPROVED','REJECTED','PUBLISHED','ARCHIVED')
                      NOT NULL DEFAULT 'DRAFT',
    level             ENUM('BEGINNER','INTERMEDIATE','ADVANCED') NULL,
    thumbnail_url     VARCHAR(500) NULL,       -- Firebase URL
    price             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    language          VARCHAR(50)  NOT NULL DEFAULT 'English',
    avg_rating        DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    enrollment_count  INT UNSIGNED NOT NULL DEFAULT 0,
    created_at        DATETIME     NOT NULL DEFAULT NOW(),
    updated_at        DATETIME     NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    published_at      DATETIME     NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(id),
    FOREIGN KEY (category_id)   REFERENCES categories(id) ON DELETE SET NULL,
    FULLTEXT INDEX ft_courses (title, description)   -- for search
);

-- Course ↔ Tag (many-to-many)
CREATE TABLE course_tags (
    course_id  INT UNSIGNED NOT NULL,
    tag_id     INT UNSIGNED NOT NULL,
    PRIMARY KEY (course_id, tag_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id)    REFERENCES tags(id)    ON DELETE CASCADE
);

-- Admin review decisions
CREATE TABLE course_reviews (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id    INT UNSIGNED NOT NULL,
    admin_id     INT UNSIGNED NOT NULL,
    decision     ENUM('APPROVED','REJECTED') NOT NULL,
    comment      TEXT NULL,
    reviewed_at  DATETIME NOT NULL DEFAULT NOW(),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id)  REFERENCES users(id)
);

-- Modules (sections inside a course)
CREATE TABLE modules (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id        INT UNSIGNED NOT NULL,
    title            VARCHAR(200) NOT NULL,
    sort_order       INT          NOT NULL DEFAULT 0,
    is_free_preview  TINYINT(1)   NOT NULL DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Lessons (video / pdf / quiz / text)
CREATE TABLE lessons (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    module_id        INT UNSIGNED NOT NULL,
    title            VARCHAR(200) NOT NULL,
    type             ENUM('VIDEO','PDF','QUIZ','TEXT') NOT NULL,
    resource_url     VARCHAR(500) NULL,        -- Firebase URL
    duration_seconds INT UNSIGNED NULL,
    sort_order       INT          NOT NULL DEFAULT 0,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Quizzes (linked to a lesson of type QUIZ)
CREATE TABLE quizzes (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lesson_id        INT UNSIGNED NOT NULL UNIQUE,
    title            VARCHAR(200) NOT NULL,
    passing_score    TINYINT UNSIGNED NOT NULL DEFAULT 70,
    time_limit_mins  TINYINT UNSIGNED NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Quiz questions
CREATE TABLE quiz_questions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quiz_id         INT UNSIGNED NOT NULL,
    question        TEXT NOT NULL,
    type            ENUM('MCQ','TRUE_FALSE','SHORT') NOT NULL,
    options         JSON NULL,              -- array of choices for MCQ
    correct_answer  VARCHAR(500) NOT NULL,
    points          TINYINT UNSIGNED NOT NULL DEFAULT 1,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Enrollments
CREATE TABLE enrollments (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id        INT UNSIGNED NOT NULL,
    course_id         INT UNSIGNED NOT NULL,
    enrolled_at       DATETIME     NOT NULL DEFAULT NOW(),
    progress_percent  DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    completed_at      DATETIME     NULL,
    UNIQUE KEY uq_enroll (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE CASCADE
);

-- Per-lesson progress
CREATE TABLE progress (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enrollment_id  INT UNSIGNED NOT NULL,
    lesson_id      INT UNSIGNED NOT NULL,
    completed      TINYINT(1)   NOT NULL DEFAULT 0,
    watch_seconds  INT UNSIGNED NOT NULL DEFAULT 0,
    last_accessed  DATETIME     NOT NULL DEFAULT NOW(),
    UNIQUE KEY uq_progress (enrollment_id, lesson_id),
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id)     REFERENCES lessons(id)
);

-- Quiz attempts
CREATE TABLE quiz_attempts (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id    INT UNSIGNED NOT NULL,
    quiz_id       INT UNSIGNED NOT NULL,
    score         TINYINT UNSIGNED NOT NULL,
    passed        TINYINT(1)   NOT NULL,
    attempted_at  DATETIME     NOT NULL DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (quiz_id)    REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX idx_courses_instructor  ON courses(instructor_id);
CREATE INDEX idx_courses_status      ON courses(status);
CREATE INDEX idx_courses_category    ON courses(category_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course  ON enrollments(course_id);
CREATE INDEX idx_progress_enrollment ON progress(enrollment_id);
CREATE INDEX idx_lessons_module      ON lessons(module_id);
CREATE INDEX idx_reviews_course      ON course_reviews(course_id);
```

---

## 7. Firebase Storage — Upload Flow

```
Instructor Browser
       │
       │ 1. User selects file
       │    (video / PDF / thumbnail)
       │
       ▼
  React <VideoUploader> or <PDFUploader>
       │
       │ 2. POST /api/upload/signed-url
       │    Body: { fileType, mimeType, courseId, moduleId? }
       │
       ▼
  Node.js Express  (upload.js route)
       │
       │ 3. firebase-admin SDK generates
       │    a signed PUT URL  (15-min expiry)
       │    Path: videos/{courseId}/{moduleId}/{uuid}.mp4
       │
       ▼
  Response: { signedUrl, firebasePath }
       │
       │ 4. React PUT file DIRECTLY to Firebase
       │    (bypasses Node — safe for 2 GB videos)
       │    Shows <ProgressBar> via XHR onprogress
       │
       ▼
  Firebase Storage  ◀──── file stored
       │
       │ 5. Upload complete callback
       │    React sends final URL to API:
       │    POST /api/lessons/:id  { resource_url }
       │
       ▼
  MySQL lmsdb
       └── lessons.resource_url = "https://storage.googleapis.com/..."

──────────────────────────────────────────────────────────────────
  Student Playback / PDF View
──────────────────────────────────────────────────────────────────
  Student requests lesson
       │
       │ GET /api/lessons/:id/signed-url
       │
       ▼
  Node.js generates SHORT-LIVED signed GET URL (10-min expiry)
  (prevents hotlinking / direct URL sharing)
       │
       ▼
  React <VideoPlayer> or <PDFViewer>
  uses time-limited URL — not the raw Firebase path
```

### Storage Paths & Limits

| Asset      | Firebase Path                             | Format        | Max Size |
|------------|-------------------------------------------|---------------|----------|
| Thumbnail  | `thumbnails/{courseId}/{filename}`        | JPG · PNG     | 5 MB     |
| Video      | `videos/{courseId}/{moduleId}/{uuid}.mp4` | MP4 · MOV     | 2 GB     |
| PDF        | `pdfs/{courseId}/{moduleId}/{uuid}.pdf`   | PDF           | 50 MB    |
| Caption    | `captions/{lessonId}/{uuid}.srt`          | SRT · VTT     | 1 MB     |

---

## 8. REST API Reference

```
─────────────────────────────────────────────────────────────────
AUTH
─────────────────────────────────────────────────────────────────
POST   /api/auth/login                → { token, user: {id,name,role} }
POST   /api/auth/logout

─────────────────────────────────────────────────────────────────
COURSES  (public / student)
─────────────────────────────────────────────────────────────────
GET    /api/courses                   list published (+ filters)
GET    /api/courses/:id               course detail
GET    /api/courses/search            full-text + filters + sort

─────────────────────────────────────────────────────────────────
COURSES  (instructor — JWT + role:INSTRUCTOR)
─────────────────────────────────────────────────────────────────
GET    /api/instructor/courses        my courses (all statuses)
POST   /api/courses                   create draft
PUT    /api/courses/:id               update DRAFT or REJECTED
DELETE /api/courses/:id               delete DRAFT
POST   /api/courses/:id/submit        DRAFT → PENDING
POST   /api/courses/:id/resubmit      REJECTED → PENDING
GET    /api/courses/:id/review        latest rejection comment

─────────────────────────────────────────────────────────────────
ADMIN  (JWT + role:ADMIN)
─────────────────────────────────────────────────────────────────
GET    /api/admin/courses/pending     pending review queue
GET    /api/admin/courses             all courses (any status)
POST   /api/admin/courses/:id/approve PENDING → APPROVED
POST   /api/admin/courses/:id/reject  PENDING → REJECTED + comment
POST   /api/admin/courses/:id/publish APPROVED → PUBLISHED
POST   /api/admin/courses/:id/archive PUBLISHED → ARCHIVED
POST   /api/admin/courses/:id/restore ARCHIVED → PUBLISHED

─────────────────────────────────────────────────────────────────
MODULES & LESSONS  (instructor)
─────────────────────────────────────────────────────────────────
POST   /api/courses/:id/modules       add module
PUT    /api/modules/:id               edit module (title, sort_order)
DELETE /api/modules/:id               delete module
PATCH  /api/modules/reorder           bulk sort_order update
POST   /api/modules/:id/lessons       add lesson
PUT    /api/lessons/:id               edit lesson
DELETE /api/lessons/:id               delete lesson
PATCH  /api/lessons/reorder           bulk sort_order update

─────────────────────────────────────────────────────────────────
FILE UPLOAD  (instructor)
─────────────────────────────────────────────────────────────────
POST   /api/upload/signed-url         get Firebase signed PUT URL
GET    /api/lessons/:id/signed-url    get Firebase signed GET URL (student)

─────────────────────────────────────────────────────────────────
QUIZZES  (instructor)
─────────────────────────────────────────────────────────────────
POST   /api/lessons/:id/quiz          create quiz
PUT    /api/quizzes/:id               update quiz settings
POST   /api/quizzes/:id/questions     add question
PUT    /api/quiz-questions/:id        edit question
DELETE /api/quiz-questions/:id        delete question

─────────────────────────────────────────────────────────────────
ENROLLMENTS & PROGRESS  (student)
─────────────────────────────────────────────────────────────────
POST   /api/enrollments               enroll in course
GET    /api/enrollments/my            my enrolled courses
POST   /api/progress                  mark lesson done / update watch_seconds
GET    /api/progress/:enrollmentId    lesson-by-lesson progress
POST   /api/quizzes/:id/attempt       submit quiz answers → score

─────────────────────────────────────────────────────────────────
ANALYTICS  (admin)
─────────────────────────────────────────────────────────────────
GET    /api/admin/analytics/overview        KPI cards
GET    /api/admin/analytics/enrollments     enroll graph (weekly)
GET    /api/admin/analytics/completion      completion % per course
GET    /api/admin/analytics/revenue         revenue chart (monthly)
GET    /api/admin/analytics/top-courses     most viewed / enrolled
GET    /api/admin/analytics/active-users    DAU / WAU / MAU
```

---

## 9. Frontend Pages & Components

### Instructor Pages

```
/instructor
├── /dashboard
│     Stat cards (courses, enrolled, avg rating)
│     Recent course table with status badges
│     Pending submission alerts
│
├── /courses
│     Table: all my courses
│     Columns: Title · Status · Enrolled · Rating · Actions
│     Actions: Edit · Preview · Submit · Delete
│
├── /courses/new          ← Step wizard (3 steps)
│   ├── Step 1: Basic Info
│   │     Title · Description · Category · Level · Language · Tags
│   ├── Step 2: Media Builder
│   │     Module accordion · <VideoUploader> · <PDFUploader>
│   └── Step 3: Quiz Builder
│         <QuizBuilder> MCQ / True-False / Short answer
│
├── /courses/:id/edit     ← Same wizard, pre-filled (DRAFT or REJECTED)
│
├── /courses/:id/preview  ← Read-only view before submit
│     Shows exactly what admin + students will see
│
└── /feedback             ← Rejection history
      List of course_reviews (decision=REJECTED)
      Rejection comment · Resubmit button
```

### Admin Pages

```
/admin
├── /dashboard
│     KPI cards · Pending count badge · Recent activity log
│
├── /review
│     Pending queue table
│     Click course → side panel opens:
│       Course preview + 6-point checklist
│       Approve button · Reject button + comment textarea
│
├── /published
│     Published courses table
│     Toggle archive · Feature/unfeature toggle
│
├── /analytics
│     Revenue chart (line) · Enrollment graph (bar)
│     Top courses (horizontal bar) · Completion donut
│     Active users (area) · Export CSV button
│
└── /users
      User table (all roles)
      Deactivate · Change role · Invite new user
```

### Student Pages

```
/student
├── /dashboard
│     "Continue learning" cards with progress bars
│     Recommended courses · Achievement badges
│
├── /browse
│     Course grid with search + filter + sort
│     <CourseCard> — thumbnail · title · instructor
│               rating · level · price · enroll CTA
│
├── /course/:id
│     Course detail page (like django-lms course_detail)
│     Syllabus accordion (modules + lessons)
│     Instructor bio · Reviews · Enroll button
│
├── /my-courses
│     Enrolled course cards + overall progress %
│
├── /learn/:id
│     Left sidebar: module/lesson tree (active highlighted)
│     Main area: <VideoPlayer> or <PDFViewer> or <QuizPlayer>
│     Progress auto-saves every 30 s for video
│
└── /progress
      Weekly activity heatmap
      Quiz scores table
      Completion certificate (if 100%)
```

---

## 10. Component Tree

```
App
├── AuthContext.jsx          (role-based route guard)
├── PrivateRoute.jsx         (redirect if not authenticated)
│
├── layouts/
│   ├── InstructorLayout.jsx  (Bootstrap sidebar nav)
│   ├── AdminLayout.jsx
│   └── StudentLayout.jsx
│
├── components/
│   │
│   ├── course/
│   │   ├── CourseCard.jsx         thumbnail · title · meta
│   │   ├── CourseForm.jsx         create/edit form (controlled)
│   │   ├── ModuleBuilder.jsx      drag-sort accordion
│   │   ├── LessonRow.jsx          type icon + actions
│   │   └── StatusBadge.jsx        Bootstrap badge by status
│   │
│   ├── media/
│   │   ├── VideoUploader.jsx      drag-drop + progress bar
│   │   ├── VideoPlayer.jsx        HTML5 + heartbeat tracker
│   │   ├── PDFUploader.jsx        file picker + progress bar
│   │   └── PDFViewer.jsx          react-pdf + download btn
│   │
│   ├── quiz/
│   │   ├── QuizBuilder.jsx        add / edit questions
│   │   ├── QuizQuestion.jsx       MCQ / T-F / short form
│   │   └── QuizPlayer.jsx         student-facing timed quiz
│   │
│   ├── admin/
│   │   ├── ReviewChecklist.jsx    6-point checkbox form
│   │   ├── PendingQueue.jsx       sortable table
│   │   └── AnalyticsChart.jsx     recharts wrapper
│   │
│   └── shared/
│       ├── SearchBar.jsx
│       ├── FilterPanel.jsx        category · level · status
│       ├── SortDropdown.jsx
│       └── Pagination.jsx
│
└── services/
    ├── api.js                 axios instance + JWT interceptor
    └── firebase.js            Firebase Storage SDK
```

---

## 11. Video & PDF Feature Flow

```
──────────────────────────────────────────────────────────────────
VIDEO UPLOAD  (Instructor side)
──────────────────────────────────────────────────────────────────
<VideoUploader courseId moduleId>
    │
    ├── Drag-and-drop zone  (MP4 / MOV · max 2 GB)
    ├── Client-side size validation
    ├── POST /api/upload/signed-url  → { signedUrl, path }
    ├── XHR PUT to Firebase signedUrl
    │       onprogress → <ProgressBar percent={...} />
    ├── On complete → POST /api/lessons  { resource_url, type:'VIDEO' }
    └── Optional: SRT/VTT caption upload (same flow)

──────────────────────────────────────────────────────────────────
VIDEO PLAYBACK  (Student side)
──────────────────────────────────────────────────────────────────
<VideoPlayer lessonId enrollmentId>
    │
    ├── GET /api/lessons/:id/signed-url  → short-lived GET URL
    ├── HTML5 <video src={signedUrl} controls />
    ├── setInterval 30 s → POST /api/progress
    │       { enrollmentId, lessonId, watch_seconds }
    └── On timeupdate: if watched ≥ 90% → mark completed

──────────────────────────────────────────────────────────────────
PDF UPLOAD  (Instructor side)
──────────────────────────────────────────────────────────────────
<PDFUploader courseId moduleId>
    │
    ├── File picker  (PDF only · max 50 MB)
    ├── POST /api/upload/signed-url  → { signedUrl }
    ├── XHR PUT to Firebase signedUrl
    └── On complete → POST /api/lessons  { resource_url, type:'PDF' }

──────────────────────────────────────────────────────────────────
PDF VIEWER  (Student side)
──────────────────────────────────────────────────────────────────
<PDFViewer lessonId enrollmentId>
    │
    ├── GET /api/lessons/:id/signed-url  → short-lived GET URL
    ├── <Document file={signedUrl}> from react-pdf (PDF.js)
    ├── Page navigator  ←  1 / 12  →
    ├── Download button → window.open(signedUrl)
    └── On first page render → mark lesson completed
```

---

## 12. Admin Review Checklist Flow

```
Course submitted  →  status = PENDING
          │
          ▼
  Admin opens /admin/review → clicks course
          │
          ▼
  ┌─────────────────────────────────────────────────┐
  │           ReviewChecklist.jsx                   │
  │                                                 │
  │  ☐  1. Content quality — clear and accurate     │
  │  ☐  2. Audio / video — good production quality  │
  │  ☐  3. Plagiarism — original content            │
  │  ☐  4. All modules and lessons present          │
  │  ☐  5. No offensive or harmful material         │
  │  ☐  6. Quiz questions and answers are valid     │
  │                                                 │
  │  ┌────────┐   ┌──────────────────────────────┐  │
  │  │APPROVE │   │ REJECT  [comment textarea]   │  │
  │  └────────┘   └──────────────────────────────┘  │
  └─────────────────────────────────────────────────┘
          │
   ┌──────┴────────┐
   │               │
All ✅          Any ❌ + comment
   │               │
   ▼               ▼
APPROVED        REJECTED
   │               │
   │          INSERT INTO course_reviews
   │          (decision='REJECTED', comment=...)
   │          UPDATE courses SET status='REJECTED'
   │
   ▼
[Admin clicks Publish]
   │
UPDATE courses SET status='PUBLISHED', published_at=NOW()
   │
   ▼
Visible to all students
```

---

## 13. Search, Filter & Sort

```
GET /api/courses/search

 Query params
 ─────────────────────────────────────────────────
 q          full-text on title + description
            (MySQL MATCH ... AGAINST with FULLTEXT index)
 category   category.slug
 level      BEGINNER | INTERMEDIATE | ADVANCED
 status     PUBLISHED (default for students)
            any value for admin
            own (instructor sees their own courses)
 sort       latest      → ORDER BY created_at  DESC
            popular     → ORDER BY enrollment_count DESC
            rating      → ORDER BY avg_rating    DESC
            enrolled    → ORDER BY enrollment_count DESC
 page       default 1
 limit      default 20

 Response shape
 ─────────────────────────────────────────────────
 {
   total: number,
   page: number,
   limit: number,
   courses: [
     {
       id, title, thumbnail_url,
       instructor: { id, name, avatar_url },
       category: { id, name },
       level, avg_rating, enrollment_count,
       status, price, language
     }
   ]
 }
```

### Search SQL (MySQL FULLTEXT)

```sql
SELECT
    c.id, c.title, c.thumbnail_url,
    c.level, c.avg_rating, c.enrollment_count, c.price,
    u.id   AS instructor_id,
    u.name AS instructor_name,
    cat.name AS category_name,
    MATCH(c.title, c.description) AGAINST (? IN BOOLEAN MODE) AS relevance
FROM courses c
JOIN users      u   ON c.instructor_id = u.id
JOIN categories cat ON c.category_id   = cat.id
WHERE
    c.status = 'PUBLISHED'
    AND (? IS NULL OR MATCH(c.title, c.description) AGAINST (? IN BOOLEAN MODE))
    AND (? IS NULL OR cat.slug = ?)
    AND (? IS NULL OR c.level  = ?)
ORDER BY
    CASE ? WHEN 'latest'  THEN c.created_at       END DESC,
    CASE ? WHEN 'rating'  THEN c.avg_rating        END DESC,
    CASE ? WHEN 'popular' THEN c.enrollment_count  END DESC
LIMIT ? OFFSET ?;
```

---

## 14. Analytics Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│                    Admin Analytics Dashboard                     │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │ 👥 Students   │  │ 📚 Courses    │  │ 💰 Revenue    │        │
│  │    12,450     │  │     184       │  │   $48,320     │        │
│  │  ▲ 8.2% /mo  │  │  ▲ 3 this wk │  │  ▲ 12.5% /mo │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│  ┌───────────────┐  ┌───────────────┐                           │
│  │ ✅ Completion │  │ 📋 Pending   │                           │
│  │    67.3%      │  │    review: 8  │                           │
│  │  ▲ 2.1% /mo  │  │  needs action │                           │
│  └───────────────┘  └───────────────┘                           │
│                                                                  │
│  Revenue Chart (line, 12 months)                                 │
│  ──────────────────────────────────────────────────────────      │
│  $8k ┤        ╭───╮                                             │
│  $6k ┤   ╭────╯   ╰──╮  ╭──────────                            │
│  $4k ┤───╯            ╰──╯                                      │
│       Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec            │
│                                                                  │
│  Enrollment Graph (bar, weekly)     Completion Donut            │
│  ──────────────────────────────     ─────────────────           │
│   200│    ▐▌                         ╭───╮  67% done            │
│   150│  ▐▌▐▌  ▐▌                    │   │  33% in progress     │
│   100│▐▌▐▌▐▌▐▌▐▌▐▌                  ╰───╯                      │
│       W1 W2 W3 W4 W5 W6                                          │
│                                                                  │
│  Most Viewed Courses (horizontal bar)   Active Users (area)     │
│  ────────────────────────────────────   ────────────────────    │
│  React Basics     ████████████ 4,200    DAU  ╭╮  ╭╮            │
│  Node.js API      ████████ 3,100        WAU  ╰╰──╯╰──          │
│  MySQL Deep Dive  ████ 1,800            MAU  ─────────          │
└──────────────────────────────────────────────────────────────────┘
```

| Chart              | Type            | X-axis    | Y-axis              | Period    |
|--------------------|-----------------|-----------|---------------------|-----------|
| Revenue            | Line            | Month     | Revenue ($)         | 12 months |
| Enrollments        | Bar             | Week      | New enrollments     | 90 days   |
| Most Viewed        | Horizontal bar  | Course    | Views               | All time  |
| Completion         | Donut           | —         | Done vs In-progress | All time  |
| Active Users       | Area            | Day       | User count          | 30 days   |

---

## 15. Project Folder Structure

```
project-root/
│
├── client/                              React + Bootstrap
│   ├── public/
│   └── src/
│       ├── pages/
│       │   ├── instructor/
│       │   │   ├── Dashboard.jsx
│       │   │   ├── CourseList.jsx
│       │   │   ├── CreateCourse.jsx     3-step wizard
│       │   │   ├── EditCourse.jsx
│       │   │   ├── CoursePreview.jsx
│       │   │   └── Feedback.jsx
│       │   ├── admin/
│       │   │   ├── Dashboard.jsx
│       │   │   ├── PendingReview.jsx
│       │   │   ├── Published.jsx
│       │   │   ├── Analytics.jsx
│       │   │   └── Users.jsx
│       │   └── student/
│       │       ├── Dashboard.jsx
│       │       ├── Browse.jsx
│       │       ├── CourseDetail.jsx
│       │       ├── MyCourses.jsx
│       │       ├── Learn.jsx            video/pdf/quiz player
│       │       └── Progress.jsx
│       │
│       ├── components/
│       │   ├── course/
│       │   │   ├── CourseCard.jsx
│       │   │   ├── CourseForm.jsx
│       │   │   ├── ModuleBuilder.jsx
│       │   │   ├── LessonRow.jsx
│       │   │   └── StatusBadge.jsx
│       │   ├── media/
│       │   │   ├── VideoUploader.jsx
│       │   │   ├── VideoPlayer.jsx
│       │   │   ├── PDFUploader.jsx
│       │   │   └── PDFViewer.jsx
│       │   ├── quiz/
│       │   │   ├── QuizBuilder.jsx
│       │   │   ├── QuizQuestion.jsx
│       │   │   └── QuizPlayer.jsx
│       │   ├── admin/
│       │   │   ├── ReviewChecklist.jsx
│       │   │   ├── PendingQueue.jsx
│       │   │   └── AnalyticsChart.jsx
│       │   └── shared/
│       │       ├── SearchBar.jsx
│       │       ├── FilterPanel.jsx
│       │       ├── SortDropdown.jsx
│       │       └── Pagination.jsx
│       │
│       ├── context/
│       │   └── AuthContext.jsx          JWT storage + role guard
│       │
│       ├── services/
│       │   ├── api.js                   axios + JWT interceptor
│       │   └── firebase.js              Firebase Storage SDK
│       │
│       └── routes/
│           └── AppRoutes.jsx            react-router-dom v6
│
├── server/                              Node.js + Express
│   ├── routes/
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── modules.js
│   │   ├── lessons.js
│   │   ├── quizzes.js
│   │   ├── enrollments.js
│   │   ├── progress.js
│   │   ├── upload.js                    Firebase signed URL generator
│   │   └── admin.js
│   │
│   ├── middleware/
│   │   ├── auth.js                      verifyJWT
│   │   ├── role.js                      requireRole('ADMIN') etc.
│   │   └── courseOwner.js               instructor owns this course?
│   │
│   ├── models/                          mysql2 query helpers
│   │   ├── courseModel.js
│   │   ├── moduleModel.js
│   │   ├── lessonModel.js
│   │   └── enrollmentModel.js
│   │
│   ├── config/
│   │   ├── db.js                        mysql2 pool → lmsdb
│   │   └── firebase.js                  firebase-admin init
│   │
│   └── app.js
│
└── database/
    └── migrations/
        └── 001_course_management.sql    all 12 new tables (no user changes)
```

---

## 16. Other Modules to Integrate

Inspired by `adilmohak/django-lms` — these complement the Course module:

| Module              | Why needed                                       | Key tables                              |
|---------------------|--------------------------------------------------|-----------------------------------------|
| **Grade Book**      | Track quiz scores, assignments, final grade      | `grades`, `grade_items`                 |
| **Assignments**     | Instructors post tasks; students submit files    | `assignments`, `submissions`            |
| **Announcements**   | Course-level notices from instructor → students  | `announcements`                         |
| **Discussion Forum**| Per-course Q&A threads (like django-lms forum)   | `threads`, `replies`                    |
| **Notifications**   | "Your course was approved / rejected"            | `notifications`                         |
| **Certificates**    | Auto-generate PDF on 100% completion             | `certificates`                          |
| **Ratings & Reviews**| Student reviews on published courses            | `course_ratings`                        |
| **Coupons**         | Discount codes on paid courses                   | `coupons`, `coupon_usages`              |
| **Report Generator**| Instructor/admin exports (CSV/PDF)               | aggregation queries + pdfkit            |

> **Priority order for your build:**  
> `Core course module` → `Enrollments + Progress` → `Quiz engine` → `Grade book` → `Announcements` → `Notifications` → `Ratings` → `Certificates`

---

## 17. Environment Variables

```bash
# ── server/.env ──────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lmsdb
DB_USER=root
DB_PASS=yourpassword

JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

PORT=5000
CLIENT_URL=http://localhost:3000

# ── client/.env ──────────────────────────────────────────────────
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_APP_ID=1:xxx:web:xxx
```

---

## 18. Key Implementation Notes

1. **Existing `users` table** — Query `lmsdb.users` using `role` column (`INSTRUCTOR` / `ADMIN` / `STUDENT`). Do not alter the users table. All new tables reference `users.id` via foreign keys.

2. **JWT auth** — On `/api/auth/login`, fetch the user from `lmsdb.users`, verify the password hash (bcrypt), then sign a JWT containing `{ id, role }`. All protected routes verify the token via the `auth.js` middleware; role-specific routes add the `role.js` middleware.

3. **Course locking** — When `status` is `PENDING`, `APPROVED`, or `PUBLISHED`, the `courseOwner.js` middleware returns `403` on any `PUT /api/courses/:id`. The React form also disables all fields by checking `course.status`.

4. **Video upload via signed URL** — Node uses `firebase-admin` to generate a signed PUT URL (15-min expiry). The React client uploads the file directly to Firebase via `XHR.upload.onprogress` to show a real progress bar. Node saves the final public Firebase URL to `lessons.resource_url` after the client confirms completion.

5. **Signed GET URL for playback** — When a student requests a lesson, Node generates a short-lived (10-min) signed GET URL. This prevents hotlinking or sharing raw Firebase paths. The URL is never stored in MySQL.

6. **Progress tracking** — `<VideoPlayer>` fires `POST /api/progress` every 30 seconds with the current `watch_seconds`. When `watch_seconds / duration_seconds >= 0.9`, the lesson is automatically marked `completed = 1`. The enrollment's `progress_percent` is recalculated as `completed_lessons / total_lessons * 100`.

7. **Rejection cycle** — When an admin rejects a course, `course_reviews` gets a new row (`decision = 'REJECTED'`, comment filled), and `courses.status` flips to `REJECTED`. The instructor fetches the latest rejection comment via `GET /api/courses/:id/review`.

8. **FULLTEXT search** — Add `FULLTEXT INDEX ft_courses (title, description)` on the `courses` table. Use `MATCH(title, description) AGAINST (? IN BOOLEAN MODE)` in the search query. Fall back to `LIKE '%...%'` if the search term is fewer than 3 characters (MySQL FULLTEXT minimum).

9. **Drag-to-reorder modules/lessons** — Use `react-beautiful-dnd` in `<ModuleBuilder>`. On drop, fire `PATCH /api/modules/reorder` with the full new `sort_order` array. The API updates all affected rows in a single transaction.

10. **Bootstrap** — Use Bootstrap 5 utility classes throughout. Use `react-bootstrap` for modals (review checklist panel, reject dialog), toasts (approve/reject notifications), and accordion (course syllabus). Avoid custom CSS unless strictly necessary.

---

> **Stack summary:** React 18 · JSX · Bootstrap 5 · react-router-dom v6 · axios · react-pdf · react-beautiful-dnd · recharts · Node.js · Express · mysql2 · firebase-admin · bcrypt · jsonwebtoken · Firebase Storage
```
