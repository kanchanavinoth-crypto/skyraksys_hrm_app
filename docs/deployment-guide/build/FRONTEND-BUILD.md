# 📦 Frontend Build Guide
## React Production Build Process

**Last Updated:** October 22, 2025  
**Technology:** React 18 + Create React App  
**Build Time:** 2-3 minutes

---

## 🎯 **OVERVIEW**

### **What Happens During Build:**
```
npm run build
    ↓
1. Reads frontend/.env.production
2. Embeds REACT_APP_* variables into JavaScript
3. Optimizes and minifies code
4. Creates static files in build/ directory
5. Ready to serve with any static server
```

### **Key Point:**
🚨 **Environment variables are EMBEDDED at build time, not read at runtime!**

---

## 📁 **ENVIRONMENT FILES**

### **Development (.env)**
```bash
# Used when: npm start
REACT_APP_API_URL=http://localhost:5000/api
```
**Purpose:** Local development (direct to backend)

### **Production (.env.production)**
```bash
# Used when: npm run build
REACT_APP_API_URL=http://95.216.14.232/api
```
**Purpose:** Production builds (via Nginx on port 80)

---

## 🔨 **BUILD COMMANDS**

### **Standard Build:**
```bash
cd frontend
npm run build
```

### **Build with Analysis:**
```bash
npm run build:analyze
```

### **Clean Build:**
```bash
npm run clean:build
npm run build
```

---

## 📂 **BUILD OUTPUT**

### **Directory Structure:**
```
frontend/
└── build/
    ├── index.html              # Main HTML file
    ├── static/
    │   ├── js/                 # JavaScript bundles (with API URL embedded)
    │   ├── css/                # Stylesheets
    │   └── media/              # Images, fonts
    ├── manifest.json           # PWA manifest
    └── asset-manifest.json     # Asset mapping
```

### **What's Inside:**
- ✅ Minified JavaScript with API URL hardcoded
- ✅ Optimized CSS
- ✅ Compressed images
- ✅ Source maps (for debugging)
- ✅ Service worker (if enabled)

---

## 🔍 **VERIFY BUILD**

### **Check API URL Embedding:**
```bash
# Windows CMD
cd frontend
findstr /s /i "95.216.14.232/api" build\*

# Expected: Should find matches in .js files
```

### **Check Build Size:**
```bash
dir build\static\js
```

### **Test Locally:**
```bash
npx serve -s build -l 3000
# Open: http://localhost:3000
```

---

## ⚙️ **BUILD CONFIGURATION**

### **package.json Scripts:**
```json
{
  "scripts": {
    "start": "react-scripts start",          // Dev server (uses .env)
    "build": "react-scripts build",          // Production build (uses .env.production)
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### **Build Options:**
| Command | Environment | API URL |
|---------|-------------|---------|
| `npm start` | Development | http://localhost:5000/api |
| `npm run build` | Production | http://95.216.14.232/api |

---

## 🚨 **COMMON ISSUES**

### **Issue 1: Wrong API URL in Build**
**Symptom:** API calls go to localhost in production  
**Cause:** Wrong .env.production file  
**Fix:**
```bash
# Verify frontend/.env.production
cat frontend/.env.production

# Should show:
REACT_APP_API_URL=http://95.216.14.232/api

# If wrong, fix it and rebuild:
npm run build
```

### **Issue 2: Build Fails**
**Symptom:** npm run build exits with error  
**Cause:** Syntax errors, missing dependencies  
**Fix:**
```bash
# Check for errors
npm run build

# If dependency issues:
npm install

# If syntax errors, check the error message
```

### **Issue 3: Old Build Served**
**Symptom:** Changes don't appear  
**Cause:** Browser cache or old build  
**Fix:**
```bash
# Clear build and rebuild
npm run clean:build
npm run build

# Clear browser cache: Ctrl+Shift+R
```

---

## 📊 **BUILD OPTIMIZATION**

### **Production Optimizations:**
- ✅ Code minification
- ✅ Tree shaking (removes unused code)
- ✅ Code splitting (lazy loading)
- ✅ Asset compression
- ✅ Source map generation

### **Build Stats:**
```bash
# Analyze bundle size
npm run analyze

# Check build time
time npm run build
```

---

## 🔐 **SECURITY**

### **What NOT to Put in .env Files:**
❌ Database passwords  
❌ JWT secrets  
❌ Private API keys  
❌ Any server-side secrets

### **What's Safe:**
✅ API URLs (public endpoints)  
✅ Feature flags  
✅ Public analytics IDs  
✅ App version numbers

**Why:** Frontend .env variables are embedded in JavaScript and visible to users!

---

## 🎯 **BUILD CHECKLIST**

Before building:
- [ ] Correct API URL in .env.production
- [ ] All dependencies installed (npm install)
- [ ] No syntax errors (npm start works)
- [ ] Git changes committed

After building:
- [ ] build/ directory created
- [ ] API URL embedded (grep check)
- [ ] Build size reasonable (<5MB)
- [ ] Test locally with serve

---

## 📝 **DEPLOYMENT SCRIPT INTEGRATION**

The deployment script automatically:
```bash
# 1. Updates .env.production
cat > frontend/.env.production << 'EOF'
REACT_APP_API_URL=http://95.216.14.232/api
EOF

# 2. Builds frontend
cd frontend
npm run build

# 3. Verifies API URL
grep -r "95.216.14.232/api" build/

# 4. Reports success
echo "✅ Build complete with correct API URL"
```

---

## 🔗 **RELATED DOCS**

- [Environment Variables](./ENVIRONMENT-VARIABLES.md) - All env vars explained
- [Backend Build](./BACKEND-BUILD.md) - Backend setup
- [Deployment Guide](../deployment/02-STEP-BY-STEP-GUIDE.md) - Full deployment

---

**Build Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** ✅ Production Ready
