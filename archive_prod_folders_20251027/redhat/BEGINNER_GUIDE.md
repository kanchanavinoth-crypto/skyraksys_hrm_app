# 🚀 SkyrakSys HRM - Beginner's Production Deployment Guide

## 👋 Welcome! This Guide is for You If:

- ✅ You're new to Linux server administration
- ✅ You want to deploy SkyrakSys HRM on Red Hat Linux
- ✅ You prefer step-by-step instructions with explanations
- ✅ You want to understand what each command does

---

## 📋 What You Need Before Starting

### 🖥️ **Your Server Requirements**
- **Operating System**: Red Hat Enterprise Linux 8 or 9 (or CentOS 8)
- **Memory (RAM)**: At least 4GB (8GB is better)
- **Storage**: At least 20GB free space
- **Internet**: Your server needs internet access
- **Access**: You need to be able to login as 'root' or use 'sudo'

### 🌐 **Optional (but recommended)**
- A domain name (like hrm.yourcompany.com) 
- If you don't have one, you can use your server's IP address

### ✅ **Quick Check: Is Your Server Ready?**
```bash
# Check your operating system
cat /etc/redhat-release
# Should show something like "Red Hat Enterprise Linux release 8.x"

# Check available memory
free -h
# Should show at least 4GB total memory

# Check free disk space
df -h
# Should show at least 20GB available on root (/) partition

# Check internet connection
ping -c 3 google.com
# Should show successful ping responses
```

---

## 🎯 **Option 1: Super Easy Installation (Recommended for Beginners)**

### **What This Does:**
This automated script will install everything for you. It's like having an expert do the installation while you watch.

### **Step 1: Download the Installation Files**
```bash
# First, let's download the application files
# (This downloads about 50MB, takes 1-2 minutes)
wget https://github.com/Otyvino/skyrakskys_hrm/archive/refs/heads/main.zip

# Extract the files (like unzipping)
unzip main.zip

# Go to the installation directory
cd skyrakskys_hrm-main/redhat

# Make the installation scripts runnable
chmod +x scripts/*.sh
```

**💡 What just happened?**
- We downloaded the application code from GitHub
- We extracted it (like unzipping a file)
- We gave permission to run the installation scripts

### **Step 2: Run the Automated Installation**
```bash
# Start the installation (you'll need to enter some information)
sudo ./scripts/install-complete.sh
```

**📝 During installation, you'll be asked for:**

1. **Domain name**: 
   - If you have one: `hrm.yourcompany.com`
   - If you don't: just type `localhost` or your server's IP address

2. **Database password**: 
   - Choose a strong password (at least 12 characters)
   - Write it down! You'll need it later
   - Example: `MySecurePassword123!`

3. **Admin email**: 
   - Your email address for SSL certificate notifications
   - Example: `admin@yourcompany.com`

**⏱️ Installation Time:** 15-30 minutes depending on your internet speed

### **Step 3: Verify Everything Worked**
```bash
# Check if installation was successful
sudo ./scripts/verify-deployment.sh
```

**✅ Success Indicators:**
- You should see "All tests passed!"
- Success rate should be 100% or close to it

### **Step 4: Access Your Application**
Open a web browser and go to:
- `http://your-server-ip` (if you used IP address)
- `http://your-domain.com` (if you used a domain name)

**🎉 That's it! Your HRM system should be running!**

---

## 🛠️ **Option 2: Manual Installation (For Learning)**

If you want to understand what's happening or the automated installation didn't work, follow these steps:

### **Phase 1: Prepare Your Server (5-10 minutes)**

```bash
# Update your system (this might take 5-10 minutes)
echo "Updating system packages..."
sudo dnf update -y

# Install essential tools
echo "Installing basic tools..."
sudo dnf install -y epel-release wget curl git unzip nano

# Configure firewall (security)
echo "Setting up firewall..."
sudo systemctl start firewalld
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**💡 What this does:**
- Updates all software on your server for security
- Installs basic tools we'll need
- Sets up firewall to allow web traffic

### **Phase 2: Install Required Software (10-15 minutes)**

#### **Install Node.js (JavaScript runtime)**
```bash
# Add Node.js software repository
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Install Node.js
sudo dnf install -y nodejs

# Verify it worked
node --version
npm --version

# Install process manager
sudo npm install -g pm2
```

**💡 What this does:**
- Installs Node.js (needed to run the backend application)
- Installs PM2 (keeps your application running)

#### **Install PostgreSQL Database**
```bash
# Add PostgreSQL repository
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Install PostgreSQL
sudo dnf install -y postgresql15-server postgresql15

# Set up the database
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb

# Start the database service
sudo systemctl start postgresql-15
sudo systemctl enable postgresql-15
```

**💡 What this does:**
- Installs PostgreSQL database (stores your HR data)
- Sets up and starts the database service

#### **Install Nginx Web Server**
```bash
# Install Nginx
sudo dnf install -y nginx

# Start the web server
sudo systemctl start nginx
sudo systemctl enable nginx
```

**💡 What this does:**
- Installs Nginx (serves your website to users)
- Starts the web server

### **Phase 3: Deploy the Application (10-15 minutes)**

#### **Create Application User**
```bash
# Create a user for the application
sudo useradd -m -s /bin/bash hrm

