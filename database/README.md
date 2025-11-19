# Database Design Documentation

## Tổng quan Cấu trúc Database

### Thống kê
- **Tổng số bảng:** 13 bảng chính + 2 bảng CMS
- **Tổng số View:** 2 views
- **Quan hệ:** Sử dụng Foreign Keys với CASCADE để đảm bảo tính toàn vẹn
- **Indexing:** 50+ indexes để tối ưu hiệu suất query

---

## 1. Core Entities

### 1.1 Users (Bảng trừu tượng)
**Mục đích:** Lưu thông tin đăng nhập chung cho tất cả người dùng

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | ID người dùng |
| email | VARCHAR(100) UNIQUE | Email đăng nhập |
| password | VARCHAR(255) | Mật khẩu đã hash (bcrypt) |
| full_name | VARCHAR(100) | Họ và tên |
| phone | VARCHAR(20) | Số điện thoại |
| role | ENUM | admin, doctor, patient |
| avatar | VARCHAR(255) | URL ảnh đại diện |
| is_active | BOOLEAN | Tài khoản có active không |
| is_verified | BOOLEAN | Email đã xác thực chưa |

**Indexes:**
- `idx_email` (email)
- `idx_role` (role)
- `idx_active` (is_active)

---

### 1.2 Patients (Kế thừa Users)
**Mục đích:** Thông tin chi tiết của bệnh nhân

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | ID bệnh nhân |
| user_id | INT UNIQUE FK | Liên kết với Users |
| date_of_birth | DATE | Ngày sinh |
| gender | ENUM | male, female, other |
| address | TEXT | Địa chỉ |
| insurance_number | VARCHAR(50) | Số bảo hiểm y tế |
| blood_type | VARCHAR(5) | Nhóm máu |
| allergies | TEXT | Dị ứng (JSON array) |
| medical_history | TEXT | Tiền sử bệnh án |
| emergency_contact_name | VARCHAR(100) | Tên người liên hệ khẩn cấp |
| emergency_contact_phone | VARCHAR(20) | SĐT người liên hệ khẩn cấp |

**Business Rules:**
- Mỗi user_id chỉ có 1 bản ghi patient (UNIQUE)
- CASCADE DELETE khi xóa user

---

### 1.3 Doctors (Kế thừa Users)
**Mục đích:** Thông tin chi tiết của bác sĩ

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | ID bác sĩ |
| user_id | INT UNIQUE FK | Liên kết với Users |
| specialty_id | INT FK | Chuyên khoa |
| bio | TEXT | Giới thiệu bác sĩ |
| experience_years | INT | Số năm kinh nghiệm |
| license_number | VARCHAR(50) UNIQUE | Số chứng chỉ hành nghề |
| consultation_price | DECIMAL(10,2) | Giá khám (VNĐ) |
| education | TEXT | Học vấn & chứng chỉ |
| workplace | VARCHAR(255) | Nơi công tác |
| is_approved | BOOLEAN | Admin đã duyệt chưa |
| rating_average | DECIMAL(3,2) | Điểm đánh giá TB (0-5) |
| total_reviews | INT | Tổng số đánh giá |
| total_appointments | INT | Tổng số ca khám |

**Indexes:**
- `idx_specialty` (specialty_id) - Tìm bác sĩ theo chuyên khoa
- `idx_approved` (is_approved) - Lọc bác sĩ đã duyệt
- `idx_rating` (rating_average) - Sắp xếp theo đánh giá

**Business Rules:**
- Bác sĩ phải được admin approve (is_approved = TRUE) mới hiển thị
- license_number phải UNIQUE
- rating_average tự động cập nhật khi có review mới

---

### 1.4 Specialties (Chuyên khoa)
**Mục đích:** Danh mục các chuyên khoa

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | ID chuyên khoa |
| name | VARCHAR(100) | Tên chuyên khoa |
| description | TEXT | Mô tả |
| image | VARCHAR(255) | Hình ảnh đại diện |
| slug | VARCHAR(100) UNIQUE | URL-friendly slug |

**Indexes:**
- `idx_slug` (slug) - Tìm kiếm nhanh qua URL

---

