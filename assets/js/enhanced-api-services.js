/**
 * Enhanced API Services with Retry Logic and Circuit Breaker
 * Handles email capture, payment processing, and consultation requests with resilience
 */

// Import environment configuration
if (typeof window.envConfig === "undefined") {
  console.error(
    "Environment configuration not loaded. Please include environment-config.js before enhanced-api-services.js",
  );
}

// Email service configurations
const EMAIL_CONFIG = {
  mailchimp: {
    apiKey: window.envConfig?.get("email.mailchimp.apiKey"),
    serverPrefix: window.envConfig?.get("email.mailchimp.serverPrefix"),
    lists: {
      snapshot: window.envConfig?.get("email.mailchimp.lists.snapshot"),
      newsletter: window.envConfig?.get("email.mailchimp.lists.newsletter"),
      consultations: window.envConfig?.get(
        "email.mailchimp.lists.consultations",
      ),
    },
  },
  convertKit: {
    apiKey: window.envConfig?.get("email.convertKit.apiKey"),
    forms: {
      snapshot: window.envConfig?.get("email.convertKit.forms.snapshot"),
      professional: window.envConfig?.get(
        "email.convertKit.forms.professional",
      ),
    },
  },
};

// Circuit Breaker Implementation
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: [],
    };
  }

  async execute(operation) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    // Check circuit breaker state
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error(
          "Circuit breaker is OPEN. Service temporarily unavailable.",
        );
      } else {
        this.state = "HALF_OPEN";
      }
    }

    try {
      const result = await operation();
      this.onSuccess(startTime);
      return result;
    } catch (error) {
      this.onFailure(startTime);
      throw error;
    }
  }

  onSuccess(startTime) {
    const responseTime = Date.now() - startTime;
    this.stats.responseTimes.push(responseTime);
    this.stats.successfulRequests++;

    // Keep only last 100 response times for average calculation
    if (this.stats.responseTimes.length > 100) {
      this.stats.responseTimes.shift();
    }

    this.stats.averageResponseTime =
      this.stats.responseTimes.reduce((a, b) => a + b, 0) /
      this.stats.responseTimes.length;

    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= 3) {
        this.reset();
      }
    } else {
      this.failureCount = 0;
    }
  }

  onFailure(startTime) {
    this.stats.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeout;

      // Log circuit breaker opening
      console.warn(
        `Circuit breaker OPENED. ${this.failureCount} failures detected.`,
      );

      // Notify user if global error handler is available
      if (window.errorHandler) {
        window.errorHandler.showError(
          "Service temporarily unavailable due to repeated failures. Please try again in a few minutes.",
          "warning",
          "Service Unavailable",
        );
      }
    }
  }

  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.nextAttempt,
      stats: this.stats,
    };
  }
}

// Retry Logic with Exponential Backoff
class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.backoffFactor = options.backoffFactor || 2;
    this.retryableErrors = options.retryableErrors || [
      "NetworkError",
      "TimeoutError",
      "FetchError",
      "ECONNRESET",
      "ETIMEDOUT",
    ];
  }

  async execute(operation, context = {}) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();

        // Log successful retry if not first attempt
        if (attempt > 0 && window.errorHandler) {
          window.errorHandler.showInfo(
            `Operation succeeded after ${attempt} ${attempt === 1 ? "retry" : "retries"}`,
            "Retry Success",
          );
        }

        return result;
      } catch (error) {
        lastError = error;

        // Don't retry on last attempt or non-retryable errors
        if (attempt === this.maxRetries || !this.isRetryableError(error)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt);

        // Log retry attempt
        console.warn(
          `Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms delay:`,
          error.message,
        );

        if (window.errorHandler) {
          window.errorHandler.showInfo(
            `Retrying... (${attempt + 1}/${this.maxRetries})`,
            "Retry Attempt",
          );
        }

        // Wait before retry
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  isRetryableError(error) {
    const errorMessage = error.message || "";
    const errorName = error.name || "";

    return this.retryableErrors.some(
      (retryableError) =>
        errorMessage.includes(retryableError) ||
        errorName.includes(retryableError) ||
        errorMessage.includes("network") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("fetch"),
    );
  }

  calculateDelay(attempt) {
    // Exponential backoff with jitter
    const exponentialDelay =
      this.baseDelay * Math.pow(this.backoffFactor, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const delay = Math.min(exponentialDelay + jitter, this.maxDelay);

    return Math.floor(delay);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Enhanced API Client
class EnhancedAPIClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || "";
    this.timeout = options.timeout || 30000; // 30 seconds
    this.circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    this.retryManager = new RetryManager(options.retry);

    // Request/response interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  async request(url, options = {}) {
    const fullUrl = this.baseURL + url;

    // Apply request interceptors
    let config = { ...options, url: fullUrl };
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }

    // Set timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    const operation = async () => {
      const response = await fetch(config.url, config);

      // Apply response interceptors
      let processedResponse = response;
      for (const interceptor of this.responseInterceptors) {
        processedResponse = await interceptor(processedResponse);
      }

      if (!processedResponse.ok) {
        const errorData = await processedResponse.json().catch(() => ({}));
        throw new APIError(
          errorData.message ||
            `HTTP ${processedResponse.status}: ${processedResponse.statusText}`,
          processedResponse.status,
          errorData,
        );
      }

      return processedResponse.json();
    };

    try {
      // Execute with circuit breaker and retry logic
      return await this.circuitBreaker.execute(() =>
        this.retryManager.execute(operation, { url, options }),
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  get(url, options = {}) {
    return this.request(url, { ...options, method: "GET" });
  }

  post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }

  put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }

  delete(url, options = {}) {
    return this.request(url, { ...options, method: "DELETE" });
  }

  // Get circuit breaker state
  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }
}

