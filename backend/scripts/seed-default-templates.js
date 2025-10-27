/**
 * Seed Default Payslip Templates
 * Creates standard templates for different employee categories
 */

const db = require('../models');
const { PayslipTemplate } = db;

const defaultTemplates = [
  {
    name: 'Standard Indian Payslip',
    description: 'Default template with all statutory fields for Indian employees. Includes PF, ESIC, PT, and TDS calculations.',
    version: '1.0',
    isDefault: true,
    isActive: true,
    templateData: {
      companyInfo: {
        fields: ['name', 'address', 'city', 'state', 'pincode', 'pan', 'tan', 'pfNumber', 'esicNumber'],
        logo: true,
        logoPosition: 'left',
        showCompanyName: true
      },
      employeeInfo: {
        fields: [
          'employeeId', 'name', 'designation', 'department', 'dateOfJoining',
          'panNumber', 'uanNumber', 'pfNumber', 'esiNumber', 'bankAccountNumber', 'bankName'
        ]
      },
      payPeriodInfo: {
        fields: ['payPeriod', 'payPeriodStart', 'payPeriodEnd', 'payDate', 'payslipNumber']
      },
      earnings: {
        title: 'Earnings',
        fields: [
          { name: 'basicSalary', label: 'Basic Salary', type: 'currency', required: true },
          { name: 'hra', label: 'House Rent Allowance (HRA)', type: 'currency', required: true },
          { name: 'transportAllowance', label: 'Transport Allowance', type: 'currency', required: false },
          { name: 'medicalAllowance', label: 'Medical Allowance', type: 'currency', required: false },
          { name: 'foodAllowance', label: 'Food Allowance', type: 'currency', required: false },
          { name: 'communicationAllowance', label: 'Communication Allowance', type: 'currency', required: false },
          { name: 'specialAllowance', label: 'Special Allowance', type: 'currency', required: false },
          { name: 'otherAllowance', label: 'Other Allowances', type: 'currency', required: false },
          { name: 'overtimePay', label: 'Overtime Pay', type: 'currency', required: false },
          { name: 'bonus', label: 'Bonus', type: 'currency', required: false },
          { name: 'arrears', label: 'Arrears', type: 'currency', required: false }
        ],
        showTotal: true,
        totalLabel: 'Gross Earnings'
      },
      deductions: {
        title: 'Deductions',
        fields: [
          { name: 'providentFund', label: 'Provident Fund (PF)', type: 'currency', required: true },
          { name: 'esic', label: 'ESI Contribution', type: 'currency', required: false },
          { name: 'professionalTax', label: 'Professional Tax', type: 'currency', required: true },
          { name: 'tds', label: 'TDS (Income Tax)', type: 'currency', required: false },
          { name: 'loanDeduction', label: 'Loan/Advance Deduction', type: 'currency', required: false },
          { name: 'medicalPremium', label: 'Medical Insurance', type: 'currency', required: false },
          { name: 'nps', label: 'NPS Contribution', type: 'currency', required: false },
          { name: 'voluntaryPF', label: 'Voluntary PF', type: 'currency', required: false },
          { name: 'otherDeductions', label: 'Other Deductions', type: 'currency', required: false }
        ],
        showTotal: true,
        totalLabel: 'Total Deductions'
      },
      attendance: {
        title: 'Attendance Summary',
        fields: [
          { name: 'totalWorkingDays', label: 'Total Working Days', type: 'number' },
          { name: 'presentDays', label: 'Present Days', type: 'number' },
          { name: 'absentDays', label: 'Absent Days', type: 'number' },
          { name: 'lopDays', label: 'LOP Days', type: 'number' },
          { name: 'paidDays', label: 'Paid Days', type: 'number' },
          { name: 'overtimeHours', label: 'Overtime Hours', type: 'number' },
          { name: 'weeklyOffs', label: 'Weekly Offs', type: 'number' },
          { name: 'holidays', label: 'Holidays', type: 'number' }
        ]
      },
      summary: {
        fields: [
          { name: 'grossEarnings', label: 'Gross Earnings', type: 'currency', bold: true },
          { name: 'totalDeductions', label: 'Total Deductions', type: 'currency', bold: true },
          { name: 'netPay', label: 'Net Pay', type: 'currency', bold: true, highlight: true }
        ],
        showInWords: true
      },
      footer: {
        fields: ['generatedDate', 'disclaimer', 'companySignature'],
        disclaimer: 'This is a computer-generated payslip and does not require a signature.'
      },
      styling: {
        primaryColor: '#2196F3',
        secondaryColor: '#FFC107',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        headerBackground: '#f5f5f5',
        borderColor: '#ddd',
        logoWidth: '100px',
        logoHeight: '50px'
      }
    }
  },
  {
    name: 'Basic Employee Template',
    description: 'Simplified template for entry-level employees with essential fields only. Ideal for small businesses.',
    version: '1.0',
    isDefault: false,
    isActive: true,
    templateData: {
      companyInfo: {
        fields: ['name', 'address', 'pan', 'pfNumber'],
        logo: true,
        logoPosition: 'center',
        showCompanyName: true
      },
      employeeInfo: {
        fields: ['employeeId', 'name', 'designation', 'department', 'bankAccountNumber', 'bankName']
      },
      payPeriodInfo: {
        fields: ['payPeriod', 'payDate', 'payslipNumber']
      },
      earnings: {
        title: 'Earnings',
        fields: [
          { name: 'basicSalary', label: 'Basic Salary', type: 'currency', required: true },
          { name: 'hra', label: 'House Rent Allowance', type: 'currency', required: true },
          { name: 'overtimePay', label: 'Overtime Pay', type: 'currency', required: false }
        ],
        showTotal: true,
        totalLabel: 'Gross Earnings'
      },
      deductions: {
        title: 'Deductions',
        fields: [
          { name: 'providentFund', label: 'Provident Fund', type: 'currency', required: true },
          { name: 'professionalTax', label: 'Professional Tax', type: 'currency', required: true }
        ],
        showTotal: true,
        totalLabel: 'Total Deductions'
      },
      attendance: {
        title: 'Attendance',
        fields: [
          { name: 'totalWorkingDays', label: 'Working Days', type: 'number' },
          { name: 'presentDays', label: 'Present Days', type: 'number' },
          { name: 'paidDays', label: 'Paid Days', type: 'number' }
        ]
      },
      summary: {
        fields: [
          { name: 'grossEarnings', label: 'Gross Earnings', type: 'currency', bold: true },
          { name: 'totalDeductions', label: 'Total Deductions', type: 'currency', bold: true },
          { name: 'netPay', label: 'Net Pay', type: 'currency', bold: true, highlight: true }
        ],
        showInWords: true
      },
      footer: {
        fields: ['generatedDate', 'disclaimer'],
        disclaimer: 'Computer-generated payslip. No signature required.'
      },
      styling: {
        primaryColor: '#4CAF50',
        secondaryColor: '#8BC34A',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        headerBackground: '#e8f5e9',
        borderColor: '#c8e6c9',
        logoWidth: '80px',
        logoHeight: '40px'
      }
    }
  },
  {
    name: 'Executive Compensation',
    description: 'Comprehensive template for senior management with detailed breakdowns, bonuses, and tax benefits.',
    version: '1.0',
    isDefault: false,
    isActive: true,
    templateData: {
      companyInfo: {
        fields: ['name', 'address', 'city', 'state', 'pincode', 'pan', 'tan', 'pfNumber', 'esicNumber'],
        logo: true,
        logoPosition: 'left',
        showCompanyName: true
      },
      employeeInfo: {
        fields: [
          'employeeId', 'name', 'designation', 'department', 'dateOfJoining', 'grade',
          'panNumber', 'uanNumber', 'pfNumber', 'bankAccountNumber', 'bankName', 'ifscCode'
        ]
      },
      payPeriodInfo: {
        fields: ['payPeriod', 'payPeriodStart', 'payPeriodEnd', 'payDate', 'payslipNumber']
      },
      earnings: {
        title: 'Earnings & Benefits',
        fields: [
          { name: 'basicSalary', label: 'Basic Salary', type: 'currency', required: true },
          { name: 'hra', label: 'House Rent Allowance', type: 'currency', required: true },
          { name: 'transportAllowance', label: 'Transport Allowance', type: 'currency', required: false },
          { name: 'medicalAllowance', label: 'Medical Allowance', type: 'currency', required: false },
          { name: 'communicationAllowance', label: 'Communication Allowance', type: 'currency', required: false },
          { name: 'specialAllowance', label: 'Executive Allowance', type: 'currency', required: false },
          { name: 'leaveEncashment', label: 'Leave Encashment', type: 'currency', required: false },
          { name: 'performanceBonus', label: 'Performance Bonus', type: 'currency', required: false },
          { name: 'retentionBonus', label: 'Retention Bonus', type: 'currency', required: false },
          { name: 'incentives', label: 'Incentives', type: 'currency', required: false },
          { name: 'overtimePay', label: 'Overtime Pay', type: 'currency', required: false },
          { name: 'arrears', label: 'Arrears', type: 'currency', required: false }
        ],
        showTotal: true,
        totalLabel: 'Total Gross Earnings'
      },
      deductions: {
        title: 'Deductions & Taxes',
        fields: [
          { name: 'providentFund', label: 'Employee PF Contribution', type: 'currency', required: true },
          { name: 'voluntaryPF', label: 'Voluntary PF', type: 'currency', required: false },
          { name: 'professionalTax', label: 'Professional Tax', type: 'currency', required: true },
          { name: 'tds', label: 'Income Tax (TDS)', type: 'currency', required: false },
          { name: 'nps', label: 'NPS Contribution', type: 'currency', required: false },
          { name: 'medicalPremium', label: 'Medical Insurance Premium', type: 'currency', required: false },
          { name: 'lifeInsurance', label: 'Life Insurance Premium', type: 'currency', required: false },
          { name: 'loanDeduction', label: 'Loan EMI', type: 'currency', required: false },
          { name: 'otherDeductions', label: 'Other Deductions', type: 'currency', required: false }
        ],
        showTotal: true,
        totalLabel: 'Total Deductions'
      },
      attendance: {
        title: 'Attendance Summary',
        fields: [
          { name: 'totalWorkingDays', label: 'Total Working Days', type: 'number' },
          { name: 'presentDays', label: 'Days Present', type: 'number' },
          { name: 'absentDays', label: 'Days Absent', type: 'number' },
          { name: 'lopDays', label: 'Loss of Pay Days', type: 'number' },
          { name: 'paidDays', label: 'Total Paid Days', type: 'number' },
          { name: 'paidLeaves', label: 'Paid Leaves', type: 'number' },
          { name: 'overtimeHours', label: 'Overtime Hours', type: 'number' },
          { name: 'weeklyOffs', label: 'Weekly Offs', type: 'number' },
          { name: 'holidays', label: 'Public Holidays', type: 'number' }
        ]
      },
      summary: {
        fields: [
          { name: 'grossEarnings', label: 'Total Gross Earnings', type: 'currency', bold: true },
          { name: 'totalDeductions', label: 'Total Deductions', type: 'currency', bold: true },
          { name: 'netPay', label: 'Net Salary Payable', type: 'currency', bold: true, highlight: true }
        ],
        showInWords: true
      },
      footer: {
        fields: ['generatedDate', 'disclaimer', 'companySignature', 'hrSignature'],
        disclaimer: 'This is a computer-generated salary statement and does not require physical signature.'
      },
      styling: {
        primaryColor: '#673AB7',
        secondaryColor: '#9C27B0',
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        headerBackground: '#ede7f6',
        borderColor: '#d1c4e9',
        logoWidth: '120px',
        logoHeight: '60px'
      }
    }
  },
  {
    name: 'Contract Worker Template',
    description: 'Template for contractual/temporary workers without PF/ESIC. Simplified structure for short-term employees.',
    version: '1.0',
    isDefault: false,
    isActive: true,
    templateData: {
      companyInfo: {
        fields: ['name', 'address', 'pan'],
        logo: true,
        logoPosition: 'left',
        showCompanyName: true
      },
      employeeInfo: {
        fields: ['employeeId', 'name', 'designation', 'contractPeriod', 'panNumber', 'bankAccountNumber', 'bankName']
      },
      payPeriodInfo: {
        fields: ['payPeriod', 'payDate', 'payslipNumber']
      },
      earnings: {
        title: 'Payment Details',
        fields: [
          { name: 'basicSalary', label: 'Contract Amount', type: 'currency', required: true },
          { name: 'specialAllowance', label: 'Additional Payment', type: 'currency', required: false },
          { name: 'overtimePay', label: 'Overtime Payment', type: 'currency', required: false },
          { name: 'bonus', label: 'Performance Bonus', type: 'currency', required: false }
        ],
        showTotal: true,
        totalLabel: 'Gross Payment'
      },
      deductions: {
        title: 'Deductions',
        fields: [
          { name: 'tds', label: 'TDS (if applicable)', type: 'currency', required: false },
          { name: 'professionalTax', label: 'Professional Tax', type: 'currency', required: false },
          { name: 'otherDeductions', label: 'Other Deductions', type: 'currency', required: false }
        ],
        showTotal: true,
        totalLabel: 'Total Deductions'
      },
      attendance: {
        title: 'Work Summary',
        fields: [
          { name: 'totalWorkingDays', label: 'Total Days', type: 'number' },
          { name: 'presentDays', label: 'Days Worked', type: 'number' },
          { name: 'overtimeHours', label: 'Extra Hours', type: 'number' }
        ]
      },
      summary: {
        fields: [
          { name: 'grossEarnings', label: 'Gross Payment', type: 'currency', bold: true },
          { name: 'totalDeductions', label: 'Deductions', type: 'currency', bold: true },
          { name: 'netPay', label: 'Net Payment', type: 'currency', bold: true, highlight: true }
        ],
        showInWords: true
      },
      footer: {
        fields: ['generatedDate', 'disclaimer'],
        disclaimer: 'Payment statement for contract services. No statutory benefits applicable.'
      },
      styling: {
        primaryColor: '#FF9800',
        secondaryColor: '#FFC107',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        headerBackground: '#fff3e0',
        borderColor: '#ffe0b2',
        logoWidth: '90px',
        logoHeight: '45px'
      }
    }
  }
];

async function seedDefaultTemplates() {
  try {
    console.log('🌱 Starting to seed default templates...');
    
    for (const templateData of defaultTemplates) {
      // Check if template already exists
      const existing = await PayslipTemplate.findOne({
        where: { name: templateData.name }
      });
      
      if (existing) {
        console.log(`⏭️  Template "${templateData.name}" already exists. Skipping...`);
        continue;
      }
      
      // Create template
      await PayslipTemplate.create(templateData);
      console.log(`✅ Created template: "${templateData.name}"`);
    }
    
    console.log('\n🎉 Default templates seeded successfully!');
    console.log('📋 Templates created:');
    defaultTemplates.forEach(t => console.log(`   - ${t.name}`));
    
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDefaultTemplates()
    .then(() => {
      console.log('\n✅ Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDefaultTemplates, defaultTemplates };
