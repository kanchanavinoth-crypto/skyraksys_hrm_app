# 🚀 Quick Reference Card
## One-Page Deployment Cheat Sheet

**Server:** 95.216.14.232 (RHEL 9.6)  
**Keep This Handy!**

---

## 📋 **ESSENTIAL INFO**

### **Ports**
| Service | Port | Access |
|---------|------|--------|
| Nginx | 80 | Public |
| Backend | 5000 | localhost |
| Frontend | 3000 | localhost |
| PostgreSQL | 5432 | localhost |

### **URLs**
- **App:** http://95.216.14.232
- **API:** http://95.216.14.232/api
- **Health:** http://95.216.14.232/api/health

### **Credentials**
```
Admin: admin@company.com / Kx9mP7qR2nF8sA5t
HR: hr@company.com / Hr9pQ2xM5nK8wT3v
Employee: employee@company.com / Em7rL4cN9fV2bH6m
```

---

## ⚡ **QUICK COMMANDS**

### **Deploy**
```bash
ssh root@95.216.14.232
cd /opt/skyraksys-hrm/redhatprod/scripts
./fix_deployment_issues.sh
```

### **Check Services**
```bash
systemctl status hrm-backend hrm-frontend nginx postgresql-15
```

### **Restart Services**
```bash
systemctl restart hrm-backend hrm-frontend nginx
```

### **Check Logs**
```bash
journalctl -u hrm-backend -f
journalctl -u hrm-frontend -f
tail -f /var/log/nginx/hrm_error.log
```

### **Test Health**
```bash
curl http://95.216.14.232/api/health
```

---

## 🔧 **COMMON FIXES**

### **Service Won't Start**
```bash
journalctl -u hrm-backend -n 50
systemctl daemon-reload
systemctl restart hrm-backend
```

### **Frontend Blank Page**
```bash
cd /opt/skyraksys-hrm/frontend
sudo -u hrmapp npm run build
systemctl restart hrm-frontend
```

### **CORS Errors**
```bash
# Fix .env
echo "TRUST_PROXY=true" >> /opt/skyraksys-hrm/backend/.env
systemctl restart hrm-backend
```

### **Database Issues**
```bash
systemctl status postgresql-15
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 1;"
```

---

## 📂 **FILE LOCATIONS**

```
/opt/skyraksys-hrm/
├── backend/.env              # Backend config
├── frontend/.env.production  # Frontend prod config
├── ecosystem.config.js       # PM2 config
/etc/systemd/system/
├── hrm-backend.service
├── hrm-frontend.service
/etc/nginx/conf.d/
└── hrm.conf                  # Nginx config
/var/log/skyraksys-hrm/       # Application logs
```

---

## 🆘 **EMERGENCY**

### **Quick Rollback**
```bash
systemctl stop hrm-backend hrm-frontend
BACKUP=$(ls -t /root/hrm-backup-* | head -n 1)
cp $BACKUP/* /opt/skyraksys-hrm/
systemctl start hrm-backend hrm-frontend
```

### **Full Docs**
📚 See: `docs/deployment-guide/README.md`

---

**Print this and keep near your desk!**
