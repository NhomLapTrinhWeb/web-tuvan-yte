# API Documentation - Healthcare Consultation & Booking System

**Base URL:** `http://localhost:3000/api/v1`

**Authentication:** JWT Bearer Token (trừ Public APIs)

**Response Format:**
```json
{
  "success": true,
  "message": "Success message",
  "data": { },
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

---

## 1. Authentication & Authorization APIs

### 1.1 Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "full_name": "Nguyen Van A",
  "phone": "0912345678",
  "role": "patient", // patient | doctor
  
  // For patients
  "date_of_birth": "1990-05-15",
  "gender": "male",
  "address": "123 Street, HCM",
  
  // For doctors
  "specialty_id": 1,
  "license_number": "BS-001-2020",
  "experience_years": 5,
  "consultation_price": 250000,
  "bio": "Experienced doctor..."
}

Response 201:
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "Nguyen Van A",
      "role": "patient"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123!"
}

Response 200:
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "Nguyen Van A",
      "role": "patient",
      "avatar": "/uploads/avatar.jpg"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

### 1.3 Refresh Token
```http
POST /api/v1/auth/refresh
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "token": "new_token_here",
    "expires_in": 86400
  }
}
```

### 1.4 Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 1.5 Verify Email
```http
GET /api/v1/auth/verify-email?token={verification_token}

Response 200:
{
  "success": true,
  "message": "Email verified successfully"
}
```

### 1.6 Forgot Password
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

### 1.7 Reset Password
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}

Response 200:
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 2. User Profile APIs

### 2.1 Get Current User Profile
```http
GET /api/v1/users/me
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Nguyen Van A",
    "phone": "0912345678",
    "role": "patient",
    "avatar": "/uploads/avatar.jpg",
    "is_verified": true,
    "patient_info": {
      "date_of_birth": "1990-05-15",
      "gender": "male",
      "address": "123 Street",
      "blood_type": "O+",
      "insurance_number": "BH123456789"
    }
  }
}
```

### 2.2 Update Profile
```http
PUT /api/v1/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "full_name": "Nguyen Van A Updated",
  "phone": "0987654321",
  "address": "New Address"
}

Response 200:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user */ }
}
```

### 2.3 Upload Avatar
```http
POST /api/v1/users/me/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

avatar: [file]

Response 200:
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar_url": "/uploads/avatars/user-1-1637312345.jpg"
  }
}
```

### 2.4 Change Password
```http
POST /api/v1/users/me/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!",
  "new_password_confirmation": "NewPass123!"
}

Response 200:
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 3. Specialties APIs (Public)

### 3.1 Get All Specialties
```http
GET /api/v1/specialties

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tim mạch",
      "slug": "tim-mach",
      "description": "Chuyên khoa tim mạch...",
      "image": "/images/specialties/cardiology.jpg",
      "doctor_count": 15
    }
  ]
}
```

### 3.2 Get Specialty by ID/Slug
```http
GET /api/v1/specialties/{id_or_slug}

Response 200:
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tim mạch",
    "slug": "tim-mach",
    "description": "Chuyên khoa tim mạch...",
    "doctors": [
      {
        "id": 1,
        "full_name": "BS. Nguyen Van A",
        "rating_average": 4.8,
        "consultation_price": 300000
      }
    ]
  }
}
```

---

## 4. Doctors APIs

### 4.1 Search & Filter Doctors (Public)
```http
GET /api/v1/doctors?search={keyword}&specialty_id={id}&min_price={amount}&max_price={amount}&sort_by={field}&order={asc|desc}&page={n}&limit={n}

Query Parameters:
- search: Tìm theo tên bác sĩ
- specialty_id: Lọc theo chuyên khoa
- min_price, max_price: Lọc theo giá
- sort_by: price | rating | experience (default: rating)
- order: asc | desc (default: desc)
- page: Trang hiện tại (default: 1)
- limit: Số item per page (default: 20)

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "full_name": "BS. Nguyen Thanh Tam",
      "avatar": "/images/doctors/doctor1.jpg",
      "specialty": {
        "id": 1,
        "name": "Tim mạch"
      },
      "experience_years": 15,
      "consultation_price": 300000,
      "rating_average": 4.8,
      "total_reviews": 125,
      "bio": "Bác sĩ chuyên khoa Tim mạch...",
      "is_available_today": true
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### 4.2 Get Doctor Detail (Public)
```http
GET /api/v1/doctors/{id}

