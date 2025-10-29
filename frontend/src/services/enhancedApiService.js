import axios from 'axios';
import { errorRecoveryManager, recoveryStrategies } from '../utils/errorRecovery';

/**
 * Enhanced API Service with advanced error recovery, offline handling, and retry logic
 */
class EnhancedApiService {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL || process.env.REACT_APP_API_URL || '/api';
    this.options = {
      timeout: options.timeout || 30000,
      retryEnabled: options.retryEnabled !== false,
      offlineSupport: options.offlineSupport !== false,
      cacheEnabled: options.cacheEnabled !== false,
      ...options
    };

    // Create axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.options.timeout,
      withCredentials: true,  // Enable sending cookies with requests
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // Initialize state
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    this.requestCache = new Map();
    this.requestInterceptors = [];
    this.responseInterceptors = [];

    // Setup interceptors and offline handling
    this.setupInterceptors();
    this.setupOfflineHandling();
    this.setupNotificationHandling();
  }

  /**
   * Setup request and response interceptors
   */
  setupInterceptors() {
    // Request interceptor for auth tokens and request logging
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token from localStorage as fallback (for backward compatibility)
        // Cookie will be sent automatically due to withCredentials: true
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp
        config.metadata = { startTime: Date.now() };

        // Add operation ID for tracking
        config.operationId = this.generateOperationId();

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        }

        return config;
      },
      (error) => {
        console.error('[API] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and response logging
    this.api.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const duration = Date.now() - response.config.metadata.startTime;
        
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
        }

        // Cache successful GET requests if caching is enabled
        if (this.options.cacheEnabled && response.config.method === 'get') {
          this.cacheResponse(response.config.url, response.data);
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle token expiration with automatic refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshToken();
            return this.api(originalRequest);
          } catch (refreshError) {
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // Handle offline scenarios
        if (!this.isOnline && this.options.offlineSupport) {
          return this.handleOfflineRequest(originalRequest);
        }

        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`[API] ${error.response?.status || 'Network'} ${originalRequest.method?.toUpperCase()} ${originalRequest.url}:`, error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup offline handling
   */
  setupOfflineHandling() {
    if (!this.options.offlineSupport) return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
      this.notifyNetworkStatus('Connection restored. Syncing queued requests...');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyNetworkStatus('You are offline. Requests will be queued and processed when connection is restored.');
    });
  }

  /**
   * Setup notification handling (requires notification context)
   */
  setupNotificationHandling() {
    // This will be set by the notification context if available
    this.notificationService = null;
  }

  setNotificationService(service) {
    this.notificationService = service;
  }

  /**
   * Execute request with enhanced error recovery
   */
  async executeRequest(requestFunction, options = {}) {
    const {
      operationId = this.generateOperationId(),
      showSuccessMessage,
      showErrorMessage = true,
      retryable = this.options.retryEnabled,
      fallbackData,
      cacheKey,
      maxAge = 5 * 60 * 1000, // 5 minutes default cache
      circuitBreakerKey,
      recoveryStrategies: customStrategies = [],
      ...recoveryOptions
    } = options;

    // Check cache first for GET requests
    if (cacheKey && this.options.cacheEnabled) {
      const cached = this.getCachedResponse(cacheKey, maxAge);
      if (cached) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] Cache hit for ${cacheKey}`);
        }
        return cached;
      }
    }

    try {
      let result;

      if (retryable) {
        // Default recovery strategies
        const defaultStrategies = [
          recoveryStrategies.tokenRefresh,
          recoveryStrategies.networkCheck,
          recoveryStrategies.serverBackoff,
          ...customStrategies
        ];

        result = await errorRecoveryManager.executeWithRetry(
          requestFunction,
          {
            operationId,
            circuitBreakerKey,
            retryStrategies: defaultStrategies,
            onRetry: (error, attempt, delay) => {
              this.notifyRetry(error, attempt, delay, operationId);
            },
            ...recoveryOptions
          }
        );
      } else {
        result = await requestFunction();
      }

      // Cache the result if cache key is provided
      if (cacheKey && this.options.cacheEnabled) {
        this.cacheResponse(cacheKey, result.data);
      }

      // Show success message if requested
      if (showSuccessMessage) {
        this.notifySuccess(showSuccessMessage);
      }

      return result.data;

    } catch (error) {
      console.error('[API] Request failed:', error);

      // Show error message if requested
      if (showErrorMessage) {
        const errorMessage = this.getErrorMessage(error);
        this.notifyError(errorMessage, {
          operationId,
          retryable,
          requestFunction: retryable ? () => this.executeRequest(requestFunction, options) : null
        });
      }

      // Return fallback data if available
      if (fallbackData !== undefined) {
        return fallbackData;
      }

      throw error;
    }
  }

  /**
   * Standard HTTP methods with enhanced error recovery
   */
  async get(url, options = {}) {
    return this.executeRequest(
      () => this.api.get(url, options.config),
      {
        cacheKey: options.cache !== false ? `GET_${url}` : null,
        circuitBreakerKey: `GET_${url.split('/')[1]}`, // Use first path segment
        ...options
      }
    );
  }

  async post(url, data, options = {}) {
    return this.executeRequest(
      () => this.api.post(url, data, options.config),
      {
        circuitBreakerKey: `POST_${url.split('/')[1]}`,
        retryable: options.retryable !== false,
        ...options
      }
    );
  }

  async put(url, data, options = {}) {
    return this.executeRequest(
      () => this.api.put(url, data, options.config),
      {
        circuitBreakerKey: `PUT_${url.split('/')[1]}`,
        retryable: options.retryable !== false,
        ...options
      }
    );
  }

  async patch(url, data, options = {}) {
    return this.executeRequest(
      () => this.api.patch(url, data, options.config),
      {
        circuitBreakerKey: `PATCH_${url.split('/')[1]}`,
        retryable: options.retryable !== false,
        ...options
      }
    );
  }

  async delete(url, options = {}) {
    return this.executeRequest(
      () => this.api.delete(url, options.config),
      {
        circuitBreakerKey: `DELETE_${url.split('/')[1]}`,
        retryable: options.retryable !== false,
        ...options
      }
    );
  }

  /**
   * Upload file with progress tracking
   */
  async upload(url, file, options = {}) {
    const formData = new FormData();
    
    if (file instanceof File) {
      formData.append('file', file);
    } else if (Array.isArray(file)) {
      file.forEach((f, index) => {
        formData.append(`file${index}`, f);
      });
    } else {
      Object.entries(file).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.executeRequest(
      () => this.api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: options.onProgress,
        ...options.config
      }),
      {
        retryable: false, // Don't retry file uploads by default
        ...options
      }
    );
  }

  /**
   * Download file
   */
  async download(url, options = {}) {
    return this.executeRequest(
      () => this.api.get(url, {
        responseType: 'blob',
        ...options.config
      }),
      {
        retryable: true,
        showErrorMessage: options.showErrorMessage !== false,
        ...options
      }
    );
  }

  /**
   * Batch requests with concurrency control
   */
  async batch(requests, options = {}) {
    const { concurrency = 3, failFast = false } = options;
    const results = [];
    const errors = [];

    // Process requests in batches
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (request, index) => {
        try {
          const result = await this.executeRequest(request.fn, request.options);
          return { index: i + index, result, success: true };
        } catch (error) {
          const errorResult = { index: i + index, error, success: false };
          if (failFast) {
            throw errorResult;
          }
          return errorResult;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results[result.value.index] = result.value.result;
          } else {
            errors[result.value.index] = result.value.error;
          }
        } else {
          errors[results.length] = result.reason;
        }
      });
    }

    return { results, errors, hasErrors: errors.length > 0 };
  }

  /**
   * Cache management
   */
  cacheResponse(key, data, ttl = 5 * 60 * 1000) {
    if (!this.options.cacheEnabled) return;
    
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  getCachedResponse(key, maxAge = 5 * 60 * 1000) {
    if (!this.options.cacheEnabled) return null;
    
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > (cached.ttl || maxAge)) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache(pattern) {
    if (pattern) {
      // Clear cache entries matching pattern
      const regex = new RegExp(pattern);
      for (const key of this.requestCache.keys()) {
        if (regex.test(key)) {
          this.requestCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.requestCache.clear();
    }
  }

  /**
   * Offline handling
   */
  async handleOfflineRequest(request) {
    return new Promise((resolve, reject) => {
      this.offlineQueue.push({
        request,
        resolve,
        reject,
        timestamp: Date.now(),
        id: this.generateOperationId()
      });

      this.notifyOfflineQueue(this.offlineQueue.length);
    });
  }

  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    let processed = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        const response = await this.api(item.request);
        item.resolve(response);
        processed++;
      } catch (error) {
        item.reject(error);
        failed++;
      }
    }

    this.notifyQueueProcessed(processed, failed);
  }

  /**
   * Authentication handling
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.api.post('/auth/refresh', {
        refreshToken
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      return accessToken;
    } catch (error) {
      this.handleAuthError();
      throw error;
    }
  }

  handleAuthError() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Redirect to login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * Error message generation
   */
  getErrorMessage(error) {
    if (!error.response) {
      return 'Network error. Please check your connection and try again.';
    }

    const { status, data } = error.response;

    switch (status) {
      case 400:
        return data.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return data.message || 'Data conflict. Please refresh and try again.';
      case 422:
        return 'Please fix the validation errors and try again.';
      case 429:
        return 'Too many requests. Please wait a moment before trying again.';
      case 500:
        return 'Server error. Our team has been notified.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return data.message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Notification methods (will use notification service if available)
   */
  notifySuccess(message) {
    if (this.notificationService?.showSuccess) {
      this.notificationService.showSuccess(message);
    } else {
      console.log(`[API Success] ${message}`);
    }
  }

  notifyError(message, options = {}) {
    if (this.notificationService?.showError) {
      const action = options.retryable && options.requestFunction ? {
        label: 'Retry',
        callback: options.requestFunction
      } : null;

      this.notificationService.showError(message, { action });
    } else {
      console.error(`[API Error] ${message}`);
    }
  }

  notifyRetry(error, attempt, delay, operationId) {
    const message = `Request failed. Retrying in ${Math.round(delay/1000)}s... (Attempt ${attempt})`;
    
    if (this.notificationService?.showWarning) {
      this.notificationService.showWarning(message, { autoHideDuration: delay });
    } else {
      console.warn(`[API Retry] ${message} - Operation: ${operationId}`);
    }
  }

  notifyNetworkStatus(message) {
    if (this.notificationService?.showInfo) {
      this.notificationService.showInfo(message);
    } else {
      console.info(`[API Network] ${message}`);
    }
  }

  notifyOfflineQueue(count) {
    const message = `${count} request${count > 1 ? 's' : ''} queued for when connection is restored.`;
    
    if (this.notificationService?.showInfo) {
      this.notificationService.showInfo(message);
    } else {
      console.info(`[API Offline] ${message}`);
    }
  }

  notifyQueueProcessed(processed, failed) {
    const message = `Processed ${processed} queued request${processed > 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}.`;
    
    if (this.notificationService?.showSuccess) {
      this.notificationService.showSuccess(message);
    } else {
      console.log(`[API Queue] ${message}`);
    }
  }

  /**
   * Utility methods
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats() {
    return {
      cache: {
        size: this.requestCache.size,
        keys: Array.from(this.requestCache.keys())
      },
      offline: {
        queueSize: this.offlineQueue.length,
        isOnline: this.isOnline
      },
      recovery: errorRecoveryManager.getStats()
    };
  }

  // Cleanup resources
  cleanup() {
    this.clearCache();
    this.offlineQueue = [];
    errorRecoveryManager.cleanup();
  }
}

// Create global instance
export const enhancedApiService = new EnhancedApiService();

// Export for use in services
export default enhancedApiService;