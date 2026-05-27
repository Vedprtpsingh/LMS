package com.example.lms.config;

import com.example.lms.model.Course;
import com.example.lms.model.enums.CourseStatus;
import com.example.lms.repository.CourseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner loadData(CourseRepository courseRepository) {
        return args -> {
            if (courseRepository.count() == 0) {
                Course sample = new Course();
                sample.setTitle("Introduction to Web Development");
                sample.setDescription("Learn the basics of HTML, CSS, and JavaScript to build modern web applications.");
                sample.setCategory("Web Development");
                sample.setLevel("Beginner");
                sample.setLanguage("English");
                sample.setThumbnailUrl("https://via.placeholder.com/640x360.png?text=Course+Thumbnail");
                sample.setTags(List.of("HTML", "CSS", "JavaScript"));
                sample.setVideoUrls(List.of("https://example.com/video1.mp4", "https://example.com/video2.mp4"));
                sample.setPdfUrls(List.of("https://example.com/lesson1.pdf"));
                sample.setQuizJson("[{\"question\":\"What does HTML stand for?\",\"type\":\"multiple-choice\",\"options\":[\"HyperText Markup Language\",\"HighText Machine Language\"],\"answer\":0}]");
                sample.setStatus(CourseStatus.PUBLISHED);
                sample.setCreatedBy("instructor@example.com");
                courseRepository.save(sample);
            }
        };
    }
}