Response 200:
{
  "success": true,
  "data": {
    "id": 1,
    "full_name": "BS. Nguyen Thanh Tam",
    "email": "bs.nguyen@healthcare.com",
    "phone": "0945678901",
    "avatar": "/images/doctors/doctor1.jpg",
    "specialty": {
      "id": 1,
      "name": "Tim mạch"
    },
    "bio": "Bác sĩ chuyên khoa...",
    "experience_years": 15,
    "education": "Bác sĩ Đa khoa - ĐH Y Hà Nội...",
    "workplace": "Bệnh viện Đại học Y Dược TP.HCM",
    "license_number": "BS-001-2010",
    "consultation_price": 300000,
    "rating_average": 4.8,
    "total_reviews": 125,
    "total_appointments": 1250,
    "reviews": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Bác sĩ tận tình...",
        "patient_name": "Nguyen V***", // masked if anonymous
        "created_at": "2025-11-15T10:30:00Z"
      }
    ]
  }
}
```

### 4.3 Get Doctor Availability (Public)
```http
GET /api/v1/doctors/{id}/availability?date={YYYY-MM-DD}

Response 200:
{
  "success": true,
  "data": {
    "date": "2025-11-25",
    "day_of_week": 1, // Monday
    "doctor_id": 1,
    "schedules": [
      {
        "time_range": "08:00-12:00",
        "slots": [
          {
            "time_slot": "08:00-08:30",
            "is_available": true
          },
          {
            "time_slot": "08:30-09:00",
            "is_available": false,
            "appointment_id": 123
          },
          {
            "time_slot": "09:00-09:30",
            "is_available": true
          }
        ]
      },
      {
        "time_range": "14:00-17:00",
        "slots": [...]
      }
    ]
  }
}
```

### 4.4 Get Doctor Schedule (For Doctor Role)
```http
GET /api/v1/doctors/me/schedules
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "day_of_week": 1,
      "day_name": "Thứ 2",
      "start_time": "08:00",
      "end_time": "12:00",
      "slot_duration": 30,
      "is_available": true
    }
  ]
}
```

### 4.5 Update Doctor Schedule (For Doctor Role)
```http
POST /api/v1/doctors/me/schedules
Authorization: Bearer {token}
Content-Type: application/json

{
  "schedules": [
    {
      "day_of_week": 1,
      "start_time": "08:00",
      "end_time": "12:00",
      "slot_duration": 30,
      "is_available": true
    }
  ]
}

Response 200:
{
  "success": true,
  "message": "Schedules updated successfully"
}
```

### 4.6 Get Doctor Statistics (For Doctor Role)
```http
GET /api/v1/doctors/me/statistics?start_date={date}&end_date={date}

Response 200:
{
  "success": true,
  "data": {
    "total_appointments": 156,
    "completed_appointments": 142,
    "cancelled_appointments": 14,
    "total_revenue": 45000000,
    "average_rating": 4.8,
    "new_reviews": 8,
    "upcoming_appointments": 12
  }
}
```

---

## 5. Appointments APIs (Booking System)

### 5.1 Create Appointment (For Patient)
```http
POST /api/v1/appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "doctor_id": 1,
  "appointment_date": "2025-11-25",
  "time_slot": "08:00-08:30",
  "appointment_type": "online", // online | offline
  "reason": "Khám sức khỏe định kỳ",
  "symptoms": "Đau đầu, chóng mặt"
}

