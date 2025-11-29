// Entry point
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const helmet = require('helmet');
require('dotenv').config();
const { optionalAuth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const appConfig = require('./config/app');
const sequelize = require('./config/database');
const { generalLimiter, authLimiter, paymentLimiter } = require('./middleware/rateLimitMiddleware');
const NotificationService = require('./services/NotificationService');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// Session
app.use(session({
  secret: appConfig.sessionSecret || 'secret_key_tam_thoi', // Fallback nếu config lỗi
  resave: false,
  saveUninitialized: true, // Sửa thành true để đảm bảo session luôn được tạo
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// --- 🔥 QUAN TRỌNG: MIDDLEWARE TỰ ĐỘNG ĐĂNG NHẬP & CẤU HÌNH VIEW ---
//app.use((req, res, next) => {
//    // 1. AUTO-LOGIN: Ép luôn thành Admin (Bất chấp mọi thứ)
//    if (!req.session.user) {
//        req.session.user = {
//            id: 1,
//            email: 'admin@hospital.vn',
//            full_name: 'Developer Admin',
//            role: 'admin',
//            is_active: true
//        };
//        console.log('⚡ AUTO-LOGIN: Đã cấp quyền Admin!');
//    }
//
//    // 2. CẤU HÌNH VIEW (Bắt buộc phải có để chạy Header/Sidebar)
//    res.locals.user = req.session.user;
//    res.locals.currentPath = req.path; // <--- Dòng này bị thiếu trong ảnh của bạn
//
//    next();
//});
// -------------------------------------------------------------------

// Thay vào đó, chỉ giữ lại đoạn cấu hình biến cục bộ này thôi:
// ... (Sau đoạn app.use(session...))

// 1. Kích hoạt tính năng đọc Token từ Cookie cho toàn bộ web
app.use(optionalAuth);

// 2. Middleware gán thông tin User ra ngoài giao diện
app.use((req, res, next) => {
    // Ưu tiên 1: Lấy từ Session (Dành cho Admin/Dev)
    if (req.session.user) {
        res.locals.user = req.session.user;
    }
    // Ưu tiên 2: Lấy từ Token Cookie (Dành cho Bệnh nhân thật)
    else if (req.user) {
        res.locals.user = req.user;
    }
    // Không có gì hết
    else {
        res.locals.user = null;
    }

    // Biến cho Header Admin
    res.locals.currentPath = req.path;

    next();
});

// ... (Các đoạn routes phía dưới giữ nguyên)
// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/payment', paymentLimiter);
app.use('/api/v1', generalLimiter);

// Routes
app.use('/', require('./routes/index'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/v1', require('./routes/api'));
app.use('/api/payment', require('./routes/payment'));
app.use('/admin', require('./routes/admin'));
app.use('/appointments', require('./routes/appointment'));
app.use('/doctor', require('./routes/doctor'));
app.use('/medical-records', require('./routes/medicalRecord'));

// Error handling middleware
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

// Database Connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
    return sequelize.sync();
  })
  .then(() => {
    console.log('✅ Database synced');
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
  });

// Socket.io
require('./socket/chatSocket')(io);
require('./socket/voiceCallSocket')(io);
app.set('io', io);
NotificationService.setIO(io);

// Cron Jobs
if (process.env.NODE_ENV !== 'test') {
  const Scheduler = require('./jobs/scheduler');
  Scheduler.init();
}

// Start server
const PORT = appConfig.port || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = app;