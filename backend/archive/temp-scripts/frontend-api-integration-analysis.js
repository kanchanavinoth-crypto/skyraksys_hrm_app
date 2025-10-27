const fs = require('fs');
const path = require('path');

// Frontend API Integration Analysis Report
const report = {
  timestamp: new Date().toISOString(),
  title: "Frontend API Integration Analysis",
  summary: {
    totalAPIs: 0,
    workingAPIs: 0,
    missingAPIs: 0,
    needsFixing: 0
  },
  categories: {},
  missingEndpoints: [],
  recommendations: [],
  criticalIssues: []
};

// APIs Expected by Frontend Components
const expectedAPIs = {
  "Authentication": [
    { endpoint: "POST /auth/login", component: "Login", status: "WORKING", priority: "CRITICAL" },
    { endpoint: "GET /auth/me", component: "AuthContext", status: "NEEDS_FIX", priority: "CRITICAL", issue: "400 error" },
    { endpoint: "POST /auth/register", component: "AuthService", status: "UNTESTED", priority: "MEDIUM" },
    { endpoint: "PUT /auth/change-password", component: "AuthService", status: "UNTESTED", priority: "MEDIUM" },
    { endpoint: "POST /auth/refresh", component: "http-common", status: "MISSING", priority: "HIGH" },
    { endpoint: "POST /auth/logout", component: "AuthService", status: "UNTESTED", priority: "LOW" }
  ],
  
  "Employee Management": [
    { endpoint: "GET /employees", component: "ModernEmployeesList", status: "WORKING", priority: "CRITICAL" },
    { endpoint: "GET /employees/:id", component: "ModernEditEmployee", status: "WORKING", priority: "HIGH" },
    { endpoint: "POST /employees", component: "SimplifiedAddEmployee", status: "NEEDS_FIX", priority: "HIGH", issue: "Validation errors" },
    { endpoint: "PUT /employees/:id", component: "ModernEditEmployee", status: "UNTESTED", priority: "HIGH" },
    { endpoint: "DELETE /employees/:id", component: "ModernEmployeesList", status: "UNTESTED", priority: "MEDIUM" },
    { endpoint: "GET /employees/meta/departments", component: "Dashboard, AddEmployee", status: "WORKING", priority: "HIGH" },
    { endpoint: "GET /employees/meta/positions", component: "Dashboard, AddEmployee", status: "WORKING", priority: "HIGH" },
    { endpoint: "GET /employees/meta/dashboard", component: "Dashboard", status: "NEEDS_FIX", priority: "HIGH", issue: "400 error" },
    { endpoint: "GET /employees/statistics", component: "Dashboard", status: "MISSING", priority: "MEDIUM" },
    { endpoint: "GET /employees/search", component: "ModernEmployeesList", status: "UNTESTED", priority: "MEDIUM" }
  ],

  "Leave Management": [
    { endpoint: "GET /leaves", component: "ModernLeaveManagement", status: "WORKING", priority: "HIGH" },
    { endpoint: "GET /leaves/:id", component: "LeaveDetails", status: "UNTESTED", priority: "MEDIUM" },
    { endpoint: "POST /leaves", component: "ModernLeaveSubmission", status: "NEEDS_FIX", priority: "HIGH", issue: "Validation errors" },
    { endpoint: "PUT /leaves/:id", component: "LeaveApproval", status: "UNTESTED", priority: "HIGH" },
    { endpoint: "DELETE /leaves/:id", component: "LeaveManagement", status: "UNTESTED", priority: "MEDIUM" },
    { endpoint: "GET /leaves/types", component: "ModernLeaveSubmission", status: "MISSING", priority: "CRITICAL", issue: "404 error" },
    { endpoint: "GET /leaves/balance", component: "EmployeeLeaveRequests", status: "MISSING", priority: "HIGH", issue: "404 error" },
    { endpoint: "GET /leaves/balance/:employeeId", component: "LeaveBalancesList", status: "MISSING", priority: "HIGH" },
    { endpoint: "PUT /leaves/:id/status", component: "LeaveApproval", status: "UNTESTED", priority: "HIGH" },
    { endpoint: "GET /leaves/statistics", component: "Dashboard", status: "MISSING", priority: "MEDIUM" },
    { endpoint: "PUT /leaves/:id/approve", component: "LeaveApproval", status: "UNTESTED", priority: "HIGH" },
    { endpoint: "PUT /leaves/:id/reject", component: "LeaveApproval", status: "UNTESTED", priority: "HIGH" }
  ],

  "Timesheet Management": [
    { endpoint: "GET /timesheets", component: "ModernTimesheetManagement", status: "WORKING", priority: "HIGH" },
    { endpoint: "GET /timesheets/:id", component: "TimesheetDetails", status: "UNTESTED", priority: "MEDIUM" },
    { endpoint: "POST /timesheets", component: "ModernTimesheetSubmission", status: "NEEDS_FIX", priority: "HIGH", issue: "Validation errors" },
    { endpoint: "PUT /timesheets/:id", component: "TimesheetEdit", status: "UNTESTED", priority: "HIGH" },
    { endpoint: "DELETE /timesheets/:id", component: "TimesheetManagement", status: "UNTESTED", priority: "MEDIUM" },
    { endpoint: "GET /timesheets/meta/projects", component: "ModernTimesheetSubmission", status: "WORKING", priority: "HIGH" },
    { endpoint: "GET /timesheets/meta/projects/:id/tasks", component: "TimesheetForm", status: "UNTESTED", priority: "MEDIUM" },
    { endpoint: "PUT /timesheets/:id/submit", component: "TimesheetSubmission", status: "UNTESTED", priority: "HIGH" },
    { endpoint: "PUT /timesheets/:id/status", component: "TimesheetApproval", status: "UNTESTED", priority: "HIGH" },
    { endpoint: "GET /timesheets/summary", component: "Dashboard", status: "MISSING", priority: "MEDIUM", issue: "404 error" },
    { endpoint: "GET /timesheets/summary/:employeeId", component: "EmployeeDashboard", status: "MISSING", priority: "MEDIUM" }
  ],

  "Payroll Management": [
    { endpoint: "GET /payslips", component: "ModernPayrollManagement", status: "WORKING", priority: "HIGH" },
    { endpoint: "GET /payslips/:id", component: "PayslipDetails", status: "UNTESTED", priority: "MEDIUM" },
    { endpoint: "POST /payslips/generate", component: "ModernPayslipGeneration", status: "UNTESTED", priority: "HIGH" },
    { endpoint: "PUT /payslips/:id/status", component: "PayrollApproval", status: "UNTESTED", priority: "MEDIUM" },
    { endpoint: "GET /payslips/meta/dashboard", component: "Dashboard", status: "MISSING", priority: "MEDIUM", issue: "400 error" },
    { endpoint: "GET /payslips/employee/:id/summary", component: "EmployeePayslips", status: "UNTESTED", priority: "HIGH" },
    { endpoint: "GET /payslips/:id/pdf", component: "PayslipDownload", status: "UNTESTED", priority: "MEDIUM" },
    { endpoint: "GET /payslips/statistics", component: "Dashboard", status: "MISSING", priority: "MEDIUM" }
  ]
};