Response 201:
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "appointment": {
      "id": 123,
      "appointment_date": "2025-11-25",
      "time_slot": "08:00-08:30",
      "status": "pending",
      "doctor": {
        "id": 1,
        "full_name": "BS. Nguyen Thanh Tam"
      }
    },
    "payment": {
      "transaction_id": 456,
      "amount": 300000,
      "payment_url": "https://payment.vnpay.vn/...", // For online payment
      "qr_code": "data:image/png;base64,..." // For QR payment
    }
  }
}
```

### 5.2 Get My Appointments (For Patient)
```http
GET /api/v1/appointments/my?status={status}&page={n}&limit={n}
Authorization: Bearer {token}

Query Parameters:
- status: pending | confirmed | completed | cancelled | all
- page, limit: Pagination

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "appointment_date": "2025-11-25",
      "time_slot": "08:00-08:30",
      "appointment_type": "online",
      "status": "confirmed",
      "doctor": {
        "id": 1,
        "full_name": "BS. Nguyen Thanh Tam",
        "avatar": "/images/doctors/doctor1.jpg",
        "specialty": "Tim mạch"
      },
      "reason": "Khám sức khỏe định kỳ",
      "payment_status": "paid",
      "can_cancel": true, // Can cancel if > 24h before appointment
      "can_review": false,
      "meeting_link": "https://meet.healthcare.com/room123"
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

### 5.3 Get Appointment Detail
```http
GET /api/v1/appointments/{id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "id": 123,
    "appointment_date": "2025-11-25",
    "time_slot": "08:00-08:30",
    "appointment_type": "online",
    "status": "completed",
    "doctor": { /* doctor info */ },
    "patient": { /* patient info - only for doctor */ },
    "reason": "Khám sức khỏe định kỳ",
    "symptoms": "Đau đầu, chóng mặt",
    "medical_record": {
      "id": 1,
      "diagnosis": "Tăng huyết áp nhẹ",
      "prescription": [
        {
          "drug_name": "Amlodipine 5mg",
          "dosage": "1 viên",
          "frequency": "1 lần/ngày",
          "duration": "30 ngày"
        }
      ],
      "notes": "Tái khám sau 1 tháng"
    },
    "transaction": {
      "amount": 300000,
      "payment_method": "vnpay",
      "status": "paid",
      "paid_at": "2025-11-20T10:30:00Z"
    }
  }
}
```

### 5.4 Cancel Appointment
```http
POST /api/v1/appointments/{id}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "cancellation_reason": "Bận việc đột xuất"
}

Response 200:
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "refund_status": "processing", // If paid
    "refund_amount": 300000
  }
}
```

### 5.5 Confirm Appointment (For Doctor)
```http
POST /api/v1/appointments/{id}/confirm
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Appointment confirmed",
  "data": {
    "meeting_link": "https://meet.healthcare.com/room123"
  }
}
```

### 5.6 Reject Appointment (For Doctor)
```http
POST /api/v1/appointments/{id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Lịch trình không phù hợp"
}

Response 200:
{
  "success": true,
  "message": "Appointment rejected"
}
```

### 5.7 Complete Appointment (For Doctor)
```http
POST /api/v1/appointments/{id}/complete
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Appointment marked as completed"
}
```

### 5.8 Get Doctor Appointments (For Doctor)
```http
GET /api/v1/appointments/doctor/my?date={date}&status={status}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "appointment_date": "2025-11-25",
      "time_slot": "08:00-08:30",
      "status": "confirmed",
      "patient": {
        "id": 1,
        "full_name": "Nguyen Van A",
        "phone": "0912345678",
        "age": 35,
        "gender": "male"
      },
      "reason": "Khám sức khỏe định kỳ",
      "symptoms": "Đau đầu, chóng mặt"
    }
  ]
}
```

---

## 6. Medical Records APIs

