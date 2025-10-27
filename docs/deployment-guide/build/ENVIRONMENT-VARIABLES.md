# 📋 Environment Variables Complete Reference
## All Environment Variables Explained

**Last Updated:** October 22, 2025  
**Applies To:** Backend & Frontend  
**Security Level:** Confidential

---

## 🎯 **OVERVIEW**

### **Environment Files:**
```
skyraksys_hrm/
├── backend/.env                    # Backend production config
├── frontend/.env                   # Frontend development config
└── frontend/.env.production        # Frontend production config
```

### **Loading Priority:**
1. Frontend: `.env.production` (when building) OR `.env` (when developing)
2. Backend: `.env` (loaded by dotenv at runtime)

---

## 🔧 **BACKEND ENVIRONMENT VARIABLES**

### **File:** `backend/.env`

---

### **1. SERVER CONFIGURATION**

#### **NODE_ENV**
```properties
NODE_ENV=production
```
- **Purpose:** Set environment mode
- **Values:** `development` | `production` | `test`
- **Impact:** Affects logging, error messages, optimizations
- **Production:** Always use `production`

#### **HOST**
```properties
HOST=0.0.0.0
```
- **Purpose:** Bind address for Express server
- **Values:** `0.0.0.0` (all interfaces) | `localhost` (local only) | specific IP
- **Impact:** What IP addresses can access the server
- **Production:** Use `0.0.0.0` to accept connections from Nginx

#### **PORT**
```properties
PORT=5000
```
- **Purpose:** Port for Express server
- **Values:** Any valid port (1024-65535)
- **Impact:** Where backend listens for connections
- **Production:** Use `5000` (matches Nginx upstream)
- **Critical:** Must match Nginx backend upstream port

---

### **2. DATABASE CONFIGURATION**

#### **DB_HOST**
```properties
DB_HOST=localhost
```
- **Purpose:** PostgreSQL server address
- **Values:** `localhost` | IP address | domain name
- **Impact:** Where to find PostgreSQL
- **Production:** Use `localhost` if DB on same server

#### **DB_PORT**
```properties
DB_PORT=5432
```
- **Purpose:** PostgreSQL port
- **Values:** Usually `5432` (PostgreSQL default)
- **Impact:** Database connection port
- **Production:** Use `5432` (default)

#### **DB_NAME**
```properties
DB_NAME=skyraksys_hrm_prod
```
- **Purpose:** Database name
- **Values:** Any valid PostgreSQL database name
- **Impact:** Which database to use
- **Production:** Use `skyraksys_hrm_prod`

#### **DB_USER**
```properties
DB_USER=hrm_app
```
- **Purpose:** Database username
- **Values:** Any valid PostgreSQL user
- **Impact:** Database authentication
- **Production:** Use `hrm_app` (non-superuser)
- **Security:** Never use `postgres` superuser

#### **DB_PASSWORD**
```properties
DB_PASSWORD=Kc9nQd4wZx7vUe3pLb2mTa6rYf8sHg1J
```
- **Purpose:** Database password
- **Values:** Strong password (20+ characters)
- **Impact:** Database authentication
- **Production:** Use strong, unique password
- **Security:** ⚠️ Keep secret, never commit to git

#### **DB_DIALECT**
```properties
DB_DIALECT=postgres
```
- **Purpose:** Database type for Sequelize
- **Values:** `postgres` | `mysql` | `sqlite` | `mssql`
- **Impact:** Which SQL dialect to use
- **Production:** Use `postgres`

#### **DB_SSL**
```properties
DB_SSL=false
```
- **Purpose:** Enable SSL for database connection
- **Values:** `true` | `false`
- **Impact:** Encrypt database connection
- **Production:** Use `false` for localhost, `true` for remote DB

---

### **3. JWT AUTHENTICATION**

#### **JWT_SECRET**
```properties
JWT_SECRET=a3f1b5c9d2e4f8a0b1c3d5e7f90123456789abcdeffedcba0123456789abcdef
```
- **Purpose:** Sign and verify JWT access tokens
- **Values:** Random string (64+ characters recommended)
- **Impact:** Token security
- **Production:** Use strong, random, 64+ character secret
- **Security:** ⚠️ CRITICAL - Keep secret, never expose

