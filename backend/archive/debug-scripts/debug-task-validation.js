const axios = require('axios');

async function debugTaskValidation() {
    try {
        // Login and get token
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'employee@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });

        const token = loginResponse.data.data.accessToken;
        const employeeId = loginResponse.data.data.user.employeeId;
        
        console.log('Employee ID from token:', employeeId);
        console.log('Employee ID type:', typeof employeeId);

        // Check the task details directly
        const { Task } = require('./backend/models');
        const task = await Task.findByPk('12345678-1234-1234-1234-123456789013');
        
        console.log('\nTask details:');
        console.log('- Task ID:', task.id);
        console.log('- Task name:', task.name);
        console.log('- availableToAll:', task.availableToAll);
        console.log('- assignedTo:', task.assignedTo);
        console.log('- assignedTo type:', typeof task.assignedTo);
        
        console.log('\nComparison:');
        console.log('- employeeId === task.assignedTo:', employeeId === task.assignedTo);
        console.log('- !task.availableToAll:', !task.availableToAll);
        console.log('- Should block?:', !task.availableToAll && task.assignedTo !== employeeId);

        process.exit();
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

debugTaskValidation();