# SkyRakSys HRM Production Security Guide
# Default Passwords and Security Configuration

## Overview
This guide provides comprehensive information about all default passwords created during the SkyRakSys HRM production installation and setup process. This includes passwords for PostgreSQL database, application accounts, infrastructure services, and security tokens.

## ⚠️ CRITICAL SECURITY WARNING

**ALL DEFAULT PASSWORDS MUST BE CHANGED IMMEDIATELY AFTER INSTALLATION**

The default passwords provided are for initial setup only and are NOT secure for production use. Failure to change these passwords will leave your system vulnerable to unauthorized access.

## Default Passwords Created During Installation

### 1. PostgreSQL Database Passwords

#### PostgreSQL Superuser (postgres)
- **Username**: `postgres`
- **Default Password**: `SkyRakSys2024!PostgreSQL`
- **Purpose**: PostgreSQL administration and setup
- **Change Priority**: HIGH - Change immediately after installation

#### Application Database User
- **Username**: `hrm_prod_user`
- **Default Password**: `HRM_Prod_2024!Database`
- **Purpose**: Application database access with limited privileges
- **Change Priority**: HIGH - Change immediately after installation

### 2. Application Admin Accounts

#### System Administrator
- **Email**: `admin@skyraksys.com`
- **Default Password**: `SkyRakSys@Admin2024!`
- **Role**: System Administrator (full access)
- **Change Priority**: CRITICAL - Change before first use

#### HR Manager
- **Email**: `hr@skyraksys.com`
- **Default Password**: `SkyRakSys@HR2024!`
- **Role**: HR Manager (HR module access)
- **Change Priority**: HIGH - Change before first use

#### Project Manager
- **Email**: `manager@skyraksys.com`
- **Default Password**: `SkyRakSys@Manager2024!`
- **Role**: Project Manager (project/task management)
- **Change Priority**: HIGH - Change before first use

### 3. Infrastructure Service Passwords

#### Redis Password
- **Service**: Redis Cache/Session Store
- **Default Password**: `SkyRakSys@Redis2024!`
- **Purpose**: Session storage and application caching
- **Change Priority**: MEDIUM - Change during setup

#### Nginx Admin Access
- **Username**: `sysadmin`
- **Default Password**: `SkyRakSys@Nginx2024!`
- **Purpose**: HTTP Basic Auth for admin endpoints
- **Change Priority**: MEDIUM - Change during setup

#### SSL Certificate Password
- **Default Password**: `SkyRakSys@SSL2024!`
- **Purpose**: Private key encryption
- **Change Priority**: HIGH - Change when setting up SSL

### 4. Security Tokens and Keys

#### JWT Secrets
- **JWT Secret**: `SkyRakSys_HRM_2024_JWT_Secret_Key_Production_64_Characters_Min`
- **JWT Refresh Secret**: `SkyRakSys_HRM_2024_Refresh_Token_Secret_Production_Key_64_Chars`
- **Purpose**: Token generation and validation
- **Change Priority**: CRITICAL - Change before production use

#### Session Secret
- **Default Value**: `SkyRakSys_HRM_2024_Session_Secret_Production_Key_Change_This`
- **Purpose**: Session encryption and management
- **Change Priority**: CRITICAL - Change before production use

#### Encryption Keys
- **Encryption Key**: `SkyRakSys_HRM_2024_Data_Encryption_Key_32_Characters`
- **Encryption IV**: `SkyRakSys_2024_IV_16`
- **Purpose**: Sensitive data encryption
- **Change Priority**: CRITICAL - Change before production use

### 5. Email Service Passwords

#### SMTP Configuration
- **Email**: `noreply@skyraksys.com`
- **Default Password**: `SkyRakSys@Email2024!`
- **Purpose**: System email notifications
- **Change Priority**: MEDIUM - Configure with actual email service

### 6. Backup Service Passwords

#### Backup Encryption
- **Default Password**: `SkyRakSys@BackupEncryption2024!`
- **Purpose**: Backup file encryption
- **Change Priority**: HIGH - Change before enabling backups

#### FTP Backup Account
- **Username**: `hrm_backup_user`
- **Default Password**: `SkyRakSys@Backup2024!`
- **Purpose**: Remote backup storage
- **Change Priority**: MEDIUM - Configure if using FTP backups

## Password Change Instructions

### 1. Database Passwords

#### Change PostgreSQL Admin Password
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Change postgres user password
ALTER USER postgres PASSWORD 'new_secure_password_here';

# Update .env file
DB_PASSWORD=new_secure_password_here
POSTGRES_ADMIN_PASSWORD=new_secure_password_here
```

#### Change Application Database User Password
```bash
# Connect to PostgreSQL as admin
sudo -u postgres psql

