const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Database connection using Sequelize for PostgreSQL
const sequelize = new Sequelize(
    process.env.DB_NAME || 'skyraksys_hrm',
    process.env.DB_USER || 'hrm_user', 
    process.env.DB_PASSWORD || 'hrm_password_2025',
    {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);

console.log('Checking timesheets in PostgreSQL database...');

async function checkTimesheets() {
    try {
        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Query all timesheets with employee info
        const [timesheets] = await sequelize.query(`
            SELECT 
                t.id,
                t."employeeId",
                t."workDate",
                t."hoursWorked",
                t.description,
                t.status,
                t."submittedAt",
                t."createdAt",
                e."firstName",
                e."lastName",
                e."employeeId" as emp_id,
                p.name as project_name,
                ta.name as task_name
            FROM timesheets t
            LEFT JOIN employees e ON t."employeeId" = e.id
            LEFT JOIN projects p ON t."projectId" = p.id
            LEFT JOIN tasks ta ON t."taskId" = ta.id
            WHERE t."deletedAt" IS NULL
            ORDER BY t."createdAt" DESC
            LIMIT 20
        `);

        console.log('\n=== Recent Timesheets ===');
        if (timesheets.length === 0) {
            console.log('No timesheets found in database');
        } else {
            timesheets.forEach(row => {
                console.log(`
ID: ${row.id}
Employee: ${row.firstName} ${row.lastName} (${row.emp_id})
Work Date: ${row.workDate}
Hours: ${row.hoursWorked}
Status: ${row.status}
Project: ${row.project_name || 'N/A'}
Task: ${row.task_name || 'N/A'}
Description: ${row.description}
Submitted: ${row.submittedAt}
Created: ${row.createdAt}
---`);
            });
        }

        // Query by status
        const [statusSummary] = await sequelize.query(`
            SELECT status, COUNT(*) as count 
            FROM timesheets 
            GROUP BY status
        `);

        console.log('\n=== Timesheet Status Summary ===');
        statusSummary.forEach(row => {
            console.log(`${row.status}: ${row.count} entries`);
        });

        // Query recent submissions (last 30 days)
        const [recentSubmissions] = await sequelize.query(`
            SELECT 
                t.id,
                t."employeeId",
                t."workDate",
                t."hoursWorked",
                t.status,
                t."submittedAt",
                e."firstName",
                e."lastName",
                e."employeeId" as emp_id
            FROM timesheets t
            LEFT JOIN employees e ON t."employeeId" = e.id
            WHERE t."submittedAt" >= NOW() - INTERVAL '30 days'
                AND t."deletedAt" IS NULL
            ORDER BY t."submittedAt" DESC
        `);

        console.log('\n=== Recent Submissions (Last 30 days) ===');
        if (recentSubmissions.length === 0) {
            console.log('No timesheets submitted in the last 30 days');
        } else {
            recentSubmissions.forEach(row => {
                console.log(`${row.first_name} ${row.last_name} (${row.emp_id}) - ${row.work_date} - ${row.hours_worked}h - ${row.status} - ${row.submitted_at}`);
            });
        }

        // Query all employees to help identify your employee ID
        const [employees] = await sequelize.query(`
            SELECT id, employee_id, first_name, last_name, email, department_id
            FROM employees
            ORDER BY employee_id
        `);

        console.log('\n=== All Employees ===');
        employees.forEach(emp => {
            console.log(`ID: ${emp.id}, Employee ID: ${emp.employee_id}, Name: ${emp.first_name} ${emp.last_name}, Email: ${emp.email}`);
        });

    } catch (error) {
        console.error('❌ Error checking timesheets:', error.message);
        
        // If connection fails, provide troubleshooting info
        if (error.name === 'ConnectionError' || error.name === 'ConnectionRefusedError') {
            console.log('\n🔧 Troubleshooting:');
            console.log('1. Make sure PostgreSQL is running');
            console.log('2. Check database credentials in .env file');
            console.log('3. Verify database exists and is accessible');
            console.log('4. Check if backend server is configured correctly');
        }
    } finally {
        await sequelize.close();
    }
}

checkTimesheets();
