# FLOW DIAGRAMS - SƠ ĐỒ LUỒNG NGHIỆP VỤ

## Mục lục
1. [Luồng đăng ký & đăng nhập](#1-luồng-đăng-ký--đăng-nhập)
2. [Luồng đặt lịch khám](#2-luồng-đặt-lịch-khám)
3. [Luồng thanh toán](#3-luồng-thanh-toán)
4. [Luồng khám bệnh](#4-luồng-khám-bệnh)
5. [Luồng đánh giá](#5-luồng-đánh-giá)
6. [Luồng chat](#6-luồng-chat)
7. [Luồng phê duyệt bác sĩ](#7-luồng-phê-duyệt-bác-sĩ)
8. [Luồng hủy lịch & hoàn tiền](#8-luồng-hủy-lịch--hoàn-tiền)

---

## 1. Luồng đăng ký & đăng nhập

### 1.1 Đăng ký bệnh nhân

```
┌──────────────┐
│  Bệnh nhân   │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ Điền form đăng ký              │
│ - Email                        │
│ - Password                     │
│ - Họ tên                       │
│ - SĐT                          │
│ - Ngày sinh, giới tính         │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Validate thông tin             │
│ - Email hợp lệ?                │
│ - Email đã tồn tại?            │
│ - Password >= 6 ký tự?         │
│ - SĐT 10-11 số?                │
└────────┬───────────────────────┘
         │
         ├─[Invalid]──► Trả về lỗi validation
         │
         ▼ [Valid]
┌────────────────────────────────┐
│ Tạo tài khoản                  │
│ - Hash password (bcrypt)       │
│ - Tạo User (role=patient)      │
│ - Tạo Patient profile          │
│ - is_verified = false          │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Tạo verification token         │
│ - JWT token (24h expiry)       │
│ - Lưu vào bảng tokens          │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Gửi email xác thực             │
│ - Link verify: /verify?token=  │
│ - Template: verificationEmail  │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Trả về response success        │
│ {                              │
│   message: "Đăng ký thành công"│
│   email: "user@example.com"    │
│ }                              │
└────────────────────────────────┘
```

### 1.2 Xác thực email

```
┌──────────────┐
│ Bệnh nhân    │
└──────┬───────┘
       │
       ▼
┌─────────────────────────┐
│ Click link trong email  │
│ GET /verify?token=xxx   │
└──────┬──────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Verify JWT token             │
│ - Token hợp lệ?              │
│ - Chưa hết hạn?              │
└──────┬───────────────────────┘
       │
       ├─[Invalid]──► Trả về "Token không hợp lệ"
       │
       ▼ [Valid]
┌──────────────────────────────┐
│ Kích hoạt tài khoản          │
│ - is_verified = true         │
│ - is_active = true           │
│ - verified_at = NOW()        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Gửi welcome email            │
│ - Chào mừng đến hệ thống     │
│ - Hướng dẫn sử dụng          │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Redirect về login page       │
│ Message: "Xác thực thành công"│
└──────────────────────────────┘
```

### 1.3 Đăng nhập

```
┌──────────────┐
│  User        │
└──────┬───────┘
       │
       ▼
┌─────────────────────────┐
│ POST /api/auth/login    │
│ {                       │
│   email: "...",         │
│   password: "..."       │
│ }                       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Tìm user theo email             │
└──────┬──────────────────────────┘
       │
       ├─[Not found]──► "Email không tồn tại"
       │
       ▼ [Found]
┌─────────────────────────────────┐
│ Kiểm tra password               │
│ bcrypt.compare(input, hash)     │
└──────┬──────────────────────────┘
       │
       ├─[Invalid]──► "Sai mật khẩu"
       │
       ▼ [Valid]
┌─────────────────────────────────┐
│ Kiểm tra is_verified            │
└──────┬──────────────────────────┘
       │
       ├─[false]──► "Vui lòng xác thực email"
       │
       ▼ [true]
┌─────────────────────────────────┐
│ Kiểm tra is_active              │
└──────┬──────────────────────────┘
       │
       ├─[false]──► "Tài khoản bị khóa"
       │
       ▼ [true]
┌─────────────────────────────────┐
│ Tạo JWT tokens                  │
│ - Access token (24h)            │
│ - Refresh token (7d)            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Trả về thông tin user + tokens  │
│ {                               │
│   user: { id, email, role },    │
│   accessToken: "...",           │
│   refreshToken: "..."           │
│ }                               │
└─────────────────────────────────┘
```

---

## 2. Luồng đặt lịch khám

```
┌──────────────┐
│ Bệnh nhân    │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────────┐
│ Tìm kiếm bác sĩ                    │
│ - Theo chuyên khoa                 │
│ - Theo giá khám                    │
│ - Theo rating                      │
│ GET /api/doctors?specialty=...     │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Hệ thống trả về danh sách bác sĩ   │
│ - Đã được phê duyệt                │
│ - Đang hoạt động                   │
│ - Sắp xếp theo điểm matching       │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Chọn bác sĩ                        │
│ Xem chi tiết: profile, reviews     │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Chọn ngày khám                     │
│ GET /api/appointments/available    │
│   ?doctorId=...&date=...           │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Hệ thống tạo time slots            │
│ - Dựa vào working_hours            │
│ - Lọc các slots đã đặt             │
│ - Trả về slots khả dụng            │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Chọn khung giờ                     │
│ Nhập thông tin:                    │
│ - Hình thức (online/offline)       │
│ - Lý do khám                       │
│ - Triệu chứng                      │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ POST /api/appointments             │
│ {                                  │
│   doctor_id, date, time_slot,      │
│   type, reason, symptoms           │
│ }                                  │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Backend validate                   │
│ ├─ Doctor active?                  │
│ ├─ Time slot available?            │
│ ├─ Working day?                    │
│ └─ Within working hours?           │
└────────┬───────────────────────────┘
         │
         ├─[Invalid]──► Trả về lỗi
         │
         ▼ [Valid]
┌────────────────────────────────────┐
│ Tạo appointment                    │
│ - status = 'pending'               │
│ - is_paid = false                  │
│ - created_at = NOW()               │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Gửi thông báo                      │
│ ├─ Bệnh nhân: "Vui lòng thanh toán"│
│ └─ Bác sĩ: "Lịch hẹn mới"          │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Trả về appointment                 │
│ {                                  │
│   id, status, consultation_price,  │
│   message: "Vui lòng thanh toán    │
│             trong 30 phút"         │
│ }                                  │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Frontend redirect sang             │
│ trang thanh toán                   │
└────────────────────────────────────┘
```

---

## 3. Luồng thanh toán

### 3.1 Tạo thanh toán

```
┌──────────────┐
│ Bệnh nhân    │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Chọn phương thức thanh toán     │
│ ○ VNPAY                         │
│ ○ Momo                          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ POST /api/payments/create       │
│ {                               │
│   appointment_id: 123,          │
│   payment_method: "vnpay"       │
│ }                               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Backend kiểm tra                │
│ ├─ Appointment tồn tại?         │
│ ├─ Chưa thanh toán?             │
│ └─ Chưa bị hủy?                 │
└──────┬──────────────────────────┘
       │
       ├─[Invalid]──► Trả về lỗi
       │
       ▼ [Valid]
┌─────────────────────────────────┐
│ Tạo transaction                 │
│ - status = 'pending'            │
│ - amount = consultation_price   │
│ - transaction_code = random     │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Tạo payment URL                 │
│ (VNPAY hoặc Momo)               │
│ - Thêm params                   │
│ - Tạo chữ ký HMAC              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Trả về payment URL              │
│ {                               │
│   paymentUrl: "https://..."     │
│ }                               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Frontend redirect đến           │
│ cổng thanh toán                 │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Bệnh nhân thanh toán            │
│ trên cổng (VNPAY/Momo)          │
└──────┬──────────────────────────┘
       │
       ├─► [Thành công] ─┐
       │                 │
       └─► [Thất bại] ───┤
                         │
                         ▼
        ┌────────────────────────────┐
        │ Cổng thanh toán callback   │
        │ GET /api/payments/callback │
        │   ?vnp_ResponseCode=00...  │
        └────────┬───────────────────┘
                 │
                 ▼
        Xem tiếp phần 3.2
```

### 3.2 Xử lý callback

```
┌─────────────────────────────────┐
│ Backend nhận callback           │
│ GET /payments/vnpay/callback    │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Verify chữ ký                   │
│ - Parse params                  │
│ - Sort theo alphabet            │
│ - Tính HMAC SHA512              │
│ - So sánh với vnp_SecureHash    │
└──────┬──────────────────────────┘
       │
       ├─[Invalid signature]──► Log error, trả về lỗi
       │
       ▼ [Valid signature]
┌─────────────────────────────────┐
│ Kiểm tra response code          │
└──────┬──────────────────────────┘
       │
       ├─[00: Success]─────────────┐
       │                           │
       └─[Other: Failed]───────────┤
                                   │
    ┌──────────────────────────────┴──────────────────────────┐
    │                                                           │
    ▼ [Success]                                    ▼ [Failed]  │
┌─────────────────────────────────┐    ┌──────────────────────┴─────┐
│ BEGIN TRANSACTION               │    │ UPDATE transaction         │
│                                 │    │ SET status = 'failed'      │
│ UPDATE transaction              │    │                            │
│ SET status = 'completed',       │    │ Trả về message thất bại    │
│     paid_at = NOW()             │    └────────────────────────────┘
│                                 │
│ UPDATE appointment              │
│ SET status = 'confirmed',       │
│     is_paid = true              │
│                                 │
│ Gửi email xác nhận              │
│ Tạo notification                │
│ Thông báo cho bác sĩ            │
│                                 │
│ COMMIT                          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Redirect về frontend            │
│ /payment-success?id=...         │
└─────────────────────────────────┘
```

---

## 4. Luồng khám bệnh

```
┌──────────────┐                              ┌──────────────┐
│ Bác sĩ       │                              │ Bệnh nhân    │
└──────┬───────┘                              └──────┬───────┘
       │                                             │
       │  ◄──── 24h trước: Gửi reminder ────────────┤
       │                                             │
       │  ◄──── 2h trước: Gửi notification ─────────┤
       │                                             │
       ▼ Đến giờ hẹn                                │
┌─────────────────────────────────┐                 │
│ Xem danh sách lịch hẹn hôm nay  │                 │
│ GET /api/appointments/today     │                 │
└────────┬────────────────────────┘                 │
         │                                           │
         ▼                                           │
┌─────────────────────────────────┐                 │
│ Click "Bắt đầu khám"            │                 │
│ PATCH /appointments/:id/start   │                 │
└────────┬────────────────────────┘                 │
         │                                           │
         ▼                                           │
┌─────────────────────────────────┐                 │
│ Cập nhật status = 'in_progress' │                 │
│ Gửi notification cho bệnh nhân  │ ────────────────►
└────────┬────────────────────────┘                 │
         │                                           │
         │ ◄────────── Tham gia meeting ────────────┤
         │           (nếu online)                    │
         │                                           │
         ▼                                           │
┌─────────────────────────────────┐                 │
│ Tư vấn, khám bệnh               │ ◄───────────────►
│ - Chat real-time                │
│ - Video call (ZegoCloud)        │
│ - Chia sẻ file, hình ảnh        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Kết thúc buổi khám              │
│ PATCH /appointments/:id/complete│
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Cập nhật status = 'completed'   │
│ completed_at = NOW()            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Tạo hồ sơ bệnh án               │
│ POST /api/medical-records       │
│ {                               │
│   appointment_id,               │
│   diagnosis,                    │
│   prescription: [               │
│     { drug, dosage, frequency } │
│   ],                            │
│   vital_signs: {                │
│     blood_pressure, heart_rate  │
│   },                            │
│   notes                         │
│ }                               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Lưu medical record              │
│ Tạo PDF                         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Gửi email cho bệnh nhân         │
│ - Thông báo có hồ sơ mới        │
│ - Link tải PDF                  │
│ - Đơn thuốc                     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Gửi notification                │ ────────────────►
│ "Bác sĩ đã tạo hồ sơ bệnh án"   │                 │
└─────────────────────────────────┘                 │
                                                     │
                                                     ▼
                                        ┌────────────────────────┐
                                        │ Xem hồ sơ & đánh giá   │
                                        └────────────────────────┘
```

---

## 5. Luồng đánh giá

```
┌──────────────┐
│ Bệnh nhân    │
└──────┬───────┘
       │
       │ (Sau khi hoàn thành buổi khám)
       │
       ▼
┌─────────────────────────────────┐
│ Vào trang lịch sử khám          │
│ GET /api/appointments/history   │
│ - Lọc status = 'completed'      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Click "Đánh giá" trên lịch hẹn  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Kiểm tra điều kiện              │
│ - Đã hoàn thành?                │
│ - Chưa đánh giá?                │
│ - Trong vòng 30 ngày?           │
└────────┬────────────────────────┘
         │
         ├─[Không hợp lệ]──► Hiển thị thông báo
         │
         ▼ [Hợp lệ]
┌─────────────────────────────────┐
│ Hiển thị form đánh giá          │
│ - Rating: ⭐⭐⭐⭐⭐ (1-5)        │
│ - Comment (tùy chọn)            │
│ - Checkbox: Đánh giá ẩn danh    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ POST /api/reviews               │
│ {                               │
│   appointment_id: 123,          │
│   rating: 5,                    │
│   comment: "Bác sĩ tận tình",   │
│   is_anonymous: false           │
│ }                               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Backend validate                │
│ - Rating 1-5?                   │
│ - Chưa có review nào?           │
│ - Appointment đã hoàn thành?    │
└────────┬────────────────────────┘
         │
         ├─[Invalid]──► Trả về lỗi
         │
         ▼ [Valid]
┌─────────────────────────────────┐
│ BEGIN TRANSACTION               │
│                                 │
│ 1. Tạo review record            │
│    - patient_id                 │
│    - doctor_id                  │
│    - appointment_id             │
│    - rating, comment            │
│    - is_anonymous               │
│                                 │
│ 2. Tính lại rating bác sĩ      │
│    - Lấy tất cả reviews         │
│    - Tính average               │
│    - UPDATE doctors.rating      │
│                                 │
│ 3. Tạo notification cho bác sĩ  │
│    "Bạn có đánh giá mới"        │
│                                 │
│ COMMIT                          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Trả về review                   │
│ {                               │
│   id, rating, comment,          │
│   created_at                    │
│ }                               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Frontend hiển thị "Cảm ơn bạn  │
│ đã đánh giá!"                   │
└─────────────────────────────────┘


         ┌──────────────┐
         │ Bác sĩ       │
         └──────┬───────┘
                │
                │ (Nhận notification)
                │
                ▼
       ┌─────────────────────────────────┐
       │ Xem danh sách đánh giá          │
       │ GET /api/reviews?doctorId=...   │
       └────────┬────────────────────────┘
                │
                ▼
       ┌─────────────────────────────────┐
       │ Chọn 1 review để trả lời        │
       └────────┬────────────────────────┘
                │
                ▼
       ┌─────────────────────────────────┐
       │ POST /api/reviews/:id/response  │
       │ {                               │
       │   response: "Cảm ơn bạn..."     │
       │ }                               │
       └────────┬────────────────────────┘
                │
                ▼
       ┌─────────────────────────────────┐
       │ Cập nhật review                 │
       │ - doctor_response = text        │
       │ - response_at = NOW()           │
       │                                 │
       │ Gửi notification cho bệnh nhân  │
       │ "Bác sĩ đã phản hồi đánh giá"   │
       └─────────────────────────────────┘
```

---

## 6. Luồng chat

```
┌──────────────┐                              ┌──────────────┐
│ Bệnh nhân    │                              │ Bác sĩ       │
└──────┬───────┘                              └──────┬───────┘
       │                                             │
       ▼                                             │
┌─────────────────────────────────┐                 │
│ Vào trang Chat                  │                 │
│ GET /api/chat/conversations     │                 │
└────────┬────────────────────────┘                 │
         │                                           │
         ▼                                           │
┌─────────────────────────────────┐                 │
│ Hiển thị danh sách cuộc trò     │                 │
│ chuyện với các bác sĩ           │                 │
└────────┬────────────────────────┘                 │
         │                                           │
         ▼                                           │
┌─────────────────────────────────┐                 │
│ Click vào 1 bác sĩ              │                 │
│ GET /api/chat/messages          │                 │
│   ?receiverId=doctorId          │                 │
└────────┬────────────────────────┘                 │
         │                                           │
         ▼                                           │
┌─────────────────────────────────┐                 │
│ Kết nối WebSocket               │                 │
│ socket.emit('join', { userId }) │ ────────────────►
└────────┬────────────────────────┘                 │
         │                                           │
         │ ◄────────── Join room ────────────────────┤
         │                                           │
         ▼                                           ▼
┌─────────────────────────────────┐    ┌────────────────────────┐
│ Gõ tin nhắn                     │    │ Nhận typing indicator  │
│ socket.emit('typing', {         │───►│ "Đang soạn tin..."     │
│   receiverId: doctorId          │    └────────────────────────┘
│ })                              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Gửi tin nhắn                    │
│ socket.emit('send_message', {   │
│   receiverId: doctorId,         │
│   message: "Xin chào bác sĩ",   │
│   type: 'text'                  │
│ })                              │
└────────┬────────────────────────┘
         │
         │
         ▼
      ┌──────────────────────────────────────┐
      │         SERVER (Socket.io)           │
      │                                      │
      │  1. Validate quyền chat              │
      │     - Có lịch hẹn với nhau?          │
      │                                      │
      │  2. Lưu message vào DB               │
      │     INSERT INTO chat_messages        │
      │                                      │
      │  3. Gửi cho người nhận (real-time)   │
      │     io.to(doctorId).emit(            │
      │       'new_message', message)        │
      │                                      │
      │  4. Gửi xác nhận cho người gửi       │
      │     socket.emit(                     │
      │       'message_sent', message)       │
      │                                      │
      │  5. Tạo notification nếu offline     │
      │                                      │
      └────────┬─────────────────────────────┘
               │
               │
   ┌───────────┴───────────┐
   │                       │
   ▼                       ▼
┌─────────────────┐   ┌──────────────────┐
│ Bệnh nhân nhận  │   │ Bác sĩ nhận      │
│ xác nhận        │   │ tin nhắn mới     │
│ ✓ Đã gửi        │   │ [notification]   │
└─────────────────┘   └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ Đánh dấu đã đọc  │
                      │ socket.emit(     │
                      │   'mark_read', { │
                      │     senderId     │
                      │   })             │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ UPDATE messages  │
                      │ SET is_read=true │
                      │                  │
                      │ Thông báo đã đọc │───►
                      └──────────────────┘    │
                                              │
                  ┌───────────────────────────┘
                  │
                  ▼
          ┌──────────────────┐
          │ Hiển thị ✓✓      │
          │ (double check)   │
          └──────────────────┘
```

### 6.1 Upload file trong chat

```
┌──────────────┐
│ User         │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Chọn file để gửi                │
│ - Hình ảnh (.jpg, .png)         │
│ - Tài liệu (.pdf, .doc)         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ POST /api/chat/upload           │
│ FormData:                       │
│   file: [binary]                │
│   receiverId: 123               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Backend validate                │
│ - File type cho phép?           │
│ - File size <= max?             │
└────────┬────────────────────────┘
         │
         ├─[Invalid]──► Trả về lỗi
         │
         ▼ [Valid]
┌─────────────────────────────────┐
│ Lưu file vào server             │
│ /uploads/chat/userId/filename   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Tạo message với type = 'file'   │
│ - message = filename            │
│ - attachment_url = filepath     │
│ - file_size, file_type          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Gửi qua Socket.io               │
│ (tương tự text message)         │
└─────────────────────────────────┘
```

---

## 7. Luồng phê duyệt bác sĩ

```
┌──────────────┐
│ Bác sĩ       │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Đăng ký tài khoản bác sĩ        │
│ POST /api/auth/register/doctor  │
│ {                               │
│   email, password, full_name,   │
│   phone, specialty_id,          │
│   education, experience_years,  │
│   consultation_price,           │
│   certificate_images: [files]   │
│ }                               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Tạo tài khoản                   │
│ - role = 'doctor'               │
│ - is_active = false             │
│ - is_approved = false           │
│ - approval_status = 'pending'   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Upload chứng chỉ lên server     │
│ Lưu paths vào certificate_images│
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Gửi email xác thực              │
│ (Tương tự đăng ký bệnh nhân)    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Gửi notification cho Admin      │
│ "Có bác sĩ mới đăng ký"         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Trả về message                  │
│ "Đăng ký thành công. Vui lòng   │
│  chờ admin phê duyệt"           │
└─────────────────────────────────┘


         ┌──────────────┐
         │ Admin        │
         └──────┬───────┘
                │
                ▼
       ┌─────────────────────────────────┐
       │ Vào trang quản lý bác sĩ        │
       │ GET /api/admin/doctors          │
       │   ?status=pending               │
       └────────┬────────────────────────┘
                │
                ▼
       ┌─────────────────────────────────┐
       │ Danh sách bác sĩ chờ duyệt      │
       │ - Thông tin cá nhân             │
       │ - Chuyên khoa                   │
       │ - Kinh nghiệm                   │
       │ - Xem chứng chỉ                 │
       └────────┬────────────────────────┘
                │
                ▼
       ┌─────────────────────────────────┐
       │ Xem chi tiết 1 bác sĩ           │
       │ GET /api/admin/doctors/:id      │
       └────────┬────────────────────────┘
                │
                ▼
       ┌─────────────────────────────────┐
       │ Admin review                    │
       │ ├─ Kiểm tra thông tin           │
       │ ├─ Xem chứng chỉ               │
       │ └─ Quyết định                   │
       └────────┬────────────────────────┘
                │
                │
    ┌───────────┴───────────┐
    │                       │
    ▼ [Approve]       ▼ [Reject]
┌─────────────────┐   ┌──────────────────┐
│ POST /admin/    │   │ POST /admin/     │
│   doctors/:id/  │   │   doctors/:id/   │
│   approve       │   │   reject         │
│ {               │   │ {                │
│   message: "OK" │   │   reason: "..."  │
│ }               │   │ }                │
└────────┬────────┘   └────────┬─────────┘
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│ UPDATE doctors  │   │ UPDATE doctors   │
│ - is_approved=  │   │ - is_approved=   │
│   true          │   │   false          │
│ - is_active=    │   │ - approval_      │
│   true          │   │   status=        │
│ - approval_date │   │   'rejected'     │
│                 │   │                  │
│ Gửi email       │   │ Gửi email        │
│ chúc mừng       │   │ từ chối + lý do  │
│                 │   │                  │
│ Gửi             │   │ Gửi              │
│ notification    │   │ notification     │
└─────────────────┘   └──────────────────┘
```

---

## 8. Luồng hủy lịch & hoàn tiền

```
┌──────────────┐
│ Bệnh nhân    │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Vào trang lịch hẹn của tôi      │
│ GET /api/appointments/my         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Click "Hủy lịch" trên 1 lịch    │
│ - Hiển thị popup xác nhận       │
│ - Nhập lý do hủy                │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ POST /api/appointments/:id/     │
│   cancel                        │
│ {                               │
│   reason: "Tôi bận đột xuất"    │
│ }                               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Backend kiểm tra status         │
└────────┬────────────────────────┘
         │
         ├─['completed']──► "Không thể hủy lịch đã hoàn thành"
         │
         ├─['cancelled']──► "Lịch hẹn đã bị hủy"
         │
         ├─['pending']────┐
         │                │
         └─['confirmed']──┤
                          │
         ┌────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Tính thời gian còn lại          │
│ hoursUntil = appointment_time   │
│              - NOW()            │
└────────┬────────────────────────┘
         │
         ├─ [< 12 giờ]─────────────┐
         │                         │
         ├─ [12-24 giờ]────────────┤
         │                         │
         └─ [>= 24 giờ]────────────┤
                                   │
         ┌─────────────────────────┴────────────────────────┐
         │                         │                        │
         ▼                         ▼                        ▼
    ┌─────────┐            ┌──────────┐            ┌─────────────┐
    │ Hoàn 0% │            │ Hoàn 50% │            │ Hoàn 100%   │
    └────┬────┘            └────┬─────┘            └──────┬──────┘
         │                      │                         │
         └──────────────────────┴─────────────────────────┘
                                │
                                ▼
                   ┌─────────────────────────────┐
                   │ Kiểm tra đã thanh toán chưa │
                   └────────┬────────────────────┘
                            │
                            ├─[Chưa thanh toán]──► Hủy trực tiếp
                            │
                            ▼ [Đã thanh toán]
                   ┌─────────────────────────────┐
                   │ BEGIN TRANSACTION           │
                   │                             │
                   │ 1. Gọi API hoàn tiền       │
                   │    (VNPAY/Momo)            │
                   │                             │
                   │ 2. UPDATE transaction       │
                   │    - status = 'refunded'    │
                   │    - refund_amount          │
                   │    - refund_percentage      │
                   │                             │
                   │ 3. UPDATE appointment       │
                   │    - status = 'cancelled'   │
                   │    - cancellation_reason    │
                   │                             │
                   │ 4. Gửi email xác nhận       │
                   │    hoàn tiền                │
                   │                             │
                   │ 5. Gửi notification         │
                   │    - Cho bệnh nhân          │
                   │    - Cho bác sĩ             │
                   │                             │
                   │ COMMIT                      │
                   └────────┬────────────────────┘
                            │
                            ▼
                   ┌─────────────────────────────┐
                   │ Trả về kết quả              │
                   │ {                           │
                   │   success: true,            │
                   │   refund_amount: 300000,    │
                   │   refund_percentage: 100    │
                   │ }                           │
                   └────────┬────────────────────┘
                            │
                            ▼
                   ┌─────────────────────────────┐
                   │ Frontend hiển thị           │
                   │ "Đã hủy lịch và hoàn        │
                   │  100% tiền vào tài khoản"   │
                   └─────────────────────────────┘
```

---

## 9. Luồng tự động (Cron Jobs)

### 9.1 Auto-cancel unpaid appointments

```
                  ┌──────────────────────┐
                  │  CRON JOB            │
                  │  Chạy mỗi 10 phút    │
                  └──────────┬───────────┘
                             │
                             ▼
              ┌──────────────────────────────────┐
              │ Query appointments               │
              │ WHERE status = 'pending'         │
              │   AND is_paid = false            │
              │   AND created_at < NOW() - 30min │
              └──────────┬───────────────────────┘
                         │
                         ├─[Không có]──► END
                         │
                         ▼ [Có appointments]
              ┌──────────────────────────────────┐
              │ FOR EACH appointment             │
              │   UPDATE status = 'cancelled'    │
              │   SET cancellation_reason =      │
              │     "Tự động hủy do không        │
              │      thanh toán"                 │
              │                                  │
              │   Gửi notification cho patient   │
              └──────────┬───────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────┐
              │ Log: "Đã hủy X lịch hẹn"         │
              └──────────────────────────────────┘
```

### 9.2 Send appointment reminders

```
                  ┌──────────────────────┐
                  │  CRON JOB            │
                  │  Chạy mỗi 1 giờ      │
                  └──────────┬───────────┘
                             │
                             ▼
              ┌──────────────────────────────────┐
              │ Query appointments trong 24-25h  │
              │ WHERE status = 'confirmed'       │
              │   AND reminder_24h_sent = false  │
              │   AND appointment_datetime       │
              │       BETWEEN NOW()+24h          │
              │           AND NOW()+25h          │
              └──────────┬───────────────────────┘
                         │
                         ├─[Không có]──► Tiếp tục check 2h
                         │
                         ▼ [Có]
              ┌──────────────────────────────────┐
              │ FOR EACH appointment             │
              │   Gửi email reminder             │
              │   Gửi SMS reminder               │
              │   Tạo notification               │
              │                                  │
              │   UPDATE reminder_24h_sent=true  │
              └──────────┬───────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────┐
              │ Query appointments trong 2-3h    │
              │ WHERE status = 'confirmed'       │
              │   AND reminder_2h_sent = false   │
              └──────────┬───────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────┐
              │ FOR EACH appointment             │
              │   Tạo notification               │
              │   UPDATE reminder_2h_sent=true   │
              └──────────────────────────────────┘
```

### 9.3 Cleanup old notifications

```
                  ┌──────────────────────┐
                  │  CRON JOB            │
                  │  Chạy mỗi ngày 2AM   │
                  └──────────┬───────────┘
                             │
                             ▼
              ┌──────────────────────────────────┐
              │ DELETE notifications             │
              │ WHERE is_read = true             │
              │   AND created_at < NOW() - 30d   │
              └──────────┬───────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────┐
              │ DELETE notifications             │
              │ WHERE is_read = false            │
              │   AND priority != 'high'         │
              │   AND created_at < NOW() - 90d   │
              └──────────┬───────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────┐
              │ Log: "Đã xóa X notifications"    │
              └──────────────────────────────────┘
```

---

## Tổng kết

### Các luồng nghiệp vụ đã mô tả:

1. ✅ **Đăng ký & Đăng nhập:** Validation → Tạo tài khoản → Xác thực email → Đăng nhập với JWT
2. ✅ **Đặt lịch khám:** Tìm bác sĩ → Chọn khung giờ → Validate → Tạo appointment → Thông báo
3. ✅ **Thanh toán:** Tạo transaction → Redirect đến gateway → Verify callback → Cập nhật status
4. ✅ **Khám bệnh:** Reminder → Start → Tư vấn → Complete → Tạo hồ sơ bệnh án
5. ✅ **Đánh giá:** Kiểm tra điều kiện → Tạo review → Tính lại rating → Bác sĩ phản hồi
6. ✅ **Chat:** Kết nối Socket.io → Real-time messaging → Upload file → Đánh dấu đã đọc
7. ✅ **Phê duyệt bác sĩ:** Đăng ký → Upload chứng chỉ → Admin review → Approve/Reject
8. ✅ **Hủy lịch:** Tính thời gian → Xác định % hoàn tiền → Gọi API refund → Thông báo
9. ✅ **Cron jobs:** Auto-cancel, Send reminders, Cleanup notifications

### Đặc điểm chung:

- 🔐 **Security:** Validate ở mọi bước, verify chữ ký thanh toán
- 🔔 **Notifications:** Multi-channel (in-app, email, SMS) cho các sự kiện quan trọng
- 🔄 **Real-time:** Socket.io cho chat và notifications
- 📧 **Email:** Gửi email xác nhận cho các transactions quan trọng
- 🗄️ **Transaction:** Sử dụng BEGIN/COMMIT cho các thao tác phức tạp
- ⏰ **Automation:** Cron jobs cho các tác vụ định kỳ

---

**Document version:** 1.0  
**Last updated:** November 19, 2025  
**Status:** ✅ Complete
