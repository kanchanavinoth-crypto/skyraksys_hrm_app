// Quick test to check available users and correct credentials
const { User, Employee, sequelize } = require('./models');

async function checkUsers() {
    try {
        console.log('🔍 Checking available users and employees...\n');
        
        const users = await User.findAll({
            attributes: ['id', 'email', 'role'],
            include: [{
                model: Employee,
                as: 'employee',
                attributes: ['id', 'firstName', 'lastName', 'employeeId'],
                required: false
            }]
        });

        console.log(`Found ${users.length} users:`);
        users.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Employee: ${user.employee ? `${user.employee.firstName} ${user.employee.lastName} (${user.employee.employeeId})` : 'None'}`);
            console.log('');
        });

        // Try a simple API test to the fixed endpoint
        const axios = require('axios');
        
        console.log('🔐 Testing with employee@company.com...');
        try {
            const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
                email: 'employee@company.com',
                password: 'password123'
            });
            
            if (loginResponse.data.success) {
                console.log('✅ Login successful!');
                
                const token = loginResponse.data.token;
                const timesheetsResponse = await axios.get('http://localhost:8080/api/timesheets?page=1&limit=5', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (timesheetsResponse.data.success) {
                    console.log(`✅ History API is working! Found ${timesheetsResponse.data.data.length} timesheets`);
                    
                    // Check if Week 38 is visible
                    const week38 = timesheetsResponse.data.data.filter(ts => ts.weekNumber === 38 && ts.year === 2025);
                    console.log(`📅 Week 38, 2025 timesheets visible: ${week38.length}`);
                    
                    if (week38.length > 0) {
                        console.log('🎉 SUCCESS! Week 38 timesheets are now visible in History tab!');
                        week38.forEach(ts => {
                            console.log(`   - ${ts.project?.name || 'Unknown'} / ${ts.task?.name || 'Unknown'} (${ts.totalHoursWorked}h)`);
                        });
                    }
                } else {
                    console.log('❌ History API still failing:', timesheetsResponse.data.message);
                }
            } else {
                console.log('❌ Login failed:', loginResponse.data.message);
            }
        } catch (error) {
            console.log('❌ API test failed:', error.response?.data?.message || error.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkUsers();