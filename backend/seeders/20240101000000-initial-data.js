const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create departments
    const departmentIds = {
      hr: uuidv4(),
      engineering: uuidv4(),
      sales: uuidv4(),
      marketing: uuidv4(),
      finance: uuidv4()
    };

    await queryInterface.bulkInsert('departments', [
      {
        id: departmentIds.hr,
        name: 'Human Resources',
        description: 'Employee management and HR services',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: departmentIds.engineering,
        name: 'Engineering',
        description: 'Software development and engineering',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: departmentIds.sales,
        name: 'Sales',
        description: 'Sales and business development',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: departmentIds.marketing,
        name: 'Marketing',
        description: 'Marketing and brand management',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: departmentIds.finance,
        name: 'Finance',
        description: 'Financial planning and accounting',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create positions
    const positionIds = {
      hrManager: uuidv4(),
      hrExecutive: uuidv4(),
      softwareEngineer: uuidv4(),
      seniorSoftwareEngineer: uuidv4(),
      teamLead: uuidv4(),
      salesExecutive: uuidv4(),
      salesManager: uuidv4(),
      marketingExecutive: uuidv4(),
      marketingManager: uuidv4(),
      accountant: uuidv4(),
      financeManager: uuidv4()
    };

    await queryInterface.bulkInsert('positions', [
      // HR positions
      {
        id: positionIds.hrManager,
        title: 'HR Manager',
        description: 'Manages HR operations and policies',
        level: 'Manager',
        departmentId: departmentIds.hr,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: positionIds.hrExecutive,
        title: 'HR Executive',
        description: 'Handles HR administrative tasks',
        level: 'Mid',
        departmentId: departmentIds.hr,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Engineering positions
      {
        id: positionIds.softwareEngineer,
        title: 'Software Engineer',
        description: 'Develops and maintains software applications',
        level: 'Mid',
        departmentId: departmentIds.engineering,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: positionIds.seniorSoftwareEngineer,
        title: 'Senior Software Engineer',
        description: 'Senior level software development',
        level: 'Senior',
        departmentId: departmentIds.engineering,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: positionIds.teamLead,
        title: 'Team Lead',
        description: 'Leads engineering teams',
        level: 'Lead',
        departmentId: departmentIds.engineering,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Sales positions
      {
        id: positionIds.salesExecutive,
        title: 'Sales Executive',
        description: 'Handles sales activities',
        level: 'Mid',
        departmentId: departmentIds.sales,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: positionIds.salesManager,
        title: 'Sales Manager',
        description: 'Manages sales team and operations',
        level: 'Manager',
        departmentId: departmentIds.sales,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Marketing positions
      {
        id: positionIds.marketingExecutive,
        title: 'Marketing Executive',
        description: 'Handles marketing campaigns',
        level: 'Mid',
        departmentId: departmentIds.marketing,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: positionIds.marketingManager,
        title: 'Marketing Manager',
        description: 'Manages marketing strategies',
        level: 'Manager',
        departmentId: departmentIds.marketing,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Finance positions
      {
        id: positionIds.accountant,
        title: 'Accountant',
        description: 'Handles accounting and bookkeeping',
        level: 'Mid',
        departmentId: departmentIds.finance,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: positionIds.financeManager,
        title: 'Finance Manager',
        description: 'Manages financial operations',
        level: 'Manager',
        departmentId: departmentIds.finance,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create users
    const userIds = {
      admin: uuidv4(),
      hrManager: uuidv4(),
      teamLead: uuidv4(),
      employee1: uuidv4(),
      employee2: uuidv4()
    };

    await queryInterface.bulkInsert('users', [
      {
        id: userIds.admin,
        email: 'admin@skyraksys.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds.hrManager,
        email: 'hr@skyraksys.com',
        password: hashedPassword,
        role: 'hr',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds.teamLead,
        email: 'lead@skyraksys.com',
        password: hashedPassword,
        role: 'manager',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds.employee1,
        email: 'employee1@skyraksys.com',
        password: hashedPassword,
        role: 'employee',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userIds.employee2,
        email: 'employee2@skyraksys.com',
        password: hashedPassword,
        role: 'employee',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create employees
    const employeeIds = {
      admin: uuidv4(),
      hrManager: uuidv4(),
      teamLead: uuidv4(),
      employee1: uuidv4(),
      employee2: uuidv4()
    };

    await queryInterface.bulkInsert('employees', [
      {
        id: employeeIds.admin,
        employeeId: 'EMP0001',
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@skyraksys.com',
        phone: '9876543210',
        hireDate: '2024-01-01',
        status: 'Active',
        departmentId: departmentIds.hr,
        positionId: positionIds.hrManager,
        userId: userIds.admin,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: employeeIds.hrManager,
        employeeId: 'EMP0002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'hr@skyraksys.com',
        phone: '9876543211',
        hireDate: '2024-01-01',
        status: 'Active',
        departmentId: departmentIds.hr,
        positionId: positionIds.hrManager,
        userId: userIds.hrManager,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: employeeIds.teamLead,
        employeeId: 'EMP0003',
        firstName: 'John',
        lastName: 'Smith',
        email: 'lead@skyraksys.com',
        phone: '9876543212',
        hireDate: '2024-01-01',
        status: 'Active',
        departmentId: departmentIds.engineering,
        positionId: positionIds.teamLead,
        userId: userIds.teamLead,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: employeeIds.employee1,
        employeeId: 'EMP0004',
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'employee1@skyraksys.com',
        phone: '9876543213',
        hireDate: '2024-01-01',
        status: 'Active',
        departmentId: departmentIds.engineering,
        positionId: positionIds.softwareEngineer,
        managerId: employeeIds.teamLead,
        userId: userIds.employee1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: employeeIds.employee2,
        employeeId: 'EMP0005',
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'employee2@skyraksys.com',
        phone: '9876543214',
        hireDate: '2024-01-01',
        status: 'Active',
        departmentId: departmentIds.engineering,
        positionId: positionIds.softwareEngineer,
        managerId: employeeIds.teamLead,
        userId: userIds.employee2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create leave types
    const leaveTypeIds = {
      sick: uuidv4(),
      casual: uuidv4(),
      annual: uuidv4(),
      maternity: uuidv4(),
      paternity: uuidv4()
    };

    await queryInterface.bulkInsert('leave_types', [
      {
        id: leaveTypeIds.sick,
        name: 'Sick Leave',
        description: 'Leave for medical reasons',
        maxDaysPerYear: 12,
        carryForward: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: leaveTypeIds.casual,
        name: 'Casual Leave',
        description: 'Leave for personal reasons',
        maxDaysPerYear: 12,
        carryForward: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: leaveTypeIds.annual,
        name: 'Annual Leave',
        description: 'Yearly vacation leave',
        maxDaysPerYear: 21,
        carryForward: true,
        maxCarryForwardDays: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: leaveTypeIds.maternity,
        name: 'Maternity Leave',
        description: 'Leave for maternity',
        maxDaysPerYear: 180,
        carryForward: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: leaveTypeIds.paternity,
        name: 'Paternity Leave',
        description: 'Leave for paternity',
        maxDaysPerYear: 15,
        carryForward: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create leave balances for all employees
    const currentYear = new Date().getFullYear();
    const leaveBalances = [];

    Object.values(employeeIds).forEach(employeeId => {
      Object.entries(leaveTypeIds).forEach(([leaveTypeName, leaveTypeId]) => {
        const maxDays = leaveTypeName === 'sick' ? 12 : 
                       leaveTypeName === 'casual' ? 12 : 
                       leaveTypeName === 'annual' ? 21 : 
                       leaveTypeName === 'maternity' ? 180 : 15;
        
        leaveBalances.push({
          id: uuidv4(),
          employeeId,
          leaveTypeId,
          year: currentYear,
          totalAccrued: maxDays,
          totalTaken: 0,
          totalPending: 0,
          balance: maxDays,
          carryForward: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    });

    await queryInterface.bulkInsert('leave_balances', leaveBalances);

    // Create projects
    const projectIds = {
      hrm: uuidv4(),
      ecommerce: uuidv4(),
      mobile: uuidv4()
    };

    await queryInterface.bulkInsert('projects', [
      {
        id: projectIds.hrm,
        name: 'HRM System',
        description: 'Human Resource Management System Development',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'Active',
        managerId: employeeIds.teamLead,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: projectIds.ecommerce,
        name: 'E-commerce Platform',
        description: 'Online shopping platform development',
        startDate: '2024-02-01',
        endDate: '2024-08-31',
        status: 'Active',
        managerId: employeeIds.teamLead,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: projectIds.mobile,
        name: 'Mobile App',
        description: 'Mobile application development',
        startDate: '2024-03-01',
        endDate: '2024-10-31',
        status: 'Planning',
        managerId: employeeIds.teamLead,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create tasks
    await queryInterface.bulkInsert('tasks', [
      {
        id: uuidv4(),
        name: 'Backend Development',
        description: 'Develop REST API backend',
        estimatedHours: 120,
        status: 'In Progress',
        priority: 'High',
        projectId: projectIds.hrm,
        assignedTo: employeeIds.employee1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Frontend Development',
        description: 'Develop React frontend',
        estimatedHours: 80,
        status: 'In Progress',
        priority: 'High',
        projectId: projectIds.hrm,
        assignedTo: employeeIds.employee2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Database Design',
        description: 'Design database schema',
        estimatedHours: 40,
        status: 'Completed',
        priority: 'High',
        projectId: projectIds.hrm,
        assignedTo: employeeIds.teamLead,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create salary structures
    await queryInterface.bulkInsert('salary_structures', [
      {
        id: uuidv4(),
        employeeId: employeeIds.admin,
        basicSalary: 100000,
        hra: 40000,
        allowances: 20000,
        pfContribution: 12000,
        tds: 15000,
        professionalTax: 2400,
        otherDeductions: 0,
        currency: 'INR',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        employeeId: employeeIds.hrManager,
        basicSalary: 80000,
        hra: 32000,
        allowances: 15000,
        pfContribution: 9600,
        tds: 12000,
        professionalTax: 2400,
        otherDeductions: 0,
        currency: 'INR',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        employeeId: employeeIds.teamLead,
        basicSalary: 90000,
        hra: 36000,
        allowances: 18000,
        pfContribution: 10800,
        tds: 13500,
        professionalTax: 2400,
        otherDeductions: 0,
        currency: 'INR',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        employeeId: employeeIds.employee1,
        basicSalary: 60000,
        hra: 24000,
        allowances: 12000,
        pfContribution: 7200,
        tds: 8000,
        professionalTax: 2400,
        otherDeductions: 0,
        currency: 'INR',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        employeeId: employeeIds.employee2,
        basicSalary: 55000,
        hra: 22000,
        allowances: 11000,
        pfContribution: 6600,
        tds: 7500,
        professionalTax: 2400,
        otherDeductions: 0,
        currency: 'INR',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    console.log('Initial data seeded successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('salary_structures', null, {});
    await queryInterface.bulkDelete('tasks', null, {});
    await queryInterface.bulkDelete('projects', null, {});
    await queryInterface.bulkDelete('leave_balances', null, {});
    await queryInterface.bulkDelete('leave_types', null, {});
    await queryInterface.bulkDelete('employees', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('positions', null, {});
    await queryInterface.bulkDelete('departments', null, {});
  }
};
