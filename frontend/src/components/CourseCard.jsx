import React from "react";

const STATUS_VARIANTS = {
  DRAFT: "secondary",
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "danger",
  PUBLISHED: "success",
  ARCHIVED: "dark",
};

function CourseCard({ course, onSelect, isActive }) {
  return (
    <div
      className={`card course-card h-100 shadow-sm ${isActive ? "border-primary" : ""}`}
      onClick={() => onSelect(course)}
      style={{ cursor: "pointer" }}
    >
      <img
        src={course.thumbnailUrl || "https://via.placeholder.com/640x360.png?text=Course+Thumbnail"}
        className="card-img-top"
        alt={course.title}
      />
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className={`badge bg-${STATUS_VARIANTS[course.status] || "secondary"}`}>{course.status}</span>
          <small className="text-muted">{course.language}</small>
        </div>
        <h5 className="card-title">{course.title}</h5>
        <p className="card-text text-truncate">{course.description}</p>
        <div className="mt-auto pt-2">
          <span className="badge bg-light text-dark me-1">{course.category}</span>
          <span className="badge bg-light text-dark">{course.level}</span>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;
