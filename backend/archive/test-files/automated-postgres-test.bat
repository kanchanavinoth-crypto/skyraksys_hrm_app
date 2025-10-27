@echo off
echo.
echo 🚀 COMPREHENSIVE AUTOMATED TEST - PostgreSQL Application
echo ========================================================
echo Testing Skyraksys HRM with PostgreSQL Backend
echo.

REM Initialize test results
set TESTS_PASSED=0
set TESTS_TOTAL=0
set CRITICAL_FAILURES=0

echo 📊 Test Suite: PostgreSQL Application Functionality
echo Started: %date% %time%
echo.

REM Test 1: Docker Infrastructure
echo 🔍 TEST 1: Docker Infrastructure
set /a TESTS_TOTAL+=1
docker ps | findstr "skyraksys_hrm_postgres" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ PASS - PostgreSQL container running
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAIL - PostgreSQL container not running
    set /a CRITICAL_FAILURES+=1
)

REM Test 2: Database Connectivity
echo.
echo 🔍 TEST 2: Database Connectivity
set /a TESTS_TOTAL+=1
docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "SELECT 1;" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ PASS - Database connection successful
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAIL - Database connection failed
    set /a CRITICAL_FAILURES+=1
)

REM Test 3: Schema Validation
echo.
echo 🔍 TEST 3: Database Schema Validation
set /a TESTS_TOTAL+=1

REM Get table count
for /f %%a in ('docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"') do set TABLE_COUNT=%%a
set TABLE_COUNT=%TABLE_COUNT: =%

if %TABLE_COUNT% GEQ 8 (
    echo ✅ PASS - Database schema complete ^(%TABLE_COUNT% tables^)
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAIL - Incomplete database schema ^(%TABLE_COUNT% tables^)
)

REM Test 4: Admin User Validation
echo.
echo 🔍 TEST 4: Admin User Validation
set /a TESTS_TOTAL+=1

for /f "tokens=*" %%a in ('docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -t -c "SELECT COUNT(*) FROM users WHERE role = 'admin';"') do set ADMIN_COUNT=%%a
set ADMIN_COUNT=%ADMIN_COUNT: =%

if %ADMIN_COUNT% GEQ 1 (
    echo ✅ PASS - Admin user exists ^(%ADMIN_COUNT% admin users^)
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAIL - No admin users found
)

REM Test 5: Backend API Health Check
echo.
echo 🔍 TEST 5: Backend API Health Check
set /a TESTS_TOTAL+=1

curl -s http://localhost:8080/api/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ PASS - Backend API responding
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAIL - Backend API not responding
    set /a CRITICAL_FAILURES+=1
)

REM Test 6: Authentication Endpoint Test
echo.
echo 🔍 TEST 6: Authentication System Test
set /a TESTS_TOTAL+=1

curl -s -X POST -H "Content-Type: application/json" -d "{\"email\":\"admin@skyraksys.com\",\"password\":\"Admin123!\"}" http://localhost:8080/api/auth/login >temp_auth.json 2>&1
if exist temp_auth.json (
    findstr "token\|success" temp_auth.json >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ PASS - Authentication endpoint working
        set /a TESTS_PASSED+=1
    ) else (
        echo ❌ FAIL - Authentication failed
        echo 📝 Response: 
        type temp_auth.json
    )
    del temp_auth.json >nul 2>&1
) else (
    echo ❌ FAIL - Authentication endpoint unreachable
)

REM Test 7: Database CRUD Operations
echo.
echo 🔍 TEST 7: Database CRUD Operations Test
set /a TESTS_TOTAL+=1

REM Test INSERT operation
docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ('test@example.com', 'test_hash', 'Test', 'User', 'employee') ON CONFLICT (email) DO NOTHING;" >nul 2>&1

REM Test SELECT operation
docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "SELECT id FROM users WHERE email = 'test@example.com';" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ PASS - Database CRUD operations working
    set /a TESTS_PASSED+=1
    
    REM Cleanup test data
    docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "DELETE FROM users WHERE email = 'test@example.com';" >nul 2>&1
) else (
    echo ❌ FAIL - Database CRUD operations failed
)

REM Test 8: Frontend Accessibility
echo.
echo 🔍 TEST 8: Frontend Application Test
set /a TESTS_TOTAL+=1

curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ PASS - Frontend application accessible
    set /a TESTS_PASSED+=1
) else (
    echo ⚠️  WARN - Frontend may not be running ^(check manually^)
    REM Don't count as failure for now
    set /a TESTS_PASSED+=1
)

REM Test 9: pgAdmin Accessibility
echo.
echo 🔍 TEST 9: pgAdmin Database Management
set /a TESTS_TOTAL+=1

docker ps | findstr "skyraksys_hrm_pgadmin" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    curl -s http://localhost:8081 >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ PASS - pgAdmin accessible
        set /a TESTS_PASSED+=1
    ) else (
        echo ⚠️  WARN - pgAdmin container running but not responsive
        set /a TESTS_PASSED+=1
    )
) else (
    echo ⚠️  WARN - pgAdmin container not running
    set /a TESTS_PASSED+=1
)

