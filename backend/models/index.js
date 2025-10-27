const { Sequelize } = require('sequelize');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

// PostgreSQL-only configuration - SQLite permanently disabled
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'skyraksys_hrm',
  username: process.env.DB_USER || 'hrm_admin',
  password: process.env.DB_PASSWORD || 'hrm_secure_2024',
  logging: env === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 2,
    acquire: 60000,
    idle: 30000
  },
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Test PostgreSQL connection
sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL database connection established successfully'))
  .catch(err => {
    console.error('❌ PostgreSQL connection failed:', err);
    console.error('💡 Please ensure PostgreSQL is running and credentials are correct');
    process.exit(1); // Exit if PostgreSQL connection fails
  });

const db = {};

// Import all models (restored to working version)
db.User = require('./user.model')(sequelize, Sequelize);
db.Employee = require('./employee.model')(sequelize, Sequelize);
db.Department = require('./department.model')(sequelize, Sequelize);
db.Position = require('./position.model')(sequelize, Sequelize);
db.LeaveRequest = require('./leave-request.model')(sequelize, Sequelize);
db.LeaveBalance = require('./leave-balance.model')(sequelize, Sequelize);
db.LeaveType = require('./leave-type.model')(sequelize, Sequelize);
db.Timesheet = require('./timesheet-weekly.model')(sequelize, Sequelize);
db.Project = require('./project.model')(sequelize, Sequelize);
db.Task = require('./task.model')(sequelize, Sequelize);
db.Payroll = require('./payroll.model')(sequelize, Sequelize);
db.PayrollComponent = require('./payroll-component.model')(sequelize, Sequelize);
db.PayrollData = require('./payrollData.model')(sequelize, Sequelize);
db.SalaryStructure = require('./salary-structure.model')(sequelize, Sequelize);
db.PayslipTemplate = require('./payslip-template.model')(sequelize, Sequelize);
db.Payslip = require('./payslip.model')(sequelize, Sequelize);
db.RefreshToken = require('./refresh-token.model')(sequelize, Sequelize);
// db.EmployeeReview = require('./employee-review.model')(sequelize, Sequelize); // Temporarily disabled

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
