# Database Migrations

## How to Run Migrations

### Migration 001: Add Appointment Fields
Adds missing fields to appointments table: `meeting_link`, `meeting_room_id`, `reminder_sent`, `confirmed_at`

```bash
node database/migrations/001_add_appointment_fields.js
```

### Check if migration is needed
```sql
-- Run this query to check existing columns
DESCRIBE appointments;
```

### Manual SQL (if needed)
```sql
ALTER TABLE appointments 
ADD COLUMN meeting_link VARCHAR(500) DEFAULT NULL COMMENT 'Link Zoom/Google Meet cho online',
ADD COLUMN meeting_room_id VARCHAR(100) DEFAULT NULL COMMENT 'ID phòng video call',
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE COMMENT 'Đã gửi reminder chưa',
ADD COLUMN confirmed_at TIMESTAMP NULL COMMENT 'Thời gian xác nhận';
```

## Migration History

| Version | Date | Description | Status |
|---------|------|-------------|--------|
| 001 | 2025-11-19 | Add appointment fields | ✅ Ready |

## Notes
- Always backup database before running migrations
- Run migrations in order (001, 002, 003...)
- Test on development database first
