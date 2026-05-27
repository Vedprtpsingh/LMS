package com.example.lms.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

public class CourseRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String category;

    @NotBlank
    private String level;

    @NotBlank
    private String language;

    private String thumbnailUrl;
    private List<String> tags = new ArrayList<>();
    private List<String> videoUrls = new ArrayList<>();
    private List<String> pdfUrls = new ArrayList<>();
    private String quizJson;
    private String createdBy;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public List<String> getVideoUrls() {
        return videoUrls;
    }

    public void setVideoUrls(List<String> videoUrls) {
        this.videoUrls = videoUrls;
    }

    public List<String> getPdfUrls() {
        return pdfUrls;
    }

    public void setPdfUrls(List<String> pdfUrls) {
        this.pdfUrls = pdfUrls;
    }

    public String getQuizJson() {
        return quizJson;
    }

    public void setQuizJson(String quizJson) {
        this.quizJson = quizJson;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}
