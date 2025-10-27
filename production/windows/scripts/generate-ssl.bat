@echo off
REM ============================================
REM  SSL Certificate Generation Script
REM ============================================

echo.
echo [SSL Setup] Generating SSL certificates...

REM Check if OpenSSL is available
openssl version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ OpenSSL is not installed or not in PATH.
    echo.
    echo To install OpenSSL on Windows:
    echo 1. Download from: https://slproweb.com/products/Win32OpenSSL.html
    echo 2. Or use winget: winget install ShiningLight.OpenSSL
    echo 3. Or use chocolatey: choco install openssl
    echo.
    echo Alternative: Use Git Bash which includes OpenSSL
    echo.
    echo For production, consider using Let's Encrypt or a commercial certificate
    pause
    exit /b 1
)

echo ✅ OpenSSL detected:
openssl version

echo.
echo SSL Certificate Options:
echo 1. Generate self-signed certificate (for testing/development)
echo 2. Generate CSR (Certificate Signing Request) for CA
echo 3. Setup Let's Encrypt (manual instructions)
echo 4. Skip SSL setup

set /p ssl_choice="Enter your choice (1-4): "

if "%ssl_choice%"=="1" (
    call :generate_self_signed
)

if "%ssl_choice%"=="2" (
    call :generate_csr
)

if "%ssl_choice%"=="3" (
    call :setup_letsencrypt
)

if "%ssl_choice%"=="4" (
    echo SSL setup skipped
    goto :end
)

goto :end

:generate_self_signed
echo.
echo [Self-Signed Certificate]
echo Generating self-signed SSL certificate...

REM Get domain information
set /p domain="Enter domain name [localhost]: "
if "%domain%"=="" set domain=localhost

REM Create SSL directory
mkdir ssl 2>nul

REM Generate private key
echo Generating private key...
openssl genrsa -out ssl\key.pem 2048
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate private key
    pause
    exit /b 1
)

REM Create certificate configuration
echo Creating certificate configuration...
(
echo [req]
echo default_bits = 2048
echo prompt = no
echo default_md = sha256
echo distinguished_name = dn
echo req_extensions = v3_req
echo.
echo [dn]
echo C=US
echo ST=State
echo L=City
echo O=SkyRakSys
echo OU=IT Department
echo CN=%domain%
echo.
echo [v3_req]
echo basicConstraints = CA:FALSE
echo keyUsage = nonRepudiation, digitalSignature, keyEncipherment
echo subjectAltName = @alt_names
echo.
echo [alt_names]
echo DNS.1 = %domain%
echo DNS.2 = www.%domain%
echo DNS.3 = localhost
echo IP.1 = 127.0.0.1
) > ssl\cert.conf

REM Generate certificate
echo Generating certificate...
openssl req -new -x509 -key ssl\key.pem -out ssl\cert.pem -days 365 -config ssl\cert.conf -extensions v3_req
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate certificate
    pause
    exit /b 1
)

REM Clean up config file
del ssl\cert.conf

echo.
echo ✅ Self-signed certificate generated successfully!
echo.
echo Certificate files:
echo   - ssl/cert.pem (Certificate)
echo   - ssl/key.pem  (Private Key)
echo.
echo ⚠️  WARNING: Self-signed certificates are not trusted by browsers
echo    You will see security warnings when accessing the site
echo.
echo For production, use a certificate from a trusted CA or Let's Encrypt
goto :eof

:generate_csr
echo.
echo [Certificate Signing Request]
echo Generating CSR for certificate authority...

REM Get certificate information
set /p domain="Enter domain name: "
set /p country="Enter country code [US]: "
if "%country%"=="" set country=US

set /p state="Enter state/province: "
set /p city="Enter city: "
set /p organization="Enter organization [SkyRakSys]: "
if "%organization%"=="" set organization=SkyRakSys

set /p department="Enter department [IT]: "
if "%department%"=="" set department=IT

set /p email="Enter email address: "

REM Create SSL directory
mkdir ssl 2>nul

REM Generate private key
echo Generating private key...
openssl genrsa -out ssl\key.pem 2048

REM Create CSR configuration
(
echo [req]
echo default_bits = 2048
echo prompt = no
echo default_md = sha256
echo distinguished_name = dn
echo req_extensions = v3_req
echo.
echo [dn]
echo C=%country%
echo ST=%state%
echo L=%city%
echo O=%organization%
echo OU=%department%
echo CN=%domain%
echo emailAddress=%email%
echo.
echo [v3_req]
echo basicConstraints = CA:FALSE
echo keyUsage = nonRepudiation, digitalSignature, keyEncipherment
echo subjectAltName = @alt_names
echo.
echo [alt_names]
echo DNS.1 = %domain%
echo DNS.2 = www.%domain%
) > ssl\csr.conf

REM Generate CSR
echo Generating Certificate Signing Request...
openssl req -new -key ssl\key.pem -out ssl\cert.csr -config ssl\csr.conf
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate CSR
    pause
    exit /b 1
)

REM Clean up config file
del ssl\csr.conf

echo.
echo ✅ Certificate Signing Request generated successfully!
echo.
echo Files created:
echo   - ssl/key.pem  (Private Key - Keep secure!)
echo   - ssl/cert.csr (Certificate Signing Request)
echo.
echo Next steps:
echo 1. Submit ssl/cert.csr to your Certificate Authority
echo 2. Save the issued certificate as ssl/cert.pem
echo 3. Update your application configuration to use SSL
goto :eof

:setup_letsencrypt
echo.
echo [Let's Encrypt Setup]
echo.
echo Let's Encrypt provides free SSL certificates for production use.
echo.
echo Prerequisites:
echo 1. Domain must be publicly accessible
echo 2. Domain must point to your server's public IP
echo 3. Ports 80 and 443 must be open
echo.
echo Installation options:
echo.
echo Option 1: Certbot (Recommended)
echo ----------
echo 1. Install Certbot:
echo    - Download from: https://certbot.eff.org/
echo    - Or use winget: winget install Certbot.Certbot
echo.
echo 2. Generate certificate:
echo    certbot certonly --standalone -d yourdomain.com
echo.
echo 3. Certificates will be saved to:
echo    C:\Certbot\live\yourdomain.com\
echo.
echo 4. Copy certificates to ssl/ directory:
echo    copy "C:\Certbot\live\yourdomain.com\fullchain.pem" ssl\cert.pem
echo    copy "C:\Certbot\live\yourdomain.com\privkey.pem" ssl\key.pem
echo.
echo Option 2: ACME.sh (Alternative)
echo ----------
echo 1. Install ACME.sh for Windows
echo 2. Run: acme.sh --issue -d yourdomain.com --standalone
echo.
echo Option 3: Cloud Provider
echo ----------
echo Many cloud providers (AWS, Azure, GCP) offer managed certificates
echo.
echo Automatic Renewal:
echo - Set up scheduled task to run: certbot renew
echo - Run renewal check daily: certbot renew --dry-run
echo.
echo ⚠️  Remember to update certificates in your application after renewal
echo.
pause
goto :eof

:end
echo.
echo [SSL Setup Complete]
echo.
echo SSL Configuration in your application:
echo 1. Update backend/.env.production:
echo    SSL_ENABLED=true
echo    SSL_CERT_PATH=ssl/cert.pem
echo    SSL_KEY_PATH=ssl/key.pem
echo.
echo 2. Your application will be accessible at:
echo    https://yourdomain.com
echo.
echo Security Notes:
echo - Keep private keys secure and never commit to version control
echo - Use strong certificates for production
echo - Consider using a reverse proxy (nginx) for SSL termination
echo - Monitor certificate expiration dates
echo.
