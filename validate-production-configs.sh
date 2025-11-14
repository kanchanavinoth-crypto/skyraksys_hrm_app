#!/bin/bash

# =============================================================================
# SkyrakSys HRM Production Configuration Validator v2.0
# =============================================================================
# Validates production server configurations against reference templates
# Detects discrepancies and provides override options

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}$1${NC}"
    echo "$(printf '=%.0s' {1..80})"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_config() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Global variables
DISCREPANCIES_FOUND=0
CONFIGS_CHECKED=0
OVERRIDE_AVAILABLE=false

# Configuration validation results
declare -A VALIDATION_RESULTS
declare -A CONFIG_SOURCES
declare -A CONFIG_DIFFERENCES

# Reference configuration files (templates from repo)
REFERENCE_CONFIGS=(
    ".env.production.template:Production Environment Template"
    "redhatprod/configs/nginx-hrm.conf:Nginx Configuration"
    "redhatprod/configs/nginx-hrm-static.conf:Nginx Static Configuration"
    "ecosystem.config.js:PM2 Process Configuration"
    "backend/.env.example:Backend Environment Example"
    "frontend/.env.production.template:Frontend Environment Template"
)

# Production server configuration paths
PRODUCTION_PATHS=(
    "backend/.env:/opt/skyraksys-hrm/backend/.env:Backend Environment"
    "backend/config/database.js:/opt/skyraksys-hrm/backend/config/database.js:Database Configuration"
    "ecosystem.config.js:/opt/skyraksys-hrm/ecosystem.config.js:PM2 Configuration"
    "/etc/nginx/sites-available/skyraksys.conf:/etc/nginx/sites-available/skyraksys.conf:Nginx Site Config"
    "/etc/nginx/conf.d/skyraksys.conf:/etc/nginx/conf.d/skyraksys.conf:Nginx Additional Config"
    "/var/lib/pgsql/17/data/postgresql.conf:/var/lib/pgsql/17/data/postgresql.conf:PostgreSQL Configuration"
)

validate_env_file() {
    local reference_file="$1"
    local production_file="$2"
    local config_name="$3"
    
    if [ "$QUIET_MODE" = false ]; then
        print_config "Validating $config_name"
    fi
    CONFIGS_CHECKED=$((CONFIGS_CHECKED + 1))
    
    if [ ! -f "$reference_file" ]; then
        print_error "Reference template not found: $reference_file"
        VALIDATION_RESULTS["$config_name"]="ERROR: Reference missing"
        return 1
    fi
    
    if [ ! -f "$production_file" ]; then
        if [ "$QUIET_MODE" = false ]; then
            print_warning "Production config not found: $production_file"
        fi
        VALIDATION_RESULTS["$config_name"]="MISSING: Will be created from template"
        CONFIG_SOURCES["$config_name"]="$reference_file"
        return 0
    fi
    
    # Extract key names from both files (ignore comments and empty lines)
    local ref_keys=$(grep -E '^[A-Z_]+=.*' "$reference_file" 2>/dev/null | cut -d'=' -f1 | sort)
    local prod_keys=$(grep -E '^[A-Z_]+=.*' "$production_file" 2>/dev/null | cut -d'=' -f1 | sort)
    
    # Find missing keys
    local missing_keys=$(comm -23 <(echo "$ref_keys") <(echo "$prod_keys"))
    local extra_keys=$(comm -13 <(echo "$ref_keys") <(echo "$prod_keys"))
    
    local has_differences=false
    local differences=""
    
    if [ -n "$missing_keys" ]; then
        has_differences=true
        differences+="Missing keys: $(echo $missing_keys | tr '\n' ' ')\n"
    fi
    
    if [ -n "$extra_keys" ]; then
        has_differences=true
        differences+="Extra keys: $(echo $extra_keys | tr '\n' ' ')\n"
    fi
    
    # Check for value differences in common keys
    local common_keys=$(comm -12 <(echo "$ref_keys") <(echo "$prod_keys"))
    for key in $common_keys; do
        local ref_value=$(grep "^$key=" "$reference_file" 2>/dev/null | cut -d'=' -f2- | head -1)
        local prod_value=$(grep "^$key=" "$production_file" 2>/dev/null | cut -d'=' -f2- | head -1)
        
        # Skip comparison for sensitive values (passwords, secrets)
        if [[ "$key" =~ (PASSWORD|SECRET|JWT|TOKEN) ]]; then
            continue
        fi
        
        if [ "$ref_value" != "$prod_value" ] && [ -n "$ref_value" ] && [[ ! "$ref_value" =~ (your-|example-|template-) ]]; then
            has_differences=true
            differences+="$key: template='$ref_value' vs production='$prod_value'\n"
        fi
    done
    
    if [ "$has_differences" = true ]; then
        DISCREPANCIES_FOUND=$((DISCREPANCIES_FOUND + 1))
        VALIDATION_RESULTS["$config_name"]="DIFFERENCES_FOUND"
        CONFIG_DIFFERENCES["$config_name"]="$differences"
        if [ "$QUIET_MODE" = false ]; then
            print_warning "Configuration differences detected"
        fi
    else
        VALIDATION_RESULTS["$config_name"]="VALID"
        if [ "$QUIET_MODE" = false ]; then
            print_success "Configuration is consistent"
        fi
    fi
    
    CONFIG_SOURCES["$config_name"]="$reference_file"
}

