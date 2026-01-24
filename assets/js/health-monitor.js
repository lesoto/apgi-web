/**
 * Health Monitoring Service for APGI Framework
 * Provides real-time health checks and performance monitoring
 */

class HealthMonitor {
  constructor(options = {}) {
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.endpoints = options.endpoints || [];
    this.thresholds = {
      responseTime: options.responseTimeThreshold || 3000, // 3 seconds
      errorRate: options.errorRateThreshold || 0.1, // 10%
      memoryUsage: options.memoryUsageThreshold || 0.8, // 80%
      ...options.thresholds,
    };

    this.status = "healthy";
    this.checks = {};
    this.metrics = {
      uptime: Date.now(),
      totalChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
      responseTimes: [],
      errorCounts: {},
      lastCheck: null,
    };

    this.observers = [];
    this.intervalId = null;
    this.init();
  }

  init() {
    // Setup default endpoints
    this.setupDefaultEndpoints();

    // Start monitoring
    this.start();

    // Setup performance monitoring
    this.setupPerformanceMonitoring();

    // Setup memory monitoring
    this.setupMemoryMonitoring();
  }

  setupDefaultEndpoints() {
    // Add common health check endpoints
    if (this.endpoints.length === 0) {
      this.endpoints = [
        {
          name: "api-health",
          url: "/api/health",
          method: "GET",
          timeout: 5000,
          critical: true,
        },
        {
          name: "cdn-check",
          url: "https://cdn.jsdelivr.net/npm/package@latest/package.json",
          method: "HEAD",
          timeout: 3000,
          critical: false,
        },
      ];
    }
  }

