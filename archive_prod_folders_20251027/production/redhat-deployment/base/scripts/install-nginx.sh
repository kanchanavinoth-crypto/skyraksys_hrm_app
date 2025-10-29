#!/bin/bash

# SkyrakSys HRM - Nginx Installation and Configuration Script for Red Hat Linux
# Version: 2.0.0

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

print_status "Installing and configuring Nginx on Red Hat Linux..."

# Install Nginx
print_status "Installing Nginx..."
dnf install -y nginx

# Start and enable Nginx
print_status "Starting and enabling Nginx service..."
systemctl start nginx
systemctl enable nginx

# Backup default configuration
print_status "Backing up default configuration..."
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.backup 2>/dev/null || true

# Create custom nginx.conf with optimizations
print_status "Creating optimized Nginx configuration..."
cat > /etc/nginx/nginx.conf << 'EOF'
# SkyrakSys HRM - Nginx Main Configuration
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

# Load dynamic modules
include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging Format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
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
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=global:10m rate=10r/s;
    
    # Security Headers (applied globally)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

# Create default server configuration
print_status "Creating default server configuration..."
cat > /etc/nginx/conf.d/default.conf << 'EOF'
# Default server configuration - will be overridden by SkyrakSys HRM config
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html index.htm;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Health check for load balancers
    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Configure firewall
print_status "Configuring firewall for Nginx..."
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

# Set SELinux context for Nginx (if SELinux is enabled)
if [[ $(getenforce) != "Disabled" ]]; then
    print_status "Configuring SELinux for Nginx..."
    setsebool -P httpd_can_network_connect 1
    setsebool -P httpd_can_network_relay 1
    semanage fcontext -a -t httpd_config_t "/etc/nginx/conf.d/*.conf" || true
    restorecon -R /etc/nginx/conf.d/ || true
fi

# Create log directories with proper permissions
print_status "Setting up log directories..."
mkdir -p /var/log/nginx
chown nginx:nginx /var/log/nginx
chmod 755 /var/log/nginx

# Test Nginx configuration
print_status "Testing Nginx configuration..."
nginx -t

# Restart Nginx with new configuration
print_status "Restarting Nginx..."
systemctl restart nginx

# Install SSL tools (for Let's Encrypt)
print_status "Installing SSL tools..."
dnf install -y certbot python3-certbot-nginx

# Create SSL snippet for future use
print_status "Creating SSL configuration snippet..."
mkdir -p /etc/nginx/snippets
cat > /etc/nginx/snippets/ssl-params.conf << 'EOF'
# SSL Parameters for SkyrakSys HRM
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
EOF

# Setup log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/nginx << 'EOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    sharedscripts
    postrotate
        if [ -f /run/nginx.pid ]; then
            kill -USR1 `cat /run/nginx.pid`
        fi
    endscript
}
EOF

# Verify installation
print_status "Verifying Nginx installation..."
NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)

# Display installation summary
print_status "Nginx installation completed successfully!"
echo -e "\n${GREEN}Installation Summary:${NC}"
echo "• Nginx Version: $NGINX_VERSION"
echo "• Configuration: /etc/nginx/nginx.conf"
echo "• Server configs: /etc/nginx/conf.d/"
echo "• SSL snippet: /etc/nginx/snippets/ssl-params.conf"
echo "• Access log: /var/log/nginx/access.log"
echo "• Error log: /var/log/nginx/error.log"
echo "• Certbot installed: $(certbot --version 2>/dev/null | head -1)"

echo -e "\n${YELLOW}Service Management:${NC}"
echo "• Status: sudo systemctl status nginx"
echo "• Start: sudo systemctl start nginx"
echo "• Stop: sudo systemctl stop nginx"
echo "• Restart: sudo systemctl restart nginx"
echo "• Reload: sudo systemctl reload nginx"
echo "• Test config: sudo nginx -t"

echo -e "\n${YELLOW}Configuration Files:${NC}"
echo "• Main config: /etc/nginx/nginx.conf"
echo "• Default server: /etc/nginx/conf.d/default.conf"
echo "• SSL params: /etc/nginx/snippets/ssl-params.conf"
echo "• Log rotation: /etc/logrotate.d/nginx"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Copy SkyrakSys HRM Nginx configuration to /etc/nginx/conf.d/"
echo "2. Update domain name in the configuration"
echo "3. Test configuration: sudo nginx -t"
echo "4. Restart Nginx: sudo systemctl restart nginx"
echo "5. Setup SSL certificate with certbot"

# Test Nginx is responding
print_status "Testing Nginx response..."
curl -s http://localhost/nginx-health | head -1 && print_status "Nginx is responding correctly!"

print_status "Nginx is ready for SkyrakSys HRM deployment!"
