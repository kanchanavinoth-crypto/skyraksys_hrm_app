import http from '../http-common';
import logger from '../utils/logger';

class TimesheetService {
  // Get all timesheets (filtered by role)
  async getAll(params = {}) {
    const response = await http.get('/timesheets', { params });
    return response.data;
  }

  // Get timesheet by ID
  async get(id) {
    const response = await http.get(`/timesheets/${id}`);
    return response.data.data;
  }

  // Create timesheet entry (save as draft)
  async create(data) {
    const response = await http.post('/timesheets', data);
    return response.data.data;
  }

  // Create and submit timesheet entry
  async createAndSubmit(data) {
    const response = await http.post('/timesheets/submit', data);
    return response.data.data;
  }

  // Update timesheet status (approve/reject)
  async updateStatus(id, status, comments = '') {
    // Map status values to match backend expectations
    const action = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : status;
    
    const response = await http.put(`/timesheets/${id}/approve`, {
      action,
      approverComments: comments
    });
    return response.data.data;
  }

  // Submit timesheet for approval
  async submit(id) {
    const response = await http.put(`/timesheets/${id}/submit`);
    return response.data.data;
  }

  // Resubmit rejected timesheet
  async resubmit(id, comments = '') {
    const response = await http.put(`/timesheets/${id}/resubmit`, {
      comments
    });
    return response.data.data;
  }

  // Update timesheet data
  async update(id, data) {
    const response = await http.put(`/timesheets/${id}`, data);
    return response.data.data;
  }

  // Get timesheet summary
  async getSummary(employeeId = null, params = {}) {
    const url = employeeId 
      ? `/timesheets/employee/${employeeId}/summary` 
      : '/timesheets/summary';
    const response = await http.get(url, { params });
    return response.data.data;
  }

  // Get projects
  async getProjects() {
    const response = await http.get('/projects');
    return response.data.data;
  }

  // Get tasks for a project
  async getTasks(projectId) {
    const response = await http.get(`/projects/${projectId}/tasks`);
    return response.data.data;
  }

  // Clock in/out
  async clockIn(data) {
    const response = await http.post('/timesheets/clock-in', data);
    return response.data.data;
  }

  async clockOut(id, data) {
    const response = await http.post(`/timesheets/${id}/clock-out`, data);
    return response.data.data;
  }

  // Get weekly timesheet view
  async getWeeklyView(employeeId = null, year = null, week = null) {
    const url = employeeId 
      ? `/timesheets/weekly/${employeeId}`
      : '/timesheets/weekly';
    
    const params = {};
    if (year) params.year = year;
    if (week) params.week = week;
    
    const response = await http.get(url, { params });
    return response.data.data;
  }

  // Get timesheet history for an employee
  async getHistory(employeeId = null, params = {}) {
    const url = employeeId && (params.userRole === 'admin' || params.userRole === 'hr')
      ? `/timesheets?employeeId=${employeeId}`
      : '/timesheets';
    
    const response = await http.get(url, { params: { ...params, limit: 50, sortBy: 'workDate', sortOrder: 'DESC' } });
    return response.data;
  }

  // Get timesheets by week
  async getByWeek(weekStartDate) {
    logger.debug('🔍 TimesheetService.getByWeek called with:', weekStartDate);
    const params = { startDate: weekStartDate };
    logger.debug('📡 API call params:', params);
    
    const response = await http.get('/timesheets', { params });
    logger.debug('📊 Server response:', response);
    logger.debug('📊 Raw response data:', response.data);
    
    // Detailed data analysis
    if (response.data && response.data.data && response.data.data.length > 0) {
      logger.debug('📋 TIMESHEET DATA ANALYSIS for week:', weekStartDate);
      logger.debug('📋 Total timesheets found:', response.data.data.length);
      
      response.data.data.forEach((timesheet, index) => {
        logger.debug(`📋 Timesheet ${index + 1}:`, {
          id: timesheet.id,
          weekStartDate: timesheet.weekStartDate,
          weekEndDate: timesheet.weekEndDate,
          weekNumber: timesheet.weekNumber,
          year: timesheet.year,
          status: timesheet.status,
          projectId: timesheet.projectId,
          taskId: timesheet.taskId,
          totalHours: timesheet.totalHoursWorked,
          days: {
            mon: timesheet.mondayHours,
            tue: timesheet.tuesdayHours,
            wed: timesheet.wednesdayHours,
            thu: timesheet.thursdayHours,
            fri: timesheet.fridayHours,
            sat: timesheet.saturdayHours,
            sun: timesheet.sundayHours
          }
        });
      });
      
      // Check if all timesheets belong to the requested week
      const requestedWeekStart = weekStartDate;
      const mismatchedTimesheets = response.data.data.filter(ts => ts.weekStartDate !== requestedWeekStart);
      if (mismatchedTimesheets.length > 0) {
        logger.warn('⚠️ WEEK MISMATCH DETECTED:', {
          requested: requestedWeekStart,
          mismatched: mismatchedTimesheets.map(ts => ({
            id: ts.id,
            actualWeekStart: ts.weekStartDate,
            status: ts.status
          }))
        });
      }
      
      // Status summary
      const statusCounts = response.data.data.reduce((acc, ts) => {
        acc[ts.status] = (acc[ts.status] || 0) + 1;
        return acc;
      }, {});
      logger.debug('📊 Status summary:', statusCounts);
    }
    
    return response;
  }

  // Get weekly timesheets for approval (managers/admin)
  async getWeeklyForApproval(employeeId = null, year = null, week = null, status = 'Submitted') {
    const url = employeeId 
      ? `/timesheets/approval/weekly/${employeeId}`
      : '/timesheets/approval/weekly';
    
    const params = { status };
    if (year) params.year = year;
    if (week) params.week = week;
    
    const response = await http.get(url, { params });
    return response.data.data;
  }

  // Bulk submit multiple timesheets
  async bulkSubmit(timesheetIds) {
    const response = await http.post('/timesheets/bulk-submit', {
      timesheetIds
    });
    return response.data;
  }

  // Bulk save multiple timesheets
  async bulkSave(timesheets) {
    const response = await http.post('/timesheets/bulk-save', {
      timesheets
    });
    return response.data;
  }

  // Bulk update multiple timesheets
  async bulkUpdate(timesheets) {
    const response = await http.put('/timesheets/bulk-update', {
      timesheets
    });
    return response.data;
  }

  // Bulk approve multiple timesheets
  async bulkApprove(timesheetIds, comments = '') {
    const response = await http.post('/timesheets/bulk-approve', {
      timesheetIds,
      approverComments: comments
    });
    return response.data;
  }

  // Bulk reject multiple timesheets
  async bulkReject(timesheetIds, comments) {
    const response = await http.post('/timesheets/bulk-reject', {
      timesheetIds,
      approverComments: comments
    });
    return response.data;
  }
}

export const timesheetService = new TimesheetService();
