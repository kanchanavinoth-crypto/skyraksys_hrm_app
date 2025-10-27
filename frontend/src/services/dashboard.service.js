import http from "../http-common";

class DashboardService {
  async getStats() {
    try {
      const response = await http.get('/dashboard/stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return {
        success: false,
        error: error.message,
        data: {
          stats: {
            employees: { total: 0, active: 0, onLeave: 0, newHires: 0 },
            leaves: { pending: 0, approved: 0, rejected: 0 },
            timesheets: { pending: 0, submitted: 0, approved: 0 },
            payroll: { processed: 0, pending: 0, total: 0 }
          }
        }
      };
    }
  }

  async getAdminStats() {
    return this.getStats();
  }

  async getEmployeeStats() {
    try {
      const response = await http.get('/dashboard/employee-stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Employee stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getManagerStats() {
    try {
      const response = await http.get('/dashboard/manager-stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Manager stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
