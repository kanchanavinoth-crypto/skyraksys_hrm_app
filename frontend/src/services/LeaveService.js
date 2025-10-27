import http from "../http-common";

class LeaveDataService {
  getAll() {
    return http.get("/leaves");
  }

  get(id) {
    return http.get(`/leaves/${id}`);
  }

  create(data) {
    return http.post("/leaves", data);
  }

  update(id, data) {
    return http.put(`/leaves/${id}`, data);
  }

  delete(id) {
    return http.delete(`/leaves/${id}`);
  }

  getBalance(employeeId) {
    return http.get(`/leaves/balance/${employeeId}`);
  }

  updateBalance(data) {
    return http.post("/leaves/balance", data);
  }

  getByEmployeeId(employeeId) {
    return http.get(`/leaves?employeeId=${employeeId}`);
  }

  // Manager-specific methods
  getPendingForManager() {
    return http.get("/leaves/pending-for-manager");
  }

  approveLeave(leaveId, data) {
    return http.put(`/leaves/${leaveId}/approve`, data);
  }

  rejectLeave(leaveId, data) {
    return http.put(`/leaves/${leaveId}/reject`, data);
  }

  getRecentApprovals() {
    return http.get("/leaves/recent-approvals");
  }

  // Legacy methods for backward compatibility
  getPendingForManagerLegacy(managerId) {
    return http.get(`/leaves/manager/${managerId}/pending`);
  }

  approveReject(leaveId, data) {
    return http.put(`/leaves/${leaveId}/approve-reject`, data);
  }

  // Leave types metadata
  getLeaveTypes() {
    return http.get("/leaves/meta/types");
  }

  // Leave balance metadata
  getLeaveBalances() {
    return http.get("/leaves/meta/balance");
  }

  // Admin: Get leave balances by employee and type
  getLeaveBalanceAdmin(employeeId, leaveTypeId) {
    let url = "/admin/leave-balances?limit=100";
    if (employeeId) url += `&employeeId=${employeeId}`;
    if (leaveTypeId) url += `&leaveTypeId=${leaveTypeId}`;
    return http.get(url);
  }
}

const leaveDataService = new LeaveDataService();
export default leaveDataService;
