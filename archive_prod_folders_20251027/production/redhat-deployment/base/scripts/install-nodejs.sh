#!/bin/bash

# SkyrakSys HRM - Node.js Installation Script for Red Hat Linux
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

print_status "Installing Node.js 18.x LTS on Red Hat Linux..."

# Remove any existing Node.js installations
print_status "Cleaning up any existing Node.js installations..."
dnf remove -y nodejs npm || true

# Install Node.js repository
print_status "Adding Node.js repository..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -

# Install Node.js and npm
print_status "Installing Node.js and npm..."
dnf install -y nodejs

# Verify installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js $NODE_VERSION installed successfully"
print_status "npm $NPM_VERSION installed successfully"

# Update npm to latest version
print_status "Updating npm to latest version..."
npm install -g npm@latest

# Install global packages required for production
print_status "Installing global Node.js packages..."
npm install -g pm2@latest
npm install -g serve@latest
npm install -g node-gyp@latest

# Verify global packages
PM2_VERSION=$(pm2 --version)
print_status "PM2 $PM2_VERSION installed successfully"

# Configure npm for production
print_status "Configuring npm for production..."
npm config set production true
npm config set fund false
npm config set audit-level moderate

# Create npm cache directory with proper permissions
mkdir -p /var/cache/npm
chown -R root:root /var/cache/npm
chmod 755 /var/cache/npm

# Set npm cache location
npm config set cache /var/cache/npm

# Display installation summary
print_status "Node.js installation completed successfully!"
echo -e "\n${GREEN}Installation Summary:${NC}"
echo "• Node.js Version: $NODE_VERSION"
echo "• npm Version: $(npm --version)"
echo "• PM2 Version: $PM2_VERSION"
echo "• Installation Path: $(which node)"
echo "• Global Packages: $(npm list -g --depth=0 | grep -E '(pm2|serve)' | wc -l) packages"

echo -e "\n${GREEN}Global Packages Installed:${NC}"
npm list -g --depth=0 | grep -E '(pm2|serve|node-gyp)'

echo -e "\n${YELLOW}Verification Commands:${NC}"
echo "• Node.js: node --version"
echo "• npm: npm --version"
echo "• PM2: pm2 --version"
echo "• Global packages: npm list -g --depth=0"

echo -e "\n${YELLOW}Configuration:${NC}"
echo "• npm cache: $(npm config get cache)"
echo "• npm registry: $(npm config get registry)"
echo "• Production mode: $(npm config get production)"

print_status "Node.js is ready for SkyrakSys HRM deployment!"

# Test Node.js installation
print_status "Testing Node.js installation..."
cat > /tmp/test-node.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Node.js is working correctly!\n');
});

server.listen(3001, 'localhost', () => {
  console.log('Test server running on http://localhost:3001');
  server.close();
  console.log('Node.js test passed!');
});
EOF

node /tmp/test-node.js
rm /tmp/test-node.js

print_status "Node.js installation and testing completed!"