#### **JWT_REFRESH_SECRET**
```properties
JWT_REFRESH_SECRET=5c7e9a1b3d5f7e9a0c2e4f6a8b0d1f3e5a7c9b1d3f5e7a9c0b2d4f6a8c0e2d4
```
- **Purpose:** Sign and verify JWT refresh tokens
- **Values:** Random string (64+ characters, different from JWT_SECRET)
- **Impact:** Refresh token security
- **Production:** Use different secret than JWT_SECRET
- **Security:** ⚠️ CRITICAL - Keep secret, never expose

#### **JWT_EXPIRES_IN**
```properties
JWT_EXPIRES_IN=1h
```
- **Purpose:** Access token expiration time
- **Values:** `15m`, `30m`, `1h`, `2h`, etc.
- **Impact:** How long users stay logged in
- **Production:** Use `1h` (balance security & UX)
- **Recommendation:** Shorter is more secure, longer is more convenient

#### **JWT_REFRESH_EXPIRES_IN**
```properties
JWT_REFRESH_EXPIRES_IN=7d
```
- **Purpose:** Refresh token expiration time
- **Values:** `1d`, `7d`, `30d`, etc.
- **Impact:** How long refresh tokens are valid
- **Production:** Use `7d` (1 week)
- **Recommendation:** Balance between security and user experience

---

### **4. SECURITY CONFIGURATION**

#### **BCRYPT_ROUNDS**
```properties
BCRYPT_ROUNDS=12
```
- **Purpose:** Password hashing complexity
- **Values:** 10-14 (higher = more secure but slower)
- **Impact:** Password hash time and security
- **Production:** Use `12` (good balance)
- **Note:** Each increment doubles hashing time

#### **RATE_LIMIT_ENABLED**
```properties
RATE_LIMIT_ENABLED=true
```
- **Purpose:** Enable API rate limiting
- **Values:** `true` | `false`
- **Impact:** Prevent API abuse
- **Production:** Always use `true`
- **Security:** Protects against DoS attacks

#### **RATE_LIMIT_WINDOW_MS**
```properties
RATE_LIMIT_WINDOW_MS=900000
```
- **Purpose:** Rate limit time window (milliseconds)
- **Values:** Any number in ms (900000 = 15 minutes)
- **Impact:** Rate limit reset period
- **Production:** Use `900000` (15 minutes)

#### **RATE_LIMIT_MAX**
```properties
RATE_LIMIT_MAX=300
```
- **Purpose:** Max requests per window
- **Values:** Any positive number
- **Impact:** How many requests allowed per window
- **Production:** Use `300` (20 requests/minute)
- **Adjustment:** Increase if legitimate users hit limit

---

### **5. CORS CONFIGURATION**

#### **TRUST_PROXY**
```properties
TRUST_PROXY=true
```
- **Purpose:** Trust reverse proxy headers
- **Values:** `true` | `false` | number
- **Impact:** Correct client IP detection through Nginx
- **Production:** ⚠️ CRITICAL - Must be `true` for Nginx
- **Why:** Nginx adds X-Forwarded-For, X-Real-IP headers

#### **CORS_ORIGIN**
```properties
CORS_ORIGIN=http://95.216.14.232
```
- **Purpose:** Main allowed CORS origin
- **Values:** Full URL with protocol (no trailing slash)
- **Impact:** Which origin can call API
- **Production:** Use `http://95.216.14.232`
- **Note:** Also add to allowedOrigins array in server.js

#### **ALLOWED_ORIGINS**
```properties
ALLOWED_ORIGINS=http://95.216.14.232,http://95.216.14.232:3000
```
- **Purpose:** Additional allowed origins (comma-separated)
- **Values:** Comma-separated list of URLs
- **Impact:** Multiple origins that can call API
- **Production:** Include production URL and variants
- **Note:** Used by some middleware

