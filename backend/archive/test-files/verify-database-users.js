const { User } = require('./backend/models');
const bcrypt = require('bcryptjs');

async function verifyDatabaseUsers() {
    console.log('🔍 Verifying Database Users and Passwords...');
    console.log('===========================================');
    
    try {
        const users = await User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'password']
        });
        
        console.log(`📊 Found ${users.length} users in database`);
        
        for (const user of users) {
            console.log(`\n👤 User: ${user.firstName} ${user.lastName}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🎭 Role: ${user.role}`);
            console.log(`   🔒 Password Hash: ${user.password.substring(0, 20)}...`);
            
            // Test password verification for known passwords
            const testPasswords = {
                'admin@company.com': 'Kx9mP7qR2nF8sA5t',
                'hr@company.com': 'Lw3nQ6xY8mD4vB7h',
                'employee@company.com': 'Mv4pS9wE2nR6kA8j',
                'manager@test.com': 'Qy8nR6wA2mS5kD7j'
            };
            
            if (testPasswords[user.email]) {
                const plainPassword = testPasswords[user.email];
                const isValid = await bcrypt.compare(plainPassword, user.password);
                console.log(`   🔑 Password "${plainPassword}" verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
                
                if (!isValid) {
                    console.log(`   🔄 Let's try with common passwords...`);
                    const commonPasswords = ['admin123', 'password123', 'admin', 'password'];
                    
                    for (const testPass of commonPasswords) {
                        const testResult = await bcrypt.compare(testPass, user.password);
                        if (testResult) {
                            console.log(`   ✅ FOUND: Password is actually "${testPass}"`);
                            break;
                        }
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('💥 Database verification failed:', error.message);
    }
}

verifyDatabaseUsers();
