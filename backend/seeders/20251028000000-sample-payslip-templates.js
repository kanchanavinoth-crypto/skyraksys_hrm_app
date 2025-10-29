'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    const templates = [
      {
        id: uuidv4(),
        name: 'Standard Monthly Payslip',
        description: 'Default template for monthly salary with all standard Indian payroll components',
        isDefault: true,
        isActive: true,
        headerFields: JSON.stringify([
          { id: 'companyName', label: 'Company Name', type: 'text' },
          { id: 'payPeriod', label: 'Pay Period', type: 'text' },
          { id: 'employeeName', label: 'Employee Name', type: 'text' },
          { id: 'employeeId', label: 'Employee ID', type: 'text' },
          { id: 'department', label: 'Department', type: 'text' },
          { id: 'designation', label: 'Designation', type: 'text' },
          { id: 'bankAccount', label: 'Bank Account', type: 'text' }
        ]),
        earningsFields: JSON.stringify([
          { id: 'basicSalary', label: 'Basic Salary', type: 'currency' },
          { id: 'hra', label: 'House Rent Allowance', type: 'currency' },
          { id: 'conveyance', label: 'Conveyance Allowance', type: 'currency' },
          { id: 'medical', label: 'Medical Allowance', type: 'currency' },
          { id: 'special', label: 'Special Allowance', type: 'currency' },
          { id: 'overtimePay', label: 'Overtime Pay', type: 'currency' },
          { id: 'grossSalary', label: 'Gross Salary', type: 'currency', calculated: true }
        ]),
        deductionsFields: JSON.stringify([
          { id: 'pfContribution', label: 'PF Contribution', type: 'currency' },
          { id: 'esi', label: 'ESI', type: 'currency' },
          { id: 'tds', label: 'TDS', type: 'currency' },
          { id: 'professionalTax', label: 'Professional Tax', type: 'currency' },
          { id: 'totalDeductions', label: 'Total Deductions', type: 'currency', calculated: true }
        ]),
        footerFields: JSON.stringify([
          { id: 'netSalary', label: 'Net Salary', type: 'currency', calculated: true },
          { id: 'netSalaryInWords', label: 'Net Salary in Words', type: 'text', calculated: true },
          { id: 'workingDays', label: 'Working Days', type: 'number' },
          { id: 'presentDays', label: 'Present Days', type: 'number' },
          { id: 'generatedDate', label: 'Generated Date', type: 'date' }
        ]),
        styling: JSON.stringify({
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          headingFontSize: '16px',
          primaryColor: '#1976d2',
          secondaryColor: '#424242',
          headerBackgroundColor: '#e3f2fd',
          footerBackgroundColor: '#f5f5f5',
          borderColor: '#e0e0e0',
          textColor: '#000000',
          labelColor: '#666666',
          pageSize: 'A4',
          orientation: 'portrait',
          margin: '20px',
          padding: '15px',
          borderWidth: '1px',
          borderStyle: 'solid',
          companyInfo: {
            name: 'SKYRAKSYS TECHNOLOGIES LLP',
            logo: null,
            logoPosition: 'left',
            logoSize: 'medium',
            address: 'Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai',
            email: 'info@skyraksys.com',
            phone: '+91 89398 88577',
            website: 'https://www.skyraksys.com',
            gst: '',
            cin: '',
            pan: ''
          },
          watermark: {
            enabled: false,
            text: 'CONFIDENTIAL',
            opacity: 0.1,
            fontSize: '48px',
            color: '#cccccc',
            rotation: -45
          },
          htmlTemplates: {
            header: '',
            footer: '',
            disclaimer: 'This is a computer-generated payslip and does not require a signature.'
          }
        }),
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Executive Payslip (Detailed)',
        description: 'Comprehensive template for executives with detailed breakdown of all allowances and deductions',
        isDefault: false,
        isActive: true,
        headerFields: JSON.stringify([
          { id: 'companyName', label: 'Company Name', type: 'text' },
          { id: 'companyAddress', label: 'Company Address', type: 'text' },
          { id: 'payPeriod', label: 'Pay Period', type: 'text' },
          { id: 'payslipNumber', label: 'Payslip Number', type: 'text' },
          { id: 'employeeName', label: 'Employee Name', type: 'text' },
          { id: 'employeeId', label: 'Employee ID', type: 'text' },
          { id: 'department', label: 'Department', type: 'text' },
          { id: 'designation', label: 'Designation', type: 'text' },
          { id: 'bankAccount', label: 'Bank Account', type: 'text' },
          { id: 'panNumber', label: 'PAN Number', type: 'text' }
        ]),
        earningsFields: JSON.stringify([
          { id: 'basicSalary', label: 'Basic Salary', type: 'currency' },
          { id: 'hra', label: 'House Rent Allowance', type: 'currency' },
          { id: 'conveyance', label: 'Conveyance Allowance', type: 'currency' },
          { id: 'medical', label: 'Medical Allowance', type: 'currency' },
          { id: 'special', label: 'Special Allowance', type: 'currency' },
          { id: 'overtimePay', label: 'Overtime Pay', type: 'currency' },
          { id: 'bonus', label: 'Performance Bonus', type: 'currency' },
          { id: 'grossSalary', label: 'Gross Salary', type: 'currency', calculated: true }
        ]),
        deductionsFields: JSON.stringify([
          { id: 'pfContribution', label: 'PF Contribution', type: 'currency' },
          { id: 'esi', label: 'ESI', type: 'currency' },
          { id: 'tds', label: 'TDS', type: 'currency' },
          { id: 'professionalTax', label: 'Professional Tax', type: 'currency' },
          { id: 'loanDeduction', label: 'Loan Deduction', type: 'currency' },
          { id: 'advanceDeduction', label: 'Advance Deduction', type: 'currency' },
          { id: 'totalDeductions', label: 'Total Deductions', type: 'currency', calculated: true }
        ]),
        footerFields: JSON.stringify([
          { id: 'netSalary', label: 'Net Salary', type: 'currency', calculated: true },
          { id: 'netSalaryInWords', label: 'Net Salary in Words', type: 'text', calculated: true },
          { id: 'workingDays', label: 'Working Days', type: 'number' },
          { id: 'presentDays', label: 'Present Days', type: 'number' },
          { id: 'leavesTaken', label: 'Leaves Taken', type: 'number' },
          { id: 'generatedDate', label: 'Generated Date', type: 'date' },
          { id: 'paymentDate', label: 'Payment Date', type: 'date' }
        ]),
        styling: JSON.stringify({
          fontFamily: 'Georgia, serif',
          fontSize: '12px',
          headingFontSize: '18px',
          primaryColor: '#7b1fa2',
          secondaryColor: '#4a148c',
          headerBackgroundColor: '#f3e5f5',
          footerBackgroundColor: '#fafafa',
          borderColor: '#9c27b0',
          textColor: '#000000',
          labelColor: '#666666',
          pageSize: 'A4',
          orientation: 'portrait',
          margin: '20px',
          padding: '20px',
          borderWidth: '2px',
          borderStyle: 'solid',
          companyInfo: {
            name: 'SKYRAKSYS TECHNOLOGIES LLP',
            logo: null,
            logoPosition: 'center',
            logoSize: 'large',
            address: 'Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai',
            email: 'info@skyraksys.com',
            phone: '+91 89398 88577',
            website: 'https://www.skyraksys.com',
            gst: '',
            cin: '',
            pan: ''
          },
          watermark: {
            enabled: true,
            text: 'EXECUTIVE PAYSLIP',
            opacity: 0.08,
            fontSize: '48px',
            color: '#9c27b0',
            rotation: -45
          },
          htmlTemplates: {
            header: '',
            footer: '<div style="text-align: center; font-size: 10px; color: #666;">Executive Compensation Statement</div>',
            disclaimer: 'This is a confidential document. Please do not share with unauthorized persons.'
          }
        }),
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Consultant/Contract Payslip',
        description: 'Simplified template for consultants and contract workers with minimal fields',
        isDefault: false,
        isActive: true,
        headerFields: JSON.stringify([
          { id: 'companyName', label: 'Company Name', type: 'text' },
          { id: 'payPeriod', label: 'Pay Period', type: 'text' },
          { id: 'employeeName', label: 'Consultant Name', type: 'text' },
          { id: 'employeeId', label: 'Consultant ID', type: 'text' },
          { id: 'panNumber', label: 'PAN Number', type: 'text' }
        ]),
        earningsFields: JSON.stringify([
          { id: 'basicSalary', label: 'Professional Fee', type: 'currency' },
          { id: 'bonus', label: 'Performance Incentive', type: 'currency' },
          { id: 'grossSalary', label: 'Gross Amount', type: 'currency', calculated: true }
        ]),
        deductionsFields: JSON.stringify([
          { id: 'tds', label: 'TDS', type: 'currency' },
          { id: 'totalDeductions', label: 'Total Deductions', type: 'currency', calculated: true }
        ]),
        footerFields: JSON.stringify([
          { id: 'netSalary', label: 'Net Payable', type: 'currency', calculated: true },
          { id: 'netSalaryInWords', label: 'Amount in Words', type: 'text', calculated: true },
          { id: 'workingDays', label: 'Working Days', type: 'number' },
          { id: 'generatedDate', label: 'Generated Date', type: 'date' },
          { id: 'paymentDate', label: 'Payment Date', type: 'date' }
        ]),
        styling: JSON.stringify({
          fontFamily: 'Helvetica, sans-serif',
          fontSize: '11px',
          headingFontSize: '14px',
          primaryColor: '#00695c',
          secondaryColor: '#004d40',
          headerBackgroundColor: '#e0f2f1',
          footerBackgroundColor: '#f5f5f5',
          borderColor: '#00897b',
          textColor: '#000000',
          labelColor: '#555555',
          pageSize: 'A4',
          orientation: 'portrait',
          margin: '15px',
          padding: '15px',
          borderWidth: '1px',
          borderStyle: 'solid',
          companyInfo: {
            name: 'SKYRAKSYS TECHNOLOGIES LLP',
            logo: null,
            logoPosition: 'left',
            logoSize: 'small',
            address: 'Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai',
            email: 'info@skyraksys.com',
            phone: '+91 89398 88577',
            website: 'https://www.skyraksys.com',
            gst: '',
            cin: '',
            pan: ''
          },
          watermark: {
            enabled: false,
            text: 'CONTRACTOR',
            opacity: 0.1,
            fontSize: '48px',
            color: '#cccccc',
            rotation: -45
          },
          htmlTemplates: {
            header: '',
            footer: '',
            disclaimer: 'Payment subject to deduction of applicable taxes at source.'
          }
        }),
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Intern Stipend Slip',
        description: 'Simple template for intern stipend with basic information',
        isDefault: false,
        isActive: true,
        headerFields: JSON.stringify([
          { id: 'companyName', label: 'Company Name', type: 'text' },
          { id: 'payPeriod', label: 'Period', type: 'text' },
          { id: 'employeeName', label: 'Intern Name', type: 'text' },
          { id: 'employeeId', label: 'Intern ID', type: 'text' },
          { id: 'department', label: 'Department', type: 'text' }
        ]),
        earningsFields: JSON.stringify([
          { id: 'basicSalary', label: 'Monthly Stipend', type: 'currency' },
          { id: 'grossSalary', label: 'Total Amount', type: 'currency', calculated: true }
        ]),
        deductionsFields: JSON.stringify([
          { id: 'totalDeductions', label: 'Total Deductions', type: 'currency', calculated: true }
        ]),
        footerFields: JSON.stringify([
          { id: 'netSalary', label: 'Net Payable', type: 'currency', calculated: true },
          { id: 'workingDays', label: 'Working Days', type: 'number' },
          { id: 'presentDays', label: 'Days Present', type: 'number' },
          { id: 'generatedDate', label: 'Generated Date', type: 'date' }
        ]),
        styling: JSON.stringify({
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          headingFontSize: '16px',
          primaryColor: '#388e3c',
          secondaryColor: '#1b5e20',
          headerBackgroundColor: '#e8f5e9',
          footerBackgroundColor: '#f5f5f5',
          borderColor: '#4caf50',
          textColor: '#000000',
          labelColor: '#666666',
          pageSize: 'A4',
          orientation: 'portrait',
          margin: '20px',
          padding: '15px',
          borderWidth: '1px',
          borderStyle: 'dashed',
          companyInfo: {
            name: 'SKYRAKSYS TECHNOLOGIES LLP',
            logo: null,
            logoPosition: 'left',
            logoSize: 'medium',
            address: 'Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai',
            email: 'info@skyraksys.com',
            phone: '+91 89398 88577',
            website: 'https://www.skyraksys.com',
            gst: '',
            cin: '',
            pan: ''
          },
          watermark: {
            enabled: true,
            text: 'INTERNSHIP',
            opacity: 0.05,
            fontSize: '60px',
            color: '#4caf50',
            rotation: -45
          },
          htmlTemplates: {
            header: '',
            footer: '',
            disclaimer: 'This stipend slip is for internship period only.'
          }
        }),
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('payslip_templates', templates, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('payslip_templates', null, {});
  }
};
