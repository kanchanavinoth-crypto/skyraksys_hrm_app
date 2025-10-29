#!/bin/bash
# Component Cleanup Script
# Run this script to remove duplicate and obsolete components

echo "🧹 Starting component cleanup..."

# Remove obsolete backup files
rm -f "frontend/src/components/add-employee.component.js.backup"
rm -f "frontend/src/components/SimplifiedAddEmployee.js.backup"
rm -f "frontend/src/components/Login-backup.js"
rm -f "frontend/src/components/Auth-backup.js"

# Remove duplicate components (keeping recommended ones)
rm -f "frontend/src/components/add-employee.component.js"
rm -f "frontend/src/components/ModernAddEmployee.js"
rm -f "frontend/src/components/SimplifiedAddEmployee.js"
rm -f "frontend/src/components/SimplifiedAddEmployeeClean.js"
rm -f "frontend/src/components/employees-list.component.js"
rm -f "frontend/src/components/AdvancedEmployeesList.js"
rm -f "frontend/src/components/OptimizedEmployeesList.js"
rm -f "frontend/src/components/Login-backup.js"
rm -f "frontend/src/components/Login-clean.js"
rm -f "frontend/src/components/ModernLogin.js"
rm -f "frontend/src/components/add-timesheet.component.js"
rm -f "frontend/src/components/add-timesheet-modern.component.js"
rm -f "frontend/src/components/add-timesheet-simple.component.js"
rm -f "frontend/src/components/ModernAddTimesheet.js"
rm -f "frontend/src/components/ModernTimesheetSubmission.js"
rm -f "frontend/src/components/add-leave-request.component.js"
rm -f "frontend/src/components/ModernLeaveSubmission.js"
rm -f "frontend/src/components/dashboard.component.js"
rm -f "frontend/src/components/dashboard-modern.component.js"
rm -f "frontend/src/components/EmployeeDashboard.js"
rm -f "frontend/src/components/Layout-clean.js"

echo "✅ Component cleanup completed!"
echo "📊 Removed $(echo 24) files"
echo "🚀 Run 'npm run build' to verify everything still works"
