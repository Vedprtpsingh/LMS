# Course Management System
### React + Spring Boot + SQL — Technical Specification

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Course Approval Workflow](#2-course-approval-workflow)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Course States & Transitions](#4-course-states--transitions)
5. [Course Upload Requirements](#5-course-upload-requirements)
6. [Admin Review Checklist](#6-admin-review-checklist)
7. [Database Design](#7-database-design)
8. [Frontend Features](#8-frontend-features)
9. [Advanced Search & Filters](#9-advanced-search--filters)
10. [Analytics Dashboard](#10-analytics-dashboard)
11. [System Architecture](#11-system-architecture)

---

## 1. System Overview

A full-stack course management platform enabling instructors to create and submit courses, admins to review and approve content, and students to access published learning materials.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Instructor  │────▶│    Admin     │────▶│   Student    │
│   Creates    │     │   Reviews    │     │   Accesses   │
│   Courses    │     │   Content    │     │   Courses    │
└──────────────┘     └──────────────┘     └──────────────┘
        │                   │                    │
        └───────────────────┴────────────────────┘
                            │
                   ┌────────▼────────┐
                   │  Spring Boot    │
                   │   REST API      │
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │   PostgreSQL    │
                   │    Database     │
                   └─────────────────┘
```

---

## 2. Course Approval Workflow

```mermaid
flowchart TD
    A([🧑‍🏫 Instructor Creates Course]) --> B[Fill Course Details\nTitle · Description · Media]
    B --> C{Save as DRAFT}
    C --> D[Upload Videos, PDFs,\nQuizzes & Thumbnail]
    D --> E[Submit for Review]
    E --> F([📋 Course Status → PENDING])

    F --> G{👨‍💼 Admin Reviews Course}

    G --> H{Content\nQuality OK?}

    H -->|✅ Pass| I[APPROVE Course]
    H -->|❌ Fail| J[REJECT with Comments]

    I --> K([📢 Status → APPROVED])
    J --> L([🔴 Status → REJECTED])

    K --> M[Publish to Platform]
    M --> N([🌍 Status → PUBLISHED])
    N --> O([👨‍🎓 Visible to Students])

    L --> P[Instructor Views\nRejection Comments]
    P --> Q[Instructor Makes\nModifications]
    Q --> E

    O --> R{Archive?}
    R -->|Yes| S([📦 Status → ARCHIVED])
    R -->|No| O

    style A fill:#4CAF50,color:#fff
    style F fill:#FF9800,color:#fff
    style K fill:#2196F3,color:#fff
    style L fill:#f44336,color:#fff
    style N fill:#9C27B0,color:#fff
    style S fill:#607D8B,color:#fff
    style O fill:#00BCD4,color:#fff
```

---

## 3. User Roles & Permissions

```mermaid
graph LR
    subgraph ROLES["👥 User Roles"]
        I[🧑‍🏫 Instructor]
        A[👨‍💼 Admin]
        S[👨‍🎓 Student]
    end

    subgraph INSTRUCTOR_PERMS["Instructor Permissions"]
        I1[Create Course]
        I2[Edit Course]
        I3[Upload Media\nVideos · PDFs · Quizzes]
        I4[Submit for Review]
        I5[View Rejection Comments]
        I6[Resubmit Course]
        I7[View Own Dashboard]
    end

    subgraph ADMIN_PERMS["Admin Permissions"]
        A1[View All Pending Courses]
        A2[Approve Course]
        A3[Reject Course + Comments]
        A4[View Published Courses]
        A5[Archive Course]
        A6[Manage Users]
        A7[View Analytics]
    end

    subgraph STUDENT_PERMS["Student Permissions"]
        S1[Browse Published Courses]
        S2[Enroll in Courses]
        S3[Watch Videos]
        S4[Download PDFs]
        S5[Take Quizzes]
        S6[Track Progress]
    end

    I --> INSTRUCTOR_PERMS
    A --> ADMIN_PERMS
    S --> STUDENT_PERMS

    style ROLES fill:#E3F2FD
    style INSTRUCTOR_PERMS fill:#E8F5E9
    style ADMIN_PERMS fill:#FFF3E0
    style STUDENT_PERMS fill:#F3E5F5
```

| Role       | Create | Edit | Submit | Review | Approve/Reject | Publish | Enroll |
|------------|--------|------|--------|--------|----------------|---------|--------|
| Instructor | ✅     | ✅   | ✅     | ❌     | ❌             | ❌      | ❌     |
| Admin      | ❌     | ❌   | ❌     | ✅     | ✅             | ✅      | ❌     |
| Student    | ❌     | ❌   | ❌     | ❌     | ❌             | ❌      | ✅     |

---

## 4. Course States & Transitions

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Instructor creates course

    DRAFT --> DRAFT : Save changes
    DRAFT --> PENDING : Submit for review

    PENDING --> APPROVED : Admin approves
    PENDING --> REJECTED : Admin rejects\nwith comments

    REJECTED --> DRAFT : Instructor\nedits course
    DRAFT --> PENDING : Resubmit

    APPROVED --> PUBLISHED : Admin publishes
    PUBLISHED --> ARCHIVED : Admin archives

    ARCHIVED --> PUBLISHED : Restore

    note right of DRAFT
        Course is being edited
        Only instructor can see
    end note

    note right of PENDING
        Waiting for admin review
        Locked from editing
    end note

    note right of PUBLISHED
        Visible to all students
        Fully accessible
    end note
```

### State Descriptions

| State       | Description                            | Who Can See         | Editable |
|-------------|----------------------------------------|---------------------|----------|
| `DRAFT`     | Being created/edited by instructor     | Instructor only     | ✅ Yes   |
| `PENDING`   | Submitted, awaiting admin review       | Instructor + Admin  | ❌ No    |
| `APPROVED`  | Accepted, ready to publish             | Instructor + Admin  | ❌ No    |
| `REJECTED`  | Rejected, needs modification           | Instructor + Admin  | ✅ Yes   |
| `PUBLISHED` | Live and visible to students           | Everyone            | ❌ No    |
| `ARCHIVED`  | Hidden/inactive                        | Admin only          | ❌ No    |

---

## 5. Course Upload Requirements

```mermaid
mindmap
  root((📚 Course Upload))
    📝 Basic Info
      Course Title
      Description
      Category
      Level
        Beginner
        Intermediate
        Advanced
      Language
      Tags
    🖼️ Media
      Thumbnail Image
        JPG / PNG
        Recommended 1280×720
    🎬 Videos
      MP4 Format
      Max 2GB per file
      Chapter Segments
      Captions Optional
    📄 PDFs
      Lecture Notes
      Assignments
      Reading Materials
      Max 50MB per file
    📝 Quizzes
      Multiple Choice
      True / False
      Short Answer
      Passing Score %
      Time Limit
```

### Upload Specifications

| Asset       | Format        | Max Size    | Required |
|-------------|---------------|-------------|----------|
| Thumbnail   | JPG / PNG     | 5 MB        | ✅       |
| Videos      | MP4 / MOV     | 2 GB each   | ✅       |
| PDFs        | PDF           | 50 MB each  | Optional |
| Quizzes     | JSON / Form   | N/A         | Optional |
| Captions    | SRT / VTT     | 1 MB each   | Optional |

---

## 6. Admin Review Checklist

```mermaid
flowchart LR
    subgraph REVIEW["🔍 Admin Review Checklist"]
        direction TB
        R1{Content Quality\nIs the content\naccurate and clear?}
        R2{Audio / Video\nClarity\nGood production\nquality?}
        R3{Plagiarism\nCheck\nOriginal content?}
        R4{Missing Lessons\nAll modules\ncomplete?}
        R5{Offensive Content\nNo harmful or\ninappropriate material?}
        R6{Quiz Validity\nQuestions are\nclear and correct?}
    end

    START([📋 Course Submitted]) --> R1
    R1 --> R2
    R2 --> R3
    R3 --> R4
    R4 --> R5
    R5 --> R6

    R6 -->|All ✅| APPROVE([✅ APPROVE])
    R1 -->|❌ Fail| REJECT
    R2 -->|❌ Fail| REJECT
    R3 -->|❌ Fail| REJECT
    R4 -->|❌ Fail| REJECT
    R5 -->|❌ Fail| REJECT
    R6 -->|❌ Fail| REJECT([❌ REJECT + Add Comments])

    style APPROVE fill:#4CAF50,color:#fff
    style REJECT fill:#f44336,color:#fff
    style START fill:#2196F3,color:#fff
```

---

## 7. Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar name
        varchar email
        varchar password_hash
        enum role "INSTRUCTOR | ADMIN | STUDENT"
        varchar avatar_url
        timestamp created_at
        boolean is_active
    }

    COURSES {
        bigint id PK
        varchar title
        text description
        bigint instructor_id FK
        bigint category_id FK
        enum status "DRAFT|PENDING|APPROVED|REJECTED|PUBLISHED|ARCHIVED"
        enum level "BEGINNER|INTERMEDIATE|ADVANCED"
        varchar thumbnail_url
        decimal price
        varchar language
        float avg_rating
        int enrollment_count
        timestamp created_at
        timestamp updated_at
        timestamp published_at
    }

    COURSE_REVIEWS {
        bigint id PK
        bigint course_id FK
        bigint admin_id FK
        enum decision "APPROVED | REJECTED"
        text comment
        timestamp reviewed_at
    }

    MODULES {
        bigint id PK
        bigint course_id FK
        varchar title
        int sort_order
        boolean is_free_preview
    }

    LESSONS {
        bigint id PK
        bigint module_id FK
        varchar title
        enum type "VIDEO | PDF | QUIZ | TEXT"
        varchar resource_url
        int duration_seconds
        int sort_order
    }

    QUIZZES {
        bigint id PK
        bigint lesson_id FK
        varchar title
        int passing_score
        int time_limit_mins
    }

    QUIZ_QUESTIONS {
        bigint id PK
        bigint quiz_id FK
        text question
        enum type "MCQ | TRUE_FALSE | SHORT"
        json options
        varchar correct_answer
        int points
    }

    CATEGORIES {
        bigint id PK
        varchar name
        varchar slug
        bigint parent_id FK
    }

    ENROLLMENTS {
        bigint id PK
        bigint student_id FK
        bigint course_id FK
        timestamp enrolled_at
        float progress_percent
        timestamp completed_at
    }

    PROGRESS {
        bigint id PK
        bigint enrollment_id FK
        bigint lesson_id FK
        boolean completed
        int watch_seconds
        timestamp last_accessed
    }

    QUIZ_ATTEMPTS {
        bigint id PK
        bigint student_id FK
        bigint quiz_id FK
        int score
        boolean passed
        timestamp attempted_at
    }

    TAGS {
        bigint id PK
        varchar name
        varchar slug
    }

    COURSE_TAGS {
        bigint course_id FK
        bigint tag_id FK
    }

    USERS ||--o{ COURSES : "instructs"
    USERS ||--o{ ENROLLMENTS : "enrolls"
    USERS ||--o{ COURSE_REVIEWS : "reviews"
    COURSES ||--o{ COURSE_REVIEWS : "receives"
    COURSES ||--o{ MODULES : "has"
    COURSES ||--o{ ENROLLMENTS : "receives"
    COURSES }o--|| CATEGORIES : "belongs to"
    COURSES ||--o{ COURSE_TAGS : "tagged with"
    TAGS ||--o{ COURSE_TAGS : "applied to"
    MODULES ||--o{ LESSONS : "contains"
    LESSONS ||--o| QUIZZES : "has"
    QUIZZES ||--o{ QUIZ_QUESTIONS : "contains"
    ENROLLMENTS ||--o{ PROGRESS : "tracks"
    PROGRESS }o--|| LESSONS : "on"
    USERS ||--o{ QUIZ_ATTEMPTS : "attempts"
    QUIZZES ||--o{ QUIZ_ATTEMPTS : "attempted by"
```

### SQL DDL — Core Tables

```sql
-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            VARCHAR(20)   NOT NULL CHECK (role IN ('INSTRUCTOR','ADMIN','STUDENT')),
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    parent_id   BIGINT REFERENCES categories(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- TAGS
-- ─────────────────────────────────────────
CREATE TABLE tags (
    id    BIGSERIAL PRIMARY KEY,
    name  VARCHAR(50) NOT NULL UNIQUE,
    slug  VARCHAR(50) NOT NULL UNIQUE
);

-- ─────────────────────────────────────────
-- COURSES
-- ─────────────────────────────────────────
CREATE TABLE courses (
    id                BIGSERIAL PRIMARY KEY,
    title             VARCHAR(200)    NOT NULL,
    description       TEXT,
    instructor_id     BIGINT          NOT NULL REFERENCES users(id),
    category_id       BIGINT          REFERENCES categories(id),
    status            VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT','PENDING','APPROVED','REJECTED','PUBLISHED','ARCHIVED')),
    level             VARCHAR(20)     CHECK (level IN ('BEGINNER','INTERMEDIATE','ADVANCED')),
    thumbnail_url     VARCHAR(500),
    price             NUMERIC(10,2)   NOT NULL DEFAULT 0.00,
    language          VARCHAR(50)     NOT NULL DEFAULT 'English',
    avg_rating        NUMERIC(3,2)    DEFAULT 0.00,
    enrollment_count  INT             NOT NULL DEFAULT 0,
    created_at        TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP       NOT NULL DEFAULT NOW(),
    published_at      TIMESTAMP
);

CREATE TABLE course_tags (
    course_id   BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tag_id      BIGINT NOT NULL REFERENCES tags(id)    ON DELETE CASCADE,
    PRIMARY KEY (course_id, tag_id)
);

-- ─────────────────────────────────────────
-- COURSE REVIEWS (Admin decisions)
-- ─────────────────────────────────────────
CREATE TABLE course_reviews (
    id            BIGSERIAL PRIMARY KEY,
    course_id     BIGINT      NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    admin_id      BIGINT      NOT NULL REFERENCES users(id),
    decision      VARCHAR(20) NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
    comment       TEXT,
    reviewed_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MODULES & LESSONS
-- ─────────────────────────────────────────
CREATE TABLE modules (
    id               BIGSERIAL PRIMARY KEY,
    course_id        BIGINT       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title            VARCHAR(200) NOT NULL,
    sort_order       INT          NOT NULL DEFAULT 0,
    is_free_preview  BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE lessons (
    id               BIGSERIAL PRIMARY KEY,
    module_id        BIGINT       NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title            VARCHAR(200) NOT NULL,
    type             VARCHAR(20)  NOT NULL CHECK (type IN ('VIDEO','PDF','QUIZ','TEXT')),
    resource_url     VARCHAR(500),
    duration_seconds INT,
    sort_order       INT          NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────
-- QUIZZES
-- ─────────────────────────────────────────
CREATE TABLE quizzes (
    id               BIGSERIAL PRIMARY KEY,
    lesson_id        BIGINT       NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title            VARCHAR(200) NOT NULL,
    passing_score    INT          NOT NULL DEFAULT 70,
    time_limit_mins  INT
);

CREATE TABLE quiz_questions (
    id              BIGSERIAL PRIMARY KEY,
    quiz_id         BIGINT      NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question        TEXT        NOT NULL,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('MCQ','TRUE_FALSE','SHORT')),
    options         JSONB,
    correct_answer  VARCHAR(500) NOT NULL,
    points          INT          NOT NULL DEFAULT 1
);

-- ─────────────────────────────────────────
-- ENROLLMENTS & PROGRESS
-- ─────────────────────────────────────────
CREATE TABLE enrollments (
    id                BIGSERIAL PRIMARY KEY,
    student_id        BIGINT          NOT NULL REFERENCES users(id),
    course_id         BIGINT          NOT NULL REFERENCES courses(id),
    enrolled_at       TIMESTAMP       NOT NULL DEFAULT NOW(),
    progress_percent  NUMERIC(5,2)    NOT NULL DEFAULT 0.00,
    completed_at      TIMESTAMP,
    UNIQUE (student_id, course_id)
);

CREATE TABLE progress (
    id              BIGSERIAL PRIMARY KEY,
    enrollment_id   BIGINT    NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    lesson_id       BIGINT    NOT NULL REFERENCES lessons(id),
    completed       BOOLEAN   NOT NULL DEFAULT FALSE,
    watch_seconds   INT       NOT NULL DEFAULT 0,
    last_accessed   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (enrollment_id, lesson_id)
);

CREATE TABLE quiz_attempts (
    id            BIGSERIAL PRIMARY KEY,
    student_id    BIGINT    NOT NULL REFERENCES users(id),
    quiz_id       BIGINT    NOT NULL REFERENCES quizzes(id),
    score         INT       NOT NULL,
    passed        BOOLEAN   NOT NULL,
    attempted_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_status     ON courses(status);
CREATE INDEX idx_courses_category   ON courses(category_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course  ON enrollments(course_id);
CREATE INDEX idx_progress_enrollment ON progress(enrollment_id);
CREATE INDEX idx_lessons_module      ON lessons(module_id);
CREATE INDEX idx_course_reviews_course ON course_reviews(course_id);
```

---

## 8. Frontend Features

### A. Instructor Dashboard

```mermaid
graph TD
    subgraph INSTRUCTOR_DASH["🧑‍🏫 Instructor Dashboard"]
        direction LR

        subgraph COURSE_MGMT["Course Management"]
            C1[➕ Create New Course]
            C2[✏️ Edit Course Details]
            C3[📤 Submit for Approval]
            C4[🔁 Resubmit After Rejection]
        end

        subgraph MEDIA_UPLOAD["Media Upload"]
            M1[🎬 Upload Videos]
            M2[📄 Upload PDFs]
            M3[🧩 Create Quizzes]
            M4[🖼️ Upload Thumbnail]
        end

        subgraph FEEDBACK["Feedback & Status"]
            F1[🔴 View Rejection Comments]
            F2[📊 Course Status Tracker]
            F3[📈 Enrollment Stats]
        end
    end

    INSTRUCTOR_DASH --> COURSE_MGMT
    INSTRUCTOR_DASH --> MEDIA_UPLOAD
    INSTRUCTOR_DASH --> FEEDBACK
```

### B. Admin Dashboard

```mermaid
graph TD
    subgraph ADMIN_DASH["👨‍💼 Admin Dashboard"]
        direction LR

        subgraph REVIEW_CENTER["Review Center"]
            R1[📋 View Pending Courses Queue]
            R2[🔍 Inspect Course Content]
            R3[✅ Approve Course]
            R4[❌ Reject Course + Comments]
        end

        subgraph PUBLISHED["Published Courses"]
            P1[📚 View All Published Courses]
            P2[📦 Archive Course]
            P3[📢 Feature a Course]
        end

        subgraph ANALYTICS["Analytics"]
            A1[👥 Student Enrollments]
            A2[💰 Revenue Reports]
            A3[📊 Completion Rates]
            A4[📈 Active Users]
        end
    end

    ADMIN_DASH --> REVIEW_CENTER
    ADMIN_DASH --> PUBLISHED
    ADMIN_DASH --> ANALYTICS
```

---

## 9. Advanced Search & Filters

```mermaid
flowchart LR
    subgraph SEARCH["🔍 Search & Filter Panel"]
        direction TB
        S1[🔤 Course Name\nFull-text search]
        S2[🧑‍🏫 Instructor\nDropdown select]
        S3[📂 Category\nDropdown select]
        S4[🔖 Status\nDropdown select]
        S5[🎓 Level\nDropdown select]
    end

    subgraph SORT["↕️ Sort Options"]
        direction TB
        T1[🕒 Latest]
        T2[🔥 Most Popular]
        T3[⭐ Highest Rated]
        T4[👥 Most Enrolled]
    end

    subgraph RESULTS["📋 Results"]
        direction TB
        R1[Course Cards Grid]
        R2[Pagination]
        R3[Total Count]
    end

    SEARCH --> RESULTS
    SORT   --> RESULTS
```

### API Query Example

```sql
SELECT
    c.id,
    c.title,
    u.name        AS instructor_name,
    cat.name      AS category,
    c.status,
    c.level,
    c.avg_rating,
    c.enrollment_count,
    c.created_at
FROM courses c
JOIN users       u   ON c.instructor_id = u.id
JOIN categories  cat ON c.category_id   = cat.id
WHERE
    c.status = 'PUBLISHED'
    AND (c.title ILIKE '%:search%'    OR :search IS NULL)
    AND (u.name  = :instructor        OR :instructor IS NULL)
    AND (cat.name = :category         OR :category IS NULL)
    AND (c.level  = :level            OR :level IS NULL)
ORDER BY
    CASE :sort
        WHEN 'latest'      THEN c.created_at
        WHEN 'most_popular' THEN c.enrollment_count
        WHEN 'highest_rated' THEN c.avg_rating
        WHEN 'most_enrolled' THEN c.enrollment_count
    END DESC
LIMIT :pageSize OFFSET :offset;
```

---

## 10. Analytics Dashboard

### Dashboard Components

```mermaid
graph TD
    subgraph DASH["📊 Analytics Dashboard"]
        direction TB

        subgraph CARDS["📦 KPI Cards"]
            K1["👥 Total Students\n━━━━━━━━\n12,450\n▲ 8.2% this month"]
            K2["📚 Total Courses\n━━━━━━━━\n184\n▲ 3 new this week"]
            K3["💰 Total Revenue\n━━━━━━━━\n$48,320\n▲ 12.5% this month"]
            K4["✅ Completion Rate\n━━━━━━━━\n67.3%\n▲ 2.1% vs last month"]
        end

        subgraph CHARTS["📈 Charts"]
            C1[💰 Revenue Chart\nMonthly line chart\nRevenue over 12 months]
            C2[📈 Enrollment Graph\nBar chart of new\nenrollments per week]
            C3[👁️ Most Viewed Courses\nHorizontal bar chart\nTop 10 by views]
            C4[✅ Completion Analytics\nDonut chart showing\nCompletion vs In-progress]
            C5[🟢 Active Users\nArea chart of\nDAU / WAU / MAU]
        end
    end

    CARDS --> CHARTS
```

### Dashboard Chart Specifications

| Chart | Type | X-Axis | Y-Axis | Period |
|---|---|---|---|---|
| Revenue Chart | Line | Month | Revenue ($) | 12 months |
| Enrollment Graph | Bar | Week | New Enrollments | 90 days |
| Most Viewed Courses | Horizontal Bar | Course Name | Views | All time |
| Completion Analytics | Donut | — | Completed vs In Progress | All time |
| Active Users | Area | Date | User Count | 30 days |

---

## 11. System Architecture

### Component Architecture

```mermaid
graph TB
    subgraph FRONTEND["⚛️ React Frontend"]
        direction LR
        RC[React Components]
        RR[React Router]
        RX[Redux / Zustand\nState Management]
        AX[Axios HTTP Client]
    end

    subgraph BACKEND["🍃 Spring Boot Backend"]
        direction LR
        SC[Security\nJWT Auth]
        CO[Controllers\nREST API]
        SE[Services\nBusiness Logic]
        RE[Repositories\nJPA / Hibernate]
    end

    subgraph STORAGE["💾 Storage"]
        DB[(PostgreSQL\nDatabase)]
        S3[S3 / Cloud Storage\nVideos · PDFs · Images]
    end

    FRONTEND <-->|REST API\nHTTPS / JSON| BACKEND
    BACKEND <--> DB
    BACKEND <--> S3
    FRONTEND <-->|Direct Upload\nPresigned URLs| S3

    style FRONTEND fill:#E3F2FD
    style BACKEND  fill:#E8F5E9
    style STORAGE  fill:#FFF3E0
```

### API Endpoint Summary

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/refresh

Courses (Instructor)
  POST   /api/courses                    Create draft
  PUT    /api/courses/{id}               Update course
  POST   /api/courses/{id}/submit        Submit for review
  POST   /api/courses/{id}/resubmit      Resubmit after rejection
  GET    /api/instructor/courses         My courses list

Courses (Admin)
  GET    /api/admin/courses/pending      Pending queue
  POST   /api/admin/courses/{id}/approve Approve
  POST   /api/admin/courses/{id}/reject  Reject with comment
  GET    /api/admin/courses/published    All published

Courses (Public / Student)
  GET    /api/courses                    Browse published
  GET    /api/courses/{id}               Course detail
  POST   /api/courses/{id}/enroll        Enroll

Media
  POST   /api/upload/video               Upload video
  POST   /api/upload/pdf                 Upload PDF
  POST   /api/upload/thumbnail           Upload thumbnail

Analytics
  GET    /api/admin/analytics/overview   KPI summary
  GET    /api/admin/analytics/revenue    Revenue chart
  GET    /api/admin/analytics/enrollments Enrollment graph
  GET    /api/admin/analytics/top-courses Most viewed
```

---

> **Stack:** React 18 · TypeScript · Spring Boot 3 · Spring Security (JWT) · JPA/Hibernate · PostgreSQL · AWS S3 (or MinIO) · Docker · Swagger / OpenAPI
```
