/**
 * Check existing positions for departments
 */

const axios = require('axios');

async function checkPositions() {
    console.log('🔍 CHECKING EXISTING POSITIONS');
    console.log('==============================\n');

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

        // Get departments
        const deptResponse = await axios.get('http://localhost:5000/api/departments', { headers });
        const departments = deptResponse.data.data || [];

        console.log('🏢 DEPARTMENTS AND POSITIONS:');
        for (const dept of departments) {
            console.log(`\n📁 ${dept.name} (${dept.id})`);
            if (dept.positions && dept.positions.length > 0) {
                for (const position of dept.positions) {
                    console.log(`   🏷️  ${position.title} (${position.id})`);
                }
            } else {
                console.log(`   ⚠️  No positions found`);
            }
        }

        // Try to get all positions
        console.log('\n\n📋 ALL POSITIONS:');
        try {
            const positionsResponse = await axios.get('http://localhost:5000/api/positions', { headers });
            const positions = positionsResponse.data.data || [];
            for (const position of positions) {
                console.log(`   🏷️  ${position.title} (${position.id}) - Department: ${position.departmentId}`);
            }
        } catch (posError) {
            console.log('❌ Could not fetch positions:', posError.response?.data?.message || posError.message);
        }

    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
    }
}

checkPositions().catch(console.error);