### 6.1 Create Medical Record (For Doctor)
```http
POST /api/v1/medical-records
Authorization: Bearer {token}
Content-Type: application/json

{
  "appointment_id": 123,
  "diagnosis": "Tăng huyết áp nhẹ",
  "prescription": [
    {
      "drug_name": "Amlodipine 5mg",
      "dosage": "1 viên",
      "frequency": "1 lần/ngày",
      "duration": "30 ngày",
      "notes": "Uống sau bữa sáng"
    }
  ],
  "vital_signs": {
    "blood_pressure": "140/90",
    "heart_rate": 78,
    "temperature": 36.5,
    "weight": 70,
    "height": 170
  },
  "lab_results": "Xét nghiệm máu: Bình thường",
  "notes": "Tái khám sau 1 tháng. Kiểm soát chế độ ăn mặn.",
  "next_appointment_advice": "Tái khám sau 1 tháng"
}

Response 201:
{
  "success": true,
  "message": "Medical record created successfully",
  "data": { /* medical record */ }
}
```

### 6.2 Update Medical Record (For Doctor)
```http
PUT /api/v1/medical-records/{id}
Authorization: Bearer {token}
Content-Type: application/json

Response 200:
{
  "success": true,
  "message": "Medical record updated successfully"
}
```

### 6.3 Get My Medical Records (For Patient)
```http
GET /api/v1/medical-records/my?page={n}&limit={n}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "appointment": {
        "date": "2025-11-15",
        "doctor_name": "BS. Nguyen Thanh Tam"
      },
      "diagnosis": "Tăng huyết áp nhẹ",
      "created_at": "2025-11-15T11:00:00Z"
    }
  ]
}
```

### 6.4 Get Medical Record Detail
```http
GET /api/v1/medical-records/{id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": { /* full medical record with prescription, vital signs, etc. */ }
}
```

### 6.5 Download Medical Record PDF
```http
GET /api/v1/medical-records/{id}/download
Authorization: Bearer {token}

Response: application/pdf
```

### 6.6 Upload Attachments (For Doctor)
```http
POST /api/v1/medical-records/{id}/attachments
Authorization: Bearer {token}
Content-Type: multipart/form-data

files: [file1, file2, ...]

Response 200:
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "attachments": [
      {
        "type": "xray",
        "url": "/uploads/medical/xray-123.jpg",
        "uploaded_at": "2025-11-19T10:30:00Z"
      }
    ]
  }
}
```

---

## 7. Payments APIs

### 7.1 Create Payment
```http
POST /api/v1/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "appointment_id": 123,
  "payment_method": "vnpay", // vnpay | momo | banking
  "return_url": "https://healthcare.com/appointments/123"
}

Response 200:
{
  "success": true,
  "data": {
    "transaction_id": 456,
    "payment_url": "https://payment.vnpay.vn/...",
    "qr_code": "data:image/png;base64,..."
  }
}
```

### 7.2 Payment Callback (Webhook)
```http
POST /api/v1/payments/callback/vnpay
Content-Type: application/json

{
  "vnp_TxnRef": "TXN-123",
  "vnp_ResponseCode": "00",
  "vnp_Amount": 30000000, // Amount * 100
  // ... other VNPAY params
}

Response 200:
{
  "RspCode": "00",
  "Message": "success"
}
```

### 7.3 Check Payment Status
```http
GET /api/v1/payments/{transaction_id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "transaction_id": 456,
    "appointment_id": 123,
    "amount": 300000,
    "status": "paid",
    "payment_method": "vnpay",
    "paid_at": "2025-11-19T10:30:00Z"
  }
}
```

### 7.4 Request Refund
```http
POST /api/v1/payments/{transaction_id}/refund
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Hủy lịch hẹn"
}

Response 200:
{
  "success": true,
  "message": "Refund request submitted",
  "data": {
    "refund_status": "processing",
    "refund_amount": 300000,
    "estimated_days": "3-5 ngày làm việc"
  }
}
```

---

## 8. Reviews APIs

### 8.1 Create Review (For Patient)
```http
POST /api/v1/reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "appointment_id": 123,
  "rating": 5,
  "comment": "Bác sĩ tận tình, khám rất kỹ",
  "is_anonymous": false
}

Response 201:
{
  "success": true,
  "message": "Review submitted successfully",
  "data": { /* review */ }
}
```

### 8.2 Update Review
```http
PUT /api/v1/reviews/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated comment"
}

Response 200:
{
  "success": true,
  "message": "Review updated successfully"
}
```

