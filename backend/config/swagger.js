const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SKYRAKSYS HRM - Payslip Management API',
      version: '1.0.0',
      description: 'Comprehensive Payslip Management System API Documentation',
      contact: {
        name: 'SKYRAKSYS Team',
        email: 'support@skyraksys.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? (process.env.API_BASE_URL || 'https://your-domain.com/api')
          : 'http://localhost:5000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              example: 100
            },
            page: {
              type: 'integer',
              example: 1
            },
            limit: {
              type: 'integer',
              example: 20
            },
            pages: {
              type: 'integer',
              example: 5
            }
          }
        },
        Employee: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            employeeId: {
              type: 'string',
              example: 'EMP001'
            },
            firstName: {
              type: 'string',
              example: 'John'
            },
            lastName: {
              type: 'string',
              example: 'Doe'
            },
            email: {
              type: 'string',
              example: 'john.doe@company.com'
            },
            department: {
              type: 'string',
              example: 'Engineering'
            },
            position: {
              type: 'string',
              example: 'Software Engineer'
            }
          }
        },
        Payslip: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            employeeId: {
              type: 'integer',
              example: 1
            },
            month: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              example: 9
            },
            year: {
              type: 'integer',
              minimum: 2020,
              maximum: 2030,
              example: 2025
            },
            templateId: {
              type: 'integer',
              example: 1
            },
            payrollDataId: {
              type: 'integer',
              example: 1
            },
            employeeInfo: {
              type: 'object',
              description: 'Employee details snapshot'
            },
            companyInfo: {
              type: 'object',
              description: 'Company information'
            },
            earnings: {
              type: 'object',
              example: {
                basicSalary: 50000,
                hra: 15000,
                conveyanceAllowance: 2000,
                medicalAllowance: 1500
              }
            },
            deductions: {
              type: 'object',
              example: {
                providentFund: 6000,
                esic: 375,
                professionalTax: 200,
                tds: 2000
              }
            },
            attendance: {
              type: 'object',
              properties: {
                totalWorkingDays: {
                  type: 'integer',
                  example: 21
                },
                presentDays: {
                  type: 'integer',
                  example: 21
                },
                absentDays: {
                  type: 'integer',
                  example: 0
                },
                lopDays: {
                  type: 'integer',
                  example: 0
                },
                paidDays: {
                  type: 'integer',
                  example: 21
                },
                overtimeHours: {
                  type: 'number',
                  example: 0
                }
              }
            },
            grossEarnings: {
              type: 'number',
              format: 'decimal',
              example: 68500.00
            },
            totalDeductions: {
              type: 'number',
              format: 'decimal',
              example: 8575.00
            },
            netPay: {
              type: 'number',
              format: 'decimal',
              example: 59925.00
            },
            netPayInWords: {
              type: 'string',
              example: 'Fifty Nine Thousand Nine Hundred Twenty Five Rupees Only'
            },
            payslipNumber: {
              type: 'string',
              example: 'PS20250901'
            },
            status: {
              type: 'string',
              enum: ['draft', 'finalized', 'paid', 'cancelled'],
              example: 'draft'
            },
            isLocked: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        PayslipTemplate: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'Default Payslip Template'
            },
            description: {
              type: 'string',
              example: 'Standard template with Indian statutory deductions'
            },
            templateData: {
              type: 'object',
              properties: {
                earnings: {
                  type: 'object',
                  description: 'Earnings configuration'
                },
                deductions: {
                  type: 'object',
                  description: 'Deductions configuration'
                },
                calculations: {
                  type: 'object',
                  description: 'Calculation rules'
                }
              }
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            isDefault: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        SalaryStructure: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            employeeId: {
              type: 'integer',
              example: 1
            },
            earnings: {
              type: 'object',
              example: {
                basicSalary: 50000,
                hra: 15000,
                conveyanceAllowance: 2000
              }
            },
            deductions: {
              type: 'object',
              example: {
                providentFund: 6000,
                esic: 375
              }
            },
            effectiveDate: {
              type: 'string',
              format: 'date',
              example: '2025-01-01'
            },
            ctc: {
              type: 'number',
              format: 'decimal',
              example: 800000.00
            },
            grossSalary: {
              type: 'number',
              format: 'decimal',
              example: 67000.00
            },
            netSalary: {
              type: 'number',
              format: 'decimal',
              example: 58500.00
            },
            payrollFrequency: {
              type: 'string',
              enum: ['monthly', 'biweekly', 'weekly'],
              example: 'monthly'
            },
            isActive: {
              type: 'boolean',
              example: true
            }
          }
        },
        PayrollData: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            employeeId: {
              type: 'integer',
              example: 1
            },
            salaryStructureId: {
              type: 'integer',
              example: 1
            },
            month: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              example: 9
            },
            year: {
              type: 'integer',
              example: 2025
            },
            earnings: {
              type: 'object',
              description: 'Monthly earnings data'
            },
            deductions: {
              type: 'object',
              description: 'Monthly deductions data'
            },
            attendance: {
              type: 'object',
              description: 'Attendance information'
            },
            grossEarnings: {
              type: 'number',
              format: 'decimal',
              example: 68500.00
            },
            totalDeductions: {
              type: 'number',
              format: 'decimal',
              example: 8575.00
            },
            netPay: {
              type: 'number',
              format: 'decimal',
              example: 59925.00
            },
            status: {
              type: 'string',
              enum: ['draft', 'submitted', 'approved', 'rejected'],
              example: 'draft'
            },
            workingDays: {
              type: 'integer',
              example: 21
            },
            presentDays: {
              type: 'integer',
              example: 21
            },
            lopDays: {
              type: 'integer',
              example: 0
            },
            overtimeHours: {
              type: 'number',
              example: 0
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Admin Config',
        description: 'Admin-only configuration and diagnostics'
      },
      {
        name: 'Payslips',
        description: 'Payslip management operations'
      },
      {
        name: 'Payslip Templates',
        description: 'Template configuration and management'
      },
      {
        name: 'Salary Structures',
        description: 'Employee salary structure management'
      },
      {
        name: 'Payroll Data',
        description: 'Payroll processing and approval workflow'
      },
      {
        name: 'Employees',
        description: 'Employee management operations'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './routes/**/*.js'
  ]
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    syntaxHighlight: {
      theme: 'arta'
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info hgroup.main h2 { color: #3b82f6 }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; }
  `,
  customSiteTitle: 'SKYRAKSYS HRM API Documentation'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};