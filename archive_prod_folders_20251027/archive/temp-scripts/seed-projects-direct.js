const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

async function seedProjects() {
  console.log('🌱 SEEDING PROJECTS DIRECTLY TO DATABASE');
  console.log('='*50);

  return new Promise((resolve, reject) => {
    // Open the database
    const db = new sqlite3.Database('database.sqlite', (err) => {
      if (err) {
        console.error('❌ Cannot open database:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    const projects = [
      { name: 'HRM System Development', description: 'Main HRM system development and enhancement' },
      { name: 'Frontend Development', description: 'React-based user interface development' },
      { name: 'Backend API Development', description: 'REST API and database development' },
      { name: 'Business Process Automation', description: 'HR workflow automation and optimization' },
      { name: 'Quality Assurance', description: 'Testing and quality assurance activities' }
    ];

    // First check if projects table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'", (err, row) => {
      if (err) {
        console.error('❌ Error checking tables:', err.message);
        reject(err);
        return;
      }

      if (!row) {
        console.log('⚠️ Projects table does not exist. Creating table...');
        
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'active',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `;

        db.run(createTableSQL, (err) => {
          if (err) {
            console.error('❌ Error creating projects table:', err.message);
            reject(err);
            return;
          }
          console.log('✅ Projects table created successfully');
          insertProjects();
        });
      } else {
        console.log('✅ Projects table exists');
        insertProjects();
      }
    });

    function insertProjects() {
      const insertSQL = `INSERT INTO projects (id, name, description, status, createdAt, updatedAt) 
                        VALUES (?, ?, ?, 'active', datetime('now'), datetime('now'))`;

      let insertedCount = 0;
      let errors = [];

      projects.forEach((project, index) => {
        const projectId = uuidv4();
        
        db.run(insertSQL, [projectId, project.name, project.description], function(err) {
          if (err) {
            console.log(`❌ Error inserting ${project.name}:`, err.message);
            errors.push(err.message);
          } else {
            console.log(`✅ Inserted project: ${project.name} (ID: ${projectId})`);
            insertedCount++;
          }

          // Check if all projects have been processed
          if (index === projects.length - 1) {
            // Verify the insertions
            setTimeout(() => {
              db.all("SELECT * FROM projects", (err, rows) => {
                if (err) {
                  console.error('❌ Error verifying projects:', err.message);
                } else {
                  console.log(`\n📊 Total projects in database: ${rows.length}`);
                  rows.forEach(project => {
                    console.log(`   • ${project.name}: ${project.description}`);
                  });
                }

                // Close the database connection
                db.close((err) => {
                  if (err) {
                    console.error('❌ Error closing database:', err.message);
                  } else {
                    console.log('✅ Database connection closed');
                  }

                  if (errors.length === 0) {
                    console.log(`\n🎉 SUCCESS! ${insertedCount} projects seeded successfully!`);
                    resolve({ success: true, inserted: insertedCount });
                  } else {
                    console.log(`\n⚠️ Completed with ${errors.length} errors`);
                    resolve({ success: false, errors: errors });
                  }
                });
              });
            }, 500);
          }
        });
      });
    }
  });
}

// Run the seeding
seedProjects()
  .then(result => {
    if (result.success) {
      console.log('\n🌟 PROJECT SEEDING COMPLETED SUCCESSFULLY!');
      console.log('   Your timesheet functionality is now fully operational!');
      console.log('   Employees can now log time against specific projects.');
    } else {
      console.log('\n⚠️ Project seeding completed with some issues');
    }
  })
  .catch(error => {
    console.error('❌ Project seeding failed:', error);
  });
