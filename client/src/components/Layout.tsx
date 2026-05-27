import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link to="/" className="navbar-brand fw-bold">
            LMS Platform
          </Link>

          <div className="navbar-nav ms-auto">
            {user ? (
              <>
                {user.role === 'STUDENT' && (
                  <>
                    <Link
                      to="/student/dashboard"
                      className={`nav-link ${isActive('/student/dashboard') ? 'active' : ''}`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/student/browse"
                      className={`nav-link ${isActive('/student/browse') ? 'active' : ''}`}
                    >
                      Browse Courses
                    </Link>
                    <Link
                      to="/student/my-courses"
                      className={`nav-link ${isActive('/student/my-courses') ? 'active' : ''}`}
                    >
                      My Courses
                    </Link>
                  </>
                )}

                {user.role === 'INSTRUCTOR' && (
                  <>
                    <Link
                      to="/instructor/dashboard"
                      className={`nav-link ${isActive('/instructor/dashboard') ? 'active' : ''}`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/instructor/courses"
                      className={`nav-link ${isActive('/instructor/courses') ? 'active' : ''}`}
                    >
                      My Courses
                    </Link>
                  </>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/review"
                      className={`nav-link ${isActive('/admin/review') ? 'active' : ''}`}
                    >
                      Pending Review
                    </Link>
                    <Link
                      to="/admin/analytics"
                      className={`nav-link ${isActive('/admin/analytics') ? 'active' : ''}`}
                    >
                      Analytics
                    </Link>
                  </>
                )}

                <span className="nav-link text-info">| {user.name}</span>
                <button onClick={logout} className="btn btn-outline-light ms-2 btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-light ms-2 btn-sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow-1">
        {children}
      </main>

      <footer className="bg-dark text-light py-4 mt-5">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5>LMS Platform</h5>
              <p className="text-muted">
                A comprehensive learning management system for modern education.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0">&copy; 2024 LMS Platform. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
