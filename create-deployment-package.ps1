# Production Deployment Package Creator
# Creates a zip file with all necessary files for production deployment

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipName = "hrm-production-deployment-$timestamp.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HRM Production Deployment Package" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define files to include
$criticalFiles = @(
    # CRITICAL: Frontend fix (removes proxy)
    "frontend\package.json",
    
    # Backend seeder (updated with firstName/lastName and SEED_DEFAULT_PASSWORD)
    "backend\seeders\20240101000000-initial-data.js",
    
    # NEW Production scripts
    "redhatprod\scripts\03_migrate_and_seed_production.sh",
    "redhatprod\scripts\validate-database.sh",
    "redhatprod\scripts\migration-report.sh",
    
    # Updated prerequisites (PostgreSQL 17)
    "redhatprod\scripts\01_install_prerequisites.sh",
    
    # Other deployment scripts
    "redhatprod\scripts\02_setup_database.sh",
    "redhatprod\scripts\03_deploy_application.sh",
    "redhatprod\scripts\04_health_check.sh",
    "redhatprod\scripts\deploy.sh",
    
    # Environment templates
    "redhatprod\templates\.env.production",
    "backend\.env.production.template",
    "backend\.env.example",
    
    # Documentation
    "PRODUCTION_DEPLOYMENT_PACKAGE.md",
    "LOCAL_TESTING_GUIDE.md",
    "DATABASE_SEEDING_GUIDE.md",
    "redhatprod\MIGRATION_GUIDE.md",
    "CRITICAL_PROXY_ISSUE.md",
    "MANUAL_FIX_STEPS.md",
    "PRODUCTION_ISSUES_ANALYSIS.md",
    "redhatprod\PRODUCTION_DEPLOYMENT_GUIDE.md"
)

# Check if files exist
Write-Host "Checking files..." -ForegroundColor Yellow
$missingFiles = @()
$foundFiles = @()

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
        $foundFiles += $file
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

Write-Host ""

if ($missingFiles.Count -gt 0) {
    Write-Host "WARNING: $($missingFiles.Count) files not found:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit 1
    }
}

# Create zip file
Write-Host "Creating deployment package..." -ForegroundColor Yellow

try {
    # Remove old zip if exists
    if (Test-Path $zipName) {
        Remove-Item $zipName -Force
    }

    # Create zip
    Compress-Archive -Path $foundFiles -DestinationPath $zipName -CompressionLevel Optimal

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Package created: $zipName" -ForegroundColor Green
    
    $zipSize = (Get-Item $zipName).Length / 1MB
    Write-Host "Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
    Write-Host "Files included: $($foundFiles.Count)" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Transfer this zip to production server" -ForegroundColor White
    Write-Host "   scp $zipName root@95.216.14.232:~/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. On production server:" -ForegroundColor White
    Write-Host "   cd /opt/skyraksys-hrm" -ForegroundColor Gray
    Write-Host "   unzip ~/$zipName" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Follow steps in PRODUCTION_DEPLOYMENT_PACKAGE.md" -ForegroundColor White
    Write-Host ""
    Write-Host "OR (EASIER): Just do 'git pull origin master' on production!" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "ERROR: Failed to create zip file" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# List contents
Write-Host "Package Contents:" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow
Write-Host ""

Write-Host "[CRITICAL FIXES]" -ForegroundColor Red
Write-Host "  frontend\package.json                    - Removes proxy (ROOT CAUSE)" -ForegroundColor White
Write-Host "  backend\seeders\...-initial-data.js      - Fixes missing firstName/lastName" -ForegroundColor White
Write-Host ""

Write-Host "[NEW SCRIPTS]" -ForegroundColor Green
Write-Host "  redhatprod\scripts\03_migrate_and_seed_production.sh" -ForegroundColor White
Write-Host "  redhatprod\scripts\validate-database.sh" -ForegroundColor White
Write-Host "  redhatprod\scripts\migration-report.sh" -ForegroundColor White
Write-Host ""

Write-Host "[UPDATED SCRIPTS]" -ForegroundColor Yellow
Write-Host "  redhatprod\scripts\01_install_prerequisites.sh  - PostgreSQL 17" -ForegroundColor White
Write-Host ""

Write-Host "[ENVIRONMENT TEMPLATES]" -ForegroundColor Cyan
Write-Host "  redhatprod\templates\.env.production     - Added SEED_DEFAULT_PASSWORD" -ForegroundColor White
Write-Host "  backend\.env.production.template" -ForegroundColor White
Write-Host ""

Write-Host "[DOCUMENTATION]" -ForegroundColor Magenta
Write-Host "  PRODUCTION_DEPLOYMENT_PACKAGE.md         - This guide" -ForegroundColor White
Write-Host "  LOCAL_TESTING_GUIDE.md                   - Local testing workflow" -ForegroundColor White
Write-Host "  DATABASE_SEEDING_GUIDE.md                - Seeding reference" -ForegroundColor White
Write-Host "  MANUAL_FIX_STEPS.md                      - Step-by-step deployment" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to deploy to production!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
