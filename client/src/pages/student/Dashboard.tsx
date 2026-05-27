import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Enrollment } from '../../types';

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const data = await api.getMyEnrollments({ limit: 6 });
      setEnrollments(data.enrollments || []);
    } catch (error) {
      console.error('Failed to load enrollments:', error);
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
          <h1>Student Dashboard</h1>
          <p className="text-muted">Continue your learning journey</p>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Enrolled Courses</h5>
              <h2 className="display-4">{enrollments.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Completed</h5>
              <h2 className="display-4">
                {enrollments.filter(e => e.completedAt).length}
              </h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">In Progress</h5>
              <h2 className="display-4">
                {enrollments.filter(e => !e.completedAt).length}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Continue Learning</h3>
            <Link to="/student/browse" className="btn btn-primary">
              Browse Courses
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="alert alert-info">
              <p className="mb-3">You haven't enrolled in any courses yet.</p>
              <Link to="/student/browse" className="btn btn-primary">
                Browse Available Courses
              </Link>
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="col">
                  <div className="card h-100 shadow-sm">
                    {enrollment.course.thumbnailUrl && (
                      <img
                        src={enrollment.course.thumbnailUrl}
                        className="card-img-top"
                        alt={enrollment.course.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                    )}
                    <div className="card-body">
                      <h5 className="card-title">{enrollment.course.title}</h5>
                      <p className="card-text text-truncate">
                        {enrollment.course.description}
                      </p>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small>Progress</small>
                          <small>{Math.round(enrollment.progressPercent)}%</small>
                        </div>
                        <div className="progress">
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${enrollment.progressPercent}%` }}
                          />
                        </div>
                      </div>
                      <Link
                        to={`/student/learn/${enrollment.course.id}`}
                        className="btn btn-primary w-100"
                      >
                        Continue Learning
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
