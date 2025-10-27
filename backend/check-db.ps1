Write-Host "Checking PostgreSQL Databases..." -ForegroundColor Cyan

# Try to connect and list databases
$env:PGPASSWORD = "admin"  # Replace with your password

try {
    $databases = psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"
    
    Write-Host "`nExisting Databases:" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    
    $databases -split "`n" | Where-Object { $_.Trim() } | ForEach-Object {
        $dbName = $_.Trim()
        if ($dbName -match "skyraksys|hrm") {
            Write-Host "  ✓ $dbName" -ForegroundColor Yellow
        } else {
            Write-Host "    $dbName" -ForegroundColor White
        }
    }
    
    Write-Host "`nChecking config.json database..." -ForegroundColor Cyan
    $config = Get-Content "d:\skyraksys_hrm\backend\config\config.json" | ConvertFrom-Json
    $configDb = $config.development.database
    
    if ($databases -match $configDb) {
        Write-Host "✅ Database '$configDb' EXISTS" -ForegroundColor Green
    } else {
        Write-Host "❌ Database '$configDb' NOT FOUND" -ForegroundColor Red
        Write-Host "`nCreate it with:" -ForegroundColor Yellow
        Write-Host "  CREATE DATABASE $configDb;" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "`nMake sure PostgreSQL is running:" -ForegroundColor Yellow
    Write-Host "  net start postgresql-x64-14" -ForegroundColor White
}

Remove-Item Env:PGPASSWORD
