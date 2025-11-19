# Backend API Structure Overview

## 📁 Project Structure

```
web-tuvan-yte/
│
├── config/
│   ├── database.js          # Database connection
│   ├── app.js               # App configuration
│   └── jwt.js               # JWT configuration
│
├── models/
│   ├── index.js             # Sequelize initialization
│   ├── User.js
│   ├── Patient.js
│   ├── Doctor.js
│   ├── Specialty.js
│   ├── DoctorSchedule.js
│   ├── Appointment.js
│   ├── MedicalRecord.js
│   ├── Transaction.js
│   ├── Review.js
│   ├── Notification.js
│   ├── ChatMessage.js
│   ├── Post.js
│   ├── Category.js
│   └── Contact.js
│
├── controllers/
│   ├── authController.js
│   ├── appointmentController.js
│   └── api/
│       ├── userController.js
│       ├── doctorController.js
│       ├── medicalRecordController.js
│       ├── paymentController.js
│       ├── reviewController.js
│       ├── chatController.js
│       ├── notificationController.js
│       ├── specialtyController.js
│       └── adminController.js
│
├── services/
│   ├── AppointmentService.js    # Booking business logic
│   ├── PaymentService.js        # Payment processing
│   ├── NotificationService.js   # Push notifications
│   ├── EmailService.js          # Email sending
│   ├── SmsService.js            # SMS notifications
│   ├── VideoCallService.js      # Video call integration
│   └── PdfService.js            # PDF generation
│
├── middleware/
│   ├── authMiddleware.js        # JWT authentication
│   ├── validationMiddleware.js  # Request validation
│   ├── rateLimitMiddleware.js   # API rate limiting
│   ├── errorMiddleware.js       # Error handling
│   └── uploadMiddleware.js      # File upload
│
├── routes/
│   ├── api.js                   # API v1 routes
│   ├── index.js                 # Web routes
│   ├── admin.js
│   ├── appointment.js
│   └── chat.js
│
├── validators/
│   ├── authValidator.js
│   ├── appointmentValidator.js
│   ├── userValidator.js
│   └── index.js
│
├── utils/
│   ├── tokenUtils.js            # JWT token generation
│   ├── dateUtils.js             # Date formatting
│   ├── emailTemplates.js        # Email templates
│   └── helpers.js               # Helper functions
│
├── database/
│   ├── schema.sql               # Database schema
│   ├── seed.sql                 # Sample data
│   └── migrations/              # Database migrations
│
├── docs/
│   ├── API_DOCUMENTATION.md     # API docs
│   └── README.md                # Database docs
│
├── public/                      # Static files
├── views/                       # EJS templates
├── tests/                       # Unit & Integration tests
│
├── .env                         # Environment variables
├── .gitignore
├── package.json
└── server.js                    # Entry point
```

---

## 🔑 Key Components

### 1. **Controllers** (Request Handlers)
- Handle HTTP requests/responses
- Call services for business logic
- Return formatted JSON responses
- Validate input data

### 2. **Services** (Business Logic)
- Core business logic
- Database operations
- External API calls
- Reusable functions

### 3. **Middleware**
- **Authentication:** JWT token verification
- **Authorization:** Role-based access control
- **Validation:** Request data validation
- **Rate Limiting:** Prevent API abuse
- **Error Handling:** Centralized error management

### 4. **Models** (Data Layer)
- Sequelize ORM models
- Database schema definition
- Relationships between tables
- Data validation rules

### 5. **Routes** (API Endpoints)
- RESTful API structure
- Route grouping by resource
- Middleware application
- API versioning (v1)

---

## 🔐 Authentication Flow

```
1. User Login
   └─> POST /api/v1/auth/login
       └─> Validate credentials
           └─> Generate JWT token
               └─> Return token + user info

2. Protected Request
   └─> Include token in header: Authorization: Bearer {token}
       └─> Middleware extracts & verifies token
           └─> Attach user to req.user
               └─> Continue to controller

3. Token Refresh
   └─> POST /api/v1/auth/refresh
       └─> Generate new token
```

