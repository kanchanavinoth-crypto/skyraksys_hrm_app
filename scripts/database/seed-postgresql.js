const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });

async function seedPostgreSQLDatabase() {
    console.log('🌱 Seeding PostgreSQL Database with Demo Data\n');
    
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'skyraksys_hrm',
        user: process.env.DB_USER || 'hrm_admin',
        password: process.env.DB_PASSWORD || 'hrm_secure_2024'
    });
    
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');
        
        // Generate UUIDs for relationships
        const uuid = () => require('crypto').randomUUID();
        
        // Create departments
        console.log('🏢 Creating departments...');
        const deptHR = uuid();
        const deptIT = uuid();
        
        await client.query(`
            INSERT INTO departments (id, name, description, "isActive", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, NOW(), NOW()),
                   ($5, $6, $7, $8, NOW(), NOW())
        `, [deptHR, 'Human Resources', 'Manages employee relations and policies', true,
            deptIT, 'Information Technology', 'Manages technology infrastructure', true]);
        
        // Create positions
        console.log('💼 Creating positions...');
        const posAdmin = uuid();
        const posHR = uuid();
        const posDev = uuid();
        
        await client.query(`
            INSERT INTO positions (id, title, description, level, "isActive", "createdAt", "updatedAt", "departmentId")
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6),
                   ($7, $8, $9, $10, $11, NOW(), NOW(), $12),
                   ($13, $14, $15, $16, $17, NOW(), NOW(), $18)
        `, [posAdmin, 'System Administrator', 'Manages system operations', 'Senior', true, deptIT,
            posHR, 'HR Manager', 'Manages human resources', 'Manager', true, deptHR,
            posDev, 'Software Developer', 'Develops software applications', 'Mid', true, deptIT]);
        
        // Create leave types
        console.log('🏖️ Creating leave types...');
        const leaveAnnual = uuid();
        const leaveSick = uuid();
        const leavePersonal = uuid();
        
        await client.query(`
            INSERT INTO leave_types (id, name, description, "maxDaysPerYear", "carryForward", "maxCarryForwardDays", "isActive", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()),
                   ($8, $9, $10, $11, $12, $13, $14, NOW(), NOW()),
                   ($15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
        `, [leaveAnnual, 'Annual Leave', 'Yearly vacation leave', 20, true, 5, true,
            leaveSick, 'Sick Leave', 'Medical leave', 12, false, 0, true,
            leavePersonal, 'Personal Leave', 'Personal time off', 5, false, 0, true]);
        
        // Create users with hashed passwords
        console.log('👥 Creating users...');
        const userAdmin = uuid();
        const userHR = uuid();
        const userEmployee = uuid();
        
        const adminPassword = await bcrypt.hash('Kx9mP7qR2nF8sA5t', 12);
        const hrPassword = await bcrypt.hash('Lw3nQ6xY8mD4vB7h', 12);
        const empPassword = await bcrypt.hash('Mv4pS9wE2nR6kA8j', 12);
        
        await client.query(`
            INSERT INTO users (id, "firstName", "lastName", email, password, role, "isActive", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()),
                   ($8, $9, $10, $11, $12, $13, $14, NOW(), NOW()),
                   ($15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
        `, [userAdmin, 'System', 'Administrator', 'admin@company.com', adminPassword, 'admin', true,
            userHR, 'HR', 'Manager', 'hr@company.com', hrPassword, 'hr', true,
            userEmployee, 'John', 'Employee', 'employee@company.com', empPassword, 'employee', true]);
        
        // Create employees
        console.log('👤 Creating employees...');
        const empAdmin = uuid();
        const empHR = uuid();
        const empDev = uuid();
        
        await client.query(`
            INSERT INTO employees (id, "employeeId", "firstName", "lastName", email, "hireDate", status, nationality, "employmentType", "probationPeriod", "noticePeriod", "createdAt", "updatedAt", "userId", "departmentId", "positionId")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW(), $12, $13, $14),
                   ($15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), NOW(), $26, $27, $28),
                   ($29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, NOW(), NOW(), $40, $41, $42)
        `, [empAdmin, 'EMP001', 'System', 'Administrator', 'admin@company.com', '2024-01-01', 'Active', 'Indian', 'Full-time', 6, 30, userAdmin, deptIT, posAdmin,
            empHR, 'EMP002', 'HR', 'Manager', 'hr@company.com', '2024-01-15', 'Active', 'Indian', 'Full-time', 6, 30, userHR, deptHR, posHR,
            empDev, 'EMP003', 'John', 'Employee', 'employee@company.com', '2024-02-01', 'Active', 'Indian', 'Full-time', 6, 30, userEmployee, deptIT, posDev]);
        
        // Create leave balances for employees
        console.log('📊 Creating leave balances...');
        const year = new Date().getFullYear();
        
        for (const empId of [empAdmin, empHR, empDev]) {
            for (const leaveTypeId of [leaveAnnual, leaveSick, leavePersonal]) {
                await client.query(`
                    INSERT INTO leave_balances (id, year, "totalAccrued", "totalTaken", "totalPending", balance, "carryForward", "createdAt", "updatedAt", "employeeId", "leaveTypeId")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9)
                `, [uuid(), year, 20, 0, 0, 20, 0, empId, leaveTypeId]);
            }
        }
        
        console.log('\n✅ Database seeded successfully!');
        console.log('\n📧 Login credentials:');
        console.log('   Admin: admin@company.com / Kx9mP7qR2nF8sA5t');
        console.log('   HR: hr@company.com / Lw3nQ6xY8mD4vB7h');
        console.log('   Employee: employee@company.com / Mv4pS9wE2nR6kA8j');
        
    } catch (error) {
        console.log('❌ Seeding failed:', error.message);
    } finally {
        await client.end();
    }
}

seedPostgreSQLDatabase();