validate_config_file() {
    local reference_file="$1"
    local production_file="$2"
    local config_name="$3"
    
    if [ "$QUIET_MODE" = false ]; then
        print_config "Validating $config_name"
    fi
    CONFIGS_CHECKED=$((CONFIGS_CHECKED + 1))
    
    if [ ! -f "$reference_file" ]; then
        print_error "Reference file not found: $reference_file"
        VALIDATION_RESULTS["$config_name"]="ERROR: Reference missing"
        return 1
    fi
    
    if [ ! -f "$production_file" ]; then
        print_warning "Production config not found: $production_file"
        VALIDATION_RESULTS["$config_name"]="MISSING: Will be deployed from template"
        CONFIG_SOURCES["$config_name"]="$reference_file"
        return 0
    fi
    
    # Compare file contents (basic diff check)
    if diff -q "$reference_file" "$production_file" >/dev/null 2>&1; then
        VALIDATION_RESULTS["$config_name"]="IDENTICAL"
        if [ "$QUIET_MODE" = false ]; then
            print_success "Files are identical"
        fi
    else
        DISCREPANCIES_FOUND=$((DISCREPANCIES_FOUND + 1))
        VALIDATION_RESULTS["$config_name"]="DIFFERENCES_FOUND"
        
        # Store key differences
        local diff_output=$(diff -u "$reference_file" "$production_file" 2>/dev/null | head -20)
        CONFIG_DIFFERENCES["$config_name"]="$diff_output"
        if [ "$QUIET_MODE" = false ]; then
            print_warning "Configuration differences detected"
        fi
    fi
    
    CONFIG_SOURCES["$config_name"]="$reference_file"
}

generate_override_script() {
    local override_script="override-production-configs.sh"
    
    print_header "🔄 Generating Configuration Override Script"
    
    cat > "$override_script" << 'EOF'
#!/bin/bash

# Auto-generated Configuration Override Script
# Generated by validate-production-configs.sh

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

override_config() {
    local source_file="$1"
    local target_file="$2"
    local config_name="$3"
    local backup_suffix=$(date +%Y%m%d_%H%M%S)
    
    print_info "Overriding $config_name"
    
    # Create backup if target exists
    if [ -f "$target_file" ]; then
        cp "$target_file" "${target_file}.backup.$backup_suffix"
        print_info "Backup created: ${target_file}.backup.$backup_suffix"
    fi
    
    # Create target directory if needed
    mkdir -p "$(dirname "$target_file")"
    
    # Copy the reference file
    if cp "$source_file" "$target_file"; then
        print_success "Successfully overridden: $config_name"
        chmod 644 "$target_file"
        return 0
    else
        print_warning "Failed to override: $config_name"
        return 1
    fi
}

echo "🔄 Production Configuration Override"
echo "=================================="
echo ""
print_warning "This will override production configurations with template versions"
print_warning "Existing files will be backed up with timestamps"
echo ""
echo "Press ENTER to continue or Ctrl+C to abort"
read -r

EOF

    # Add override commands for each config with differences
    for config_name in "${!VALIDATION_RESULTS[@]}"; do
        local status="${VALIDATION_RESULTS[$config_name]}"
        local source="${CONFIG_SOURCES[$config_name]:-}"
        
        if [[ "$status" == "DIFFERENCES_FOUND" || "$status" == "MISSING"* ]]; then
            case "$config_name" in
                *"Environment"*)
                    echo "override_config \"$source\" \"backend/.env\" \"$config_name\"" >> "$override_script"
                    ;;
                *"Nginx"*)
                    echo "override_config \"$source\" \"/etc/nginx/sites-available/skyraksys.conf\" \"$config_name\"" >> "$override_script"
                    ;;
                *"PM2"*)
                    echo "override_config \"$source\" \"ecosystem.config.js\" \"$config_name\"" >> "$override_script"
                    ;;
                *"Frontend"*)
                    echo "override_config \"$source\" \"frontend/.env.production\" \"$config_name\"" >> "$override_script"
                    ;;
            esac
        fi
    done
    
    echo "" >> "$override_script"
    echo 'print_success "Configuration override completed!"' >> "$override_script"
    echo 'print_info "Remember to restart services: sudo systemctl restart nginx && pm2 restart all"' >> "$override_script"
    
    chmod +x "$override_script"
    print_success "Override script created: $override_script"
    OVERRIDE_AVAILABLE=true
}