---

## 📋 API Endpoint Summary

### Authentication (7 endpoints)
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login
- POST `/auth/logout` - Logout
- GET `/auth/verify-email` - Verify email
- POST `/auth/forgot-password` - Request password reset
- POST `/auth/reset-password` - Reset password
- POST `/auth/refresh` - Refresh token

### Users (4 endpoints)
- GET `/users/me` - Get current user
- PUT `/users/me` - Update profile
- POST `/users/me/avatar` - Upload avatar
- POST `/users/me/change-password` - Change password

### Doctors (10 endpoints)
- GET `/doctors` - Search doctors
- GET `/doctors/:id` - Get doctor detail
- GET `/doctors/:id/availability` - Check availability
- GET `/doctors/:id/reviews` - Get reviews
- GET `/doctors/me/schedules` - Get own schedules
- POST `/doctors/me/schedules` - Update schedules
- GET `/doctors/me/statistics` - Get statistics

### Appointments (9 endpoints)
- POST `/appointments` - Create appointment
- GET `/appointments/my` - Patient's appointments
- GET `/appointments/:id` - Get detail
- POST `/appointments/:id/cancel` - Cancel
- GET `/appointments/doctor/my` - Doctor's appointments
- POST `/appointments/:id/confirm` - Confirm (doctor)
- POST `/appointments/:id/reject` - Reject (doctor)
- POST `/appointments/:id/complete` - Complete (doctor)

### Medical Records (6 endpoints)
- POST `/medical-records` - Create record
- PUT `/medical-records/:id` - Update record
- GET `/medical-records/my` - Get patient's records
- GET `/medical-records/:id` - Get detail
- GET `/medical-records/:id/download` - Download PDF
- POST `/medical-records/:id/attachments` - Upload files

### Payments (5 endpoints)
- POST `/payments` - Create payment
- POST `/payments/callback/vnpay` - VNPAY webhook
- POST `/payments/callback/momo` - Momo webhook
- GET `/payments/:id` - Get payment status
- POST `/payments/:id/refund` - Request refund

### Reviews (4 endpoints)
- POST `/reviews` - Create review
- PUT `/reviews/:id` - Update review
- DELETE `/reviews/:id` - Delete review
- POST `/reviews/:id/response` - Doctor response

### Chat (5 endpoints)
- GET `/chat/conversations` - Get conversations
- GET `/chat/messages/:user_id` - Get messages
- POST `/chat/messages` - Send message
- POST `/chat/messages/upload` - Send file
- POST `/chat/messages/read` - Mark as read

### Notifications (4 endpoints)
- GET `/notifications` - Get notifications
- POST `/notifications/:id/read` - Mark as read
- POST `/notifications/read-all` - Mark all as read
- DELETE `/notifications/:id` - Delete notification

### Admin (15+ endpoints)
- Dashboard, Users, Doctors, Specialties, Appointments, Transactions management

**Total: 80+ API Endpoints**

---

## 🎯 Business Logic Highlights

### Appointment Booking Logic

```javascript
// Step-by-step booking process
1. Validate doctor exists and is approved
2. Check if time slot is available
   ├─ Check doctor's schedule for that day
   ├─ Verify time is within working hours
   ├─ Check if slot is already booked
   └─ Check max patients per slot limit
3. Create appointment (status: pending)
4. Create payment transaction
5. Send notifications (to doctor & patient)
6. Return appointment + payment info
```

### Time Slot Availability Logic

```javascript
// Algorithm to check slot availability
1. Get target date & extract day_of_week
2. Query doctor_schedules WHERE
   - doctor_id = X
   - day_of_week = Y
   - is_available = true
3. For each schedule:
   - Generate all possible time slots
   - Example: 08:00-12:00, 30min slots
     => [08:00-08:30, 08:30-09:00, ..., 11:30-12:00]
4. Query existing appointments for that date
5. Mark booked slots as unavailable
6. Return available slots
```

### Payment Flow

