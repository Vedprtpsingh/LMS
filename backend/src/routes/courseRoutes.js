const express = require("express");
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  submitCourse,
  approveCourse,
  rejectCourse,
  publishCourse,
  archiveCourse,
} = require("../controllers/courseController");

const router = express.Router();

router.get("/", getCourses);
router.get("/:id", getCourseById);
router.post("/", createCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);
router.post("/:id/submit", submitCourse);
router.post("/:id/approve", approveCourse);
router.post("/:id/reject", rejectCourse);
router.post("/:id/publish", publishCourse);
router.post("/:id/archive", archiveCourse);

module.exports = router;
