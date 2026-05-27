const db = require("../db");

const STATUSES = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
};

const parseJsonField = (value) => {
  try {
    return value ? JSON.parse(value) : [];
  } catch (error) {
    return [];
  }
};

const normalizeCourse = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  level: row.level,
  language: row.language,
  thumbnailUrl: row.thumbnail_url,
  tags: parseJsonField(row.tags),
  videoUrls: parseJsonField(row.video_urls),
  pdfUrls: parseJsonField(row.pdf_urls),
  status: row.status,
  rejectionComments: row.rejection_comments,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getCoursesByRole = async (role, userId) => {
  let query = "SELECT * FROM courses";
  let params = [];

  if (role === "INSTRUCTOR") {
    query += " WHERE created_by = ? ORDER BY updated_at DESC";
    params = [userId];
  } else if (role === "STUDENT") {
    query += " WHERE status = ? ORDER BY updated_at DESC";
    params = [STATUSES.PUBLISHED];
  } else if (role === "ADMIN") {
    query += " ORDER BY updated_at DESC";
  } else {
    query += " WHERE status = ? ORDER BY updated_at DESC";
    params = [STATUSES.PUBLISHED];
  }

  const [rows] = await db.execute(query, params);
  return rows.map(normalizeCourse);
};

const getCourseById = async (id) => {
  const [rows] = await db.execute("SELECT * FROM courses WHERE id = ?", [id]);
  const course = rows[0];
  return course ? normalizeCourse(course) : null;
};

const createCourse = async (payload) => {
  const [result] = await db.execute(
    `INSERT INTO courses
      (title, description, category, level, language, thumbnail_url, tags, video_urls, pdf_urls, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      payload.title,
      payload.description,
      payload.category,
      payload.level,
      payload.language,
      payload.thumbnailUrl,
      JSON.stringify(payload.tags || []),
      JSON.stringify(payload.videoUrls || []),
      JSON.stringify(payload.pdfUrls || []),
      STATUSES.DRAFT,
      payload.createdBy,
    ]
  );

  return getCourseById(result.insertId);
};

const updateCourseStatus = async (id, status, rejectionComments = null) => {
  await db.execute(
    "UPDATE courses SET status = ?, rejection_comments = ?, updated_at = NOW() WHERE id = ?",
    [status, rejectionComments, id]
  );
  return getCourseById(id);
};

module.exports = {
  STATUSES,
  getCoursesByRole,
  getCourseById,
  createCourse,
  updateCourseStatus,
};
