const express = require('express');
const router = express.Router();
// Chú ý: chữ 'a' thường để khớp tên file
const appointmentController = require('../controllers/appointmentController');

// 1. Xem danh sách lịch hẹn (Đường dẫn gốc: /appointments)
// Hàm này tương ứng với hàm index trong controller
router.get('/', appointmentController.index);

// 2. Xem form đặt lịch (Đường dẫn: /appointments/booking)
router.get('/booking', appointmentController.create);

// 3. Xử lý đặt lịch (POST)
router.post('/booking', appointmentController.store);

// ❌ DÒNG GÂY LỖI: Bạn hãy xóa dòng gọi .history đi nếu còn
// router.get('/history', appointmentController.history);

module.exports = router;