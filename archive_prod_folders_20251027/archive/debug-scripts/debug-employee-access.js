const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function debugEmployeeAccess() {
    console.log('🔍 Debug Employee Access Issue\n');

    try {
        // First, test authentication status
        console.log('1. Testing authentication status...');
        
        // We need to check if there's a valid token in the browser's localStorage
        // Since we can't access that from Node.js, let's test the endpoints directly
        
        // Test health endpoint
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Backend is running:', healthResponse.data.status);
        
        // Test login endpoint to see what we need
        console.log('\n2. Testing login flow...');
        
        // Try to get employee list without auth to see the error
        try {
            const employeesResponse = await axios.get(`${BASE_URL}/employees`);
            console.log('❌ Unexpected: Got employees without authentication');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Expected: Authentication required (401)');
                console.log('Message:', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
            }
        }
        
        // Test with a specific employee ID without auth
        console.log('\n3. Testing specific employee access without auth...');
        try {
            const employeeResponse = await axios.get(`${BASE_URL}/employees/test-id`);
            console.log('❌ Unexpected: Got specific employee without authentication');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Expected: Authentication required for specific employee (401)');
            } else if (error.response && error.response.status === 403) {
                console.log('⚠️  Access denied (403) - this could be the issue you\'re seeing');
                console.log('Message:', error.response.data.message);
            } else {
                console.log('❌ Error:', error.response?.status, error.response?.data);
            }
        }
        
        console.log('\n📋 Analysis:');
        console.log('The "Employee not found or access denied" error is likely caused by:');
        console.log('1. Missing or invalid authentication token');
        console.log('2. Insufficient permissions (user role restrictions)');
        console.log('3. Employee ID not matching user\'s access permissions');
        console.log('4. Frontend not properly sending authentication headers');
        
        console.log('\n🔧 Troubleshooting Steps:');
        console.log('1. Check if user is properly logged in');
        console.log('2. Verify JWT token is valid and being sent with requests');
        console.log('3. Check user role permissions (admin/hr/manager/employee)');
        console.log('4. Ensure employee ID exists and user has access rights');
        console.log('5. Check browser developer tools for authentication errors');
        
    } catch (error) {
        console.log('❌ Connection Error:', error.message);
        console.log('Make sure the backend server is running on port 8080');
    }
}

async function testEmployeeEndpoints() {
    console.log('\n🧪 Testing Employee Endpoints Structure...\n');
    
    // List available endpoints from health check
    try {
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('📍 Available Employee Endpoints:');
        console.log('  GET /api/employees - List all employees');
        console.log('  GET /api/employees/:id - Get specific employee');
        console.log('  POST /api/employees - Create new employee');
        console.log('  PUT /api/employees/:id - Update employee');
        console.log('  DELETE /api/employees/:id - Delete employee');
        
        console.log('\n🔐 Authentication Requirements:');
        console.log('  All endpoints require valid JWT token');
        console.log('  Token must be sent in Authorization header: "Bearer <token>"');
        
        console.log('\n👥 Role-Based Access:');
        console.log('  Admin: Full access to all employees');
        console.log('  HR: Full access to all employees');
        console.log('  Manager: Access to own data + subordinates');
        console.log('  Employee: Access to own data only');
        
    } catch (error) {
        console.log('❌ Cannot connect to backend');
    }
}

// Main execution
async function main() {
    await debugEmployeeAccess();
    await testEmployeeEndpoints();
    
    console.log('\n💡 Quick Fix Suggestions:');
    console.log('1. Refresh the page and login again');
    console.log('2. Check if the user has appropriate role permissions');
    console.log('3. Verify the employee ID being accessed exists');
    console.log('4. Clear browser cache and try again');
    console.log('5. Check browser console for authentication errors');
}

main().catch(console.error);