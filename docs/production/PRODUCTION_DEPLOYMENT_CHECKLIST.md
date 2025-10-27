# 🚀 Production Deployment Checklist - Photo Upload Feature

**Last Updated:** October 24, 2025  
**Feature:** Employee Photo Upload (Create & View)

---

## ✅ Pre-Deployment Verification

### 1. Code Review
- [x] PhotoUploadSimple component created
- [x] EmployeeForm uses PhotoUploadSimple
- [x] EmployeeProfile uses PhotoUpload
- [x] Backend route handles multipart/form-data
- [x] Upload middleware configured
- [x] File validation in place

### 2. Local Testing
- [ ] Create employee with photo
- [ ] Verify photo saved to disk
- [ ] Verify photoUrl in database
- [ ] View employee profile shows photo
- [ ] Edit employee and change photo
- [ ] Delete employee removes photo

---

## 🔧 Production Server Setup

### Step 1: Directory Structure

```bash
# Create uploads directory
mkdir -p /var/www/hrm-production/backend/uploads/employee-photos

# Set ownership (replace www-data with your web server user)
chown -R www-data:www-data /var/www/hrm-production/backend/uploads

# Set permissions
chmod -R 755 /var/www/hrm-production/backend/uploads
```

**Verification:**
```bash
ls -la /var/www/hrm-production/backend/uploads/
# Should show: drwxr-xr-x www-data www-data employee-photos/
```

---

### Step 2: Environment Configuration

**Backend `.env` (Production):**

```bash
# Copy the example file
cp .env.production.example .env

# Edit with your actual values
nano .env
```

**Key settings to configure:**
```env
NODE_ENV=production
PORT=5000

# Database
DB_HOST=your-db-server.com
DB_NAME=skyraksys_hrm_production
DB_USER=hrm_prod_user
DB_PASSWORD=<generate-strong-password>

# Security - CRITICAL: Generate new secrets!
JWT_SECRET=<generate-with-crypto>
SESSION_SECRET=<generate-with-crypto>

# File uploads
UPLOAD_DIR=/var/www/hrm-production/backend/uploads/employee-photos

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@company.com
SMTP_PASSWORD=<app-specific-password>

# CORS
CORS_ORIGIN=https://your-domain.com
```

**Generate secure secrets:**
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret  
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate strong DB password
openssl rand -base64 32
```

**Frontend `.env.production`:**

```bash
# Copy the example file
cd frontend
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Key settings:**
```env
# API URL - Use one of these options:

# Option 1: Full URL (backend on different domain)
REACT_APP_API_URL=https://api.yourcompany.com/api

# Option 2: Relative path (backend on same domain)
REACT_APP_API_URL=/api

# Other settings
REACT_APP_NAME=Skyraksys HRM
REACT_APP_COMPANY_NAME=Your Company Name
GENERATE_SOURCEMAP=false
```

**Complete Configuration Files:**
- See `.env.production.example` (backend root) - 400+ lines with detailed comments
- See `frontend/.env.production.example` - 200+ lines with detailed comments

**Environment File Security:**
```bash
# Set proper permissions (readable only by app user)
chmod 600 .env
chown www-data:www-data .env

# Never commit production .env files
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
```

---

### Step 3: Backend Server Configuration

**Verify `server.js` has static file serving:**

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ... rest of server setup
```

**Test:**
```bash
# Restart backend
pm2 restart hrm-backend

# Check if uploads route works
curl -I http://localhost:5000/uploads/employee-photos/test.jpg
```

---

### Step 4: Nginx Configuration (If using Nginx)

**Add to nginx.conf:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (React build)
    location / {
        root /var/www/hrm-production/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for file uploads
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Uploaded files (direct serving - faster than proxying)
    location /uploads/ {
        alias /var/www/hrm-production/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "https://your-domain.com";
    }

    # Increase upload size limit
    client_max_body_size 10M;
}
```

**Reload Nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 5: Database Verification

```sql
-- Connect to production database
psql -h your-db-host -U hrm_user -d hrm_production

-- Check employees table has photoUrl column
\d employees

-- Should show:
-- photoUrl | character varying(255) | | |
```

---

## 🧪 Production Testing

### Test 1: Create Employee with Photo

```bash
# Using curl
curl -X POST https://your-domain.com/api/employees \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "firstName=Production" \
  -F "lastName=Test" \
  -F "email=prodtest@company.com" \
  -F "employeeId=PROD001" \
  -F "departmentId=1" \
  -F "positionId=1" \
  -F "hireDate=2025-10-24" \
  -F "status=Active" \
  -F "photo=@/path/to/test-photo.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Employee created successfully.",
  "data": {
    "id": "uuid-here",
    "firstName": "Production",
    "lastName": "Test",
    "photoUrl": "/uploads/employee-photos/PROD001-1729785600000.jpg",
    ...
  }
}
```

