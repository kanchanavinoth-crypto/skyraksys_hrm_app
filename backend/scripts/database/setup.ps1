# Database Utilities Setup Script
$ErrorActionPreference = "Stop"

Write-Host "Setting up database utilities..." -ForegroundColor Cyan

# Ensure we're in the backend directory
Set-Location $PSScriptRoot\..\..\

# Create necessary directories
$directories = @(
    "scripts/database",
    "docs",
    "backups"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
try {
    npm install rimraf sequelize-erd --save-dev
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependencies installed successfully" -ForegroundColor Green
    } else {
        throw "Failed to install dependencies"
    }
} catch {
    Write-Host "Error installing dependencies: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Setup completed successfully!" -ForegroundColor Green
Write-Host "`nAvailable database commands:" -ForegroundColor Cyan
Write-Host "  npm run db:backup         - Backup database"
Write-Host "  npm run db:restore        - Restore database"
Write-Host "  npm run db:check         - Run database health checks"
Write-Host "  npm run db:maintenance   - Perform database maintenance"
Write-Host "  npm run db:optimize      - Optimize database performance"
Write-Host "  npm run db:diagram       - Generate database diagram"

Write-Host "`nFor development:" -ForegroundColor Cyan
Write-Host "  npm run seed:minimal     - Load minimal dataset"
Write-Host "  npm run seed:full        - Load full dataset"
Write-Host "  npm run seed:test        - Load test dataset"