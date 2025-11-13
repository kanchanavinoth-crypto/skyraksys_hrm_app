#!/bin/bash

# One-Command HRM Update for RHEL Production
# This script safely updates your HRM system preserving all configurations

# Option 1: For public repository (no auth needed)
# curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/redhatprod/scripts/deploy-from-git.sh | bash

# Option 2: For private repository (requires GitHub token)
# curl -sSL -H "Authorization: token YOUR_GITHUB_TOKEN" https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/redhatprod/scripts/deploy-from-git.sh | bash

# Option 3: Download and run locally (current method)
echo "Downloading deployment script..."
curl -sSL -o /tmp/deploy-from-git.sh https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/redhatprod/scripts/deploy-from-git.sh
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