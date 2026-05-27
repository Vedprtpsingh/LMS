const Course = require("../models/courseModel");

const sendError = (res, status, message) => res.status(status).json({ error: message });

const getCourses = async (req, res) => {
  const { role, userId } = req.query;
  try {
    const courses = await Course.getCoursesByRole(role, userId || "anonymous");
    res.json(courses);
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Failed to load courses.");
  }
};

const createCourse = async (req, res) => {
  const payload = req.body;

  if (!payload.title || !payload.description) {
    return sendError(res, 400, "title and description are required.");
  }

  try {
    const course = await Course.createCourse(payload);
    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Failed to create course.");
  }
};

const submitCourse = async (req, res) => {
  try {
    const course = await Course.getCourseById(req.params.id);
    if (!course) return sendError(res, 404, "Course not found.");
    if (![Course.STATUSES.DRAFT, Course.STATUSES.REJECTED].includes(course.status)) {
      return sendError(res, 400, "Only DRAFT or REJECTED courses can be submitted.");
    }
    const updated = await Course.updateCourseStatus(req.params.id, Course.STATUSES.PENDING, null);
    res.json(updated);
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Failed to submit course.");
  }
};

const approveCourse = async (req, res) => {
  try {
    const course = await Course.getCourseById(req.params.id);
    if (!course) return sendError(res, 404, "Course not found.");
    if (course.status !== Course.STATUSES.PENDING) {
      return sendError(res, 400, "Only PENDING courses can be approved.");
    }
    const updated = await Course.updateCourseStatus(req.params.id, Course.STATUSES.APPROVED, null);
    res.json(updated);
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Failed to approve course.");
  }
};

const rejectCourse = async (req, res) => {
  try {
    const course = await Course.getCourseById(req.params.id);
    if (!course) return sendError(res, 404, "Course not found.");
    if (course.status !== Course.STATUSES.PENDING) {
      return sendError(res, 400, "Only PENDING courses can be rejected.");
    }
    const comments = req.body.comments || "Needs review from the instructor.";
    const updated = await Course.updateCourseStatus(req.params.id, Course.STATUSES.REJECTED, comments);
    res.json(updated);
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Failed to reject course.");
  }
};

const publishCourse = async (req, res) => {
  try {
    const course = await Course.getCourseById(req.params.id);
    if (!course) return sendError(res, 404, "Course not found.");
    if (course.status !== Course.STATUSES.APPROVED) {
      return sendError(res, 400, "Only APPROVED courses can be published.");
    }
    const updated = await Course.updateCourseStatus(req.params.id, Course.STATUSES.PUBLISHED, null);
    res.json(updated);
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Failed to publish course.");
  }
};

const archiveCourse = async (req, res) => {
  try {
    const course = await Course.getCourseById(req.params.id);
    if (!course) return sendError(res, 404, "Course not found.");
    if (course.status !== Course.STATUSES.PUBLISHED) {
      return sendError(res, 400, "Only PUBLISHED courses can be archived.");
    }
    const updated = await Course.updateCourseStatus(req.params.id, Course.STATUSES.ARCHIVED, null);
    res.json(updated);
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Failed to archive course.");
  }
};

module.exports = {
  getCourses,
  createCourse,
  submitCourse,
  approveCourse,
  rejectCourse,
  publishCourse,
  archiveCourse,
};
