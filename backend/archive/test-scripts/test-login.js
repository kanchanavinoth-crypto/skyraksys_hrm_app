const axios = require('axios');

async function testLogin() {
    try {
        console.log('🔍 Testing login endpoint...\n');
        
        const API_BASE = 'http://localhost:8080/api';
        
        // Try different email formats
        const testCredentials = [
            { email: 'employee@company.com', password: 'password123' },
            { email: 'admin@company.com', password: 'password123' },
            { email: 'hr@company.com', password: 'password123' }
        ];
        
        for (const creds of testCredentials) {
            console.log(`Testing: ${creds.email}`);
            try {
                const response = await axios.post(`${API_BASE}/auth/login`, creds);
                console.log('✅ Success!');
                console.log('Response:', JSON.stringify(response.data, null, 2));
                console.log('\n');
                
                // If successful, use this to check timesheets
                if (response.data.success) {
                    const token = response.data.token;
                    const headers = { Authorization: `Bearer ${token}` };
                    
                    console.log('Checking timesheets...');
                    const timesheetResponse = await axios.get(`${API_BASE}/timesheets/weekly?weekStartDate=2025-07-21`, { headers });
                    console.log('Timesheet response:', JSON.stringify(timesheetResponse.data, null, 2));
                }
                break;
                
            } catch (error) {
                console.log('❌ Failed:', error.response?.data?.message || error.message);
            }
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

testLogin();