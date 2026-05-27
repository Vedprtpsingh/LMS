import React from "react";

const STATUS_VARIANTS = {
  DRAFT: "secondary",
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "danger",
  PUBLISHED: "success",
  ARCHIVED: "dark",
};

function CourseDetail({ course, role, onAction }) {
  if (!course) {
    return (
      <div className="card shadow-sm p-4 text-center empty-detail">
        <div className="card-body">
          <h5>Select a course to view details</h5>
          <p className="text-muted">Choose a course card on the left to review status, media, and workflow actions.</p>
        </div>
      </div>
    );
  }

  const canSubmit = role === "INSTRUCTOR" && ["DRAFT", "REJECTED"].includes(course.status);
  const canApprove = role === "ADMIN" && course.status === "PENDING";
  const canReject = role === "ADMIN" && course.status === "PENDING";
  const canPublish = role === "ADMIN" && course.status === "APPROVED";
  const canArchive = role === "ADMIN" && course.status === "PUBLISHED";

  return (
    <div className="card shadow-sm course-detail-card">
      <div className="card-body">
        <div className="d-flex align-items-start gap-3 mb-4">
          <img
            src={course.thumbnailUrl || "https://via.placeholder.com/320x180.png?text=Course+Thumbnail"}
            alt={course.title}
            className="course-detail-image rounded"
          />
          <div>
            <h4 className="mb-2">{course.title}</h4>
            <div className="mb-3">
              <span className={`badge bg-${STATUS_VARIANTS[course.status] || "secondary"} me-2`}>{course.status}</span>
              <span className="badge bg-light text-dark me-2">{course.category}</span>
              <span className="badge bg-light text-dark">{course.level}</span>
            </div>
            <p className="mb-1 text-muted">Language: {course.language}</p>
            <p className="text-muted small">Created by {course.createdBy}</p>
          </div>
        </div>

        <div className="mb-4">
          <h5 className="mb-2">Course overview</h5>
          <p>{course.description}</p>
        </div>

        {course.rejectionComments && (
          <div className="alert alert-danger" role="alert">
            <strong>Review feedback:</strong>
            <p className="mb-0">{course.rejectionComments}</p>
          </div>
        )}

        <div className="row g-3 mb-4">
          <div className="col-sm-6">
            <div className="card border-light h-100">
              <div className="card-body">
                <h6>Video tutorials</h6>
                {course.videoUrls.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {course.videoUrls.map((url, index) => (
                      <li key={index} className="small mb-2">
                        <a href={url} target="_blank" rel="noreferrer">Video {index + 1}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted small mb-0">No video tutorials added yet.</p>
                )}
              </div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="card border-light h-100">
              <div className="card-body">
                <h6>Documents</h6>
                {course.pdfUrls.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {course.pdfUrls.map((url, index) => (
                      <li key={index} className="small mb-2">
                        <a href={url} target="_blank" rel="noreferrer">Document {index + 1}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted small mb-0">No PDF resources added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {canSubmit && (
            <button className="btn btn-warning" onClick={() => onAction(course, "submit")}>Submit for Review</button>
          )}
          {canApprove && (
            <button className="btn btn-success" onClick={() => onAction(course, "approve")}>Approve</button>
          )}
          {canReject && (
            <button className="btn btn-outline-danger" onClick={() => onAction(course, "reject")}>Reject</button>
          )}
          {canPublish && (
            <button className="btn btn-primary" onClick={() => onAction(course, "publish")}>Publish</button>
          )}
          {canArchive && (
            <button className="btn btn-dark" onClick={() => onAction(course, "archive")}>Archive</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
