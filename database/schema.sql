-- ============================================
-- Database Schema: Healthcare Consultation & Booking System
-- Version: 1.0
-- Date: 2025-11-19
-- ============================================

-- Drop existing tables (for development only)
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS doctor_schedules;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS specialties;

-- ============================================
-- Core Tables
-- ============================================

-- Specialties (Chuyên khoa)
CREATE TABLE specialties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    slug VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users (Abstract - Base table)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'doctor', 'patient') NOT NULL DEFAULT 'patient',
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patients (Kế thừa User)
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    insurance_number VARCHAR(50),
    blood_type VARCHAR(5),
    allergies TEXT COMMENT 'JSON array of allergies',
    medical_history TEXT COMMENT 'Tiền sử bệnh án',
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doctors (Kế thừa User)
CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialty_id INT NOT NULL,
    bio TEXT COMMENT 'Giới thiệu bản thân',
    experience_years INT DEFAULT 0,
    license_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Số chứng chỉ hành nghề',
    consultation_price DECIMAL(10, 2) DEFAULT 0 COMMENT 'Giá khám (VND)',
    education TEXT COMMENT 'Học vấn & Chứng chỉ',
    workplace VARCHAR(255) COMMENT 'Nơi công tác',
    is_approved BOOLEAN DEFAULT FALSE COMMENT 'Admin đã duyệt chưa',
    approval_date TIMESTAMP NULL,
    rating_average DECIMAL(3, 2) DEFAULT 0 COMMENT 'Điểm đánh giá trung bình',
    total_reviews INT DEFAULT 0,
    total_appointments INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialties(id),
    INDEX idx_user_id (user_id),
    INDEX idx_specialty (specialty_id),
    INDEX idx_approved (is_approved),
    INDEX idx_rating (rating_average)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doctor Schedules (Lịch làm việc của bác sĩ)
CREATE TABLE doctor_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INT DEFAULT 30 COMMENT 'Thời lượng mỗi slot (phút)',
    max_patients_per_slot INT DEFAULT 1,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_doctor_day (doctor_id, day_of_week),
    INDEX idx_available (is_available),
    CONSTRAINT check_time CHECK (end_time > start_time),
    CONSTRAINT check_day CHECK (day_of_week BETWEEN 0 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointments (Lịch hẹn)
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL COMMENT 'Format: HH:MM-HH:MM, VD: 08:00-08:30',
    appointment_type ENUM('online', 'offline') DEFAULT 'offline',
    status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
    reason TEXT COMMENT 'Lý do khám',
    symptoms TEXT COMMENT 'Triệu chứng',
    meeting_link VARCHAR(255) COMMENT 'Link Zoom/Google Meet cho online',
    meeting_room_id VARCHAR(100) COMMENT 'ID phòng video call',
    cancellation_reason TEXT,
    cancelled_by INT COMMENT 'User ID người hủy',
    cancelled_at TIMESTAMP NULL,
    confirmed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (cancelled_by) REFERENCES users(id),
    INDEX idx_patient (patient_id),
    INDEX idx_doctor (doctor_id),
    INDEX idx_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_type (appointment_type),
    INDEX idx_doctor_date_time (doctor_id, appointment_date, time_slot),
    UNIQUE KEY unique_doctor_slot (doctor_id, appointment_date, time_slot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medical Records (Hồ sơ bệnh án)
CREATE TABLE medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    diagnosis TEXT NOT NULL COMMENT 'Chẩn đoán',
    prescription JSON COMMENT 'Đơn thuốc - Array of {drug_name, dosage, frequency, duration, notes}',
    vital_signs JSON COMMENT '{blood_pressure, heart_rate, temperature, weight, height}',
    lab_results TEXT COMMENT 'Kết quả xét nghiệm',
    notes TEXT COMMENT 'Ghi chú của bác sĩ',
    attachments JSON COMMENT 'Array of file URLs (X-quang, CT scan...)',
    next_appointment_advice TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    INDEX idx_appointment (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions (Thanh toán)
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    transaction_code VARCHAR(100) UNIQUE NOT NULL COMMENT 'Mã giao dịch',
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'momo', 'vnpay', 'banking', 'credit_card') NOT NULL,
    status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_info JSON COMMENT 'Thông tin chi tiết từ cổng thanh toán',
    paid_at TIMESTAMP NULL,
    refund_reason TEXT,
    refunded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    INDEX idx_appointment (appointment_id),
    INDEX idx_status (status),
    INDEX idx_transaction_code (transaction_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews (Đánh giá)
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    rating TINYINT NOT NULL COMMENT '1-5 stars',
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    response TEXT COMMENT 'Phản hồi từ bác sĩ',
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    INDEX idx_doctor (doctor_id),
    INDEX idx_patient (patient_id),
    INDEX idx_rating (rating),
    CONSTRAINT check_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications (Thông báo)
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('appointment', 'payment', 'system', 'reminder', 'review', 'message') NOT NULL,
    related_id INT COMMENT 'ID liên quan (appointment_id, transaction_id...)',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    action_url VARCHAR(255) COMMENT 'URL để redirect khi click',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_type (type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat Messages (Tin nhắn tư vấn)
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    appointment_id INT COMMENT 'Liên kết với cuộc hẹn nếu có',
    content TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    file_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_conversation (sender_id, receiver_id, created_at),
    INDEX idx_appointment (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Additional Tables for CMS
-- ============================================

-- Posts (Bài viết/Tin tức) - Giữ lại từ cấu trúc cũ
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    thumbnail VARCHAR(255),
    author_id INT NOT NULL,
    category_id INT,
    views INT DEFAULT 0,
    status ENUM('draft', 'published') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories (Danh mục bài viết)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contacts (Liên hệ/Góp ý)
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    reply TEXT,
    replied_by INT,
    replied_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (replied_by) REFERENCES users(id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Add Foreign Key for Posts-Categories
-- ============================================
ALTER TABLE posts ADD FOREIGN KEY (category_id) REFERENCES categories(id);

-- ============================================
-- Create Views for Common Queries
-- ============================================

-- View: Doctor with User Info
CREATE VIEW v_doctors_full AS
SELECT 
    d.id,
    d.user_id,
    u.email,
    u.full_name,
    u.phone,
    u.avatar,
    u.is_active,
    d.specialty_id,
    s.name as specialty_name,
    d.bio,
    d.experience_years,
    d.license_number,
    d.consultation_price,
    d.education,
    d.workplace,
    d.is_approved,
    d.rating_average,
    d.total_reviews,
    d.total_appointments
FROM doctors d
JOIN users u ON d.user_id = u.id
JOIN specialties s ON d.specialty_id = s.id;

-- View: Upcoming Appointments
CREATE VIEW v_upcoming_appointments AS
SELECT 
    a.id,
    a.appointment_date,
    a.time_slot,
    a.appointment_type,
    a.status,
    p.user_id as patient_user_id,
    pu.full_name as patient_name,
    pu.phone as patient_phone,
    d.user_id as doctor_user_id,
    du.full_name as doctor_name,
    s.name as specialty_name,
    a.meeting_link
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users pu ON p.user_id = pu.id
JOIN doctors d ON a.doctor_id = d.id
JOIN users du ON d.user_id = du.id
JOIN specialties s ON d.specialty_id = s.id
WHERE a.appointment_date >= CURDATE()
AND a.status NOT IN ('cancelled', 'completed');
