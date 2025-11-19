-- ============================================
-- Sample Data Seeding Script
-- Healthcare Consultation & Booking System
-- ============================================

-- Insert Specialties
INSERT INTO specialties (name, description, slug, image) VALUES
('Tim mạch', 'Chuyên khoa tim mạch, điều trị các bệnh về tim và mạch máu', 'tim-mach', '/images/specialties/cardiology.jpg'),
('Nội tiết', 'Chuyên khoa nội tiết, điều trị tiểu đường, tuyến giáp', 'noi-tiet', '/images/specialties/endocrinology.jpg'),
('Da liễu', 'Chuyên khoa da liễu, điều trị các bệnh về da', 'da-lieu', '/images/specialties/dermatology.jpg'),
('Tai Mũi Họng', 'Chuyên khoa tai mũi họng', 'tai-mui-hong', '/images/specialties/ent.jpg'),
('Nhi khoa', 'Chuyên khoa nhi, chăm sóc sức khỏe trẻ em', 'nhi-khoa', '/images/specialties/pediatrics.jpg'),
('Sản phụ khoa', 'Chuyên khoa sản phụ khoa, chăm sóc sức khỏe phụ nữ', 'san-phu-khoa', '/images/specialties/obstetrics.jpg'),
('Thần kinh', 'Chuyên khoa thần kinh, điều trị các bệnh về thần kinh', 'than-kinh', '/images/specialties/neurology.jpg'),
('Tiêu hóa', 'Chuyên khoa tiêu hóa, điều trị các bệnh về dạ dày ruột', 'tieu-hoa', '/images/specialties/gastroenterology.jpg');

-- Insert Admin User
INSERT INTO users (email, password, full_name, phone, role, is_active, is_verified) VALUES
('admin@healthcare.com', '$2b$10$YourHashedPasswordHere', 'Admin System', '0901234567', 'admin', TRUE, TRUE);

-- Insert Sample Patients
INSERT INTO users (email, password, full_name, phone, role, avatar) VALUES
('patient1@gmail.com', '$2b$10$YourHashedPasswordHere', 'Nguyễn Văn A', '0912345678', 'patient', NULL),
('patient2@gmail.com', '$2b$10$YourHashedPasswordHere', 'Trần Thị B', '0923456789', 'patient', NULL),
('patient3@gmail.com', '$2b$10$YourHashedPasswordHere', 'Lê Văn C', '0934567890', 'patient', NULL);

INSERT INTO patients (user_id, date_of_birth, gender, address, insurance_number, blood_type) VALUES
(2, '1990-05-15', 'male', '123 Nguyễn Huệ, Q1, TP.HCM', 'BH123456789', 'O+'),
(3, '1985-08-20', 'female', '456 Lê Lợi, Q1, TP.HCM', 'BH987654321', 'A+'),
(4, '1995-12-10', 'male', '789 Trần Hưng Đạo, Q5, TP.HCM', 'BH456789123', 'B+');

-- Insert Sample Doctors
INSERT INTO users (email, password, full_name, phone, role, avatar, is_verified) VALUES
('bs.nguyen@healthcare.com', '$2b$10$YourHashedPasswordHere', 'BS. Nguyễn Thanh Tâm', '0945678901', 'doctor', '/images/doctors/doctor1.jpg', TRUE),
('bs.tran@healthcare.com', '$2b$10$YourHashedPasswordHere', 'BS. Trần Minh Đức', '0956789012', 'doctor', '/images/doctors/doctor2.jpg', TRUE),
('bs.le@healthcare.com', '$2b$10$YourHashedPasswordHere', 'BS. Lê Thị Hương', '0967890123', 'doctor', '/images/doctors/doctor3.jpg', TRUE),
('bs.pham@healthcare.com', '$2b$10$YourHashedPasswordHere', 'ThS.BS Phạm Văn Long', '0978901234', 'doctor', '/images/doctors/doctor4.jpg', TRUE),
('bs.hoang@healthcare.com', '$2b$10$YourHashedPasswordHere', 'PGS.TS Hoàng Thị Mai', '0989012345', 'doctor', '/images/doctors/doctor5.jpg', TRUE);

