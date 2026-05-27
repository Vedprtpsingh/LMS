import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Course } from '../../types';

export default function AdminDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesData, analyticsData] = await Promise.all([
        api.getPendingCourses({ limit: 10 }),
        api.getAnalytics()
      ]);
      setCourses(coursesData.courses || []);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
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
          <h1>Admin Dashboard</h1>
          <p className="text-muted">Platform overview and management</p>
        </div>
      </div>

      {analytics && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h6 className="text-muted">Total Students</h6>
                <h2>{analytics.overview.totalStudents}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h6 className="text-muted">Total Instructors</h6>
                <h2>{analytics.overview.totalInstructors}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h6 className="text-muted">Total Courses</h6>
                <h2>{analytics.overview.totalCourses}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h6 className="text-muted">Pending Review</h6>
                <h2 className="text-warning">{analytics.overview.pendingCourses}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>
              Pending Review
              {courses.length > 0 && (
                <span className="badge bg-warning ms-2">{courses.length}</span>
              )}
            </h3>
            <Link to="/admin/review" className="btn btn-outline-primary">
              View All
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="alert alert-success">
              All courses have been reviewed. No pending approvals.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Level</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <Link to={`/admin/review/${course.id}`}>
                          {course.title}
                        </Link>
                      </td>
                      <td>{course.instructor?.name}</td>
                      <td>{course.level}</td>
                      <td>{new Date(course.updatedAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => navigate(`/admin/review/${course.id}`)}
                          className="btn btn-primary btn-sm"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Quick Actions</h5>
              <div className="d-grid gap-2">
                <Link to="/admin/review" className="btn btn-outline-primary">
                  Review Pending Courses
                </Link>
                <Link to="/admin/analytics" className="btn btn-outline-primary">
                  View Analytics
                </Link>
                <Link to="/admin/users" className="btn btn-outline-primary">
                  Manage Users
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Platform Stats</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between">
                  <span>Published Courses</span>
                  <strong>{analytics?.overview.publishedCourses || 0}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span>Total Enrollments</span>
                  <strong>{analytics?.overview.totalEnrollments || 0}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span>Avg Completion Rate</span>
                  <strong>{analytics?.overview.avgCompletionRate || 0}%</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
