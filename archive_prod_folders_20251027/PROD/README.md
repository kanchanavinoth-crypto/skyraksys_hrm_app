# 🚀 SkyRakSys HRM - Production Deployment Package

## Quick Start Guide

This directory contains everything you need to deploy SkyRakSys HRM in a production environment.

## 📁 Directory Structure

```
PROD/
├── setup-production.bat          # Main setup script (START HERE)
├── scripts/                      # Setup and utility scripts
│   ├── setup-environment.bat     # Environment configuration
│   ├── setup-postgresql.bat      # Database setup
│   ├── generate-ssl.bat          # SSL certificate generation
│   └── create-startup-scripts.bat # Application startup scripts
├── docker/                       # Docker deployment files
│   ├── docker-compose.prod.yml   # Production Docker Compose
│   ├── Dockerfile.backend        # Backend container
│   └── Dockerfile.frontend       # Frontend container
├── nginx/                        # Nginx configuration
│   └── nginx.conf                # Production nginx config
├── config/                       # Configuration templates
│   └── .env.production.template  # Environment variables template
└── docs/                         # Documentation
    └── PRODUCTION_SETUP_GUIDE.md # Complete setup guide
```

## 🚀 Three Ways to Deploy

### Option 1: Automated Setup (Recommended)

```batch
# Run the main setup script
.\setup-production.bat
```

This interactive script will:
- ✅ Check prerequisites
- ✅ Create directory structure  
- ✅ Install dependencies
- ✅ Configure environment
- ✅ Setup database
- ✅ Generate SSL certificates
- ✅ Create startup scripts

### Option 2: Docker Deployment

```batch
# Navigate to docker directory
cd docker

# Copy and configure environment
copy .env.example .env
# Edit .env with your values

# Start with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Manual Setup

Follow the detailed instructions in `docs/PRODUCTION_SETUP_GUIDE.md`

## 📋 Prerequisites

- **Node.js** 16+ and npm 8+
- **PostgreSQL** 12+ (or Docker)
- **Git** (for cloning repository)
- **Windows Server 2019+** or **Linux Ubuntu 20.04+**

## ⚡ Quick Commands

After setup, use these commands to manage your application:

```batch
# Start application
.\start.bat

# Stop application  
.\stop.bat

# Check status
.\status.bat

# View logs
.\logs.bat

# Create backup
.\backup.bat

# Development mode
.\start-dev.bat
```

## 🔧 Configuration

Key files to configure:

1. **Environment Variables**: `backend/.env.production`
2. **Database**: Update connection settings in environment file
3. **SSL**: Place certificates in `ssl/` directory
4. **Domain**: Update nginx config with your domain

## 🛡️ Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Generate secure JWT secrets (64+ characters)
- [ ] Configure SSL certificates
- [ ] Set up firewall rules
- [ ] Enable HTTPS only
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts

## 📊 Access Points

After deployment, your application will be available at:

- **Frontend**: https://yourdomain.com
- **Backend API**: https://yourdomain.com/api
- **Health Check**: https://yourdomain.com/health
- **pgAdmin** (if enabled): http://yourdomain.com:8081

## 📚 Documentation

- **Complete Setup Guide**: `docs/PRODUCTION_SETUP_GUIDE.md`
- **Docker Guide**: `docker/README.md`
- **Security Guide**: `docs/SECURITY_GUIDE.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`

## 🆘 Need Help?

1. **Check the logs**: `.\logs.bat`
2. **Read the documentation**: `docs/PRODUCTION_SETUP_GUIDE.md`
3. **Verify health**: Visit `/health` endpoint
4. **Check system status**: `.\status.bat`

## 🔄 Updates and Maintenance

```batch
# Update application
git pull origin main
.\stop.bat
.\scripts\update-production.bat
.\start.bat

# Create backup before updates
.\backup.bat
```

## 📝 Environment Variables

Essential variables to configure in `backend/.env.production`:

```env
# Domain and URLs
DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Database
DB_HOST=localhost
DB_NAME=skyraksys_hrm_prod  
DB_USER=hrm_prod_user
DB_PASSWORD=your-secure-password

# Security
JWT_SECRET=your-64-character-secret
SSL_ENABLED=true
```

## 🎯 Production Features

This production setup includes:

- ✅ **High Performance**: PM2 cluster mode, nginx reverse proxy
- ✅ **Security**: SSL/TLS, rate limiting, security headers
- ✅ **Monitoring**: Health checks, logging, optional Grafana/Prometheus  
- ✅ **Scalability**: Docker containerization, load balancing ready
- ✅ **Reliability**: Auto-restart, graceful shutdowns, error handling
- ✅ **Backup**: Automated database and file backups
- ✅ **Maintenance**: Update scripts, log rotation, performance monitoring

---

## 🚀 Get Started Now!

```batch
# Clone this repository
git clone https://github.com/yourusername/skyraksys-hrm.git
cd skyraksys-hrm\PROD

# Run setup script
.\setup-production.bat

# Follow the prompts and you'll be live in minutes!
```

**Need immediate help?** Check `docs/PRODUCTION_SETUP_GUIDE.md` for detailed instructions.

---

**Made with ❤️ by SkyRakSys Team**