### 1.5 Doctor Schedules (Lịch làm việc)
**Mục đích:** Quản lý khung giờ làm việc của bác sĩ

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | ID lịch |
| doctor_id | INT FK | ID bác sĩ |
| day_of_week | TINYINT | 0=CN, 1=T2, ..., 6=T7 |
| start_time | TIME | Giờ bắt đầu |
| end_time | TIME | Giờ kết thúc |
| slot_duration | INT | Thời lượng 1 slot (phút) |
| max_patients_per_slot | INT | Số BN tối đa mỗi slot |
| is_available | BOOLEAN | Có khả dụng không |

**Indexes:**
- `idx_doctor_day` (doctor_id, day_of_week) - Composite index
- `idx_available` (is_available)

**Constraints:**
- `CHECK (end_time > start_time)`
- `CHECK (day_of_week BETWEEN 0 AND 6)`

**Ví dụ:**
```
doctor_id: 1
day_of_week: 1 (Thứ 2)
start_time: 08:00
end_time: 12:00
slot_duration: 30
=> Bác sĩ sẽ có các slot: 08:00-08:30, 08:30-09:00, ..., 11:30-12:00
```

---

### 1.6 Appointments (Lịch hẹn)
**Mục đích:** Quản lý các cuộc hẹn khám bệnh

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | ID lịch hẹn |
| patient_id | INT FK | ID bệnh nhân |
| doctor_id | INT FK | ID bác sĩ |
| appointment_date | DATE | Ngày hẹn |
| time_slot | VARCHAR(20) | Khung giờ (VD: 08:00-08:30) |
| appointment_type | ENUM | online/offline |
| status | ENUM | pending, confirmed, completed, cancelled, no_show |
| reason | TEXT | Lý do khám |
| symptoms | TEXT | Triệu chứng |
| meeting_link | VARCHAR(255) | Link phòng họp (online) |
| meeting_room_id | VARCHAR(100) | ID phòng video call |
| cancellation_reason | TEXT | Lý do hủy |
| cancelled_by | INT FK | User ID người hủy |

**Indexes:**
- `idx_doctor_date_time` (doctor_id, appointment_date, time_slot) - Composite
- `idx_status` (status)
- `idx_type` (appointment_type)

**Unique Constraint:**
```sql
UNIQUE KEY unique_doctor_slot (doctor_id, appointment_date, time_slot)
```
=> Đảm bảo bác sĩ không bị đặt trùng giờ

**Status Flow:**
```
pending → confirmed → completed
        ↘ cancelled
```

---

### 1.7 Medical Records (Hồ sơ bệnh án)
**Mục đích:** Lưu kết quả khám bệnh

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | ID hồ sơ |
| appointment_id | INT UNIQUE FK | Liên kết appointment (1-1) |
| diagnosis | TEXT | Chẩn đoán |
| prescription | JSON | Đơn thuốc |
| vital_signs | JSON | Sinh hiệu |
| lab_results | TEXT | Kết quả xét nghiệm |
| notes | TEXT | Ghi chú bác sĩ |
| attachments | JSON | Files đính kèm |

**JSON Structure Examples:**

```json
// prescription
[
  {
    "drug_name": "Paracetamol 500mg",
    "dosage": "1 viên",
    "frequency": "3 lần/ngày",
    "duration": "5 ngày",
    "notes": "Uống sau ăn"
  }
]

// vital_signs
{
  "blood_pressure": "120/80",
  "heart_rate": 75,
  "temperature": 36.5,
  "weight": 65,
  "height": 170
}

// attachments
[
  {
    "type": "xray",
    "url": "/uploads/xray-123.jpg",
    "uploaded_at": "2025-11-19T10:30:00Z"
  }
]
```

---

### 1.8 Transactions (Thanh toán)
**Mục đích:** Quản lý giao dịch thanh toán

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | ID giao dịch |
| appointment_id | INT FK | ID lịch hẹn |
| transaction_code | VARCHAR(100) UNIQUE | Mã GD |
| amount | DECIMAL(10,2) | Số tiền |
| payment_method | ENUM | cash, momo, vnpay, banking, credit_card |
| status | ENUM | pending, paid, failed, refunded |
| payment_info | JSON | Thông tin từ cổng thanh toán |
| paid_at | TIMESTAMP | Thời gian thanh toán |

