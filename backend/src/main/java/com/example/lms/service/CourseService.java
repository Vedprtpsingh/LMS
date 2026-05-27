package com.example.lms.service;

import com.example.lms.dto.CourseRequest;
import com.example.lms.dto.CourseResponse;
import com.example.lms.dto.ReviewRequest;
import com.example.lms.model.Course;
import com.example.lms.model.enums.CourseStatus;
import com.example.lms.repository.CourseRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public CourseResponse createCourse(CourseRequest request) {
        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setCategory(request.getCategory());
        course.setLevel(request.getLevel());
        course.setLanguage(request.getLanguage());
        course.setThumbnailUrl(request.getThumbnailUrl());
        course.setTags(request.getTags());
        course.setVideoUrls(request.getVideoUrls());
        course.setPdfUrls(request.getPdfUrls());
        course.setQuizJson(request.getQuizJson());
        course.setCreatedBy(request.getCreatedBy());
        course.setStatus(CourseStatus.DRAFT);
        course.setCreatedAt(Instant.now());
        course.setUpdatedAt(Instant.now());
        return toResponse(courseRepository.save(course));
    }

    public CourseResponse updateCourse(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Course not found"));
        if (course.getStatus() == CourseStatus.PENDING || course.getStatus() == CourseStatus.PUBLISHED || course.getStatus() == CourseStatus.ARCHIVED) {
            throw new IllegalStateException("Course cannot be edited in current state");
        }
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setCategory(request.getCategory());
        course.setLevel(request.getLevel());
        course.setLanguage(request.getLanguage());
        course.setThumbnailUrl(request.getThumbnailUrl());
        course.setTags(request.getTags());
        course.setVideoUrls(request.getVideoUrls());
        course.setPdfUrls(request.getPdfUrls());
        course.setQuizJson(request.getQuizJson());
        course.setUpdatedAt(Instant.now());
        course.setRejectionComments(null);
        return toResponse(courseRepository.save(course));
    }

    public CourseResponse submitForReview(Long id) {
        Course course = findCourse(id);
        if (course.getStatus() != CourseStatus.DRAFT && course.getStatus() != CourseStatus.REJECTED) {
            throw new IllegalStateException("Only draft or rejected courses can be submitted for review");
        }
        course.setStatus(CourseStatus.PENDING);
        course.setUpdatedAt(Instant.now());
        return toResponse(courseRepository.save(course));
    }

    public CourseResponse approveCourse(Long id) {
        Course course = findCourse(id);
        if (course.getStatus() != CourseStatus.PENDING) {
            throw new IllegalStateException("Only pending courses can be approved");
        }
        course.setStatus(CourseStatus.APPROVED);
        course.setRejectionComments(null);
        course.setUpdatedAt(Instant.now());
        return toResponse(courseRepository.save(course));
    }

    public CourseResponse rejectCourse(Long id, ReviewRequest request) {
        Course course = findCourse(id);
        if (course.getStatus() != CourseStatus.PENDING) {
            throw new IllegalStateException("Only pending courses can be rejected");
        }
        course.setStatus(CourseStatus.REJECTED);
        course.setRejectionComments(request.getComments());
        course.setUpdatedAt(Instant.now());
        return toResponse(courseRepository.save(course));
    }

    public CourseResponse publishCourse(Long id) {
        Course course = findCourse(id);
        if (course.getStatus() != CourseStatus.APPROVED) {
            throw new IllegalStateException("Only approved courses can be published");
        }
        course.setStatus(CourseStatus.PUBLISHED);
        course.setUpdatedAt(Instant.now());
        return toResponse(courseRepository.save(course));
    }

    public CourseResponse archiveCourse(Long id) {
        Course course = findCourse(id);
        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new IllegalStateException("Only published courses can be archived");
        }
        course.setStatus(CourseStatus.ARCHIVED);
        course.setUpdatedAt(Instant.now());
        return toResponse(courseRepository.save(course));
    }

    public CourseResponse getCourse(Long id) {
        return toResponse(findCourse(id));
    }

    public List<CourseResponse> listCoursesForRole(String role, String userId) {
        if ("INSTRUCTOR".equalsIgnoreCase(role)) {
            return courseRepository.findByCreatedBy(userId)
                    .stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        if ("ADMIN".equalsIgnoreCase(role)) {
            return courseRepository.findByStatusIn(List.of(CourseStatus.PENDING, CourseStatus.APPROVED, CourseStatus.PUBLISHED, CourseStatus.REJECTED, CourseStatus.ARCHIVED))
                    .stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        return courseRepository.findByStatusIn(List.of(CourseStatus.PUBLISHED))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Course findCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Course not found"));
    }

    private CourseResponse toResponse(Course course) {
        CourseResponse response = new CourseResponse();
        response.setId(course.getId());
        response.setTitle(course.getTitle());
        response.setDescription(course.getDescription());
        response.setCategory(course.getCategory());
        response.setLevel(course.getLevel());
        response.setLanguage(course.getLanguage());
        response.setThumbnailUrl(course.getThumbnailUrl());
        response.setTags(course.getTags());
        response.setVideoUrls(course.getVideoUrls());
        response.setPdfUrls(course.getPdfUrls());
        response.setQuizJson(course.getQuizJson());
        response.setStatus(course.getStatus());
        response.setRejectionComments(course.getRejectionComments());
        response.setCreatedBy(course.getCreatedBy());
        response.setCreatedAt(course.getCreatedAt());
        response.setUpdatedAt(course.getUpdatedAt());
        return response;
    }
}