```javascript
// Payment processing flow
1. Patient creates appointment
2. System generates payment transaction
3. Redirect to payment gateway (VNPAY/Momo)
4. User completes payment
5. Payment gateway calls webhook
6. System verifies payment
7. Update transaction status to 'paid'
8. Update appointment status to 'confirmed'
9. Send confirmation notification
```

---

## 🔒 Security Measures

### 1. Authentication
- JWT tokens with 24h expiration
- Secure password hashing (bcrypt, cost factor 10)
- Email verification required
- Password reset with time-limited tokens

### 2. Authorization
- Role-based access control (RBAC)
- Resource ownership validation
- API endpoint protection by role

### 3. Data Protection
- SQL injection prevention (Sequelize ORM)
- XSS protection (input sanitization)
- CSRF protection
- Rate limiting (prevent DDoS)

### 4. API Security
- HTTPS only in production
- CORS configuration
- Request validation
- Error message sanitization (no sensitive data leak)

---

## 📊 Database Optimization

### Indexes Strategy
```sql
-- Appointment booking queries
CREATE INDEX idx_doctor_date_time 
  ON appointments(doctor_id, appointment_date, time_slot);

-- Doctor search queries
CREATE INDEX idx_specialty ON doctors(specialty_id);
CREATE INDEX idx_rating ON doctors(rating_average);
CREATE INDEX idx_approved ON doctors(is_approved);

-- Chat queries
CREATE INDEX idx_conversation 
  ON chat_messages(sender_id, receiver_id, created_at);

-- Notification queries
CREATE INDEX idx_user_read 
  ON notifications(user_id, is_read);
```

### Query Optimization
- Use `SELECT` with specific columns (avoid `SELECT *`)
- Pagination for large datasets
- Eager loading with `include` (avoid N+1 queries)
- Database connection pooling

---

## 🚀 Performance Considerations

### 1. Caching Strategy
```javascript
// Redis caching for frequently accessed data
- Doctor list (cache 5 minutes)
- Specialties list (cache 1 hour)
- Doctor availability (cache 1 minute)
```

### 2. Database Connection Pool
```javascript
{
  max: 5,        // Maximum connections
  min: 0,        // Minimum connections
  acquire: 30000, // Max time to get connection
  idle: 10000    // Max idle time
}
```

### 3. API Response Time
- Target: < 200ms for read operations
- Target: < 500ms for write operations
- Use indexes for fast queries
- Paginate large result sets

---

## 🧪 Testing Strategy

### Unit Tests
- Service layer logic
- Utility functions
- Validation schemas

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- Complete user journeys
- Booking flow
- Payment flow

---

## 📦 Deployment Checklist

### Environment Variables
```env
NODE_ENV=production
PORT=3000
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
VNPAY_TMN_CODE=your_vnpay_code
MOMO_PARTNER_CODE=your_momo_code
EMAIL_SERVICE_KEY=your_email_key
```

### Pre-deployment
- [ ] Run database migrations
- [ ] Seed initial data (specialties)
- [ ] Test all API endpoints
- [ ] Setup SSL certificate
- [ ] Configure CORS
- [ ] Setup monitoring (PM2, New Relic)
- [ ] Setup logging (Winston, Morgan)
- [ ] Backup strategy

---

## 📈 Scalability Considerations

### Horizontal Scaling
- Stateless API (JWT tokens)
- Load balancer (Nginx)
- Multiple server instances

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Use caching layer

### Database Scaling
- Read replicas for queries
- Write to master database
- Database sharding (if needed)

---

## 🔧 Development Tools

### Recommended Extensions
- Postman/Insomnia (API testing)
- Sequelize CLI (migrations)
- Nodemon (auto-restart)
- ESLint (code quality)
- Prettier (code formatting)

### Useful Commands
```bash
# Development
npm run dev

# Database
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Testing
npm test
npm run test:coverage

# Production
npm start
pm2 start server.js --name healthcare-api
```

---

**Documentation Version:** 1.0.0  
**Last Updated:** November 19, 2025  
**API Base URL:** `http://localhost:3000/api/v1`