// Analyze each category
for (const [category, apis] of Object.entries(expectedAPIs)) {
  report.categories[category] = {
    total: apis.length,
    working: apis.filter(api => api.status === "WORKING").length,
    missing: apis.filter(api => api.status === "MISSING").length,
    needsFixing: apis.filter(api => api.status === "NEEDS_FIX").length,
    untested: apis.filter(api => api.status === "UNTESTED").length,
    apis: apis
  };

  // Add missing endpoints
  apis.filter(api => api.status === "MISSING" || api.status === "NEEDS_FIX")
      .forEach(api => {
        report.missingEndpoints.push({
          endpoint: api.endpoint,
          category: category,
          component: api.component,
          priority: api.priority,
          status: api.status,
          issue: api.issue || "Not implemented"
        });
      });

  report.summary.totalAPIs += apis.length;
  report.summary.workingAPIs += apis.filter(api => api.status === "WORKING").length;
  report.summary.missingAPIs += apis.filter(api => api.status === "MISSING").length;
  report.summary.needsFixing += apis.filter(api => api.status === "NEEDS_FIX").length;
}

// Critical Issues
report.criticalIssues = [
  {
    issue: "GET /auth/me returns 400 error",
    impact: "Users cannot retrieve their profile, breaking dashboard and user context",
    priority: "CRITICAL",
    solution: "Fix user profile endpoint to handle authentication tokens properly"
  },
  {
    issue: "GET /leaves/types missing (404)",
    impact: "Users cannot create leave requests without leave types",
    priority: "CRITICAL", 
    solution: "Implement leave types endpoint or fix routing"
  },
  {
    issue: "Employee creation validation errors",
    impact: "Cannot add new employees to the system",
    priority: "HIGH",
    solution: "Fix validation schema in employee creation endpoint"
  },
  {
    issue: "Leave creation validation errors", 
    impact: "Users cannot submit leave requests",
    priority: "HIGH",
    solution: "Fix validation schema in leave request creation"
  },
  {
    issue: "Missing dashboard data endpoints",
    impact: "Dashboard shows no real data, poor user experience",
    priority: "HIGH",
    solution: "Implement statistics and summary endpoints for dashboard"
  }
];

