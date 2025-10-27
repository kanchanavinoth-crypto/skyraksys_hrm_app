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

// Create projects with minimal required fields
async function createProjects() {
    console.log('\n🚀 Creating projects...');
    
    const projects = [
        {
            name: 'HRM Dashboard Development',
            description: 'Development of comprehensive HR management dashboard',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            status: 'In Progress'
        },
        {
            name: 'Employee Self-Service Portal',
            description: 'Employee portal for timesheet and leave management',
            startDate: '2024-02-01',
            endDate: '2024-08-31',
            status: 'In Progress'
        },
        {
            name: 'Payroll System Integration',
            description: 'Integration with external payroll processing system',
            startDate: '2024-03-01',
            endDate: '2024-09-30',
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
            console.log(`  ❌ Failed to create project: ${project.name} - ${error.message}`);
        }
    }
    
    return createdProjects;
}

// Create timesheets for existing employees
async function createTimesheets(employees, projects) {
    console.log('\n⏰ Creating timesheets for existing employees...');
    
    if (!employees || employees.length === 0) {
        console.log('  ⚠️  No employees found');
        return [];
    }
    
    const createdTimesheets = [];
    const today = new Date();
    
    // Create timesheets for the last 10 working days
    for (let dayOffset = 10; dayOffset >= 1; dayOffset--) {
        const workDate = new Date(today.getTime() - (dayOffset * 24 * 60 * 60 * 1000));
        
        // Skip weekends
        if (workDate.getDay() === 0 || workDate.getDay() === 6) continue;
        
        const dateString = workDate.toISOString().split('T')[0];
        
        // Create timesheets for each employee
        for (const employee of employees) {
            // Skip some days randomly to make it more realistic
            if (Math.random() < 0.15) continue; // 15% chance to skip
            
            const project = projects && projects.length > 0 
                ? projects[Math.floor(Math.random() * projects.length)]
                : null;
            
            const hoursWorked = 7 + Math.random() * 2; // 7-9 hours
            const roundedHours = Math.round(hoursWorked * 10) / 10;
            
            let status;
            if (dayOffset > 7) status = 'approved';
            else if (dayOffset > 3) status = 'pending';
            else status = 'submitted';
            
            const timesheet = {
                workDate: dateString,
                hoursWorked: roundedHours,
                description: project 
                    ? `Working on ${project.name} - development and testing activities`
                    : 'General development and administrative tasks',
                status: status,
                employeeId: employee.id,
                clockInTime: '09:00:00',
                clockOutTime: `${Math.floor(9 + roundedHours)}:${String(Math.floor((roundedHours % 1) * 60)).padStart(2, '0')}:00`,
                breakHours: 1
            };
            
            // Add project ID if we have projects
            if (project) {
                timesheet.projectId = project.id;
            }
            
            try {
                const options = {
                    hostname: API_BASE.split(':')[0],
                    port: parseInt(API_BASE.split(':')[1]),
                    path: '/api/timesheets',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                };
                
                const response = await makeRequest(options, timesheet);
                createdTimesheets.push(response.data);
                
            } catch (error) {
                // Only log if it's not a duplicate
                if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
                    console.log(`  ⚠️  Timesheet failed for ${employee.firstName}: ${error.message.substring(0, 50)}...`);
                }
            }
        }
    }
    
    console.log(`  ✅ Created ${createdTimesheets.length} timesheets`);
    return createdTimesheets;
}

// Create leave requests
async function createLeaveRequests(employees) {
    console.log('\n🏖️ Creating leave requests...');
    
    if (!employees || employees.length === 0) {
        console.log('  ⚠️  No employees found');
        return [];
    }
    
    const leaveTypes = ['Annual Leave', 'Sick Leave', 'Personal Leave'];
    const statuses = ['pending', 'approved', 'rejected'];
    const createdLeaveRequests = [];
    
    // Create leave requests for each employee
    for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        
        // Create 1-2 leave requests per employee
        const numRequests = 1 + Math.floor(Math.random() * 2);
        
        for (let j = 0; j < numRequests; j++) {
            const isPastRequest = Math.random() < 0.6; // 60% past, 40% future
            
            let startDate;
            if (isPastRequest) {
                // Past request (last 60 days)
                startDate = new Date();
                startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60));
            } else {
                // Future request (next 30 days)
                startDate = new Date();
                startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 5);
            }
            
            const duration = 1 + Math.floor(Math.random() * 4); // 1-4 days
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration - 1);
            
            const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            const leaveRequest = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                leaveType: leaveType,
                reason: `${leaveType.toLowerCase()} for personal matters and rest`,
                status: status,
                employeeId: employee.id
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
                console.log(`  ⚠️  Leave request failed for ${employee.firstName}: ${error.message.substring(0, 50)}...`);
            }
        }
    }
    
    console.log(`  ✅ Created ${createdLeaveRequests.length} leave requests`);
    return createdLeaveRequests;
}