INSERT INTO doctors (user_id, specialty_id, bio, experience_years, license_number, consultation_price, education, workplace, is_approved, rating_average, total_reviews) VALUES
(5, 1, 'Bác sĩ chuyên khoa Tim mạch với 15 năm kinh nghiệm. Từng công tác tại Viện Tim Mạch Quốc gia.', 15, 'BS-001-2010', 300000, 'Bác sĩ Đa khoa - ĐH Y Hà Nội\nChuyên khoa cấp II Tim mạch', 'Bệnh viện Đại học Y Dược TP.HCM', TRUE, 4.8, 125),
(6, 2, 'Chuyên gia điều trị tiểu đường và các bệnh lý nội tiết. Tư vấn dinh dưỡng cho người bệnh tiểu đường.', 10, 'BS-002-2013', 250000, 'Bác sĩ - ĐH Y TP.HCM\nThạc sĩ Nội tiết', 'Bệnh viện Nội tiết TP.HCM', TRUE, 4.9, 98),
(7, 3, 'Bác sĩ Da liễu, chuyên điều trị mụn, nám, sẹo và các bệnh da liễu thẩm mỹ.', 8, 'BS-003-2015', 200000, 'Bác sĩ - ĐH Y Dược Huế\nChuyên khoa Da liễu', 'Phòng khám Da liễu Đông y', TRUE, 4.7, 87),
(8, 7, 'Thạc sĩ Bác sĩ chuyên khoa Thần kinh. Điều trị đau đầu, mất ngủ, rối loạn lo âu.', 12, 'BS-004-2011', 350000, 'Bác sĩ - ĐH Y Hà Nội\nThạc sĩ Thần kinh học', 'Bệnh viện 115 TP.HCM', TRUE, 4.6, 76),
(9, 5, 'Phó Giáo sư, Tiến sĩ chuyên khoa Nhi. Tư vấn dinh dưỡng và phát triển cho trẻ.', 20, 'BS-005-2005', 400000, 'Tiến sĩ Y học - ĐH Y Hà Nội\nPhó Giáo sư Nhi khoa', 'Bệnh viện Nhi Đồng 1', TRUE, 5.0, 142);

-- Insert Doctor Schedules
-- BS. Nguyễn Thanh Tâm (Doctor ID: 1) - Thứ 2, 4, 6
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available) VALUES
(1, 1, '08:00:00', '12:00:00', 30, TRUE), -- Monday morning
(1, 1, '14:00:00', '17:00:00', 30, TRUE), -- Monday afternoon
(1, 3, '08:00:00', '12:00:00', 30, TRUE), -- Wednesday
(1, 5, '08:00:00', '12:00:00', 30, TRUE); -- Friday

-- BS. Trần Minh Đức (Doctor ID: 2) - Thứ 3, 5, 7
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available) VALUES
(2, 2, '08:00:00', '12:00:00', 30, TRUE), -- Tuesday
(2, 2, '14:00:00', '17:30:00', 30, TRUE),
(2, 4, '08:00:00', '12:00:00', 30, TRUE), -- Thursday
(2, 6, '08:00:00', '11:30:00', 30, TRUE); -- Saturday

-- BS. Lê Thị Hương (Doctor ID: 3) - Thứ 2, 3, 4, 5
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available) VALUES
(3, 1, '09:00:00', '12:00:00', 30, TRUE),
(3, 2, '09:00:00', '12:00:00', 30, TRUE),
(3, 3, '14:00:00', '18:00:00', 30, TRUE),
(3, 4, '14:00:00', '18:00:00', 30, TRUE);

-- ThS.BS Phạm Văn Long (Doctor ID: 4) - Thứ 2-6
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available) VALUES
(4, 1, '08:00:00', '11:30:00', 30, TRUE),
(4, 2, '08:00:00', '11:30:00', 30, TRUE),
(4, 3, '08:00:00', '11:30:00', 30, TRUE),
(4, 4, '08:00:00', '11:30:00', 30, TRUE),
(4, 5, '08:00:00', '11:30:00', 30, TRUE);

