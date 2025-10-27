import http from '../http-common';

class LeaveService {
  // Get all leaves (filtered by role)
  async getAll(params = {}) {
    const response = await http.get('/leaves', { params });
    return response.data;
  }

  // Get leave by ID
  async get(id) {
    const response = await http.get(`/leaves/${id}`);
    return response.data.data;
  }

  // Create leave request
  async create(data) {
    const response = await http.post('/leaves', data);
    return response.data.data;
  }

  // Update leave status (approve/reject)
  async updateStatus(id, status, comments = '') {
    const response = await http.put(`/leaves/${id}/status`, {
      status,
      comments
    });
    return response.data.data;
  }

  // Get leave balance
  async getBalance(employeeId = null) {
    const url = employeeId ? `/leaves/balance/${employeeId}` : '/leaves/balance';
    const response = await http.get(url);
    return response.data.data;
  }

  // Get leave types
  async getLeaveTypes() {
    const response = await http.get('/leaves/types');
    return response.data.data;
  }

  // Get leave calendar
  async getCalendar(params = {}) {
    const response = await http.get('/leaves/calendar', { params });
    return response.data.data;
  }

  // Get leave statistics
  async getStatistics(params = {}) {
    const response = await http.get('/leaves/statistics', { params });
    return response.data.data;
  }

  // Cancel leave request
  async cancel(id) {
    const response = await http.put(`/leaves/${id}/cancel`);
    return response.data.data;
  }
}

export const leaveService = new LeaveService();
