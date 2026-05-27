/*
  # LMS Database Schema
  
  Comprehensive Learning Management System schema
  
  1. New Tables
    - `users` - User accounts (instructors, admins, students)
    - `categories` - Course categories with hierarchy
    - `tags` - Course tags for filtering
    - `courses` - Main course table with workflow states
    - `course_tags` - Many-to-many relationship
    - `course_reviews` - Admin review decisions
    - `modules` - Course sections
    - `lessons` - Learning content (video, PDF, quiz, text)
    - `quizzes` - Quiz configuration
    - `quiz_questions` - Quiz question bank
    - `enrollments` - Student course enrollments
    - `progress` - Per-lesson progress tracking
    - `quiz_attempts` - Student quiz attempts
  
  2. Security
    - RLS enabled on all tables
    - Policies restrict access based on user role and ownership
    - Instructors can only modify their own courses
    - Students can only access enrolled courses
    - Admins have full access
  
  3. Important Notes
    - All tables use UUID primary keys
    - Timestamps for creation and updates
    - Foreign key constraints ensure data integrity
    - FULLTEXT search enabled for course search
*/

-- Users table (replaces existing MySQL users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('INSTRUCTOR', 'ADMIN', 'STUDENT')),
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories (hierarchical)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Courses (core table)
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES users(id),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED')),
  level text CHECK (level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  thumbnail_url text,
  price decimal(10,2) DEFAULT 0.00,
  language text DEFAULT 'English',
  avg_rating decimal(3,2) DEFAULT 0.00,
  enrollment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- Create FULLTEXT index equivalent using GIN for PostgreSQL
CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Course ↔ Tag (many-to-many)
CREATE TABLE IF NOT EXISTS course_tags (
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, tag_id)
);

-- Admin review decisions
CREATE TABLE IF NOT EXISTS course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES users(id),
  decision text NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
  comment text,
  reviewed_at timestamptz DEFAULT now()
);

-- Modules (sections inside a course)
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer DEFAULT 0,
  is_free_preview boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Lessons (video / pdf / quiz / text)
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('VIDEO', 'PDF', 'QUIZ', 'TEXT')),
  resource_url text,
  content text,
  duration_seconds integer,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Quizzes (linked to a lesson of type QUIZ)
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid UNIQUE NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  passing_score integer DEFAULT 70,
  time_limit_mins integer,
  created_at timestamptz DEFAULT now()
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  type text NOT NULL CHECK (type IN ('MCQ', 'TRUE_FALSE', 'SHORT')),
  options jsonb,
  correct_answer text NOT NULL,
  points integer DEFAULT 1,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  progress_percent decimal(5,2) DEFAULT 0.00,
  completed_at timestamptz,
  UNIQUE(student_id, course_id)
);

-- Per-lesson progress
CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id),
  completed boolean DEFAULT false,
  watch_seconds integer DEFAULT 0,
  last_accessed timestamptz DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL,
  passed boolean NOT NULL,
  attempted_at timestamptz DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_enrollment ON progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_tags ENABLE ROW Level Security;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can create user"
  ON users FOR INSERT
  WITH CHECK (true);

-- Courses policies
CREATE POLICY "Instructors can view own courses"
  ON courses FOR SELECT
  TO authenticated
  USING (
    instructor_id = auth.uid() OR
    status = 'PUBLISHED' OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    ) OR
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.student_id = auth.uid() AND enrollments.course_id = courses.id
    )
  );

CREATE POLICY "Instructors can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'INSTRUCTOR'
    ) AND instructor_id = auth.uid()
  );

CREATE POLICY "Instructors can update own draft or rejected courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (
    instructor_id = auth.uid() AND
    (status = 'DRAFT' OR status = 'REJECTED')
  )
  WITH CHECK (
    instructor_id = auth.uid() AND
    (status = 'DRAFT' OR status = 'REJECTED')
  );

CREATE POLICY "Admins can update any course"
  ON courses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Instructors and admins can delete courses"
  ON courses FOR DELETE
  TO authenticated
  USING (
    (instructor_id = auth.uid() AND status IN ('DRAFT', 'REJECTED')) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  );

-- Modules policies
CREATE POLICY "Users can view modules of accessible courses"
  ON modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id AND (
        courses.instructor_id = auth.uid() OR
        courses.status = 'PUBLISHED' OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid() AND users.role = 'ADMIN'
        ) OR
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.student_id = auth.uid() AND enrollments.course_id = courses.id
        )
      )
    )
  );

CREATE POLICY "Instructors can manage modules in own courses"
  ON modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id AND
      courses.instructor_id = auth.uid() AND
      (courses.status = 'DRAFT' OR courses.status = 'REJECTED')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id AND
      courses.instructor_id = auth.uid() AND
      (courses.status = 'DRAFT' OR courses.status = 'REJECTED')
    )
  );

