const http = require('http');

// Configuration for backend running on port 8080
const API_BASE = 'localhost:8080';
const ADMIN_CREDENTIALS = {
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t'
};

let authToken = '';

// Helper function to make API requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || responseData}`));
                    }
                } catch (error) {
                    reject(new Error(`Parse error: ${error.message}\nResponse: ${responseData.substring(0, 200)}`));
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Login function
async function login() {
    console.log('🔑 Logging in as admin...');
    
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    try {
        const response = await makeRequest(options, ADMIN_CREDENTIALS);
        authToken = response.token;
        console.log('✅ Login successful');
        return response;
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        throw error;
    }
}

// Create projects
async function createProjects() {
    console.log('📂 Creating projects...');
    
    const projects = [
        {
            name: 'Website Redesign',
            description: 'Complete redesign of company website with modern UI/UX',
            startDate: '2024-01-01',
            endDate: '2024-06-30',
            status: 'Active',
            clientName: 'Internal Project',
            isActive: true
        },
        {
            name: 'Mobile App Development',
            description: 'Development of cross-platform mobile application',
            startDate: '2024-02-01', 
            endDate: '2024-12-31',
            status: 'Active',
            clientName: 'TechCorp Inc.',
            isActive: true
        },
        {
            name: 'Data Analytics Platform',
            description: 'Building comprehensive data analytics platform',
            startDate: '2024-03-01',
            endDate: '2024-09-30',
            status: 'Planning',
            clientName: 'DataSoft Solutions',
            isActive: true
        },
        {
            name: 'E-commerce Integration',
            description: 'Integration with third-party e-commerce platforms',
            startDate: '2024-04-01',
            endDate: '2024-08-31',
            status: 'Active',
            clientName: 'RetailMax Ltd.',
            isActive: true
        },
        {
            name: 'Security Audit',
            description: 'Comprehensive security audit and implementation',
            startDate: '2024-05-01',
            endDate: '2024-07-31',
            status: 'Active',
            clientName: 'SecureIT Corp.',
            isActive: true
        }
    ];
    
    const createdProjects = [];
    
    for (const project of projects) {
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/api/projects',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        };
        
        try {
            const response = await makeRequest(options, project);
            createdProjects.push(response);
            console.log(`✅ Created project: ${project.name}`);
        } catch (error) {
            console.error(`❌ Failed to create project ${project.name}:`, error.message);
        }
    }
    
    return createdProjects;
}

// Create tasks for projects
async function createTasks(projects) {
    console.log('📋 Creating tasks...');
    
    const taskTemplates = [
        { name: 'Requirements Analysis', description: 'Analyze and document project requirements', estimatedHours: 40, priority: 'High' },
        { name: 'UI/UX Design', description: 'Create user interface and experience designs', estimatedHours: 60, priority: 'High' },
        { name: 'Backend Development', description: 'Develop backend services and APIs', estimatedHours: 120, priority: 'High' },
        { name: 'Frontend Development', description: 'Develop frontend user interface', estimatedHours: 100, priority: 'High' },
        { name: 'Database Design', description: 'Design and implement database schema', estimatedHours: 50, priority: 'Medium' },
        { name: 'Testing & QA', description: 'Comprehensive testing and quality assurance', estimatedHours: 80, priority: 'High' },
        { name: 'Documentation', description: 'Create technical and user documentation', estimatedHours: 30, priority: 'Medium' },
        { name: 'Deployment', description: 'Deploy application to production environment', estimatedHours: 20, priority: 'High' },
        { name: 'Code Review', description: 'Review code quality and standards', estimatedHours: 25, priority: 'Medium' },
        { name: 'Performance Optimization', description: 'Optimize application performance', estimatedHours: 35, priority: 'Medium' }
    ];
    
    for (const project of projects) {
        // Create 5-8 tasks per project
        const numTasks = Math.floor(Math.random() * 4) + 5;
        const projectTasks = taskTemplates.slice(0, numTasks);
        
        for (const taskTemplate of projectTasks) {
            const task = {
                ...taskTemplate,
                projectId: project.id,
                status: 'Not Started'
            };
            
            const options = {
                hostname: 'localhost',
                port: 8080,
                path: '/api/tasks',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            };
            
            try {
                const response = await makeRequest(options, task);
                console.log(`✅ Created task: ${task.name} for project ${project.name}`);
            } catch (error) {
                console.error(`❌ Failed to create task ${task.name}:`, error.message);
            }
        }
    }
}

// Main execution
async function main() {
    try {
        console.log('🚀 Starting project and task creation...\n');
        
        // Login
        await login();
        
        // Create projects
        const projects = await createProjects();
        console.log(`\n📂 Created ${projects.length} projects\n`);
        
        // Create tasks
        await createTasks(projects);
        
        console.log('\n🎉 Project and task creation completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Projects created: ${projects.length}`);
        console.log(`   - Tasks created per project: 5-8`);
        console.log('\n🔍 You can now test the dropdown functionality at http://localhost:3000/weekly-timesheet');
        
    } catch (error) {
        console.error('\n❌ Error during execution:', error.message);
        process.exit(1);
    }
}

main();