// Custom API Error class
class APIError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

// Enhanced Email Service with resilience
class EnhancedEmailService {
  constructor() {
    this.apiClient = new EnhancedAPIClient({
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 30000,
      },
      retry: {
        maxRetries: 2,
        baseDelay: 1000,
      },
    });

    // Add logging interceptor
    this.apiClient.addRequestInterceptor(async (config) => {
      console.log(`API Request: ${config.method || "GET"} ${config.url}`);
      return config;
    });

    this.apiClient.addResponseInterceptor(async (response) => {
      console.log(`API Response: ${response.status} ${response.url}`);
      return response;
    });
  }

  async subscribeToList(email, listType, additionalData = {}) {
    try {
      // Try Mailchimp first with enhanced error handling
      if (EMAIL_CONFIG.mailchimp.apiKey) {
        return await this.subscribeMailchimp(email, listType, additionalData);
      } else if (EMAIL_CONFIG.convertKit.apiKey) {
        return await this.subscribeConvertKit(email, listType, additionalData);
      } else {
        // Fallback to local storage for development
        return await this.storeLocally(email, listType, additionalData);
      }
    } catch (error) {
      console.error("Email service error:", error);

      // Enhanced error reporting
      if (window.errorHandler) {
        window.errorHandler.handleError({
          type: "email_service",
          message: error.message,
          email: email,
          listType: listType,
          timestamp: new Date().toISOString(),
        });
      }

      throw new Error(`Failed to subscribe to email list: ${error.message}`);
    }
  }

  async subscribeMailchimp(email, listType, additionalData) {
    const listId = EMAIL_CONFIG.mailchimp.lists[listType];
    const url = `https://${EMAIL_CONFIG.mailchimp.serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`;

    const data = {
      email_address: email,
      status: "pending",
      merge_fields: {
        FNAME: additionalData.firstName || "",
        LNAME: additionalData.lastName || "",
        ROLE: additionalData.role || "",
        NEEDS: additionalData.needs || "",
      },
    };

    const response = await this.apiClient.post(url, data, {
      headers: {
        Authorization: `apikey ${EMAIL_CONFIG.mailchimp.apiKey}`,
      },
    });

    return { success: true, service: "mailchimp", data: response };
  }

  async subscribeConvertKit(email, listType, additionalData) {
    const formId = EMAIL_CONFIG.convertKit.forms[listType];
    const url = `https://api.convertkit.com/v3/forms/${formId}/subscribe`;

    const data = {
      email: email,
      first_name: additionalData.firstName || "",
      fields: {
        last_name: additionalData.lastName || "",
        role: additionalData.role || "",
        needs: additionalData.needs || "",
      },
    };

    const response = await this.apiClient.post(url, data, {
      headers: {
        Authorization: `Bearer ${EMAIL_CONFIG.convertKit.apiKey}`,
      },
    });

    return { success: true, service: "convertkit", data: response };
  }

  async storeLocally(email, listType, additionalData) {
    // Fallback to localStorage for development/testing
    const subscriptions = JSON.parse(
      localStorage.getItem("email_subscriptions") || "[]",
    );
    const subscription = {
      id: Date.now(),
      email,
      listType,
      additionalData,
      timestamp: new Date().toISOString(),
      service: "localStorage",
    };

    subscriptions.push(subscription);
    localStorage.setItem("email_subscriptions", JSON.stringify(subscriptions));

    console.log("Stored subscription locally:", subscription);

    return { success: true, service: "localStorage", data: subscription };
  }
}

// Initialize enhanced services
const enhancedEmailService = new EnhancedEmailService();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    EnhancedAPIClient,
    CircuitBreaker,
    RetryManager,
    EnhancedEmailService,
    APIError,
  };
} else {
  window.EnhancedAPIClient = EnhancedAPIClient;
  window.CircuitBreaker = CircuitBreaker;
  window.RetryManager = RetryManager;
  window.EnhancedEmailService = EnhancedEmailService;
  window.APIError = APIError;
  window.enhancedEmailService = enhancedEmailService;
}
