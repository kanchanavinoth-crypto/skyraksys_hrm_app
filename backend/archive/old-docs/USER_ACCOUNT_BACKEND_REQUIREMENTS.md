# User Account Management - Backend API Requirements

## 🎯 Overview

This document specifies the backend API endpoints required to replace the mock data in the User Account Management Page with real functionality.

---

## 📡 Required API Endpoints

### 1. Login History

#### GET `/api/users/:userId/login-history`

**Description:** Retrieve recent login attempts for a user

**Request:**
```http
GET /api/users/123/login-history?limit=10
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 10, max: 100)
- `from` (optional): Start date (ISO 8601)
- `to` (optional): End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 123,
      "timestamp": "2025-10-24T10:30:00Z",
      "ipAddress": "192.168.1.100",
      "device": "Chrome on Windows 11",
      "browser": "Chrome 118",
      "os": "Windows 11",
      "location": {
        "city": "Mumbai",
        "country": "India",
        "latitude": 19.0760,
        "longitude": 72.8777
      },
      "success": true,
      "failureReason": null
    },
    {
      "id": 2,
      "userId": 123,
      "timestamp": "2025-10-23T14:15:00Z",
      "ipAddress": "103.50.23.45",
      "device": "Safari on iPhone 14",
      "browser": "Safari 16",
      "os": "iOS 17",
      "location": {
        "city": "Delhi",
        "country": "India",
        "latitude": 28.6139,
        "longitude": 77.2090
      },
      "success": false,
      "failureReason": "Invalid password"
    }
  ]
}
```

**Database Table:**
```sql
CREATE TABLE login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  device_info TEXT,
  browser VARCHAR(100),
  os VARCHAR(100),
  location_city VARCHAR(100),
  location_country VARCHAR(100),
  location_lat DECIMAL(10, 8),
  location_lon DECIMAL(11, 8),
  success BOOLEAN,
  failure_reason VARCHAR(255),
  INDEX idx_user_timestamp (user_id, timestamp DESC)
);
```

---

### 2. Active Sessions

#### GET `/api/users/:userId/sessions`

**Description:** Get all active sessions for a user

**Request:**
```http
GET /api/users/123/sessions
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sess_abc123",
      "userId": 123,
      "deviceInfo": "Chrome on Windows 11",
      "ipAddress": "192.168.1.100",
      "location": {
        "city": "Mumbai",
        "country": "India"
      },
      "createdAt": "2025-10-24T08:00:00Z",
      "lastActivityAt": "2025-10-24T10:30:00Z",
      "expiresAt": "2025-10-25T10:30:00Z",
      "isCurrent": true
    },
    {
      "id": "sess_def456",
      "userId": 123,
      "deviceInfo": "Safari on iPhone 14",
      "ipAddress": "103.50.23.45",
      "location": {
        "city": "Delhi",
        "country": "India"
      },
      "createdAt": "2025-10-23T12:00:00Z",
      "lastActivityAt": "2025-10-24T08:30:00Z",
      "expiresAt": "2025-10-25T08:30:00Z",
      "isCurrent": false
    }
  ]
}
```

#### DELETE `/api/users/:userId/sessions/:sessionId`

**Description:** Terminate a specific session

**Request:**
```http
DELETE /api/users/123/sessions/sess_def456
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Session terminated successfully"
}
```

**Database Table:**
```sql
CREATE TABLE user_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  device_info TEXT,
  ip_address VARCHAR(45),
  location_city VARCHAR(100),
  location_country VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  INDEX idx_user_active (user_id, is_active)
);
```

---

### 3. Audit Log

#### GET `/api/users/:userId/audit-log`

**Description:** Get account change history

**Request:**
```http
GET /api/users/123/audit-log?limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional): Number of records (default: 20, max: 100)
- `type` (optional): Filter by type (account, role_change, security, profile)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 123,
      "action": "User role changed from Employee to Manager",
      "actionType": "role_change",
      "performedBy": {
        "id": 1,
        "name": "Admin User",
        "role": "admin"
      },
      "timestamp": "2025-10-20T15:30:00Z",
      "details": {
        "oldValue": "employee",
        "newValue": "manager"
      },
      "ipAddress": "192.168.1.50"
    },
    {
      "id": 2,
      "userId": 123,
      "action": "Password reset requested",
      "actionType": "security",
      "performedBy": {
        "id": 2,
        "name": "HR Manager",
        "role": "hr"
      },
      "timestamp": "2025-10-15T11:00:00Z",
      "details": {
        "reason": "User forgot password"
      },
      "ipAddress": "192.168.1.51"
    }
  ]
}
```

**Database Table:**
```sql
CREATE TABLE user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  action_type VARCHAR(50),
  performed_by INTEGER REFERENCES users(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSONB,
  ip_address VARCHAR(45),
  INDEX idx_user_timestamp (user_id, timestamp DESC),
  INDEX idx_action_type (action_type)
);
```

---

### 4. Quick Actions

#### POST `/api/users/:userId/reset-password`

**Description:** Reset user password to default

**Request:**
```http
POST /api/users/123/reset-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "newPassword": "password123",
  "forceChange": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "passwordResetAt": "2025-10-24T10:30:00Z",
    "forcePasswordChange": true
  }
}
```

**Business Logic:**
1. Hash new password
2. Update user record
3. Set `force_password_change` flag
4. Invalidate all existing sessions
5. Log action in audit log
6. Send notification email (optional)

---

#### POST `/api/users/:userId/toggle-lock`

**Description:** Lock or unlock user account

