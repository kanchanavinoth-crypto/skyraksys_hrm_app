const http = require('http');

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function checkViaAPI() {
    try {
        console.log('🔍 Checking July 21-27, 2025 via API...\n');

        // First try to login as admin to get all timesheets
        console.log('1. Attempting login...');
        
        const loginOptions = {
            hostname: 'localhost',
            port: 8080,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const credentials = [
            { email: 'admin@company.com', password: 'password123' },
            { email: 'employee@company.com', password: 'password123' },
            { email: 'hr@company.com', password: 'password123' }
        ];

        let token = null;
        let loggedInAs = null;

        for (const creds of credentials) {
            try {
                console.log(`   Trying: ${creds.email}`);
                const loginData = JSON.stringify(creds);
                const loginResponse = await makeRequest(loginOptions, loginData);
                
                console.log(`   Response status: ${loginResponse.status}`);
                console.log(`   Response data:`, JSON.stringify(loginResponse.data, null, 2));
                
                if (loginResponse.status === 200 && loginResponse.data.success) {
                    token = loginResponse.data.data.accessToken;
                    loggedInAs = creds.email;
                    console.log(`   ✅ Logged in as: ${loggedInAs}`);
                    console.log(`   🎫 Token: ${token ? 'Received' : 'Missing'}`);
                    break;
                } else {
                    console.log(`   ❌ Failed: ${loginResponse.data.message || 'Unknown error'}`);
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }

        if (!token) {
            console.log('❌ Could not login with any credentials');
            return;
        }

        // Check timesheets for July 21-27, 2025
        console.log('\n2. Checking timesheets for July 21-27, 2025...');
        
        const timesheetOptions = {
            hostname: 'localhost',
            port: 8080,
            path: '/api/timesheets/weekly?weekStartDate=2025-07-21',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const timesheetResponse = await makeRequest(timesheetOptions);
        
        if (timesheetResponse.status === 200) {
            const timesheets = timesheetResponse.data.timesheets || [];
            console.log(`   📊 Found ${timesheets.length} timesheet(s)`);
            
            if (timesheets.length === 0) {
                console.log('   ❌ No timesheets found for July 21-27, 2025');
            } else {
                timesheets.forEach((ts, index) => {
                    console.log(`\n   📋 Timesheet ${index + 1}:`);
                    console.log(`      ID: ${ts.id}`);
                    console.log(`      Status: ${ts.status}`);
                    console.log(`      Project: ${ts.project?.name || 'N/A'}`);
                    console.log(`      Task: ${ts.task?.name || 'N/A'}`);
                    console.log(`      Hours: ${ts.totalHoursWorked}`);
                    console.log(`      Week: ${ts.weekStartDate} to ${ts.weekEndDate}`);
                    console.log(`      Created: ${new Date(ts.createdAt).toLocaleString()}`);
                    if (ts.submittedAt) {
                        console.log(`      Submitted: ${new Date(ts.submittedAt).toLocaleString()}`);
                    }
                });
            }
        } else {
            console.log(`   ❌ API Error: ${timesheetResponse.status} - ${timesheetResponse.data.message || 'Unknown error'}`);
        }

        // Also check all timesheets to see what's available
        console.log('\n3. Checking all available timesheets...');
        
        const allTimesheetsOptions = {
            hostname: 'localhost',
            port: 8080,
            path: '/api/timesheets',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const allTimesheetsResponse = await makeRequest(allTimesheetsOptions);
        
        if (allTimesheetsResponse.status === 200) {
            const allTimesheets = allTimesheetsResponse.data.timesheets || [];
            console.log(`   📈 Total timesheets in system: ${allTimesheets.length}`);
            
            // Filter for July 2025
            const julyTimesheets = allTimesheets.filter(ts => {
                const weekStart = new Date(ts.weekStartDate);
                return weekStart.getFullYear() === 2025 && weekStart.getMonth() === 6; // July is month 6
            });
            
            console.log(`   📅 July 2025 timesheets: ${julyTimesheets.length}`);
            
            if (julyTimesheets.length > 0) {
                julyTimesheets.forEach((ts, index) => {
                    console.log(`      ${index + 1}. Week ${ts.weekStartDate}: ${ts.project?.name} - ${ts.task?.name} (${ts.status})`);
                });
            }
        } else {
            console.log(`   ❌ All timesheets API Error: ${allTimesheetsResponse.status}`);
        }

        console.log('\n✅ API check completed');

    } catch (error) {
        console.error('💥 API check failed:', error.message);
    }
}

checkViaAPI();