#!/bin/bash

# =============================================================================
# Syntax Error Fix Script
# =============================================================================
# This script diagnoses and fixes the syntax error in rhel-quick-deploy.sh

echo "🔍 Diagnosing rhel-quick-deploy.sh syntax error..."

# Check if file exists
if [ ! -f "rhel-quick-deploy.sh" ]; then
    echo "❌ rhel-quick-deploy.sh not found!"
    echo "📥 Downloading fresh copy..."
    wget -q https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/rhel-quick-deploy.sh
    if [ $? -eq 0 ]; then
        echo "✅ Downloaded successfully"
    else
        echo "❌ Download failed"
        exit 1
    fi
fi

echo ""
echo "🔍 Checking file encoding and line endings..."

# Check file encoding
file_info=$(file rhel-quick-deploy.sh)
echo "File type: $file_info"

# Check line endings
if file rhel-quick-deploy.sh | grep -q CRLF; then
    echo "❌ Found Windows CRLF line endings!"
    echo "🔧 Converting CRLF to LF..."
    sed -i 's/\r$//' rhel-quick-deploy.sh
    echo "✅ Line endings fixed"
else
    echo "✅ Line endings are correct (LF)"
fi

# Check for BOM
if hexdump -C rhel-quick-deploy.sh | head -1 | grep -q "ef bb bf"; then
    echo "❌ Found UTF-8 BOM!"
    echo "🔧 Removing BOM..."
    sed -i '1s/^\xEF\xBB\xBF//' rhel-quick-deploy.sh
    echo "✅ BOM removed"
else
    echo "✅ No BOM found"
fi

echo ""
echo "🔍 Checking bash syntax..."

# Run syntax check and capture output
syntax_check=$(bash -n rhel-quick-deploy.sh 2>&1)
syntax_exit_code=$?

if [ $syntax_exit_code -eq 0 ]; then
    echo "✅ Syntax is correct!"
    echo ""
    echo "🚀 The script should now work. Try running:"
    echo "   sudo ./rhel-quick-deploy.sh"
else
    echo "❌ Syntax errors found:"
    echo "$syntax_check"
    echo ""
    
    # Check for common issues
    echo "🔍 Looking for common issues..."
    
    # Check for unmatched braces
    echo "Checking brace matching..."
    open_braces=$(grep -o '{' rhel-quick-deploy.sh | wc -l)
    close_braces=$(grep -o '}' rhel-quick-deploy.sh | wc -l)
    echo "Open braces: $open_braces"
    echo "Close braces: $close_braces"
    
    if [ "$open_braces" -ne "$close_braces" ]; then
        echo "❌ Brace mismatch detected!"
    fi
    
    # Show content around the error line
    error_line=$(echo "$syntax_check" | grep -o "line [0-9]*" | head -1 | sed 's/line //')
    if [ ! -z "$error_line" ]; then
        echo ""
        echo "🔍 Content around error line $error_line:"
        start_line=$((error_line - 5))
        end_line=$((error_line + 5))
        if [ $start_line -lt 1 ]; then start_line=1; fi
        sed -n "${start_line},${end_line}p" rhel-quick-deploy.sh | nl -v$start_line
    fi
    
    echo ""
    echo "🔧 Creating fixed version..."
    
    # Create a backup
    cp rhel-quick-deploy.sh rhel-quick-deploy.sh.backup
    
    # Try to fix common issues
    # Remove any trailing whitespace
    sed -i 's/[[:space:]]*$//' rhel-quick-deploy.sh
    
    # Ensure proper line endings
    sed -i 's/\r$//' rhel-quick-deploy.sh
    
    # Test again
    if bash -n rhel-quick-deploy.sh 2>/dev/null; then
        echo "✅ Fixed! Script should now work."
    else
        echo "❌ Could not auto-fix. Manual intervention needed."
        echo ""
        echo "💡 Possible solutions:"
        echo "1. Use the safe-deploy.sh wrapper instead:"
        echo "   curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/safe-deploy.sh | sudo bash"
        echo ""
        echo "2. Use the working master-deploy.sh script:"
        echo "   wget https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/master-deploy.sh"
        echo "   chmod +x master-deploy.sh"
        echo "   sudo ./master-deploy.sh"
    fi
fi