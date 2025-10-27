# ⚙️ Backend Build & Setup Guide
## Node.js/Express Backend Configuration

**Last Updated:** October 22, 2025  
**Technology:** Node.js 18 + Express + PostgreSQL  
**Setup Time:** 5 minutes

---

## 🎯 **OVERVIEW**

### **Backend Stack:**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Sequelize
- **Authentication:** JWT + bcrypt
- **Security:** Helmet, CORS, Rate Limiting

### **No Build Step Required:**
Node.js runs JavaScript directly - no compilation needed!

---

## 📁 **DIRECTORY STRUCTURE**

```
backend/
├── server.js                    # Main entry point
├── .env                         # Environment configuration
├── package.json                 # Dependencies
├── models/                      # Sequelize models
├── routes/                      # API routes
├── controllers/                 # Business logic
├── middleware/                  # Auth, validation
├── config/                      # Configuration
├── utils/                       # Helper functions
└── migrations/                  # Database migrations
```

---

## 📦 **INSTALLATION**

### **Install Dependencies:**
```bash
cd backend
npm install
```

### **Key Dependencies:**
```json
{
  "express": "^4.18.2",
  "pg": "^8.11.0",
  "sequelize": "^6.32.0",
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "express-rate-limit": "^6.8.0",
  "dotenv": "^16.3.1",
  "morgan": "^1.10.0"
}
```

---

## ⚙️ **ENVIRONMENT CONFIGURATION**

### **Production .env:**
```properties
# Server Configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_app
DB_PASSWORD=Kc9nQd4wZx7vUe3pLb2mTa6rYf8sHg1J

# JWT Secrets (64 characters)
JWT_SECRET=a3f1b5c9d2e4f8a0b1c3d5e7f90123456789abcdeffedcba0123456789abcdef
JWT_REFRESH_SECRET=5c7e9a1b3d5f7e9a0c2e4f6a8b0d1f3e5a7c9b1d3f5e7a9c0b2d4f6a8c0e2d4
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300

# CORS (Critical for Nginx)
TRUST_PROXY=true
CORS_ORIGIN=http://95.216.14.232
CORS_ALLOW_ALL=false

# Seeding
SEED_DEMO_DATA=true
```

### **Security Notes:**
- ✅ All secrets are 64+ characters
- ✅ BCRYPT_ROUNDS=12 (secure)
- ✅ Rate limiting enabled
- ✅ CORS whitelisting (not allowing all)
- ✅ Trust proxy for Nginx

---

## 🚀 **STARTUP PROCESS**

### **Manual Start:**
```bash
cd backend
node server.js
```

### **With Environment:**
```bash
NODE_ENV=production PORT=5000 node server.js
```

### **What Happens on Startup:**
```
1. Load .env file
2. Connect to PostgreSQL
3. Sync database models
4. Seed demo data (if SEED_DEMO_DATA=true)
5. Setup middleware (CORS, helmet, rate limiting)
6. Register routes
7. Start listening on PORT 5000
8. Log: "✅ Server running on port 5000"
```

---

## 🔐 **SECURITY FEATURES**

### **1. CORS Protection:**
```javascript
// Whitelisted origins only
const allowedOrigins = [
  'http://95.216.14.232',
  'http://localhost:3000',
  // ...
];
```

### **2. Helmet (Security Headers):**
```javascript
app.use(helmet());
// Sets secure HTTP headers
```

### **3. Rate Limiting:**
```javascript
// 300 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
});
```

### **4. Trust Proxy:**
```javascript
// Critical when behind Nginx
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}
```

---

## 🗄️ **DATABASE SETUP**

### **PostgreSQL Configuration:**
```sql
-- Create database
CREATE DATABASE skyraksys_hrm_prod;

-- Create user
CREATE USER hrm_app WITH PASSWORD 'Kc9nQd4wZx7vUe3pLb2mTa6rYf8sHg1J';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_app;
GRANT ALL ON SCHEMA public TO hrm_app;
```

