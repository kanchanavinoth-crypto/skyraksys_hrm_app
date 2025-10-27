import http from "../http-common";

class TimesheetDataService {
  getAll() {
    return http.get("/timesheets");
  }

  get(id) {
    return http.get(`/timesheets/${id}`);
  }

  create(data) {
    return http.post("/timesheets", data);
  }

  update(id, data) {
    return http.put(`/timesheets/${id}`, data);
  }

  delete(id) {
    return http.delete(`/timesheets/${id}`);
  }

  clockIn(employeeId) {
    return http.post("/timesheets/clock-in", { employeeId });
  }

  clockOut(employeeId) {
    return http.post("/timesheets/clock-out", { employeeId });
  }

  submit(id) {
    return http.put(`/timesheets/${id}/submit`);
  }

  approve(id, approverId) {
    return http.put(`/timesheets/${id}/approve`, { approverId });
  }

  reject(id, reason) {
    return http.put(`/timesheets/${id}/reject`, { reason });
  }

  getSummary(employeeId, month = null, year = null) {
    let url = `/timesheets/employee/${employeeId}/summary`;
    const params = new URLSearchParams();
    
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return http.get(url);
  }

  findByEmployee(employeeId, startDate = null, endDate = null) {
    let url = "/timesheets";
    const params = new URLSearchParams();
    
    params.append('employeeId', employeeId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    url += `?${params.toString()}`;
    return http.get(url);
  }

  findByDateRange(startDate, endDate, employeeId = null) {
    let url = "/timesheets";
    const params = new URLSearchParams();
    
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (employeeId) params.append('employeeId', employeeId);
    
    url += `?${params.toString()}`;
    return http.get(url);
  }

  getByWeek(weekStartDate) {
    console.log('🔍 TimesheetService.getByWeek called with:', weekStartDate);
    // Use the default timesheets endpoint which gets current user's data
    // Add startDate parameter to filter by week
    let url = "/timesheets";
    const params = new URLSearchParams();
    
    params.append('startDate', weekStartDate);
    
    url += `?${params.toString()}`;
    console.log('📡 API call URL:', url);
    return http.get(url);
  }

  // Manager-specific methods
  getPendingForManager() {
    return http.get("/timesheets/approval/pending");
  }

  approveTimesheet(timesheetId, data) {
    return http.put(`/timesheets/${timesheetId}/approve`, data);
  }

  rejectTimesheet(timesheetId, data) {
    // Use the same endpoint as approve but with 'reject' action
    return http.put(`/timesheets/${timesheetId}/approve`, {
      ...data,
      action: 'reject'
    });
  }

  // Legacy methods for backward compatibility
  getPendingForManagerLegacy(managerId) {
    return http.get(`/timesheets/manager/${managerId}/pending`);
  }

  approveReject(timesheetId, data) {
    return http.put(`/timesheets/${timesheetId}/approve-reject`, data);
  }
}

const timesheetDataService = new TimesheetDataService();
export default timesheetDataService;
