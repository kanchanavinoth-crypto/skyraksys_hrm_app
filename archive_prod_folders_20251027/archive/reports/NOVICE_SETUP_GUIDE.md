# SkyRakSys HRM - Novice-Friendly Production Setup Guide

## Overview
This guide helps complete beginners set up the SkyRakSys HRM system in production with automatically generated secure passwords. No technical expertise required!

## 🚀 Quick Start (For Complete Beginners)

### Step 1: Choose Your Operating System

#### For Windows Users:
1. Download the `PROD` folder
2. Open Command Prompt as Administrator
3. Navigate to the PROD folder: `cd path\to\PROD`
4. Run: `setup-production.bat`
5. Follow the on-screen instructions

#### For Linux/Unix/Mac Users:
1. Download the `PRODUnix` folder
2. Open Terminal
3. Navigate to the PRODUnix folder: `cd path/to/PRODUnix`
4. Make setup script executable: `chmod +x setup-production.sh`
5. Run: `./setup-production.sh`
6. Follow the on-screen instructions

## 🔐 What Happens Automatically

### Passwords Generated For You:
- **PostgreSQL Database Password** - For database access
- **Admin Account Passwords** - For system administrator login
- **HR Manager Password** - For HR staff login
- **Project Manager Password** - For project manager login
- **Security Tokens** - For application security
- **Service Passwords** - For Redis, Nginx, SSL, etc.

### Files Created Automatically:
- `.env` - Configuration file with all settings
- `config/generated-passwords.txt` - All your passwords in one file
- Database setup scripts
- SSL certificates (if selected)
- Startup/shutdown scripts

## 📋 Step-by-Step Process

### What You'll Be Asked During Setup:

1. **Source Code Location**
   - Option 1: Clone from Git (if you have the repository URL)
   - Option 2: Copy from existing project folder
   - Option 3: Manual setup (you provide the files)

2. **Database Setup**
   - Option 1: Install PostgreSQL automatically (recommended)
   - Option 2: Use existing database
   - Option 3: Skip database setup

3. **SSL Certificates**
   - Option 1: Generate self-signed certificates (for testing)
   - Option 2: Use your own certificates
   - Option 3: Skip SSL setup

4. **Test Data**
   - Yes: Create sample employees, projects, etc.
   - No: Start with empty system

## 🔑 Your Generated Passwords

After setup completes, you'll find all passwords in:
- **Windows**: `PROD\config\generated-passwords.txt`
- **Linux/Mac**: `PRODUnix/config/generated-passwords.txt`

### Sample Password File Content:
```
[PostgreSQL Database]
Username: postgres
Password: Kx9mP2nR7qE4sT8vY3wZ1aB5cD6fG0h

[System Administrator]
Email: admin@skyraksys.com
Password: Admin2024!SecurePass

[HR Manager]
Email: hr@skyraksys.com
Password: HR2024!SecurePass

[Project Manager]
Email: manager@skyraksys.com
Password: Manager2024!SecurePass
```

## 🛡️ Critical Security Steps (IMPORTANT!)

### Immediately After Setup:

1. **Copy Password File**
   - Copy `generated-passwords.txt` to a secure location
   - Use a password manager like LastPass, 1Password, or Bitwarden
   - Email it to yourself and delete from server

2. **Remove Password File from Server**
   ```bash
   # Linux/Mac
   rm config/generated-passwords.txt
   
   # Windows
   del config\generated-passwords.txt
   ```

3. **Test Login**
   - Open your browser
   - Go to `http://your-server-ip:3001`
   - Login with admin credentials
   - Change password immediately

4. **Change All Passwords**
   - Login to admin account
   - Go to User Management
   - Change admin password
   - Change HR manager password
   - Change project manager password

## 🚀 Starting Your Application

### After Setup is Complete:

#### Windows:
```batch
cd PROD\hrm-production
npm run start:production
```

#### Linux/Mac:
```bash
cd PRODUnix
./start.sh
```

### Accessing Your Application:
- Open browser: `http://your-server-ip:3001`
- Login with credentials from password file
- Change passwords immediately

## 📖 Common Beginner Questions

### Q: Do I need to install anything before running setup?
**A:** Yes, you need:
- Node.js (version 16 or higher)
- Git (for downloading code)
- PostgreSQL (can be installed during setup)

### Q: What if I don't have technical knowledge?
**A:** The setup script handles everything automatically:
- Generates secure passwords
- Configures database
- Sets up all services
- Creates startup scripts

### Q: Is it safe for production use?
**A:** Yes, but follow security steps:
- Use generated passwords (they're cryptographically secure)
- Remove password file from server after copying
- Change passwords after first login
- Use HTTPS in production

### Q: What if setup fails?
**A:** Check these common issues:
- Node.js not installed
- Insufficient permissions (run as admin/sudo)
- Firewall blocking ports
- PostgreSQL installation failed

### Q: How do I stop the application?
**A:** 
- Windows: `npm run stop` or `Ctrl+C`
- Linux/Mac: `./stop.sh` or `Ctrl+C`

### Q: How do I update passwords later?
**A:** Use the password management scripts:
- Windows: `scripts\manage-passwords.bat`
- Linux/Mac: `scripts/manage-passwords.sh`

## 🎯 Quick Success Checklist

- [ ] Downloaded correct folder (PROD for Windows, PRODUnix for Linux/Mac)
- [ ] Installed Node.js and Git
- [ ] Ran setup script successfully
- [ ] Copied password file to secure location
- [ ] Removed password file from server
- [ ] Started application successfully
- [ ] Logged in with generated credentials
- [ ] Changed admin password
- [ ] Application is accessible from browser

## 🆘 Getting Help

If you run into issues:

1. **Check the logs**: Look in the `logs/` folder for error messages
2. **Verify prerequisites**: Ensure Node.js and Git are installed
3. **Check permissions**: Run as administrator/sudo if needed
4. **Review documentation**: Check the `docs/` folder for detailed guides

## 🔄 What's Next?

After successful setup:

1. **Company Configuration**
   - Login as admin
   - Go to Settings > Company Profile
   - Update company information

2. **User Management**
   - Add real employees
   - Assign roles and permissions
   - Set up departments

3. **System Configuration**
   - Configure email settings
   - Set up payroll parameters
   - Configure leave policies

4. **Security Hardening**
   - Enable HTTPS
   - Set up firewall rules
   - Configure backup schedules

## 📞 Support

For additional help:
- Email: support@skyraksys.com
- Documentation: Check the `docs/` folder
- Community: GitHub Issues section

---

**Remember**: The setup script makes production deployment accessible to beginners while maintaining enterprise-level security through automatic password generation and secure configuration.
