const axios = require('axios');

// Test timesheet history functionality
async function testTimesheetHistory() {
    console.log('🔍 Testing Timesheet History API...\n');
    
    try {
        // First, let's check if there are any existing timesheets
        console.log('1. Fetching timesheet history...');
        
        const response = await axios.get('http://localhost:8080/api/timesheets', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1wbG95ZWVJZCI6MSwidXNlcm5hbWUiOiJqb2huLmRvZSIsInJvbGUiOiJlbXBsb3llZSIsImlhdCI6MTczNjgxNzMzNywiZXhwIjoxNzM2ODI0NTM3fQ.UmCQ_UcGMTlbxaC7zv8gBZr_SUrSRa0ixB8F3d-fBJo'
            }
        });
        
        console.log('✅ Response Status:', response.status);
        console.log('📊 Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success && response.data.data) {
            const timesheets = response.data.data;
            console.log(`\n📈 Found ${timesheets.length} timesheet records:`);
            
            // Group by week for analysis
            const weeklyGroups = {};
            
            timesheets.forEach(ts => {
                const workDate = new Date(ts.workDate);
                const year = workDate.getFullYear();
                const weekStart = new Date(workDate);
                weekStart.setDate(workDate.getDate() - workDate.getDay() + 1); // Monday
                const weekKey = `${year}-W${Math.ceil((workDate - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000))}`;
                
                if (!weeklyGroups[weekKey]) {
                    weeklyGroups[weekKey] = [];
                }
                weeklyGroups[weekKey].push(ts);
            });
            
            Object.entries(weeklyGroups).forEach(([week, weekTimesheets]) => {
                const totalHours = weekTimesheets.reduce((sum, ts) => sum + (ts.hoursWorked || 0), 0);
                const statuses = weekTimesheets.map(ts => ts.status);
                
                console.log(`  ${week}: ${totalHours}h total, ${weekTimesheets.length} entries, statuses: [${statuses.join(', ')}]`);
            });
        } else {
            console.log('❌ No timesheet data found or API returned error');
        }
        
    } catch (error) {
        console.error('❌ Error testing timesheet history:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Test the functionality
testTimesheetHistory().then(() => {
    console.log('\n🎯 Timesheet history test completed!');
    process.exit(0);
}).catch(err => {
    console.error('💥 Test failed:', err);
    process.exit(1);
});