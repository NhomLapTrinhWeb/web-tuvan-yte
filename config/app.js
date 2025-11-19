// Cấu hình app chung
module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
  uploadDir: './public/uploads',
  maxFileSize: 5 * 1024 * 1024, // 5MB
};
