import { Router } from 'express';
import { register, login, getCurrentUser, updateProfile, changePassword } from '../controllers/authController.js';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, submitCourse, getCourseReview } from '../controllers/courseController.js';
import { getPendingCourses, approveCourse, rejectCourse, publishCourse, archiveCourse, restoreCourse, getAnalytics, getAllUsers } from '../controllers/adminController.js';
import { getModules, createModule, updateModule, deleteModule, reorderModules } from '../controllers/moduleController.js';
import { getLessons, getLessonById, createLesson, updateLesson, deleteLesson, reorderLessons } from '../controllers/lessonController.js';
import { getQuiz, createQuiz, updateQuiz, createQuestion, updateQuestion, deleteQuestion, submitQuizAttempt } from '../controllers/quizController.js';
import { getMyEnrollments, getEnrollmentDetails, enrollInCourse, unenrollFromCourse } from '../controllers/enrollmentController.js';
import { getProgress, updateProgress, markLessonComplete } from '../controllers/progressController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getCurrentUser);
router.put('/auth/profile', authenticate, updateProfile);
router.put('/auth/password', authenticate, changePassword);

// Course routes (public/student)
router.get('/courses', authenticate, getCourses);
router.get('/courses/:id', authenticate, getCourseById);

// Course routes (instructor)
router.post('/courses', authenticate, requireRole('INSTRUCTOR'), createCourse);
router.put('/courses/:id', authenticate, updateCourse);
router.delete('/courses/:id', authenticate, deleteCourse);
router.post('/courses/:id/submit', authenticate, submitCourse);
router.get('/courses/:id/review', authenticate, getCourseReview);

// Admin routes
router.get('/admin/courses/pending', authenticate, requireRole('ADMIN'), getPendingCourses);
router.post('/admin/courses/:id/approve', authenticate, requireRole('ADMIN'), approveCourse);
router.post('/admin/courses/:id/reject', authenticate, requireRole('ADMIN'), rejectCourse);
router.post('/admin/courses/:id/publish', authenticate, requireRole('ADMIN'), publishCourse);
router.post('/admin/courses/:id/archive', authenticate, requireRole('ADMIN'), archiveCourse);
router.post('/admin/courses/:id/restore', authenticate, requireRole('ADMIN'), restoreCourse);
router.get('/admin/analytics', authenticate, requireRole('ADMIN'), getAnalytics);
router.get('/admin/users', authenticate, requireRole('ADMIN'), getAllUsers);

// Module routes
router.get('/courses/:courseId/modules', authenticate, getModules);
router.post('/courses/:courseId/modules', authenticate, createModule);
router.put('/modules/:id', authenticate, updateModule);
router.delete('/modules/:id', authenticate, deleteModule);
router.patch('/courses/:courseId/modules/reorder', authenticate, reorderModules);

// Lesson routes
router.get('/modules/:moduleId/lessons', authenticate, getLessons);
router.get('/lessons/:id', authenticate, getLessonById);
router.post('/modules/:moduleId/lessons', authenticate, createLesson);
router.put('/lessons/:id', authenticate, updateLesson);
router.delete('/lessons/:id', authenticate, deleteLesson);
router.patch('/modules/:moduleId/lessons/reorder', authenticate, reorderLessons);

// Quiz routes
router.get('/lessons/:lessonId/quiz', authenticate, getQuiz);
router.post('/lessons/:lessonId/quiz', authenticate, createQuiz);
router.put('/quizzes/:id', authenticate, updateQuiz);
router.post('/quizzes/:quizId/questions', authenticate, createQuestion);
router.put('/quiz-questions/:id', authenticate, updateQuestion);
router.delete('/quiz-questions/:id', authenticate, deleteQuestion);
router.post('/quizzes/:quizId/attempt', authenticate, submitQuizAttempt);

// Enrollment routes
router.get('/enrollments/my', authenticate, getMyEnrollments);
router.get('/enrollments/:courseId', authenticate, getEnrollmentDetails);
router.post('/courses/:courseId/enroll', authenticate, enrollInCourse);
router.delete('/courses/:courseId/enroll', authenticate, unenrollFromCourse);

// Progress routes
router.get('/enrollments/:enrollmentId/progress', authenticate, getProgress);
router.post('/enrollments/:enrollmentId/lessons/:lessonId/progress', authenticate, updateProgress);
router.post('/enrollments/:enrollmentId/lessons/:lessonId/complete', authenticate, markLessonComplete);

export default router;