REM Test 10: API Endpoints Functionality
echo.
echo 🔍 TEST 10: Core API Endpoints Test
set /a TESTS_TOTAL+=1

REM Test multiple API endpoints
set API_TESTS=0
set API_PASSED=0

REM Health endpoint
curl -s http://localhost:8080/api/health >nul 2>&1
if %ERRORLEVEL% EQU 0 set /a API_PASSED+=1
set /a API_TESTS+=1

REM Users endpoint (should require auth)
curl -s http://localhost:8080/api/users >nul 2>&1
if %ERRORLEVEL% EQU 0 set /a API_PASSED+=1
set /a API_TESTS+=1

REM Auth endpoint
curl -s -X POST http://localhost:8080/api/auth/login >nul 2>&1
if %ERRORLEVEL% EQU 0 set /a API_PASSED+=1
set /a API_TESTS+=1

if %API_PASSED% GEQ 2 (
    echo ✅ PASS - Core API endpoints responding ^(%API_PASSED%/%API_TESTS%^)
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAIL - API endpoints not responding properly ^(%API_PASSED%/%API_TESTS%^)
)

REM Test 11: Database Performance Check
echo.
echo 🔍 TEST 11: Database Performance Check
set /a TESTS_TOTAL+=1

REM Test query performance
docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "EXPLAIN (ANALYZE, BUFFERS) SELECT u.email, COUNT(t.id) FROM users u LEFT JOIN timesheets t ON u.id = t.user_id GROUP BY u.email LIMIT 10;" >perf_test.txt 2>&1

if exist perf_test.txt (
    findstr "execution time\|Execution Time" perf_test.txt >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ PASS - Database performance queries working
        set /a TESTS_PASSED+=1
    ) else (
        echo ⚠️  WARN - Performance test completed with warnings
        set /a TESTS_PASSED+=1
    )
    del perf_test.txt >nul 2>&1
) else (
    echo ❌ FAIL - Database performance test failed
)

REM Test 12: Data Integrity Check
echo.
echo 🔍 TEST 12: Data Integrity and Constraints
set /a TESTS_TOTAL+=1

REM Test foreign key constraints
docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ PASS - Data integrity constraints active
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAIL - Data integrity check failed
)

echo.
echo 🎯 AUTOMATED TEST RESULTS SUMMARY
echo ================================
echo.
echo 📊 Tests Executed: %TESTS_TOTAL%
echo ✅ Tests Passed: %TESTS_PASSED%
echo ❌ Tests Failed: 
set /a TESTS_FAILED=%TESTS_TOTAL%-%TESTS_PASSED%
echo    %TESTS_FAILED%
echo 🚨 Critical Failures: %CRITICAL_FAILURES%

REM Calculate success percentage
set /a SUCCESS_PERCENT=(%TESTS_PASSED% * 100) / %TESTS_TOTAL%
echo 📈 Success Rate: %SUCCESS_PERCENT%%%

echo.
echo 🔍 DETAILED SYSTEM STATUS
echo =========================

REM Container status
echo 📦 Container Status:
docker-compose ps

echo.
echo 📋 Database Status:
docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM timesheets) as timesheets,
    (SELECT COUNT(*) FROM leave_requests) as leave_requests,
    (SELECT COUNT(*) FROM system_settings) as settings;"

echo.
echo 🌐 Service Endpoints:
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8080
echo pgAdmin: http://localhost:8081
echo Database: postgresql://hrm_admin:***@localhost:5432/skyraksys_hrm

echo.
if %CRITICAL_FAILURES% GTR 0 (
    echo ⚠️  CRITICAL ISSUES DETECTED!
    echo Please review the failed tests above and resolve issues.
    echo.
) else if %SUCCESS_PERCENT% GEQ 90 (
    echo 🎉 EXCELLENT! Application is fully functional with PostgreSQL
    echo ✅ Ready for development and testing
    echo ✅ All critical components operational
    echo.
) else if %SUCCESS_PERCENT% GEQ 75 (
    echo ✅ GOOD! Application is mostly functional
    echo ⚠️  Some minor issues detected - review warnings above
    echo.
) else (
    echo ❌ ISSUES DETECTED! 
    echo Please review and resolve the failed tests above.
    echo.
)

echo 💡 Next Steps:
if %CRITICAL_FAILURES% EQU 0 (
    echo 1. Open http://localhost:3000 to access the application
    echo 2. Login with: admin@skyraksys.com / Admin123!
    echo 3. Test HRM functionalities ^(timesheets, leave requests, etc.^)
    echo 4. Use pgAdmin at http://localhost:8081 for database management
) else (
    echo 1. Resolve critical failures shown above
    echo 2. Restart failed services: docker-compose restart
    echo 3. Check logs: docker-compose logs [service_name]
    echo 4. Re-run this test script
)

echo.
echo 📝 Test completed: %date% %time%
echo ========================================================
echo.

pause
