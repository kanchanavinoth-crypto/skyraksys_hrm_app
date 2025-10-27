#!/bin/bash
# Skyraksys HRM - Cleanup Previous Deployment (Novice-Friendly)
# Safely stops services, backs up configs/env, and removes old frontend build.

set -e

echo "[CLEANUP] Starting cleanup of previous deployment..."

timestamp=$(date +%Y%m%d-%H%M%S)

stop_service() {
  local svc=$1
  if systemctl list-units --type=service --all | grep -q "${svc}.service"; then
    echo "[CLEANUP] Stopping service: $svc"
    systemctl stop "$svc" || true
    echo "[CLEANUP] Disabling service: $svc"
    systemctl disable "$svc" || true
  else
    echo "[CLEANUP] Service $svc not found (skipping)"
  fi
}

echo "[CLEANUP] Stopping services..."
stop_service hrm-frontend
stop_service hrm-backend
stop_service nginx || true

echo "[CLEANUP] Backing up Nginx config if present..."
if [ -f /etc/nginx/conf.d/hrm.conf ]; then
  cp /etc/nginx/conf.d/hrm.conf /etc/nginx/conf.d/hrm.conf.bak-$timestamp
  rm -f /etc/nginx/conf.d/hrm.conf
  echo "[CLEANUP] Removed old /etc/nginx/conf.d/hrm.conf (backup created)"
fi

echo "[CLEANUP] Removing old frontend build..."
rm -rf /opt/skyraksys-hrm/frontend/build || true

echo "[CLEANUP] Cleaning old frontend logs..."
rm -f /var/log/skyraksys-hrm/frontend*.log || true

echo "[CLEANUP] Backing up existing env file if present..."
if [ -f /opt/skyraksys-hrm/.env ]; then
  cp /opt/skyraksys-hrm/.env /opt/skyraksys-hrm/.env.bak-$timestamp
  echo "[CLEANUP] Backed up /opt/skyraksys-hrm/.env to .env.bak-$timestamp"
  # Uncomment to auto-remove for full reprovision
  # rm -f /opt/skyraksys-hrm/.env
fi

echo "[CLEANUP] Cleanup complete. You can now run deployment scripts."
echo "[NEXT] Run: sudo ./redhatprod/scripts/03_deploy_application.sh"

exit 0