# Change application user password
ALTER USER hrm_prod_user PASSWORD 'new_app_password_here';

# Update .env file
DB_PASSWORD=new_app_password_here
```

### 2. Application Admin Passwords

#### Change Admin Passwords via Web Interface
1. Log in with default credentials
2. Navigate to Profile Settings
3. Change password immediately
4. Update password in any automation scripts

#### Change Admin Passwords via Command Line
```bash
# Navigate to application directory
cd /opt/skyraksys-hrm

# Run password change script
node scripts/change-admin-password.js --email admin@skyraksys.com --password new_secure_password
```

### 3. Generate Secure Passwords

#### Using OpenSSL
```bash
# Generate 32-character random password
openssl rand -base64 32

# Generate hexadecimal password
openssl rand -hex 32
```

#### Using pwgen
```bash
# Generate secure password
pwgen -s 32 1
```

#### Using Node.js
```bash
# Generate random secure string
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Update Configuration Files

#### Environment File (.env)
```bash
# Set proper permissions
chmod 600 .env

# Update passwords in .env file
nano .env

# Restart application after changes
pm2 restart skyraksys-hrm
```

#### Service Configuration
```bash
# Update systemd service if needed
sudo systemctl edit skyraksys-hrm

# Reload and restart service
sudo systemctl daemon-reload
sudo systemctl restart skyraksys-hrm
```

## Security Best Practices

### 1. Password Requirements
- **Minimum Length**: 12 characters
- **Complexity**: Include uppercase, lowercase, numbers, and symbols
- **Uniqueness**: Use different passwords for each service
- **Rotation**: Change passwords every 90 days

### 2. Storage and Management
- Use a enterprise password manager
- Never store passwords in plain text
- Never commit passwords to version control
- Encrypt configuration files with sensitive data

### 3. Access Control
- Implement least privilege principle
- Use role-based access control
- Enable two-factor authentication where possible
- Monitor and log authentication attempts

### 4. Network Security
- Use HTTPS/SSL for all communications
- Implement proper firewall rules
- Use VPN for administrative access
- Regular security audits and penetration testing

## Password Change Checklist

### Immediate Changes (Before Production Use)
- [ ] PostgreSQL admin password (`postgres` user)
- [ ] Application database user password (`hrm_prod_user`)
- [ ] System admin account password
- [ ] JWT secrets and session secrets
- [ ] Encryption keys

### During Setup
- [ ] HR Manager account password
- [ ] Project Manager account password
- [ ] Redis password
- [ ] Nginx admin password
- [ ] SSL certificate passwords

### Before Enabling Features
- [ ] Email service passwords
- [ ] Backup encryption password
- [ ] FTP backup credentials
- [ ] API keys and tokens
- [ ] Third-party service credentials

## Monitoring and Alerting

### 1. Failed Login Attempts
- Monitor failed authentication attempts
- Set up alerts for multiple failed logins
- Implement account lockout policies

### 2. Password Policy Violations
- Enforce strong password requirements
- Monitor for weak or default passwords
- Regular password strength audits

### 3. Security Events
- Log all administrative actions
- Monitor configuration file changes
- Alert on unauthorized access attempts

## Emergency Procedures

### 1. Compromised Password
1. Immediately change the compromised password
2. Review access logs for unauthorized activity
3. Check for any data breaches or unauthorized changes
4. Update all related systems and services
5. Notify relevant stakeholders

### 2. System Breach
1. Isolate affected systems
2. Change ALL passwords and tokens
3. Review and update security configurations
4. Conduct thorough security audit
5. Implement additional security measures

## Regular Maintenance

### 1. Monthly Tasks
- Review password policy compliance
- Check for weak or expired passwords
- Update security patches and configurations
- Review access logs and security events

### 2. Quarterly Tasks
- Change all administrative passwords
- Review and update security policies
- Conduct security training for staff
- Perform security vulnerability assessment

### 3. Annual Tasks
- Complete security audit
- Update disaster recovery procedures
- Review and update all security documentation
- Test emergency response procedures

## Support and Documentation

### 1. Password Recovery
- Document password recovery procedures
- Maintain secure backup of critical passwords
- Test recovery procedures regularly

### 2. Documentation Updates
- Keep this guide updated with any changes
- Document all password changes with dates
- Maintain security incident log

### 3. Training
- Regular security training for all staff
- Password management best practices
- Incident response procedures

## Contact Information

For security issues or questions about password management:
- **Security Team**: security@skyraksys.com
- **System Administrator**: admin@skyraksys.com
- **Emergency Contact**: +1-234-567-8900

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular monitoring, updates, and maintenance are essential for maintaining a secure production environment.
