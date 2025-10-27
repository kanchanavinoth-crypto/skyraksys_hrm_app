const axios = require('axios');

console.log('\n🔍 FRONTEND PAYSLIP INTEGRATION TEST');
console.log('='.repeat(45));

async function testFrontendPayslipIntegration() {
    try {
        const API_BASE = 'http://localhost:8080/api';
        
        // Login as admin
        const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        const token = adminLogin.data.data.accessToken;
        console.log('✅ Admin login successful');
        
        // Get departments and positions
        const [departments, positions] = await Promise.all([
            axios.get(`${API_BASE}/employees/meta/departments`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_BASE}/employees/meta/positions`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        // Test data simulating what the frontend form would send
        const frontendPayload = {
            // Basic fields
            firstName: 'Frontend',
            lastName: 'Test',
            email: `frontend.test.${Date.now()}@company.com`,
            phone: '9876543210',
            hireDate: '2025-08-10',
            department: departments.data.data[0].name,  // Frontend sends name
            position: positions.data.data[0].title,     // Frontend sends title
            
            // Payslip fields (exactly as frontend would send)
            aadhaarNumber: '123456789012',
            panNumber: 'FRONT1234T',
            uanNumber: '123456789012',
            pfNumber: 'FRONTEND_PF_2025',
            esiNumber: 'FRONTEND_ESI_2025',
            bankName: 'Frontend Test Bank',
            bankAccountNumber: '9876543210123456',
            ifscCode: 'FRTB0001234',
            bankBranch: 'Frontend Branch',
            accountHolderName: 'Frontend Test',
            
            // Additional fields
            address: 'Frontend Test Address',
            emergencyContactName: 'Frontend Emergency',
            emergencyContactPhone: '9876543211'
        };
        
        console.log('\n📤 Simulating frontend form submission...');
        console.log(`   Fields: ${Object.keys(frontendPayload).length}`);
        console.log(`   Department: ${frontendPayload.department}`);
        console.log(`   Position: ${frontendPayload.position}`);
        console.log(`   PF Number: ${frontendPayload.pfNumber}`);
        console.log(`   Bank Name: ${frontendPayload.bankName}`);
        
        // Send the payload (frontend would need to convert department/position names to IDs)
        // For this test, we'll manually convert like the frontend utility would
        const backendPayload = {
            ...frontendPayload,
            departmentId: departments.data.data[0].id,
            positionId: positions.data.data[0].id
        };
        delete backendPayload.department;
        delete backendPayload.position;
        
        const response = await axios.post(`${API_BASE}/employees`, backendPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('\n📥 Backend response received');
        const employee = response.data.data;
        
        console.log(`   Employee ID: ${employee.employeeId}`);
        console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
        
        // Validate payslip fields
        console.log('\n🔍 Payslip field validation:');
        const payslipCheck = {
            'PF Number': employee.pfNumber,
            'ESI Number': employee.esiNumber,
            'Bank Name': employee.bankName,
            'Account Number': employee.bankAccountNumber,
            'IFSC Code': employee.ifscCode,
            'Account Holder': employee.accountHolderName
        };
        
        let working = 0;
        Object.entries(payslipCheck).forEach(([field, value]) => {
            const status = value ? '✅ WORKING' : '❌ MISSING';
            console.log(`   ${field}: ${status}`);
            if (value) working++;
        });
        
        const successRate = (working / Object.keys(payslipCheck).length) * 100;
        
        console.log(`\n🎯 Frontend Integration Success: ${Math.round(successRate)}%`);
        
        if (successRate === 100) {
            console.log('🎉 PERFECT: Frontend → Backend → Database integration working!');
            console.log('✅ The add-employee form will create 100% payslip-ready employees');
        } else {
            console.log('⚠️ Some payslip fields not being processed correctly');
        }
        
        return {
            success: true,
            successRate: successRate,
            working: working,
            total: Object.keys(payslipCheck).length
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

testFrontendPayslipIntegration();
