#!/bin/bash
# =============================================================================
# Line Endings Validation Script
# =============================================================================
# This script checks if all shell scripts have proper Unix line endings (LF)

echo "[INFO] Checking line endings for deployment scripts..."

scripts_to_check=(
    "rhel-quick-deploy.sh"
    "deployment-dry-run.sh"
    "ultimate-deploy.sh"
    "validate-production-configs.sh"
    "deploy-production.sh"
    "master-deploy.sh"
)

has_issues=0

for script in "${scripts_to_check[@]}"; do
    if [ -f "$script" ]; then
        # Check for CRLF endings
        if file "$script" | grep -q "CRLF"; then
            echo "[ERROR] $script has Windows CRLF line endings"
            has_issues=1
        else
            echo "[OK] $script has proper Unix LF line endings"
        fi
    else
        echo "[WARNING] $script not found"
    fi
done

if [ $has_issues -eq 0 ]; then
    echo ""
    echo "[SUCCESS] All scripts have proper line endings!"
    echo "[READY] Ready for Linux deployment"
else
    echo ""
    echo "[WARNING] Some scripts need line ending conversion"
    echo "Run: sed -i 's/\r$//' <script-name>"
fi