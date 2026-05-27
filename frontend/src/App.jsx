import { useEffect, useMemo, useState } from "react";
import { fetchCourses, createCourse, submitCourse, approveCourse, rejectCourse, publishCourse, archiveCourse } from "./api";
import CourseCard from "./components/CourseCard";
import CourseDetail from "./components/CourseDetail";
import CourseForm from "./components/CourseForm";

const roles = [
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "ADMIN", label: "Admin" },
  { value: "STUDENT", label: "Student" },
];

const statusLabels = {
  DRAFT: "Draft",
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

function App() {
  const [role, setRole] = useState(roles[0]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const userId = useMemo(() => {
    if (role.value === "INSTRUCTOR") return "instructor@example.com";
    if (role.value === "ADMIN") return "admin@example.com";
    return "student@example.com";
  }, [role]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await fetchCourses(role.value, userId);
      setCourses(data);
      if (!data.find((course) => course.id === selectedCourse?.id)) {
        setSelectedCourse(data[0] || null);
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [role]);

  const transition = async (course, action) => {
    setLoading(true);
    try {
      let result;
      if (action === "submit") result = await submitCourse(course.id);
      if (action === "approve") result = await approveCourse(course.id);
      if (action === "reject") result = await rejectCourse(course.id, "Please revise the course description and media.");
      if (action === "publish") result = await publishCourse(course.id);
      if (action === "archive") result = await archiveCourse(course.id);
      setMessage(result ? `${statusLabels[result.status] || action} completed for ${result.title}` : "Action completed.");
      await loadCourses();
    } catch (error) {
      console.error(error);
      setMessage("Action failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    try {
      setLoading(true);
      const course = await createCourse(payload);
      setMessage(`Created draft ${course.title}`);
      setSelectedCourse(course);
      setShowForm(false);
      await loadCourses();
    } catch (error) {
      console.error(error);
      setMessage("Failed to create course.");
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    return courses.reduce((acc, course) => {
      acc[course.status] = (acc[course.status] || 0) + 1;
      return acc;
    }, {});
  }, [courses]);

  return (
    <div className="app-shell container py-4">
      <header className="mb-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
          <div>
            <h1 className="h2 mb-2">Course Management</h1>
            <p className="text-muted mb-0">Manage course drafts, review workflow, and publish content for students.</p>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center">
            <div className="me-0 me-sm-2">
              <label className="form-label mb-1">Role</label>
              <select
                className="form-select"
                value={role.value}
                onChange={(event) => setRole(roles.find((option) => option.value === event.target.value) ?? roles[0])}
              >
                {roles.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {role.value === "INSTRUCTOR" && (
              <button className="btn btn-primary align-self-end" onClick={() => setShowForm(true)}>
                Create Draft Course
              </button>
            )}
          </div>
        </div>
      </header>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="row g-3 mb-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="col-6 col-md-4 col-xl-2">
            <div className="card shadow-sm status-card p-3">
              <div className="d-flex align-items-center justify-content-between">
                <span className="small text-uppercase text-muted">{status}</span>
                <span className="badge bg-secondary">{count}</span>
              </div>
              <div className="h3 mb-0 mt-3">{count}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <section className="col-xl-7">
          <div className="card shadow-sm course-list-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="h5 mb-1">Course catalog</h2>
                  <p className="text-muted small mb-0">Browse all courses available for your role.</p>
                </div>
                <span className="text-muted small">{loading ? "Refreshing…" : `${courses.length} courses`}</span>
              </div>

              {!loading && courses.length === 0 && (
                <div className="text-center py-5 text-muted">No courses available for this role.</div>
              )}

              <div className="row row-cols-1 row-cols-md-2 g-3">
                {courses.map((course) => (
                  <div key={course.id} className="col">
                    <CourseCard course={course} onSelect={setSelectedCourse} isActive={selectedCourse?.id === course.id} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="col-xl-5">
          <CourseDetail course={selectedCourse} role={role.value} onAction={transition} />
        </aside>
      </div>

      {showForm && <CourseForm onClose={() => setShowForm(false)} onSubmit={handleCreate} createdBy={userId} />}
    </div>
  );
}

export default App;
