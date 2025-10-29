require('dotenv').config();
const db = require('./models');

async function createProjectsAndTasks() {
    try {
        console.log('🔄 Creating sample projects and tasks...');

        // Get the first employee to use as manager
        const employees = await db.Employee.findAll({ limit: 1 });
        if (employees.length === 0) {
            console.log('❌ No employees found. Please create employees first.');
            return;
        }
        const managerId = employees[0].id;

        // Create projects
        const projects = await db.Project.bulkCreate([
            {
                name: 'Website Redesign',
                description: 'Complete redesign of company website',
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-06-30'),
                status: 'Active',
                clientName: 'Internal',
                managerId: managerId,
                isActive: true
            },
            {
                name: 'Mobile App Development',
                description: 'Develop mobile application for customer portal',
                startDate: new Date('2025-02-01'),
                endDate: new Date('2025-08-31'),
                status: 'Active',
                clientName: 'TechCorp',
                managerId: managerId,
                isActive: true
            },
            {
                name: 'Data Migration Project',
                description: 'Migrate legacy data to new system',
                startDate: new Date('2025-03-01'),
                endDate: new Date('2025-05-31'),
                status: 'Planning',
                clientName: 'DataSys Inc',
                managerId: managerId,
                isActive: true
            }
        ], { returning: true });

        console.log(`✅ Created ${projects.length} projects`);

        // Create tasks for each project
        const tasks = [];
        
        // Website Redesign tasks
        tasks.push(
            {
                name: 'UI/UX Design',
                description: 'Create wireframes and mockups',
                estimatedHours: 40,
                actualHours: 0,
                status: 'In Progress',
                priority: 'High',
                projectId: projects[0].id,
                assignedTo: managerId,
                availableToAll: false,
                isActive: true
            },
            {
                name: 'Frontend Development',
                description: 'Implement responsive frontend',
                estimatedHours: 80,
                actualHours: 0,
                status: 'Not Started',
                priority: 'High',
                projectId: projects[0].id,
                assignedTo: managerId,
                availableToAll: true,
                isActive: true
            },
            {
                name: 'Backend Integration',
                description: 'Connect frontend to backend APIs',
                estimatedHours: 60,
                actualHours: 0,
                status: 'Not Started',
                priority: 'Medium',
                projectId: projects[0].id,
                assignedTo: managerId,
                availableToAll: true,
                isActive: true
            }
        );

        // Mobile App tasks
        tasks.push(
            {
                name: 'App Architecture',
                description: 'Design mobile app architecture',
                estimatedHours: 30,
                actualHours: 30,
                status: 'Completed',
                priority: 'High',
                projectId: projects[1].id,
                assignedTo: managerId,
                availableToAll: false,
                isActive: true
            },
            {
                name: 'iOS Development',
                description: 'Develop iOS version of the app',
                estimatedHours: 120,
                actualHours: 25,
                status: 'In Progress',
                priority: 'High',
                projectId: projects[1].id,
                assignedTo: managerId,
                availableToAll: true,
                isActive: true
            },
            {
                name: 'Android Development',
                description: 'Develop Android version of the app',
                estimatedHours: 120,
                actualHours: 15,
                status: 'In Progress',
                priority: 'High',
                projectId: projects[1].id,
                assignedTo: managerId,
                availableToAll: true,
                isActive: true
            }
        );

        // Data Migration tasks
        tasks.push(
            {
                name: 'Data Analysis',
                description: 'Analyze existing data structure',
                estimatedHours: 50,
                actualHours: 0,
                status: 'Not Started',
                priority: 'Medium',
                projectId: projects[2].id,
                assignedTo: managerId,
                availableToAll: true,
                isActive: true
            },
            {
                name: 'Migration Scripts',
                description: 'Develop data migration scripts',
                estimatedHours: 80,
                actualHours: 0,
                status: 'Not Started',
                priority: 'High',
                projectId: projects[2].id,
                assignedTo: managerId,
                availableToAll: true,
                isActive: true
            },
            {
                name: 'Testing & Validation',
                description: 'Test migrated data for accuracy',
                estimatedHours: 40,
                actualHours: 0,
                status: 'On Hold',
                priority: 'High',
                projectId: projects[2].id,
                assignedTo: managerId,
                availableToAll: false,
                isActive: true
            }
        );

        // Create all tasks
        const createdTasks = await db.Task.bulkCreate(tasks, { returning: true });
        console.log(`✅ Created ${createdTasks.length} tasks`);

        console.log('🎉 Sample projects and tasks created successfully!');
        console.log('\nProjects created:');
        projects.forEach((project, index) => {
            console.log(`  ${index + 1}. ${project.name} (${project.status})`);
        });

        console.log('\nTasks created:');
        createdTasks.forEach((task, index) => {
            console.log(`  ${index + 1}. ${task.name} (${task.status}) - ${task.estimatedHours}h estimated`);
        });

    } catch (error) {
        console.error('❌ Error creating projects and tasks:', error);
    } finally {
        process.exit(0);
    }
}

createProjectsAndTasks();