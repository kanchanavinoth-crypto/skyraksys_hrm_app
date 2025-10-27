@echo off
REM ============================================
REM  Startup Scripts Creation
REM ============================================

echo.
echo [Startup Scripts] Creating application startup scripts...

REM Create package.json with production scripts
echo Creating root package.json...
(
echo {
echo   "name": "skyraksys-hrm-production",
echo   "version": "2.0.0",
echo   "description": "SkyRakSys HRM Production Environment",
echo   "scripts": {
echo     "start": "npm run start:production",
echo     "start:production": "concurrently \"npm run start:backend\" \"npm run serve:frontend\"",
echo     "start:backend": "cd backend && npm start",
echo     "serve:frontend": "npx serve -s frontend/build -l 3000",
echo     "start:pm2": "pm2 start ecosystem.config.js",
echo     "stop": "pm2 stop ecosystem.config.js",
echo     "restart": "pm2 restart ecosystem.config.js",
echo     "reload": "pm2 reload ecosystem.config.js",
echo     "delete": "pm2 delete ecosystem.config.js",
echo     "logs": "pm2 logs",
echo     "logs:backend": "pm2 logs skyraksys-hrm-backend",
echo     "monit": "pm2 monit",
echo     "status": "pm2 status",
echo     "build": "cd frontend && npm run build",
echo     "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
echo     "dev:backend": "cd backend && npm run dev",
echo     "dev:frontend": "cd frontend && npm start",
echo     "migrate": "cd backend && npm run migrate",
echo     "seed": "cd backend && npm run seed",
echo     "test": "npm run test:backend",
echo     "test:backend": "cd backend && npm test",
echo     "backup": "node scripts/backup-database.js",
echo     "health": "node scripts/health-check.js",
echo     "setup": "node scripts/setup-production.js"
echo   },
echo   "dependencies": {
echo     "concurrently": "^8.2.2",
echo     "pm2": "^5.3.0",
echo     "serve": "^14.2.1"
echo   },
echo   "engines": {
echo     "node": ">=16.0.0",
echo     "npm": ">=8.0.0"
echo   }
echo }
) > package.json

REM Create PM2 ecosystem configuration
echo Creating PM2 configuration...
(
echo module.exports = {
echo   apps: [
echo     {
echo       name: 'skyraksys-hrm-backend',
echo       script: 'server.js',
echo       cwd: './backend',
echo       instances: 'max',
echo       exec_mode: 'cluster',
echo       watch: false,
echo       max_memory_restart: '1G',
echo       env: {
echo         NODE_ENV: 'production',
echo         PORT: 8080
echo       },
echo       error_file: './logs/backend/error.log',
echo       out_file: './logs/backend/out.log',
echo       log_file: './logs/backend/combined.log',
echo       time: true,
echo       autorestart: true,
echo       max_restarts: 10,
echo       min_uptime: '10s',
echo       restart_delay: 5000,
echo       kill_timeout: 5000,
echo       wait_ready: true,
echo       listen_timeout: 8000
echo     },
echo     {
echo       name: 'skyraksys-hrm-frontend',
echo       script: 'npx',
echo       args: 'serve -s build -l 3000',
echo       cwd: './frontend',
echo       instances: 2,
echo       exec_mode: 'cluster',
echo       watch: false,
echo       env: {
echo         NODE_ENV: 'production'
echo       },
echo       error_file: './logs/frontend/error.log',
echo       out_file: './logs/frontend/out.log',
echo       log_file: './logs/frontend/combined.log',
echo       time: true,
echo       autorestart: true,
echo       max_restarts: 10,
echo       min_uptime: '10s'
echo     }
echo   ]
echo };
) > ecosystem.config.js

REM Create start script
echo Creating start script...
(
echo @echo off
echo echo Starting SkyRakSys HRM Production...
echo.
echo REM Check if PM2 is installed
echo pm2 --version ^>nul 2^>^&1
echo if %%ERRORLEVEL%% NEQ 0 ^(
echo     echo Installing PM2...
echo     npm install -g pm2
echo ^)
echo.
echo REM Start with PM2
echo echo Starting application with PM2...
echo pm2 start ecosystem.config.js
echo.
echo echo ✅ Application started successfully!
echo echo.
echo echo Available commands:
echo echo   npm run logs      - View logs
echo echo   npm run status    - Check status
echo echo   npm run stop      - Stop application
echo echo   npm run restart   - Restart application
echo echo   npm run monit     - Monitor processes
echo echo.
echo echo Web Interface: http://localhost:3000
echo echo API Endpoint: http://localhost:8080
echo echo.
) > start.bat

