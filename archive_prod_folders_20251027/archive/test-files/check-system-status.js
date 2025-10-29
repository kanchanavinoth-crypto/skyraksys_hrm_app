/**
 * Check current employee count and system status
 */

const axios = require('axios');

async function checkSystemStatus() {
    console.log('🔍 CHECKING SYSTEM STATUS');
    console.log('=========================\n');

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

        // Check employees
        console.log('👥 CHECKING EMPLOYEES');
        console.log('====================');
        const employeesResponse = await axios.get('http://localhost:5000/api/employees', { headers });
        const employees = employeesResponse.data.data || [];
        console.log(`📊 Total employees: ${employees.length}`);
        
        if (employees.length > 0) {
            console.log(`📧 Email range: ${employees[0]?.email} to ${employees[employees.length-1]?.email}`);
            console.log(`🆔 Employee ID range: ${employees[0]?.employeeId} to ${employees[employees.length-1]?.employeeId}`);
            
            // Show recent employees
            console.log('\n📋 Recent employees:');
            employees.slice(-10).forEach(emp => {
                console.log(`   - ${emp.employeeId}: ${emp.firstName} ${emp.lastName} (${emp.email})`);
            });
        }

        // Check salary structures
        console.log('\n💰 CHECKING SALARY STRUCTURES');
        console.log('=============================');
        try {
            const salaryResponse = await axios.get('http://localhost:5000/api/salary-structures', { headers });
            const salaryStructures = salaryResponse.data.data || [];
            console.log(`📊 Total salary structures: ${salaryStructures.length}`);
        } catch (error) {
            console.log(`❌ Error checking salary structures: ${error.response?.data?.message || error.message}`);
        }

        // Check timesheets
        console.log('\n⏰ CHECKING TIMESHEETS');
        console.log('======================');
        try {
            const timesheetResponse = await axios.get('http://localhost:5000/api/timesheets', { headers });
            const timesheets = timesheetResponse.data.data || [];
            console.log(`📊 Total timesheets: ${timesheets.length}`);
        } catch (error) {
            console.log(`❌ Error checking timesheets: ${error.response?.data?.message || error.message}`);
        }

        // Assessment
        console.log('\n🎯 SCALING TEST READINESS ASSESSMENT');
        console.log('====================================');
        
        if (employees.length >= 25) {
            console.log('✅ SCALING TEST READY: 25+ employees available');
            console.log('✅ Can proceed with Step 1: Employee Scaling tests');
        } else if (employees.length >= 10) {
            console.log('⚠️  PARTIAL SCALING READY: 10+ employees available');
            console.log('⚠️  Sufficient for basic scaling tests');
        } else {
            console.log('❌ SCALING TEST NOT READY: Less than 10 employees');
        }

        console.log('\n🚀 NEXT STEPS FOR STEPS 1 & 2:');
        console.log('===============================');
        console.log('1. Create salary structures for existing employees');
        console.log('2. Create timesheets for payroll calculation');
        console.log('3. Test payroll generation at scale');
        console.log('4. Verify system performance with current employee count');

    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
    }
}

checkSystemStatus().catch(console.error);
