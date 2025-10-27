# 🚀 Quick Setup Guide - SkyRakSys HRM (Unix/Linux)

## One-Command Installation

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/skyraksys-hrm/main/PRODUnix/install.sh | bash
```

## Manual Quick Setup

### 1. Download & Extract

```bash
# Download production package
git clone https://github.com/your-repo/skyraksys-hrm.git
cd skyraksys-hrm/PRODUnix

# OR download and extract zip
wget https://github.com/your-repo/skyraksys-hrm/archive/main.zip
unzip main.zip
cd skyraksys-hrm-main/PRODUnix
```

### 2. Make Scripts Executable

```bash
chmod +x scripts/*.sh *.sh
```

### 3. Run Setup

```bash
sudo ./scripts/setup-production.sh
```

**The setup will automatically:**
- Install dependencies (Node.js, PostgreSQL, etc.)
- Configure PostgreSQL database
- Create database schema and tables
- Seed initial system data
- Optionally create comprehensive test data
- Set up SSL certificates
- Configure startup scripts

### 4. Configure Environment

```bash
cp config/.env.template .env
nano .env  # Edit required settings
```

**Minimum required settings:**
```bash
DB_PASSWORD=your_secure_password
JWT_SECRET=your_64_character_secret_key
DOMAIN=yourdomain.com  # or localhost for local setup
```

### 5. Start Application

```bash
./start.sh
```

### 6. Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **Health Check:** http://localhost:3001/health

## Default Login

- **Email:** admin@skyraksys.com
- **Password:** admin123

⚠️ **Change default credentials immediately after first login!**

## Database Management

```bash
# Interactive database management
./manage-database.sh

# Available options:
# 1. Install PostgreSQL
# 2. Create database schema
# 3. Seed initial data
# 4. Create test data
# 5. Reset database
# 6. Backup database
# 7. Restore database
# 8. Check status
```

## Quick Commands

```bash
./status.sh      # Check application status
./logs.sh        # View application logs
./stop.sh        # Stop application
./restart.sh     # Restart application
./backup.sh      # Create backup
./health-check.sh # System health check
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   sudo lsof -i :8080
   sudo kill -9 <PID>
   ```

2. **Database connection failed:**
   ```bash
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

3. **Permission denied:**
   ```bash
   chmod +x *.sh scripts/*.sh
   sudo chown -R $USER:$USER .
   ```

4. **Dependencies missing:**
   ```bash
   ./scripts/setup-environment.sh
   ```

### Log Locations

- **Application:** `logs/backend/combined.log`
- **Database:** `/var/log/postgresql/`
- **Nginx:** `/var/log/nginx/`
- **System:** `journalctl -f`

## Docker Quick Start

```bash
# Copy environment template
cp config/.env.template .env

# Edit configuration
nano .env

# Start with Docker
docker-compose -f docker/docker-compose.yml up -d

# Check status
docker-compose -f docker/docker-compose.yml ps
```

## Production Checklist

- [ ] Change default passwords
- [ ] Configure SSL certificates
- [ ] Set up firewall rules
- [ ] Configure backup schedule
- [ ] Set up monitoring
- [ ] Test disaster recovery
- [ ] Update DNS records
- [ ] Configure email settings

## Getting Help

- **Documentation:** See `README.md` for complete setup guide
- **Health Check:** `./health-check.sh`
- **System Info:** `./scripts/system-info.sh`
- **Support Logs:** `tar -czf support.tar.gz logs/`

## Next Steps

1. **Security:** Configure SSL, firewall, and security headers
2. **Monitoring:** Set up log monitoring and alerting
3. **Backups:** Schedule automated backups
4. **Scaling:** Configure load balancing for high availability
5. **Updates:** Set up automated update procedures

---

For detailed documentation, see the complete `README.md` file.
