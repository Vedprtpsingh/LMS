import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Course } from '../../types';

export default function InstructorDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await api.getCourses({ limit: 100 });
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: courses.length,
    draft: courses.filter(c => c.status === 'DRAFT').length,
    pending: courses.filter(c => c.status === 'PENDING').length,
    published: courses.filter(c => c.status === 'PUBLISHED').length,
    totalStudents: courses.reduce((sum, c) => sum + c.enrollmentCount, 0),
    totalRatings: courses.reduce((sum, c) => sum + c.enrollmentCount, 0)
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col">
          <h1>Instructor Dashboard</h1>
          <p className="text-muted">Manage your courses and track student engagement</p>
        </div>
        <div className="col-auto">
          <Link to="/instructor/courses/new" className="btn btn-primary">
            Create New Course
          </Link>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h6 className="text-muted">Total Courses</h6>
              <h2>{stats.total}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h6 className="text-muted">Published</h6>
              <h2 className="text-success">{stats.published}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h6 className="text-muted">Total Students</h6>
              <h2>{stats.totalStudents}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h6 className="text-muted">Pending Review</h6>
              <h2 className="text-warning">{stats.pending}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>My Courses</h3>
            <Link to="/instructor/courses" className="btn btn-outline-primary">
              View All
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="alert alert-info">
              <p className="mb-3">You haven't created any courses yet.</p>
              <Link to="/instructor/courses/new" className="btn btn-primary">
                Create Your First Course
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Students</th>
                    <th>Rating</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <Link to={`/instructor/courses/${course.id}`}>
                          {course.title}
                        </Link>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${
                            course.status === 'PUBLISHED'
                              ? 'success'
                              : course.status === 'PENDING'
                              ? 'warning'
                              : course.status === 'REJECTED'
                              ? 'danger'
                              : 'secondary'
                          }`}
                        >
                          {course.status}
                        </span>
                      </td>
                      <td>{course.enrollmentCount}</td>
                      <td>
                        {course.avgRating > 0
                          ? `${course.avgRating.toFixed(1)} ★`
                          : 'N/A'}
                      </td>
                      <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/instructor/courses/${course.id}`}
                            className="btn btn-outline-primary"
                          >
                            Edit
                          </Link>
                          {course.status === 'DRAFT' && (
                            <button
                              onClick={() => api.submitCourse(course.id)}
                              className="btn btn-outline-success"
                            >
                              Submit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
