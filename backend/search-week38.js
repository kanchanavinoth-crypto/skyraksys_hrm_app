console.log('🔍 SEARCHING FOR WEEK 38, 2025 SPECIFICALLY\n');

const axios = require('axios');

async function findWeek38() {
    try {
        // Login
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'employee@company.com',
            password: 'password123'
        });

        const token = loginResponse.data.data.accessToken;

        // Search for Week 38 specifically
        const week38Response = await axios.get('http://localhost:8080/api/timesheets?weekNumber=38&year=2025', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const week38Data = week38Response.data.data;
        console.log(`📅 Week 38, 2025 search results: ${week38Data.length} timesheets found`);

        if (week38Data.length > 0) {
            console.log('\n🎯 WEEK 38 TIMESHEETS FOUND:');
            console.log('='.repeat(50));
            
            let totalHours = 0;
            week38Data.forEach((ts, index) => {
                totalHours += parseFloat(ts.totalHoursWorked);
                console.log(`${index + 1}. ${ts.project?.name}/${ts.task?.name}`);
                console.log(`   Hours: ${ts.totalHoursWorked}`);
                console.log(`   Status: ${ts.status}`);
                console.log(`   Submitted: ${ts.submittedAt ? new Date(ts.submittedAt).toLocaleString() : 'Not submitted'}`);
                console.log(`   Date Range: ${ts.weekStartDate} to ${ts.weekEndDate}`);
                console.log('');
            });
            
            console.log(`📊 Total Week 38 Hours: ${totalHours}h`);
            console.log('\n✅ Week 38 timesheets exist and are accessible via the API!');
            console.log('   They may not appear in the default History view due to pagination');
            console.log('   or date ordering, but the data is there.');
            
        } else {
            console.log('❌ No Week 38, 2025 timesheets found');
        }

        // Also get all timesheets with no pagination to see the full list
        console.log('\n🔍 Checking complete timesheet list...');
        const allResponse = await axios.get('http://localhost:8080/api/timesheets?limit=100', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const allTimesheets = allResponse.data.data;
        const week38All = allTimesheets.filter(ts => ts.weekNumber === 38 && ts.year === 2025);
        console.log(`📊 Total timesheets in database: ${allTimesheets.length}`);
        console.log(`📅 Week 38 timesheets in full list: ${week38All.length}`);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

findWeek38();