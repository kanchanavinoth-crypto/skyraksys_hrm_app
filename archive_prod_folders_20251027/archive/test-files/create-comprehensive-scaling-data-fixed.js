/**
 * CREATE COMPREHENSIVE SCALING DATA
 * Create 30 employees with departments, salary structures, and timesheets for scaling tests
 */

const axios = require('axios');

class ComprehensiveDataCreator {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = null;
        this.report = {
            departments: [],
            employees: [],
            salaryStructures: [],
            timesheets: []
        };
    }

    log(message) {
        console.log(message);
    }

    async authenticate() {
        try {
            const response = await axios.post(`${this.baseURL}/auth/login`, {
                email: 'admin@company.com',
                password: 'Kx9mP7qR2nF8sA5t'
            });
            this.token = response.data.data.accessToken;
            this.log('✅ Authentication successful');
            return true;
        } catch (error) {
            this.log(`❌ Authentication failed: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }

    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    async getDepartments() {
        try {
            const response = await axios.get(`${this.baseURL}/departments`, { headers: this.getHeaders() });
            return response.data.data || [];
        } catch (error) {
            this.log(`❌ Error getting departments: ${error.response?.data?.message || error.message}`);
            return [];
        }
    }

    async getPositions() {
        try {
            const response = await axios.get(`${this.baseURL}/positions`, { headers: this.getHeaders() });
            return response.data.data || [];
        } catch (error) {
            this.log(`❌ Error getting positions: ${error.response?.data?.message || error.message}`);
            return [];
        }
    }

    async createDepartments() {
        try {
            this.log('\n📁 CREATING DEPARTMENTS');
            this.log('========================');

            // Get existing departments
            const existingDepartments = await this.getDepartments();
            this.log(`Found ${existingDepartments.length} existing departments`);

            // Add existing departments to report (except test ones)
            for (const dept of existingDepartments) {
                if (!['Information Technology', 'Human Resources', 'Test Department'].includes(dept.name)) {
                    this.report.departments.push({
                        id: dept.id,
                        name: dept.name,
                        description: dept.description,
                        success: true,
                        positions: dept.positions || []
                    });
                    this.log(`✅ Using existing department: ${dept.name}`);
                }
            }

            // Create any missing departments if needed
            const requiredDepartments = [
                { name: 'Engineering', description: 'Software Development and Technical Teams' },
                { name: 'Finance', description: 'Financial Planning and Accounting' },
                { name: 'Marketing', description: 'Digital Marketing and Brand Management' },
                { name: 'Sales', description: 'Business Development and Client Relations' },
                { name: 'Operations', description: 'Business Operations and Process Management' },
                { name: 'Quality Assurance', description: 'Testing and Quality Control' },
                { name: 'Customer Support', description: 'Client Support and Service' }
            ];

            for (const dept of requiredDepartments) {
                // Check if this department already exists
                const exists = existingDepartments.find(existing => existing.name === dept.name);
                if (exists) {
                    // Already handled in the loop above
                    continue;
                }

                try {
                    const response = await axios.post(`${this.baseURL}/departments`, dept, { headers: this.getHeaders() });
                    this.report.departments.push({
                        id: response.data.data.id,
                        name: dept.name,
                        description: dept.description,
                        success: true,
                        positions: []
                    });
                    this.log(`✅ Created department: ${dept.name}`);
                } catch (error) {
                    this.report.departments.push({
                        id: null,
                        name: dept.name,
                        description: dept.description,
                        success: false,
                        error: error.response?.data?.message || error.message
                    });
                    this.log(`❌ Failed to create department ${dept.name}: ${error.response?.data?.message || error.message}`);
                }
            }

        } catch (error) {
            this.log(`❌ Error in createDepartments: ${error.message}`);
        }
    }

    async createEmployees() {
        try {
            this.log('\n👥 CREATING EMPLOYEES');
            this.log('====================');

            // Get all available departments and positions
            const departments = await this.getDepartments();
            const positions = await this.getPositions();

            this.log(`📊 Available departments: ${departments.length}`);
            this.log(`📊 Available positions: ${positions.length}`);

            // Map positions to departments for better assignment
            const positionMap = {};
            for (const position of positions) {
                if (!positionMap[position.departmentId]) {
                    positionMap[position.departmentId] = [];
                }
                positionMap[position.departmentId].push(position);
            }

            // Employee test data with proper phone format (10-15 digits only)
            const employeeData = [
                { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@company.com', position: 'Senior Developer', phone: '9876543201', basicSalary: 75000 },
                { firstName: 'Michael', lastName: 'Chen', email: 'michael.chen@company.com', position: 'Tech Lead', phone: '9876543202', basicSalary: 95000 },
                { firstName: 'Emily', lastName: 'Rodriguez', email: 'emily.rodriguez@company.com', position: 'Junior Developer', phone: '9876543203', basicSalary: 45000 },
                { firstName: 'David', lastName: 'Thompson', email: 'david.thompson@company.com', position: 'Engineering Manager', phone: '9876543204', basicSalary: 120000 },
                { firstName: 'Jessica', lastName: 'Lee', email: 'jessica.lee@company.com', position: 'Finance Analyst', phone: '9876543205', basicSalary: 55000 },
                { firstName: 'Robert', lastName: 'Wilson', email: 'robert.wilson@company.com', position: 'Finance Manager', phone: '9876543206', basicSalary: 60000 },
                { firstName: 'Amanda', lastName: 'Davis', email: 'amanda.davis@company.com', position: 'Marketing Specialist', phone: '9876543207', basicSalary: 50000 },
                { firstName: 'Christopher', lastName: 'Brown', email: 'christopher.brown@company.com', position: 'Sales Representative', phone: '9876543208', basicSalary: 48000 },
                { firstName: 'Jennifer', lastName: 'Taylor', email: 'jennifer.taylor@company.com', position: 'QA Tester', phone: '9876543209', basicSalary: 46000 },
                { firstName: 'Daniel', lastName: 'Anderson', email: 'daniel.anderson@company.com', position: 'Support Agent', phone: '9876543210', basicSalary: 42000 },
                { firstName: 'Michelle', lastName: 'White', email: 'michelle.white@company.com', position: 'Senior Developer', phone: '9876543211', basicSalary: 75000 },
                { firstName: 'Kevin', lastName: 'Martin', email: 'kevin.martin@company.com', position: 'Junior Developer', phone: '9876543212', basicSalary: 45000 },
                { firstName: 'Lisa', lastName: 'Garcia', email: 'lisa.garcia@company.com', position: 'Finance Manager', phone: '9876543213', basicSalary: 85000 },
                { firstName: 'Ryan', lastName: 'Thomas', email: 'ryan.thomas@company.com', position: 'Accountant', phone: '9876543214', basicSalary: 90000 },
                { firstName: 'Nicole', lastName: 'Jackson', email: 'nicole.jackson@company.com', position: 'Marketing Manager', phone: '9876543215', basicSalary: 80000 },
                { firstName: 'Andrew', lastName: 'Harris', email: 'andrew.harris@company.com', position: 'Sales Manager', phone: '9876543216', basicSalary: 88000 },
                { firstName: 'Stephanie', lastName: 'Clark', email: 'stephanie.clark@company.com', position: 'Operations Coordinator', phone: '9876543217', basicSalary: 52000 },
                { firstName: 'Brandon', lastName: 'Lewis', email: 'brandon.lewis@company.com', position: 'Senior Developer', phone: '9876543218', basicSalary: 75000 },
                { firstName: 'Rachel', lastName: 'Walker', email: 'rachel.walker@company.com', position: 'Junior Developer', phone: '9876543219', basicSalary: 45000 },
                { firstName: 'Matthew', lastName: 'Hall', email: 'matthew.hall@company.com', position: 'Tech Lead', phone: '9876543220', basicSalary: 95000 },
                { firstName: 'Samantha', lastName: 'Allen', email: 'samantha.allen@company.com', position: 'QA Tester', phone: '9876543221', basicSalary: 46000 },
                { firstName: 'Tyler', lastName: 'Young', email: 'tyler.young@company.com', position: 'Junior Developer', phone: '9876543222', basicSalary: 45000 },
                { firstName: 'Heather', lastName: 'King', email: 'heather.king@company.com', position: 'Senior Developer', phone: '9876543223', basicSalary: 75000 },
                { firstName: 'Joshua', lastName: 'Wright', email: 'joshua.wright@company.com', position: 'Finance Analyst', phone: '9876543224', basicSalary: 55000 },
                { firstName: 'Ashley', lastName: 'Lopez', email: 'ashley.lopez@company.com', position: 'Marketing Specialist', phone: '9876543225', basicSalary: 50000 },
                { firstName: 'James', lastName: 'Hill', email: 'james.hill@company.com', position: 'Sales Representative', phone: '9876543226', basicSalary: 48000 },
                { firstName: 'Megan', lastName: 'Scott', email: 'megan.scott@company.com', position: 'Support Agent', phone: '9876543227', basicSalary: 42000 },
                { firstName: 'Nathan', lastName: 'Green', email: 'nathan.green@company.com', position: 'Operations Coordinator', phone: '9876543228', basicSalary: 52000 },
                { firstName: 'Lauren', lastName: 'Adams', email: 'lauren.adams@company.com', position: 'QA Tester', phone: '9876543229', basicSalary: 46000 },
                { firstName: 'Jordan', lastName: 'Baker', email: 'jordan.baker@company.com', position: 'Junior Developer', phone: '9876543230', basicSalary: 45000 }
            ];

            // Use Information Technology department as default (we know it exists and has positions)
            const itDepartment = departments.find(d => d.name === 'Information Technology');
            const defaultPosition = positions.find(p => p.name === 'Software Developer');

            if (!itDepartment || !defaultPosition) {
                this.log('❌ Cannot find IT department or Software Developer position');
                return;
            }

            this.log(`Using default department: ${itDepartment.name} (${itDepartment.id})`);
            this.log(`Using default position: ${defaultPosition.name} (${defaultPosition.id})`);

            // Create employees
            for (const empData of employeeData) {
                try {
                    const employeePayload = {
                        firstName: empData.firstName,
                        lastName: empData.lastName,
                        email: empData.email,
                        phone: empData.phone,
                        hireDate: '2023-01-01',
                        departmentId: itDepartment.id,
                        positionId: defaultPosition.id
                    };

                    const response = await axios.post(`${this.baseURL}/employees`, employeePayload, { 
                        headers: this.getHeaders() 
                    });

                    this.report.employees.push({
                        id: response.data.data.id,
                        employeeId: response.data.data.employeeId,
                        name: `${empData.firstName} ${empData.lastName}`,
                        email: empData.email,
                        phone: empData.phone,
                        basicSalary: empData.basicSalary,
                        success: true
                    });

                    this.log(`✅ Created employee: ${empData.firstName} ${empData.lastName} (${response.data.data.employeeId})`);

                } catch (error) {
                    this.report.employees.push({
                        id: null,
                        employeeId: null,
                        name: `${empData.firstName} ${empData.lastName}`,
                        email: empData.email,
                        phone: empData.phone,
                        basicSalary: empData.basicSalary,
                        success: false,
                        error: error.response?.data?.message || error.message
                    });
                    this.log(`❌ Failed to create employee ${empData.firstName} ${empData.lastName}: ${error.response?.data?.message || error.message}`);
                }
            }

        } catch (error) {
            this.log(`❌ Error in createEmployees: ${error.message}`);
        }
    }

    async createSalaryStructures() {
        try {
            this.log('\n💰 CREATING SALARY STRUCTURES');
            this.log('==============================');

            const successfulEmployees = this.report.employees.filter(emp => emp.success);
            
            if (successfulEmployees.length === 0) {
                this.log('❌ No employees created successfully, skipping salary structures');
                return;
            }

            this.log(`Creating salary structures for ${successfulEmployees.length} employees`);

            for (const employee of successfulEmployees) {
                try {
                    const salaryStructure = {
                        employeeId: employee.id,
                        basicSalary: employee.basicSalary,
                        hra: Math.round(employee.basicSalary * 0.4),  // 40% of basic
                        da: Math.round(employee.basicSalary * 0.1),   // 10% of basic
                        conveyanceAllowance: 2000,
                        medicalAllowance: 1500,
                        specialAllowance: Math.round(employee.basicSalary * 0.15), // 15% of basic
                        providentFund: Math.round(employee.basicSalary * 0.12),    // 12% of basic
                        professionalTax: 200,
                        incomeTax: Math.round(employee.basicSalary * 0.1),         // 10% of basic
                        effectiveDate: '2023-01-01'
                    };

                    const response = await axios.post(`${this.baseURL}/salary-structures`, salaryStructure, { 
                        headers: this.getHeaders() 
                    });

                    this.report.salaryStructures.push({
                        id: response.data.data.id,
                        employeeId: employee.id,
                        employeeName: employee.name,
                        basicSalary: employee.basicSalary,
                        grossSalary: salaryStructure.basicSalary + salaryStructure.hra + salaryStructure.da + 
                                   salaryStructure.conveyanceAllowance + salaryStructure.medicalAllowance + 
                                   salaryStructure.specialAllowance,
                        success: true
                    });

                    this.log(`✅ Created salary structure for: ${employee.name}`);

                } catch (error) {
                    this.report.salaryStructures.push({
                        id: null,
                        employeeId: employee.id,
                        employeeName: employee.name,
                        basicSalary: employee.basicSalary,
                        success: false,
                        error: error.response?.data?.message || error.message
                    });
                    this.log(`❌ Failed to create salary structure for ${employee.name}: ${error.response?.data?.message || error.message}`);
                }
            }

        } catch (error) {
            this.log(`❌ Error in createSalaryStructures: ${error.message}`);
        }
    }

    async createTimesheets() {
        try {
            this.log('\n⏰ CREATING TIMESHEETS');
            this.log('======================');

            const successfulEmployees = this.report.employees.filter(emp => emp.success);
            
            if (successfulEmployees.length === 0) {
                this.log('❌ No employees created successfully, skipping timesheets');
                return;
            }

            this.log(`Creating timesheets for ${successfulEmployees.length} employees`);

            // Create timesheets for December 2024 (21 working days)
            const year = 2024;
            const month = 12;
            const workingDays = 21;

            for (const employee of successfulEmployees) {
                try {
                    // Create a monthly timesheet record
                    const timesheet = {
                        employeeId: employee.id,
                        year: year,
                        month: month,
                        totalWorkingDays: workingDays,
                        totalWorkedDays: Math.floor(Math.random() * 3) + 19, // 19-21 days worked
                        totalAbsentDays: 0,
                        totalLeaveDays: workingDays - (Math.floor(Math.random() * 3) + 19),
                        totalOvertimeHours: Math.floor(Math.random() * 10), // 0-9 overtime hours
                        notes: `Timesheet for ${employee.name} - ${month}/${year}`
                    };

                    timesheet.totalAbsentDays = workingDays - timesheet.totalWorkedDays - timesheet.totalLeaveDays;

                    const response = await axios.post(`${this.baseURL}/timesheets`, timesheet, { 
                        headers: this.getHeaders() 
                    });

                    this.report.timesheets.push({
                        id: response.data.data.id,
                        employeeId: employee.id,
                        employeeName: employee.name,
                        month: `${month}/${year}`,
                        workedDays: timesheet.totalWorkedDays,
                        leaveDays: timesheet.totalLeaveDays,
                        overtimeHours: timesheet.totalOvertimeHours,
                        success: true
                    });

                    this.log(`✅ Created timesheet for: ${employee.name} (${timesheet.totalWorkedDays}/${workingDays} days)`);

                } catch (error) {
                    this.report.timesheets.push({
                        id: null,
                        employeeId: employee.id,
                        employeeName: employee.name,
                        month: `${month}/${year}`,
                        success: false,
                        error: error.response?.data?.message || error.message
                    });
                    this.log(`❌ Failed to create timesheet for ${employee.name}: ${error.response?.data?.message || error.message}`);
                }
            }

        } catch (error) {
            this.log(`❌ Error in createTimesheets: ${error.message}`);
        }
    }

    async generateReport() {
        this.log('\n📊 COMPREHENSIVE DATA CREATION REPORT');
        this.log('======================================');

        // Departments Summary
        const successfulDepartments = this.report.departments.filter(d => d.success).length;
        const totalDepartments = this.report.departments.length;
        this.log(`\n📁 DEPARTMENTS: ${successfulDepartments}/${totalDepartments} created/existing`);

        // Employees Summary
        const successfulEmployees = this.report.employees.filter(e => e.success).length;
        const totalEmployees = this.report.employees.length;
        this.log(`👥 EMPLOYEES: ${successfulEmployees}/${totalEmployees} created successfully`);

        // Salary Structures Summary
        const successfulSalaryStructures = this.report.salaryStructures.filter(s => s.success).length;
        const totalSalaryStructures = this.report.salaryStructures.length;
        this.log(`💰 SALARY STRUCTURES: ${successfulSalaryStructures}/${totalSalaryStructures} created successfully`);

        // Timesheets Summary
        const successfulTimesheets = this.report.timesheets.filter(t => t.success).length;
        const totalTimesheets = this.report.timesheets.length;
        this.log(`⏰ TIMESHEETS: ${successfulTimesheets}/${totalTimesheets} created successfully`);

        // Overall Success Rate
        const totalItems = totalEmployees + totalSalaryStructures + totalTimesheets;
        const successfulItems = successfulEmployees + successfulSalaryStructures + successfulTimesheets;
        const successRate = totalItems > 0 ? ((successfulItems / totalItems) * 100).toFixed(1) : 0;

        this.log(`\n🎯 OVERALL SUCCESS RATE: ${successRate}% (${successfulItems}/${totalItems})`);

        if (successfulEmployees >= 25) {
            this.log('\n✅ SCALING TEST READY: 25+ employees created successfully');
            this.log('✅ PAYROLL ENHANCEMENT READY: Salary structures and timesheets available');
        } else {
            this.log('\n⚠️  SCALING TEST NOT READY: Less than 25 employees created');
        }

        // Error Summary
        const errors = [
            ...this.report.employees.filter(e => !e.success),
            ...this.report.salaryStructures.filter(s => !s.success),
            ...this.report.timesheets.filter(t => !t.success)
        ];

        if (errors.length > 0) {
            this.log('\n❌ ERRORS ENCOUNTERED:');
            errors.forEach(error => {
                this.log(`   - ${error.employeeName || error.name}: ${error.error}`);
            });
        }
    }

    async execute() {
        try {
            this.log('🚀 STARTING COMPREHENSIVE DATA CREATION');
            this.log('========================================');

            // Step 1: Authenticate
            const authenticated = await this.authenticate();
            if (!authenticated) return;

            // Step 2: Create/verify departments
            await this.createDepartments();

            // Step 3: Create employees
            await this.createEmployees();

            // Step 4: Create salary structures
            await this.createSalaryStructures();

            // Step 5: Create timesheets
            await this.createTimesheets();

            // Step 6: Generate report
            await this.generateReport();

            this.log('\n✨ COMPREHENSIVE DATA CREATION COMPLETED');

        } catch (error) {
            this.log(`❌ Critical error: ${error.message}`);
        }
    }
}

// Execute the data creation
const creator = new ComprehensiveDataCreator();
creator.execute().catch(console.error);