show_detailed_differences() {
    print_header "📊 Detailed Configuration Analysis"
    
    for config_name in "${!VALIDATION_RESULTS[@]}"; do
        local status="${VALIDATION_RESULTS[$config_name]}"
        local differences="${CONFIG_DIFFERENCES[$config_name]:-}"
        
        echo ""
        print_config "$config_name"
        echo "Status: $status"
        
        if [ -n "$differences" ]; then
            echo ""
            echo -e "${YELLOW}Differences:${NC}"
            echo -e "$differences" | head -10
            
            if [ "$(echo -e "$differences" | wc -l)" -gt 10 ]; then
                echo "... (truncated, showing first 10 lines)"
            fi
        fi
        
        echo "$(printf '-%.0s' {1..60})"
    done
}

main() {
    # Check for quiet mode
    QUIET_MODE=false
    if [[ " $* " =~ " --quiet " ]]; then
        QUIET_MODE=true
    fi
    
    if [ "$QUIET_MODE" = false ]; then
        print_header "🔍 SkyrakSys HRM Production Configuration Validator"
        print_info "Comparing production server configs with repository templates"
        echo ""
    fi
    
    # Validate environment files
    if [ "$QUIET_MODE" = false ]; then
        print_header "Environment Configuration Validation"
    fi
    validate_env_file ".env.production.template" "backend/.env" "Backend Environment"
    validate_env_file "frontend/.env.production.template" "frontend/.env.production" "Frontend Environment"
    
    if [ "$QUIET_MODE" = false ]; then
        echo ""
    fi
    
    # Validate other configuration files
    if [ "$QUIET_MODE" = false ]; then
        print_header "System Configuration Validation"
    fi
    validate_config_file "redhatprod/configs/nginx-hrm.conf" "/etc/nginx/sites-available/skyraksys.conf" "Nginx Configuration"
    validate_config_file "ecosystem.config.js" "ecosystem.config.js" "PM2 Configuration"
    
    echo ""
    
    # Summary
    print_header "📋 Validation Summary"
    echo ""
    print_info "Configurations checked: $CONFIGS_CHECKED"
    
    if [ $DISCREPANCIES_FOUND -eq 0 ]; then
        print_success "All configurations are consistent! ✨"
        print_info "Your production server matches the repository templates"
    else
        print_warning "Found $DISCREPANCIES_FOUND configuration discrepancies"
        print_info "Review the differences below and consider using the override option"
    fi
    
    echo ""
    
    # Show results summary
    print_header "🎯 Configuration Status"
    for config_name in "${!VALIDATION_RESULTS[@]}"; do
        local status="${VALIDATION_RESULTS[$config_name]}"
        case "$status" in
            "VALID"|"IDENTICAL")
                print_success "$config_name: $status"
                ;;
            "MISSING"*)
                print_warning "$config_name: $status"
                ;;
            "DIFFERENCES_FOUND")
                print_error "$config_name: $status"
                ;;
            *)
                print_info "$config_name: $status"
                ;;
        esac
    done
    
    # Show detailed differences if any found
    if [ $DISCREPANCIES_FOUND -gt 0 ]; then
        echo ""
        show_detailed_differences
        
        echo ""
        print_header "🔄 Override Options"
        print_info "You can override production configs with repository templates"
        print_warning "This will replace production files with template versions"
        print_info "All existing files will be backed up before replacement"
        
        echo ""
        echo "Generate override script? (y/n): "
        read -r choice
        
        if [[ "$choice" =~ ^[Yy]$ ]]; then
            generate_override_script
            echo ""
            print_success "Override script ready! Execute with: ./override-production-configs.sh"
        fi
    fi
    
    # Quiet mode exit
    if [ "$QUIET_MODE" = true ]; then
        if [ $DISCREPANCIES_FOUND -eq 0 ]; then
            exit 0  # Success - no discrepancies
        else
            exit 1  # Warning - discrepancies found
        fi
    fi
    
    echo ""
    print_header "✨ Validation Complete"
    
    if [ $DISCREPANCIES_FOUND -eq 0 ]; then
        print_success "🎉 All systems consistent - Ready for deployment!"
    else
        print_warning "⚠️  Review discrepancies before deployment"
        if [ "$OVERRIDE_AVAILABLE" = true ]; then
            print_info "💡 Use ./override-production-configs.sh to align configurations"
        fi
    fi
}

# Execute main function
main "$@"