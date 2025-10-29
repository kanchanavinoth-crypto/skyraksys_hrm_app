require('dotenv').config();
const db = require('./models');

async function createSampleData() {
  try {
    console.log('🔄 Creating sample projects and tasks...');

    // Get the first employee (admin) to be project manager
    const admin = await db.Employee.findOne({ where: { employeeId: 'HRM001' } });
    const employee = await db.Employee.findOne({ where: { employeeId: 'HRM002' } });
    
    if (!admin) {
      console.log('❌ Admin employee not found');
      return;
    }

    // Create sample projects
    const projects = await db.Project.bulkCreate([
      {
        id: '1',
        name: 'Website Redesign',
        description: 'Complete redesign of company website with modern UI/UX',
        startDate: '2025-01-15',
        endDate: '2025-06-30',
        status: 'Active',
        clientName: 'Internal Project',
        isActive: true,
        managerId: admin.id
      },
      {
        id: '2', 
        name: 'Mobile App Development',
        description: 'Development of mobile application for employee self-service',
        startDate: '2025-03-01',
        endDate: '2025-12-31',
        status: 'Active',
        clientName: 'Internal Project',
        isActive: true,
        managerId: admin.id
      },
      {
        id: '3',
        name: 'Database Migration',
        description: 'Migration from legacy database to PostgreSQL',
        startDate: '2025-02-01',
        endDate: '2025-05-31',
        status: 'Active',
        clientName: 'Internal Project',
        isActive: true,
        managerId: admin.id
      },
      {
        id: '4',
        name: 'Security Audit',
        description: 'Comprehensive security audit and implementation',
        startDate: '2025-04-01',
        endDate: '2025-08-31',
        status: 'Planning',
        clientName: 'External Security Firm',
        isActive: true,
        managerId: admin.id
      }
    ]);

    console.log('✅ Created projects:', projects.length);

    // Create sample tasks
    const tasks = await db.Task.bulkCreate([
      // Website Redesign Tasks
      {
        id: '1',
        name: 'UI/UX Design',
        description: 'Create wireframes and mockups for new website design',
        estimatedHours: 120,
        actualHours: 0,
        status: 'In Progress',
        priority: 'High',
        availableToAll: true,
        isActive: true,
        projectId: '1',
        assignedTo: employee?.id || admin.id
      },
      {
        id: '2',
        name: 'Frontend Development',
        description: 'Implement responsive frontend using React',
        estimatedHours: 200,
        actualHours: 45,
        status: 'In Progress',
        priority: 'High',
        availableToAll: true,
        isActive: true,
        projectId: '1',
        assignedTo: admin.id
      },
      {
        id: '3',
        name: 'Backend API Development',
        description: 'Develop REST APIs for website functionality',
        estimatedHours: 150,
        actualHours: 20,
        status: 'Todo',
        priority: 'Medium',
        availableToAll: true,
        isActive: true,
        projectId: '1',
        assignedTo: admin.id
      },

      // Mobile App Tasks
      {
        id: '4',
        name: 'Mobile App Architecture',
        description: 'Design mobile app architecture and tech stack',
        estimatedHours: 80,
        actualHours: 0,
        status: 'Todo',
        priority: 'High',
        availableToAll: true,
        isActive: true,
        projectId: '2',
        assignedTo: admin.id
      },
      {
        id: '5',
        name: 'Employee Dashboard',
        description: 'Develop employee dashboard for mobile app',
        estimatedHours: 100,
        actualHours: 0,
        status: 'Todo',
        priority: 'Medium',
        availableToAll: true,
        isActive: true,
        projectId: '2',
        assignedTo: employee?.id || admin.id
      },

      // Database Migration Tasks
      {
        id: '6',
        name: 'Data Analysis',
        description: 'Analyze current database structure and data',
        estimatedHours: 60,
        actualHours: 15,
        status: 'In Progress',
        priority: 'High',
        availableToAll: false,
        isActive: true,
        projectId: '3',
        assignedTo: admin.id
      },
      {
        id: '7',
        name: 'Migration Scripts',
        description: 'Write scripts for data migration to PostgreSQL',
        estimatedHours: 90,
        actualHours: 0,
        status: 'Todo',
        priority: 'High',
        availableToAll: false,
        isActive: true,
        projectId: '3',
        assignedTo: admin.id
      },

      // Security Audit Tasks
      {
        id: '8',
        name: 'Security Assessment',
        description: 'Initial security assessment and vulnerability scan',
        estimatedHours: 40,
        actualHours: 0,
        status: 'Todo',
        priority: 'High',
        availableToAll: false,
        isActive: true,
        projectId: '4',
        assignedTo: admin.id
      },
      {
        id: '9',
        name: 'Penetration Testing',
        description: 'Conduct penetration testing on application',
        estimatedHours: 60,
        actualHours: 0,
        status: 'Todo',
        priority: 'Medium',
        availableToAll: false,
        isActive: true,
        projectId: '4',
        assignedTo: employee?.id || admin.id
      },

      // General tasks available to all
      {
        id: '10',
        name: 'Documentation',
        description: 'General documentation tasks for various projects',
        estimatedHours: 40,
        actualHours: 5,
        status: 'In Progress',
        priority: 'Low',
        availableToAll: true,
        isActive: true,
        projectId: '1',
        assignedTo: null
      },
      {
        id: '11',
        name: 'Code Review',
        description: 'Code review and quality assurance tasks',
        estimatedHours: 30,
        actualHours: 8,
        status: 'In Progress',
        priority: 'Medium',
        availableToAll: true,
        isActive: true,
        projectId: '2',
        assignedTo: null
      },
      {
        id: '12',
        name: 'Testing',
        description: 'General testing tasks for applications',
        estimatedHours: 50,
        actualHours: 12,
        status: 'In Progress',
        priority: 'Medium',
        availableToAll: true,
        isActive: true,
        projectId: '1',
        assignedTo: null
      }
    ]);

    console.log('✅ Created tasks:', tasks.length);
    console.log('📊 Summary:');
    console.log(`   - ${projects.length} projects created`);
    console.log(`   - ${tasks.length} tasks created`);
    console.log('   - Tasks available to all employees: Documentation, Code Review, Testing');
    console.log('   - Projects: Website Redesign, Mobile App, Database Migration, Security Audit');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    process.exit();
  }
}

createSampleData();