#!/bin/bash

# ============================================
# SSL Certificate Generation Script (Unix/Linux)
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

echo ""
log $CYAN "[SSL Setup] Generating SSL certificates..."

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    log $RED "❌ OpenSSL is not installed."
    echo ""
    
    log $YELLOW "To install OpenSSL:"
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        case $ID in
            ubuntu|debian)
                log $YELLOW "  sudo apt update && sudo apt install openssl"
                ;;
            centos|rhel|fedora)
                log $YELLOW "  sudo dnf install openssl"
                ;;
            arch)
                log $YELLOW "  sudo pacman -S openssl"
                ;;
        esac
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        log $YELLOW "  brew install openssl"
    fi
    echo ""
    
    log $YELLOW "For production, consider using Let's Encrypt or a commercial certificate"
    exit 1
fi

log $GREEN "✅ OpenSSL detected:"
openssl version

echo ""
echo "SSL Certificate Options:"
echo "1. Generate self-signed certificate (for testing/development)"
echo "2. Generate CSR (Certificate Signing Request) for CA"
echo "3. Setup Let's Encrypt (manual instructions)"
echo "4. Skip SSL setup"

read -p "Enter your choice (1-4): " ssl_choice

generate_self_signed() {
    echo ""
    log $CYAN "[Self-Signed Certificate]"
    log $YELLOW "Generating self-signed SSL certificate..."
    
    # Get domain information
    read -p "Enter domain name [localhost]: " domain
    domain=${domain:-localhost}
    
    # Create SSL directory
    mkdir -p ssl
    
    # Generate private key
    log $YELLOW "Generating private key..."
    openssl genrsa -out ssl/key.pem 2048
    if [[ $? -ne 0 ]]; then
        log $RED "❌ Failed to generate private key"
        exit 1
    fi
    
    # Create certificate configuration
    log $YELLOW "Creating certificate configuration..."
    cat > ssl/cert.conf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=SkyRakSys
OU=IT Department
CN=$domain

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $domain
DNS.2 = www.$domain
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF
    
    # Generate certificate
    log $YELLOW "Generating certificate..."
    openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 -config ssl/cert.conf -extensions v3_req
    if [[ $? -ne 0 ]]; then
        log $RED "❌ Failed to generate certificate"
        exit 1
    fi
    
    # Clean up config file
    rm ssl/cert.conf
    
    # Set proper permissions
    chmod 600 ssl/key.pem
    chmod 644 ssl/cert.pem
    
    echo ""
    log $GREEN "✅ Self-signed certificate generated successfully!"
    echo ""
    
    log $YELLOW "Certificate files:"
    log $YELLOW "  - ssl/cert.pem (Certificate)"
    log $YELLOW "  - ssl/key.pem  (Private Key)"
    echo ""
    
    log $YELLOW "⚠️  WARNING: Self-signed certificates are not trusted by browsers"
    log $YELLOW "   You will see security warnings when accessing the site"
    echo ""
    
    log $YELLOW "For production, use a certificate from a trusted CA or Let's Encrypt"
}

generate_csr() {
    echo ""
    log $CYAN "[Certificate Signing Request]"
    log $YELLOW "Generating CSR for certificate authority..."
    
    # Get certificate information
    read -p "Enter domain name: " domain
    read -p "Enter country code [US]: " country
    country=${country:-US}
    
    read -p "Enter state/province: " state
    read -p "Enter city: " city
    read -p "Enter organization [SkyRakSys]: " organization
    organization=${organization:-SkyRakSys}
    
    read -p "Enter department [IT]: " department
    department=${department:-IT}
    
    read -p "Enter email address: " email
    
    # Create SSL directory
    mkdir -p ssl
    
    # Generate private key
    log $YELLOW "Generating private key..."
    openssl genrsa -out ssl/key.pem 2048
    
    # Create CSR configuration
    cat > ssl/csr.conf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=$country
ST=$state
L=$city
O=$organization
OU=$department
CN=$domain
emailAddress=$email

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $domain
DNS.2 = www.$domain
EOF
    
    # Generate CSR
    log $YELLOW "Generating Certificate Signing Request..."
    openssl req -new -key ssl/key.pem -out ssl/cert.csr -config ssl/csr.conf
    if [[ $? -ne 0 ]]; then
        log $RED "❌ Failed to generate CSR"
        exit 1
    fi
    
    # Clean up config file
    rm ssl/csr.conf
    
    # Set proper permissions
    chmod 600 ssl/key.pem
    chmod 644 ssl/cert.csr
    
    echo ""
    log $GREEN "✅ Certificate Signing Request generated successfully!"
    echo ""
    
    log $YELLOW "Files created:"
    log $YELLOW "  - ssl/key.pem  (Private Key - Keep secure!)"
    log $YELLOW "  - ssl/cert.csr (Certificate Signing Request)"
    echo ""
    
    log $YELLOW "Next steps:"
    log $YELLOW "1. Submit ssl/cert.csr to your Certificate Authority"
    log $YELLOW "2. Save the issued certificate as ssl/cert.pem"
    log $YELLOW "3. Update your application configuration to use SSL"
}

