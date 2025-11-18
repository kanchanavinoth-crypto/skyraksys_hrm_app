import axios from 'axios';

/**
 * Enhanced API Service with Performance Optimization
 * Features: Caching, Request Deduplication, Performance Tracking, Batch Requests
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with optimized defaults
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request cache for GET requests
const requestCache = new Map();
const cacheExpiry = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Pending requests to prevent duplicate calls
const pendingRequests = new Map();

// Performance tracking
const performanceMetrics = {
  totalRequests: 0,
  cacheHits: 0,
  averageResponseTime: 0,
  slowRequests: 0,
  failedRequests: 0,
  requestsPerSecond: 0,
  lastMinuteRequests: [],
};

/**
 * Enhanced API Service Class
 */
class OptimizedAPIService {
  constructor() {
    this.setupInterceptors();
    this.setupPerformanceTracking();
  }

  /**
   * Setup request/response interceptors
   */
  setupInterceptors() {
    // Request interceptor
    apiClient.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request start time for performance tracking
        config.metadata = { startTime: Date.now() };

        // Track request for performance metrics
        this.trackRequestStart();

        return config;
      },
      (error) => {
        this.trackRequestError();
        return Promise.reject(error);
      }
    );

    // Response interceptor
    apiClient.interceptors.response.use(
      (response) => {
        // Calculate and track response time
        const responseTime = Date.now() - response.config.metadata.startTime;
        this.trackRequestComplete(responseTime, true);

        return response;
      },
      (error) => {
        // Track failed request
        const responseTime = error.config?.metadata?.startTime 
          ? Date.now() - error.config.metadata.startTime 
          : 0;
        this.trackRequestComplete(responseTime, false);

        // Handle 401 errors (token expired)
        if (error.response?.status === 401) {
          this.handleAuthError();
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup performance tracking
   */
  setupPerformanceTracking() {
    // Clean up old metrics every minute
    setInterval(() => {
      const oneMinuteAgo = Date.now() - 60 * 1000;
      performanceMetrics.lastMinuteRequests = performanceMetrics.lastMinuteRequests
        .filter(timestamp => timestamp > oneMinuteAgo);
      
      performanceMetrics.requestsPerSecond = performanceMetrics.lastMinuteRequests.length / 60;
    }, 60000);

    // Clean up expired cache entries
    setInterval(() => {
      const now = Date.now();
      for (const [key, expiry] of cacheExpiry.entries()) {
        if (now > expiry) {
          requestCache.delete(key);
          cacheExpiry.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Track request start
   */
  trackRequestStart() {
    performanceMetrics.totalRequests++;
    performanceMetrics.lastMinuteRequests.push(Date.now());
  }

  /**
   * Track request completion
   */
  trackRequestComplete(responseTime, success) {
    // Update average response time
    const totalCompleted = performanceMetrics.totalRequests - performanceMetrics.failedRequests;
    performanceMetrics.averageResponseTime = 
      (performanceMetrics.averageResponseTime * (totalCompleted - 1) + responseTime) / totalCompleted;

    // Track slow requests (>1 second)
    if (responseTime > 1000) {
      performanceMetrics.slowRequests++;
      console.warn(`🐌 Slow API request: ${responseTime}ms`);
    }

    // Track failed requests
    if (!success) {
      performanceMetrics.failedRequests++;
    }
  }

  /**
   * Track request error
   */
  trackRequestError() {
    performanceMetrics.failedRequests++;
  }

  /**
   * Handle authentication errors
   */
  handleAuthError() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }

  /**
   * Generate cache key for requests
   */
  generateCacheKey(method, url, params, data) {
    const key = `${method.toLowerCase()}_${url}_${JSON.stringify(params || {})}_${JSON.stringify(data || {})}`;
    return key.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Check if request should be cached
   */
  shouldCache(method, url) {
    return method.toLowerCase() === 'get' && 
           !url.includes('/auth/') && 
           !url.includes('/logout');
  }

  /**
   * Enhanced request method with caching and deduplication
   */
  async request(config) {
    const { method = 'GET', url, params, data } = config;
    const cacheKey = this.generateCacheKey(method, url, params, data);

    // Check for cached response (GET requests only)
    if (this.shouldCache(method, url)) {
      const cached = requestCache.get(cacheKey);
      const expiry = cacheExpiry.get(cacheKey);
      
      if (cached && expiry && Date.now() < expiry) {
        performanceMetrics.cacheHits++;
        console.log(`🚀 Cache hit for ${url}`);
        return Promise.resolve(cached);
      }
    }

    // Check for pending request to prevent duplicates
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Deduplicating request for ${url}`);
      return pendingRequests.get(cacheKey);
    }

    // Make the request
    const requestPromise = apiClient(config)
      .then(response => {
        // Cache successful GET requests
        if (this.shouldCache(method, url) && response.status === 200) {
          requestCache.set(cacheKey, response);
          cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION);
        }
        
        return response;
      })
      .finally(() => {
        // Remove from pending requests
        pendingRequests.delete(cacheKey);
      });

    // Add to pending requests
    pendingRequests.set(cacheKey, requestPromise);

    return requestPromise;
  }

  /**
   * Batch multiple requests
   */
  async batchRequests(requests) {
    console.log(`📦 Batching ${requests.length} requests`);
    
    try {
      const responses = await Promise.allSettled(
        requests.map(request => this.request(request))
      );

      return responses.map((result, index) => ({
        request: requests[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    } catch (error) {
      console.error('Batch request failed:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific patterns
   */
  invalidateCache(pattern) {
    const keysToDelete = [];
    for (const key of requestCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      requestCache.delete(key);
      cacheExpiry.delete(key);
    });

    console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries for pattern: ${pattern}`);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...performanceMetrics,
      cacheSize: requestCache.size,
      cacheHitRate: performanceMetrics.totalRequests > 0 
        ? (performanceMetrics.cacheHits / performanceMetrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      slowRequestRate: performanceMetrics.totalRequests > 0
        ? (performanceMetrics.slowRequests / performanceMetrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      errorRate: performanceMetrics.totalRequests > 0
        ? (performanceMetrics.failedRequests / performanceMetrics.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Preload data for better UX
   */
  async preloadData(endpoints) {
    console.log(`🚀 Preloading ${endpoints.length} endpoints`);
    
    const preloadRequests = endpoints.map(endpoint => ({
      method: 'GET',
      url: endpoint,
      // Lower priority for preload requests
      timeout: 5000
    }));

    try {
      await this.batchRequests(preloadRequests);
      console.log('✅ Data preloaded successfully');
    } catch (error) {
      console.warn('⚠️ Data preloading failed:', error);
    }
  }

  // Convenience methods
  async get(url, config = {}) {
    return this.request({ method: 'GET', url, ...config });
  }

  async post(url, data, config = {}) {
    // Invalidate related cache entries
    this.invalidateCache(url.split('/')[1]); // Invalidate by resource type
    return this.request({ method: 'POST', url, data, ...config });
  }

  async put(url, data, config = {}) {
    this.invalidateCache(url.split('/')[1]);
    return this.request({ method: 'PUT', url, data, ...config });
  }

  async delete(url, config = {}) {
    this.invalidateCache(url.split('/')[1]);
    return this.request({ method: 'DELETE', url, ...config });
  }

  async patch(url, data, config = {}) {
    this.invalidateCache(url.split('/')[1]);
    return this.request({ method: 'PATCH', url, data, ...config });
  }
}

// Create singleton instance
const optimizedAPIService = new OptimizedAPIService();

// Export specific API functions for different modules
export const employeeAPI = {
  getAll: (params) => optimizedAPIService.get('/employees', { params }),
  getById: (id) => optimizedAPIService.get(`/employees/${id}`),
  create: (data) => optimizedAPIService.post('/employees', data),
  update: (id, data) => optimizedAPIService.put(`/employees/${id}`, data),
  delete: (id) => optimizedAPIService.delete(`/employees/${id}`),
  batchUpdate: (updates) => optimizedAPIService.batchRequests(
    updates.map(({ id, data }) => ({ method: 'PUT', url: `/employees/${id}`, data }))
  )
};

export const leaveAPI = {
  getRequests: (params) => optimizedAPIService.get('/leave-requests', { params }),
  getBalances: (employeeId) => optimizedAPIService.get(`/leave-balances/${employeeId}`),
  createRequest: (data) => optimizedAPIService.post('/leave-requests', data),
  updateRequest: (id, data) => optimizedAPIService.put(`/leave-requests/${id}`, data),
  deleteRequest: (id) => optimizedAPIService.delete(`/leave-requests/${id}`)
};

export const payrollAPI = {
  getPayrolls: (params) => optimizedAPIService.get('/payrolls', { params }),
  getPayslips: (employeeId, params) => optimizedAPIService.get(`/payslips/${employeeId}`, { params }),
  generatePayroll: (data) => optimizedAPIService.post('/payrolls/generate', data),
  processPayroll: (id) => optimizedAPIService.post(`/payrolls/${id}/process`)
};

export const authAPI = {
  login: (credentials) => optimizedAPIService.post('/auth/login', credentials),
  logout: () => optimizedAPIService.post('/auth/logout'),
  refresh: () => optimizedAPIService.post('/auth/refresh'),
  me: () => optimizedAPIService.get('/auth/me')
};

export const departmentAPI = {
  getAll: () => optimizedAPIService.get('/departments'),
  getById: (id) => optimizedAPIService.get(`/departments/${id}`),
  create: (data) => optimizedAPIService.post('/departments', data),
  update: (id, data) => optimizedAPIService.put(`/departments/${id}`, data)
};

// Export the main service and utilities
export default optimizedAPIService;

export const {
  getPerformanceMetrics,
  invalidateCache,
  preloadData,
  batchRequests
} = optimizedAPIService;
