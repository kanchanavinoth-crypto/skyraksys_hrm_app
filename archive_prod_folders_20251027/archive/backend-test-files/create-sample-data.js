const { Client } = require('pg');

async function createSampleData() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    database: 'skyraksys_hrm',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Get first employee ID for manager assignment
    const employeeResult = await client.query('SELECT id FROM employees LIMIT 1');
    if (employeeResult.rows.length === 0) {
      console.log('No employees found. Please create employees first.');
      return;
    }
    const managerId = employeeResult.rows[0].id;

    // Create sample projects
    const projects = [
      { name: 'Project Alpha', description: 'Frontend development project', client: 'Tech Corp' },
      { name: 'Project Beta', description: 'Backend API development', client: 'Digital Solutions' },
      { name: 'Project Gamma', description: 'Mobile application', client: 'Mobile Inc' },
      { name: 'Internal Tasks', description: 'Internal company tasks', client: 'Internal' },
      { name: 'Training', description: 'Employee training', client: 'Internal' },
      { name: 'Meetings', description: 'Team meetings', client: 'Internal' }
    ];

    const projectIds = [];
    for (const project of projects) {
      try {
        const result = await client.query(`
          INSERT INTO projects (id, name, description, "clientName", status, "managerId", "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, 'Active', $4, true, NOW(), NOW())
          RETURNING id, name
        `, [project.name, project.description, project.client, managerId]);
        
        projectIds.push(result.rows[0].id);
        console.log(`Created project: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      } catch (error) {
        if (error.code === '23505') {
          // Duplicate key error, get existing project
          const existing = await client.query('SELECT id, name FROM projects WHERE name = $1', [project.name]);
          if (existing.rows.length > 0) {
            projectIds.push(existing.rows[0].id);
            console.log(`Found existing project: ${existing.rows[0].name} (ID: ${existing.rows[0].id})`);
          }
        } else {
          throw error;
        }
      }
    }

    // Create sample tasks for each project
    const taskTypes = [
      'Frontend Development',
      'Backend Development', 
      'Testing',
      'Code Review',
      'Documentation',
      'Meeting',
      'Training',
      'Bug Fixing',
      'Research'
    ];

    for (let i = 0; i < projectIds.length; i++) {
      const projectId = projectIds[i];
      const projectName = projects[i].name;
      
      for (const taskType of taskTypes) {
        try {
          await client.query(`
            INSERT INTO tasks (id, name, description, "estimatedHours", status, priority, "projectId", "assignedTo", "isActive", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, 40, 'Not Started', 'Medium', $3, $4, true, NOW(), NOW())
          `, [taskType, `${taskType} for ${projectName}`, projectId, managerId]);
        } catch (error) {
          if (error.code !== '23505') { // Ignore duplicate key errors
            throw error;
          }
        }
      }
      console.log(`Created tasks for project: ${projectName}`);
    }

    // Get counts
    const projectCount = await client.query('SELECT COUNT(*) FROM projects');
    const taskCount = await client.query('SELECT COUNT(*) FROM tasks');
    
    console.log('\nSample data created successfully!');
    console.log(`Total projects: ${projectCount.rows[0].count}`);
    console.log(`Total tasks: ${taskCount.rows[0].count}`);

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await client.end();
  }
}

createSampleData();
