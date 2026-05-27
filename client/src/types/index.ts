export interface User {
  id: string;
  email: string;
  name: string;
  role: 'INSTRUCTOR' | 'ADMIN' | 'STUDENT';
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  price: number;
  language: string;
  avgRating: number;
  enrollmentCount: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  instructor: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  category?: Category;
  modules?: Module[];
}

export interface Module {
  id: string;
  title: string;
  sort_order: number;
  is_free_preview: boolean;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'QUIZ' | 'TEXT';
  resource_url?: string;
  content?: string;
  duration_seconds?: number;
  sort_order: number;
}

export interface Quiz {
  id: string;
  title: string;
  passing_score: number;
  time_limit_mins?: number;
  quiz_questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'SHORT';
  options?: string[];
  correct_answer: string;
  points: number;
  sort_order: number;
}

export interface Enrollment {
  id: string;
  enrolledAt: string;
  progressPercent: number;
  completedAt?: string;
  course: Course;
}

export interface Progress {
  id: string;
  completed: boolean;
  watch_seconds: number;
  last_accessed: string;
  lesson_id: string;
  lesson: Lesson;
}
