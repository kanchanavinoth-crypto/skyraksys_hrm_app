// Test script to verify employee creation works after validation fixes
const axios = require('axios');

async function testEmployeeCreationAfterFixes() {
    console.log('🧪 Testing employee creation after validation fixes...');
    
    try {
        // First get a valid authentication token
        console.log('1. Setting up test environment...');
        
        // Test with minimal valid data (no statutory fields)
        const testEmployee = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe.minimal@company.com',
            employeeId: 'EMP002',
            hireDate: '2024-01-01',
            departmentId: '123e4567-e89b-12d3-a456-426614174000',  // These would need to be real IDs
            positionId: '123e4567-e89b-12d3-a456-426614174001'     // in a real scenario
        };
        
        console.log('2. Testing minimal employee creation (no statutory fields)...');
        console.log('Employee data:', JSON.stringify(testEmployee, null, 2));
        
        try {
            const response = await axios.post('http://localhost:8080/api/employees', testEmployee, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Minimal employee creation successful!');
            console.log('Response:', response.data);
        } catch (error) {
            console.log('❌ Minimal employee creation failed:');
            console.log('Status:', error.response?.status);
            console.log('Message:', error.response?.data?.message);
            console.log('Errors:', JSON.stringify(error.response?.data?.errors, null, 2));
        }
        
        // Test with valid statutory fields
        const employeeWithStatutory = {
            ...testEmployee,
            email: 'john.doe.statutory@company.com',
            employeeId: 'EMP003',
            aadhaarNumber: '123456789012',    // Valid 12-digit Aadhaar
            panNumber: 'ABCDE1234F',         // Valid PAN format
            ifscCode: 'SBIN0001234',         // Valid IFSC format
            pinCode: '123456'                // Valid 6-digit PIN
        };
        
        console.log('\n3. Testing employee creation with valid statutory fields...');
        console.log('Additional fields:', {
            aadhaarNumber: employeeWithStatutory.aadhaarNumber,
            panNumber: employeeWithStatutory.panNumber,
            ifscCode: employeeWithStatutory.ifscCode,
            pinCode: employeeWithStatutory.pinCode
        });
        
        try {
            const response = await axios.post('http://localhost:8080/api/employees', employeeWithStatutory, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Employee with statutory fields creation successful!');
            console.log('Response:', response.data);
        } catch (error) {
            console.log('❌ Employee with statutory fields creation failed:');
            console.log('Status:', error.response?.status);
            console.log('Message:', error.response?.data?.message);
            console.log('Errors:', JSON.stringify(error.response?.data?.errors, null, 2));
        }
        
        // Test with invalid statutory fields to verify validation
        const employeeWithInvalidFields = {
            ...testEmployee,
            email: 'john.doe.invalid@company.com',
            employeeId: 'EMP004',
            aadhaarNumber: '12345',          // Invalid: too short
            panNumber: 'INVALID',           // Invalid: wrong format
            ifscCode: 'WRONGFORMAT',        // Invalid: wrong format
            pinCode: '12'                   // Invalid: too short
        };
        
        console.log('\n4. Testing employee creation with invalid statutory fields (should fail)...');
        console.log('Invalid fields:', {
            aadhaarNumber: employeeWithInvalidFields.aadhaarNumber,
            panNumber: employeeWithInvalidFields.panNumber,
            ifscCode: employeeWithInvalidFields.ifscCode,
            pinCode: employeeWithInvalidFields.pinCode
        });
        
        try {
            const response = await axios.post('http://localhost:8080/api/employees', employeeWithInvalidFields, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('❗ Unexpected success - validation should have failed');
        } catch (error) {
            console.log('✅ Validation correctly failed for invalid fields:');
            console.log('Status:', error.response?.status);
            console.log('Message:', error.response?.data?.message);
            if (error.response?.data?.errors) {
                console.log('Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
            }
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
}

console.log('🔧 Employee Validation Fixes Test');
console.log('=====================================');
testEmployeeCreationAfterFixes().catch(console.error);