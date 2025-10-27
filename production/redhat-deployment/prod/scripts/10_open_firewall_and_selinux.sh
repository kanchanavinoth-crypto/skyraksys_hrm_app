#!/bin/bash
# Skyraksys HRM – Open firewall ports and allow Nginx/HTTPD network connect (RHEL)
# Usage: sudo bash 10_open_firewall_and_selinux.sh

set -e

echo "[INFO] Enabling firewalld (if not already)..."
systemctl enable firewalld >/dev/null 2>&1 || true
systemctl start firewalld >/dev/null 2>&1 || true

echo "[INFO] Opening HTTP (80), Frontend (3000), and Backend (5000) ports..."
firewall-cmd --permanent --add-port=80/tcp || true
firewall-cmd --permanent --add-port=3000/tcp || true
firewall-cmd --permanent --add-port=5000/tcp || true

echo "[INFO] Reloading firewall rules..."
firewall-cmd --reload || true

echo "[INFO] Current open ports:" 
firewall-cmd --list-ports || true

echo "[INFO] Allowing web server processes to make outbound connections (SELinux)..."
if command -v getenforce >/dev/null 2>&1; then
  SELINUX_STATE=$(getenforce)
  echo "[INFO] SELinux state: ${SELINUX_STATE}"
  setsebool -P httpd_can_network_connect 1 || true
fi

echo "[DONE] Firewall and SELinux configuration applied."
echo "- Ensure backend listens on 0.0.0.0:5000 (HOST=0.0.0.0, PORT=5000)"
echo "- Verify: curl -s http://95.216.14.232:5000/api/health"
