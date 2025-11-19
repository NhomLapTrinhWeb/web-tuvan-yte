# 🚀 Quick Setup Guide

## ✅ What's Been Fixed

All critical issues from the code review have been resolved:

1. ✅ **Email Integration** - Verification & password reset
2. ✅ **Socket.IO** - Real-time notifications
3. ✅ **Rate Limiting** - API protection
4. ✅ **Validators** - Input validation
5. ✅ **Cron Jobs** - Appointment reminders & cleanup
6. ✅ **Security** - Helmet.js headers
7. ✅ **Error Handling** - Centralized error management
8. ✅ **Constants** - No more magic numbers
9. ✅ **Database Fields** - All missing fields added

## 📋 Prerequisites

- Node.js 16+ installed
- MySQL 8+ installed and running
- Git installed

## 🛠️ Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env` file and update values:
```env
# Database (REQUIRED)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospital_booking

# Email (for sending notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Get from Google Account settings
EMAIL_FROM=noreply@healthcare.com

# JWT Secret (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=3000
NODE_ENV=development
```

### 3. Setup Database
```bash
# Create database and tables
npm run db:setup

# Or manually:
npm run db:init    # Create database
npm run db:create  # Create tables
npm run db:seed:all  # Seed data
```

### 4. Run Migration (Add new fields)
```bash
node database/migrations/001_add_appointment_fields.js
```

### 5. Start Server
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

You should see:
```
✅ Initializing cron jobs...
✅ Cron jobs initialized successfully
✅ Server is running on http://localhost:3000
✅ Database connected successfully
✅ Database synced
```

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-11-19T...",
  "version": "1.0.0"
}
```

### Test Auth Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "full_name": "Test User",
    "phone": "0912345678",
    "role": "patient"
  }'
```

### Test Auth Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

## 📁 Project Structure

```
web-tuvan-yte/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── jobs/            # ✨ NEW: Cron jobs
├── middleware/      # Middleware functions
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # ✨ NEW: Constants & helpers
├── validators/      # Input validation
├── database/
│   └── migrations/  # ✨ NEW: Database migrations
└── server.js        # Entry point
```

## 🔧 Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run db:setup       # Setup complete database
npm run db:reset       # Reset and reseed database
npm run db:init        # Create database only
npm run db:seed:all    # Seed all data
```

## 🌟 New Features

### 1. Cron Jobs (Background Tasks)
- ⏰ **Appointment Reminders** - Run every 15 minutes
- 🚫 **No-show Check** - Run every hour
- 🧹 **Cleanup Old Notifications** - Run daily at 3 AM

### 2. Real-time Notifications
WebSocket events:
- `notification:new` - New notification received
- `chat:new_message` - New chat message
- `appointment:confirmed` - Appointment confirmed

### 3. Rate Limiting
- General API: 100 requests/15 min
- Auth: 5 requests/15 min
- Payment: 10 requests/15 min

### 4. Security Headers (Helmet.js)
- XSS Protection
- Content Security Policy
- HSTS
- Frame Guard

## 📚 API Documentation

Full API documentation: `docs/API_DOCUMENTATION.md`

Key endpoints:
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/v1/doctors` - List doctors
- `POST /api/v1/appointments` - Book appointment
- `GET /api/v1/appointments/my` - My appointments

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Access denied for user 'root'@'localhost'
```
**Solution:** Check DB credentials in `.env`

### Email Not Sending
```
Email service not configured
```
**Solution:** Configure EMAIL_USER and EMAIL_PASSWORD in `.env`

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution:** Change PORT in `.env` or kill existing process:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

### Migration Error
```
Column 'meeting_link' already exists
```
**Solution:** Migration already applied, skip it

## 📞 Support

For issues or questions:
1. Check `FIXES_COMPLETED.md` for details
2. Review `docs/API_DOCUMENTATION.md`
3. Check `docs/BACKEND_STRUCTURE.md`

## 🎯 Next Steps

1. ✅ Server is running
2. ⬜ Test all API endpoints
3. ⬜ Configure production environment
4. ⬜ Setup domain & SSL certificate
5. ⬜ Deploy to production server
6. ⬜ Setup monitoring & logging

---

**Project Status:** ✅ Ready for Development & Testing
**Production Ready:** 🟡 After configuration & testing
