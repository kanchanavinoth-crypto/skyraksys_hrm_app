const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

async function checkJuly21Submission() {
    try {
        console.log('🔍 Checking submission for July 21-27, 2025...\n');

        // Login as employee
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'employee@company.com',
            password: 'password123'
        });
        
        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }
        
        const token = loginResponse.data.token;
        const employeeId = loginResponse.data.employee.id;
        const headers = { Authorization: `Bearer ${token}` };
        
        console.log('✅ Login successful');
        console.log('   Employee:', loginResponse.data.employee.firstName, loginResponse.data.employee.lastName);
        console.log('   Employee ID:', employeeId);

        // Check timesheets for July 21-27, 2025
        const weekStartDate = '2025-07-21';
        console.log('\n2. Checking timesheets for week:', weekStartDate);
        
        try {
            const weeklyResponse = await axios.get(`${API_BASE}/timesheets/weekly?weekStartDate=${weekStartDate}`, { headers });
            const timesheets = weeklyResponse.data.timesheets || [];
            
            console.log(`\n📊 Found ${timesheets.length} timesheet(s) for July 21-27, 2025:`);
            
            if (timesheets.length === 0) {
                console.log('❌ No timesheets found for this week');
            } else {
                timesheets.forEach((timesheet, index) => {
                    console.log(`\n   Timesheet ${index + 1}:`);
                    console.log('     ID:', timesheet.id);
                    console.log('     Status:', timesheet.status);
                    console.log('     Project:', timesheet.project?.name || 'N/A');
                    console.log('     Task:', timesheet.task?.name || 'N/A');
                    console.log('     Total Hours:', timesheet.totalHoursWorked);
                    console.log('     Week:', timesheet.weekStartDate, 'to', timesheet.weekEndDate);
                    console.log('     Created:', new Date(timesheet.createdAt).toLocaleString());
                    console.log('     Updated:', new Date(timesheet.updatedAt).toLocaleString());
                    if (timesheet.submittedAt) {
                        console.log('     Submitted:', new Date(timesheet.submittedAt).toLocaleString());
                    }
                });
            }
            
        } catch (error) {
            console.log('❌ Error fetching weekly timesheets:', error.response?.data?.message || error.message);
        }

        // Also check all timesheets for this employee to see if there are any for July 2025
        console.log('\n3. Checking all timesheets for July 2025...');
        try {
            const allTimesheetsResponse = await axios.get(`${API_BASE}/timesheets`, { headers });
            const allTimesheets = allTimesheetsResponse.data.timesheets || [];
            
            // Filter for July 2025
            const julyTimesheets = allTimesheets.filter(ts => {
                const weekStart = new Date(ts.weekStartDate);
                return weekStart.getFullYear() === 2025 && weekStart.getMonth() === 6; // July is month 6 (0-indexed)
            });
            
            console.log(`\n📅 Found ${julyTimesheets.length} timesheet(s) for entire July 2025:`);
            
            julyTimesheets.forEach((timesheet, index) => {
                console.log(`\n   July Timesheet ${index + 1}:`);
                console.log('     Week:', timesheet.weekStartDate, 'to', timesheet.weekEndDate);
                console.log('     Status:', timesheet.status);
                console.log('     Project:', timesheet.project?.name || 'N/A');
                console.log('     Task:', timesheet.task?.name || 'N/A');
                console.log('     Total Hours:', timesheet.totalHoursWorked);
                console.log('     Created:', new Date(timesheet.createdAt).toLocaleString());
                if (timesheet.submittedAt) {
                    console.log('     Submitted:', new Date(timesheet.submittedAt).toLocaleString());
                }
            });
            
        } catch (error) {
            console.log('❌ Error fetching all timesheets:', error.response?.data?.message || error.message);
        }

        // Check database logs for any errors during submission
        console.log('\n4. Summary:');
        if (timesheets && timesheets.length > 0) {
            const submitted = timesheets.filter(ts => ts.status === 'Submitted').length;
            const draft = timesheets.filter(ts => ts.status === 'Draft').length;
            
            console.log(`   📈 Status breakdown for July 21-27:`);
            console.log(`     - Submitted: ${submitted}`);
            console.log(`     - Draft: ${draft}`);
            console.log(`     - Total: ${timesheets.length}`);
            
            if (submitted > 0 && draft > 0) {
                console.log('\n   ⚠️  Mixed status detected - some timesheets submitted, others still in draft');
            } else if (draft === timesheets.length) {
                console.log('\n   ⚠️  All timesheets are still in draft status - may need bulk submission');
            } else if (submitted === timesheets.length) {
                console.log('\n   ✅ All timesheets successfully submitted');
            }
        }

    } catch (error) {
        console.error('💥 Check failed:', error.response?.data || error.message);
    }
}

checkJuly21Submission();