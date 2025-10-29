/**
 * Check projects and create timesheets with proper project IDs
 */

const axios = require('axios');

async function checkProjectsAndCreateTimesheets() {
    console.log('🔍 CHECKING PROJECTS AND CREATING TIMESHEETS');
    console.log('============================================\n');

    try {
        // Login first
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        
        const token = loginResponse.data.data.accessToken;
        console.log('✅ Authentication successful\n');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Check projects
        console.log('📋 CHECKING PROJECTS');
        console.log('====================');
        try {
            const projectsResponse = await axios.get('http://localhost:5000/api/projects', { headers });
            const projects = projectsResponse.data.data || [];
            console.log(`📊 Found ${projects.length} projects`);
            
            if (projects.length > 0) {
                console.log('\n📄 Available projects:');
                projects.forEach(project => {
                    console.log(`   - ${project.id}: ${project.name} (${project.status})`);
                });
            }

            // If no projects, create a default project
            let defaultProject = null;
            if (projects.length === 0) {
                console.log('\n🆕 Creating default project for timesheets...');
                try {
                    const newProject = {
                        name: 'General Work',
                        description: 'Default project for general work activities',
                        status: 'Active',
                        startDate: '2024-01-01',
                        endDate: '2024-12-31'
                    };

                    const createProjectResponse = await axios.post('http://localhost:5000/api/projects', newProject, { headers });
                    defaultProject = createProjectResponse.data.data;
                    console.log(`✅ Created default project: ${defaultProject.name} (${defaultProject.id})`);
                } catch (error) {
                    console.log(`❌ Failed to create project: ${error.response?.data?.message || error.message}`);
                    return;
                }
            } else {
                defaultProject = projects[0];
                console.log(`\n🎯 Using existing project: ${defaultProject.name} (${defaultProject.id})`);
            }

            // Get employees
            console.log('\n👥 GETTING EMPLOYEES');
            console.log('====================');
            const employeesResponse = await axios.get('http://localhost:5000/api/employees', { headers });
            const employees = employeesResponse.data.data || [];
            
            // Filter real employees (exclude demo/admin users)
            const realEmployees = employees.filter(emp => 
                !emp.email.includes('demo') && 
                !emp.email.includes('admin') && 
                !emp.email.includes('hr@company.com')
            );

            console.log(`📊 Found ${realEmployees.length} real employees for timesheet creation`);

            // Create timesheets
            console.log('\n⏰ CREATING TIMESHEETS');
            console.log('======================');
            let successCount = 0;
            let failCount = 0;

            for (const employee of realEmployees) {
                try {
                    const workedDays = Math.floor(Math.random() * 3) + 19; // 19-21 days
                    const leaveDays = Math.floor(Math.random() * 2); // 0-1 days
                    const absentDays = Math.max(0, 21 - workedDays - leaveDays);
                    const overtimeHours = Math.floor(Math.random() * 10); // 0-9 hours

                    const timesheet = {
                        employeeId: employee.id,
                        projectId: defaultProject.id,  // Required field!
                        year: 2024,
                        month: 12,
                        totalWorkingDays: 21,
                        totalWorkedDays: workedDays,
                        totalAbsentDays: absentDays,
                        totalLeaveDays: leaveDays,
                        totalOvertimeHours: overtimeHours,
                        notes: `Timesheet for ${employee.firstName} ${employee.lastName} - December 2024`
                    };

                    const response = await axios.post('http://localhost:5000/api/timesheets', timesheet, { headers });
                    
                    console.log(`✅ Created timesheet for: ${employee.firstName} ${employee.lastName} (${employee.employeeId}) - ${workedDays}/21 days`);
                    successCount++;

                } catch (error) {
                    console.log(`❌ Failed timesheet for ${employee.firstName} ${employee.lastName}: ${error.response?.data?.message || error.message}`);
                    failCount++;
                }
            }

            console.log('\n📊 TIMESHEET CREATION SUMMARY');
            console.log('==============================');
            console.log(`✅ Successful: ${successCount}`);
            console.log(`❌ Failed: ${failCount}`);
            console.log(`📈 Success Rate: ${successCount > 0 ? ((successCount / (successCount + failCount)) * 100).toFixed(1) : 0}%`);

            if (successCount >= 5) {
                console.log('\n🎉 SUCCESS! Ready for payroll testing');
                console.log('✅ Sufficient timesheets created for Steps 1 & 2');
            } else if (successCount > 0) {
                console.log('\n⚠️  PARTIAL SUCCESS! Some timesheets created');
                console.log('⚠️  May be sufficient for basic testing');
            } else {
                console.log('\n❌ FAILED! No timesheets created');
                console.log('❌ Cannot proceed with payroll testing');
            }

        } catch (error) {
            console.log(`❌ Error checking projects: ${error.response?.data?.message || error.message}`);
        }

    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
    }
}

checkProjectsAndCreateTimesheets().catch(console.error);
