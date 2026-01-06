-- QP Repository Workflow System - Database Schema
-- MySQL Database Schema
-- Run this in phpMyAdmin or MySQL command line

-- Create database
CREATE DATABASE IF NOT EXISTS workflow_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE workflow_system;

-- ====================================
-- 1. Users Table
-- ====================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 2. User Privileges Table
-- ====================================
CREATE TABLE user_privileges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    privilege ENUM('COORDINATOR', 'DEPUTY_DEAN', 'ADMIN') NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_privilege (user_id, privilege),
    UNIQUE KEY unique_user_privilege (user_id, privilege)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 3. Departments Table
-- ====================================
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 4. Sessions Table
-- ====================================
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 5. Courses Table
-- ====================================
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_code (code),
    INDEX idx_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 6. Course Role Mapping Table
-- ====================================
CREATE TABLE course_role_map (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    coordinator_user_id INT,
    deputy_dean_user_id INT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (coordinator_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (deputy_dean_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_course (course_id),
    UNIQUE KEY unique_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 7. Submissions Table
-- ====================================
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lecturer_user_id INT NOT NULL,
    session_id INT NOT NULL,
    department_id INT NOT NULL,
    course_id INT NOT NULL,
    type_of_study ENUM('Undergraduate', 'Postgraduate') NOT NULL,
    status ENUM('DRAFT', 'SUBMITTED', 'COORDINATOR_APPROVED', 'DEAN_ENDORSED', 'REJECTED') DEFAULT 'DRAFT',
    current_assignee_id INT,
    submitted_at TIMESTAMP NULL,
    coordinator_approved_at TIMESTAMP NULL,
    dean_endorsed_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturer_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (current_assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_lecturer (lecturer_user_id),
    INDEX idx_status (status),
    INDEX idx_assignee (current_assignee_id),
    INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 8. Submission Documents Table
-- ====================================
CREATE TABLE submission_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    not_applicable BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    INDEX idx_submission (submission_id),
    INDEX idx_doc_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 9. Submission Groups Table
-- ====================================
CREATE TABLE submission_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    final_exam_mark_file VARCHAR(500),
    student_list_file VARCHAR(500),
    attendance_record_file VARCHAR(500),
    assignment1_file VARCHAR(500),
    assignment2_file VARCHAR(500),
    assignment3_file VARCHAR(500),
    cm1_file VARCHAR(500),
    cm2_file VARCHAR(500),
    cm3_file VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    INDEX idx_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 10. Audit Logs Table
-- ====================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Sample Data
-- ====================================

-- Insert default admin user (password: admin123 - hashed with bcrypt)
INSERT INTO users (name, email, password) VALUES 
('System Administrator', 'admin@test.com', '$2b$10$Yz3iWrTFzVShGMNpTJI8DepJ/nd1uldMDy2oC9ZzxUqxsDBsg7BWu'),
('Dr. Emily Wang', 'lecturer@test.com', '$2b$10$Yz3iWrTFzVShGMNpTJI8DepJ/nd1uldMDy2oC9ZzxUqxsDBsg7BWu');

-- Grant admin privilege to first user
INSERT INTO user_privileges (user_id, privilege, active) VALUES (1, 'ADMIN', TRUE);

-- Insert sample sessions
INSERT INTO sessions (code, name, active) VALUES 
('A241', 'Semester 1 2024/2025', TRUE),
('A242', 'Semester 2 2024/2025', TRUE),
('A251', 'Semester 1 2025/2026', TRUE),
('A252', 'Semester 2 2025/2026', TRUE);

-- Insert sample departments
INSERT INTO departments (code, name, active) VALUES 
('OYAGSB', 'Othman Yeop Abdullah Graduate School of Business', TRUE),
('SBM', 'School of Business Management', TRUE),
('SEFB', 'School of Economics, Finance and Banking', TRUE);

-- Insert sample courses
INSERT INTO courses (code, name, department_id, active) VALUES 
('BPMN3123', 'Strategic Management', 1, TRUE),
('BWFF2043', 'Advanced Financial Management', 1, TRUE),
('BBUS2033', 'Business Analytics', 2, TRUE),
('BWFN3013', 'Corporate Finance', 3, TRUE);

-- ====================================
-- Useful Queries
-- ====================================

-- Get all users with their privileges
-- SELECT u.*, GROUP_CONCAT(up.privilege) as privileges
-- FROM users u
-- LEFT JOIN user_privileges up ON u.id = up.user_id AND up.active = TRUE
-- GROUP BY u.id;

-- Get submissions with full details
-- SELECT 
--     s.*,
--     u.name as lecturer_name,
--     sess.code as session_code,
--     d.name as department_name,
--     c.name as course_name
-- FROM submissions s
-- JOIN users u ON s.lecturer_user_id = u.id
-- JOIN sessions sess ON s.session_id = sess.id
-- JOIN departments d ON s.department_id = d.id
-- JOIN courses c ON s.course_id = c.id;

-- Get course role mappings
-- SELECT 
--     c.code as course_code,
--     c.name as course_name,
--     coord.name as coordinator_name,
--     dean.name as deputy_dean_name
-- FROM course_role_map crm
-- JOIN courses c ON crm.course_id = c.id
-- LEFT JOIN users coord ON crm.coordinator_user_id = coord.id
-- LEFT JOIN users dean ON crm.deputy_dean_user_id = dean.id
-- WHERE crm.active = TRUE;

