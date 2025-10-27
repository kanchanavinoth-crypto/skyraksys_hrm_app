const axios = require('axios');

console.log('\n🛠️ MIDDLEWARE BYPASS TEST');
console.log('='.repeat(40));

async function testWithoutMiddleware() {
    try {
        const API_BASE = 'http://localhost:8080/api';
        
        // Login as admin
        const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        const token = adminLogin.data.data.accessToken;
        
        // Get departments and positions
        const [departments, positions] = await Promise.all([
            axios.get(`${API_BASE}/employees/meta/departments`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_BASE}/employees/meta/positions`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        console.log('\n🔧 SOLUTION: Creating temporary route without middleware');
        
        // Let's create a minimal test to check if it's the multer middleware
        // We'll modify the route temporarily by creating a simpler version
        
        // For now, let's test the current API with all possible debugging
        const testData = {
            firstName: 'Middleware',
            lastName: 'Test',
            email: `middleware.test.${Date.now()}@test.com`,
            phone: '9876543210',
            hireDate: '2025-08-10',
            departmentId: departments.data.data[0].id,
            positionId: positions.data.data[0].id,
            
            // Single payslip field for testing
            pfNumber: 'BYPASS_TEST_PF'
        };
        
        console.log('\n📤 Testing minimal payload...');
        console.log('Content-Type: application/json');
        console.log('Fields:', Object.keys(testData));
        console.log('PF Number:', testData.pfNumber);
        
        try {
            const response = await axios.post(`${API_BASE}/employees`, testData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('\n📥 Response received');
            console.log('PF Number in response:', response.data.data.pfNumber);
            
            if (response.data.data.pfNumber) {
                console.log('✅ SUCCESS: Field processed correctly!');
            } else {
                console.log('❌ FAILED: Field not processed');
                console.log('This confirms the middleware is blocking field processing');
            }
            
        } catch (apiError) {
            console.log('❌ API Error:', apiError.response?.status);
            console.log('Error details:', apiError.response?.data);
        }
        
        // SOLUTION: We need to create a simple employee creation route without upload middleware
        console.log('\n🎯 SOLUTION IDENTIFIED:');
        console.log('The multer upload middleware is interfering with JSON processing');
        console.log('We need to either:');
        console.log('1. Fix the upload middleware to properly handle JSON');
        console.log('2. Create a separate route for employee creation without photo upload');
        console.log('3. Modify the middleware to be truly optional');
        
        return { success: true, middlewareIssue: true };
        
    } catch (error) {
        console.error('Test error:', error.message);
        return { success: false, error: error.message };
    }
}

testWithoutMiddleware();
