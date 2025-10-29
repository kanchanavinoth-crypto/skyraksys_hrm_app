const axios = require('axios');

class DryRunDataSetup {
    constructor() {
        this.baseURL = 'http://localhost:8080/api';
        this.tokens = {};
        this.users = {};
        this.employees = {};
        this.departments = [];
        this.positions = [];
        this.projects = [];
        this.leaveTypes = [];
    }

    // Helper function to make authenticated requests
    async makeRequest(method, endpoint, data = null, token = null) {
        try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                ...(data && { data })
            };

            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`❌ ${method} ${endpoint}:`, error.response?.data?.message || error.message);
            throw error;
        }
    }

    // Step 1: Create Admin User and Login
    async setupAdminUser() {
        console.log('🔧 Setting up Admin User...');
        
        // Try admin@test.com first (from create-demo-users.js)
        try {
            const adminCredentials = {
                email: 'admin@test.com',
                password: 'admin123'
            };
            
            const loginResponse = await this.makeRequest('POST', '/auth/login', adminCredentials);
            console.log('✅ POST /auth/login: Admin login successful!');
            
            this.tokens.admin = loginResponse.data.accessToken;
            this.users.admin = {
                ...loginResponse.data.user,
                email: adminCredentials.email,
                password: adminCredentials.password
            };
            
            return true;
        } catch (error) {
            console.log(`❌ POST /auth/login: ${error.response?.data?.message || error.message}`);
            
            // Try admin@skyraksys.com as fallback
            try {
                const fallbackCredentials = {
                    email: 'admin@skyraksys.com',
                    password: 'admin123'
                };
                
                const loginResponse = await this.makeRequest('POST', '/auth/login', fallbackCredentials);
                console.log('✅ POST /auth/login: Admin login successful with fallback!');
                
                this.tokens.admin = loginResponse.data.accessToken;
                this.users.admin = {
                    ...loginResponse.data.user,
                    email: fallbackCredentials.email,
                    password: fallbackCredentials.password
                };
                
                return true;
            } catch (fallbackError) {
                console.log('⚠️  Admin login failed, admin may need to be created manually');
                return false;
            }
        }
    }

    // Step 2: Setup Departments and Positions
    async setupDepartmentsAndPositions() {
        console.log('\n🏢 Setting up Departments and Positions...');

        const departments = [
            { name: 'Engineering', description: 'Software Development Team' },
            { name: 'Human Resources', description: 'HR Operations' },
            { name: 'Marketing', description: 'Marketing and Sales' },
            { name: 'Finance', description: 'Financial Operations' }
        ];

        const positions = [
            { title: 'Software Engineer', description: 'Frontend/Backend Developer' },
            { title: 'Senior Software Engineer', description: 'Senior Developer' },
            { title: 'Engineering Manager', description: 'Development Team Lead' },
            { title: 'HR Manager', description: 'Human Resources Manager' },
            { title: 'HR Specialist', description: 'HR Operations Specialist' },
            { title: 'Marketing Manager', description: 'Marketing Team Lead' },
            { title: 'Marketing Specialist', description: 'Marketing Executive' },
            { title: 'Finance Manager', description: 'Financial Operations Manager' }
        ];

        // Create departments
        for (const dept of departments) {
            try {
                const result = await this.makeRequest('POST', '/departments', dept, this.tokens.admin);
                this.departments.push(result.data);
                console.log(`✅ Created department: ${dept.name}`);
            } catch (error) {
                console.log(`⚠️  Department ${dept.name} may already exist`);
            }
        }

        // Create positions
        for (const pos of positions) {
            try {
                const result = await this.makeRequest('POST', '/positions', pos, this.tokens.admin);
                this.positions.push(result.data);
                console.log(`✅ Created position: ${pos.title}`);
            } catch (error) {
                console.log(`⚠️  Position ${pos.title} may already exist`);
            }
        }

        // Fetch existing departments and positions
        try {
            const deptResult = await this.makeRequest('GET', '/departments', null, this.tokens.admin);
            this.departments = deptResult.data;
            
            const posResult = await this.makeRequest('GET', '/employees/positions', null, this.tokens.admin);
            this.positions = posResult.data;
        } catch (error) {
            console.error('Failed to fetch departments/positions');
        }
    }

    // Step 3: Create Test Employees (Managers and Staff)
    async setupTestEmployees() {
        console.log('\n👥 Setting up Test Employees...');

        const testEmployees = [
            // Managers
            {
                firstName: 'John', lastName: 'Smith', email: 'john.smith@skyraksys.com',
                role: 'manager', department: 'Engineering', position: 'Engineering Manager',
                phone: '555-0101', address: '123 Tech Street', emergencyContact: 'Jane Smith (555-0102)'
            },
            {
                firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@skyraksys.com', 
                role: 'manager', department: 'Human Resources', position: 'HR Manager',
                phone: '555-0201', address: '456 HR Avenue', emergencyContact: 'Mike Johnson (555-0202)'
            },
            {
                firstName: 'Mike', lastName: 'Davis', email: 'mike.davis@skyraksys.com',
                role: 'manager', department: 'Marketing', position: 'Marketing Manager', 
                phone: '555-0301', address: '789 Marketing Lane', emergencyContact: 'Lisa Davis (555-0302)'
            },
            
            // Engineering Team
            {
                firstName: 'Alice', lastName: 'Wilson', email: 'alice.wilson@skyraksys.com',
                role: 'employee', department: 'Engineering', position: 'Senior Software Engineer',
                phone: '555-1001', address: '111 Code Street', emergencyContact: 'Bob Wilson (555-1002)',
                manager: 'john.smith@skyraksys.com'
            },
            {
                firstName: 'Bob', lastName: 'Brown', email: 'bob.brown@skyraksys.com',
                role: 'employee', department: 'Engineering', position: 'Software Engineer',
                phone: '555-1101', address: '222 Dev Avenue', emergencyContact: 'Carol Brown (555-1102)',
                manager: 'john.smith@skyraksys.com'
            },
            {
                firstName: 'Carol', lastName: 'Garcia', email: 'carol.garcia@skyraksys.com',
                role: 'employee', department: 'Engineering', position: 'Software Engineer',
                phone: '555-1201', address: '333 Tech Boulevard', emergencyContact: 'David Garcia (555-1202)',
                manager: 'john.smith@skyraksys.com'
            },
            
            // HR Team
            {
                firstName: 'David', lastName: 'Miller', email: 'david.miller@skyraksys.com',
                role: 'employee', department: 'Human Resources', position: 'HR Specialist',
                phone: '555-2001', address: '444 People Street', emergencyContact: 'Emma Miller (555-2002)',
                manager: 'sarah.johnson@skyraksys.com'
            },
            {
                firstName: 'Emma', lastName: 'Martinez', email: 'emma.martinez@skyraksys.com',
                role: 'employee', department: 'Human Resources', position: 'HR Specialist',
                phone: '555-2101', address: '555 HR Plaza', emergencyContact: 'Frank Martinez (555-2102)',
                manager: 'sarah.johnson@skyraksys.com'
            },
            
            // Marketing Team
            {
                firstName: 'Frank', lastName: 'Anderson', email: 'frank.anderson@skyraksys.com',
                role: 'employee', department: 'Marketing', position: 'Marketing Specialist',
                phone: '555-3001', address: '666 Brand Street', emergencyContact: 'Grace Anderson (555-3002)',
                manager: 'mike.davis@skyraksys.com'
            },
            {
                firstName: 'Grace', lastName: 'Taylor', email: 'grace.taylor@skyraksys.com',
                role: 'employee', department: 'Marketing', position: 'Marketing Specialist', 
                phone: '555-3101', address: '777 Campaign Avenue', emergencyContact: 'Henry Taylor (555-3102)',
                manager: 'mike.davis@skyraksys.com'
            }
        ];

        for (const emp of testEmployees) {
            try {
                // Find department and position IDs
                const department = this.departments.find(d => d.name === emp.department);
                const position = this.positions.find(p => p.title === emp.position);
                
                if (!department || !position) {
                    console.log(`⚠️  Skipping ${emp.firstName} ${emp.lastName}: Department or position not found`);
                    continue;
                }

                // Find manager ID if specified
                let managerId = null;
                if (emp.manager) {
                    const manager = Object.values(this.employees).find(e => e.email === emp.manager);
                    managerId = manager?.id;
                }

                const employeeData = {
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email,
                    phone: emp.phone,
                    address: emp.address,
                    emergencyContact: emp.emergencyContact,
                    departmentId: department.id,
                    positionId: position.id,
                    managerId: managerId,
                    hireDate: new Date().toISOString().split('T')[0],
                    status: 'Active',
                    user: {
                        email: emp.email,
                        password: 'Test@123',
                        role: emp.role
                    },
                    salaryStructure: {
                        basicSalary: emp.role === 'manager' ? 8000 : 5000,
                        allowances: emp.role === 'manager' ? 2000 : 1000,
                        pfContribution: 500,
                        professionalTax: 200,
                        tds: 300
                    }
                };

                const result = await this.makeRequest('POST', '/employees', employeeData, this.tokens.admin);
                this.employees[emp.email] = result.data;
                console.log(`✅ Created employee: ${emp.firstName} ${emp.lastName} (${emp.role})`);
                
                // Store login token for later use
                try {
                    const loginResult = await this.makeRequest('POST', '/auth/login', {
                        email: emp.email,
                        password: 'Test@123'
                    });
                    this.tokens[emp.email] = loginResult.data.accessToken;
                } catch (loginError) {
                    console.log(`⚠️  Could not login as ${emp.email}`);
                }

            } catch (error) {
                console.log(`⚠️  Failed to create ${emp.firstName} ${emp.lastName}: ${error.response?.data?.message || error.message}`);
            }
        }
    }

    // Step 4: Setup Projects and Tasks
    async setupProjectsAndTasks() {
        console.log('\n📋 Setting up Projects and Tasks...');

        const projects = [
            {
                name: 'HRM System Enhancement',
                description: 'Enhance the current HRM system with new features',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                status: 'Active',
                clientName: 'Internal Project',
                managerId: this.employees['john.smith@skyraksys.com']?.id
            },
            {
                name: 'Marketing Campaign Q4',
                description: 'Q4 marketing campaign for product launch',
                startDate: '2024-10-01', 
                endDate: '2024-12-31',
                status: 'Active',
                clientName: 'Product Marketing',
                managerId: this.employees['mike.davis@skyraksys.com']?.id
            },
            {
                name: 'HR Process Automation',
                description: 'Automate manual HR processes',
                startDate: '2024-06-01',
                endDate: '2024-12-31', 
                status: 'Active',
                clientName: 'Internal HR',
                managerId: this.employees['sarah.johnson@skyraksys.com']?.id
            }
        ];

        for (const project of projects) {
            try {
                const result = await this.makeRequest('POST', '/projects', project, this.tokens.admin);
                this.projects.push(result.data);
                console.log(`✅ Created project: ${project.name}`);
            } catch (error) {
                console.log(`⚠️  Failed to create project ${project.name}: ${error.response?.data?.message || error.message}`);
            }
        }

        // Create tasks for each project
        const tasks = [
            { name: 'Frontend Development', description: 'React frontend development', projectIndex: 0 },
            { name: 'Backend API Development', description: 'Node.js API development', projectIndex: 0 },
            { name: 'Database Design', description: 'PostgreSQL database design', projectIndex: 0 },
            { name: 'Social Media Campaign', description: 'Social media marketing', projectIndex: 1 },
            { name: 'Content Creation', description: 'Marketing content creation', projectIndex: 1 },
            { name: 'Performance Reviews', description: 'Employee performance reviews', projectIndex: 2 },
            { name: 'Policy Documentation', description: 'HR policy documentation', projectIndex: 2 }
        ];

        for (const task of tasks) {
            if (this.projects[task.projectIndex]) {
                try {
                    const taskData = {
                        name: task.name,
                        description: task.description,
                        projectId: this.projects[task.projectIndex].id
                    };
                    await this.makeRequest('POST', '/timesheets/tasks', taskData, this.tokens.admin);
                    console.log(`✅ Created task: ${task.name}`);
                } catch (error) {
                    console.log(`⚠️  Failed to create task ${task.name}`);
                }
            }
        }
    }

    // Step 5: Setup Leave Types and Balances
    async setupLeaveSystem() {
        console.log('\n🏖️ Setting up Leave System...');

        const leaveTypes = [
            { name: 'Annual Leave', description: 'Yearly vacation leave', maxDays: 21 },
            { name: 'Sick Leave', description: 'Medical leave', maxDays: 10 },
            { name: 'Personal Leave', description: 'Personal time off', maxDays: 5 },
            { name: 'Maternity Leave', description: 'Maternity leave', maxDays: 90 },
            { name: 'Paternity Leave', description: 'Paternity leave', maxDays: 15 }
        ];

        for (const leaveType of leaveTypes) {
            try {
                const result = await this.makeRequest('POST', '/leaves/types', leaveType, this.tokens.admin);
                this.leaveTypes.push(result.data);
                console.log(`✅ Created leave type: ${leaveType.name}`);
            } catch (error) {
                console.log(`⚠️  Leave type ${leaveType.name} may already exist`);
            }
        }

        // Fetch existing leave types
        try {
            const result = await this.makeRequest('GET', '/leaves/meta/types', null, this.tokens.admin);
            this.leaveTypes = result.data;
        } catch (error) {
            console.error('Failed to fetch leave types');
        }

        // Create leave balances for all employees
        for (const employee of Object.values(this.employees)) {
            for (const leaveType of this.leaveTypes) {
                try {
                    const balanceData = {
                        employeeId: employee.id,
                        leaveTypeId: leaveType.id,
                        totalDays: leaveType.maxDays,
                        usedDays: 0,
                        year: new Date().getFullYear()
                    };
                    await this.makeRequest('POST', '/leaves/balances', balanceData, this.tokens.admin);
                } catch (error) {
                    // Balance may already exist
                }
            }
        }
        console.log('✅ Leave balances created for all employees');
    }

    // Main setup function
    async setupDryRunData() {
        console.log('🚀 Starting Dry Run Data Setup for Code Review...\n');
        
        try {
            await this.setupAdminUser();
            await this.setupDepartmentsAndPositions();
            await this.setupTestEmployees();
            await this.setupProjectsAndTasks();
            await this.setupLeaveSystem();
            
            console.log('\n🎉 DRY RUN DATA SETUP COMPLETED!');
            console.log(`✅ Created ${Object.keys(this.employees).length} employees`);
            console.log(`✅ Created ${this.departments.length} departments`);
            console.log(`✅ Created ${this.positions.length} positions`);
            console.log(`✅ Created ${this.projects.length} projects`);
            console.log(`✅ Created ${this.leaveTypes.length} leave types`);
            
            // Save setup data for test execution
            const setupData = {
                tokens: this.tokens,
                employees: this.employees,
                departments: this.departments,
                positions: this.positions,
                projects: this.projects,
                leaveTypes: this.leaveTypes
            };
            
            require('fs').writeFileSync('dry-run-setup-data.json', JSON.stringify(setupData, null, 2));
            console.log('✅ Setup data saved to dry-run-setup-data.json');
            
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            throw error;
        }
    }
}

// Execute setup
if (require.main === module) {
    const setup = new DryRunDataSetup();
    setup.setupDryRunData().catch(console.error);
}

module.exports = DryRunDataSetup;
