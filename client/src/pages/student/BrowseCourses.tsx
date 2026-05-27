import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Course } from '../../types';

export default function BrowseCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCourses();
  }, [search]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await api.getCourses({
        status: 'PUBLISHED',
        search: search || undefined,
        limit: 50
      });
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!confirm('Are you sure you want to enroll in this course?')) return;

    try {
      await api.enrollInCourse(courseId);
      alert('Successfully enrolled!');
      loadCourses();
    } catch (error: any) {
      alert(error.message || 'Failed to enroll');
    }
  };

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col">
          <h1>Browse Courses</h1>
          <p className="text-muted">Discover new courses and expand your knowledge</p>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : courses.length === 0 ? (
        <div className="alert alert-info">No courses found.</div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {courses.map((course) => (
            <div key={course.id} className="col">
              <div className="card h-100 shadow-sm">
                {course.thumbnailUrl && (
                  <img
                    src={course.thumbnailUrl}
                    className="card-img-top"
                    alt={course.title}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text text-truncate">{course.description}</p>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-secondary">{course.level}</span>
                    <span className="text-warning">
                      {course.avgRating > 0 ? `${course.avgRating.toFixed(1)} ★` : 'No ratings'}
                    </span>
                  </div>
                  <p className="card-text">
                    <small className="text-muted">By {course.instructor.name}</small>
                  </p>
                  <div className="d-flex gap-2">
                    <Link
                      to={`/student/course/${course.id}`}
                      className="btn btn-outline-primary flex-grow-1"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleEnroll(course.id)}
                      className="btn btn-primary"
                    >
                      Enroll
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
