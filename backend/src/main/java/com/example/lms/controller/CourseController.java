package com.example.lms.controller;

import com.example.lms.dto.CourseRequest;
import com.example.lms.dto.CourseResponse;
import com.example.lms.dto.ReviewRequest;
import com.example.lms.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CourseRequest request) {
        return new ResponseEntity<>(courseService.createCourse(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseResponse> updateCourse(@PathVariable Long id, @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(courseService.updateCourse(id, request));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<CourseResponse> submitReview(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.submitForReview(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<CourseResponse> approveCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.approveCourse(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<CourseResponse> rejectCourse(@PathVariable Long id, @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(courseService.rejectCourse(id, request));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<CourseResponse> publishCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.publishCourse(id));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<CourseResponse> archiveCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.archiveCourse(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourse(id));
    }

    @GetMapping
    public ResponseEntity<List<CourseResponse>> listCourses(
            @RequestParam(defaultValue = "STUDENT") String role,
            @RequestParam(defaultValue = "instructor@example.com") String userId) {
        return ResponseEntity.ok(courseService.listCoursesForRole(role, userId));
    }
}