**Indexes:**
- `idx_transaction_code` (transaction_code)
- `idx_status` (status)

**Payment Flow:**
```
pending → paid
        ↘ failed
paid → refunded (nếu hủy lịch)
```

---

### 1.9 Reviews (Đánh giá)
**Mục đích:** Bệnh nhân đánh giá bác sĩ

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | ID đánh giá |
| appointment_id | INT UNIQUE FK | Liên kết appointment (1-1) |
| patient_id | INT FK | ID bệnh nhân |
| doctor_id | INT FK | ID bác sĩ |
| rating | TINYINT | Điểm 1-5 |
| comment | TEXT | Nhận xét |
| is_anonymous | BOOLEAN | Ẩn danh hay không |
| response | TEXT | Phản hồi từ bác sĩ |

**Constraint:**
```sql
CHECK (rating BETWEEN 1 AND 5)
```

**Business Rules:**
- Chỉ đánh giá được sau khi appointment `status = completed`
- Mỗi appointment chỉ đánh giá 1 lần (UNIQUE)
- Khi có review mới, trigger cập nhật `doctors.rating_average`

---

### 1.10 Notifications (Thông báo)
**Mục đích:** Hệ thống thông báo real-time

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | ID thông báo |
| user_id | INT FK | Người nhận |
| title | VARCHAR(255) | Tiêu đề |
| message | TEXT | Nội dung |
| type | ENUM | appointment, payment, system, reminder, review, message |
| related_id | INT | ID liên quan |
| is_read | BOOLEAN | Đã đọc chưa |
| action_url | VARCHAR(255) | URL redirect |

**Indexes:**
- `idx_user_read` (user_id, is_read) - Composite
- `idx_created` (created_at)

**Use Cases:**
- Thông báo lịch hẹn được xác nhận
- Nhắc nhở trước giờ khám 1 tiếng
- Thông báo thanh toán thành công
- Có tin nhắn mới

---

### 1.11 Chat Messages (Tin nhắn)
**Mục đích:** Tư vấn trực tiếp qua chat

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | ID tin nhắn |
| sender_id | INT FK | Người gửi |
| receiver_id | INT FK | Người nhận |
| appointment_id | INT FK | Liên kết cuộc hẹn |
| content | TEXT | Nội dung |
| message_type | ENUM | text, image, file, system |
| file_url | VARCHAR(255) | URL file đính kèm |
| is_read | BOOLEAN | Đã đọc chưa |

**Indexes:**
- `idx_conversation` (sender_id, receiver_id, created_at) - Composite
- `idx_appointment` (appointment_id)

**Query Optimization:**
```sql
-- Lấy lịch sử chat giữa 2 người
SELECT * FROM chat_messages
WHERE (sender_id = 1 AND receiver_id = 2) 
   OR (sender_id = 2 AND receiver_id = 1)
ORDER BY created_at DESC
LIMIT 50;
```

---

## 2. Views (Materialized Queries)

### 2.1 v_doctors_full
**Mục đích:** JOIN thông tin bác sĩ + user + chuyên khoa

```sql
SELECT 
    d.id,
    u.full_name,
    u.email,
    s.name as specialty_name,
    d.consultation_price,
    d.rating_average,
    d.is_approved
FROM doctors d
JOIN users u ON d.user_id = u.id
JOIN specialties s ON d.specialty_id = s.id;
```

### 2.2 v_upcoming_appointments
**Mục đích:** Lấy danh sách lịch hẹn sắp tới

```sql
SELECT 
    a.appointment_date,
    a.time_slot,
    pu.full_name as patient_name,
    du.full_name as doctor_name,
    a.status
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users pu ON p.user_id = pu.id
JOIN doctors d ON a.doctor_id = d.id
JOIN users du ON d.user_id = du.id
WHERE a.appointment_date >= CURDATE()
AND a.status NOT IN ('cancelled', 'completed');
```

---

## 3. Indexing Strategy

