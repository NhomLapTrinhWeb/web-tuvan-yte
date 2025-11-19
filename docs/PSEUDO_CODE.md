# PSEUDO-CODE - HỆ THỐNG TƯ VẤN Y TẾ

## Mục lục
1. [Thuật toán kiểm tra khung giờ trống](#1-thuật-toán-kiểm-tra-khung-giờ-trống)
2. [Thuật toán đặt lịch khám](#2-thuật-toán-đặt-lịch-khám)
3. [Thuật toán xử lý thanh toán](#3-thuật-toán-xử-lý-thanh-toán)
4. [Thuật toán tính rating](#4-thuật-toán-tính-rating)
5. [Thuật toán tạo time slots](#5-thuật-toán-tạo-time-slots)
6. [Thuật toán hoàn tiền](#6-thuật-toán-hoàn-tiền)
7. [Thuật toán matching bệnh nhân-bác sĩ](#7-thuật-toán-matching-bệnh-nhân-bác-sĩ)
8. [Thuật toán gửi thông báo](#8-thuật-toán-gửi-thông-báo)

---

## 1. Thuật toán kiểm tra khung giờ trống

### Mục đích
Kiểm tra một khung giờ cụ thể có khả dụng để đặt lịch hay không.

### Input
- `doctorId`: ID của bác sĩ
- `date`: Ngày cần kiểm tra (YYYY-MM-DD)
- `timeSlot`: Khung giờ cần kiểm tra (format: "HH:MM-HH:MM")

### Output
- `true`: Khung giờ trống, có thể đặt
- `false`: Khung giờ đã bị đặt hoặc không hợp lệ

### Pseudo-code

```
FUNCTION isTimeSlotAvailable(doctorId, date, timeSlot)
    // Bước 1: Parse time slot thành phút
    [requestStart, requestEnd] = parseTimeSlotToMinutes(timeSlot)
    
    // Bước 2: Query database lấy tất cả lịch hẹn trong ngày
    appointments = SELECT * FROM appointments 
                   WHERE doctor_id = doctorId 
                   AND appointment_date = date
                   AND status IN ('pending', 'confirmed', 'in_progress')
    
    // Bước 3: Kiểm tra overlap với từng lịch hẹn
    FOR EACH appointment IN appointments DO
        [existingStart, existingEnd] = parseTimeSlotToMinutes(appointment.time_slot)
        
        // Kiểm tra overlap
        IF isOverlap(requestStart, requestEnd, existingStart, existingEnd) THEN
            RETURN false  // Có xung đột
        END IF
    END FOR
    
    // Bước 4: Không có xung đột
    RETURN true
END FUNCTION


FUNCTION isOverlap(start1, end1, start2, end2)
    // Hai khoảng overlap khi: start1 < end2 AND start2 < end1
    RETURN (start1 < end2) AND (start2 < end1)
END FUNCTION


FUNCTION parseTimeSlotToMinutes(timeSlot)
    // Parse "09:00-10:00" thành [540, 600] (phút từ 00:00)
    parts = SPLIT(timeSlot, '-')
    startTime = parts[0]  // "09:00"
    endTime = parts[1]    // "10:00"
    
    [startHour, startMinute] = SPLIT(startTime, ':')
    [endHour, endMinute] = SPLIT(endTime, ':')
    
    startInMinutes = INTEGER(startHour) * 60 + INTEGER(startMinute)
    endInMinutes = INTEGER(endHour) * 60 + INTEGER(endMinute)
    
    RETURN [startInMinutes, endInMinutes]
END FUNCTION
```

### Ví dụ minh họa

```
Input:
- doctorId = 5
- date = "2025-11-20"
- timeSlot = "09:00-10:00"

Giả sử bác sĩ đã có lịch hẹn:
- Lịch 1: "08:30-09:30"
- Lịch 2: "10:00-11:00"

Xử lý:
- requestStart = 540 (9:00 = 9*60 + 0)
- requestEnd = 600 (10:00 = 10*60 + 0)

Kiểm tra với Lịch 1:
- existingStart = 510 (8:30 = 8*60 + 30)
- existingEnd = 570 (9:30 = 9*60 + 30)
- isOverlap(540, 600, 510, 570) = (540 < 570) AND (510 < 600) = TRUE
- => Có xung đột, RETURN false

Kết quả: false (không thể đặt)
```

### Độ phức tạp
- **Time Complexity:** O(n) - với n là số lịch hẹn trong ngày
- **Space Complexity:** O(1)

---

## 2. Thuật toán đặt lịch khám

### Mục đích
Tạo một lịch hẹn mới sau khi validate đầy đủ các điều kiện.

### Input
- `patientId`: ID bệnh nhân
- `doctorId`: ID bác sĩ
- `appointmentDate`: Ngày hẹn
- `timeSlot`: Khung giờ
- `appointmentType`: "online" hoặc "offline"
- `reason`: Lý do khám
- `symptoms`: Triệu chứng

### Output
- `appointment`: Object lịch hẹn đã tạo
- `error`: Object lỗi nếu không thành công

### Pseudo-code

```
FUNCTION createAppointment(patientId, doctorId, appointmentDate, timeSlot, appointmentType, reason, symptoms)
    // === PHASE 1: VALIDATION ===
    
    // 1.1: Validate patient tồn tại
    patient = SELECT * FROM patients WHERE user_id = patientId
    IF patient IS NULL THEN
        RETURN ERROR("Bệnh nhân không tồn tại")
    END IF
    
    // 1.2: Validate doctor tồn tại và được phê duyệt
    doctor = SELECT * FROM doctors WHERE user_id = doctorId
    IF doctor IS NULL THEN
        RETURN ERROR("Bác sĩ không tồn tại")
    END IF
    
    IF doctor.is_approved = false OR doctor.is_active = false THEN
        RETURN ERROR("Bác sĩ chưa được phê duyệt hoặc không hoạt động")
    END IF
    
    // 1.3: Validate ngày không phải quá khứ
    today = CURRENT_DATE()
    IF appointmentDate < today THEN
        RETURN ERROR("Không thể đặt lịch cho ngày trong quá khứ")
    END IF
    
    // 1.4: Validate time slot format
    IF NOT isValidTimeSlotFormat(timeSlot) THEN
        RETURN ERROR("Khung giờ không đúng định dạng HH:MM-HH:MM")
    END IF
    
    // === PHASE 2: BUSINESS LOGIC CHECKS ===
    
    // 2.1: Kiểm tra bác sĩ có làm việc vào ngày này không
    dayOfWeek = getDayOfWeek(appointmentDate)  // "monday", "tuesday", ...
    IF dayOfWeek NOT IN doctor.working_days THEN
        RETURN ERROR("Bác sĩ không làm việc vào ngày này")
    END IF
    
    // 2.2: Kiểm tra khung giờ có nằm trong giờ làm việc không
    [workStart, workEnd] = parseTimeSlotToMinutes(doctor.working_hours)
    [reqStart, reqEnd] = parseTimeSlotToMinutes(timeSlot)
    
    IF reqStart < workStart OR reqEnd > workEnd THEN
        RETURN ERROR("Khung giờ không nằm trong giờ làm việc của bác sĩ")
    END IF
    
    // 2.3: Kiểm tra bác sĩ có nghỉ phép không
    leave = SELECT * FROM doctor_leaves 
            WHERE doctor_id = doctorId 
            AND leave_date = appointmentDate
    
    IF leave IS NOT NULL THEN
        RETURN ERROR("Bác sĩ nghỉ phép trong ngày này")
    END IF
    
    // 2.4: Kiểm tra khung giờ có trống không
    IF NOT isTimeSlotAvailable(doctorId, appointmentDate, timeSlot) THEN
        RETURN ERROR("Khung giờ này đã được đặt")
    END IF
    
    // 2.5: Kiểm tra số lượng bệnh nhân trong ngày
    appointmentCount = COUNT(*) FROM appointments
                       WHERE doctor_id = doctorId
                       AND appointment_date = appointmentDate
                       AND status IN ('pending', 'confirmed')
    
    IF appointmentCount >= doctor.max_patients_per_day THEN
        RETURN ERROR("Bác sĩ đã đủ số lượng bệnh nhân trong ngày")
    END IF
    
    // === PHASE 3: CREATE APPOINTMENT ===
    
    BEGIN TRANSACTION
    
    TRY
        // 3.1: Tạo appointment record
        appointment = INSERT INTO appointments (
            patient_id,
            doctor_id,
            appointment_date,
            time_slot,
            appointment_type,
            reason,
            symptoms,
            status,
            is_paid,
            payment_status,
            created_at
        ) VALUES (
            patientId,
            doctorId,
            appointmentDate,
            timeSlot,
            appointmentType,
            reason,
            symptoms,
            'pending',
            false,
            'unpaid',
            CURRENT_TIMESTAMP()
        )
        
        // 3.2: Tạo notification cho bệnh nhân
        CREATE NOTIFICATION(
            user_id: patientId,
            type: 'APPOINTMENT_NEW',
            title: 'Đặt lịch thành công',
            message: 'Vui lòng thanh toán trong vòng 30 phút để xác nhận',
            data: { appointment_id: appointment.id }
        )
        
        // 3.3: Tạo notification cho bác sĩ
        CREATE NOTIFICATION(
            user_id: doctorId,
            type: 'APPOINTMENT_NEW',
            title: 'Có lịch hẹn mới',
            message: 'Bạn có lịch hẹn mới chờ xác nhận',
            data: { appointment_id: appointment.id }
        )
        
        // 3.4: Gửi email cho bệnh nhân
        SEND EMAIL(
            to: patient.email,
            subject: 'Xác nhận đặt lịch khám',
            template: 'appointment-created',
            data: { appointment, doctor }
        )
        
        COMMIT TRANSACTION
        
        RETURN { success: true, appointment: appointment }
        
    CATCH error
        ROLLBACK TRANSACTION
        RETURN ERROR("Lỗi khi tạo lịch hẹn: " + error.message)
    END TRY
END FUNCTION


FUNCTION isValidTimeSlotFormat(timeSlot)
    // Kiểm tra format "HH:MM-HH:MM"
    regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    RETURN MATCH(timeSlot, regex)
END FUNCTION


FUNCTION getDayOfWeek(date)
    // Chuyển date thành tên ngày trong tuần
    days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    dayIndex = date.getDay()  // 0-6
    RETURN days[dayIndex]
END FUNCTION
```

### Flow diagram

```
START
  |
  v
[Validate Patient] --> [Patient not found] --> RETURN ERROR
  |
  | [Patient valid]
  v
[Validate Doctor] --> [Doctor invalid] --> RETURN ERROR
  |
  | [Doctor valid]
  v
[Check Date] --> [Past date] --> RETURN ERROR
  |
  | [Future date]
  v
[Check Working Days] --> [Not working] --> RETURN ERROR
  |
  | [Working day]
  v
[Check Working Hours] --> [Outside hours] --> RETURN ERROR
  |
  | [Within hours]
  v
[Check Doctor Leave] --> [On leave] --> RETURN ERROR
  |
  | [Available]
  v
[Check Time Slot] --> [Not available] --> RETURN ERROR
  |
  | [Available]
  v
[Check Daily Limit] --> [Limit reached] --> RETURN ERROR
  |
  | [Under limit]
  v
[Create Appointment]
  |
  v
[Send Notifications]
  |
  v
[Send Email]
  |
  v
RETURN SUCCESS
```

---

## 3. Thuật toán xử lý thanh toán

### 3.1 Tạo URL thanh toán (VNPAY)

```
FUNCTION createVNPayPaymentUrl(transactionId, amount, orderInfo)
    // 1. Lấy thông tin transaction
    transaction = SELECT * FROM transactions WHERE id = transactionId
    
    // 2. Chuẩn bị parameters
    params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: VNPAY_TMN_CODE,
        vnp_Amount: amount * 100,  // Chuyển sang đơn vị nhỏ nhất (VNĐ * 100)
        vnp_CreateDate: formatDate(NOW(), 'YYYYMMDDHHmmss'),
        vnp_CurrCode: 'VND',
        vnp_IpAddr: getClientIpAddress(),
        vnp_Locale: 'vn',
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_ReturnUrl: VNPAY_RETURN_URL,
        vnp_TxnRef: transaction.transaction_code
    }
    
    // 3. Sắp xếp params theo alphabet
    sortedParams = sortObjectByKey(params)
    
    // 4. Tạo query string
    signData = createQueryString(sortedParams)
    
    // 5. Tạo chữ ký HMAC SHA512
    signature = HMAC_SHA512(signData, VNPAY_HASH_SECRET)
    
    // 6. Thêm signature vào params
    params.vnp_SecureHash = signature
    
    // 7. Tạo URL đầy đủ
    paymentUrl = VNPAY_URL + '?' + createQueryString(params)
    
    RETURN paymentUrl
END FUNCTION


FUNCTION sortObjectByKey(obj)
    keys = GET_KEYS(obj)
    SORT(keys)  // Sắp xếp alphabet
    
    sortedObj = {}
    FOR EACH key IN keys DO
        sortedObj[key] = obj[key]
    END FOR
    
    RETURN sortedObj
END FUNCTION


FUNCTION createQueryString(obj)
    parts = []
    FOR EACH (key, value) IN obj DO
        parts.PUSH(key + '=' + encodeURIComponent(value))
    END FOR
    
    RETURN JOIN(parts, '&')
END FUNCTION
```

### 3.2 Xác thực callback từ VNPAY

```
FUNCTION verifyVNPayCallback(queryParams)
    // 1. Tách chữ ký ra
    receivedSignature = queryParams.vnp_SecureHash
    DELETE queryParams.vnp_SecureHash
    DELETE queryParams.vnp_SecureHashType
    
    // 2. Sắp xếp params
    sortedParams = sortObjectByKey(queryParams)
    
    // 3. Tạo chuỗi sign data
    signData = createQueryString(sortedParams)
    
    // 4. Tính chữ ký expected
    expectedSignature = HMAC_SHA512(signData, VNPAY_HASH_SECRET)
    
    // 5. So sánh chữ ký
    IF receivedSignature != expectedSignature THEN
        RETURN { valid: false, error: "Chữ ký không hợp lệ" }
    END IF
    
    // 6. Kiểm tra mã phản hồi
    responseCode = queryParams.vnp_ResponseCode
    transactionCode = queryParams.vnp_TxnRef
    
    // 7. Lấy transaction từ DB
    transaction = SELECT * FROM transactions 
                  WHERE transaction_code = transactionCode
    
    IF transaction IS NULL THEN
        RETURN { valid: false, error: "Transaction không tồn tại" }
    END IF
    
    // 8. Xử lý kết quả
    BEGIN TRANSACTION
    
    IF responseCode = '00' THEN
        // Thanh toán thành công
        UPDATE transactions 
        SET status = 'completed',
            payment_info = JSON(queryParams),
            paid_at = CURRENT_TIMESTAMP()
        WHERE id = transaction.id
        
        // Cập nhật appointment
        UPDATE appointments
        SET status = 'confirmed',
            is_paid = true,
            payment_status = 'paid'
        WHERE id = transaction.appointment_id
        
        // Gửi notifications
        CALL sendPaymentSuccessNotifications(transaction)
        
        COMMIT TRANSACTION
        RETURN { valid: true, success: true, message: "Thanh toán thành công" }
    ELSE
        // Thanh toán thất bại
        UPDATE transactions
        SET status = 'failed',
            payment_info = JSON(queryParams)
        WHERE id = transaction.id
        
        COMMIT TRANSACTION
        RETURN { valid: true, success: false, message: "Thanh toán thất bại" }
    END IF
END FUNCTION
```

### 3.3 Kiểm tra trạng thái thanh toán

```
FUNCTION checkPaymentStatus(transactionId)
    transaction = SELECT * FROM transactions WHERE id = transactionId
    
    IF transaction IS NULL THEN
        RETURN { found: false }
    END IF
    
    result = {
        found: true,
        status: transaction.status,
        amount: transaction.amount,
        paid_at: transaction.paid_at,
        payment_method: transaction.payment_method
    }
    
    IF transaction.status = 'completed' THEN
        appointment = SELECT * FROM appointments 
                      WHERE id = transaction.appointment_id
        result.appointment_status = appointment.status
    END IF
    
    RETURN result
END FUNCTION
```

---

## 4. Thuật toán tính rating

### 4.1 Cập nhật rating của bác sĩ

```
FUNCTION updateDoctorRating(doctorId)
    // 1. Lấy tất cả reviews của bác sĩ
    reviews = SELECT rating FROM reviews 
              WHERE doctor_id = doctorId
    
    reviewCount = COUNT(reviews)
    
    // 2. Trường hợp chưa có review
    IF reviewCount = 0 THEN
        UPDATE doctors
        SET rating = 0,
            total_reviews = 0
        WHERE user_id = doctorId
        
        RETURN { rating: 0, total: 0 }
    END IF
    
    // 3. Tính tổng rating
    totalRating = 0
    FOR EACH review IN reviews DO
        totalRating = totalRating + review.rating
    END FOR
    
    // 4. Tính trung bình
    averageRating = totalRating / reviewCount
    
    // 5. Làm tròn đến 1 chữ số thập phân
    roundedRating = ROUND(averageRating * 10) / 10
    
    // 6. Cập nhật vào database
    UPDATE doctors
    SET rating = roundedRating,
        total_reviews = reviewCount
    WHERE user_id = doctorId
    
    RETURN { rating: roundedRating, total: reviewCount }
END FUNCTION
```

### 4.2 Tính phân bố rating (Rating Distribution)

```
FUNCTION calculateRatingDistribution(doctorId)
    // 1. Khởi tạo distribution
    distribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
    }
    
    // 2. Lấy tất cả reviews
    reviews = SELECT rating FROM reviews WHERE doctor_id = doctorId
    total = COUNT(reviews)
    
    IF total = 0 THEN
        RETURN {
            distribution: distribution,
            percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            total: 0
        }
    END IF
    
    // 3. Đếm số lượng mỗi rating
    FOR EACH review IN reviews DO
        distribution[review.rating] = distribution[review.rating] + 1
    END FOR
    
    // 4. Tính phần trăm
    percentages = {}
    FOR rating FROM 5 DOWN TO 1 DO
        count = distribution[rating]
        percentage = (count / total) * 100
        percentages[rating] = ROUND(percentage * 10) / 10  // Làm tròn 1 chữ số
    END FOR
    
    RETURN {
        distribution: distribution,
        percentages: percentages,
        total: total
    }
END FUNCTION
```

### Ví dụ minh họa

```
Giả sử bác sĩ có 10 đánh giá:
- 5 sao: 6 reviews
- 4 sao: 2 reviews
- 3 sao: 1 review
- 2 sao: 1 review
- 1 sao: 0 reviews

Tính rating trung bình:
totalRating = (5*6) + (4*2) + (3*1) + (2*1) + (1*0) = 30 + 8 + 3 + 2 = 43
averageRating = 43 / 10 = 4.3

Phân bố phần trăm:
- 5 sao: 6/10 = 60%
- 4 sao: 2/10 = 20%
- 3 sao: 1/10 = 10%
- 2 sao: 1/10 = 10%
- 1 sao: 0/10 = 0%
```

---

## 5. Thuật toán tạo time slots

### Mục đích
Tạo danh sách các khung giờ làm việc có thể đặt lịch.

### Input
- `startTime`: Giờ bắt đầu làm việc (HH:MM)
- `endTime`: Giờ kết thúc làm việc (HH:MM)
- `duration`: Độ dài mỗi khung giờ (phút)

### Output
- Array các time slots (["08:00-08:30", "08:30-09:00", ...])

### Pseudo-code

```
FUNCTION generateTimeSlots(startTime, endTime, duration)
    // 1. Chuyển đổi sang phút
    startMinutes = timeToMinutes(startTime)
    endMinutes = timeToMinutes(endTime)
    
    // 2. Khởi tạo array kết quả
    timeSlots = []
    
    // 3. Tạo các time slots
    currentStart = startMinutes
    
    WHILE currentStart + duration <= endMinutes DO
        currentEnd = currentStart + duration
        
        // Chuyển đổi lại sang HH:MM
        startTimeStr = minutesToTime(currentStart)
        endTimeStr = minutesToTime(currentEnd)
        
        // Thêm vào kết quả
        timeSlot = startTimeStr + '-' + endTimeStr
        timeSlots.PUSH(timeSlot)
        
        // Di chuyển đến slot tiếp theo
        currentStart = currentEnd
    END WHILE
    
    RETURN timeSlots
END FUNCTION


FUNCTION timeToMinutes(time)
    // Chuyển "08:30" thành 510 (8*60 + 30)
    [hour, minute] = SPLIT(time, ':')
    RETURN INTEGER(hour) * 60 + INTEGER(minute)
END FUNCTION


FUNCTION minutesToTime(minutes)
    // Chuyển 510 thành "08:30"
    hour = FLOOR(minutes / 60)
    minute = minutes MOD 60
    
    // Thêm leading zero nếu cần
    hourStr = hour < 10 ? '0' + hour : hour
    minuteStr = minute < 10 ? '0' + minute : minute
    
    RETURN hourStr + ':' + minuteStr
END FUNCTION
```

### Ví dụ

```
Input:
- startTime = "08:00"
- endTime = "12:00"
- duration = 30 (phút)

Xử lý:
- startMinutes = 480 (8 * 60)
- endMinutes = 720 (12 * 60)

Vòng lặp:
1. currentStart = 480, currentEnd = 510 → "08:00-08:30"
2. currentStart = 510, currentEnd = 540 → "08:30-09:00"
3. currentStart = 540, currentEnd = 570 → "09:00-09:30"
4. currentStart = 570, currentEnd = 600 → "09:30-10:00"
5. currentStart = 600, currentEnd = 630 → "10:00-10:30"
6. currentStart = 630, currentEnd = 660 → "10:30-11:00"
7. currentStart = 660, currentEnd = 690 → "11:00-11:30"
8. currentStart = 690, currentEnd = 720 → "11:30-12:00"
9. currentStart = 720 → Dừng (720 + 30 > 720)

Output:
[
    "08:00-08:30",
    "08:30-09:00",
    "09:00-09:30",
    "09:30-10:00",
    "10:00-10:30",
    "10:30-11:00",
    "11:00-11:30",
    "11:30-12:00"
]
```

---

## 6. Thuật toán hoàn tiền

### Mục đích
Tính toán số tiền hoàn lại dựa trên thời gian hủy lịch.

### Quy tắc hoàn tiền
- Hủy >= 24 giờ trước: Hoàn 100%
- Hủy 12-24 giờ trước: Hoàn 50%
- Hủy < 12 giờ trước: Không hoàn tiền

### Pseudo-code

```
FUNCTION calculateRefund(appointmentId, currentTime)
    // 1. Lấy thông tin appointment
    appointment = SELECT * FROM appointments WHERE id = appointmentId
    
    IF appointment IS NULL THEN
        RETURN ERROR("Lịch hẹn không tồn tại")
    END IF
    
    // 2. Kiểm tra điều kiện hủy
    IF appointment.status != 'confirmed' THEN
        RETURN ERROR("Chỉ có thể hủy lịch hẹn đã xác nhận")
    END IF
    
    IF appointment.is_paid = false THEN
        RETURN ERROR("Lịch hẹn chưa thanh toán")
    END IF
    
    // 3. Tính thời gian còn lại
    appointmentDateTime = COMBINE(appointment.appointment_date, appointment.time_slot.start)
    hoursUntilAppointment = HOURS_DIFFERENCE(appointmentDateTime, currentTime)
    
    // 4. Kiểm tra có thể hoàn tiền không
    IF hoursUntilAppointment < 12 THEN
        RETURN {
            canRefund: false,
            refundPercentage: 0,
            refundAmount: 0,
            message: "Không thể hoàn tiền cho lịch hẹn hủy trong vòng 12 giờ"
        }
    END IF
    
    // 5. Tính phần trăm hoàn tiền
    refundPercentage = 0
    IF hoursUntilAppointment >= 24 THEN
        refundPercentage = 100
    ELSE IF hoursUntilAppointment >= 12 THEN
        refundPercentage = 50
    END IF
    
    // 6. Lấy thông tin transaction
    transaction = SELECT * FROM transactions
                  WHERE appointment_id = appointmentId
                  AND status = 'completed'
    
    IF transaction IS NULL THEN
        RETURN ERROR("Không tìm thấy giao dịch thanh toán")
    END IF
    
    // 7. Tính số tiền hoàn
    refundAmount = transaction.amount * refundPercentage / 100
    
    RETURN {
        canRefund: true,
        refundPercentage: refundPercentage,
        refundAmount: refundAmount,
        originalAmount: transaction.amount,
        hoursUntilAppointment: hoursUntilAppointment
    }
END FUNCTION


FUNCTION processRefund(appointmentId, reason)
    // 1. Tính toán refund
    refundInfo = calculateRefund(appointmentId, CURRENT_TIME())
    
    IF refundInfo.canRefund = false THEN
        RETURN ERROR(refundInfo.message)
    END IF
    
    // 2. Lấy transaction
    transaction = SELECT * FROM transactions
                  WHERE appointment_id = appointmentId
                  AND status = 'completed'
    
    BEGIN TRANSACTION
    
    TRY
        // 3. Gọi API refund của payment gateway
        IF transaction.payment_method = 'vnpay' THEN
            refundResult = callVNPayRefundAPI(transaction, refundInfo.refundAmount)
        ELSE IF transaction.payment_method = 'momo' THEN
            refundResult = callMomoRefundAPI(transaction, refundInfo.refundAmount)
        END IF
        
        IF refundResult.success = false THEN
            THROW ERROR("Lỗi khi gọi API hoàn tiền")
        END IF
        
        // 4. Cập nhật transaction
        UPDATE transactions
        SET status = 'refunded',
            refund_amount = refundInfo.refundAmount,
            refund_percentage = refundInfo.refundPercentage,
            refunded_at = CURRENT_TIMESTAMP()
        WHERE id = transaction.id
        
        // 5. Cập nhật appointment
        UPDATE appointments
        SET status = 'cancelled',
            cancellation_reason = reason,
            cancelled_at = CURRENT_TIMESTAMP()
        WHERE id = appointmentId
        
        // 6. Gửi notifications
        appointment = SELECT * FROM appointments WHERE id = appointmentId
        
        // Thông báo cho bệnh nhân
        CREATE NOTIFICATION(
            user_id: appointment.patient_id,
            type: 'PAYMENT_REFUNDED',
            title: 'Đã hoàn tiền',
            message: 'Đã hoàn ' + refundInfo.refundPercentage + '% tiền vào tài khoản',
            data: { refund_amount: refundInfo.refundAmount }
        )
        
        // Thông báo cho bác sĩ
        CREATE NOTIFICATION(
            user_id: appointment.doctor_id,
            type: 'APPOINTMENT_CANCELLED',
            title: 'Lịch hẹn đã bị hủy',
            message: 'Bệnh nhân đã hủy lịch hẹn',
            data: { appointment_id: appointmentId, reason: reason }
        )
        
        // Gửi email
        SEND EMAIL(
            to: appointment.patient_email,
            subject: 'Xác nhận hoàn tiền',
            template: 'refund-confirmation',
            data: refundInfo
        )
        
        COMMIT TRANSACTION
        
        RETURN {
            success: true,
            refundAmount: refundInfo.refundAmount,
            refundPercentage: refundInfo.refundPercentage
        }
        
    CATCH error
        ROLLBACK TRANSACTION
        RETURN ERROR("Lỗi khi xử lý hoàn tiền: " + error.message)
    END TRY
END FUNCTION
```

---

## 7. Thuật toán matching bệnh nhân-bác sĩ

### Mục đích
Đề xuất danh sách bác sĩ phù hợp với nhu cầu của bệnh nhân.

### Input
- `patientId`: ID bệnh nhân
- `specialtyId`: ID chuyên khoa (optional)
- `preferredDate`: Ngày ưu tiên (optional)
- `preferredTime`: Khung giờ ưu tiên (optional)
- `maxPrice`: Giá tối đa (optional)

### Output
- Danh sách bác sĩ được sắp xếp theo độ phù hợp

### Pseudo-code

```
FUNCTION findMatchingDoctors(patientId, filters)
    // 1. Query cơ bản
    query = "SELECT * FROM doctors WHERE is_approved = true AND is_active = true"
    
    // 2. Thêm filters
    IF filters.specialtyId IS NOT NULL THEN
        query += " AND specialty_id = " + filters.specialtyId
    END IF
    
    IF filters.maxPrice IS NOT NULL THEN
        query += " AND consultation_price <= " + filters.maxPrice
    END IF
    
    doctors = EXECUTE(query)
    
    // 3. Lọc theo ngày ưu tiên (nếu có)
    IF filters.preferredDate IS NOT NULL THEN
        dayOfWeek = getDayOfWeek(filters.preferredDate)
        doctors = FILTER(doctors, doctor => doctor.working_days.includes(dayOfWeek))
    END IF
    
    // 4. Tính điểm phù hợp cho mỗi bác sĩ
    scoredDoctors = []
    
    FOR EACH doctor IN doctors DO
        score = 0
        
        // 4.1: Điểm rating (0-50 điểm)
        score += doctor.rating * 10
        
        // 4.2: Điểm số lượng đánh giá (0-20 điểm)
        reviewScore = MIN(doctor.total_reviews / 5, 20)
        score += reviewScore
        
        // 4.3: Điểm kinh nghiệm (0-15 điểm)
        experienceScore = MIN(doctor.experience_years, 15)
        score += experienceScore
        
        // 4.4: Điểm giá cả (0-10 điểm)
        // Giá rẻ hơn = điểm cao hơn
        IF filters.maxPrice IS NOT NULL THEN
            priceScore = (1 - doctor.consultation_price / filters.maxPrice) * 10
            score += priceScore
        END IF
        
        // 4.5: Điểm khả dụng (0-5 điểm)
        IF filters.preferredDate IS NOT NULL THEN
            availableSlots = generateAvailableTimeSlots(doctor.id, filters.preferredDate)
            IF LENGTH(availableSlots) > 0 THEN
                score += 5
            END IF
        END IF
        
        scoredDoctors.PUSH({
            doctor: doctor,
            score: score
        })
    END FOR
    
    // 5. Sắp xếp theo điểm giảm dần
    SORT(scoredDoctors, (a, b) => b.score - a.score)
    
    // 6. Trả về danh sách bác sĩ
    result = []
    FOR EACH item IN scoredDoctors DO
        result.PUSH(item.doctor)
    END FOR
    
    RETURN result
END FUNCTION
```

### Bảng tính điểm

| Tiêu chí | Điểm tối đa | Công thức |
|----------|-------------|-----------|
| Rating | 50 | rating × 10 (0-5 → 0-50) |
| Số lượng review | 20 | MIN(total_reviews / 5, 20) |
| Kinh nghiệm | 15 | MIN(experience_years, 15) |
| Giá cả | 10 | (1 - price / maxPrice) × 10 |
| Khả dụng | 5 | 5 nếu có slot trống, 0 nếu không |
| **Tổng** | **100** | |

### Ví dụ

```
Bác sĩ A:
- Rating: 4.5 → 45 điểm
- Reviews: 30 → 6 điểm (30/5 = 6)
- Experience: 10 năm → 10 điểm
- Price: 300k (maxPrice: 500k) → 4 điểm ((1 - 300/500) × 10 = 4)
- Có slot trống → 5 điểm
=> Tổng: 70 điểm

Bác sĩ B:
- Rating: 4.8 → 48 điểm
- Reviews: 100 → 20 điểm (100/5 = 20, giới hạn 20)
- Experience: 20 năm → 15 điểm (giới hạn 15)
- Price: 450k → 1 điểm ((1 - 450/500) × 10 = 1)
- Không có slot trống → 0 điểm
=> Tổng: 84 điểm

Kết quả: Bác sĩ B được xếp hạng cao hơn (84 > 70)
```

---

## 8. Thuật toán gửi thông báo

### 8.1 Quyết định kênh gửi thông báo

```
FUNCTION sendNotification(userId, type, data)
    // 1. Lấy cài đặt thông báo của user
    settings = SELECT * FROM notification_settings WHERE user_id = userId
    
    IF settings IS NULL THEN
        // Sử dụng cài đặt mặc định
        settings = {
            in_app_enabled: true,
            email_enabled: true,
            sms_enabled: false
        }
    END IF
    
    // 2. Tạo notification trong database (luôn tạo)
    notification = INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        is_read,
        created_at
    ) VALUES (
        userId,
        type,
        getNotificationTitle(type),
        getNotificationMessage(type, data),
        JSON(data),
        false,
        CURRENT_TIMESTAMP()
    )
    
    // 3. Gửi real-time qua Socket.io (nếu user online)
    IF settings.in_app_enabled = true THEN
        SOCKET_EMIT('user_' + userId, 'notification', notification)
        
        // Cập nhật unread count
        unreadCount = COUNT(*) FROM notifications 
                      WHERE user_id = userId AND is_read = false
        SOCKET_EMIT('user_' + userId, 'unread_count', unreadCount)
    END IF
    
    // 4. Quyết định có gửi email không
    shouldEmail = shouldSendEmail(type, settings)
    IF shouldEmail = true THEN
        ENQUEUE_EMAIL_JOB({
            to: getUserEmail(userId),
            template: getEmailTemplate(type),
            data: data
        })
    END IF
    
    // 5. Quyết định có gửi SMS không
    shouldSMS = shouldSendSMS(type, settings)
    IF shouldSMS = true THEN
        ENQUEUE_SMS_JOB({
            to: getUserPhone(userId),
            message: getSMSMessage(type, data)
        })
    END IF
    
    RETURN notification
END FUNCTION


FUNCTION shouldSendEmail(type, settings)
    // Các loại thông báo LUÔN gửi email (bỏ qua cài đặt)
    criticalTypes = [
        'PAYMENT_SUCCESS',
        'APPOINTMENT_CONFIRMED',
        'MEDICAL_RECORD_NEW',
        'DOCTOR_APPROVED',
        'DOCTOR_REJECTED',
        'PAYMENT_REFUNDED'
    ]
    
    IF criticalTypes.includes(type) THEN
        RETURN true
    END IF
    
    // Các loại khác: Tùy theo cài đặt user
    RETURN settings.email_enabled
END FUNCTION


FUNCTION shouldSendSMS(type, settings)
    // Chỉ gửi SMS cho các thông báo cực kỳ quan trọng
    smsTypes = [
        'APPOINTMENT_REMINDER',  // 24h trước lịch hẹn
        'PAYMENT_SUCCESS'
    ]
    
    IF NOT smsTypes.includes(type) THEN
        RETURN false
    END IF
    
    RETURN settings.sms_enabled
END FUNCTION
```

### 8.2 Batch notification (gửi hàng loạt)

```
FUNCTION sendBulkNotifications(userIds, type, data)
    // 1. Validate
    IF LENGTH(userIds) = 0 THEN
        RETURN ERROR("Danh sách user rỗng")
    END IF
    
    // 2. Tạo notifications hàng loạt
    notifications = []
    FOR EACH userId IN userIds DO
        notification = {
            user_id: userId,
            type: type,
            title: getNotificationTitle(type),
            message: getNotificationMessage(type, data),
            data: JSON(data),
            is_read: false,
            created_at: CURRENT_TIMESTAMP()
        }
        notifications.PUSH(notification)
    END FOR
    
    // 3. Insert batch vào database
    BEGIN TRANSACTION
    INSERT_BULK INTO notifications VALUES notifications
    COMMIT TRANSACTION
    
    // 4. Gửi real-time cho users online
    FOR EACH userId IN userIds DO
        SOCKET_EMIT('user_' + userId, 'notification', notification)
    END FOR
    
    // 5. Enqueue email jobs (nếu cần)
    emailJobs = []
    FOR EACH userId IN userIds DO
        settings = getUserNotificationSettings(userId)
        IF shouldSendEmail(type, settings) THEN
            emailJobs.PUSH({
                to: getUserEmail(userId),
                template: getEmailTemplate(type),
                data: data
            })
        END IF
    END FOR
    
    IF LENGTH(emailJobs) > 0 THEN
        ENQUEUE_BULK_EMAIL(emailJobs)
    END IF
    
    RETURN {
        success: true,
        count: LENGTH(userIds),
        notifications_created: LENGTH(notifications),
        emails_queued: LENGTH(emailJobs)
    }
END FUNCTION
```

### 8.3 Notification scheduler (lên lịch gửi)

```
FUNCTION scheduleNotification(userId, type, data, sendAt)
    // 1. Validate thời gian gửi
    IF sendAt <= CURRENT_TIME() THEN
        RETURN ERROR("Thời gian gửi phải trong tương lai")
    END IF
    
    // 2. Tạo scheduled notification
    scheduledNotification = INSERT INTO scheduled_notifications (
        user_id,
        type,
        data,
        send_at,
        status,
        created_at
    ) VALUES (
        userId,
        type,
        JSON(data),
        sendAt,
        'pending',
        CURRENT_TIMESTAMP()
    )
    
    RETURN scheduledNotification
END FUNCTION


// Cron job chạy mỗi phút
FUNCTION processScheduledNotifications()
    now = CURRENT_TIME()
    
    // Lấy notifications cần gửi
    pendingNotifications = SELECT * FROM scheduled_notifications
                           WHERE status = 'pending'
                           AND send_at <= now
    
    FOR EACH scheduled IN pendingNotifications DO
        TRY
            // Gửi notification
            sendNotification(scheduled.user_id, scheduled.type, JSON.parse(scheduled.data))
            
            // Cập nhật trạng thái
            UPDATE scheduled_notifications
            SET status = 'sent',
                sent_at = CURRENT_TIMESTAMP()
            WHERE id = scheduled.id
            
        CATCH error
            // Đánh dấu failed
            UPDATE scheduled_notifications
            SET status = 'failed',
                error_message = error.message
            WHERE id = scheduled.id
        END TRY
    END FOR
END FUNCTION
```

---

## Tổng kết

### Thuật toán đã triển khai:

1. ✅ **Kiểm tra khung giờ trống:** O(n) - Kiểm tra overlap với các lịch hẹn hiện có
2. ✅ **Đặt lịch khám:** 3 phases validation → business logic → creation
3. ✅ **Xử lý thanh toán:** Tạo URL, verify signature HMAC, xử lý callback
4. ✅ **Tính rating:** Average rating + phân bố phần trăm
5. ✅ **Tạo time slots:** Chia nhỏ khung giờ làm việc theo duration
6. ✅ **Hoàn tiền:** Tính % hoàn tiền theo thời gian hủy
7. ✅ **Matching bệnh nhân-bác sĩ:** Scoring system với 5 tiêu chí
8. ✅ **Gửi thông báo:** Multi-channel với logic quyết định kênh

### Độ phức tạp:

| Thuật toán | Time | Space | Note |
|------------|------|-------|------|
| isTimeSlotAvailable | O(n) | O(1) | n = số lịch hẹn trong ngày |
| createAppointment | O(n) | O(1) | n = số lịch hẹn cần check |
| updateDoctorRating | O(m) | O(1) | m = số reviews của bác sĩ |
| generateTimeSlots | O(k) | O(k) | k = số slots (duration dependent) |
| findMatchingDoctors | O(d log d) | O(d) | d = số bác sĩ (do sorting) |

---

**Document version:** 1.0  
**Last updated:** November 19, 2025  
**Status:** ✅ Complete