### 8.3 Delete Review
```http
DELETE /api/v1/reviews/{id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Review deleted successfully"
}
```

### 8.4 Doctor Response to Review (For Doctor)
```http
POST /api/v1/reviews/{id}/response
Authorization: Bearer {token}
Content-Type: application/json

{
  "response": "Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ!"
}

Response 200:
{
  "success": true,
  "message": "Response submitted successfully"
}
```

### 8.5 Get Doctor Reviews (Public)
```http
GET /api/v1/doctors/{id}/reviews?page={n}&limit={n}&rating={1-5}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Bác sĩ tận tình...",
      "patient_name": "Nguyen V***",
      "is_anonymous": false,
      "response": "Cảm ơn bạn...",
      "created_at": "2025-11-15T10:30:00Z"
    }
  ],
  "metadata": {
    "average_rating": 4.8,
    "total_reviews": 125,
    "rating_distribution": {
      "5": 95,
      "4": 20,
      "3": 7,
      "2": 2,
      "1": 1
    }
  }
}
```

---

## 9. Chat & Messaging APIs

### 9.1 Get Conversations List
```http
GET /api/v1/chat/conversations
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "user": {
        "id": 5,
        "full_name": "BS. Nguyen Thanh Tam",
        "avatar": "/images/doctors/doctor1.jpg",
        "role": "doctor"
      },
      "last_message": {
        "content": "Xin chào, tôi có thể giúp gì cho bạn?",
        "created_at": "2025-11-19T10:30:00Z",
        "is_read": false
      },
      "unread_count": 3
    }
  ]
}
```

### 9.2 Get Chat Messages
```http
GET /api/v1/chat/messages/{user_id}?page={n}&limit={n}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sender_id": 2,
      "receiver_id": 5,
      "content": "Xin chào bác sĩ",
      "message_type": "text",
      "is_read": true,
      "created_at": "2025-11-19T10:25:00Z"
    },
    {
      "id": 2,
      "sender_id": 5,
      "receiver_id": 2,
      "content": "Xin chào, tôi có thể giúp gì cho bạn?",
      "message_type": "text",
      "is_read": false,
      "created_at": "2025-11-19T10:30:00Z"
    }
  ]
}
```

### 9.3 Send Message
```http
POST /api/v1/chat/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "receiver_id": 5,
  "content": "Tôi muốn hỏi về triệu chứng...",
  "message_type": "text",
  "appointment_id": 123 // optional
}

Response 201:
{
  "success": true,
  "data": {
    "id": 3,
    "sender_id": 2,
    "receiver_id": 5,
    "content": "Tôi muốn hỏi về triệu chứng...",
    "created_at": "2025-11-19T10:35:00Z"
  }
}
```

### 9.4 Send File/Image
```http
POST /api/v1/chat/messages/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

receiver_id: 5
file: [file]

Response 201:
{
  "success": true,
  "data": {
    "id": 4,
    "message_type": "image",
    "file_url": "/uploads/chat/image-123.jpg"
  }
}
```

### 9.5 Mark Messages as Read
```http
POST /api/v1/chat/messages/read
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 5 // Mark all messages from this user as read
}

Response 200:
{
  "success": true,
  "message": "Messages marked as read"
}
```

---

## 10. Notifications APIs

### 10.1 Get Notifications
```http
GET /api/v1/notifications?is_read={true|false}&page={n}&limit={n}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Lịch hẹn được xác nhận",
      "message": "Lịch hẹn của bạn với BS. Nguyen Thanh Tam...",
      "type": "appointment",
      "related_id": 123,
      "is_read": false,
      "action_url": "/appointments/123",
      "created_at": "2025-11-19T10:30:00Z"
    }
  ],
  "metadata": {
    "unread_count": 5,
    "total": 50
  }
}
```

