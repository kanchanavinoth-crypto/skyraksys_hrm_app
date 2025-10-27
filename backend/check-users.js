const { User } = require('./models');
const { sequelize } = require('./config/database');

async function checkUsers() {
    try {
        await sequelize.authenticate();
        console.log('🔌 Database connected');
        
        const users = await User.findAll({
            attributes: ['id', 'email', 'role', 'isActive'],
            limit: 10
        });
        
        console.log('\n👥 Available users:');
        users.forEach(user => {
            console.log(`  📧 ${user.email} | Role: ${user.role} | Active: ${user.isActive}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUsers();