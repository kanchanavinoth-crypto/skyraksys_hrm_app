const http = require('http');

// Configuration
const API_BASE = 'localhost:5000';
const ADMIN_CREDENTIALS = {
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t'
};

let authToken = '';

// Helper function to make API requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || responseData}`));
                    }
                } catch (error) {
                    reject(new Error(`Parse error: ${error.message}\nResponse: ${responseData.substring(0, 200)}`));
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Login and get auth token
async function authenticate() {
    console.log('🔐 Authenticating admin user...');
    
    const options = {
        hostname: API_BASE.split(':')[0],
        port: parseInt(API_BASE.split(':')[1]),
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const response = await makeRequest(options, ADMIN_CREDENTIALS);
    authToken = response.data.accessToken;
    console.log('✅ Authentication successful!');
    return authToken;
}

// Create more diverse projects
async function createMoreProjects() {
    console.log('\n🚀 Creating diverse projects...');
    
    const projects = [
        {
            name: 'Customer Portal Development',
            description: 'Modern web portal for customer self-service and account management',
            startDate: '2024-01-01',
            endDate: '2024-08-31',
            status: 'In Progress'
        },
        {
            name: 'Mobile App Development',
            description: 'Cross-platform mobile application for iOS and Android',
            startDate: '2024-02-15',
            endDate: '2024-10-15',
            status: 'In Progress'
        },
        {
            name: 'Data Analytics Platform',
            description: 'Business intelligence and analytics dashboard for decision making',
            startDate: '2024-03-01',
            endDate: '2024-11-30',
            status: 'Planning'
        },
        {
            name: 'API Integration Project',
            description: 'Integration with third-party services and external APIs',
            startDate: '2024-04-01',
            endDate: '2024-09-30',
            status: 'In Progress'
        },
        {
            name: 'Security Enhancement',
            description: 'Implementation of advanced security measures and compliance',
            startDate: '2024-05-01',
            endDate: '2024-12-31',
            status: 'In Progress'
        },
        {
            name: 'Cloud Migration',
            description: 'Migration of legacy systems to cloud infrastructure',
            startDate: '2024-06-01',
            endDate: '2025-03-31',
            status: 'Planning'
        },
        {
            name: 'Performance Optimization',
            description: 'System performance analysis and optimization initiatives',
            startDate: '2024-07-01',
            endDate: '2024-12-31',
            status: 'In Progress'
        },
        {
            name: 'Employee Training Platform',
            description: 'Learning management system for employee skill development',
            startDate: '2024-08-01',
            endDate: '2025-02-28',
            status: 'Planning'
        }
    ];
    
    const createdProjects = [];
    
    for (const project of projects) {
        try {
            const options = {
                hostname: API_BASE.split(':')[0],
                port: parseInt(API_BASE.split(':')[1]),
                path: '/api/projects',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            };
            
            const response = await makeRequest(options, project);
            createdProjects.push(response.data);
            console.log(`  ✅ Created project: ${project.name}`);
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log(`  ⚠️  Project already exists: ${project.name}`);
            } else {
                console.log(`  ❌ Failed to create: ${project.name} - ${error.message}`);
            }
        }
    }
    
    return createdProjects;
}

// Create simple leave requests without leave types
async function createSimpleLeaveRequests(employees) {
    console.log('\n🏖️ Creating simple leave requests...');
    
    if (!employees || employees.length === 0) {
        console.log('  ⚠️  No employees found');
        return [];
    }
    
    const createdLeaveRequests = [];
    
    // Create leave requests for each employee (without leaveTypeId for now)
    for (const employee of employees) {
        // Each employee gets 1-2 leave requests
        const numRequests = 1 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < numRequests; i++) {
            const isPastRequest = Math.random() < 0.5;
            
            let startDate;
            if (isPastRequest) {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30) - 5);
            } else {
                startDate = new Date();
                startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 5);
            }
            
            const duration = 1 + Math.floor(Math.random() * 3);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration - 1);
            
            const startDateString = startDate.toISOString().split('T')[0];
            const endDateString = endDate.toISOString().split('T')[0];
            
            // Try without leaveTypeId first
            const leaveRequest = {
                employeeId: employee.id,
                startDate: startDateString,
                endDate: endDateString,
                reason: `Requesting ${duration} day${duration > 1 ? 's' : ''} of leave for personal matters and family commitments. This time off is needed for important personal obligations.`,
                isHalfDay: false
            };
            
            try {
                const options = {
                    hostname: API_BASE.split(':')[0],
                    port: parseInt(API_BASE.split(':')[1]),
                    path: '/api/leaves',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                };
                
                const response = await makeRequest(options, leaveRequest);
                createdLeaveRequests.push(response.data);
                
            } catch (error) {
                console.log(`  ⚠️  Leave request failed for ${employee.firstName}: ${error.message.substring(0, 100)}...`);
            }
        }
    }
    
    console.log(`  ✅ Created ${createdLeaveRequests.length} leave requests`);
    return createdLeaveRequests;
}