setup_letsencrypt() {
    echo ""
    log $CYAN "[Let's Encrypt Setup]"
    echo ""
    
    log $YELLOW "Let's Encrypt provides free SSL certificates for production use."
    echo ""
    
    log $YELLOW "Prerequisites:"
    log $YELLOW "1. Domain must be publicly accessible"
    log $YELLOW "2. Domain must point to your server's public IP"
    log $YELLOW "3. Ports 80 and 443 must be open"
    echo ""
    
    log $YELLOW "Installation options:"
    echo ""
    
    log $YELLOW "Option 1: Certbot (Recommended)"
    log $YELLOW "----------"
    
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        case $ID in
            ubuntu|debian)
                log $YELLOW "1. Install Certbot:"
                log $YELLOW "   sudo apt update"
                log $YELLOW "   sudo apt install certbot python3-certbot-nginx"
                ;;
            centos|rhel|fedora)
                log $YELLOW "1. Install Certbot:"
                log $YELLOW "   sudo dnf install certbot python3-certbot-nginx"
                ;;
            arch)
                log $YELLOW "1. Install Certbot:"
                log $YELLOW "   sudo pacman -S certbot certbot-nginx"
                ;;
        esac
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        log $YELLOW "1. Install Certbot:"
        log $YELLOW "   brew install certbot"
    fi
    echo ""
    
    log $YELLOW "2. Generate certificate (standalone mode):"
    log $YELLOW "   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com"
    echo ""
    
    log $YELLOW "3. Or with nginx (if nginx is configured):"
    log $YELLOW "   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
    echo ""
    
    log $YELLOW "4. Certificates will be saved to:"
    log $YELLOW "   /etc/letsencrypt/live/yourdomain.com/"
    echo ""
    
    log $YELLOW "5. Copy certificates to ssl/ directory:"
    log $YELLOW "   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem"
    log $YELLOW "   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem"
    log $YELLOW "   sudo chown \$USER:. ssl/*.pem"
    echo ""
    
    log $YELLOW "Option 2: ACME.sh (Alternative)"
    log $YELLOW "----------"
    log $YELLOW "1. Install ACME.sh:"
    log $YELLOW "   curl https://get.acme.sh | sh"
    log $YELLOW "2. Generate certificate:"
    log $YELLOW "   ~/.acme.sh/acme.sh --issue -d yourdomain.com --standalone"
    echo ""
    
    log $YELLOW "Option 3: Cloud Provider"
    log $YELLOW "----------"
    log $YELLOW "Many cloud providers (AWS, Azure, GCP) offer managed certificates"
    echo ""
    
    log $YELLOW "Automatic Renewal:"
    log $YELLOW "- Certbot automatically sets up a cron job for renewal"
    log $YELLOW "- Test renewal: sudo certbot renew --dry-run"
    log $YELLOW "- Manual renewal: sudo certbot renew"
    echo ""
    
    log $YELLOW "⚠️  Remember to update certificates in your application after renewal"
    echo ""
    
    # Create renewal hook script
    log $YELLOW "Creating renewal hook script..."
    mkdir -p ssl
    
    cat > ssl/renewal-hook.sh << 'EOF'
#!/bin/bash

# Let's Encrypt renewal hook script
# This script runs after certificate renewal

echo "Certificate renewed, updating application certificates..."

# Copy new certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:. ssl/*.pem

# Restart application
if command -v pm2 &> /dev/null; then
    pm2 restart all
fi

# Restart nginx if running
if systemctl is-active --quiet nginx; then
    sudo systemctl restart nginx
fi

echo "✅ Certificates updated and services restarted"
EOF
    
    chmod +x ssl/renewal-hook.sh
    
    log $GREEN "✅ Renewal hook script created: ssl/renewal-hook.sh"
    
    read -p "Install Certbot now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ -f /etc/os-release ]]; then
            . /etc/os-release
            case $ID in
                ubuntu|debian)
                    sudo apt update && sudo apt install -y certbot python3-certbot-nginx
                    ;;
                centos|rhel|fedora)
                    sudo dnf install -y certbot python3-certbot-nginx
                    ;;
                arch)
                    sudo pacman -S certbot certbot-nginx
                    ;;
            esac
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install certbot
        fi
        
        if [[ $? -eq 0 ]]; then
            log $GREEN "✅ Certbot installed successfully"
            echo ""
            log $YELLOW "To generate your certificate:"
            log $YELLOW "  sudo certbot certonly --standalone -d yourdomain.com"
        fi
    fi
}

# Main execution
case $ssl_choice in
    1)
        generate_self_signed
        ;;
    2)
        generate_csr
        ;;
    3)
        setup_letsencrypt
        ;;
    4)
        log $YELLOW "SSL setup skipped"
        exit 0
        ;;
    *)
        log $RED "Invalid choice"
        exit 1
        ;;
esac

echo ""
log $CYAN "[SSL Setup Complete]"
echo ""

log $YELLOW "SSL Configuration in your application:"
log $YELLOW "1. Update backend/.env.production:"
log $YELLOW "   SSL_ENABLED=true"
log $YELLOW "   SSL_CERT_PATH=ssl/cert.pem"
log $YELLOW "   SSL_KEY_PATH=ssl/key.pem"
echo ""

log $YELLOW "2. Your application will be accessible at:"
log $YELLOW "   https://yourdomain.com"
echo ""

log $YELLOW "Security Notes:"
log $YELLOW "- Keep private keys secure and never commit to version control"
log $YELLOW "- Use strong certificates for production"
log $YELLOW "- Consider using a reverse proxy (nginx) for SSL termination"
log $YELLOW "- Monitor certificate expiration dates"
echo ""
