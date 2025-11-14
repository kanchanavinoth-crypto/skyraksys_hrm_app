#!/bin/bash

# One-Command HRM Update for RHEL Production
# This script safely updates your HRM system preserving all configurations

# Deployment options without GitHub token

echo "HRM System Deployment Script"
echo "============================"
echo ""
echo "This script will deploy your HRM system safely."
echo "Since GitHub repository authentication is required,"
echo "using local deployment method..."
echo ""

# Check if we're running on the server with existing deployment
if [ -d "/opt/skyraksys-hrm/skyraksys_hrm_app/.git" ]; then
    echo "✅ Found existing Git repository on server."
    echo "Using local Git pull method..."
    
    cd /opt/skyraksys-hrm/skyraksys_hrm_app
    
    # Use the existing deploy-from-git.sh script locally
    if [ -f "redhatprod/scripts/deploy-from-git.sh" ]; then
        echo "Running local deployment script..."
        bash redhatprod/scripts/deploy-from-git.sh
    else
        echo "❌ Local deployment script not found."
        echo "Please upload the complete codebase first."
        exit 1
    fi
else
    echo "❌ No existing Git repository found on server."
    echo ""
    echo "🔧 Manual Setup Required:"
    echo "1. Create deployment user and setup permissions:"
    echo "   ssh root@your-server"
    echo "   useradd -r -s /bin/bash -d /opt/skyraksys-hrm -m skyraksys"
    echo "   usermod -aG wheel skyraksys"
    echo "   mkdir -p /opt/skyraksys-hrm"
    echo "   chown -R skyraksys:skyraksys /opt/skyraksys-hrm/"
    echo ""
    echo "2. Upload deployment files to server:"
    echo "   scp -r redhatprod/ root@your-server:/tmp/"
    echo ""
    echo "3. SSH to server and run setup:"
    echo "   ssh root@your-server"
    echo "   cd /tmp"
    echo "   chmod +x redhatprod/scripts/deploy-from-git.sh"
    echo "   bash redhatprod/scripts/deploy-from-git.sh"
    echo ""
    echo "📋 Alternative: Complete Package Upload"
    echo "   scp redhatprod/scripts/deploy-complete-update.sh root@your-server:/tmp/"
    echo "   ssh root@your-server"
    echo "   chmod +x /tmp/deploy-complete-update.sh"
    echo "   bash /tmp/deploy-complete-update.sh"
    exit 1
fi
if [ $? -eq 0 ]; then
    chmod +x /tmp/deploy-from-git.sh
    bash /tmp/deploy-from-git.sh
else
    echo "Failed to download deployment script. Please check:"
    echo "1. Repository exists and is public"
    echo "2. Internet connectivity on server"
    echo "3. GitHub is accessible"
    echo ""
    echo "Alternative: Upload script manually and run:"
    echo "scp redhatprod/scripts/deploy-from-git.sh root@your-server:/tmp/"
    echo "ssh root@your-server 'chmod +x /tmp/deploy-from-git.sh && bash /tmp/deploy-from-git.sh'"
fi