// Create additional employees with manager relationships
async function createManagerHierarchy(departments, positions) {
    console.log('\n👥 Creating manager hierarchy...');
    
    const managementEmployees = [
        {
            firstName: 'David',
            lastName: 'Wilson',
            email: 'david.wilson@company.com',
            phone: '9876543220',
            hireDate: '2021-03-01',
            dateOfBirth: '1985-11-15',
            gender: 'Male',
            address: '900 Leadership Lane, Executive Tower',
            city: 'Mumbai',
            state: 'Maharashtra',
            pinCode: '400002',
            nationality: 'Indian',
            maritalStatus: 'Married',
            employmentType: 'Full-time',
            workLocation: 'Mumbai Office',
            joiningDate: '2021-03-01',
            probationPeriod: 6,
            noticePeriod: 3,
            emergencyContactName: 'Sarah Wilson',
            emergencyContactPhone: '9876543221',
            emergencyContactRelation: 'Spouse',
            aadhaarNumber: '123456789020',
            panNumber: 'ABCDE1240N',
            bankName: 'Bank of Baroda',
            bankAccountNumber: '12345678901240',
            ifscCode: 'BARB0001234',
            bankBranch: 'Bandra Branch',
            accountHolderName: 'David Wilson',
            departmentId: departments.find(d => d.name.includes('Information Technology'))?.id,
            positionId: positions.find(p => p.title.includes('System Administrator'))?.id
        },
        {
            firstName: 'Emma',
            lastName: 'Thompson',
            email: 'emma.thompson@company.com',
            phone: '9876543222',
            hireDate: '2022-01-15',
            dateOfBirth: '1987-04-22',
            gender: 'Female',
            address: '800 Management Mews, Corporate Heights',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pinCode: '600001',
            nationality: 'Indian',
            maritalStatus: 'Single',
            employmentType: 'Full-time',
            workLocation: 'Chennai Office',
            joiningDate: '2022-01-15',
            probationPeriod: 6,
            noticePeriod: 2,
            emergencyContactName: 'James Thompson',
            emergencyContactPhone: '9876543223',
            emergencyContactRelation: 'Father',
            aadhaarNumber: '123456789021',
            panNumber: 'ABCDE1241O',
            bankName: 'Indian Bank',
            bankAccountNumber: '12345678901241',
            ifscCode: 'IDIB0001234',
            bankBranch: 'T Nagar Branch',
            accountHolderName: 'Emma Thompson',
            departmentId: departments.find(d => d.name.includes('Human Resources'))?.id,
            positionId: positions.find(p => p.title.includes('HR Manager'))?.id
        }
    ];
    
    const createdManagers = [];
    
    for (const manager of managementEmployees) {
        if (!manager.departmentId || !manager.positionId) {
            console.log(`  ⚠️  Skipping ${manager.firstName} ${manager.lastName} - missing department or position`);
            continue;
        }
        
        try {
            const options = {
                hostname: API_BASE.split(':')[0],
                port: parseInt(API_BASE.split(':')[1]),
                path: '/api/employees',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            };
            
            const response = await makeRequest(options, manager);
            createdManagers.push(response.data);
            console.log(`  ✅ Created manager: ${manager.firstName} ${manager.lastName}`);
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log(`  ⚠️  Manager already exists: ${manager.firstName} ${manager.lastName}`);
            } else {
                console.log(`  ❌ Failed to create: ${manager.firstName} ${manager.lastName} - ${error.message}`);
            }
        }
    }
    
    return createdManagers;
}

