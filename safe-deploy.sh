#!/bin/bash
# =============================================================================
# SkyrakSys HRM - Safe Deployment Wrapper
# =============================================================================
# This script downloads and executes the deployment script safely

set -e

echo "==================================================================="
echo "ðŸš€ SkyrakSys HRM - Safe Deployment Wrapper"
echo "==================================================================="
echo "Downloading deployment script..."

# Create temporary file
TEMP_SCRIPT="/tmp/rhel-quick-deploy-$(date +%s).sh"

# Download script with proper error handling
if curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/rhel-quick-deploy.sh -o "$TEMP_SCRIPT"; then
    echo "âœ… Script downloaded successfully"
else
    echo "âŒ Failed to download script"
    exit 1
fi

# Verify file exists and has content
if [ ! -s "$TEMP_SCRIPT" ]; then
    echo "âŒ Downloaded script is empty"
    exit 1
fi

# Fix line endings if needed
sed -i 's/\r$//' "$TEMP_SCRIPT" 2>/dev/null || true

# Make executable
chmod +x "$TEMP_SCRIPT"

# Validate script syntax
if bash -n "$TEMP_SCRIPT"; then
    echo "âœ… Script syntax validated"
else
    echo "âŒ Script has syntax errors"
    cat -n "$TEMP_SCRIPT" | head -20
    exit 1
fi

echo "ðŸš€ Starting deployment..."
echo ""

# Execute the script
exec bash "$TEMP_SCRIPT" "$@"