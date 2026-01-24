/**
 * Error Analytics Dashboard for APGI Framework
 * Provides comprehensive error analytics and reporting interface
 */

class ErrorAnalytics {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.errorLogger = options.errorLogger || window.errorLogger;
    this.healthMonitor = options.healthMonitor || window.healthMonitor;
    this.refreshInterval = options.refreshInterval || 30000; // 30 seconds
    this.isVisible = false;

    this.init();
  }

  init() {
    this.createDashboard();
    this.setupEventListeners();
    this.startAutoRefresh();
  }

  createDashboard() {
    // Create dashboard container
    this.dashboardElement = document.createElement("div");
    this.dashboardElement.id = "error-analytics-dashboard";
    this.dashboardElement.className =
      "fixed inset-0 bg-black bg-opacity-50 z-50 hidden";
    this.dashboardElement.innerHTML = `
      <div class="absolute inset-4 bg-white rounded-lg shadow-2xl overflow-hidden">
        <div class="h-full flex flex-col">
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-2xl font-bold font-display">Error Analytics Dashboard</h2>
                <p class="text-blue-100 mt-1">Real-time error monitoring and analytics</p>
              </div>
              <div class="flex gap-4">
                <button id="refresh-analytics" class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition">
                  <i class="fas fa-sync-alt mr-2"></i>Refresh
                </button>
                <button id="close-analytics" class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition">
                  <i class="fas fa-times mr-2"></i>Close
                </button>
              </div>
            </div>
          </div>
          
          <!-- Main Content -->
          <div class="flex-1 overflow-auto p-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Overview Cards -->
              <div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-600">Total Errors</p>
                      <p id="total-errors" class="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-exclamation-triangle text-red-600"></i>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-600">Error Rate</p>
                      <p id="error-rate" class="text-2xl font-bold text-gray-900">0%</p>
                    </div>
                    <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-chart-line text-yellow-600"></i>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-600">Health Status</p>
                      <p id="health-status" class="text-lg font-bold text-green-600">Healthy</p>
                    </div>
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-heartbeat text-green-600"></i>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-600">Avg Response</p>
                      <p id="avg-response" class="text-2xl font-bold text-gray-900">0ms</p>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-tachometer-alt text-blue-600"></i>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Error Trends Chart -->
              <div class="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Error Trends (Last 24 Hours)</h3>
                <div id="error-chart" class="h-64 flex items-center justify-center text-gray-500">
                  <div class="text-center">
                    <i class="fas fa-chart-area text-4xl mb-2"></i>
                    <p>Chart visualization would be implemented here</p>
                    <p class="text-sm">Consider integrating Chart.js or similar library</p>
                  </div>
                </div>
              </div>
              
              <!-- Top Errors -->
              <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Errors</h3>
                <div id="top-errors" class="space-y-2">
                  <div class="text-gray-500 text-center py-4">
                    <i class="fas fa-list-ol text-2xl mb-2"></i>
                    <p>No errors to display</p>
                  </div>
                </div>
              </div>
              
              <!-- Recent Errors -->
              <div class="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h3>
                <div id="recent-errors" class="space-y-2 max-h-96 overflow-y-auto">
                  <div class="text-gray-500 text-center py-4">
                    <i class="fas fa-history text-2xl mb-2"></i>
                    <p>No recent errors</p>
                  </div>
                </div>
              </div>
              
              <!-- Error Distribution -->
              <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Error Distribution</h3>
                <div id="error-distribution" class="space-y-2">
                  <div class="text-gray-500 text-center py-4">
                    <i class="fas fa-chart-pie text-2xl mb-2"></i>
                    <p>No data available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="bg-gray-50 border-t border-gray-200 p-4">
            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-600">
                <span id="last-updated">Last updated: Never</span>
              </div>
              <div class="flex gap-2">
                <button id="export-logs" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  <i class="fas fa-download mr-2"></i>Export Logs
                </button>
                <button id="clear-logs" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                  <i class="fas fa-trash mr-2"></i>Clear Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.dashboardElement);
  }

  setupEventListeners() {
    // Close button
    document.getElementById("close-analytics").addEventListener("click", () => {
      this.hide();
    });

    // Refresh button
    document
      .getElementById("refresh-analytics")
      .addEventListener("click", () => {
        this.refresh();
      });

    // Export logs
    document.getElementById("export-logs").addEventListener("click", () => {
      this.exportLogs();
    });

    // Clear logs
    document.getElementById("clear-logs").addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all error logs?")) {
        this.clearLogs();
      }
    });

    // Close on background click
    this.dashboardElement.addEventListener("click", (e) => {
      if (e.target === this.dashboardElement) {
        this.hide();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isVisible) {
        this.hide();
      }
    });
  }

  startAutoRefresh() {
    this.refreshIntervalId = setInterval(() => {
      if (this.isVisible) {
        this.refresh();
      }
    }, this.refreshInterval);
  }

  show() {
    this.isVisible = true;
    this.dashboardElement.classList.remove("hidden");
    this.refresh();
  }

  hide() {
    this.isVisible = false;
    this.dashboardElement.classList.add("hidden");
  }

  refresh() {
    this.updateOverview();
    this.updateTopErrors();
    this.updateRecentErrors();
    this.updateErrorDistribution();
    this.updateHealthStatus();
    this.updateLastUpdated();
  }

  updateOverview() {
    if (!this.errorLogger) return;

    const stats = this.errorLogger.getErrorStats("24h");
    const healthStatus = this.healthMonitor
      ? this.healthMonitor.getStatus()
      : null;

    // Update total errors
    document.getElementById("total-errors").textContent = stats.total;

    // Update error rate
    const errorRate =
      stats.total > 0
        ? (((stats.byLevel.ERROR || 0) / stats.total) * 100).toFixed(1)
        : "0";
    document.getElementById("error-rate").textContent = `${errorRate}%`;

    // Update health status
    if (healthStatus) {
      const statusElement = document.getElementById("health-status");
      statusElement.textContent =
        healthStatus.status.charAt(0).toUpperCase() +
        healthStatus.status.slice(1);
      statusElement.className = `text-lg font-bold ${
        healthStatus.status === "healthy"
          ? "text-green-600"
          : healthStatus.status === "warning"
            ? "text-yellow-600"
            : healthStatus.status === "degraded"
              ? "text-orange-600"
              : "text-red-600"
      }`;

      // Update average response time
      const avgResponse = Math.round(healthStatus.metrics.averageResponseTime);
      document.getElementById("avg-response").textContent = `${avgResponse}ms`;
    }
  }

  updateTopErrors() {
    if (!this.errorLogger) return;

    const stats = this.errorLogger.getErrorStats("24h");
    const topErrorsContainer = document.getElementById("top-errors");

    if (Object.keys(stats.topErrors).length === 0) {
      topErrorsContainer.innerHTML = `
        <div class="text-gray-500 text-center py-4">
          <i class="fas fa-list-ol text-2xl mb-2"></i>
          <p>No errors to display</p>
        </div>
      `;
      return;
    }

    const topErrorsHtml = Object.entries(stats.topErrors)
      .slice(0, 5)
      .map(
        ([error, count], index) => `
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div class="flex items-center">
            <span class="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold mr-2">
              ${index + 1}
            </span>
            <span class="text-sm text-gray-900 truncate max-w-xs">${error}</span>
          </div>
          <span class="text-sm font-semibold text-gray-600">${count}</span>
        </div>
      `,
      )
      .join("");

    topErrorsContainer.innerHTML = topErrorsHtml;
  }

  updateRecentErrors() {
    if (!this.errorLogger) return;

    const recentErrors = this.errorLogger.getRecentErrors(10);
    const recentErrorsContainer = document.getElementById("recent-errors");

    if (recentErrors.length === 0) {
      recentErrorsContainer.innerHTML = `
        <div class="text-gray-500 text-center py-4">
          <i class="fas fa-history text-2xl mb-2"></i>
          <p>No recent errors</p>
        </div>
      `;
      return;
    }

    const recentErrorsHtml = recentErrors
      .map((error) => {
        const timeAgo = this.getTimeAgo(new Date(error.timestamp));
        const errorType = error.error ? error.error.name : "Unknown";

        return `
        <div class="border-l-4 border-red-500 pl-4 py-2">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">${error.message}</p>
              <p class="text-xs text-gray-600 mt-1">${errorType} • ${timeAgo}</p>
              ${
                error.context && Object.keys(error.context).length > 0
                  ? `<p class="text-xs text-gray-500 mt-1">Context: ${JSON.stringify(error.context)}</p>`
                  : ""
              }
            </div>
            <span class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
              ${error.level}
            </span>
          </div>
        </div>
      `;
      })
      .join("");

    recentErrorsContainer.innerHTML = recentErrorsHtml;
  }

  updateErrorDistribution() {
    if (!this.errorLogger) return;

    const stats = this.errorLogger.getErrorStats("24h");
    const distributionContainer = document.getElementById("error-distribution");

    if (Object.keys(stats.byLevel).length === 0) {
      distributionContainer.innerHTML = `
        <div class="text-gray-500 text-center py-4">
          <i class="fas fa-chart-pie text-2xl mb-2"></i>
          <p>No data available</p>
        </div>
      `;
      return;
    }

    const total = Object.values(stats.byLevel).reduce((a, b) => a + b, 0);
    const distributionHtml = Object.entries(stats.byLevel)
      .map(([level, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        const color =
          level === "ERROR" ? "red" : level === "WARN" ? "yellow" : "blue";

        return `
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-${color}-500 rounded-full mr-2"></div>
              <span class="text-sm text-gray-900">${level}</span>
            </div>
            <div class="flex items-center">
              <div class="w-24 bg-gray-200 rounded-full h-2 mr-2">
                <div class="bg-${color}-500 h-2 rounded-full" style="width: ${percentage}%"></div>
              </div>
              <span class="text-sm text-gray-600 w-12 text-right">${percentage}%</span>
            </div>
          </div>
        `;
      })
      .join("");

    distributionContainer.innerHTML = distributionHtml;
  }

  updateHealthStatus() {
    // Health status is already updated in updateOverview()
  }

  updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById("last-updated").textContent =
      `Last updated: ${timeString}`;
  }

  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  exportLogs() {
    if (!this.errorLogger) return;

    try {
      const logs = this.errorLogger.exportLogs("json");
      const blob = new Blob([logs], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `apgi-error-logs-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (window.errorHandler) {
        window.errorHandler.showSuccess("Error logs exported successfully");
      }
    } catch (error) {
      if (window.errorHandler) {
        window.errorHandler.showError("Failed to export error logs");
      }
    }
  }

  clearLogs() {
    if (!this.errorLogger) return;

    this.errorLogger.clearLogs();
    this.refresh();

    if (window.errorHandler) {
      window.errorHandler.showSuccess("Error logs cleared successfully");
    }
  }

  destroy() {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }

    if (this.dashboardElement && this.dashboardElement.parentNode) {
      this.dashboardElement.parentNode.removeChild(this.dashboardElement);
    }
  }
}

// Initialize error analytics
const errorAnalytics = new ErrorAnalytics();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ErrorAnalytics;
} else {
  window.ErrorAnalytics = ErrorAnalytics;
  window.errorAnalytics = errorAnalytics;
}
