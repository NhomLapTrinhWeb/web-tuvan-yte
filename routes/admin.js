// Route admin
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// const { requireAdmin } = require('../middleware/auth'); // <--- Tạm khóa cái này lại
const upload = require('../middleware/upload');

// ... (Các dòng import ở trên giữ nguyên)

// --- 👇 THAY THẾ ĐOẠN MIDDLEWARE CŨ BẰNG ĐOẠN NÀY 👇 ---
router.use((req, res, next) => {
    // 1. Hợp nhất: Lấy user từ Session (nếu dùng Backdoor) HOẶC từ Token (nếu Login thật)
    // (req.user có được nhờ optionalAuth trong server.js)
    const currentUser = req.session.user || req.user;

    // 2. Kiểm tra xem có user không và có phải admin không
    if (currentUser && currentUser.role === 'admin') {

        // Gán ngược lại vào req.user để các controller phía sau dùng
        req.user = currentUser;

        // Cấu hình Layout Admin
        res.locals.layout = 'layouts/admin';

        return next();
    }

    // 3. Nếu không thỏa mãn thì chặn
    return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập quyền Admin'
    });
});
// -----------------------------------------------------------

// ... (Các dòng router.get/post phía dưới giữ nguyên)

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Posts Management
router.get('/posts', adminController.showPostsList);
// 👇 THÊM DÒNG NÀY (Để lấy dữ liệu JSON) 👇
router.get('/posts/list', adminController.getPosts);
// ---------------------------------------------
router.get('/posts/create', adminController.showCreatePostForm);
router.get('/posts/edit/:id', adminController.showEditPostForm);

// ... (bên dưới phần Dashboard)

// --- QUẢN LÝ NGƯỜI DÙNG ---
// 1. Đường dẫn hiện trang web
router.get('/users', adminController.showUsersList);

// 2. Đường dẫn API lấy dữ liệu JSON (để tránh lỗi Unexpected token '<')
router.get('/users/list', adminController.getUsers);

// 3. Đường dẫn khóa/mở khóa tài khoản
router.post('/users/:id/toggle-status', adminController.toggleUserStatus);

// Upload handlers
router.post('/posts/create', upload.single('thumbnail'), adminController.createPost);
router.put('/posts/:id', upload.single('thumbnail'), adminController.updatePost);
router.delete('/posts/:id', adminController.deletePost);

// --- QUẢN LÝ BÁC SĨ ---
// 1. Hiện trang web
router.get('/doctors', adminController.showDoctorsList);

// 2. Lấy dữ liệu JSON
router.get('/doctors/list', adminController.getDoctors);

// 3. Duyệt hoặc Khóa bác sĩ
router.put('/doctors/:id/approve', adminController.approveDoctor);


// --- QUẢN LÝ LỊCH HẸN ---
// 1. Hiện trang web
router.get('/appointments', adminController.showAppointmentsList);

// 2. Lấy dữ liệu JSON
router.get('/appointments/list', adminController.getAppointments);

// ...

// Image upload for CKEditor
router.post('/upload-image', upload.single('upload'), adminController.uploadImage);

module.exports = router;