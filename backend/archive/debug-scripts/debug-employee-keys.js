// Debug script to check employee data structure and identify React key issue
const axios = require('axios');

async function debugEmployeeKeys() {
    console.log('Debugging employee data structure for React key issue...');
    
    try {
        // Try to get employees directly from API
        console.log('1. Testing employee API endpoint...');
        const response = await axios.get('http://localhost:8080/api/employees');
        console.log('API Response structure:', {
            status: response.status,
            dataType: typeof response.data,
            isArray: Array.isArray(response.data),
            hasDataProperty: 'data' in response.data,
            dataDataType: typeof response.data.data,
            isDataArray: Array.isArray(response.data.data)
        });
        
        if (response.data.data && Array.isArray(response.data.data)) {
            console.log('\n2. Employee data structure:');
            console.log('Number of employees:', response.data.data.length);
            
            if (response.data.data.length > 0) {
                const firstEmployee = response.data.data[0];
                console.log('First employee structure:', Object.keys(firstEmployee));
                console.log('First employee has id:', 'id' in firstEmployee);
                console.log('First employee id value:', firstEmployee.id);
                console.log('First employee id type:', typeof firstEmployee.id);
                
                // Check if all employees have unique ids
                const ids = response.data.data.map(emp => emp.id);
                const uniqueIds = [...new Set(ids)];
                console.log('Total employees:', ids.length);
                console.log('Unique IDs:', uniqueIds.length);
                console.log('All employees have unique IDs:', ids.length === uniqueIds.length);
                
                // Check for null or undefined ids
                const invalidIds = response.data.data.filter(emp => !emp.id);
                console.log('Employees with invalid IDs:', invalidIds.length);
                if (invalidIds.length > 0) {
                    console.log('Invalid ID employees:', invalidIds.map(emp => ({
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        email: emp.email,
                        id: emp.id
                    })));
                }
            }
        }
        
    } catch (error) {
        console.log('❌ Error fetching employees:', error.response?.status, error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n❌ Authentication required. This explains why the frontend might have issues.');
            console.log('The frontend might be trying to fetch employees without proper authentication.');
        }
    }
}

debugEmployeeKeys().catch(console.error);