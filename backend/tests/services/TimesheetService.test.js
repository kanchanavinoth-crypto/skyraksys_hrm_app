const TimesheetService = require('../../services/TimesheetService');
const db = require('../../models');
const { testDataHelpers } = require('../utils/testDataHelpers');

describe('TimesheetService', () => {
  let testEmployee, testProject, testTask;

  beforeEach(async () => {
    await testDataHelpers.clearTestData();
    
    // Create test data
    testEmployee = await testDataHelpers.createTestEmployee({
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test.employee@test.com'
    });

    testProject = await db.Project.create({
      name: 'Test Project',
      code: 'TP001',
      description: 'A test project',
      status: 'Active'
    });

    testTask = await db.Task.create({
      projectId: testProject.id,
      name: 'Test Task',
      description: 'A test task',
      status: 'Active'
    });
  });

  afterEach(async () => {
    await testDataHelpers.clearTestData();
  });

  describe('createTimeEntry', () => {
    it('should create a valid time entry', async () => {
      const timeData = {
        employeeId: testEmployee.id,
        projectId: testProject.id,
        taskId: testTask.id,
        date: new Date(),
        hours: 8,
        description: 'Working on test task'
      };

      const result = await TimesheetService.createTimeEntry(timeData);

      expect(result).toBeDefined();
      expect(result.employeeId).toBe(testEmployee.id);
      expect(result.projectId).toBe(testProject.id);
      expect(result.hours).toBe(8);
      expect(result.status).toBe('Draft');
    });

    it('should reject time entry with invalid hours', async () => {
      const timeData = {
        employeeId: testEmployee.id,
        projectId: testProject.id,
        taskId: testTask.id,
        date: new Date(),
        hours: 25, // Invalid: more than 24 hours
        description: 'Too many hours'
      };

      await expect(TimesheetService.createTimeEntry(timeData))
        .rejects.toThrow('Hours must be between 0 and 24');
    });

    it('should reject duplicate time entries', async () => {
      const timeData = {
        employeeId: testEmployee.id,
        projectId: testProject.id,
        taskId: testTask.id,
        date: new Date(),
        hours: 8,
        description: 'First entry'
      };

      // Create first entry
      await TimesheetService.createTimeEntry(timeData);

      // Try to create duplicate
      const duplicateData = {
        ...timeData,
        description: 'Duplicate entry'
      };

      await expect(TimesheetService.createTimeEntry(duplicateData))
        .rejects.toThrow('Time entry already exists for this date, project, and task');
    });

    it('should reject time entry exceeding daily limit', async () => {
      const today = new Date();
      
      // Create first entry with 20 hours
      await TimesheetService.createTimeEntry({
        employeeId: testEmployee.id,
        projectId: testProject.id,
        taskId: testTask.id,
        date: today,
        hours: 20,
        description: 'First entry'
      });

      // Create second task for different entry
      const task2 = await db.Task.create({
        projectId: testProject.id,
        name: 'Test Task 2',
        description: 'Another test task',
        status: 'Active'
      });

      // Try to add 8 more hours (would exceed 24)
      const timeData = {
        employeeId: testEmployee.id,
        projectId: testProject.id,
        taskId: task2.id,
        date: today,
        hours: 8,
        description: 'Second entry'
      };

      await expect(TimesheetService.createTimeEntry(timeData))
        .rejects.toThrow('Total daily hours cannot exceed 24 hours');
    });
  });

  describe('submitTimesheet', () => {
    it('should submit all draft entries for a week', async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week

      // Create time entries for the week
      for (let i = 0; i < 5; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        
        await TimesheetService.createTimeEntry({
          employeeId: testEmployee.id,
          projectId: testProject.id,
          taskId: testTask.id,
          date,
          hours: 8,
          description: `Day ${i + 1} work`
        });
      }

      const result = await TimesheetService.submitTimesheet(testEmployee.id, weekStart);

      expect(result).toHaveLength(5);
      result.forEach(entry => {
        expect(entry.status).toBe('Submitted');
        expect(entry.submittedAt).toBeDefined();
      });
    });

    it('should throw error when no time entries found', async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      await expect(TimesheetService.submitTimesheet(testEmployee.id, weekStart))
        .rejects.toThrow('No time entries found for the specified week');
    });
  });

  describe('approveTimesheet', () => {
    let timeEntries;

    beforeEach(async () => {
      // Create and submit time entries
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      timeEntries = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        
        const entry = await TimesheetService.createTimeEntry({
          employeeId: testEmployee.id,
          projectId: testProject.id,
          taskId: testTask.id,
          date,
          hours: 8,
          description: `Day ${i + 1} work`
        });

        // Update to submitted status
        await TimesheetService.updateTimeEntry(entry.id, { status: 'Submitted' });
        timeEntries.push(entry);
      }
    });

    it('should approve submitted time entries', async () => {
      const approverId = 1;
      const comments = 'All good';
      const timeEntryIds = timeEntries.map(entry => entry.id);

      const result = await TimesheetService.approveTimesheet(
        timeEntryIds,
        approverId,
        comments
      );

      expect(result).toHaveLength(3);
      result.forEach(entry => {
        expect(entry.status).toBe('Approved');
        expect(entry.approverId).toBe(approverId);
        expect(entry.approverComments).toBe(comments);
      });
    });
  });

  describe('getTimesheetSummary', () => {
    beforeEach(async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 6);

      // Create time entries
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        await TimesheetService.createTimeEntry({
          employeeId: testEmployee.id,
          projectId: testProject.id,
          taskId: testTask.id,
          date,
          hours: 8,
          description: `Day ${i + 1} work`
        });
      }
    });

    it('should return correct timesheet summary', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 6);

      const summary = await TimesheetService.getTimesheetSummary(
        testEmployee.id,
        startDate,
        endDate
      );

      expect(summary.totalHours).toBe(56); // 7 days * 8 hours
      expect(summary.totalDays).toBe(7);
      expect(summary.status.draft).toBe(7);
      expect(summary.projects[testProject.name]).toBeDefined();
      expect(summary.projects[testProject.name].hours).toBe(56);
    });
  });

  describe('validateTimeEntry', () => {
    it('should validate correct time entry data', async () => {
      const timeData = {
        employeeId: testEmployee.id,
        projectId: testProject.id,
        taskId: testTask.id,
        date: new Date(),
        hours: 8
      };

      const validation = await TimesheetService.validateTimeEntry(timeData);

      expect(validation.isValid).toBe(true);
    });

    it('should reject invalid employee ID', async () => {
      const timeData = {
        employeeId: 99999,
        projectId: testProject.id,
        taskId: testTask.id,
        date: new Date(),
        hours: 8
      };

      const validation = await TimesheetService.validateTimeEntry(timeData);

      expect(validation.isValid).toBe(false);
      expect(validation.message).toBe('Employee not found');
    });

    it('should reject task not belonging to project', async () => {
      // Create another project
      const otherProject = await db.Project.create({
        name: 'Other Project',
        code: 'OP001',
        status: 'Active'
      });

      const timeData = {
        employeeId: testEmployee.id,
        projectId: otherProject.id,
        taskId: testTask.id, // Task belongs to testProject, not otherProject
        date: new Date(),
        hours: 8
      };

      const validation = await TimesheetService.validateTimeEntry(timeData);

      expect(validation.isValid).toBe(false);
      expect(validation.message).toBe('Task does not belong to the specified project');
    });
  });

  describe('getProjectTimeReport', () => {
    beforeEach(async () => {
      // Create another employee
      const employee2 = await testDataHelpers.createTestEmployee({
        firstName: 'Second',
        lastName: 'Employee',
        email: 'second.employee@test.com'
      });

      const startDate = new Date();
      
      // Create time entries for both employees
      for (let i = 0; i < 5; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        // Employee 1
        await TimesheetService.createTimeEntry({
          employeeId: testEmployee.id,
          projectId: testProject.id,
          taskId: testTask.id,
          date,
          hours: 8,
          description: 'Employee 1 work'
        });

        // Employee 2
        await TimesheetService.createTimeEntry({
          employeeId: employee2.id,
          projectId: testProject.id,
          taskId: testTask.id,
          date,
          hours: 6,
          description: 'Employee 2 work'
        });
      }
    });

    it('should return correct project time report', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 6);

      const report = await TimesheetService.getProjectTimeReport(
        testProject.id,
        startDate,
        endDate
      );

      expect(report.totalHours).toBe(70); // (8 + 6) * 5 days
      expect(Object.keys(report.employees)).toHaveLength(2);
      expect(report.employees['Test Employee'].hours).toBe(40);
      expect(report.employees['Second Employee'].hours).toBe(30);
      expect(report.tasks[testTask.name].hours).toBe(70);
    });
  });
});
