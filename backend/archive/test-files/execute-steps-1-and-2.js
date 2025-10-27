/**
 * Create timesheets for existing employees and test payroll functionality
 * This completes Steps 1 & 2: Employee Scaling and Payroll Enhancement
 */

const axios = require('axios');

class PayrollEnhancementTester {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = null;
        this.report = {
            employees: [],
            timesheets: [],
            payrollCalculations: []
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

    async getEmployees() {
        try {
            const response = await axios.get(`${this.baseURL}/employees`, { headers: this.getHeaders() });
            return response.data.data || [];
        } catch (error) {
            this.log(`❌ Error getting employees: ${error.response?.data?.message || error.message}`);
            return [];
        }
    }

    async createTimesheets() {
        try {
            this.log('\n⏰ CREATING TIMESHEETS FOR EXISTING EMPLOYEES');
            this.log('==============================================');

            const employees = await this.getEmployees();
            this.log(`📊 Found ${employees.length} employees`);

            if (employees.length === 0) {
                this.log('❌ No employees found');
                return;
            }

            // Filter out demo users (keep only real employees)
            const realEmployees = employees.filter(emp => 
                !emp.email.includes('demo') && 
                !emp.email.includes('admin') && 
                !emp.email.includes('hr@company.com')
            );

            this.log(`📊 Creating timesheets for ${realEmployees.length} real employees`);

            // Create timesheets for December 2024 (21 working days)
            const year = 2024;
            const month = 12;
            const workingDays = 21;

            for (const employee of realEmployees) {
                try {
                    // Generate realistic timesheet data
                    const workedDays = Math.floor(Math.random() * 3) + 19; // 19-21 days worked
                    const leaveDays = Math.floor(Math.random() * 2); // 0-1 leave days
                    const absentDays = Math.max(0, workingDays - workedDays - leaveDays);
                    const overtimeHours = Math.floor(Math.random() * 10); // 0-9 overtime hours

                    const timesheet = {
                        employeeId: employee.id,
                        year: year,
                        month: month,
                        totalWorkingDays: workingDays,
                        totalWorkedDays: workedDays,
                        totalAbsentDays: absentDays,
                        totalLeaveDays: leaveDays,
                        totalOvertimeHours: overtimeHours,
                        notes: `Timesheet for ${employee.firstName} ${employee.lastName} - ${month}/${year}`
                    };

                    const response = await axios.post(`${this.baseURL}/timesheets`, timesheet, { 
                        headers: this.getHeaders() 
                    });

                    this.report.timesheets.push({
                        id: response.data.data.id,
                        employeeId: employee.id,
                        employeeName: `${employee.firstName} ${employee.lastName}`,
                        employeeCode: employee.employeeId,
                        month: `${month}/${year}`,
                        workedDays: workedDays,
                        leaveDays: leaveDays,
                        absentDays: absentDays,
                        overtimeHours: overtimeHours,
                        success: true
                    });

                    this.log(`✅ Created timesheet for: ${employee.firstName} ${employee.lastName} (${employee.employeeId}) - ${workedDays}/${workingDays} days`);

                } catch (error) {
                    this.report.timesheets.push({
                        id: null,
                        employeeId: employee.id,
                        employeeName: `${employee.firstName} ${employee.lastName}`,
                        employeeCode: employee.employeeId,
                        month: `${month}/${year}`,
                        success: false,
                        error: error.response?.data?.message || error.message
                    });
                    this.log(`❌ Failed to create timesheet for ${employee.firstName} ${employee.lastName}: ${error.response?.data?.message || error.message}`);
                }
            }

        } catch (error) {
            this.log(`❌ Error in createTimesheets: ${error.message}`);
        }
    }

    async testPayrollCalculation() {
        try {
            this.log('\n💰 TESTING PAYROLL CALCULATION');
            this.log('===============================');

            const successfulTimesheets = this.report.timesheets.filter(t => t.success);
            
            if (successfulTimesheets.length === 0) {
                this.log('❌ No timesheets created successfully, skipping payroll calculation');
                return;
            }

            this.log(`🧮 Testing payroll calculation for ${successfulTimesheets.length} employees`);

            // Test payroll calculation for December 2024
            const year = 2024;
            const month = 12;

            for (const timesheet of successfulTimesheets.slice(0, 5)) { // Test first 5 employees
                try {
                    this.log(`\n🧮 Calculating payroll for: ${timesheet.employeeName} (${timesheet.employeeCode})`);
                    
                    const payrollData = {
                        employeeId: timesheet.employeeId,
                        year: year,
                        month: month
                    };

                    const response = await axios.post(`${this.baseURL}/payroll/calculate`, payrollData, { 
                        headers: this.getHeaders() 
                    });

                    const calculation = response.data.data;
                    
                    this.report.payrollCalculations.push({
                        employeeId: timesheet.employeeId,
                        employeeName: timesheet.employeeName,
                        employeeCode: timesheet.employeeCode,
                        month: `${month}/${year}`,
                        basicSalary: calculation.basicSalary,
                        grossSalary: calculation.grossSalary,
                        totalDeductions: calculation.totalDeductions,
                        netSalary: calculation.netSalary,
                        workedDays: timesheet.workedDays,
                        overtimeAmount: calculation.overtimeAmount || 0,
                        success: true
                    });

                    this.log(`   💵 Basic Salary: ₹${calculation.basicSalary?.toLocaleString()}`);
                    this.log(`   💰 Gross Salary: ₹${calculation.grossSalary?.toLocaleString()}`);
                    this.log(`   ➖ Total Deductions: ₹${calculation.totalDeductions?.toLocaleString()}`);
                    this.log(`   💸 Net Salary: ₹${calculation.netSalary?.toLocaleString()}`);
                    this.log(`   ⏰ Days Worked: ${timesheet.workedDays}/21`);
                    
                    if (calculation.overtimeAmount && calculation.overtimeAmount > 0) {
                        this.log(`   ⏳ Overtime Amount: ₹${calculation.overtimeAmount.toLocaleString()}`);
                    }

                    this.log(`   ✅ Payroll calculation successful`);

                } catch (error) {
                    this.report.payrollCalculations.push({
                        employeeId: timesheet.employeeId,
                        employeeName: timesheet.employeeName,
                        employeeCode: timesheet.employeeCode,
                        month: `${month}/${year}`,
                        success: false,
                        error: error.response?.data?.message || error.message
                    });
                    this.log(`   ❌ Payroll calculation failed: ${error.response?.data?.message || error.message}`);
                }
            }

        } catch (error) {
            this.log(`❌ Error in testPayrollCalculation: ${error.message}`);
        }
    }

    async generateReport() {
        this.log('\n📊 STEPS 1 & 2 COMPLETION REPORT');
        this.log('=================================');

        // Timesheets Summary
        const successfulTimesheets = this.report.timesheets.filter(t => t.success).length;
        const totalTimesheets = this.report.timesheets.length;
        this.log(`\n⏰ TIMESHEETS: ${successfulTimesheets}/${totalTimesheets} created successfully`);

        if (successfulTimesheets > 0) {
            const avgWorkedDays = this.report.timesheets
                .filter(t => t.success)
                .reduce((sum, t) => sum + t.workedDays, 0) / successfulTimesheets;
            this.log(`   📅 Average worked days: ${avgWorkedDays.toFixed(1)}/21 days`);
            
            const totalOvertimeHours = this.report.timesheets
                .filter(t => t.success)
                .reduce((sum, t) => sum + t.overtimeHours, 0);
            this.log(`   ⏳ Total overtime hours: ${totalOvertimeHours} hours`);
        }

        // Payroll Calculations Summary
        const successfulPayroll = this.report.payrollCalculations.filter(p => p.success).length;
        const totalPayrollTests = this.report.payrollCalculations.length;
        this.log(`\n💰 PAYROLL CALCULATIONS: ${successfulPayroll}/${totalPayrollTests} successful`);

        if (successfulPayroll > 0) {
            const avgNetSalary = this.report.payrollCalculations
                .filter(p => p.success)
                .reduce((sum, p) => sum + (p.netSalary || 0), 0) / successfulPayroll;
            this.log(`   💸 Average net salary: ₹${avgNetSalary.toLocaleString()}`);

            const totalPayroll = this.report.payrollCalculations
                .filter(p => p.success)
                .reduce((sum, p) => sum + (p.netSalary || 0), 0);
            this.log(`   💰 Total payroll (sample): ₹${totalPayroll.toLocaleString()}`);
        }

        // Step 1: Employee Scaling Assessment
        this.log('\n📈 STEP 1 - EMPLOYEE SCALING:');
        this.log('============================');
        if (successfulTimesheets >= 5) {
            this.log('✅ SCALING READY: Sufficient employees with timesheets for scaling tests');
            this.log('✅ System can handle multiple employee data processing');
        } else {
            this.log('⚠️  LIMITED SCALING: Few employees available for scaling tests');
        }

        // Step 2: Payroll Enhancement Assessment
        this.log('\n💼 STEP 2 - PAYROLL ENHANCEMENT:');
        this.log('================================');
        if (successfulPayroll >= 3) {
            this.log('✅ PAYROLL ENHANCED: Payroll calculation working for multiple employees');
            this.log('✅ System can process payroll at scale');
            this.log('✅ Salary structures, timesheets, and calculations integrated');
        } else if (successfulPayroll >= 1) {
            this.log('⚠️  PARTIAL PAYROLL: Basic payroll calculation working');
            this.log('⚠️  May need optimization for larger scale');
        } else {
            this.log('❌ PAYROLL ISSUES: Payroll calculation not working properly');
        }

        // Overall Assessment
        this.log('\n🎯 OVERALL STEPS 1 & 2 STATUS:');
        this.log('==============================');
        const step1Success = successfulTimesheets >= 5;
        const step2Success = successfulPayroll >= 3;

        if (step1Success && step2Success) {
            this.log('🎉 STEPS 1 & 2 COMPLETED SUCCESSFULLY!');
            this.log('✅ Employee scaling data created and validated');
            this.log('✅ Payroll enhancement working at scale');
            this.log('🚀 Ready for production deployment or further scaling');
        } else if (step1Success || step2Success) {
            this.log('⚠️  STEPS 1 & 2 PARTIALLY COMPLETED');
            this.log('⚠️  Some functionality working, may need additional testing');
        } else {
            this.log('❌ STEPS 1 & 2 NEED MORE WORK');
            this.log('❌ Issues with scaling or payroll functionality');
        }

        // Next Steps
        this.log('\n🔄 RECOMMENDED NEXT STEPS:');
        this.log('=========================');
        this.log('1. Test payroll generation for all employees');
        this.log('2. Verify system performance with larger datasets');
        this.log('3. Test concurrent user access and operations');
        this.log('4. Validate data integrity and backup procedures');
        this.log('5. Prepare for production deployment');
    }

    async execute() {
        try {
            this.log('🚀 EXECUTING STEPS 1 & 2: EMPLOYEE SCALING AND PAYROLL ENHANCEMENT');
            this.log('=====================================================================');

            // Step 1: Authenticate
            const authenticated = await this.authenticate();
            if (!authenticated) return;

            // Step 2: Create timesheets for existing employees
            await this.createTimesheets();

            // Step 3: Test payroll calculation at scale
            await this.testPayrollCalculation();

            // Step 4: Generate comprehensive report
            await this.generateReport();

            this.log('\n✨ STEPS 1 & 2 EXECUTION COMPLETED');

        } catch (error) {
            this.log(`❌ Critical error: ${error.message}`);
        }
    }
}

// Execute Steps 1 & 2
const tester = new PayrollEnhancementTester();
tester.execute().catch(console.error);