### 3.1 Primary Indexes
- Tất cả bảng có PRIMARY KEY trên `id`
- AUTO_INCREMENT để tự động tăng

### 3.2 Foreign Key Indexes
- Tất cả FK đều có index riêng
- Tối ưu cho JOIN queries

### 3.3 Composite Indexes
```sql
-- Tìm lịch trống của bác sĩ
idx_doctor_date_time (doctor_id, appointment_date, time_slot)

-- Lấy lịch làm việc
idx_doctor_day (doctor_id, day_of_week)

-- Đếm thông báo chưa đọc
idx_user_read (user_id, is_read)
```

### 3.4 Search Indexes
```sql
-- Tìm bác sĩ
idx_specialty (specialty_id)
idx_rating (rating_average)
idx_approved (is_approved)

-- Tìm lịch hẹn
idx_status (status)
idx_date (appointment_date)
```

---

## 4. Data Integrity Rules

### 4.1 Cascade Rules
```sql
ON DELETE CASCADE:
- users → patients
- users → doctors
- doctors → doctor_schedules
- appointments → medical_records

ON DELETE RESTRICT:
- specialties (không xóa được nếu có bác sĩ)
```

### 4.2 Constraints
```sql
-- Không cho phép đặt trùng giờ
UNIQUE (doctor_id, appointment_date, time_slot)

-- Giờ kết thúc phải sau giờ bắt đầu
CHECK (end_time > start_time)

-- Rating từ 1-5
CHECK (rating BETWEEN 1 AND 5)
```

---

## 5. Performance Considerations

### 5.1 Query Optimization
- Sử dụng Views cho queries phức tạp
- Composite indexes cho điều kiện WHERE nhiều cột
- LIMIT pagination để tránh load toàn bộ data

### 5.2 Data Types
- ENUM cho các trường có giá trị cố định
- JSON cho dữ liệu linh hoạt (prescription, vital_signs)
- DECIMAL cho tiền tệ (tránh float precision issues)

### 5.3 Scalability
- Có thể partition bảng `appointments` theo năm
- Archive bảng `chat_messages` sau 6 tháng
- Soft delete cho `users` (thêm `deleted_at`)

---

## 6. Security Considerations

### 6.1 Sensitive Data
- Password: Luôn hash với bcrypt (cost factor ≥ 10)
- Email: Validate format trước khi insert
- Phone: Normalize format (+84...)

### 6.2 Data Access
- Bệnh nhân chỉ xem được medical_records của mình
- Bác sĩ chỉ xem được appointments được assign
- Admin có full access

### 6.3 Audit Trail
- Tất cả bảng có `created_at`, `updated_at`
- Lưu `cancelled_by` khi hủy lịch
- Log transactions trong bảng riêng (nếu cần)

---

## 7. Migration Strategy

### 7.1 Initial Setup
```bash
# Tạo database
mysql -u root -p < database/schema.sql

# Seed dữ liệu mẫu
mysql -u root -p < database/seed.sql
```

### 7.2 Version Control
- Mỗi thay đổi schema tạo file migration mới
- Format: `YYYYMMDD_HHmmss_description.sql`
- Ví dụ: `20251119_153000_add_meeting_room_id.sql`

---

## 8. Backup Strategy

### 8.1 Daily Backup
```bash
mysqldump -u root -p hospital_booking > backup_$(date +%Y%m%d).sql
```

### 8.2 Important Tables Priority
1. users, patients, doctors (Thông tin người dùng)
2. appointments, medical_records (Dữ liệu y tế)
3. transactions (Tài chính)
4. chat_messages (Có thể archive)

---

## Kết luận

Database được thiết kế với các đặc điểm:
✅ **Chuẩn hóa:** 3NF để tránh redundancy
✅ **Hiệu suất:** Indexes tối ưu cho queries phổ biến
✅ **Bảo mật:** Constraints và validation
✅ **Mở rộng:** Dễ thêm features mới
✅ **Audit:** Đầy đủ timestamps và tracking

**Tổng dung lượng ước tính:** 
- 10,000 users: ~50MB
- 100,000 appointments: ~200MB
- 1,000,000 chat messages: ~500MB
