import http from '../http-common';

class AuthService {
  // Login user
  async login(email, password) {
    const response = await http.post('/auth/login', {
      email,
      password
    });
    return response.data.data;
  }

  // Register new user
  async register(userData) {
    try {
      const response = await http.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Logout user
  async logout() {
    // Simply clear local storage - no backend call needed for simple JWT
    this.clearAuthData();
  }

  // Get user profile
  async getProfile() {
    const response = await http.get('/auth/me');
    return response.data.data;
  }

  // Update user profile
  async updateProfile(profileData) {
    const response = await http.put('/auth/me', profileData);
    return response.data.data;
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await http.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  // Get current access token
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  // Alias for getAccessToken (for backward compatibility)
  getToken() {
    return this.getAccessToken();
  }

  // Get current user from stored token (synchronous)
  getCurrentUser() {
    const token = this.getAccessToken();
    if (!token) return null;
    
    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        employeeId: payload.employeeId
      };
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // Reset user password (Admin/HR only)
  async resetPassword(resetData) {
    try {
      const response = await http.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Toggle user account status (Admin/HR only)
  async toggleUserStatus(userId, isActive) {
    try {
      const response = await http.put(`/auth/users/${userId}/status`, { isActive });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Update user role (Admin only)
  async updateUserRole(userId, role) {
    try {
      const response = await http.put(`/auth/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Reset user password (Admin/HR only)
  async resetUserPassword(userId, newPassword) {
    try {
      const response = await http.put(`/auth/users/${userId}/reset-password`, { 
        newPassword,
        forceChange: true 
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Update user account (comprehensive update)
  async updateUserAccount(userId, userData) {
    try {
      const response = await http.put(`/auth/users/${userId}/account`, userData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Create user account for employee
  async createUserAccount(employeeId, userData) {
    try {
      const response = await http.post(`/auth/users/employee/${employeeId}`, userData);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Get user account details by employee ID
  async getUserByEmployeeId(employeeId) {
    try {
      const response = await http.get(`/auth/users/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Send welcome email to user
  async sendWelcomeEmail(userId, tempPassword) {
    try {
      const response = await http.post(`/email/welcome/${userId}`, { 
        tempPassword 
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Send password reset email to user
  async sendPasswordResetEmail(userId, tempPassword) {
    try {
      const response = await http.post(`/email/password-reset/${userId}`, { 
        tempPassword 
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Send account status change email
  async sendAccountStatusEmail(userId, isActive) {
    try {
      const response = await http.post(`/email/account-status/${userId}`, { 
        isActive 
      });
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Check email service status
  async checkEmailStatus() {
    try {
      const response = await http.get('/email/status');
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

    // Clear all auth data
  clearAuthData() {
    localStorage.removeItem('accessToken');
  }
}

export const authService = new AuthService();
