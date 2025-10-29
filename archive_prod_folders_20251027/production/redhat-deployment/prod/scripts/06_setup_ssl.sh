#!/bin/bash

# RHEL 9.6 SSL Certificate Setup Script
# Skyraksys HRM System - HTTPS Configuration
# Run after basic deployment to enable SSL/TLS

set -e

echo "=========================================="
echo "SKYRAKSYS HRM - SSL Certificate Setup"
echo "$(date)"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=========================================="
    echo -e "$1"
    echo -e "==========================================${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (sudo ./06_setup_ssl.sh)"
    exit 1
fi

# Configuration
SSL_DIR="/etc/ssl/certs/skyraksys-hrm"
SSL_PRIVATE_DIR="/etc/ssl/private/skyraksys-hrm"
NGINX_CONF="/etc/nginx/conf.d/hrm.conf"
APP_DIR="/opt/skyraksys-hrm"

print_header "SSL SETUP CONFIGURATION"
print_status "This script will configure SSL/TLS for your HRM system"
print_status ""

echo "SSL Setup Options:"
echo "1) Let's Encrypt (Free, Automatic renewal)"
echo "2) Self-signed certificate (Development/Internal use)"
echo "3) Custom certificate (Upload your own)"
echo "4) Skip SSL setup"
echo ""
read -p "Choose SSL setup method [1-4]: " ssl_choice

case $ssl_choice in
    1)
        print_header "LET'S ENCRYPT SSL SETUP"
        
        # Get domain name
        read -p "Enter your domain name (e.g., hr.yourcompany.com): " DOMAIN_NAME
        if [[ -z "$DOMAIN_NAME" ]]; then
            print_error "Domain name is required for Let's Encrypt"
            exit 1
        fi
        
        # Validate domain accessibility
        print_status "Validating domain accessibility..."
        if ! nslookup "$DOMAIN_NAME" > /dev/null 2>&1; then
            print_warning "Domain $DOMAIN_NAME may not be properly configured in DNS"
            read -p "Continue anyway? [y/N]: " continue_anyway
            if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
        
        # Install certbot
        print_status "Installing Certbot for Let's Encrypt..."
        dnf install -y certbot python3-certbot-nginx
        
        # Stop nginx temporarily for domain validation
        print_status "Stopping Nginx for certificate generation..."
        systemctl stop nginx
        
        # Generate certificate
        print_status "Generating Let's Encrypt certificate for $DOMAIN_NAME..."
        certbot certonly --standalone -d "$DOMAIN_NAME" --non-interactive --agree-tos --email "admin@$DOMAIN_NAME"
        
        if [ $? -eq 0 ]; then
            print_status "Certificate generated successfully!"
            
            # Update Nginx configuration for SSL
            print_status "Configuring Nginx for HTTPS..."
            
            # Backup existing configuration
            cp "$NGINX_CONF" "$NGINX_CONF.backup-$(date +%Y%m%d-%H%M%S)"
            
            cat > "$NGINX_CONF" << EOF
# Skyraksys HRM Nginx Configuration with SSL
# Let's Encrypt SSL Configuration

upstream backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

upstream frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN_NAME;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/$DOMAIN_NAME/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 16 8k;
    }
    
    # Login endpoint rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files with caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf|zip)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Frame-Options "SAMEORIGIN" always;
    }
    
    # Frontend application
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Handle React Router
        try_files \$uri \$uri/ /index.html;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
