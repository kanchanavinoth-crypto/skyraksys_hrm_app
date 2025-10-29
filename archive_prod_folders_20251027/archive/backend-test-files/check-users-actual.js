const db = require('./models');
const bcrypt = require('bcryptjs');

async function checkUsers() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Database connected successfully\n');
        
        // Get all users
        const users = await db.User.findAll({
            attributes: ['id', 'email', 'role', 'isActive', 'password'],
            include: [{
                model: db.Employee,
                as: 'employee',
                attributes: ['id', 'firstName', 'lastName']
            }]
        });
        
        console.log(`📊 Found ${users.length} users in database:\n`);
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Employee: ${user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'None'}`);
            console.log(`   Password hash starts with: ${user.password.substring(0, 20)}...`);
            console.log('');
        });
        
        // Test password for admin@company.com
        const adminUser = users.find(u => u.email === 'admin@company.com');
        if (adminUser) {
            console.log('🔍 Testing password for admin@company.com...');
            const testPassword = 'AdminPass123!';
            const isMatch = await bcrypt.compare(testPassword, adminUser.password);
            console.log(`Password "${testPassword}" matches: ${isMatch}`);
            
            // Test another common password
            const altPassword = 'admin123';
            const isAltMatch = await bcrypt.compare(altPassword, adminUser.password);
            console.log(`Password "${altPassword}" matches: ${isAltMatch}`);
        } else {
            console.log('❌ No admin@company.com user found!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUsers();