# Create directories
sudo mkdir -p /opt/skyraksys_hrm
sudo mkdir -p /var/log/skyraksys_hrm

# Set permissions
sudo chown -R hrm:hrm /opt/skyraksys_hrm
sudo chown -R hrm:hrm /var/log/skyraksys_hrm
```

#### **Download and Install Application**
```bash
# Download the application
sudo -u hrm git clone https://github.com/Otyvino/skyrakskys_hrm.git /opt/skyraksys_hrm

# Install backend dependencies
cd /opt/skyraksys_hrm/backend
sudo -u hrm npm install --production

# Build frontend
cd /opt/skyraksys_hrm/frontend
sudo -u hrm npm install
sudo -u hrm npm run build
```

**💡 What this does:**
- Downloads the HRM application code
- Installs all required dependencies
- Builds the frontend for production

### **Phase 4: Configure Database (5 minutes)**

```bash
# Create database
sudo -u postgres createdb skyraksys_hrm

# Create database user
sudo -u postgres psql -c "CREATE USER hrm_admin WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_admin;"
```

**🔑 Important:** Replace `YourStrongPassword123!` with your own strong password!

### **Phase 5: Configure Environment**

```bash
# Create environment configuration file
sudo nano /opt/skyraksys_hrm/backend/.env
```

**Copy and paste this configuration** (update the password):
```bash
NODE_ENV=production
PORT=8080

DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=hrm_admin
DB_PASSWORD=YourStrongPassword123!
DB_DIALECT=postgres

JWT_SECRET=your-super-secret-jwt-key-for-production
CORS_ORIGIN=http://your-domain-or-ip
```

**💾 Save the file:** Press `Ctrl+X`, then `Y`, then `Enter`

### **Phase 6: Start the Application**

```bash
# Set up database tables
cd /opt/skyraksys_hrm/backend
sudo -u hrm npm run migrate
sudo -u hrm npm run seed

# Start the application with PM2
sudo -u hrm pm2 start ecosystem.config.js --env production
sudo -u hrm pm2 save
```

---

## 🔍 **How to Check if Everything is Working**

### **Basic Health Checks**
```bash
# Check if services are running
sudo systemctl status postgresql-15
sudo systemctl status nginx

# Check if application is running
sudo -u hrm pm2 status

# Test the application
curl http://localhost:8080/api/health
```

### **Access Your Application**
1. Open a web browser
2. Go to `http://your-server-ip` or `http://your-domain.com`
3. You should see the SkyrakSys HRM login page

### **Default Login Credentials**
The system creates these default users:
- **Admin**: admin@company.com (password shown in logs)
- **HR**: hr@company.com (password shown in logs)
- **Employee**: employee@company.com (password shown in logs)

To see the passwords:
```bash
sudo -u hrm pm2 logs
```

---

## 🚨 **Common Problems and Solutions**

### **Problem: "Permission denied"**
**Solution:** Make sure you're using `sudo` for system commands
```bash
# Wrong:
dnf install nodejs

# Correct:
sudo dnf install nodejs
```

### **Problem: "Command not found"**
**Solution:** Install the missing package
```bash
# If 'wget' is not found:
sudo dnf install -y wget

# If 'git' is not found:
sudo dnf install -y git
```

### **Problem: "Connection refused" when accessing website**
**Solution:** Check if services are running
```bash
# Check Nginx
sudo systemctl status nginx
sudo systemctl start nginx

# Check application
sudo -u hrm pm2 status
sudo -u hrm pm2 restart all
```

### **Problem: "Database connection failed"**
**Solution:** Check PostgreSQL and credentials
```bash
# Check PostgreSQL
sudo systemctl status postgresql-15
sudo systemctl start postgresql-15

# Check database exists
sudo -u postgres psql -l | grep skyraksys_hrm
```

### **Problem: Installation script fails**
**Solution:** Try manual installation or check logs
```bash
# Check system logs for errors
sudo journalctl -xe

# Try individual component installation
sudo ./scripts/install-nodejs.sh
sudo ./scripts/install-postgresql.sh
sudo ./scripts/install-nginx.sh
```

---

## 🎯 **Success Checklist**

After installation, you should be able to:

- [ ] Access the website in your browser
- [ ] See the SkyrakSys HRM login page
- [ ] Log in with default credentials
- [ ] Navigate through the application
- [ ] All services show as "active (running)" when you check status

---

## 📞 **Getting Help**

### **View Application Logs**
```bash
# Application logs
sudo -u hrm pm2 logs

# System logs
sudo journalctl -u skyraksys-hrm -f

# Database logs
sudo tail -f /var/lib/pgsql/15/data/log/postgresql-*.log
```

### **Restart Everything**
```bash
# Restart all services
sudo systemctl restart postgresql-15
sudo systemctl restart nginx
sudo -u hrm pm2 restart all
```

### **Complete Status Check**
```bash
# Use the maintenance script for comprehensive status
sudo /opt/skyraksys_hrm/redhat/scripts/maintenance.sh status
```

---

## 🔐 **Security Notes for Production**

1. **Change default passwords** immediately after first login
2. **Update the JWT secret** in your environment file
3. **Set up SSL certificate** for HTTPS (use Let's Encrypt)
4. **Keep your system updated** regularly
5. **Set up regular backups**

---

**🎉 Congratulations!** You now have a fully functional HRM system running on Red Hat Linux!
