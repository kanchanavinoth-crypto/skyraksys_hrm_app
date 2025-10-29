// Simple script to check what's actually in the database
const path = require('path');

// Simulate the database connection
async function checkLatestEmployee() {
    try {
        console.log('Checking latest employee in database...');
        
        // We'll use a simple HTTP request to get the employee data
        const axios = require('axios');
        
        // Login as admin
        const adminLogin = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        const token = adminLogin.data.data.accessToken;
        
        // Get all employees and check the latest one
        const employeesResponse = await axios.get('http://localhost:8080/api/employees?limit=1&sortBy=createdAt&sortOrder=desc', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (employeesResponse.data.data.length > 0) {
            const latestEmployee = employeesResponse.data.data[0];
            console.log('\n📊 Latest Employee Data:');
            console.log('   Employee ID:', latestEmployee.employeeId);
            console.log('   Name:', latestEmployee.firstName, latestEmployee.lastName);
            console.log('   Email:', latestEmployee.email);
            console.log('\n💼 Payslip-Critical Fields:');
            console.log('   PF Number:', latestEmployee.pfNumber || 'NULL');
            console.log('   ESI Number:', latestEmployee.esiNumber || 'NULL');
            console.log('   Bank Name:', latestEmployee.bankName || 'NULL');
            console.log('   Bank Account:', latestEmployee.bankAccountNumber || 'NULL');
            console.log('   IFSC Code:', latestEmployee.ifscCode || 'NULL');
            console.log('   Bank Branch:', latestEmployee.bankBranch || 'NULL');
            console.log('   Account Holder:', latestEmployee.accountHolderName || 'NULL');
            
            console.log('\n🔍 All Fields Present:');
            Object.keys(latestEmployee).forEach(key => {
                if (latestEmployee[key] !== null && latestEmployee[key] !== undefined) {
                    console.log(`   ${key}: ${latestEmployee[key]}`);
                }
            });
        } else {
            console.log('No employees found');
        }
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkLatestEmployee();
