# Authentication Documentation

## Overview
SkyRakSys HRM implements a secure JWT-based authentication system with role-based access control (RBAC).

## Authentication Flow

### 1. Login Process
1. User submits credentials (email/password)
2. Server validates credentials against database
3. On success, generates JWT access token and refresh token
4. Returns tokens and user data to client

### 2. Token Management
- Access Token: Short-lived (1 hour)
- Refresh Token: Long-lived (7 days)
- Tokens stored securely in HttpOnly cookies

### 3. Token Refresh Process
1. Access token expires
2. Client uses refresh token to request new access token
3. Server validates refresh token
4. Issues new access token if refresh token valid

## Role-Based Access Control

### User Roles
1. **Admin**
   - Full system access
   - User management
   - System configuration

2. **HR Manager**
   - Employee management
   - Leave approval
   - Payroll management
   - Report generation

3. **Department Manager**
   - Team management
   - Timesheet approval
   - Leave approval for team
   - Project assignment

4. **Employee**
   - Personal profile
   - Leave requests
   - Timesheet entry
   - Document upload

### Permission Matrix
```javascript
const permissions = {
  admin: ['*'],
  hr: [
    'manage_employees',
    'manage_leaves',
    'manage_payroll',
    'view_reports'
  ],
  manager: [
    'manage_team',
    'approve_timesheets',
    'approve_leaves',
    'manage_projects'
  ],
  employee: [
    'view_profile',
    'submit_timesheet',
    'request_leave',
    'upload_documents'
  ]
};
```

## Security Implementations

### Password Security
- Passwords hashed using bcrypt
- Minimum password requirements:
  - 8 characters minimum
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character

### JWT Security
- Signed with strong secret key
- Contains minimal payload
- Short expiration time
- Refresh token rotation

### Session Management
- Single active session per user
- Force logout on password change
- Session timeout after inactivity

### Security Headers
```javascript
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true
}));
```

## API Authentication Examples

### Login Request
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Protected Route Example
```javascript
router.get('/profile', 
  authenticateToken,
  checkRole(['employee', 'manager', 'hr', 'admin']),
  async (req, res) => {
    // Handler code
  }
);
```

## Error Handling

### Common Authentication Errors
1. Invalid Credentials
2. Token Expired
3. Invalid Token
4. Insufficient Permissions
5. Session Timeout

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "AUTH_ERROR",
    "message": "Detailed error message"
  }
}
```

## Security Best Practices
1. Use HTTPS only in production
2. Implement rate limiting
3. Use secure session cookies
4. Implement strong password policies
5. Regular security audits
6. Monitor failed login attempts
7. Implement account lockout
8. Keep dependencies updated

## Testing Authentication

### Unit Tests
```javascript
describe('Authentication', () => {
  it('should login with valid credentials', async () => {
    // Test code
  });
  
  it('should reject invalid credentials', async () => {
    // Test code
  });
  
  it('should refresh token successfully', async () => {
    // Test code
  });
});
```

## References
- [API Documentation](../api/API_DOCUMENTATION.md)
- [Security Guide](./SECURITY.md)
- [Development Setup](../../DEVELOPMENT_SETUP.md)
- [Production Configuration](../../PROD/docs/PRODUCTION_SETUP_GUIDE.md)