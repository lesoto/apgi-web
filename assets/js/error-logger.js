/**
 * Centralized Error Logging Service for APGI Framework
 * Provides structured error logging with multiple output destinations
 */

class ErrorLogger {
  constructor(options = {}) {
    this.enableConsole = options.enableConsole !== false;
    this.enableLocalStorage = options.enableLocalStorage !== false;
    this.enableRemote = options.enableRemote || false;
    this.remoteEndpoint = options.remoteEndpoint || null;
    this.maxLocalLogs = options.maxLocalLogs || 1000;
    this.logLevel = options.logLevel || "error"; // error, warn, info, debug

    this.logs = [];
    this.sessionId = this.generateSessionId();
    this.userAgent = navigator.userAgent;
    this.init();
  }

  init() {
    // Load existing logs from localStorage
    if (this.enableLocalStorage) {
      this.loadLogsFromStorage();
    }

    // Setup periodic cleanup
    setInterval(() => this.cleanupOldLogs(), 60000); // Every minute

    // Setup page unload handler to sync logs
    window.addEventListener("beforeunload", () => {
      this.syncLogsToStorage();
    });
  }

  generateSessionId() {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  log(level, message, error = null, context = {}) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message: message,
      sessionId: this.sessionId,
      userAgent: this.userAgent,
      url: window.location.href,
      context: context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            status: error.status,
          }
        : null,
    };

    // Add to memory
    this.logs.push(logEntry);

    // Console output
    if (this.enableConsole && this.shouldLog(level)) {
      this.logToConsole(logEntry);
    }

    // Local storage
    if (this.enableLocalStorage) {
      this.syncLogsToStorage();
    }

    // Remote logging
    if (this.enableRemote && this.remoteEndpoint && this.shouldLog(level)) {
      this.sendToRemote(logEntry);
    }

    // Cleanup if too many logs
    if (this.logs.length > this.maxLocalLogs) {
      this.logs = this.logs.slice(-this.maxLocalLogs);
    }
  }

  error(message, error = null, context = {}) {
    this.log("error", message, error, context);
  }

  warn(message, error = null, context = {}) {
    this.log("warn", message, error, context);
  }

  info(message, context = {}) {
    this.log("info", message, null, context);
  }

  debug(message, context = {}) {
    this.log("debug", message, null, context);
  }

  generateLogId() {
    return "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.logLevel] || 2;
    const messageLevel = levels[level] || 2;
    return messageLevel >= currentLevel;
  }

  logToConsole(logEntry) {
    const style = this.getConsoleStyle(logEntry.level);
    const args = [
      `%c[${logEntry.level}]%c ${logEntry.message}`,
      style.prefix,
      style.message,
    ];

    if (logEntry.error) {
      args.push("\nError:", logEntry.error);
    }

    if (Object.keys(logEntry.context).length > 0) {
      args.push("\nContext:", logEntry.context);
    }

    console[logEntry.level.toLowerCase()](...args);
  }

  getConsoleStyle(level) {
    const styles = {
      ERROR: {
        prefix:
          "background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold",
        message: "color: #ef4444; font-weight: bold",
      },
      WARN: {
        prefix:
          "background: #f59e0b; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold",
        message: "color: #f59e0b; font-weight: bold",
      },
      INFO: {
        prefix:
          "background: #3b82f6; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold",
        message: "color: #3b82f6; font-weight: bold",
      },
      DEBUG: {
        prefix:
          "background: #6b7280; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold",
        message: "color: #6b7280; font-weight: normal",
      },
    };

    return styles[level] || styles.INFO;
  }

  syncLogsToStorage() {
    try {
      const logsToStore = this.logs.slice(-this.maxLocalLogs);
      localStorage.setItem("apgi_error_logs", JSON.stringify(logsToStore));
    } catch (error) {
      console.warn("Failed to sync logs to localStorage:", error);
    }
  }

  loadLogsFromStorage() {
    try {
      const stored = localStorage.getItem("apgi_error_logs");
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load logs from localStorage:", error);
      this.logs = [];
    }
  }

  async sendToRemote(logEntry) {
    if (!this.remoteEndpoint) return;

    try {
      // Use navigator.sendBeacon for reliability during page unload
      const data = JSON.stringify(logEntry);

      if (navigator.sendBeacon) {
        navigator.sendBeacon(this.remoteEndpoint, data);
      } else {
        // Fallback to fetch
        await fetch(this.remoteEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: data,
          keepalive: true,
        });
      }
    } catch (error) {
      // Don't create infinite loop by logging logging errors
      console.warn("Failed to send log to remote endpoint:", error);
    }
  }

  cleanupOldLogs() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.logs = this.logs.filter(
      (log) => new Date(log.timestamp).getTime() > oneHourAgo,
    );
    this.syncLogsToStorage();
  }

  // Analytics and reporting methods
  getErrorStats(timeRange = "1h") {
    const now = Date.now();
    let cutoffTime;

    switch (timeRange) {
      case "1h":
        cutoffTime = now - 60 * 60 * 1000;
        break;
      case "24h":
        cutoffTime = now - 24 * 60 * 60 * 1000;
        break;
      case "7d":
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        cutoffTime = now - 60 * 60 * 1000;
    }

    const recentLogs = this.logs.filter(
      (log) => new Date(log.timestamp).getTime() > cutoffTime,
    );

    const stats = {
      total: recentLogs.length,
      byLevel: {},
      byType: {},
      byHour: {},
      topErrors: {},
      sessions: new Set(),
    };

    recentLogs.forEach((log) => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

      // Count by error type
      if (log.error && log.error.name) {
        stats.byType[log.error.name] = (stats.byType[log.error.name] || 0) + 1;
      }

      // Count by hour
      const hour = new Date(log.timestamp).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;

      // Track top errors
      if (log.level === "ERROR") {
        const key = log.error ? log.error.name : log.message.substring(0, 50);
        stats.topErrors[key] = (stats.topErrors[key] || 0) + 1;
      }

      // Track sessions
      stats.sessions.add(log.sessionId);
    });

    stats.sessions = stats.sessions.size;

    // Sort top errors
    stats.topErrors = Object.entries(stats.topErrors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, count]) => {
        obj[key] = count;
        return obj;
      }, {});

    return stats;
  }

  getRecentErrors(limit = 50) {
    return this.logs
      .filter((log) => log.level === "ERROR")
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  exportLogs(format = "json") {
    const data = {
      exportedAt: new Date().toISOString(),
      sessionId: this.sessionId,
      userAgent: this.userAgent,
      totalLogs: this.logs.length,
      logs: this.logs,
    };

    switch (format) {
      case "json":
        return JSON.stringify(data, null, 2);
      case "csv":
        return this.convertToCSV(data.logs);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  convertToCSV(logs) {
    const headers = [
      "timestamp",
      "level",
      "message",
      "sessionId",
      "url",
      "errorName",
      "errorMessage",
    ];
    const csvRows = [headers.join(",")];

    logs.forEach((log) => {
      const row = [
        log.timestamp,
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
        log.sessionId,
        log.url,
        log.error ? log.error.name : "",
        log.error ? `"${log.error.message.replace(/"/g, '""')}"` : "",
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  clearLogs() {
    this.logs = [];
    if (this.enableLocalStorage) {
      localStorage.removeItem("apgi_error_logs");
    }
  }

  // Health monitoring
  getHealthStatus() {
    const stats = this.getErrorStats("1h");
    const health = {
      status: "healthy",
      issues: [],
      metrics: stats,
    };

    // Check error rate
    if (stats.total > 100) {
      health.status = "critical";
      health.issues.push("High error volume detected");
    } else if (stats.total > 50) {
      health.status = "warning";
      health.issues.push("Elevated error volume detected");
    }

    // Check for repeated errors
    const topErrorCount = Object.values(stats.topErrors)[0] || 0;
    if (topErrorCount > 20) {
      health.status = "critical";
      health.issues.push("High frequency of repeated errors detected");
    }

    return health;
  }
}

// Initialize global error logger
const errorLogger = new ErrorLogger({
  enableConsole: true,
  enableLocalStorage: true,
  enableRemote: false, // Set to true and provide endpoint for production
  logLevel: "error",
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ErrorLogger;
} else {
  window.ErrorLogger = ErrorLogger;
  window.errorLogger = errorLogger;
}
