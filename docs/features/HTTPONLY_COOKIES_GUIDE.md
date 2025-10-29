# HttpOnly Cookies Security Implementation Guide

## Overview
This guide explains the implementation of httpOnly cookies for JWT token storage in the SkyRakSys HRM application, providing enhanced security against XSS attacks.

## Table of Contents
- [What are HttpOnly Cookies?](#what-are-httponly-cookies)
- [Security Benefits](#security-benefits)
- [Implementation](#implementation)
- [Backend Changes](#backend-changes)
- [Frontend Changes](#frontend-changes)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## What are HttpOnly Cookies?

HttpOnly cookies are cookies that cannot be accessed via JavaScript (`document.cookie`). They are only sent automatically by the browser with HTTP requests to the same domain.

### Key Characteristics:
- **HttpOnly flag**: Prevents JavaScript access
- **Secure flag**: Only sent over HTTPS (production)
- **SameSite attribute**: Prevents CSRF attacks
- **Automatic**: Browser handles sending/receiving

## Security Benefits

### 1. XSS Protection
**Problem:** Attackers can steal tokens from localStorage via XSS
```javascript
// VULNERABLE: Token in localStorage
localStorage.setItem('token', jwt);
// Attacker can execute: 
// const stolen = localStorage.getItem('token');
```

**Solution:** HttpOnly cookies are inaccessible to JavaScript
```javascript
// SECURE: Token in httpOnly cookie
// JavaScript cannot access: document.cookie returns ""
```

### 2. CSRF Protection
**SameSite attribute** prevents cookies from being sent with cross-origin requests:
```javascript
res.cookie('accessToken', token, {
  sameSite: 'strict' // or 'lax' for development
});
```

### 3. Automatic Token Management
Browser automatically:
- Sends cookies with every request
- Manages token expiration
- Handles secure transmission

## Implementation

### Architecture Overview
```
┌─────────────┐                    ┌─────────────┐
│   Browser   │                    │   Backend   │
│             │                    │             │
│  Frontend   │  POST /auth/login  │   Express   │
│  (React)    │  ─────────────────>│   Server    │
│             │  credentials       │             │
│             │                    │             │
│             │  Response:         │             │
│             │  - JWT in body     │             │
│             │  <─────────────────│  Sets       │
│             │  - httpOnly cookie │  cookie     │
│             │                    │             │
│             │  Subsequent:       │             │
│  axios with │  GET /api/*        │  Auth       │
│  withCreds  │  ─────────────────>│  Middleware │
│             │  (cookie auto-sent)│  reads      │
│             │                    │  cookie     │
└─────────────┘                    └─────────────┘
```

## Backend Changes

### 1. Install cookie-parser

```bash
cd backend
npm install cookie-parser
```

### 2. Configure Express Server

**File:** `backend/server.js`

```javascript
const cookieParser = require('cookie-parser');

// Middleware setup (after body parsers, before routes)
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};
app.use(cors(corsOptions));
```

### 3. Update Login Route

**File:** `backend/routes/auth.routes.js`

```javascript
router.post('/login', async (req, res) => {
  try {
    // ... authentication logic ...
    
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set httpOnly cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,                    // XSS protection
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 3600000 // 1 hour in milliseconds
    });

    // Still return token in body for backward compatibility
    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    // error handling
  }
});
```

### 4. Update Authentication Middleware

**File:** `backend/middleware/auth.simple.js`

```javascript
function authenticateToken(req, res, next) {
  // Try cookie first, fallback to Authorization header
  const token = req.cookies?.accessToken || 
                (req.headers['authorization']?.split(' ')[1]);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}
```

**Key Points:**
- Checks cookie first (`req.cookies.accessToken`)
- Falls back to Authorization header for backward compatibility
- No breaking changes for existing clients

### 5. Implement Logout Route

**File:** `backend/routes/auth.routes.js`

```javascript
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Clear the httpOnly cookie and invalidate the session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticateToken, (req, res) => {
  // Clear the httpOnly cookie
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});
```

## Frontend Changes

### 1. Configure Axios

**File:** `frontend/src/services/enhancedApiService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
                     'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable sending cookies
});

// Request interceptor (still adds Authorization header for backward compat)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
```

**Key Setting:** `withCredentials: true` tells axios to:
- Send cookies with cross-origin requests
- Accept cookies from cross-origin responses

### 2. Update Login Logic (Optional)

You can still store token in localStorage for backward compatibility:

```javascript
// In login component
const handleLogin = async (credentials) => {
  try {
    const response = await authService.login(credentials);
    
    // Cookie is automatically set by backend
    // Optionally store token in localStorage for backward compat
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    
    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### 3. Implement Logout

```javascript
const handleLogout = async () => {
  try {
    // Call logout endpoint to clear cookie
    await enhancedApiService.post('/auth/logout');
    
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    
    // Redirect to login
    navigate('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

## Testing

### 1. Manual Testing

#### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"password123"}' \
  -c cookies.txt  # Save cookies
```

**Expected:**
- Response includes JWT in body
- `Set-Cookie` header with `HttpOnly` flag

#### Test Authenticated Request
```bash
curl http://localhost:5000/api/employees \
  -b cookies.txt  # Send saved cookies
```

**Expected:**
- Request succeeds without Authorization header
- Cookie automatically sent

#### Test Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt
```

**Expected:**
- Cookie cleared
- Subsequent requests fail authentication

### 2. Browser DevTools Testing

1. **Open Developer Tools** → Network tab
2. **Login** and watch the response:
   - Check `Set-Cookie` header
   - Verify `HttpOnly`, `Secure`, `SameSite` flags
3. **Console:** Try `document.cookie`
   - Should NOT show `accessToken`
4. **Application tab** → Cookies:
   - See `accessToken` cookie
   - Verify HttpOnly flag is checked

### 3. Automated Testing

```javascript
// Example test with supertest
const request = require('supertest');
const app = require('../server');

describe('Authentication with httpOnly cookies', () => {
  let cookies;

  it('should set httpOnly cookie on login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@company.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
    
    const cookieHeader = response.headers['set-cookie'][0];
    expect(cookieHeader).toContain('accessToken');
    expect(cookieHeader).toContain('HttpOnly');
    
    cookies = response.headers['set-cookie'];
  });

  it('should authenticate with cookie', async () => {
    const response = await request(app)
      .get('/api/employees')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
  });
});
```

## Backward Compatibility

The implementation maintains backward compatibility:

1. **Backend still accepts Authorization header:**
   ```javascript
   const token = req.cookies?.accessToken ||  // New way
                 req.headers['authorization']?.split(' ')[1]; // Old way
   ```

2. **Frontend still sends Authorization header:**
   ```javascript
   config.headers['Authorization'] = `Bearer ${token}`;
   ```

3. **Token still returned in response body:**
   ```javascript
   res.json({ accessToken, user });
   ```

This allows gradual migration without breaking existing clients.

## Security Best Practices

### Production Configuration

**Environment variables:**
```bash
# .env.production
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
FRONTEND_URL=https://yourdomain.com
```

**Cookie settings:**
```javascript
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: true,           // HTTPS only
  sameSite: 'strict',     // Strict CSRF protection
  domain: '.yourdomain.com', // Allow subdomains
  maxAge: 3600000
});
```

### Token Rotation
Implement refresh token mechanism:
```javascript
// Short-lived access token (1 hour)
const accessToken = jwt.sign(payload, secret, { expiresIn: '1h' });

// Long-lived refresh token (7 days)
const refreshToken = jwt.sign(payload, secret, { expiresIn: '7d' });

res.cookie('accessToken', accessToken, { maxAge: 3600000 });
res.cookie('refreshToken', refreshToken, { 
  maxAge: 604800000,
  httpOnly: true 
});
```

### Content Security Policy
Add CSP headers to prevent XSS:
```javascript
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'"
  );
  next();
});
```

## Troubleshooting

### Issue: Cookie not sent with requests
**Symptoms:** 401 Unauthorized despite successful login

**Solutions:**
1. Check `withCredentials: true` in axios config
2. Verify CORS `credentials: true` on backend
3. Ensure frontend and backend on same domain or CORS properly configured
4. Check browser DevTools → Network → Cookie header

### Issue: Cookie not set on login
**Symptoms:** No `Set-Cookie` header in response

**Solutions:**
1. Verify `cookie-parser` middleware installed and used
2. Check `res.cookie()` syntax
3. Ensure CORS allows `Set-Cookie` header
4. Check browser console for CORS errors

### Issue: Cookie cleared too early
**Symptoms:** Authentication works briefly then fails

**Solutions:**
1. Verify `maxAge` matches JWT expiration
2. Check token expiration time
3. Implement token refresh mechanism

### Issue: CORS errors in browser
**Symptoms:** `Access-Control-Allow-Credentials` error

**Solutions:**
1. Set `credentials: true` in CORS options
2. Set specific `origin`, not wildcard (`*`)
3. Include `Cookie` in `allowedHeaders`

```javascript
// Correct CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000', // NOT '*'
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};
```

## Migration Checklist

- [ ] Install `cookie-parser` on backend
- [ ] Add `cookieParser()` middleware to Express
- [ ] Update CORS configuration with `credentials: true`
- [ ] Modify login route to set httpOnly cookie
- [ ] Update `authenticateToken` to check cookies
- [ ] Implement logout endpoint
- [ ] Add `withCredentials: true` to axios config
- [ ] Test login flow in browser
- [ ] Test authenticated requests
- [ ] Test logout flow
- [ ] Verify cookies in DevTools
- [ ] Update API documentation
- [ ] Deploy and test in production

## References

- [OWASP Cookie Security](https://owasp.org/www-community/controls/SecureCookieAttribute)
- [MDN HttpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
- [Express cookie-parser](https://www.npmjs.com/package/cookie-parser)
- [Axios withCredentials](https://axios-http.com/docs/req_config)

## Support

For questions or issues:
1. Check browser console for CORS errors
2. Inspect Network tab for cookie headers
3. Review server logs for authentication failures
4. Consult backend API documentation

---

**Last Updated:** 2025-01-28
**Version:** 1.0.0
**Security Level:** Production-Ready