REM Create stop script
echo Creating stop script...
(
echo @echo off
echo echo Stopping SkyRakSys HRM Production...
echo pm2 stop ecosystem.config.js
echo echo ✅ Application stopped successfully!
) > stop.bat

REM Create restart script
echo Creating restart script...
(
echo @echo off
echo echo Restarting SkyRakSys HRM Production...
echo pm2 restart ecosystem.config.js
echo echo ✅ Application restarted successfully!
) > restart.bat

REM Create status script
echo Creating status script...
(
echo @echo off
echo echo SkyRakSys HRM Production Status:
echo echo ================================
echo pm2 status
echo.
echo echo Application URLs:
echo echo   Frontend: http://localhost:3000
echo echo   Backend:  http://localhost:8080
echo echo   Health:   http://localhost:8080/health
echo.
) > status.bat

REM Create logs script
echo Creating logs script...
(
echo @echo off
echo echo SkyRakSys HRM Production Logs:
echo echo ==============================
echo echo.
echo echo Choose log view:
echo echo 1. All logs
echo echo 2. Backend only
echo echo 3. Frontend only
echo echo 4. Error logs only
echo echo 5. Live monitoring
echo.
echo set /p choice="Enter choice (1-5): "
echo.
echo if "%%choice%%"=="1" pm2 logs
echo if "%%choice%%"=="2" pm2 logs skyraksys-hrm-backend
echo if "%%choice%%"=="3" pm2 logs skyraksys-hrm-frontend
echo if "%%choice%%"=="4" pm2 logs --err
echo if "%%choice%%"=="5" pm2 monit
) > logs.bat

REM Create development start script
echo Creating development script...
(
echo @echo off
echo echo Starting SkyRakSys HRM in Development Mode...
echo.
echo REM Install dependencies if needed
echo if not exist "node_modules" ^(
echo     echo Installing dependencies...
echo     npm install
echo ^)
echo.
echo if not exist "backend/node_modules" ^(
echo     echo Installing backend dependencies...
echo     cd backend
echo     npm install
echo     cd ..
echo ^)
echo.
echo if not exist "frontend/node_modules" ^(
echo     echo Installing frontend dependencies...
echo     cd frontend
echo     npm install
echo     cd ..
echo ^)
echo.
echo REM Start development servers
echo echo Starting development servers...
echo npm run dev
) > start-dev.bat

REM Create backup script
echo Creating backup script...
(
echo @echo off
echo echo Creating SkyRakSys HRM Backup...
echo echo ===============================
echo.
echo set timestamp=%%date:~-4,4%%%%date:~-10,2%%%%date:~-7,2%%_%%time:~0,2%%%%time:~3,2%%%%time:~6,2%%
echo set timestamp=%%timestamp: =0%%
echo.
echo REM Create backup directory
echo mkdir backups\%%timestamp%% 2^>nul
echo.
echo REM Backup database
echo echo Backing up database...
echo pg_dump -h localhost -U hrm_prod_user -d skyraksys_hrm_prod ^> backups\%%timestamp%%\database.sql
echo.
echo REM Backup uploads
echo echo Backing up uploads...
echo xcopy uploads backups\%%timestamp%%\uploads\ /E /I /Y ^>nul
echo.
echo REM Backup configuration
echo echo Backing up configuration...
echo copy backend\.env.production backups\%%timestamp%%\env_backup.txt ^>nul
echo copy ecosystem.config.js backups\%%timestamp%%\ ^>nul
echo.
echo echo ✅ Backup completed: backups\%%timestamp%%\
echo echo.
echo echo Backup contents:
echo echo   - database.sql     ^(Database backup^)
echo echo   - uploads\         ^(Uploaded files^)
echo echo   - env_backup.txt   ^(Environment config^)
echo echo   - ecosystem.config.js ^(PM2 config^)
) > backup.bat

REM Make scripts executable by setting proper attributes
attrib +r start.bat
attrib +r stop.bat  
attrib +r restart.bat
attrib +r status.bat
attrib +r logs.bat
attrib +r start-dev.bat
attrib +r backup.bat

echo ✅ Startup scripts created:
echo   - package.json         (NPM scripts)
echo   - ecosystem.config.js  (PM2 configuration)
echo   - start.bat           (Start production)
echo   - stop.bat            (Stop application)
echo   - restart.bat         (Restart application)
echo   - status.bat          (Check status)
echo   - logs.bat            (View logs)
echo   - start-dev.bat       (Development mode)
echo   - backup.bat          (Create backup)
echo.
echo Quick commands:
echo   .\start.bat           - Start production server
echo   .\stop.bat            - Stop server
echo   .\status.bat          - Check status
echo   .\logs.bat            - View logs
echo   .\backup.bat          - Create backup
echo.
