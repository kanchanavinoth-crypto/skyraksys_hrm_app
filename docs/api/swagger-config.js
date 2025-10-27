const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SkyrakSys HRM API',
      version: '1.0.0',
      description: `
# SkyrakSys HRM API Documentation

A comprehensive Human Resource Management System API built with Node.js and Express.

## Features
- **Employee Management**: Complete CRUD operations for employee data
- **Leave Management**: Leave requests, approvals, and balance tracking
- **Timesheet Management**: Time tracking and weekly submissions
- **Payroll System**: Payslip generation and salary calculations
- **Project Management**: Project and task tracking
- **Role-based Access Control**: Different permission levels for different roles
- **Reporting**: Comprehensive reports and analytics

## Authentication
This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Base URLs
- **Development**: http://localhost:8080/api
- **Production**: https://your-domain.com/api

## Response Format
All API responses follow a consistent format:
\`\`\`json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "error": null
}
\`\`\`

## Error Handling
Error responses include detailed information:
\`\`\`json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
\`\`\`

## User Roles
- **admin**: Full system access
- **hr_manager**: HR operations and employee management
- **team_lead**: Team management and approval workflows
- **employee**: Basic employee functions

## Pagination
List endpoints support pagination:
- **page**: Page number (default: 1)
- **limit**: Items per page (default: 10, max: 100)

## Date Formats
- **Date**: YYYY-MM-DD (e.g., 2024-01-15)
- **DateTime**: ISO 8601 format (e.g., 2024-01-15T10:30:00Z)

## File Uploads
File uploads are supported for:
- Employee profile pictures
- Document attachments
- Report exports

Maximum file size: 5MB per file
Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF

## Rate Limiting
API requests are rate-limited:
- **Authenticated users**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour

## Webhooks
The system supports webhooks for:
- Employee status changes
- Leave approvals/rejections
- Payroll generation
- Project updates

Contact your administrator to configure webhook endpoints.
      `,
      contact: {
        name: 'SkyrakSys Support',
        email: 'support@skyraksys.com',
        url: 'https://skyraksys.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8080/api',
        description: 'Development server'
      },
      {
        url: 'https://api.skyraksys.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.join(__dirname, './swagger-definitions.js'),
    path.join(__dirname, '../../backend/routes/*.js'),
    path.join(__dirname, '../../backend/controllers/*.js'),
    path.join(__dirname, '../../backend/models/*.js')
  ],
};

const specs = swaggerJSDoc(options);

// Custom CSS for Swagger UI
const customCss = `
  .swagger-ui .topbar { display: none }
  .swagger-ui .info { margin: 50px 0 }
  .swagger-ui .info .title { color: #2c3e50; }
  .swagger-ui .scheme-container { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
  .swagger-ui .btn.authorize { background-color: #3498db; border-color: #3498db; }
  .swagger-ui .btn.authorize:hover { background-color: #2980b9; }
  .swagger-ui .opblock.opblock-post { border-color: #27ae60; }
  .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #27ae60; background: rgba(39,174,96,.1); }
  .swagger-ui .opblock.opblock-get { border-color: #3498db; }
  .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #3498db; background: rgba(52,152,219,.1); }
  .swagger-ui .opblock.opblock-put { border-color: #f39c12; }
  .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #f39c12; background: rgba(243,156,18,.1); }
  .swagger-ui .opblock.opblock-delete { border-color: #e74c3c; }
  .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #e74c3c; background: rgba(231,76,60,.1); }
  .swagger-ui .opblock.opblock-patch { border-color: #9b59b6; }
  .swagger-ui .opblock.opblock-patch .opblock-summary { border-color: #9b59b6; background: rgba(155,89,182,.1); }
`;

const swaggerOptions = {
  customCss,
  customSiteTitle: "SkyrakSys HRM API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};