// Recommendations
report.recommendations = [
  {
    category: "Immediate Fixes (Critical)",
    priority: "CRITICAL",
    items: [
      "Fix GET /auth/me endpoint (currently returning 400)",
      "Implement GET /leaves/types endpoint (currently 404)",
      "Fix POST /employees validation schema",
      "Fix POST /leaves validation schema"
    ]
  },
  {
    category: "High Priority APIs",
    priority: "HIGH", 
    items: [
      "Implement GET /leaves/balance endpoint",
      "Implement dashboard statistics endpoints",
      "Fix employee and leave creation workflows",
      "Add proper leave approval endpoints",
      "Add timesheet submission and approval endpoints"
    ]
  },
  {
    category: "Medium Priority Enhancements",
    priority: "MEDIUM",
    items: [
      "Add search functionality for employees",
      "Implement payslip generation and PDF download",
      "Add timesheet summary and reporting endpoints",
      "Implement proper error handling across all endpoints"
    ]
  },
  {
    category: "Frontend Integration Improvements",
    priority: "MEDIUM",
    items: [
      "Add loading states for all API calls",
      "Implement proper error handling in components", 
      "Add retry mechanisms for failed API calls",
      "Implement offline capability where appropriate"
    ]
  }
];

// Calculate success rate
const successRate = (report.summary.workingAPIs / report.summary.totalAPIs) * 100;

console.log('\n' + '='.repeat(80));
console.log('🔍 FRONTEND API INTEGRATION ANALYSIS');
console.log('='.repeat(80));
console.log(`📊 Total APIs Expected: ${report.summary.totalAPIs}`);
console.log(`✅ Working APIs: ${report.summary.workingAPIs}`);
console.log(`❌ Missing APIs: ${report.summary.missingAPIs}`);
console.log(`⚠️  Need Fixing: ${report.summary.needsFixing}`);
console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

console.log('\n🚨 CRITICAL ISSUES:');
report.criticalIssues.forEach(issue => {
  console.log(`\n❌ ${issue.issue}`);
  console.log(`   Impact: ${issue.impact}`);
  console.log(`   Solution: ${issue.solution}`);
});

console.log('\n📋 MISSING/BROKEN ENDPOINTS BY PRIORITY:');
const criticalEndpoints = report.missingEndpoints.filter(ep => ep.priority === 'CRITICAL');
const highEndpoints = report.missingEndpoints.filter(ep => ep.priority === 'HIGH');
const mediumEndpoints = report.missingEndpoints.filter(ep => ep.priority === 'MEDIUM');

console.log(`\n🔴 CRITICAL (${criticalEndpoints.length}):`);
criticalEndpoints.forEach(ep => {
  console.log(`   ${ep.status === 'MISSING' ? '❌' : '⚠️'} ${ep.endpoint} - Used by ${ep.component}`);
  if (ep.issue) console.log(`      Issue: ${ep.issue}`);
});

console.log(`\n🟡 HIGH PRIORITY (${highEndpoints.length}):`);
highEndpoints.forEach(ep => {
  console.log(`   ${ep.status === 'MISSING' ? '❌' : '⚠️'} ${ep.endpoint} - Used by ${ep.component}`);
  if (ep.issue) console.log(`      Issue: ${ep.issue}`);
});

console.log(`\n🔵 MEDIUM PRIORITY (${mediumEndpoints.length}):`);
mediumEndpoints.forEach(ep => {
  console.log(`   ${ep.status === 'MISSING' ? '❌' : '⚠️'} ${ep.endpoint} - Used by ${ep.component}`);
  if (ep.issue) console.log(`      Issue: ${ep.issue}`);
});

console.log('\n📈 CATEGORY BREAKDOWN:');
for (const [category, data] of Object.entries(report.categories)) {
  const categoryRate = (data.working / data.total) * 100;
  console.log(`\n${category}:`);
  console.log(`   Total: ${data.total} | Working: ${data.working} | Missing: ${data.missing} | Need Fix: ${data.needsFixing}`);
  console.log(`   Success Rate: ${categoryRate.toFixed(1)}%`);
}

console.log('\n🎯 RECOMMENDATIONS:');
report.recommendations.forEach(rec => {
  const icon = rec.priority === 'CRITICAL' ? '🚨' : rec.priority === 'HIGH' ? '⚠️' : '💡';
  console.log(`\n${icon} ${rec.category}:`);
  rec.items.forEach(item => console.log(`   • ${item}`));
});

console.log('\n🏁 FRONTEND READINESS STATUS:');
if (successRate >= 90) {
  console.log('🟢 READY FOR PRODUCTION - Most APIs are working correctly');
} else if (successRate >= 70) {
  console.log('🟡 MOSTLY READY - Some critical fixes needed before production');
} else {
  console.log('🔴 NOT READY FOR PRODUCTION - Significant API issues must be resolved');
}

console.log('\n📄 Full report saved to: frontend-api-integration-analysis.json');

// Save detailed report
fs.writeFileSync(
  'frontend-api-integration-analysis.json',
  JSON.stringify(report, null, 2)
);

console.log('\n' + '='.repeat(80));
console.log('✅ ANALYSIS COMPLETE');
console.log('='.repeat(80));
