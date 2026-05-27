import { useEffect, useState } from 'react';
import { fetchCourses, createCourse, submitCourse, approveCourse, rejectCourse, publishCourse, archiveCourse } from './api';

const roles = [
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STUDENT', label: 'Student' }
];

function App() {
  const [role, setRole] = useState(roles[0]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await fetchCourses(role.value, 'instructor@example.com');
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [role]);

  const handleCreate = async () => {
    const newCourse = await createCourse({
      title: 'New Course Draft',
      description: 'A new draft course ready for review.',
      category: 'General',
      level: 'Beginner',
      language: 'English',
      thumbnailUrl: 'https://via.placeholder.com/640x360.png?text=Draft',
      tags: ['Draft'],
      videoUrls: ['https://example.com/video.mp4'],
      pdfUrls: [],
      quizJson: '',
      createdBy: 'instructor@example.com'
    });
    setMessage(`Created course ${newCourse.title}`);
    load();
  };

  const transition = async (course, action) => {
    setLoading(true);
    try {
      let result;
      if (action === 'submit') result = await submitCourse(course.id);
      if (action === 'approve') result = await approveCourse(course.id);
      if (action === 'reject') result = await rejectCourse(course.id, 'Needs a stronger description.');
      if (action === 'publish') result = await publishCourse(course.id);
      if (action === 'archive') result = await archiveCourse(course.id);
      setMessage(result ? `${action.toUpperCase()} action completed for ${result.title}` : 'Action completed');
    } catch (error) {
      setMessage('Action failed.');
    }
    await load();
  };

  return (
    <div className="app-shell container py-4">
      <header className="mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
          <div>
            <h1 className="h2">Course Management System</h1>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <label className="m-0 me-2">Role:</label>
            <select className="form-select" value={role.value} onChange={(event) => setRole(roles.find((option) => option.value === event.target.value) ?? roles[0])}>
              {roles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {role.value === 'INSTRUCTOR' && (
              <button className="btn btn-primary" onClick={handleCreate}>Create Draft Course</button>
            )}
          </div>
        </div>
      </header>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="row g-4">
        <section className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5">Available Courses</h2>
              {loading && <p>Loading courses…</p>}
              {!loading && courses.length === 0 && <p>No courses available for this role.</p>}
              <div className="row row-cols-1 g-3 mt-3">
                {courses.map((course) => (
                  <div key={course.id} className="col">
                    <div className="card h-100 course-card" onClick={() => setSelectedCourse(course)} style={{ cursor: 'pointer' }}>
                      <img src={course.thumbnailUrl || 'https://via.placeholder.com/320x180.png?text=Course'} className="card-img-top" alt={course.title} />
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="badge bg-secondary text-uppercase">{course.status}</span>
                          <strong>{course.title}</strong>
                        </div>
                        <p className="card-text">{course.description}</p>
                        <small className="text-muted">{course.category} · {course.level} · {course.language}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {selectedCourse && (
          <aside className="col-lg-4">
            <div className="card shadow-sm course-detail">
              <div className="card-body">
                <h3 className="h5">{selectedCourse.title}</h3>
                <p>{selectedCourse.description}</p>
                <dl className="row small">
                  <dt className="col-5">Status:</dt>
                  <dd className="col-7">{selectedCourse.status}</dd>
                  <dt className="col-5">Category:</dt>
                  <dd className="col-7">{selectedCourse.category}</dd>
                  <dt className="col-5">Level:</dt>
                  <dd className="col-7">{selectedCourse.level}</dd>
                  <dt className="col-5">Language:</dt>
                  <dd className="col-7">{selectedCourse.language}</dd>
                </dl>
                {selectedCourse.rejectionComments && (
                  <div className="alert alert-danger">
                    <strong>Review comments:</strong>
                    <p className="mb-0">{selectedCourse.rejectionComments}</p>
                  </div>
                )}
                <div className="d-grid gap-2">
                  {role.value === 'INSTRUCTOR' && selectedCourse.status !== 'PENDING' && selectedCourse.status !== 'PUBLISHED' && selectedCourse.status !== 'ARCHIVED' && (
                    <button className="btn btn-warning" onClick={() => transition(selectedCourse, 'submit')}>Submit for Review</button>
                  )}
                  {role.value === 'ADMIN' && selectedCourse.status === 'PENDING' && (
                    <>
                      <button className="btn btn-success" onClick={() => transition(selectedCourse, 'approve')}>Approve</button>
                      <button className="btn btn-danger" onClick={() => transition(selectedCourse, 'reject')}>Reject</button>
                    </>
                  )}
                  {role.value === 'ADMIN' && selectedCourse.status === 'APPROVED' && (
                    <button className="btn btn-primary" onClick={() => transition(selectedCourse, 'publish')}>Publish</button>
                  )}
                  {role.value === 'ADMIN' && selectedCourse.status === 'PUBLISHED' && (
                    <button className="btn btn-secondary" onClick={() => transition(selectedCourse, 'archive')}>Archive</button>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;