### **Database Connection:**
```javascript
// Sequelize auto-connects using .env settings
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);
```

---

## 🌱 **SEEDING DEMO DATA**

### **Automatic Seeding:**
```bash
# Set in .env
SEED_DEMO_DATA=true

# On startup, creates:
- Admin user (admin@company.com)
- HR user (hr@company.com)
- Employee user (employee@company.com)
- Sample departments
- Sample projects
- Sample tasks
```

### **Manual Seeding:**
```bash
cd backend
node redhatprod/scripts/seedRunner.js
```

### **Seed Credentials:**
```
Admin:
  Email: admin@company.com
  Password: Kx9mP7qR2nF8sA5t

HR:
  Email: hr@company.com
  Password: Hr9pQ2xM5nK8wT3v

Employee:
  Email: employee@company.com
  Password: Em7rL4cN9fV2bH6m
```

---

## 🔍 **HEALTH CHECK**

### **Endpoint:**
```bash
curl http://localhost:5000/api/health
```

### **Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T10:30:00.000Z",
  "uptime": 123.45,
  "database": "connected"
}
```

---

## 🚨 **COMMON ISSUES**

### **Issue 1: Database Connection Failed**
**Symptom:** Error: connect ECONNREFUSED  
**Cause:** PostgreSQL not running or wrong credentials  
**Fix:**
```bash
# Check PostgreSQL is running
systemctl status postgresql-15

# Check credentials in .env
cat backend/.env | grep DB_

# Test connection
psql -h localhost -U hrm_app -d skyraksys_hrm_prod
```

### **Issue 2: Port Already in Use**
**Symptom:** Error: EADDRINUSE :::5000  
**Cause:** Another process using port 5000  
**Fix:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### **Issue 3: JWT Token Invalid**
**Symptom:** 401 Unauthorized  
**Cause:** Wrong JWT secret or expired token  
**Fix:**
```bash
# Verify JWT_SECRET in .env (should be 64 chars)
cat backend/.env | grep JWT_SECRET

# Check token expiry
JWT_EXPIRES_IN=1h  # 1 hour is reasonable
```

---

## 📊 **MONITORING**

### **Logs Location:**
```bash
# Systemd logs
journalctl -u hrm-backend -f

# PM2 logs
pm2 logs hrm-backend

# Custom log files (if configured)
tail -f /var/log/skyraksys-hrm/backend.log
```

### **What to Monitor:**
- ✅ Database connection status
- ✅ Response times
- ✅ Error rates
- ✅ Memory usage
- ✅ Active connections

---

## 🔧 **PROCESS MANAGEMENT**

### **Systemd (Recommended):**
```bash
# Start
systemctl start hrm-backend

# Stop
systemctl stop hrm-backend

# Restart
systemctl restart hrm-backend

# Status
systemctl status hrm-backend

# Logs
journalctl -u hrm-backend -f
```

### **PM2 (Alternative):**
```bash
# Start
pm2 start ecosystem.config.js

# Stop
pm2 stop hrm-backend

# Restart
pm2 restart hrm-backend

# Status
pm2 status

# Logs
pm2 logs hrm-backend
```

---

## 🎯 **PRODUCTION CHECKLIST**

Before going live:
- [ ] NODE_ENV=production
- [ ] Strong JWT secrets (64+ chars)
- [ ] Strong DB password
- [ ] TRUST_PROXY=true
- [ ] CORS_ALLOW_ALL=false
- [ ] Rate limiting enabled
- [ ] Database backup configured
- [ ] Monitoring setup

---

## 🔗 **RELATED DOCS**

- [Environment Variables](./ENVIRONMENT-VARIABLES.md) - All variables explained
- [Frontend Build](./FRONTEND-BUILD.md) - Frontend setup
- [CORS Guide](../cors/CORS-GUIDE.md) - CORS configuration
- [Deployment](../deployment/02-STEP-BY-STEP-GUIDE.md) - Full deployment

---

**Backend Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** ✅ Production Ready
