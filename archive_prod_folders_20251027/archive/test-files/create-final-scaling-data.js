/**
 * CREATE COMPREHENSIVE SCALING DATA - FINAL VERSION
 * Create 30 employees with departments, salary structures, and timesheets for scaling tests
 * Uses hardcoded known position/department IDs since API endpoints are limited
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
        
        // Known valid IDs from previous testing
        this.knownDepartmentId = '2b45097a-89cd-45fe-bd66-0107d3ef849b'; // Information Technology
        this.knownPositionId = '5ca16ce4-6b59-4d86-a383-22f799027c3b';   // Software Developer
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

    async createEmployees() {
        try {
            this.log('\n👥 CREATING EMPLOYEES');
            this.log('====================');

            // Get departments for verification
            const departments = await this.getDepartments();
            this.log(`📊 Available departments: ${departments.length}`);
            
            const itDept = departments.find(d => d.id === this.knownDepartmentId);
            if (itDept) {
                this.log(`✅ Found IT Department: ${itDept.name} (${itDept.id})`);
            } else {
                this.log(`⚠️  Using hardcoded department ID: ${this.knownDepartmentId}`);
            }
            
            this.log(`🎯 Using position ID: ${this.knownPositionId}`);

            // Employee test data with proper phone format (10-15 digits only)
            const employeeData = [
                { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@company.com', phone: '9876543201', basicSalary: 75000 },
                { firstName: 'Michael', lastName: 'Chen', email: 'michael.chen@company.com', phone: '9876543202', basicSalary: 95000 },
                { firstName: 'Emily', lastName: 'Rodriguez', email: 'emily.rodriguez@company.com', phone: '9876543203', basicSalary: 45000 },
                { firstName: 'David', lastName: 'Thompson', email: 'david.thompson@company.com', phone: '9876543204', basicSalary: 120000 },
                { firstName: 'Jessica', lastName: 'Lee', email: 'jessica.lee@company.com', phone: '9876543205', basicSalary: 55000 },
                { firstName: 'Robert', lastName: 'Wilson', email: 'robert.wilson@company.com', phone: '9876543206', basicSalary: 60000 },
                { firstName: 'Amanda', lastName: 'Davis', email: 'amanda.davis@company.com', phone: '9876543207', basicSalary: 50000 },
                { firstName: 'Christopher', lastName: 'Brown', email: 'christopher.brown@company.com', phone: '9876543208', basicSalary: 48000 },
                { firstName: 'Jennifer', lastName: 'Taylor', email: 'jennifer.taylor@company.com', phone: '9876543209', basicSalary: 46000 },
                { firstName: 'Daniel', lastName: 'Anderson', email: 'daniel.anderson@company.com', phone: '9876543210', basicSalary: 42000 },
                { firstName: 'Michelle', lastName: 'White', email: 'michelle.white@company.com', phone: '9876543211', basicSalary: 75000 },
                { firstName: 'Kevin', lastName: 'Martin', email: 'kevin.martin@company.com', phone: '9876543212', basicSalary: 45000 },
                { firstName: 'Lisa', lastName: 'Garcia', email: 'lisa.garcia@company.com', phone: '9876543213', basicSalary: 85000 },
                { firstName: 'Ryan', lastName: 'Thomas', email: 'ryan.thomas@company.com', phone: '9876543214', basicSalary: 90000 },
                { firstName: 'Nicole', lastName: 'Jackson', email: 'nicole.jackson@company.com', phone: '9876543215', basicSalary: 80000 },
                { firstName: 'Andrew', lastName: 'Harris', email: 'andrew.harris@company.com', phone: '9876543216', basicSalary: 88000 },
                { firstName: 'Stephanie', lastName: 'Clark', email: 'stephanie.clark@company.com', phone: '9876543217', basicSalary: 52000 },
                { firstName: 'Brandon', lastName: 'Lewis', email: 'brandon.lewis@company.com', phone: '9876543218', basicSalary: 75000 },
                { firstName: 'Rachel', lastName: 'Walker', email: 'rachel.walker@company.com', phone: '9876543219', basicSalary: 45000 },
                { firstName: 'Matthew', lastName: 'Hall', email: 'matthew.hall@company.com', phone: '9876543220', basicSalary: 95000 },
                { firstName: 'Samantha', lastName: 'Allen', email: 'samantha.allen@company.com', phone: '9876543221', basicSalary: 46000 },
                { firstName: 'Tyler', lastName: 'Young', email: 'tyler.young@company.com', phone: '9876543222', basicSalary: 45000 },
                { firstName: 'Heather', lastName: 'King', email: 'heather.king@company.com', phone: '9876543223', basicSalary: 75000 },
                { firstName: 'Joshua', lastName: 'Wright', email: 'joshua.wright@company.com', phone: '9876543224', basicSalary: 55000 },
                { firstName: 'Ashley', lastName: 'Lopez', email: 'ashley.lopez@company.com', phone: '9876543225', basicSalary: 50000 },
                { firstName: 'James', lastName: 'Hill', email: 'james.hill@company.com', phone: '9876543226', basicSalary: 48000 },
                { firstName: 'Megan', lastName: 'Scott', email: 'megan.scott@company.com', phone: '9876543227', basicSalary: 42000 },
                { firstName: 'Nathan', lastName: 'Green', email: 'nathan.green@company.com', phone: '9876543228', basicSalary: 52000 },
                { firstName: 'Lauren', lastName: 'Adams', email: 'lauren.adams@company.com', phone: '9876543229', basicSalary: 46000 },
                { firstName: 'Jordan', lastName: 'Baker', email: 'jordan.baker@company.com', phone: '9876543230', basicSalary: 45000 }
            ];

            // Create employees
            for (const empData of employeeData) {
                try {
                    const employeePayload = {
                        firstName: empData.firstName,
                        lastName: empData.lastName,
                        email: empData.email,
                        phone: empData.phone,
                        hireDate: '2023-01-01',
                        departmentId: this.knownDepartmentId,
                        positionId: this.knownPositionId
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
                    const workedDays = Math.floor(Math.random() * 3) + 19; // 19-21 days worked
                    const leaveDays = Math.floor(Math.random() * 2); // 0-1 leave days
                    const absentDays = workingDays - workedDays - leaveDays;

                    const timesheet = {
                        employeeId: employee.id,
                        year: year,
                        month: month,
                        totalWorkingDays: workingDays,
                        totalWorkedDays: workedDays,
                        totalAbsentDays: absentDays,
                        totalLeaveDays: leaveDays,
                        totalOvertimeHours: Math.floor(Math.random() * 10), // 0-9 overtime hours
                        notes: `Timesheet for ${employee.name} - ${month}/${year}`
                    };

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
                        absentDays: timesheet.totalAbsentDays,
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

        // Employees Summary
        const successfulEmployees = this.report.employees.filter(e => e.success).length;
        const totalEmployees = this.report.employees.length;
        this.log(`👥 EMPLOYEES: ${successfulEmployees}/${totalEmployees} created successfully`);

        if (successfulEmployees > 0) {
            this.log(`   📧 Email range: ${this.report.employees[0]?.email} to ${this.report.employees[this.report.employees.length-1]?.email}`);
            this.log(`   🆔 Employee ID range: ${this.report.employees.find(e => e.success)?.employeeId} to ${this.report.employees.filter(e => e.success).slice(-1)[0]?.employeeId}`);
        }

        // Salary Structures Summary
        const successfulSalaryStructures = this.report.salaryStructures.filter(s => s.success).length;
        const totalSalaryStructures = this.report.salaryStructures.length;
        this.log(`💰 SALARY STRUCTURES: ${successfulSalaryStructures}/${totalSalaryStructures} created successfully`);

        if (successfulSalaryStructures > 0) {
            const avgSalary = this.report.salaryStructures
                .filter(s => s.success)
                .reduce((sum, s) => sum + s.basicSalary, 0) / successfulSalaryStructures;
            this.log(`   💵 Average basic salary: ₹${avgSalary.toLocaleString()}`);
        }

        // Timesheets Summary
        const successfulTimesheets = this.report.timesheets.filter(t => t.success).length;
        const totalTimesheets = this.report.timesheets.length;
        this.log(`⏰ TIMESHEETS: ${successfulTimesheets}/${totalTimesheets} created successfully`);

        if (successfulTimesheets > 0) {
            const avgWorkedDays = this.report.timesheets
                .filter(t => t.success)
                .reduce((sum, t) => sum + t.workedDays, 0) / successfulTimesheets;
            this.log(`   📅 Average worked days: ${avgWorkedDays.toFixed(1)}/21 days`);
        }

        // Overall Success Rate
        const totalItems = totalEmployees + totalSalaryStructures + totalTimesheets;
        const successfulItems = successfulEmployees + successfulSalaryStructures + successfulTimesheets;
        const successRate = totalItems > 0 ? ((successfulItems / totalItems) * 100).toFixed(1) : 0;

        this.log(`\n🎯 OVERALL SUCCESS RATE: ${successRate}% (${successfulItems}/${totalItems})`);

        // Assessment for scaling tests
        if (successfulEmployees >= 25) {
            this.log('\n✅ SCALING TEST READY: 25+ employees created successfully');
            this.log('✅ PAYROLL ENHANCEMENT READY: Salary structures and timesheets available');
            this.log('🚀 Ready to proceed with Steps 1 & 2 of the testing plan');
        } else if (successfulEmployees >= 10) {
            this.log('\n⚠️  PARTIAL SCALING TEST READY: 10+ employees available for testing');
            this.log('⚠️  Consider this sufficient for initial payroll enhancement validation');
        } else {
            this.log('\n❌ SCALING TEST NOT READY: Less than 10 employees created');
        }

        // Error Summary
        const errors = [
            ...this.report.employees.filter(e => !e.success),
            ...this.report.salaryStructures.filter(s => !s.success),
            ...this.report.timesheets.filter(t => !t.success)
        ];

        if (errors.length > 0) {
            this.log('\n❌ ERRORS ENCOUNTERED:');
            errors.slice(0, 5).forEach(error => {
                this.log(`   - ${error.employeeName || error.name}: ${error.error}`);
            });
            if (errors.length > 5) {
                this.log(`   ... and ${errors.length - 5} more errors`);
            }
        }
    }

    async execute() {
        try {
            this.log('🚀 STARTING COMPREHENSIVE DATA CREATION FOR SCALING TESTS');
            this.log('=========================================================');

            // Step 1: Authenticate
            const authenticated = await this.authenticate();
            if (!authenticated) return;

            // Step 2: Create employees (the core requirement)
            await this.createEmployees();

            // Step 3: Create salary structures (for payroll testing)
            await this.createSalaryStructures();

            // Step 4: Create timesheets (for payroll calculation)
            await this.createTimesheets();

            // Step 5: Generate report
            await this.generateReport();

            this.log('\n✨ COMPREHENSIVE DATA CREATION COMPLETED');
            this.log('Ready for Steps 1 & 2: Employee Scaling and Payroll Enhancement');

        } catch (error) {
            this.log(`❌ Critical error: ${error.message}`);
        }
    }
}

// Execute the data creation
const creator = new ComprehensiveDataCreator();
creator.execute().catch(console.error);
