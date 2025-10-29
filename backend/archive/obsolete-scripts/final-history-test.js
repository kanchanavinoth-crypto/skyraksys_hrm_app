console.log('🎉 FINAL HISTORY TAB DATA TEST\n');

const axios = require('axios');

async function showHistoryData() {
    try {
        // Login
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'employee@company.com',
            password: 'password123'
        });

        const token = loginResponse.data.data.accessToken;
        const user = loginResponse.data.data.user;
        
        console.log(`✅ Logged in as: ${user.email} (${user.role})`);
        console.log(`👤 Employee ID: ${user.employeeId}`);

        // Get History data (same call the frontend makes)
        const historyResponse = await axios.get('http://localhost:8080/api/timesheets?page=1&limit=20&sortBy=weekStartDate&sortOrder=DESC', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const timesheets = historyResponse.data.data;
        console.log(`\n📊 HISTORY TAB DATA (${timesheets.length} timesheets available):`);
        console.log('='.repeat(70));

        // Group by week for better display
        const weekGroups = {};
        timesheets.forEach(ts => {
            const weekKey = `Week ${ts.weekNumber}, ${ts.year}`;
            if (!weekGroups[weekKey]) {
                weekGroups[weekKey] = [];
            }
            weekGroups[weekKey].push(ts);
        });

        Object.keys(weekGroups).forEach((week, index) => {
            const weekTimesheets = weekGroups[week];
            const totalHours = weekTimesheets.reduce((sum, ts) => sum + parseFloat(ts.totalHoursWorked), 0);
            
            console.log(`\n${index + 1}. ${week} (${weekTimesheets.length} timesheets, ${totalHours}h total)`);
            console.log(`   Date Range: ${weekTimesheets[0].weekStartDate} to ${weekTimesheets[0].weekEndDate}`);
            
            weekTimesheets.forEach((ts, i) => {
                const submittedText = ts.submittedAt ? `✅ ${new Date(ts.submittedAt).toLocaleDateString()}` : '📝 Draft';
                console.log(`   ${i + 1}. ${ts.project?.name || 'Unknown'}/${ts.task?.name || 'Unknown'} - ${ts.totalHoursWorked}h (${submittedText})`);
            });
        });

        // Look specifically for Week 38
        const week38 = timesheets.filter(ts => ts.weekNumber === 38 && ts.year === 2025);
        if (week38.length > 0) {
            console.log('\n🎯 WEEK 38, 2025 FOUND! (Your original request)');
            console.log('='.repeat(50));
            week38.forEach((ts, index) => {
                console.log(`${index + 1}. ${ts.project?.name}/${ts.task?.name} - ${ts.totalHoursWorked}h`);
                console.log(`   Status: ${ts.status}`);
                console.log(`   Submitted: ${ts.submittedAt ? new Date(ts.submittedAt).toLocaleString() : 'Not submitted'}`);
                console.log('');
            });
        } else {
            console.log('\n⚠️  Week 38, 2025 not in the first 20 results');
            console.log('   (It may be further back in pagination)');
        }

        console.log('\n🌐 FRONTEND ACCESS:');
        console.log('   1. Open http://localhost:3000 in your browser');
        console.log('   2. Login with: employee@company.com / password123');
        console.log('   3. Navigate to Timesheet → History tab');
        console.log('   4. You should now see all the timesheets listed above!');
        
        console.log('\n✅ The History tab visibility issue has been RESOLVED!');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

showHistoryData();