  setupPerformanceMonitoring() {
    // Monitor page load performance
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType("navigation")[0];
          if (perfData) {
            this.recordMetric("pageLoad", {
              domContentLoaded:
                perfData.domContentLoadedEventEnd -
                perfData.domContentLoadedEventStart,
              loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
              totalTime: perfData.loadEventEnd - perfData.navigationStart,
            });
          }
        }, 0);
      });
    }
  }

  setupMemoryMonitoring() {
    // Monitor memory usage if available
    if ("memory" in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        this.recordMetric("memory", {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          usagePercent: usage,
        });

        // Alert if memory usage is high
        if (usage > this.thresholds.memoryUsage) {
          this.triggerAlert(
            "high_memory",
            `Memory usage at ${(usage * 100).toFixed(1)}%`,
          );
        }
      }, 60000); // Every minute
    }
  }

  start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.performHealthChecks();
    }, this.checkInterval);

    // Perform initial check
    this.performHealthChecks();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async performHealthChecks() {
    const startTime = Date.now();
    this.metrics.totalChecks++;
    this.metrics.lastCheck = new Date().toISOString();

    const checkPromises = this.endpoints.map((endpoint) =>
      this.checkEndpoint(endpoint),
    );

    const results = await Promise.allSettled(checkPromises);

    // Process results
    let failedChecks = 0;
    results.forEach((result, index) => {
      const endpoint = this.endpoints[index];
      if (result.status === "rejected") {
        failedChecks++;
        this.checks[endpoint.name] = {
          status: "unhealthy",
          error: result.reason.message,
          timestamp: new Date().toISOString(),
          critical: endpoint.critical,
        };
        this.metrics.errorCounts[endpoint.name] =
          (this.metrics.errorCounts[endpoint.name] || 0) + 1;
      } else {
        this.checks[endpoint.name] = {
          status: "healthy",
          ...result.value,
          timestamp: new Date().toISOString(),
          critical: endpoint.critical,
        };
      }
    });

    this.metrics.failedChecks = failedChecks;

    // Calculate overall status
    this.updateOverallStatus();

    // Record response time
    const responseTime = Date.now() - startTime;
    this.recordResponseTime(responseTime);

    // Notify observers
    this.notifyObservers();
  }

  async checkEndpoint(endpoint) {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        signal: controller.signal,
        cache: "no-cache",
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        responseTime,
        status: response.status,
        url: endpoint.url,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${endpoint.timeout}ms`);
      }

      throw error;
    }
  }

  updateOverallStatus() {
    const criticalFailures = Object.values(this.checks).filter(
      (check) => check.critical && check.status === "unhealthy",
    ).length;

    const totalFailures = Object.values(this.checks).filter(
      (check) => check.status === "unhealthy",
    ).length;

    const errorRate = totalFailures / this.endpoints.length;
    const avgResponseTime = this.getAverageResponseTime();

    if (criticalFailures > 0) {
      this.status = "critical";
    } else if (
      errorRate > this.thresholds.errorRate ||
      avgResponseTime > this.thresholds.responseTime
    ) {
      this.status = "degraded";
    } else if (totalFailures === 0) {
      this.status = "healthy";
    } else {
      this.status = "warning";
    }
  }

  recordResponseTime(responseTime) {
    this.metrics.responseTimes.push(responseTime);

    // Keep only last 100 response times
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }

    this.metrics.averageResponseTime =
      this.metrics.responseTimes.reduce((a, b) => a + b, 0) /
      this.metrics.responseTimes.length;
  }

  getAverageResponseTime() {
    return this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) /
          this.metrics.responseTimes.length
      : 0;
  }

  recordMetric(type, data) {
    if (!this.metrics.customMetrics) {
      this.metrics.customMetrics = {};
    }

    if (!this.metrics.customMetrics[type]) {
      this.metrics.customMetrics[type] = [];
    }

    this.metrics.customMetrics[type].push({
      timestamp: new Date().toISOString(),
      ...data,
    });

    // Keep only last 50 entries per metric type
    if (this.metrics.customMetrics[type].length > 50) {
      this.metrics.customMetrics[type].shift();
    }
  }

  triggerAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type),
    };

    // Log the alert
    if (window.errorLogger) {
      window.errorLogger.warn(`Health Alert: ${message}`, null, {
        alertType: type,
        healthStatus: this.status,
      });
    }

    // Show user notification for critical alerts
    if (alert.severity === "critical" && window.errorHandler) {
      window.errorHandler.showError(message, "warning", "System Health Alert");
    }

    // Notify observers
    this.observers.forEach((observer) => {
      if (observer.onAlert) {
        observer.onAlert(alert);
      }
    });
  }

  getAlertSeverity(type) {
    const severities = {
      high_memory: "warning",
      slow_response: "warning",
      endpoint_failure: "critical",
      high_error_rate: "critical",
    };

    return severities[type] || "info";
  }

  // Observer pattern for health status changes
  addObserver(observer) {
    this.observers.push(observer);
  }

  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notifyObservers() {
    this.observers.forEach((observer) => {
      if (observer.onHealthChange) {
        observer.onHealthChange({
          status: this.status,
          checks: this.checks,
          metrics: this.metrics,
        });
      }
    });
  }

  // Public API methods
  getStatus() {
    return {
      status: this.status,
      checks: this.checks,
      metrics: { ...this.metrics },
      uptime: Date.now() - this.metrics.uptime,
    };
  }

  getEndpointStatus(endpointName) {
    return this.checks[endpointName] || null;
  }

  addEndpoint(endpoint) {
    this.endpoints.push(endpoint);
  }

  removeEndpoint(endpointName) {
    this.endpoints = this.endpoints.filter((ep) => ep.name !== endpointName);
    delete this.checks[endpointName];
  }

  // Generate health report
  generateReport() {
    const uptime = Date.now() - this.metrics.uptime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    return {
      summary: {
        status: this.status,
        uptime: `${uptimeHours}h ${uptimeMinutes}m`,
        totalChecks: this.metrics.totalChecks,
        failedChecks: this.metrics.failedChecks,
        successRate:
          (
            ((this.metrics.totalChecks - this.metrics.failedChecks) /
              this.metrics.totalChecks) *
            100
          ).toFixed(1) + "%",
        averageResponseTime:
          Math.round(this.metrics.averageResponseTime) + "ms",
      },
      endpoints: this.checks,
      metrics: this.metrics,
      recommendations: this.getRecommendations(),
    };
  }

  getRecommendations() {
    const recommendations = [];

    if (this.status === "critical") {
      recommendations.push(
        "Immediate attention required: Critical services are failing",
      );
    }

    if (this.metrics.averageResponseTime > this.thresholds.responseTime) {
      recommendations.push(
        "Consider optimizing performance: Average response time is high",
      );
    }

    const errorRate = this.metrics.failedChecks / this.metrics.totalChecks;
    if (errorRate > this.thresholds.errorRate) {
      recommendations.push(
        "Review error handling: Error rate exceeds threshold",
      );
    }

    // Check for frequently failing endpoints
    Object.entries(this.metrics.errorCounts).forEach(([endpoint, count]) => {
      if (count > 5) {
        recommendations.push(
          `Endpoint "${endpoint}" has failed ${count} times - investigate connectivity`,
        );
      }
    });

    return recommendations;
  }
}

// Initialize health monitor
const healthMonitor = new HealthMonitor({
  checkInterval: 30000,
  responseTimeThreshold: 3000,
  errorRateThreshold: 0.1,
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = HealthMonitor;
} else {
  window.HealthMonitor = HealthMonitor;
  window.healthMonitor = healthMonitor;
}
