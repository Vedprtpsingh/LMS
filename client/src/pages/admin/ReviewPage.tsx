import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Course } from '../../types';

export default function ReviewPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectComment, setRejectComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await api.getPendingCourses({ limit: 50 });
      setCourses(data.courses || []);
      if (data.courses && data.courses.length > 0 && !selectedCourse) {
        setSelectedCourse(data.courses[0]);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (courseId: string) => {
    if (!confirm('Approve this course?')) return;

    setProcessing(true);
    try {
      await api.approveCourse(courseId);
      alert('Course approved successfully!');
      await loadCourses();
      setSelectedCourse(null);
    } catch (error: any) {
      alert(error.message || 'Failed to approve course');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (courseId: string) => {
    if (!rejectComment.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!confirm('Reject this course?')) return;

    setProcessing(true);
    try {
      await api.rejectCourse(courseId, rejectComment);
      alert('Course rejected');
      await loadCourses();
      setSelectedCourse(null);
      setRejectComment('');
    } catch (error: any) {
      alert(error.message || 'Failed to reject course');
    } finally {
      setProcessing(false);
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
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-md-5">
          <h2 className="mb-4">Pending Review ({courses.length})</h2>

          {courses.length === 0 ? (
            <div className="alert alert-success">
              No courses pending review
            </div>
          ) : (
            <div className="list-group">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`list-group-item list-group-item-action ${
                    selectedCourse?.id === course.id ? 'active' : ''
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">{course.title}</h5>
                      <small>
                        by {course.instructor?.name} | {course.level}
                      </small>
                    </div>
                    <span className="badge bg-warning">Pending</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-md-7">
          {selectedCourse ? (
            <div className="card">
              <div className="card-body">
                <h3 className="card-title">{selectedCourse.title}</h3>
                <p className="text-muted mb-3">
                  Level: {selectedCourse.level} | Language: {selectedCourse.language || 'English'}
                </p>

                {selectedCourse.thumbnailUrl && (
                  <img
                    src={selectedCourse.thumbnailUrl}
                    alt={selectedCourse.title}
                    className="img-fluid rounded mb-3"
                    style={{ maxHeight: '200px', objectFit: 'cover' }}
                  />
                )}

                <h5>Description</h5>
                <p className="card-text">{selectedCourse.description || 'No description provided'}</p>

                <h5 className="mt-4">Review Checklist</h5>
                <ul className="list-group">
                  <li className="list-group-item">
                    <input type="checkbox" className="form-check-input me-2" />
                    Content is accurate and well-structured
                  </li>
                  <li className="list-group-item">
                    <input type="checkbox" className="form-check-input me-2" />
                    No inappropriate or copyrighted material
                  </li>
                  <li className="list-group-item">
                    <input type="checkbox" className="form-check-input me-2" />
                    Course title and description are clear
                  </li>
                  <li className="list-group-item">
                    <input type="checkbox" className="form-check-input me-2" />
                    Thumbnail is appropriate
                  </li>
                  <li className="list-group-item">
                    <input type="checkbox" className="form-check-input me-2" />
                    Category and level are correct
                  </li>
                </ul>

                <div className="mt-4">
                  <h5>Actions</h5>

                  <div className="mb-3">
                    <label className="form-label">Rejection Reason (if rejecting)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={rejectComment}
                      onChange={(e) => setRejectComment(e.target.value)}
                      placeholder="Provide detailed feedback for the instructor..."
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      onClick={() => handleApprove(selectedCourse.id)}
                      className="btn btn-success"
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedCourse.id)}
                      className="btn btn-danger"
                      disabled={processing || !rejectComment.trim()}
                    >
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center py-5">
                <p className="text-muted">Select a course from the list to review</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
