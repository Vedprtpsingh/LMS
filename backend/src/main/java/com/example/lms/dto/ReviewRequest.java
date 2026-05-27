package com.example.lms.dto;

import jakarta.validation.constraints.NotBlank;

public class ReviewRequest {
    @NotBlank
    private String reviewer;

    @NotBlank
    private String comments;

    public String getReviewer() {
        return reviewer;
    }

    public void setReviewer(String reviewer) {
        this.reviewer = reviewer;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }
}