EOF
            
            # Set up automatic renewal
            print_status "Setting up automatic certificate renewal..."
            (crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
            
            # Update environment file
            if [ -f "$APP_DIR/.env" ]; then
                sed -i "s|API_BASE_URL=.*|API_BASE_URL=https://$DOMAIN_NAME/api|g" "$APP_DIR/.env"
                sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN_NAME|g" "$APP_DIR/.env"
                print_status "Updated environment configuration for HTTPS"
            fi
            
            SSL_SUCCESS=true
        else
            print_error "Certificate generation failed"
            SSL_SUCCESS=false
        fi
        ;;
        
    2)
        print_header "SELF-SIGNED CERTIFICATE SETUP"
        
        read -p "Enter your domain name or IP address: " DOMAIN_NAME
        if [[ -z "$DOMAIN_NAME" ]]; then
            DOMAIN_NAME="localhost"
        fi
        
        # Create directories
        mkdir -p "$SSL_DIR" "$SSL_PRIVATE_DIR"
        
        # Generate self-signed certificate
        print_status "Generating self-signed certificate for $DOMAIN_NAME..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_PRIVATE_DIR/privkey.pem" \
            -out "$SSL_DIR/fullchain.pem" \
            -subj "/C=IN/ST=Tamil Nadu/L=Chennai/O=Skyraksys Technologies/OU=IT/CN=$DOMAIN_NAME"
        
        # Set permissions
        chown root:root "$SSL_PRIVATE_DIR/privkey.pem" "$SSL_DIR/fullchain.pem"
        chmod 600 "$SSL_PRIVATE_DIR/privkey.pem"
        chmod 644 "$SSL_DIR/fullchain.pem"
        
        # Create nginx configuration for self-signed cert
        cp "$NGINX_CONF" "$NGINX_CONF.backup-$(date +%Y%m%d-%H%M%S)"
        
        cat > "$NGINX_CONF" << EOF
# Skyraksys HRM Nginx Configuration with Self-Signed SSL

upstream backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

upstream frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

