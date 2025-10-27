const axios = require('axios');

console.log('\n🔍 DEBUGGING API PAYSLIP FIELD PROCESSING');
console.log('='.repeat(50));

async function debugApiFieldProcessing() {
    try {
        const API_BASE = 'http://localhost:8080/api';
        
        // Login as admin
        console.log('\n🔐 Step 1: Admin authentication...');
        const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        const token = adminLogin.data.data.accessToken;
        console.log('✅ Admin authenticated');
        
        // Get valid foreign keys
        const [departments, positions] = await Promise.all([
            axios.get(`${API_BASE}/employees/meta/departments`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_BASE}/employees/meta/positions`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        // Create minimal test data with ONLY the problematic fields
        const testData = {
            firstName: 'ApiDebug',
            lastName: 'Test',
            email: `api.debug.${Date.now()}@test.com`,
            phone: '9876543210',
            hireDate: '2025-08-10',
            departmentId: departments.data.data[0].id,
            positionId: positions.data.data[0].id,
            
            // ONLY the fields that aren't working
            pfNumber: 'DEBUG_PF_999',
            esiNumber: 'DEBUG_ESI_888',
            bankName: 'Debug Bank Ltd',
            bankAccountNumber: '9999888877776666',
            ifscCode: 'DEBG0001234'
        };
        
        console.log('\n📤 Step 2: Sending API request...');
        console.log('Fields being sent:', Object.keys(testData));
        console.log('PF Number in request:', testData.pfNumber);
        console.log('Bank Name in request:', testData.bankName);
        
        const response = await axios.post(`${API_BASE}/employees`, testData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('\n📥 Step 3: Analyzing API response...');
        const employee = response.data.data;
        
        console.log('Employee ID:', employee.employeeId);
        console.log('PF Number in response:', employee.pfNumber);
        console.log('ESI Number in response:', employee.esiNumber);
        console.log('Bank Name in response:', employee.bankName);
        console.log('Bank Account in response:', employee.bankAccountNumber);
        console.log('IFSC Code in response:', employee.ifscCode);
        
        // Check if the issue is in API response or database storage
        console.log('\n🔍 Step 4: Direct database query...');
        const dbCheckResponse = await axios.get(`${API_BASE}/employees/${employee.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const dbEmployee = dbCheckResponse.data.data;
        console.log('\n📊 Direct DB Query Results:');
        console.log('PF Number from DB:', dbEmployee.pfNumber);
        console.log('Bank Name from DB:', dbEmployee.bankName);
        
        // Final analysis
        console.log('\n🎯 ROOT CAUSE ANALYSIS:');
        if (employee.pfNumber) {
            console.log('✅ API is working correctly - fields are being saved');
        } else {
            console.log('❌ API is NOT processing payslip fields');
            console.log('   This indicates the backend route is not extracting these fields');
            console.log('   Need to check backend route field destructuring');
        }
        
        return {
            success: true,
            apiWorking: !!employee.pfNumber,
            fieldsReceived: testData,
            fieldsReturned: {
                pfNumber: employee.pfNumber,
                esiNumber: employee.esiNumber,
                bankName: employee.bankName,
                bankAccountNumber: employee.bankAccountNumber,
                ifscCode: employee.ifscCode
            }
        };
        
    } catch (error) {
        console.error('\n❌ Debug failed:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

debugApiFieldProcessing();
