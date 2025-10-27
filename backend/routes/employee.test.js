
// backend/routes/employee.test.js
const request = require('supertest');
const app = require('../server');
const db = require('../models');
const { 
  setupTestDb, 
  cleanupTestDb, 
  generateTestToken, 
  generateMockEmployee,
  assertDatabaseHas 
} = require('../tests/testUtils');

describe('Employee API Endpoints', () => {
  let adminToken, employeeToken, testEmployee;

  beforeAll(async () => {
    await setupTestDb();
    
    // Create test tokens
    adminToken = generateTestToken('admin-id', 'admin');
    employeeToken = generateTestToken('employee-id', 'employee');
    
    // Create test employee
    testEmployee = await db.Employee.create(generateMockEmployee());
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe('GET /api/employees', () => {
    test('should return employees list for admin', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should return 401 for unauthenticated request', async () => {
      await request(app)
        .get('/api/employees')
        .expect(401);
    });

    test('should return 403 for non-admin user', async () => {
      await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });
  });

  describe('POST /api/employees', () => {
    test('should create new employee with valid data', async () => {
      const employeeData = generateMockEmployee();
      
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(employeeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(employeeData.email);
      
      // Verify employee was created in database
      await assertDatabaseHas('Employee', { 
        email: employeeData.email 
      });
    });

    test('should return 400 for invalid employee data', async () => {
      const invalidData = {
        // Missing required fields
        firstName: 'Test'
      };
      
      await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    test('should return 409 for duplicate email', async () => {
      const duplicateData = generateMockEmployee({
        email: testEmployee.email
      });
      
      await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData)
        .expect(409);
    });
  });

  describe('PUT /api/employees/:id', () => {
    test('should update employee with valid data', async () => {
      const updateData = {
        firstName: 'Updated Name'
      };
      
      const response = await request(app)
        .put(`/api/employees/${testEmployee.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
    });

    test('should return 404 for non-existent employee', async () => {
      await request(app)
        .put('/api/employees/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    test('should delete employee', async () => {
      const employeeToDelete = await db.Employee.create(generateMockEmployee());
      
      await request(app)
        .delete(`/api/employees/${employeeToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify employee was deleted
      const deletedEmployee = await db.Employee.findByPk(employeeToDelete.id);
      expect(deletedEmployee).toBeFalsy();
    });
  });
});