# HTTP Configuration (optional redirect)
server {
    listen 80;
    server_name $DOMAIN_NAME;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME;
    
    # Self-Signed SSL Configuration
    ssl_certificate $SSL_DIR/fullchain.pem;
    ssl_certificate_key $SSL_PRIVATE_DIR/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Rest of configuration same as Let's Encrypt version...
    # (API routes, frontend, etc.)
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
        
        print_status "Self-signed certificate created successfully"
        print_warning "Note: Browsers will show security warnings for self-signed certificates"
        SSL_SUCCESS=true
        ;;
        
    3)
        print_header "CUSTOM CERTIFICATE SETUP"
        
        read -p "Enter path to your certificate file (.crt or .pem): " CERT_FILE
        read -p "Enter path to your private key file (.key): " KEY_FILE
        read -p "Enter path to your certificate chain file (optional): " CHAIN_FILE
        
        if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
            print_error "Certificate or key file not found"
            exit 1
        fi
        
        # Copy certificates to standard location
        cp "$CERT_FILE" "$SSL_DIR/cert.pem"
        cp "$KEY_FILE" "$SSL_PRIVATE_DIR/privkey.pem"
        
        if [ -n "$CHAIN_FILE" ] && [ -f "$CHAIN_FILE" ]; then
            cat "$CERT_FILE" "$CHAIN_FILE" > "$SSL_DIR/fullchain.pem"
        else
            cp "$CERT_FILE" "$SSL_DIR/fullchain.pem"
        fi
        
        # Set permissions
        chown root:root "$SSL_PRIVATE_DIR/privkey.pem" "$SSL_DIR"/*
        chmod 600 "$SSL_PRIVATE_DIR/privkey.pem"
        chmod 644 "$SSL_DIR"/*
        
        print_status "Custom certificate installed successfully"
        SSL_SUCCESS=true
        ;;
        
    4)
        print_header "SKIPPING SSL SETUP"
        print_warning "SSL/TLS not configured. Your HRM system will run on HTTP only."
        print_warning "This is not recommended for production use."
        exit 0
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Common post-SSL setup tasks
if [ "$SSL_SUCCESS" = true ]; then
    print_header "FINALIZING SSL CONFIGURATION"
    
    # Test nginx configuration
    print_status "Testing Nginx configuration..."
    if nginx -t; then
        print_status "Nginx configuration is valid"
        
        # Start/restart nginx
        systemctl start nginx
        systemctl reload nginx
        
        print_status "Nginx restarted with SSL configuration"
    else
        print_error "Nginx configuration test failed"
        print_error "Restoring backup configuration..."
        if [ -f "$NGINX_CONF.backup-$(date +%Y%m%d)*" ]; then
            cp "$NGINX_CONF.backup-"* "$NGINX_CONF"
            systemctl reload nginx
        fi
        exit 1
    fi
    
    # Update firewall for HTTPS
    print_status "Configuring firewall for HTTPS..."
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    
    # Test SSL configuration
    print_header "SSL CONFIGURATION VERIFICATION"
    
    sleep 5  # Wait for nginx to fully start
    
    print_status "Testing SSL connection..."
    if command -v curl >/dev/null 2>&1; then
        if curl -k -s "https://$DOMAIN_NAME/health" | grep -q "healthy"; then
            print_status "✅ HTTPS connection test: PASSED"
        else
            print_warning "HTTPS connection test: Unable to verify (may still be working)"
        fi
    fi
    
    # Display SSL information
    print_header "SSL SETUP COMPLETED SUCCESSFULLY"
    print_status "SSL/TLS has been configured for your HRM system"
    print_status ""
    print_status "🌐 Access your system at: https://$DOMAIN_NAME"
    print_status "📋 Certificate location: $SSL_DIR/"
    print_status "🔐 Private key location: $SSL_PRIVATE_DIR/"
    print_status "⚙️  Nginx configuration: $NGINX_CONF"
    
    if [ "$ssl_choice" = "1" ]; then
        print_status "🔄 Automatic renewal: Configured (runs daily at 3 AM)"
        print_status "📅 Certificate expires: $(date -d '+90 days' '+%Y-%m-%d')"
    fi
    
    print_status ""
    print_header "IMPORTANT SECURITY NOTES"
    print_warning "1. Test your SSL configuration at: https://www.ssllabs.com/ssltest/"
    print_warning "2. Update your DNS records to point to this server"
    print_warning "3. Update any bookmarks to use HTTPS URLs"
    print_warning "4. Configure your application to redirect HTTP to HTTPS"
    
    if [ "$ssl_choice" = "2" ]; then
        print_warning "5. Self-signed certificates will show browser warnings"
        print_warning "6. Consider upgrading to Let's Encrypt for production use"
    fi
    
    # Create SSL monitoring script
    cat > "$APP_DIR/check_ssl.sh" << 'SSLEOF'
#!/bin/bash
# SSL Certificate Monitoring Script

DOMAIN="$1"
if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain>"
    exit 1
fi

EXPIRY_DATE=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

if [ -n "$EXPIRY_DATE" ]; then
    EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
    
    echo "SSL Certificate for $DOMAIN:"
    echo "Expires: $EXPIRY_DATE"
    echo "Days until expiry: $DAYS_UNTIL_EXPIRY"
    
    if [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
        echo "⚠️  WARNING: Certificate expires in less than 30 days!"
    elif [ "$DAYS_UNTIL_EXPIRY" -lt 7 ]; then
        echo "🚨 CRITICAL: Certificate expires in less than 7 days!"
    else
        echo "✅ Certificate is valid"
    fi
else
    echo "❌ Unable to check SSL certificate for $DOMAIN"
fi
SSLEOF
    
    chmod +x "$APP_DIR/check_ssl.sh"
    chown hrmapp:hrmapp "$APP_DIR/check_ssl.sh"
    
    print_status "📊 SSL monitoring script created: $APP_DIR/check_ssl.sh"
    print_status "   Usage: $APP_DIR/check_ssl.sh $DOMAIN_NAME"
    
fi

echo ""
echo "🎉 SSL SETUP COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Test your application at https://$DOMAIN_NAME"
echo "2. Update any external services to use HTTPS URLs"
echo "3. Configure email templates to use HTTPS links"
echo "4. Run health check: $APP_DIR/../redhatprod/scripts/04_health_check.sh"

exit 0