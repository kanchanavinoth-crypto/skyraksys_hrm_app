#!/bin/bash
# =============================================================================
# Line Endings Validation Script
# =============================================================================
# This script checks if all shell scripts have proper Unix line endings (LF)

echo "ðŸ” Checking line endings for deployment scripts..."

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
            echo "âŒ $script has Windows CRLF line endings"
            has_issues=1
        else
            echo "âœ… $script has proper Unix LF line endings"
        fi
    else
        echo "âš ï¸  $script not found"
    fi
done

if [ $has_issues -eq 0 ]; then
    echo ""
    echo "ðŸŽ‰ All scripts have proper line endings!"
    echo "âœ… Ready for Linux deployment"
else
    echo ""
    echo "âš ï¸  Some scripts need line ending conversion"
    echo "Run: sed -i 's/\r$//' <script-name>"
fi