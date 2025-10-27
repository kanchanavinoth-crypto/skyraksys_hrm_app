Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Leave Cancellation Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "d:\skyraksys_hrm\backend"

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

Write-Host "Checking database connection..." -ForegroundColor Yellow
# Test database connection first
$env:NODE_ENV = "development"

Write-Host "Running migration..." -ForegroundColor Yellow
npx sequelize-cli db:migrate

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Checking migration status..." -ForegroundColor Yellow
    npx sequelize-cli db:migrate:status
    
    Write-Host ""
    Write-Host "✅ Columns added:" -ForegroundColor Green
    Write-Host "   - isCancellation (BOOLEAN)" -ForegroundColor White
    Write-Host "   - originalLeaveRequestId (UUID)" -ForegroundColor White
    Write-Host "   - cancellationNote (TEXT)" -ForegroundColor White
    Write-Host "   - cancelledAt (TIMESTAMP)" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Check database connection in config/config.json" -ForegroundColor White
    Write-Host "2. Ensure PostgreSQL is running" -ForegroundColor White
    Write-Host "3. Verify database exists: skyraksys_hrm_db" -ForegroundColor White
    Write-Host "4. Run with debug: npx sequelize-cli db:migrate --debug" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
