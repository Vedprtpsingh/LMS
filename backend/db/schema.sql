-- Course Management schema for the Node.js backend

CREATE DATABASE IF NOT EXISTS lmsdb;
USE lmsdb;

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(128),
  level VARCHAR(64),
  language VARCHAR(64),
  thumbnail_url VARCHAR(512),
  tags TEXT,
  video_urls TEXT,
  pdf_urls TEXT,
  status ENUM('DRAFT','PENDING','APPROVED','REJECTED','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  rejection_comments TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