### Test 2: Verify File on Disk

```bash
ls -lh /var/www/hrm-production/backend/uploads/employee-photos/
# Should show: PROD001-1729785600000.jpg
```

### Test 3: Access Photo via URL

```bash
curl -I https://your-domain.com/uploads/employee-photos/PROD001-1729785600000.jpg
# Should return: HTTP/1.1 200 OK
```

### Test 4: View in Browser

1. Login to https://your-domain.com
2. Go to Employees list
3. Click on test employee
4. Verify photo displays

---

## 🔒 Security Checklist

- [ ] File uploads restricted to admin/HR only
- [ ] MIME type validation enabled
- [ ] File size limit enforced (5MB)
- [ ] Unique filenames prevent overwrites
- [ ] Uploads directory NOT executable
- [ ] HTTPS enabled for production
- [ ] CORS properly configured
- [ ] Rate limiting on upload endpoint
- [ ] Virus scanning (optional but recommended)

---

## 📊 Monitoring & Logging

### Add Upload Logging

**In `backend/middleware/upload.js`:**

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'photo-upload' },
  transports: [
    new winston.transports.File({ filename: 'logs/uploads-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/uploads.log' })
  ]
});

const uploadEmployeePhoto = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      logger.error('Photo upload failed', { 
        error: err.message,
        user: req.userId,
        size: req.headers['content-length']
      });
    } else if (req.file) {
      logger.info('Photo uploaded', {
        filename: req.file.filename,
        size: req.file.size,
        user: req.userId
      });
    }
    next(err);
  });
};
```

### Monitor Disk Space

```bash
# Check uploads directory size
du -sh /var/www/hrm-production/backend/uploads/

# Set up alert if > 1GB
watch -n 300 'du -sh /var/www/hrm-production/backend/uploads/'
```

---

## 💾 Backup Strategy

### Option 1: Include in App Backup

```bash
#!/bin/bash
# /opt/scripts/backup-hrm.sh

BACKUP_DIR=/backups/hrm
DATE=$(date +%Y%m%d)

# Backup uploads
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz \
    /var/www/hrm-production/backend/uploads

# Backup database
pg_dump -h localhost -U hrm_user hrm_production > \
    $BACKUP_DIR/database-$DATE.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

**Add to crontab:**
```bash
0 2 * * * /opt/scripts/backup-hrm.sh
```

### Option 2: Sync to Cloud Storage

```bash
# AWS S3
aws s3 sync /var/www/hrm-production/backend/uploads \
    s3://your-bucket/hrm-uploads --delete

# Google Cloud Storage
gsutil -m rsync -r /var/www/hrm-production/backend/uploads \
    gs://your-bucket/hrm-uploads
```

---

## 🚨 Troubleshooting

### Issue: Photo upload fails with 413 error

**Solution:** Increase nginx upload limit
```nginx
client_max_body_size 10M;
```

### Issue: Photo upload fails with 500 error

**Check:**
```bash
# Directory permissions
ls -la /var/www/hrm-production/backend/uploads/

# Disk space
df -h

# Backend logs
tail -f /var/www/hrm-production/backend/logs/error.log
```

### Issue: Photo URL returns 404

**Check:**
1. File exists: `ls /var/www/hrm-production/backend/uploads/employee-photos/`
2. Nginx serving: `curl -I http://localhost/uploads/test.jpg`
3. Path in database: `SELECT photoUrl FROM employees WHERE id='...'`

### Issue: Photo not displaying in browser

**Check:**
1. CORS headers: Open DevTools → Network → Check response headers
2. HTTPS/HTTP mismatch: Ensure consistent protocol
3. Path correctness: Verify `/uploads/` vs `/api/uploads/`

---

## ✅ Final Verification

Run through this checklist before marking deployment complete:

- [ ] Photo upload works from UI
- [ ] Files saved to correct directory
- [ ] Database stores correct path
- [ ] Photos display in employee list
- [ ] Photos display in employee profile
- [ ] Edit employee photo works
- [ ] File permissions correct (755)
- [ ] Nginx serves files correctly
- [ ] HTTPS enabled
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error logging works
- [ ] Disk space monitored

---

## 📞 Support

**Issues?** Check:
1. Backend logs: `/var/www/hrm-production/backend/logs/`
2. Nginx logs: `/var/log/nginx/error.log`
3. Database: `SELECT * FROM employees WHERE photoUrl IS NOT NULL;`
4. Disk space: `df -h`

**Documentation:** See `MASTER_FIXES_LOG.md` for detailed implementation notes

---

**Status:** Ready for Production ✅  
**Last Tested:** [DATE]  
**Deployed By:** [NAME]