### 10.2 Mark Notification as Read
```http
POST /api/v1/notifications/{id}/read
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 10.3 Mark All as Read
```http
POST /api/v1/notifications/read-all
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### 10.4 Delete Notification
```http
DELETE /api/v1/notifications/{id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## 11. Admin APIs

### 11.1 Get Dashboard Statistics
```http
GET /api/v1/admin/dashboard
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "data": {
    "total_users": 1250,
    "total_doctors": 45,
    "total_patients": 1200,
    "pending_doctor_approvals": 5,
    "total_appointments": 5640,
    "total_revenue": 1689000000,
    "monthly_stats": {
      "new_users": 85,
      "completed_appointments": 340,
      "revenue": 102000000
    }
  }
}
```

### 11.2 Manage Users
```http
GET /api/v1/admin/users?role={role}&status={status}&search={keyword}&page={n}
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "data": [ /* users list */ ]
}

POST /api/v1/admin/users/{id}/toggle-status
PUT /api/v1/admin/users/{id}
DELETE /api/v1/admin/users/{id}
```

### 11.3 Manage Doctors
```http
GET /api/v1/admin/doctors?status={pending|approved|rejected}
Authorization: Bearer {admin_token}

POST /api/v1/admin/doctors/{id}/approve
POST /api/v1/admin/doctors/{id}/reject
```

### 11.4 Manage Specialties
```http
GET /api/v1/admin/specialties
POST /api/v1/admin/specialties
PUT /api/v1/admin/specialties/{id}
DELETE /api/v1/admin/specialties/{id}
```

### 11.5 View All Appointments
```http
GET /api/v1/admin/appointments?status={status}&doctor_id={id}&patient_id={id}
Authorization: Bearer {admin_token}
```

### 11.6 View Transactions
```http
GET /api/v1/admin/transactions?status={status}&payment_method={method}
Authorization: Bearer {admin_token}
```

---

## 12. Posts & CMS APIs

### 12.1 Get Posts (Public)
```http
GET /api/v1/posts?category_id={id}&search={keyword}&page={n}

Response 200:
{
  "success": true,
  "data": [ /* posts list */ ]
}
```

### 12.2 Get Post Detail (Public)
```http
GET /api/v1/posts/{slug}
```

### 12.3 Manage Posts (Admin/Doctor)
```http
POST /api/v1/posts
PUT /api/v1/posts/{id}
DELETE /api/v1/posts/{id}
```

---

## WebSocket Events (Socket.io)

### Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Events

#### 1. Chat Events
```javascript
// Send message
socket.emit('chat:send', {
  receiver_id: 5,
  content: 'Hello',
  message_type: 'text'
});

// Receive message
socket.on('chat:new_message', (data) => {
  console.log('New message:', data);
});

// Typing indicator
socket.emit('chat:typing', { receiver_id: 5 });
socket.on('chat:user_typing', (data) => {
  console.log('User typing:', data);
});
```

#### 2. Notification Events
```javascript
socket.on('notification:new', (data) => {
  console.log('New notification:', data);
});
```

#### 3. Appointment Events
```javascript
socket.on('appointment:confirmed', (data) => {
  console.log('Appointment confirmed:', data);
});

socket.on('appointment:cancelled', (data) => {
  console.log('Appointment cancelled:', data);
});
```

#### 4. Video Call Events
```javascript
// Join video call room
socket.emit('video:join', {
  appointment_id: 123,
  room_id: 'room-123'
});

// Leave video call
socket.emit('video:leave', {
  room_id: 'room-123'
});
```

---

## Rate Limiting

```
General APIs: 100 requests/15 minutes
Authentication APIs: 5 requests/15 minutes
Payment APIs: 10 requests/15 minutes
```

## Error Codes

```
400 - BAD_REQUEST
401 - UNAUTHORIZED
403 - FORBIDDEN
404 - NOT_FOUND
409 - CONFLICT (e.g., time slot already booked)
422 - VALIDATION_ERROR
429 - TOO_MANY_REQUESTS
500 - INTERNAL_SERVER_ERROR
503 - SERVICE_UNAVAILABLE
```

---

**Total Endpoints:** 80+ APIs
**Authentication:** JWT with 24h expiration
**File Upload:** Max 5MB per file
**Pagination:** Default 20 items per page