**Request:**
```http
POST /api/users/123/toggle-lock
Authorization: Bearer {token}
Content-Type: application/json

{
  "lock": true,
  "reason": "Suspicious activity detected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account locked successfully",
  "data": {
    "isLocked": true,
    "lockedAt": "2025-10-24T10:30:00Z",
    "lockedBy": 1,
    "lockReason": "Suspicious activity detected"
  }
}
```

**Business Logic:**
1. Update user `is_locked` status
2. If locking: Terminate all active sessions
3. Record lock reason and performer
4. Log action in audit log
5. Send notification email

**Database Fields:**
```sql
ALTER TABLE users ADD COLUMN is_locked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN locked_at TIMESTAMP;
ALTER TABLE users ADD COLUMN locked_by INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN lock_reason TEXT;
```

---

#### POST `/api/users/:userId/send-welcome-email`

**Description:** Send welcome email with credentials

**Request:**
```http
POST /api/users/123/send-welcome-email
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome email sent successfully",
  "data": {
    "sentAt": "2025-10-24T10:30:00Z",
    "recipientEmail": "user@example.com"
  }
}
```

**Email Template:**
```
Subject: Welcome to Skyraksys HRM

Dear {firstName},

Your account has been created in the Skyraksys HRM system.

Login Credentials:
- URL: https://hrm.skyraksys.com
- Email: {email}
- Temporary Password: {temporaryPassword}

Please log in and change your password immediately.

Best regards,
HR Team
```

**Business Logic:**
1. Verify user has email
2. Generate email template
3. Send via email service
4. Log action in audit log
5. Update `welcome_email_sent_at` timestamp

---

#### POST `/api/users/:userId/logout-all`

**Description:** Force logout from all devices

**Request:**
```http
POST /api/users/123/logout-all
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Security audit"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User logged out from all devices",
  "data": {
    "sessionsTerminated": 3,
    "timestamp": "2025-10-24T10:30:00Z"
  }
}
```

**Business Logic:**
1. Find all active sessions for user
2. Mark all as inactive
3. Clear session tokens
4. Log action in audit log
5. Send notification email (optional)

---

## 🔒 Security Requirements

### Authentication
- All endpoints require valid JWT token
- Token must belong to admin or HR role
- Cannot perform actions on own account (except specific cases)

### Authorization Matrix
| Action | Admin | HR | Manager | Employee |
|--------|-------|-----|---------|----------|
| View login history | ✅ | ✅ | ❌ | Self only |
| View sessions | ✅ | ✅ | ❌ | Self only |
| Terminate session | ✅ | ✅ | ❌ | Self only |
| Reset password | ✅ | ✅ | ❌ | Self only |
| Lock/Unlock account | ✅ | ✅ | ❌ | ❌ |
| Force logout | ✅ | ✅ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ | ❌ |

### Rate Limiting
```
Login history: 100 requests/hour
Active sessions: 60 requests/hour
Reset password: 5 requests/hour
Lock/unlock: 10 requests/hour
Audit log: 50 requests/hour
```

### Input Validation
- User IDs must be positive integers
- Session IDs must match pattern: `sess_[a-zA-Z0-9]{6,}`
- Dates must be valid ISO 8601
- Limit parameters: 1-100

---

## 📊 Database Indexes

For optimal performance:

```sql
-- Login History
CREATE INDEX idx_login_history_user_timestamp ON login_history(user_id, timestamp DESC);
CREATE INDEX idx_login_history_ip ON login_history(ip_address);
CREATE INDEX idx_login_history_success ON login_history(success, timestamp DESC);

-- User Sessions
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Audit Log
CREATE INDEX idx_audit_log_user_timestamp ON user_audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_log_action_type ON user_audit_log(action_type);
CREATE INDEX idx_audit_log_performed_by ON user_audit_log(performed_by);
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Test each endpoint with valid data
- [ ] Test with invalid user IDs
- [ ] Test with unauthorized users
- [ ] Test rate limiting
- [ ] Test input validation

### Integration Tests
- [ ] Test password reset flow end-to-end
- [ ] Test session termination
- [ ] Test lock/unlock with session cleanup
- [ ] Test audit log creation
- [ ] Test email sending

### Performance Tests
- [ ] Load test with 1000 concurrent users
- [ ] Test pagination performance
- [ ] Test index effectiveness
- [ ] Test query response times

---

## 📝 Implementation Checklist

### Phase 1: Core Features
- [ ] Login history endpoint
- [ ] Active sessions endpoint
- [ ] Terminate session endpoint
- [ ] Audit log endpoint

### Phase 2: Quick Actions
- [ ] Reset password endpoint
- [ ] Lock/unlock account endpoint
- [ ] Force logout endpoint
- [ ] Send welcome email

### Phase 3: Enhanced Features
- [ ] Email notifications
- [ ] Geolocation integration
- [ ] Advanced filtering
- [ ] Export functionality

---

## 🚀 Deployment Notes

### Environment Variables
```bash
# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@skyraksys.com
SMTP_PASSWORD=***

# Security
JWT_SECRET=***
SESSION_TIMEOUT=86400
MAX_FAILED_LOGINS=5
LOCK_DURATION=1800

# Geolocation
GEOIP_API_KEY=***
```

### Database Migrations
1. Create login_history table
2. Create user_sessions table
3. Create user_audit_log table
4. Add user lock fields
5. Create all indexes

### Monitoring
- Log all authentication attempts
- Monitor failed login patterns
- Alert on suspicious activity
- Track API response times

---

## 📚 Additional Resources

### Related Documentation
- User Authentication Flow
- Session Management Architecture
- Email Service Integration
- Audit Logging Best Practices

### External Services
- **GeoIP:** For location detection
- **SendGrid/AWS SES:** For emails
- **Redis:** For session storage

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-24  
**Status:** Ready for Implementation  
**Priority:** High
