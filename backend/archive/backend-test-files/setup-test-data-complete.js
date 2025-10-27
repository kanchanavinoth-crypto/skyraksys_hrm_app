/**
 * Setup test data for comprehensive testing
 */

const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'skyraksys_hrm_dev',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'admin',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    dialect: 'postgres',
    logging: false
  }
);

// Define models inline for this script
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'hr', 'manager', 'employee'), defaultValue: 'employee' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'users' });

const Department = sequelize.define('Department', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'departments' });

const Position = sequelize.define('Position', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  level: { type: DataTypes.STRING },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  departmentId: { type: DataTypes.UUID }
}, { tableName: 'positions' });

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employeeId: { type: DataTypes.STRING, unique: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  hireDate: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM('Active', 'Inactive', 'On-Leave', 'Terminated'), defaultValue: 'Active' },
  userId: { type: DataTypes.UUID },
  departmentId: { type: DataTypes.UUID },
  positionId: { type: DataTypes.UUID },
  managerId: { type: DataTypes.UUID }
}, { tableName: 'employees' });

async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Hash passwords
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const hrPassword = await bcrypt.hash('hr123', saltRounds);
    const employeePassword = await bcrypt.hash('employee123', saltRounds);
    
    // Create or update users
    console.log('👥 Creating/updating users...');
    
    const users = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@company.com',
        password: adminPassword,
        role: 'admin',
        isActive: true
      },
      {
        firstName: 'HR',
        lastName: 'Manager',
        email: 'hr@company.com',
        password: hrPassword,
        role: 'hr',
        isActive: true
      },
      {
        firstName: 'Test',
        lastName: 'Employee',
        email: 'employee@company.com',
        password: employeePassword,
        role: 'employee',
        isActive: true
      }
    ];
    
    for (const userData of users) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData
      });
      
      if (!created) {
        // Update existing user
        await user.update({
          password: userData.password,
          isActive: true
        });
        console.log(`✅ Updated user: ${userData.email}`);
      } else {
        console.log(`✅ Created user: ${userData.email}`);
      }
    }
    
    // Create departments if they don't exist
    console.log('🏢 Creating/updating departments...');
    
    const departments = [
      { 
        id: '81c2f4e3-7fb6-4f0c-8acd-326181d6ef73',
        name: 'Information Technology', 
        description: 'IT Department', 
        isActive: true 
      },
      { 
        id: 'b2c3d4e5-8f9a-4b5c-9d6e-2f3a4b5c6d7e',
        name: 'Human Resources', 
        description: 'HR Department', 
        isActive: true 
      },
      { 
        id: 'c3d4e5f6-9a0b-5c6d-ae7f-3a4b5c6d7e8f',
        name: 'Finance', 
        description: 'Finance Department', 
        isActive: true 
      }
    ];
    
    for (const deptData of departments) {
      const [dept, created] = await Department.findOrCreate({
        where: { id: deptData.id },
        defaults: deptData
      });
      
      if (created) {
        console.log(`✅ Created department: ${deptData.name}`);
      } else {
        console.log(`✅ Department exists: ${deptData.name}`);
      }
    }
    
    // Create positions if they don't exist
    console.log('💼 Creating/updating positions...');
    
    const positions = [
      {
        id: '0d2b8e5e-1cc9-4e5a-88f2-a5d8f9b3c7e1',
        title: 'Software Developer',
        description: 'Software Development Position',
        level: 'Junior',
        departmentId: '81c2f4e3-7fb6-4f0c-8acd-326181d6ef73',
        isActive: true
      },
      {
        id: '1e3c9f6f-2dd0-5b6b-99f3-b0e9d8c7f6e2',
        title: 'Senior Software Developer',
        description: 'Senior Software Development Position',
        level: 'Senior',
        departmentId: '81c2f4e3-7fb6-4f0c-8acd-326181d6ef73',
        isActive: true
      },
      {
        id: '2f4d0a7a-3ee1-6c7c-aaf4-c1fae9d8a7f3',
        title: 'HR Manager',
        description: 'Human Resources Manager',
        level: 'Manager',
        departmentId: 'b2c3d4e5-8f9a-4b5c-9d6e-2f3a4b5c6d7e',
        isActive: true
      }
    ];
    
    for (const posData of positions) {
      const [pos, created] = await Position.findOrCreate({
        where: { id: posData.id },
        defaults: posData
      });
      
      if (created) {
        console.log(`✅ Created position: ${posData.title}`);
      } else {
        console.log(`✅ Position exists: ${posData.title}`);
      }
    }
    
    console.log('\n🎉 Test data setup completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   Admin: admin@company.com / admin123');
    console.log('   HR: hr@company.com / hr123');
    console.log('   Employee: employee@company.com / employee123');
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await sequelize.close();
  }
}

setupTestData();
