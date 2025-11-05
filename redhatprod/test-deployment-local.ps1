# Test Deployment from Visual Studio Code
# Run this from VS Code terminal to monitor remote deployment

param(
    [string]$ServerIP = "95.216.14.232",
    [string]$Action = "status"
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SkyrakSys HRM - Remote Deployment Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

switch ($Action) {
    "test-connection" {
        Write-Host "Testing SSH connection to $ServerIP..." -ForegroundColor Yellow
        ssh root@$ServerIP "echo 'Connection successful!' && uname -a"
    }
    
    "deploy" {
        Write-Host "Starting deployment on $ServerIP..." -ForegroundColor Yellow
        Write-Host "This will take 10-15 minutes..." -ForegroundColor Yellow
        Write-Host ""
        ssh root@$ServerIP "cd /opt/skyraksys-hrm/redhatprod/scripts && bash deploy.sh $ServerIP"
    }
    
    "logs" {
        Write-Host "Streaming deployment logs from $ServerIP..." -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        ssh root@$ServerIP "tail -f /var/log/skyraksys-hrm/deployment.log"
    }
    
    "backend-logs" {
        Write-Host "Backend application logs from $ServerIP..." -ForegroundColor Yellow
        ssh root@$ServerIP "pm2 logs skyraksys-hrm-backend --lines 100 --nostream"
    }
    
    "frontend-logs" {
        Write-Host "Frontend application logs from $ServerIP..." -ForegroundColor Yellow
        ssh root@$ServerIP "pm2 logs skyraksys-hrm-frontend --lines 100 --nostream"
    }
    
    "status" {
        Write-Host "Checking deployment status on $ServerIP..." -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "1. PostgreSQL Status:" -ForegroundColor Cyan
        ssh root@$ServerIP "systemctl is-active postgresql-17"
        
        Write-Host ""
        Write-Host "2. Nginx Status:" -ForegroundColor Cyan
        ssh root@$ServerIP "systemctl is-active nginx"
        
        Write-Host ""
        Write-Host "3. PM2 Applications:" -ForegroundColor Cyan
        ssh root@$ServerIP "pm2 list"
        
        Write-Host ""
        Write-Host "4. API Health Check:" -ForegroundColor Cyan
        ssh root@$ServerIP "curl -s http://localhost:5000/api/health | jq ."
        
        Write-Host ""
        Write-Host "5. Open Ports:" -ForegroundColor Cyan
        ssh root@$ServerIP "firewall-cmd --list-ports"
    }
    
    "health" {
        Write-Host "Running comprehensive health check on $ServerIP..." -ForegroundColor Yellow
        ssh root@$ServerIP "bash /opt/skyraksys-hrm/redhatprod/scripts/04_health_check.sh"
    }
    
    "restart" {
        Write-Host "Restarting application on $ServerIP..." -ForegroundColor Yellow
        ssh root@$ServerIP "pm2 restart all"
    }
    
    "stop" {
        Write-Host "Stopping application on $ServerIP..." -ForegroundColor Yellow
        ssh root@$ServerIP "pm2 stop all"
    }
    
    "start" {
        Write-Host "Starting application on $ServerIP..." -ForegroundColor Yellow
        ssh root@$ServerIP "pm2 start all"
    }
    
    "db-check" {
        Write-Host "Checking database on $ServerIP..." -ForegroundColor Yellow
        ssh root@$ServerIP "PGPASSWORD='SkyRakDB#2025!Prod@HRM\$Secure' psql -h localhost -U hrm_app -d skyraksys_hrm_prod -c '\dt' -c 'SELECT COUNT(*) as user_count FROM \"Users\";'"
    }
    
    "web-test" {
        Write-Host "Testing web endpoints on $ServerIP..." -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "Backend API:" -ForegroundColor Cyan
        ssh root@$ServerIP "curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' http://localhost:5000/api/health"
        
        Write-Host ""
        Write-Host "Frontend:" -ForegroundColor Cyan
        ssh root@$ServerIP "curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' http://localhost:3000"
        
        Write-Host ""
        Write-Host "Nginx (Public):" -ForegroundColor Cyan
        ssh root@$ServerIP "curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' http://$ServerIP"
    }
    
    "pull-latest" {
        Write-Host "Pulling latest code on $ServerIP..." -ForegroundColor Yellow
        ssh root@$ServerIP "cd /opt/skyraksys-hrm && git pull origin master"
    }
    
    default {
        Write-Host "Usage: .\test-deployment-local.ps1 -ServerIP <IP> -Action <action>" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Available Actions:" -ForegroundColor Cyan
        Write-Host "  test-connection   Test SSH connection" -ForegroundColor Gray
        Write-Host "  deploy            Start full deployment" -ForegroundColor Gray
        Write-Host "  status            Check all services status" -ForegroundColor Gray
        Write-Host "  health            Run comprehensive health check" -ForegroundColor Gray
        Write-Host "  logs              Stream deployment logs (Ctrl+C to stop)" -ForegroundColor Gray
        Write-Host "  backend-logs      View backend application logs" -ForegroundColor Gray
        Write-Host "  frontend-logs     View frontend application logs" -ForegroundColor Gray
        Write-Host "  restart           Restart application" -ForegroundColor Gray
        Write-Host "  stop              Stop application" -ForegroundColor Gray
        Write-Host "  start             Start application" -ForegroundColor Gray
        Write-Host "  db-check          Check database connection and tables" -ForegroundColor Gray
        Write-Host "  web-test          Test all web endpoints" -ForegroundColor Gray
        Write-Host "  pull-latest       Pull latest code from GitHub" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Cyan
        Write-Host "  .\test-deployment-local.ps1 -Action test-connection" -ForegroundColor Gray
        Write-Host "  .\test-deployment-local.ps1 -Action deploy" -ForegroundColor Gray
        Write-Host "  .\test-deployment-local.ps1 -Action status" -ForegroundColor Gray
        Write-Host "  .\test-deployment-local.ps1 -Action logs" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