// Get current data
async function getCurrentData() {
    const endpoints = [
        { name: 'departments', path: '/api/employees/departments' },
        { name: 'positions', path: '/api/employees/positions' },
        { name: 'employees', path: '/api/employees' },
        { name: 'projects', path: '/api/projects' }
    ];
    
    const data = {};
    
    for (const endpoint of endpoints) {
        try {
            const options = {
                hostname: API_BASE.split(':')[0],
                port: parseInt(API_BASE.split(':')[1]),
                path: endpoint.path,
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            };
            
            const response = await makeRequest(options);
            data[endpoint.name] = response.data || [];
        } catch (error) {
            data[endpoint.name] = [];
        }
    }
    
    return data;
}

// Test final dashboard
async function testFinalDashboard() {
    console.log('\n📊 Testing final dashboard with all data...');
    
    try {
        const options = {
            hostname: API_BASE.split(':')[0],
            port: parseInt(API_BASE.split(':')[1]),
            path: '/api/dashboard/stats',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        };
        
        const response = await makeRequest(options);
        const stats = response.data.stats;
        
        console.log('  ✅ Dashboard fully loaded with comprehensive data!');
        console.log(`  👥 Employees: ${stats.employees.total} total (${stats.employees.active} active)`);
        console.log(`  🏖️ Leave Requests: ${stats.leaves.pending + stats.leaves.approved + stats.leaves.rejected} total`);
        console.log(`  ⏰ Timesheets: ${stats.timesheets.pending + stats.timesheets.submitted + stats.timesheets.approved} total`);
        console.log(`  💰 Payroll: ${stats.payroll.total} employees ready for processing`);
        
        return stats;
    } catch (error) {
        console.log(`  ❌ Dashboard test failed: ${error.message}`);
        return null;
    }
}

// Main execution function
async function enhanceSystemData() {
    try {
        console.log('🚀 Enhancing system with additional comprehensive data...\n');
        
        // Authenticate
        await authenticate();
        
        // Get current data
        const currentData = await getCurrentData();
        
        console.log(`\n📊 Current system state:`);
        console.log(`  📂 Departments: ${currentData.departments.length}`);
        console.log(`  💼 Positions: ${currentData.positions.length}`);
        console.log(`  👥 Employees: ${currentData.employees.length}`);
        console.log(`  🚀 Projects: ${currentData.projects.length}`);
        
        // Create more projects
        const newProjects = await createMoreProjects();
        
        // Create manager hierarchy
        const newManagers = await createManagerHierarchy(currentData.departments, currentData.positions);
        
        // Get updated employee list
        const updatedData = await getCurrentData();
        
        // Create simple leave requests
        const leaveRequests = await createSimpleLeaveRequests(updatedData.employees);
        
        // Test final dashboard
        await testFinalDashboard();
        
        console.log('\n🎉 System enhancement completed successfully!');
        console.log('\n📊 Final Enhancement Summary:');
        console.log(`  👥 Total Employees: ${updatedData.employees.length} (${newManagers.length} new managers)`);
        console.log(`  🚀 Total Projects: ${updatedData.projects.length} (${newProjects.length} new)`);
        console.log(`  🏖️ Leave Requests: ${leaveRequests.length} created`);
        
        console.log('\n✨ Your HRM system now has extensive test data!');
        console.log('\n🎯 Ready for comprehensive testing:');
        console.log('  • Rich dashboard with real statistics');
        console.log('  • Multiple projects for assignment');
        console.log('  • Diverse employee profiles with complete information');
        console.log('  • Management hierarchy for workflow testing');
        console.log('  • Timesheet data across multiple projects');
        console.log('  • Leave request scenarios');
        console.log('  • Payroll processing with multiple employees');
        
        console.log('\n🔗 Access your enhanced system:');
        console.log('  Dashboard: http://localhost:3000/dashboard');
        console.log('  Employees: http://localhost:3000/employees');
        console.log('  Projects: http://localhost:3000/projects');
        console.log('  Timesheets: http://localhost:3000/timesheets');
        console.log('  Leave Management: http://localhost:3000/leaves');
        
    } catch (error) {
        console.error('\n❌ Error enhancing system data:', error.message);
    }
}

// Run the script
enhanceSystemData();
