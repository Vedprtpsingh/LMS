import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container py-5">
        <div className="row align-items-center" style={{ minHeight: '60vh' }}>
          <div className="col-md-6">
            <h1 className="display-4 fw-bold mb-4">
              Learn Without Limits
            </h1>
            <p className="lead text-muted mb-4">
              Start, switch, or advance your career with thousands of courses from expert instructors.
            </p>
            <a href="/register" className="btn btn-primary btn-lg me-2">
              Get Started
            </a>
            <a href="/login" className="btn btn-outline-primary btn-lg">
              Sign In
            </a>
          </div>
          <div className="col-md-6">
            <img
              src="https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Learning"
              className="img-fluid rounded shadow"
            />
          </div>
        </div>

        <div className="row mt-5">
          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h3 className="card-title">For Students</h3>
                <p className="card-text">
                  Access thousands of courses, track your progress, and achieve your learning goals.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h3 className="card-title">For Instructors</h3>
                <p className="card-text">
                  Create engaging courses, reach students worldwide, and earn from your expertise.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h3 className="card-title">For Organizations</h3>
                <p className="card-text">
                  Upskill your team with customized learning paths and progress tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect based on role
  switch (user.role) {
    case 'STUDENT':
      return <Navigate to="/student/dashboard" replace />;
    case 'INSTRUCTOR':
      return <Navigate to="/instructor/dashboard" replace />;
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}
