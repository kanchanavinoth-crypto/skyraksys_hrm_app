/**
 * QUICK PROJECT SETUP SCRIPT
 * Create missing projects and tasks for complete testing
 */

const http = require('http');

class QuickProjectSetup {
    constructor() {
        this.baseURL = 'http://localhost:5000';
        this.token = null;
        this.employees = [];
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.baseURL);
            
            const options = {
                hostname: url.hostname,
                port: url.port || 5000,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (this.token) {
                options.headers['Authorization'] = `Bearer ${this.token}`;
            }

            const req = http.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => { responseData += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = responseData ? JSON.parse(responseData) : {};
                        resolve({
                            success: res.statusCode >= 200 && res.statusCode < 300,
                            status: res.statusCode,
                            data: parsed
                        });
                    } catch (error) {
                        resolve({
                            success: false,
                            status: res.statusCode,
                            data: { message: 'Invalid JSON response', raw: responseData }
                        });
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    async setup() {
        console.log('🚀 QUICK PROJECT SETUP');
        console.log('='.repeat(50));

        // Authenticate
        console.log('🔐 Authenticating...');
        const response = await this.makeRequest('/api/auth/login', 'POST', {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });

        if (!response.success || !response.data.data?.accessToken) {
            console.log('❌ Authentication failed');
            return false;
        }

        this.token = response.data.data.accessToken;
        console.log('✅ Authentication successful');

        // Get employees
        const employeesResponse = await this.makeRequest('/api/employees');
        if (employeesResponse.success) {
            this.employees = employeesResponse.data.data || [];
            console.log(`👥 Found ${this.employees.length} employees`);
        }

        if (this.employees.length === 0) {
            console.log('❌ No employees found');
            return false;
        }

        // Create projects
        console.log('\n📋 Creating projects...');
        const projects = [
            {
                name: 'HRM System Development',
                description: 'Complete human resource management system',
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                status: 'Active',
                clientName: 'Internal Project',
                managerId: this.employees[0].id,
                isActive: true
            },
            {
                name: 'Timesheet Module',
                description: 'Employee time tracking system',
                startDate: '2025-08-01',
                endDate: '2025-10-31',
                status: 'Active',
                clientName: 'Internal Development',
                managerId: this.employees[0].id,
                isActive: true
            }
        ];

        const createdProjects = [];
        for (const project of projects) {
            const projectResponse = await this.makeRequest('/api/projects', 'POST', project);
            if (projectResponse.success) {
                createdProjects.push(projectResponse.data.data);
                console.log(`✅ Created project: ${project.name}`);
            } else {
                console.log(`❌ Failed to create project: ${project.name}`);
            }
        }

        // Create tasks
        if (createdProjects.length > 0) {
            console.log('\n🔧 Creating tasks...');
            const tasks = [
                {
                    name: 'Timesheet API Development',
                    description: 'Develop timesheet creation and management APIs',
                    estimatedHours: 40,
                    status: 'In Progress',
                    priority: 'High',
                    projectId: createdProjects[0].id,
                    assignedTo: this.employees[0].id,
                    isActive: true
                },
                {
                    name: 'Payroll Integration',
                    description: 'Integrate payroll with timesheet data',
                    estimatedHours: 30,
                    status: 'In Progress',
                    priority: 'High',
                    projectId: createdProjects[0].id,
                    assignedTo: this.employees[0].id,
                    isActive: true
                }
            ];

            for (const task of tasks) {
                const taskResponse = await this.makeRequest('/api/tasks', 'POST', task);
                if (taskResponse.success) {
                    console.log(`✅ Created task: ${task.name}`);
                } else {
                    console.log(`❌ Failed to create task: ${task.name}`);
                }
            }
        }

        console.log('\n✅ Setup complete!');
        return true;
    }
}

// Run setup
if (require.main === module) {
    const setup = new QuickProjectSetup();
    setup.setup()
        .then(success => {
            console.log('\n' + '='.repeat(50));
            console.log(success ? '🎉 PROJECT SETUP SUCCESSFUL!' : '❌ PROJECT SETUP FAILED');
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 ERROR:', error.message);
            process.exit(1);
        });
}
