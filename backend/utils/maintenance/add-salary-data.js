const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'skyraksys_hrm',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

async function addSalaryData() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Get first active employee
    const [employees] = await sequelize.query(`
      SELECT id, employeeId, firstName, lastName, email
      FROM employees
      WHERE status = 'Active'
      LIMIT 3
    `);

    if (employees.length === 0) {
      console.log('No active employees found');
      return;
    }

    // Sample salary structure
    const salaryStructure = {
      basicSalary: 50000,
      houseRentAllowance: 20000,
      transportAllowance: 5000,
      medicalAllowance: 2000,
      specialAllowance: 3000,
      providentFund: 5000,
      professionalTax: 200,
      incomeTax: 5000,
      currency: 'INR',
      payFrequency: 'Monthly',
      effectiveDate: '2024-01-01',
      ctc: 80000,
      grossSalary: 80000,
      netSalary: 69800
    };

    console.log('\nAdding salary data to employees:');
    
    for (const emp of employees) {
      const [result] = await sequelize.query(`
        UPDATE employees
        SET salary = :salary
        WHERE id = :id
      `, {
        replacements: {
          salary: JSON.stringify(salaryStructure),
          id: emp.id
        }
      });

      console.log(`✓ Added salary data to ${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
    }

    console.log('\n✓ Salary data added successfully!');
    console.log('\nSalary structure:');
    console.log(JSON.stringify(salaryStructure, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

addSalaryData();