// Get current data
async function getCurrentData() {
    console.log('\n🔍 Getting current data...');
    
    try {
        // Get employees
        const empOptions = {
            hostname: API_BASE.split(':')[0],
            port: parseInt(API_BASE.split(':')[1]),
            path: '/api/employees',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        };
        const empResponse = await makeRequest(empOptions);
        const employees = empResponse.data || [];
        
        // Get projects
        let projects = [];
        try {
            const projOptions = {
                hostname: API_BASE.split(':')[0],
                port: parseInt(API_BASE.split(':')[1]),
                path: '/api/projects',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            };
            const projResponse = await makeRequest(projOptions);
            projects = projResponse.data || [];
        } catch (error) {
            console.log('  ⚠️  No projects found, will create some');
        }
        
        console.log(`  📊 Found ${employees.length} employees and ${projects.length} projects`);
        return { employees, projects };
        
    } catch (error) {
        console.log(`  ❌ Error getting current data: ${error.message}`);
        return { employees: [], projects: [] };
    }
}

// Test dashboard after adding data
async function testDashboard() {
    console.log('\n📊 Testing dashboard with new data...');
    
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
        
        console.log('  ✅ Dashboard stats updated!');
        console.log(`  👥 Employees: ${stats.employees.total} (${stats.employees.active} active)`);
        console.log(`  🏖️ Leave Requests: ${stats.leaves.pending + stats.leaves.approved + stats.leaves.rejected} total`);
        console.log(`  ⏰ Timesheets: ${stats.timesheets.pending + stats.timesheets.submitted + stats.timesheets.approved} total`);
        console.log(`  💰 Payroll: ${stats.payroll.processed} processed, ${stats.payroll.pending} pending`);
        
        return stats;
    } catch (error) {
        console.log(`  ❌ Dashboard test failed: ${error.message}`);
        return null;
    }
}

// Main execution function
async function addTestDataToExisting() {
    try {
        console.log('🚀 Adding test data to existing employees...\n');
        
        // Authenticate
        await authenticate();
        
        // Get current data
        const { employees, projects: existingProjects } = await getCurrentData();
        
        if (employees.length === 0) {
            console.log('❌ No employees found. Please check the employee API.');
            return;
        }
        
        // Create projects if we don't have any
        let allProjects = existingProjects;
        if (existingProjects.length === 0) {
            const newProjects = await createProjects();
            allProjects = newProjects;
        } else {
            console.log(`\n🚀 Using ${existingProjects.length} existing projects`);
        }
        
        // Create timesheets
        const timesheets = await createTimesheets(employees, allProjects);
        
        // Create leave requests
        const leaveRequests = await createLeaveRequests(employees);
        
        // Test dashboard
        const dashboardStats = await testDashboard();
        
        console.log('\n🎉 Test data enhancement completed successfully!');
        console.log('\n📊 Final Summary:');
        console.log(`  👥 Employees: ${employees.length}`);
        console.log(`  🚀 Projects: ${allProjects.length}`);
        console.log(`  ⏰ New Timesheets: ${timesheets.length}`);
        console.log(`  🏖️ New Leave Requests: ${leaveRequests.length}`);
        
        console.log('\n✨ Your dashboard should now show rich data!');
        console.log('🔗 Visit the dashboard to see:');
        console.log('  • Employee statistics');
        console.log('  • Timesheet data with pending/approved status');
        console.log('  • Leave request trends');
        console.log('  • Monthly employee growth charts');
        
        if (dashboardStats) {
            console.log('\n🎯 Dashboard is working correctly with updated data!');
        }
        
    } catch (error) {
        console.error('\n❌ Error adding test data:', error.message);
    }
}

// Run the script
addTestDataToExisting();