#### **CORS_ALLOW_ALL**
```properties
CORS_ALLOW_ALL=false
```
- **Purpose:** Override to allow all origins (troubleshooting)
- **Values:** `true` | `false`
- **Impact:** If true, allows ANY origin
- **Production:** ⚠️ MUST be `false` (security risk if true)
- **Use Case:** Only use `true` for debugging CORS issues

---

### **6. SEEDING CONFIGURATION**

#### **SEED_DEMO_DATA**
```properties
SEED_DEMO_DATA=true
```
- **Purpose:** Auto-seed demo data on startup
- **Values:** `true` | `false`
- **Impact:** Creates admin, HR, employee users and sample data
- **Production:** Use `true` for first deployment, `false` after
- **Data Created:** Admin, HR, employee accounts, departments, projects

---

## 🎨 **FRONTEND ENVIRONMENT VARIABLES**

### **File:** `frontend/.env` (Development)

```bash
REACT_APP_API_URL=http://localhost:5000/api
```

**Purpose:** API URL for local development  
**Used When:** Running `npm start`  
**Impact:** Where frontend sends API requests during development  
**Value:** `http://localhost:5000/api` (direct to backend)

---

### **File:** `frontend/.env.production` (Production)

```bash
REACT_APP_API_URL=http://95.216.14.232/api
```

**Purpose:** API URL for production builds  
**Used When:** Running `npm run build`  
**Impact:** Where frontend sends API requests in production  
**Value:** `http://95.216.14.232/api` (via Nginx, not :5000)  
**Critical:** ⚠️ Must go through Nginx (port 80), NOT direct to backend (:5000)

---

## 🚨 **SECURITY BEST PRACTICES**

### **What to Keep Secret:**
❌ JWT_SECRET  
❌ JWT_REFRESH_SECRET  
❌ DB_PASSWORD  
❌ Any API keys  
❌ Any passwords

### **What's Public:**
✅ REACT_APP_API_URL (visible in browser)  
✅ PORT numbers  
✅ NODE_ENV  
✅ Feature flags

### **Git Safety:**
```bash
# .gitignore should include:
.env
.env.local
.env.production.local
.env.*.local

# Never commit:
- Passwords
- Secrets
- Tokens
- Private keys
```

---

## 🔄 **ENVIRONMENT SWITCHING**

### **Development:**
```bash
# Backend
NODE_ENV=development
PORT=5000
DB_NAME=skyraksys_hrm_dev

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
```

### **Production:**
```bash
# Backend
NODE_ENV=production
PORT=5000
DB_NAME=skyraksys_hrm_prod

# Frontend (during build)
REACT_APP_API_URL=http://95.216.14.232/api
```

---

## 📊 **QUICK REFERENCE TABLE**

| Variable | Type | Required | Default | Production Value |
|----------|------|----------|---------|------------------|
| NODE_ENV | Backend | Yes | development | production |
| PORT | Backend | Yes | 8080 | 5000 |
| DB_HOST | Backend | Yes | localhost | localhost |
| DB_PORT | Backend | Yes | 5432 | 5432 |
| DB_NAME | Backend | Yes | - | skyraksys_hrm_prod |
| DB_USER | Backend | Yes | - | hrm_app |
| DB_PASSWORD | Backend | Yes | - | Strong password |
| JWT_SECRET | Backend | Yes | - | 64+ char random |
| JWT_REFRESH_SECRET | Backend | Yes | - | 64+ char random |
| TRUST_PROXY | Backend | Yes | false | **true** |
| CORS_ORIGIN | Backend | Yes | - | http://95.216.14.232 |
| CORS_ALLOW_ALL | Backend | Yes | false | **false** |
| REACT_APP_API_URL | Frontend | Yes | - | http://95.216.14.232/api |

---

## 🔗 **RELATED DOCS**

- [Frontend Build](./FRONTEND-BUILD.md) - How React builds work
- [Backend Build](./BACKEND-BUILD.md) - Backend setup
- [CORS Guide](../cors/CORS-GUIDE.md) - CORS configuration
- [Security Best Practices](../deployment/07-ALL-CONFIGURATIONS.md) - Security

---

**Documentation Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** ✅ Complete