-- Lessons policies
CREATE POLICY "Users can view lessons of accessible modules"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id AND (
        courses.instructor_id = auth.uid() OR
        courses.status = 'PUBLISHED' OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid() AND users.role = 'ADMIN'
        ) OR
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.student_id = auth.uid() AND enrollments.course_id = courses.id
        )
      )
    )
  );

CREATE POLICY "Instructors can manage lessons in own courses"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id AND
      courses.instructor_id = auth.uid() AND
      (courses.status = 'DRAFT' OR courses.status = 'REJECTED')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id AND
      courses.instructor_id = auth.uid() AND
      (courses.status = 'DRAFT' OR courses.status = 'REJECTED')
    )
  );

-- Enrollments policies
CREATE POLICY "Students can view own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Students can enroll in published courses"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id AND courses.status = 'PUBLISHED'
    )
  );

CREATE POLICY "Students can update own enrollment progress"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Progress policies
CREATE POLICY "Students can view own progress"
  ON progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = progress.enrollment_id AND
      enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own progress"
  ON progress FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = progress.enrollment_id AND
      enrollments.student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = progress.enrollment_id AND
      enrollments.student_id = auth.uid()
    )
  );

-- Course reviews policies
CREATE POLICY "Admins can manage reviews"
  ON course_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Instructors can view reviews for own courses"
  ON course_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_reviews.course_id AND
      courses.instructor_id = auth.uid()
    )
  );

-- Quizzes policies
CREATE POLICY "Users can view quizzes in accessible courses"
  ON quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      JOIN courses ON courses.id = modules.course_id
      WHERE lessons.id = quizzes.lesson_id AND (
        courses.instructor_id = auth.uid() OR
        courses.status = 'PUBLISHED' OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid() AND users.role = 'ADMIN'
        ) OR
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.student_id = auth.uid() AND enrollments.course_id = courses.id
        )
      )
    )
  );

CREATE POLICY "Instructors can manage quizzes"
  ON quizzes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      JOIN courses ON courses.id = modules.course_id
      WHERE lessons.id = quizzes.lesson_id AND
      courses.instructor_id = auth.uid() AND
      (courses.status = 'DRAFT' OR courses.status = 'REJECTED')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      JOIN courses ON courses.id = modules.course_id
      WHERE lessons.id = quizzes.lesson_id AND
      courses.instructor_id = auth.uid() AND
      (courses.status = 'DRAFT' OR courses.status = 'REJECTED')
    )
  );

-- Quiz questions policies
CREATE POLICY "Users can view quiz questions in accessible courses"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN lessons ON lessons.id = quizzes.lesson_id
      JOIN modules ON modules.id = lessons.module_id
      JOIN courses ON courses.id = modules.course_id
      WHERE quizzes.id = quiz_questions.quiz_id AND (
        courses.instructor_id = auth.uid() OR
        courses.status = 'PUBLISHED' OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid() AND users.role = 'ADMIN'
        ) OR
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.student_id = auth.uid() AND enrollments.course_id = courses.id
        )
      )
    )
  );

CREATE POLICY "Instructors can manage quiz questions"
  ON quiz_questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN lessons ON lessons.id = quizzes.lesson_id
      JOIN modules ON modules.id = lessons.module_id
      JOIN courses ON courses.id = modules.course_id
      WHERE quizzes.id = quiz_questions.quiz_id AND
      courses.instructor_id = auth.uid() AND
      (courses.status = 'DRAFT' OR courses.status = 'REJECTED')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN lessons ON lessons.id = quizzes.lesson_id
      JOIN modules ON modules.id = lessons.module_id
      JOIN courses ON courses.id = modules.course_id
      WHERE quizzes.id = quiz_questions.quiz_id AND
      courses.instructor_id = auth.uid() AND
      (courses.status = 'DRAFT' OR courses.status = 'REJECTED')
    )
  );

-- Quiz attempts policies
CREATE POLICY "Students can view own attempts"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can submit attempts"
  ON quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  );

-- Tags policies (public read)
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  );

-- Course tags policies
CREATE POLICY "Anyone can view course tags"
  ON course_tags FOR SELECT
  USING (true);

CREATE POLICY "Instructors can manage course tags"
  ON course_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_tags.course_id AND
      courses.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_tags.course_id AND
      courses.instructor_id = auth.uid()
    )
  );

-- Insert default categories
INSERT INTO categories (name, slug) VALUES
  ('Development', 'development'),
  ('Business', 'business'),
  ('Design', 'design'),
  ('Marketing', 'marketing'),
  ('Photography', 'photography'),
  ('Music', 'music')
ON CONFLICT (slug) DO NOTHING;

-- Insert default tags
INSERT INTO tags (name, slug) VALUES
  ('Web Development', 'web-development'),
  ('Data Science', 'data-science'),
  ('Machine Learning', 'machine-learning'),
  ('Mobile Development', 'mobile-development'),
  ('UI/UX Design', 'ui-ux-design'),
  ('Digital Marketing', 'digital-marketing'),
  ('Finance', 'finance'),
  ('Photography Basics', 'photography-basics'),
  ('Music Production', 'music-production')
ON CONFLICT (slug) DO NOTHING;