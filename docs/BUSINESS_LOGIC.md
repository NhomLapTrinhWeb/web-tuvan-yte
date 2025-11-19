# BUSINESS LOGIC - HỆ THỐNG TƯ VẤN Y TẾ TRỰC TUYẾN

## Mục lục
1. [Logic Đặt lịch khám](#1-logic-đặt-lịch-khám)
2. [Logic Thanh toán](#2-logic-thanh-toán)
3. [Logic Thông báo](#3-logic-thông-báo)
4. [Logic Đánh giá & Review](#4-logic-đánh-giá--review)
5. [Logic Chat & Tư vấn](#5-logic-chat--tư-vấn)
6. [Logic Hồ sơ bệnh án](#6-logic-hồ-sơ-bệnh-án)
7. [Logic Phê duyệt bác sĩ](#7-logic-phê-duyệt-bác-sĩ)
8. [Logic Quản lý lịch làm việc](#8-logic-quản-lý-lịch-làm-việc)

---

## 1. Logic Đặt lịch khám

### 1.1 Quy trình đặt lịch

#### Bước 1: Kiểm tra điều kiện
```
Điều kiện bắt buộc:
- Người dùng đã đăng nhập với role = 'patient'
- Bác sĩ phải có is_approved = true
- Bác sĩ phải có is_active = true
- Ngày khám phải >= ngày hiện tại
- Khung giờ phải nằm trong lịch làm việc của bác sĩ
- Khung giờ chưa bị đặt bởi bệnh nhân khác
```

#### Bước 2: Validate thông tin
```
Thông tin cần validate:
- doctor_id: Phải tồn tại trong bảng doctors
- appointment_date: Format YYYY-MM-DD, không được là ngày quá khứ
- time_slot: Format HH:MM-HH:MM (ví dụ: 09:00-10:00)
- appointment_type: 'online' hoặc 'offline'
- reason: Tối đa 500 ký tự
- symptoms: Tối đa 1000 ký tự
```

#### Bước 3: Kiểm tra khung giờ trống

**Logic kiểm tra:**
```javascript
function isTimeSlotAvailable(doctorId, date, timeSlot) {
    // Lấy tất cả lịch hẹn của bác sĩ trong ngày
    appointments = findAppointments({
        doctor_id: doctorId,
        appointment_date: date,
        status: ['pending', 'confirmed', 'in_progress']
    });
    
    // Parse khung giờ muốn đặt
    [requestStart, requestEnd] = parseTimeSlot(timeSlot);
    
    // Kiểm tra xung đột với các lịch hẹn hiện có
    for (appointment in appointments) {
        [existingStart, existingEnd] = parseTimeSlot(appointment.time_slot);
        
        // Kiểm tra overlap
        if (isOverlap(requestStart, requestEnd, existingStart, existingEnd)) {
            return false;
        }
    }
    
    return true;
}

function isOverlap(start1, end1, start2, end2) {
    // Hai khoảng thời gian overlap khi:
    // start1 < end2 AND start2 < end1
    return (start1 < end2) && (start2 < end1);
}
```

#### Bước 4: Kiểm tra lịch làm việc của bác sĩ

**Logic kiểm tra:**
```javascript
function isDoctorAvailable(doctorId, date, timeSlot) {
    // Lấy ngày trong tuần (0 = Chủ nhật, 1 = Thứ 2, ...)
    dayOfWeek = date.getDay();
    dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Lấy thông tin bác sĩ
    doctor = findDoctor(doctorId);
    
    // Kiểm tra bác sĩ có làm việc vào ngày này không
    if (!doctor.working_days.includes(dayNames[dayOfWeek])) {
        return false;
    }
    
    // Kiểm tra khung giờ có nằm trong working_hours không
    [requestStart, requestEnd] = parseTimeSlot(timeSlot);
    [workStart, workEnd] = parseTimeSlot(doctor.working_hours);
    
    // Khung giờ phải nằm trong working_hours
    if (requestStart < workStart || requestEnd > workEnd) {
        return false;
    }
    
    return true;
}
```

#### Bước 5: Tạo lịch hẹn

**Trạng thái ban đầu:**
```
status = 'pending'
is_paid = false
payment_status = 'unpaid'
created_at = NOW()
```

#### Bước 6: Tạo thông báo

**Gửi thông báo cho:**
1. **Bệnh nhân:** "Đặt lịch thành công. Vui lòng thanh toán để xác nhận."
2. **Bác sĩ:** "Bạn có lịch hẹn mới chờ xác nhận."

### 1.2 Các trạng thái của lịch hẹn

```mermaid
pending -> confirmed (sau khi thanh toán)
pending -> cancelled (hủy trước khi thanh toán)
confirmed -> in_progress (bác sĩ bắt đầu khám)
confirmed -> cancelled (hủy sau khi thanh toán, sẽ hoàn tiền)
in_progress -> completed (kết thúc buổi khám)
completed -> [có thể tạo medical record]
cancelled -> [không thể chuyển sang trạng thái khác]
```

### 1.3 Logic hủy lịch hẹn

#### Quy tắc hủy lịch:

**Trường hợp 1: Lịch chưa thanh toán (status = 'pending')**
```
- Cho phép hủy bất cứ lúc nào
- Không cần hoàn tiền
- Chuyển status = 'cancelled'
- Ghi lý do hủy vào cancellation_reason
```

**Trường hợp 2: Lịch đã thanh toán (status = 'confirmed')**
```
Điều kiện hoàn tiền:
- Hủy trước >= 24 giờ so với giờ hẹn: Hoàn 100%
- Hủy trong vòng 12-24 giờ: Hoàn 50%
- Hủy trong vòng < 12 giờ: Không hoàn tiền

Quy trình:
1. Kiểm tra thời gian còn lại đến lịch hẹn
2. Tính số tiền hoàn (refund_amount)
3. Tạo yêu cầu hoàn tiền trong PaymentService
4. Chuyển status = 'cancelled'
5. Gửi email xác nhận hủy và hoàn tiền (nếu có)
6. Thông báo cho bác sĩ
```

**Trường hợp 3: Lịch đã bắt đầu (status = 'in_progress' hoặc 'completed')**
```
- KHÔNG cho phép hủy
- Trả về lỗi: "Không thể hủy lịch hẹn đang/đã diễn ra"
```

### 1.4 Logic nhắc lịch hẹn

**Thời điểm gửi nhắc nhở:**
```
1. 24 giờ trước lịch hẹn:
   - Gửi email cho bệnh nhân
   - Gửi SMS cho bệnh nhân
   - Tạo notification trong hệ thống
   - Nội dung: Thông tin lịch hẹn + link meeting (nếu online)

2. 2 giờ trước lịch hẹn:
   - Gửi notification trong hệ thống
   - Chỉ gửi nếu status = 'confirmed'

3. Khi đến giờ hẹn:
   - Gửi notification: "Lịch hẹn của bạn đã bắt đầu"
   - Cập nhật status = 'in_progress' (tự động hoặc bởi bác sĩ)
```

**Cách triển khai:**
```javascript
// Chạy cron job mỗi giờ
async function checkUpcomingAppointments() {
    now = new Date();
    tomorrow = new Date(now.getTime() + 24*60*60*1000);
    twoHoursLater = new Date(now.getTime() + 2*60*60*1000);
    
    // Lấy lịch hẹn trong 24-25 giờ tới
    appointments24h = findAppointments({
        appointment_datetime: between(tomorrow, tomorrow + 1h),
        status: 'confirmed',
        reminder_24h_sent: false
    });
    
    // Gửi nhắc nhở 24h
    for (appointment in appointments24h) {
        sendReminderEmail(appointment);
        sendReminderSMS(appointment);
        createNotification(appointment);
        updateAppointment(appointment.id, { reminder_24h_sent: true });
    }
    
    // Lấy lịch hẹn trong 2-3 giờ tới
    appointments2h = findAppointments({
        appointment_datetime: between(twoHoursLater, twoHoursLater + 1h),
        status: 'confirmed',
        reminder_2h_sent: false
    });
    
    // Gửi nhắc nhở 2h
    for (appointment in appointments2h) {
        createNotification(appointment);
        updateAppointment(appointment.id, { reminder_2h_sent: true });
    }
}
```

---

## 2. Logic Thanh toán

### 2.1 Quy trình thanh toán

#### Bước 1: Tạo giao dịch thanh toán
```javascript
function createPayment(appointmentId, paymentMethod) {
    // Validate
    appointment = findAppointment(appointmentId);
    
    if (appointment.is_paid) {
        throw Error("Lịch hẹn đã được thanh toán");
    }
    
    if (appointment.status === 'cancelled') {
        throw Error("Không thể thanh toán cho lịch hẹn đã hủy");
    }
    
    // Kiểm tra đã có transaction pending không
    existingTransaction = findTransaction({
        appointment_id: appointmentId,
        status: 'pending'
    });
    
    if (existingTransaction) {
        // Sử dụng lại transaction cũ
        return generatePaymentUrl(existingTransaction);
    }
    
    // Tạo transaction mới
    transaction = createTransaction({
        appointment_id: appointmentId,
        user_id: appointment.patient_id,
        amount: appointment.consultation_price,
        payment_method: paymentMethod, // 'vnpay' hoặc 'momo'
        status: 'pending',
        transaction_code: generateTransactionCode()
    });
    
    // Tạo URL thanh toán
    paymentUrl = generatePaymentUrl(transaction);
    
    return paymentUrl;
}
```

#### Bước 2: Xử lý callback từ cổng thanh toán

**Với VNPAY:**
```javascript
function handleVNPayCallback(queryParams) {
    // Bước 1: Verify signature
    receivedSignature = queryParams.vnp_SecureHash;
    delete queryParams.vnp_SecureHash;
    delete queryParams.vnp_SecureHashType;
    
    // Sắp xếp params theo alphabet
    sortedParams = sortObject(queryParams);
    
    // Tạo chuỗi hash
    signData = querystring.stringify(sortedParams);
    
    // Tính HMAC SHA512
    expectedSignature = crypto
        .createHmac('sha512', VNPAY_HASH_SECRET)
        .update(signData)
        .digest('hex');
    
    if (receivedSignature !== expectedSignature) {
        throw Error("Chữ ký không hợp lệ");
    }
    
    // Bước 2: Kiểm tra kết quả
    transactionCode = queryParams.vnp_TxnRef;
    responseCode = queryParams.vnp_ResponseCode;
    
    transaction = findTransactionByCode(transactionCode);
    
    if (responseCode === '00') {
        // Thanh toán thành công
        updateTransaction(transaction.id, {
            status: 'completed',
            payment_info: JSON.stringify(queryParams),
            paid_at: new Date()
        });
        
        // Cập nhật appointment
        updateAppointment(transaction.appointment_id, {
            status: 'confirmed',
            is_paid: true,
            payment_status: 'paid'
        });
        
        // Gửi thông báo
        sendPaymentSuccessEmail(transaction);
        createNotification("Thanh toán thành công");
        notifyDoctor(transaction.appointment_id);
        
        return { success: true, message: "Thanh toán thành công" };
    } else {
        // Thanh toán thất bại
        updateTransaction(transaction.id, {
            status: 'failed',
            payment_info: JSON.stringify(queryParams)
        });
        
        return { success: false, message: "Thanh toán thất bại" };
    }
}
```

**Với Momo:**
```javascript
function handleMomoCallback(requestBody) {
    // Bước 1: Verify signature
    rawSignature = `accessKey=${MOMO_ACCESS_KEY}` +
                   `&amount=${requestBody.amount}` +
                   `&extraData=${requestBody.extraData}` +
                   `&message=${requestBody.message}` +
                   `&orderId=${requestBody.orderId}` +
                   `&orderInfo=${requestBody.orderInfo}` +
                   `&orderType=${requestBody.orderType}` +
                   `&partnerCode=${requestBody.partnerCode}` +
                   `&payType=${requestBody.payType}` +
                   `&requestId=${requestBody.requestId}` +
                   `&responseTime=${requestBody.responseTime}` +
                   `&resultCode=${requestBody.resultCode}` +
                   `&transId=${requestBody.transId}`;
    
    expectedSignature = crypto
        .createHmac('sha256', MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest('hex');
    
    if (requestBody.signature !== expectedSignature) {
        throw Error("Chữ ký không hợp lệ");
    }
    
    // Bước 2: Xử lý kết quả
    transactionCode = requestBody.orderId;
    resultCode = requestBody.resultCode;
    
    transaction = findTransactionByCode(transactionCode);
    
    if (resultCode === 0) {
        // Thanh toán thành công (logic tương tự VNPAY)
        // ...
    } else {
        // Thanh toán thất bại
        // ...
    }
}
```

### 2.2 Logic hoàn tiền

**Quy trình hoàn tiền:**
```javascript
function processRefund(appointmentId, reason) {
    appointment = findAppointment(appointmentId);
    transaction = findTransaction({ appointment_id: appointmentId, status: 'completed' });
    
    // Bước 1: Tính số tiền hoàn
    hoursUntilAppointment = getHoursDifference(NOW(), appointment.appointment_datetime);
    
    if (hoursUntilAppointment >= 24) {
        refundPercentage = 100;
    } else if (hoursUntilAppointment >= 12) {
        refundPercentage = 50;
    } else {
        throw Error("Không thể hoàn tiền cho lịch hẹn hủy trong vòng 12 giờ");
    }
    
    refundAmount = transaction.amount * refundPercentage / 100;
    
    // Bước 2: Gọi API hoàn tiền của cổng thanh toán
    if (transaction.payment_method === 'vnpay') {
        refundResult = callVNPayRefundAPI(transaction, refundAmount);
    } else if (transaction.payment_method === 'momo') {
        refundResult = callMomoRefundAPI(transaction, refundAmount);
    }
    
    // Bước 3: Cập nhật database
    updateTransaction(transaction.id, {
        status: 'refunded',
        refund_amount: refundAmount,
        refund_percentage: refundPercentage,
        refunded_at: new Date()
    });
    
    updateAppointment(appointmentId, {
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date()
    });
    
    // Bước 4: Thông báo
    sendRefundEmail(transaction, refundAmount);
    createNotification(`Đã hoàn ${refundPercentage}% tiền vào tài khoản`);
    notifyDoctor(appointmentId, "Lịch hẹn đã bị hủy");
    
    return { refundAmount, refundPercentage };
}
```

### 2.3 Báo cáo doanh thu

**Tính toán doanh thu:**
```javascript
function calculateRevenue(startDate, endDate, filters = {}) {
    transactions = findTransactions({
        status: 'completed',
        paid_at: between(startDate, endDate),
        ...filters
    });
    
    totalRevenue = 0;
    totalRefunded = 0;
    transactionCount = transactions.length;
    
    for (transaction in transactions) {
        totalRevenue += transaction.amount;
        if (transaction.refund_amount) {
            totalRefunded += transaction.refund_amount;
        }
    }
    
    netRevenue = totalRevenue - totalRefunded;
    
    // Phân chia doanh thu (giả sử hệ thống lấy 20% phí)
    platformFee = netRevenue * 0.20;
    doctorEarnings = netRevenue * 0.80;
    
    return {
        totalRevenue,
        totalRefunded,
        netRevenue,
        platformFee,
        doctorEarnings,
        transactionCount,
        averageTransactionValue: netRevenue / transactionCount
    };
}
```

---

## 3. Logic Thông báo

### 3.1 Các loại thông báo

```javascript
NOTIFICATION_TYPES = {
    // Lịch hẹn
    APPOINTMENT_NEW: 'appointment_new',
    APPOINTMENT_CONFIRMED: 'appointment_confirmed',
    APPOINTMENT_CANCELLED: 'appointment_cancelled',
    APPOINTMENT_REMINDER: 'appointment_reminder',
    APPOINTMENT_STARTED: 'appointment_started',
    APPOINTMENT_COMPLETED: 'appointment_completed',
    
    // Thanh toán
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',
    PAYMENT_REFUNDED: 'payment_refunded',
    
    // Chat
    MESSAGE_NEW: 'message_new',
    
    // Review
    REVIEW_NEW: 'review_new',
    REVIEW_RESPONSE: 'review_response',
    
    // Hồ sơ bệnh án
    MEDICAL_RECORD_NEW: 'medical_record_new',
    MEDICAL_RECORD_UPDATED: 'medical_record_updated',
    
    // Bác sĩ
    DOCTOR_APPROVED: 'doctor_approved',
    DOCTOR_REJECTED: 'doctor_rejected'
};
```

### 3.2 Quy tắc gửi thông báo

**Thông báo trong hệ thống (In-app):**
```javascript
function createNotification(userId, type, data) {
    notification = {
        user_id: userId,
        type: type,
        title: getNotificationTitle(type),
        message: getNotificationMessage(type, data),
        data: JSON.stringify(data),
        is_read: false,
        created_at: new Date()
    };
    
    // Lưu vào database
    savedNotification = saveNotification(notification);
    
    // Gửi real-time qua Socket.io
    io.to(`user_${userId}`).emit('notification', savedNotification);
    
    // Cập nhật unread count
    unreadCount = countUnreadNotifications(userId);
    io.to(`user_${userId}`).emit('unread_count', unreadCount);
    
    return savedNotification;
}
```

**Thông báo qua Email:**
```javascript
function shouldSendEmail(userId, type) {
    // Lấy cài đặt thông báo của user
    settings = getUserNotificationSettings(userId);
    
    // Các loại thông báo LUÔN gửi email
    alwaysSendEmail = [
        'PAYMENT_SUCCESS',
        'APPOINTMENT_CONFIRMED',
        'MEDICAL_RECORD_NEW',
        'DOCTOR_APPROVED',
        'DOCTOR_REJECTED'
    ];
    
    if (alwaysSendEmail.includes(type)) {
        return true;
    }
    
    // Kiểm tra cài đặt của user
    return settings.email_notifications_enabled;
}
```

**Thông báo qua SMS:**
```javascript
function shouldSendSMS(userId, type) {
    settings = getUserNotificationSettings(userId);
    
    // Chỉ gửi SMS cho lịch nhắc nhở quan trọng
    smsTypes = [
        'APPOINTMENT_REMINDER', // 24h trước
        'PAYMENT_SUCCESS'
    ];
    
    if (!smsTypes.includes(type)) {
        return false;
    }
    
    return settings.sms_notifications_enabled;
}
```

### 3.3 Độ ưu tiên thông báo

```javascript
NOTIFICATION_PRIORITY = {
    HIGH: ['APPOINTMENT_REMINDER', 'PAYMENT_REFUNDED', 'APPOINTMENT_CANCELLED'],
    MEDIUM: ['APPOINTMENT_NEW', 'MESSAGE_NEW', 'REVIEW_NEW'],
    LOW: ['MEDICAL_RECORD_UPDATED', 'REVIEW_RESPONSE']
};

function getNotificationPriority(type) {
    if (NOTIFICATION_PRIORITY.HIGH.includes(type)) return 'high';
    if (NOTIFICATION_PRIORITY.MEDIUM.includes(type)) return 'medium';
    return 'low';
}

// Thông báo ưu tiên cao sẽ:
// - Hiển thị ở đầu danh sách
// - Có âm thanh/진동 (trên mobile)
// - Không tự động đánh dấu đã đọc sau 30 ngày
```

### 3.4 Xóa thông báo cũ

```javascript
// Chạy cron job mỗi ngày
function cleanupOldNotifications() {
    thirtyDaysAgo = new Date(NOW() - 30*24*60*60*1000);
    
    // Xóa thông báo đã đọc và cũ hơn 30 ngày
    deleteNotifications({
        is_read: true,
        created_at: lessThan(thirtyDaysAgo)
    });
    
    // Xóa thông báo chưa đọc nhưng cũ hơn 90 ngày (trừ HIGH priority)
    ninetyDaysAgo = new Date(NOW() - 90*24*60*60*1000);
    deleteNotifications({
        is_read: false,
        priority: not('high'),
        created_at: lessThan(ninetyDaysAgo)
    });
}
```

---

## 4. Logic Đánh giá & Review

### 4.1 Quy tắc tạo đánh giá

**Điều kiện để có thể đánh giá:**
```javascript
function canCreateReview(patientId, appointmentId) {
    appointment = findAppointment(appointmentId);
    
    // Kiểm tra 1: Phải là bệnh nhân của lịch hẹn
    if (appointment.patient_id !== patientId) {
        return { allowed: false, reason: "Bạn không phải là bệnh nhân của lịch hẹn này" };
    }
    
    // Kiểm tra 2: Lịch hẹn phải đã hoàn thành
    if (appointment.status !== 'completed') {
        return { allowed: false, reason: "Chỉ có thể đánh giá sau khi hoàn thành buổi khám" };
    }
    
    // Kiểm tra 3: Chưa có đánh giá nào
    existingReview = findReview({
        appointment_id: appointmentId,
        patient_id: patientId
    });
    
    if (existingReview) {
        return { allowed: false, reason: "Bạn đã đánh giá lịch hẹn này rồi" };
    }
    
    // Kiểm tra 4: Trong vòng 30 ngày sau khi hoàn thành
    daysSinceCompleted = getDaysDifference(NOW(), appointment.completed_at);
    if (daysSinceCompleted > 30) {
        return { allowed: false, reason: "Chỉ có thể đánh giá trong vòng 30 ngày sau buổi khám" };
    }
    
    return { allowed: true };
}
```

### 4.2 Tính toán rating của bác sĩ

**Thuật toán tính rating:**
```javascript
function updateDoctorRating(doctorId) {
    // Lấy tất cả đánh giá của bác sĩ
    reviews = findReviews({ doctor_id: doctorId });
    
    if (reviews.length === 0) {
        // Chưa có đánh giá nào
        updateDoctor(doctorId, {
            rating: 0,
            total_reviews: 0
        });
        return;
    }
    
    // Tính trung bình
    totalRating = 0;
    for (review in reviews) {
        totalRating += review.rating;
    }
    
    averageRating = totalRating / reviews.length;
    
    // Làm tròn đến 1 chữ số thập phân (ví dụ: 4.7)
    averageRating = Math.round(averageRating * 10) / 10;
    
    // Cập nhật thông tin bác sĩ
    updateDoctor(doctorId, {
        rating: averageRating,
        total_reviews: reviews.length
    });
    
    return averageRating;
}
```

**Hiển thị phân bố rating:**
```javascript
function getRatingDistribution(doctorId) {
    reviews = findReviews({ doctor_id: doctorId });
    
    distribution = {
        5: 0, // Số lượng đánh giá 5 sao
        4: 0,
        3: 0,
        2: 0,
        1: 0
    };
    
    for (review in reviews) {
        distribution[review.rating]++;
    }
    
    // Tính phần trăm
    total = reviews.length;
    percentages = {
        5: (distribution[5] / total * 100).toFixed(1),
        4: (distribution[4] / total * 100).toFixed(1),
        3: (distribution[3] / total * 100).toFixed(1),
        2: (distribution[2] / total * 100).toFixed(1),
        1: (distribution[1] / total * 100).toFixed(1)
    };
    
    return { distribution, percentages };
}
```

### 4.3 Lọc và sắp xếp đánh giá

**Các tùy chọn lọc:**
```javascript
function getReviews(doctorId, filters = {}) {
    query = { doctor_id: doctorId };
    
    // Lọc theo rating
    if (filters.rating) {
        query.rating = filters.rating; // 1, 2, 3, 4, hoặc 5
    }
    
    // Lọc theo có bình luận hay không
    if (filters.hasComment === true) {
        query.comment = { $ne: null };
    }
    
    // Lọc theo có phản hồi của bác sĩ hay không
    if (filters.hasResponse === true) {
        query.doctor_response = { $ne: null };
    }
    
    reviews = findReviews(query);
    
    // Sắp xếp
    if (filters.sortBy === 'newest') {
        reviews.sort((a, b) => b.created_at - a.created_at);
    } else if (filters.sortBy === 'highest') {
        reviews.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'lowest') {
        reviews.sort((a, b) => a.rating - b.rating);
    } else {
        // Mặc định: Helpful nhất (có thể thêm trường helpful_count)
        reviews.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
    }
    
    return reviews;
}
```

### 4.4 Ẩn danh trong đánh giá

**Logic ẩn danh:**
```javascript
function formatReview(review, currentUserId) {
    // Nếu đánh giá là ẩn danh và người xem không phải tác giả
    if (review.is_anonymous && review.patient_id !== currentUserId) {
        review.patient_name = "Bệnh nhân ẩn danh";
        review.patient_avatar = "/default-avatar.png";
        delete review.patient_id; // Không trả về ID
    }
    
    return review;
}
```

---

## 5. Logic Chat & Tư vấn

### 5.1 Quy tắc chat

**Ai có thể chat với ai:**
```
- Bệnh nhân có thể chat với bác sĩ nếu:
  * Có ít nhất 1 lịch hẹn với bác sĩ đó (bất kỳ trạng thái nào)
  
- Bác sĩ có thể chat với bệnh nhân nếu:
  * Bệnh nhân đã từng đặt lịch với bác sĩ
  
- Admin có thể chat với tất cả users
```

**Kiểm tra quyền chat:**
```javascript
function canChat(userId1, userId2) {
    user1 = findUser(userId1);
    user2 = findUser(userId2);
    
    // Admin có thể chat với mọi người
    if (user1.role === 'admin' || user2.role === 'admin') {
        return true;
    }
    
    // Kiểm tra nếu có bác sĩ và bệnh nhân
    if ((user1.role === 'patient' && user2.role === 'doctor') ||
        (user1.role === 'doctor' && user2.role === 'patient')) {
        
        patientId = user1.role === 'patient' ? userId1 : userId2;
        doctorId = user1.role === 'doctor' ? userId1 : userId2;
        
        // Kiểm tra có lịch hẹn không
        appointment = findAppointment({
            patient_id: patientId,
            doctor_id: doctorId
        });
        
        return appointment !== null;
    }
    
    return false;
}
```

### 5.2 Xử lý tin nhắn real-time

**Socket.io events:**
```javascript
// Client gửi tin nhắn
socket.on('send_message', async (data) => {
    // Validate
    if (!canChat(data.sender_id, data.receiver_id)) {
        socket.emit('error', { message: 'Không có quyền chat' });
        return;
    }
    
    // Lưu tin nhắn
    message = await createChatMessage({
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        message: sanitizeHtml(data.message),
        type: data.type || 'text',
        attachment_url: data.attachment_url
    });
    
    // Gửi cho người nhận qua Socket
    io.to(`user_${data.receiver_id}`).emit('new_message', message);
    
    // Gửi xác nhận cho người gửi
    socket.emit('message_sent', message);
    
    // Tạo notification nếu người nhận offline
    receiverSocket = getSocketByUserId(data.receiver_id);
    if (!receiverSocket) {
        createNotification(data.receiver_id, 'MESSAGE_NEW', {
            sender_name: data.sender_name,
            message_preview: truncate(data.message, 50)
        });
    }
});

// Đánh dấu đã đọc
socket.on('mark_read', async (data) => {
    await markMessagesAsRead(data.sender_id, data.receiver_id);
    
    // Thông báo cho người gửi
    io.to(`user_${data.sender_id}`).emit('messages_read', {
        reader_id: data.receiver_id
    });
});

// Typing indicator
socket.on('typing', (data) => {
    io.to(`user_${data.receiver_id}`).emit('user_typing', {
        user_id: data.sender_id,
        user_name: data.sender_name
    });
});

socket.on('stop_typing', (data) => {
    io.to(`user_${data.receiver_id}`).emit('user_stop_typing', {
        user_id: data.sender_id
    });
});
```

### 5.3 Chia sẻ file trong chat

**Quy tắc upload file:**
```
Loại file cho phép:
- Hình ảnh: .jpg, .jpeg, .png, .gif (max 5MB)
- Tài liệu: .pdf, .doc, .docx (max 10MB)
- File y tế: .dcm (DICOM), .xml (max 20MB)

Quy trình:
1. Upload file lên server
2. Tạo message với type = 'file'
3. Lưu đường dẫn file vào attachment_url
4. Gửi notification cho người nhận
```

**Xử lý upload:**
```javascript
function handleFileUpload(file, senderId, receiverId) {
    // Validate file
    if (!isAllowedFileType(file.mimetype)) {
        throw Error("Loại file không được hỗ trợ");
    }
    
    maxSize = getMaxFileSize(file.mimetype);
    if (file.size > maxSize) {
        throw Error(`File vượt quá kích thước cho phép (${formatFileSize(maxSize)})`);
    }
    
    // Lưu file
    filename = `${Date.now()}_${sanitizeFileName(file.originalname)}`;
    filepath = `/uploads/chat/${senderId}/${filename}`;
    saveFile(file, filepath);
    
    // Tạo message
    message = createChatMessage({
        sender_id: senderId,
        receiver_id: receiverId,
        message: file.originalname,
        type: 'file',
        attachment_url: filepath,
        file_size: file.size,
        file_type: file.mimetype
    });
    
    return message;
}
```

---

## 6. Logic Hồ sơ bệnh án

### 6.1 Tạo hồ sơ bệnh án

**Quy tắc tạo hồ sơ:**
```
- Chỉ bác sĩ mới có thể tạo hồ sơ
- Phải sau khi lịch hẹn hoàn thành (status = 'completed')
- Mỗi lịch hẹn chỉ có 1 hồ sơ bệnh án
- Không thể tạo hồ sơ cho lịch hẹn đã bị hủy
```

**Quy trình tạo:**
```javascript
function createMedicalRecord(doctorId, appointmentId, data) {
    // Validate quyền
    appointment = findAppointment(appointmentId);
    
    if (appointment.doctor_id !== doctorId) {
        throw Error("Bạn không phải bác sĩ của lịch hẹn này");
    }
    
    if (appointment.status !== 'completed') {
        throw Error("Chỉ có thể tạo hồ sơ sau khi hoàn thành buổi khám");
    }
    
    // Kiểm tra đã có hồ sơ chưa
    existing = findMedicalRecord({ appointment_id: appointmentId });
    if (existing) {
        throw Error("Lịch hẹn này đã có hồ sơ bệnh án");
    }
    
    // Validate dữ liệu
    validateMedicalRecord(data);
    
    // Tạo hồ sơ
    medicalRecord = createRecord({
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        doctor_id: doctorId,
        diagnosis: data.diagnosis,
        prescription: JSON.stringify(data.prescription),
        vital_signs: JSON.stringify(data.vital_signs),
        lab_results: data.lab_results,
        notes: data.notes,
        created_at: new Date()
    });
    
    // Gửi email cho bệnh nhân
    sendMedicalRecordEmail(medicalRecord);
    
    // Tạo notification
    createNotification(appointment.patient_id, 'MEDICAL_RECORD_NEW', {
        doctor_name: appointment.doctor_name,
        appointment_date: appointment.appointment_date
    });
    
    return medicalRecord;
}
```

### 6.2 Phân quyền xem hồ sơ

**Quy tắc truy cập:**
```javascript
function canViewMedicalRecord(userId, medicalRecordId) {
    user = findUser(userId);
    record = findMedicalRecord(medicalRecordId);
    
    // Admin có thể xem tất cả
    if (user.role === 'admin') {
        return true;
    }
    
    // Bệnh nhân chỉ xem hồ sơ của mình
    if (user.role === 'patient' && record.patient_id === userId) {
        return true;
    }
    
    // Bác sĩ xem hồ sơ của bệnh nhân mình khám
    if (user.role === 'doctor' && record.doctor_id === userId) {
        return true;
    }
    
    return false;
}
```

### 6.3 Tạo PDF hồ sơ bệnh án

**Nội dung PDF:**
```
1. Header:
   - Logo phòng khám
   - Tên: "HỒ SƠ BỆNH ÁN"
   - Ngày tạo

2. Thông tin bệnh nhân:
   - Họ tên
   - Ngày sinh / Tuổi
   - Giới tính
   - Địa chỉ
   - Số điện thoại

3. Thông tin bác sĩ:
   - Họ tên bác sĩ
   - Chuyên khoa
   - Số điện thoại

4. Thông tin khám:
   - Ngày khám
   - Hình thức: Online/Offline
   - Lý do khám
   - Triệu chứng

5. Chỉ số sinh tồn (Vital Signs):
   - Huyết áp
   - Nhịp tim
   - Nhiệt độ
   - Cân nặng / Chiều cao / BMI

6. Chẩn đoán (Diagnosis):
   - Nội dung chẩn đoán chi tiết

7. Đơn thuốc (Prescription):
   Bảng gồm các cột:
   - STT
   - Tên thuốc
   - Liều lượng
   - Tần suất
   - Số ngày

8. Kết quả xét nghiệm (nếu có)

9. Ghi chú của bác sĩ

10. Chữ ký:
    - Bác sĩ điều trị
    - Ngày ký
```

---

## 7. Logic Phê duyệt bác sĩ

### 7.1 Quy trình đăng ký làm bác sĩ

**Thông tin cần đăng ký:**
```
Thông tin cơ bản:
- full_name
- email
- password
- phone
- date_of_birth
- gender

Thông tin chuyên môn:
- specialty_id (chuyên khoa)
- education (trình độ học vấn)
- experience_years (số năm kinh nghiệm)
- consultation_price (giá khám)
- bio (giới thiệu)
- certifications (JSON: danh sách chứng chỉ)

Tài liệu:
- certificate_images[] (hình ảnh chứng chỉ hành nghề)
- identification_card (CMND/CCCD)
```

**Trạng thái ban đầu:**
```javascript
function registerDoctor(data) {
    // Tạo user
    user = createUser({
        email: data.email,
        password: bcrypt.hash(data.password),
        role: 'doctor',
        is_active: false, // Chưa kích hoạt
        is_verified: false // Chưa verify email
    });
    
    // Tạo doctor profile
    doctor = createDoctor({
        user_id: user.id,
        specialty_id: data.specialty_id,
        education: data.education,
        experience_years: data.experience_years,
        consultation_price: data.consultation_price,
        bio: data.bio,
        certifications: JSON.stringify(data.certifications),
        certificate_images: JSON.stringify(data.certificate_images),
        is_approved: false, // Chờ phê duyệt
        approval_status: 'pending'
    });
    
    // Gửi email xác thực
    sendVerificationEmail(user);
    
    // Thông báo admin có bác sĩ mới đăng ký
    notifyAdmins('DOCTOR_REGISTRATION', {
        doctor_id: doctor.id,
        doctor_name: data.full_name,
        specialty: data.specialty_name
    });
    
    return { user, doctor };
}
```

### 7.2 Quy trình phê duyệt

**Kiểm tra hồ sơ:**
```
Admin kiểm tra:
1. Thông tin cá nhân đầy đủ và chính xác
2. Chứng chỉ hành nghề hợp lệ
3. Kinh nghiệm phù hợp với chuyên khoa
4. Giá khám hợp lý
5. Hình ảnh chứng chỉ rõ ràng

Quyết định:
- Phê duyệt (Approved)
- Từ chối (Rejected)
- Yêu cầu bổ sung (Pending - gửi feedback)
```

**Logic phê duyệt:**
```javascript
function approveDoctor(adminId, doctorId, decision, message = '') {
    doctor = findDoctor(doctorId);
    user = findUser(doctor.user_id);
    
    if (decision === 'approved') {
        // Phê duyệt
        updateDoctor(doctorId, {
            is_approved: true,
            approval_status: 'approved',
            approved_by: adminId,
            approval_date: new Date(),
            approval_message: message
        });
        
        // Kích hoạt tài khoản
        updateUser(doctor.user_id, {
            is_active: true
        });
        
        // Gửi email chúc mừng
        sendDoctorApprovalEmail(user, true, message);
        
        // Tạo notification
        createNotification(doctor.user_id, 'DOCTOR_APPROVED', {
            message: message || 'Chúc mừng! Tài khoản bác sĩ của bạn đã được phê duyệt.'
        });
        
    } else if (decision === 'rejected') {
        // Từ chối
        updateDoctor(doctorId, {
            is_approved: false,
            approval_status: 'rejected',
            approved_by: adminId,
            approval_date: new Date(),
            approval_message: message
        });
        
        // Gửi email từ chối với lý do
        sendDoctorApprovalEmail(user, false, message);
        
        // Tạo notification
        createNotification(doctor.user_id, 'DOCTOR_REJECTED', {
            message: message || 'Hồ sơ đăng ký bác sĩ của bạn chưa được phê duyệt.'
        });
        
    } else if (decision === 'pending') {
        // Yêu cầu bổ sung
        updateDoctor(doctorId, {
            approval_status: 'pending',
            approval_message: message
        });
        
        // Gửi email yêu cầu bổ sung
        sendRequestMoreInfoEmail(user, message);
        
        createNotification(doctor.user_id, 'DOCTOR_REQUEST_INFO', {
            message: message
        });
    }
    
    return doctor;
}
```

---

## 8. Logic Quản lý lịch làm việc

### 8.1 Cấu hình lịch làm việc

**Cấu trúc dữ liệu:**
```javascript
// Trong bảng doctors
{
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours: "08:00-17:00",
    time_slot_duration: 30, // phút
    max_patients_per_day: 20
}
```

**Tạo khung giờ làm việc:**
```javascript
function generateAvailableTimeSlots(doctorId, date) {
    doctor = findDoctor(doctorId);
    
    // Kiểm tra ngày có trong working_days không
    dayOfWeek = getDayOfWeek(date); // 'monday', 'tuesday', ...
    if (!doctor.working_days.includes(dayOfWeek)) {
        return []; // Bác sĩ không làm việc ngày này
    }
    
    // Parse working_hours
    [startHour, endHour] = parseTimeRange(doctor.working_hours);
    
    // Tạo danh sách time slots
    timeSlots = generateTimeSlots(
        startHour,
        endHour,
        doctor.time_slot_duration
    );
    // Ví dụ: ["08:00-08:30", "08:30-09:00", "09:00-09:30", ...]
    
    // Lấy các lịch hẹn đã đặt trong ngày
    bookedAppointments = findAppointments({
        doctor_id: doctorId,
        appointment_date: date,
        status: ['pending', 'confirmed', 'in_progress']
    });
    
    // Đánh dấu time slots đã đặt
    availableSlots = [];
    for (slot in timeSlots) {
        isBooked = bookedAppointments.some(apt => apt.time_slot === slot);
        availableSlots.push({
            time_slot: slot,
            available: !isBooked
        });
    }
    
    return availableSlots;
}
```

### 8.2 Nghỉ phép / Không làm việc

**Quản lý ngày nghỉ:**
```javascript
// Tạo bảng doctor_leaves
{
    doctor_id: INT,
    leave_date: DATE,
    leave_type: ENUM('vacation', 'sick', 'emergency', 'other'),
    reason: TEXT,
    created_at: TIMESTAMP
}

function addDoctorLeave(doctorId, leaveDate, leaveType, reason) {
    // Kiểm tra đã có lịch hẹn nào trong ngày nghỉ chưa
    appointments = findAppointments({
        doctor_id: doctorId,
        appointment_date: leaveDate,
        status: ['pending', 'confirmed']
    });
    
    if (appointments.length > 0) {
        throw Error(`Không thể nghỉ phép vì đã có ${appointments.length} lịch hẹn trong ngày này`);
    }
    
    // Tạo bản ghi nghỉ phép
    leave = createDoctorLeave({
        doctor_id: doctorId,
        leave_date: leaveDate,
        leave_type: leaveType,
        reason: reason
    });
    
    return leave;
}

function isDoctor Available(doctorId, date) {
    // Kiểm tra có trong danh sách nghỉ không
    leave = findDoctorLeave({
        doctor_id: doctorId,
        leave_date: date
    });
    
    return leave === null;
}
```

### 8.3 Tự động hủy lịch hẹn chưa thanh toán

**Quy tắc tự động hủy:**
```
- Lịch hẹn với status = 'pending' (chưa thanh toán)
- Quá 30 phút kể từ khi tạo
- Sẽ tự động chuyển sang status = 'cancelled'
```

**Cron job:**
```javascript
// Chạy mỗi 10 phút
function autoCancelUnpaidAppointments() {
    thirtyMinutesAgo = new Date(NOW() - 30*60*1000);
    
    unpaidAppointments = findAppointments({
        status: 'pending',
        is_paid: false,
        created_at: lessThan(thirtyMinutesAgo)
    });
    
    for (appointment in unpaidAppointments) {
        updateAppointment(appointment.id, {
            status: 'cancelled',
            cancellation_reason: 'Tự động hủy do không thanh toán trong 30 phút',
            cancelled_at: new Date()
        });
        
        // Thông báo cho bệnh nhân
        createNotification(appointment.patient_id, 'APPOINTMENT_CANCELLED', {
            reason: 'Lịch hẹn đã bị hủy tự động do chưa thanh toán'
        });
    }
    
    console.log(`Đã hủy ${unpaidAppointments.length} lịch hẹn chưa thanh toán`);
}
```

---

## Tổng kết

### Các nghiệp vụ chính đã được định nghĩa:

1. ✅ **Đặt lịch khám:** Kiểm tra khung giờ trống, validate lịch làm việc, tạo lịch hẹn
2. ✅ **Thanh toán:** Tích hợp VNPAY/Momo, xác thực chữ ký, xử lý callback, hoàn tiền
3. ✅ **Thông báo:** Multi-channel (in-app, email, SMS), độ ưu tiên, real-time
4. ✅ **Đánh giá:** Quy tắc đánh giá, tính rating, phản hồi của bác sĩ
5. ✅ **Chat:** Real-time messaging, phân quyền chat, chia sẻ file
6. ✅ **Hồ sơ bệnh án:** Tạo hồ sơ, phân quyền xem, xuất PDF
7. ✅ **Phê duyệt bác sĩ:** Đăng ký, kiểm duyệt, phê duyệt/từ chối
8. ✅ **Quản lý lịch làm việc:** Khung giờ làm việc, nghỉ phép, tự động hủy

### Các quy tắc nghiệp vụ quan trọng:

- ⏰ Lịch hẹn chưa thanh toán tự động hủy sau 30 phút
- 💰 Hoàn tiền theo thời gian hủy (100% nếu >24h, 50% nếu 12-24h, 0% nếu <12h)
- ⭐ Rating tính theo trung bình đánh giá, làm tròn 1 chữ số thập phân
- 🔔 Nhắc lịch hẹn 24h và 2h trước giờ khám
- 📝 Chỉ tạo hồ sơ bệnh án sau khi hoàn thành buổi khám
- ✉️ Gửi email cho các sự kiện quan trọng (thanh toán, xác nhận, hồ sơ bệnh án)

---

**Document version:** 1.0  
**Last updated:** November 19, 2025  
**Status:** ✅ Complete