-- PGS.TS Hoàng Thị Mai (Doctor ID: 5) - Thứ 3, 5
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available) VALUES
(5, 2, '14:00:00', '17:00:00', 30, TRUE),
(5, 4, '14:00:00', '17:00:00', 30, TRUE);

-- Insert Sample Appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, appointment_type, status, reason, confirmed_at) VALUES
(1, 1, '2025-11-25', '08:00-08:30', 'offline', 'confirmed', 'Khám tim định kỳ', NOW()),
(2, 2, '2025-11-26', '09:00-09:30', 'online', 'confirmed', 'Tư vấn điều trị tiểu đường', NOW()),
(3, 3, '2025-11-27', '14:00-14:30', 'offline', 'pending', 'Điều trị mụn', NULL);

-- Insert Sample Transactions
INSERT INTO transactions (appointment_id, transaction_code, amount, payment_method, status, paid_at) VALUES
(1, 'TXN-20251119-001', 300000, 'vnpay', 'paid', NOW()),
(2, 'TXN-20251119-002', 250000, 'momo', 'paid', NOW()),
(3, 'TXN-20251119-003', 200000, 'vnpay', 'pending', NULL);

-- Insert Sample Reviews
INSERT INTO reviews (appointment_id, patient_id, doctor_id, rating, comment) VALUES
(1, 1, 1, 5, 'Bác sĩ tận tình, khám rất kỹ. Phòng khám sạch sẽ.'),
(2, 2, 2, 5, 'Bác sĩ tư vấn rất chi tiết về chế độ ăn uống. Rất hài lòng!');

-- Insert Sample Notifications
INSERT INTO notifications (user_id, title, message, type, related_id) VALUES
(2, 'Lịch hẹn được xác nhận', 'Lịch hẹn của bạn với BS. Nguyễn Thanh Tâm vào ngày 25/11/2025 đã được xác nhận.', 'appointment', 1),
(3, 'Thanh toán thành công', 'Bạn đã thanh toán thành công 250,000 VNĐ cho lịch hẹn ngày 26/11/2025.', 'payment', 2),
(4, 'Chờ xác nhận', 'Lịch hẹn của bạn đang chờ bác sĩ xác nhận. Chúng tôi sẽ thông báo khi có cập nhật.', 'appointment', 3);

-- Insert Categories for Posts
INSERT INTO categories (name, slug, description) VALUES
('Tin tức y tế', 'tin-tuc-y-te', 'Các tin tức mới nhất về y tế'),
('Sức khỏe', 'suc-khoe', 'Thông tin về sức khỏe và chăm sóc bản thân'),
('Dinh dưỡng', 'dinh-duong', 'Kiến thức về dinh dưỡng và ăn uống lành mạnh'),
('Phòng bệnh', 'phong-benh', 'Hướng dẫn phòng ngừa các bệnh phổ biến');

-- Insert Sample Posts
INSERT INTO posts (title, slug, content, excerpt, thumbnail, author_id, category_id, status, published_at, views) VALUES
('10 cách phòng ngừa bệnh tim mạch hiệu quả', '10-cach-phong-ngua-benh-tim-mach', 
'<p>Bệnh tim mạch là một trong những nguyên nhân gây tử vong hàng đầu...</p>', 
'Tìm hiểu 10 cách đơn giản giúp phòng ngừa bệnh tim mạch hiệu quả',
'/images/posts/heart-health.jpg', 1, 4, 'published', NOW(), 1250),

('Chế độ ăn uống cho người bệnh tiểu đường', 'che-do-an-uong-tieu-duong',
'<p>Người bệnh tiểu đường cần có chế độ dinh dưỡng phù hợp...</p>',
'Hướng dẫn chi tiết về chế độ ăn uống khoa học cho người bệnh tiểu đường',
'/images/posts/diabetes-diet.jpg', 1, 3, 'published', NOW(), 980),

('Cách chăm sóc da mùa nắng nóng', 'cham-soc-da-mua-nang',
'<p>Mùa nắng nóng da dễ bị tổn thương, cần có cách chăm sóc đúng...</p>',
'Bí quyết giữ làn da khỏe đẹp trong những ngày nắng nóng',
'/images/posts/skincare-summer.jpg', 1, 2, 'published', NOW(), 750);
