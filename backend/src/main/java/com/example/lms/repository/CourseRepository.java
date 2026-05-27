package com.example.lms.repository;

import com.example.lms.model.Course;
import com.example.lms.model.enums.CourseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByStatusIn(List<CourseStatus> statuses);
    List<Course> findByCreatedBy(String createdBy);
}
