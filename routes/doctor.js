const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// Middleware kiểm tra quyền Bác sĩ
const requireDoctor = (req, res, next) => {
    // Hỗ trợ cả Session (Dev) và Token (Prod)
    const user = req.user || (req.session && req.session.user);

    if (user && user.role === 'doctor') {
        req.user = user; // Gán lại để controller dùng
        // Cấu hình Layout riêng cho Bác sĩ
        res.locals.layout = 'layouts/doctor';
        return next();
    }

    // Nếu không phải bác sĩ
    return res.redirect('/login');
};

// Áp dụng bảo vệ cho tất cả các route bên dưới
router.use(requireDoctor);

// Dashboard
router.get('/dashboard', doctorController.getDashboard);

// 👇 THÊM 2 DÒNG NÀY:
router.get('/appointments', doctorController.getAppointments);
router.post('/appointments/:id/status', doctorController.updateAppointmentStatus);
// 👇 THÊM DÒNG NÀY:
router.get('/patients', doctorController.getPatients);
module.exports = router;