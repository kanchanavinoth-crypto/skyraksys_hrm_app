# 🎯 Quick Setup Guide for Novice Users

## Step-by-Step Environment Configuration

### 1. Copy the Environment File
```bash
# Copy the template to the correct location
cp /path/to/templates/.env.production.template /opt/skyraksys-hrm/.env
```

### 2. Edit Only These Values

**Replace these 3 placeholders with YOUR information:**

| Find This | Replace With | Example |
|-----------|--------------|---------|
| `your-domain.com` | Your actual domain or server IP | `hrm.mycompany.com` or `192.168.1.100` |
| `your-email@gmail.com` | Your Gmail address | `admin@mycompany.com` |
| `your-gmail-app-password` | Your Gmail App Password | `abcd efgh ijkl mnop` |

### 3. Quick Search and Replace Commands

```bash
# Navigate to the directory
cd /opt/skyraksys-hrm

# Replace domain (use your actual domain)
sed -i 's/your-domain.com/hrm.mycompany.com/g' .env

# Replace email (use your actual email)
sed -i 's/your-email@gmail.com/admin@mycompany.com/g' .env

# Replace Gmail password (use your actual app password) 
sed -i 's/your-gmail-app-password/abcd efgh ijkl mnop/g' .env
```

### 4. Verify Configuration
```bash
# Check that you updated everything
grep -E "(your-domain|your-email)" .env

# Should return NO results if you replaced everything correctly
```

### 5. Secure the File
```bash
# Set correct permissions
chmod 600 .env
chown hrmapp:hrmapp .env
```

## 🔐 All Passwords Ready to Use!

The .env template already contains these **ready-to-use passwords** from the manual:

- ✅ **Database Password**: `Sk7R@k$y$_DB_2024!#`
- ✅ **JWT Secret**: `8f2e4c1a9b7d5e3f0a1b2c3d4e5f6789abcdef01234567890123456789abcdef`
- ✅ **JWT Refresh Secret**: `9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b`
- ✅ **Session Secret**: `Nm8*pL5$wX3@rQ9%vK2!fS7ZgH4&nM1$oP6#bC8@dE1%`

**No password generation needed** - just update the domain and email!

## ✅ Success Check

After setup, run this command:
```bash
echo "✅ Database Password: $(grep DB_PASSWORD .env | cut -d= -f2)"
echo "✅ JWT Secret Length: $(grep JWT_SECRET .env | cut -d= -f2 | wc -c) characters"
echo "✅ Domain: $(grep API_BASE_URL .env | cut -d= -f2)"
```

Should show:
- Database Password: `Sk7R@k$y$_DB_2024!#`
- JWT Secret Length: `65 characters` 
- Domain: Your actual domain/IP

---

**You're ready to proceed with the installation!** 🚀

*Follow the main manual guide: `redhatprod/NOVICE_MANUAL_SETUP_GUIDE.md`*