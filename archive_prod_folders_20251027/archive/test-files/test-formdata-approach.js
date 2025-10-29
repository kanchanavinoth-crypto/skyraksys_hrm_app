const axios = require('axios');

// Test with detailed request inspection
async function testWithRequestInspection() {
    try {
        const API_BASE = 'http://localhost:8080/api';
        
        // Login
        const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        const token = adminLogin.data.data.accessToken;
        
        // Get reference data
        const [departments, positions] = await Promise.all([
            axios.get(`${API_BASE}/employees/meta/departments`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_BASE}/employees/meta/positions`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        // Try sending with form-data (like the photo upload middleware expects)
        const FormData = require('form-data');
        const formData = new FormData();
        
        // Basic fields
        formData.append('firstName', 'FormData');
        formData.append('lastName', 'Test');
        formData.append('email', `formdata.test.${Date.now()}@test.com`);
        formData.append('phone', '9876543210');
        formData.append('hireDate', '2025-08-10');
        formData.append('departmentId', departments.data.data[0].id);
        formData.append('positionId', positions.data.data[0].id);
        
        // Payslip fields
        formData.append('pfNumber', 'FORM_PF_123');
        formData.append('esiNumber', 'FORM_ESI_456');
        formData.append('bankName', 'FormData Bank');
        formData.append('bankAccountNumber', '1111222233334444');
        formData.append('ifscCode', 'FORM0001234');
        formData.append('bankBranch', 'FormData Branch');
        formData.append('accountHolderName', 'FormData Test');
        
        console.log('📤 Sending with FormData (multipart/form-data)...');
        
        const response = await axios.post(`${API_BASE}/employees`, formData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                ...formData.getHeaders()
            }
        });
        
        console.log('\n📥 FormData Response:');
        const employee = response.data.data;
        console.log('Employee ID:', employee.employeeId);
        console.log('PF Number:', employee.pfNumber);
        console.log('ESI Number:', employee.esiNumber);
        console.log('Bank Name:', employee.bankName);
        console.log('Bank Account:', employee.bankAccountNumber);
        console.log('IFSC Code:', employee.ifscCode);
        
        if (employee.pfNumber) {
            console.log('\n✅ SUCCESS: FormData approach works!');
            console.log('   The issue was the request format - API expects multipart/form-data');
        } else {
            console.log('\n❌ Still not working with FormData');
        }
        
        return {
            success: true,
            formDataWorking: !!employee.pfNumber
        };
        
    } catch (error) {
        console.error('\n❌ FormData test failed:', error.response?.data || error.message);
        
        // If FormData fails, let's check what the middleware is doing
        console.log('\n🔍 Checking middleware behavior...');
        
        try {
            // Try a simple JSON request to see error details
            const simpleTest = await axios.post('http://localhost:8080/api/employees', {
                firstName: 'Simple',
                lastName: 'Test',
                pfNumber: 'SIMPLE_PF'
            }, {
                headers: { 
                    'Authorization': 'Bearer ' + 'test_token',
                    'Content-Type': 'application/json'
                }
            });
        } catch (simpleError) {
            console.log('Middleware error:', simpleError.response?.data || simpleError.message);
        }
        
        return { success: false, error: error.message };
    }
}

testWithRequestInspection();
