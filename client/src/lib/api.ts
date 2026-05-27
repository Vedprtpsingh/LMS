const API_URL = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // Auth
  async register(data: { email: string; password: string; name: string; role: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(data: { name?: string; bio?: string; avatarUrl?: string }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Courses
  async getCourses(params?: {
    search?: string;
    category?: string;
    level?: string;
    status?: string;
    instructorId?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.level) query.set('level', params.level);
    if (params?.status) query.set('status', params.status);
    if (params?.instructorId) query.set('instructorId', params.instructorId);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request(`/courses?${query.toString()}`);
  }

  async getCourseById(id: string) {
    return this.request(`/courses/${id}`);
  }

  async createCourse(data: any) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(id: string, data: any) {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: string) {
    return this.request(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  async submitCourse(id: string) {
    return this.request(`/courses/${id}/submit`, {
      method: 'POST',
    });
  }

  async getCourseReview(id: string) {
    return this.request(`/courses/${id}/review`);
  }

  // Admin
  async getPendingCourses(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request(`/admin/courses/pending?${query.toString()}`);
  }

  async approveCourse(id: string) {
    return this.request(`/admin/courses/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectCourse(id: string, comment: string) {
    return this.request(`/admin/courses/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async publishCourse(id: string) {
    return this.request(`/admin/courses/${id}/publish`, {
      method: 'POST',
    });
  }

  async archiveCourse(id: string) {
    return this.request(`/admin/courses/${id}/archive`, {
      method: 'POST',
    });
  }

  async restoreCourse(id: string) {
    return this.request(`/admin/courses/${id}/restore`, {
      method: 'POST',
    });
  }

  async getAnalytics() {
    return this.request('/admin/analytics');
  }

  async getAllUsers(params?: { role?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request(`/admin/users?${query.toString()}`);
  }

  // Modules
  async getModules(courseId: string) {
    return this.request(`/courses/${courseId}/modules`);
  }

  async createModule(courseId: string, data: { title: string; isFreePreview?: boolean }) {
    return this.request(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateModule(id: string, data: any) {
    return this.request(`/modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteModule(id: string) {
    return this.request(`/modules/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderModules(courseId: string, moduleIds: string[]) {
    return this.request(`/courses/${courseId}/modules/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ moduleIds }),
    });
  }

  // Lessons
  async getLessons(moduleId: string) {
    return this.request(`/modules/${moduleId}/lessons`);
  }

  async getLessonById(id: string) {
    return this.request(`/lessons/${id}`);
  }

  async createLesson(moduleId: string, data: any) {
    return this.request(`/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLesson(id: string, data: any) {
    return this.request(`/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLesson(id: string) {
    return this.request(`/lessons/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderLessons(moduleId: string, lessonIds: string[]) {
    return this.request(`/modules/${moduleId}/lessons/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ lessonIds }),
    });
  }

  // Quiz
  async getQuiz(lessonId: string) {
    return this.request(`/lessons/${lessonId}/quiz`);
  }

  async createQuiz(lessonId: string, data: any) {
    return this.request(`/lessons/${lessonId}/quiz`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuiz(id: string, data: any) {
    return this.request(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createQuestion(quizId: string, data: any) {
    return this.request(`/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuestion(id: string, data: any) {
    return this.request(`/quiz-questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuestion(id: string) {
    return this.request(`/quiz-questions/${id}`, {
      method: 'DELETE',
    });
  }

  async submitQuizAttempt(quizId: string, answers: any[]) {
    return this.request(`/quizzes/${quizId}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  // Enrollments
  async getMyEnrollments(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request(`/enrollments/my?${query.toString()}`);
  }

  async getEnrollmentDetails(courseId: string) {
    return this.request(`/enrollments/${courseId}`);
  }

  async enrollInCourse(courseId: string) {
    return this.request(`/courses/${courseId}/enroll`, {
      method: 'POST',
    });
  }

  async unenrollFromCourse(courseId: string) {
    return this.request(`/courses/${courseId}/enroll`, {
      method: 'DELETE',
    });
  }

  // Progress
  async getProgress(enrollmentId: string) {
    return this.request(`/enrollments/${enrollmentId}/progress`);
  }

  async updateProgress(enrollmentId: string, lessonId: string, data: { watchSeconds?: number; completed?: boolean }) {
    return this.request(`/enrollments/${enrollmentId}/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markLessonComplete(enrollmentId: string, lessonId: string) {
    return this.request(`/enrollments/${enrollmentId}/lessons/${lessonId}/complete`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
