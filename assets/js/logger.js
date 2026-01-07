// Production-safe logging utility for APGI Framework
// Provides different logging levels based on environment

class Logger {
  constructor() {
    this.isDevelopment = this.checkDevelopmentMode();
    this.logLevel = this.getLogLevel();
  }

  checkDevelopmentMode() {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('.local') ||
      window.location.search.includes('debug=true')
    );
  }

  getLogLevel() {
    // Can be configured via localStorage or URL params
    const savedLevel = localStorage.getItem('apgi_log_level');
    const urlLevel = new URLSearchParams(window.location.search).get('log_level');

    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    const level = urlLevel || savedLevel || (this.isDevelopment ? 'debug' : 'error');
    return levels[level] || 0;
  }

  shouldLog(level) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    return this.logLevel >= levels[level];
  }

  formatMessage(level, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [APGI]`;

    if (args.length === 1 && typeof args[0] === 'object') {
      return [prefix, args[0]];
    }

    return [prefix, ...args];
  }

  error(...args) {
    if (this.shouldLog('error') && this.isDevelopment) {
      const formatted = this.formatMessage('error', ...args);
      console.error(...formatted);
    }

    // Send error to monitoring service in production
    if (!this.isDevelopment) {
      this.sendToMonitoring('error', args);
    }
  }

  warn(...args) {
    if (this.shouldLog('warn') && this.isDevelopment) {
      const formatted = this.formatMessage('warn', ...args);
      console.warn(...formatted);
    }
  }

  info(...args) {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', ...args);
      console.info(...formatted);
    }
  }

  debug(...args) {
    if (this.shouldLog('debug') && this.isDevelopment) {
      const formatted = this.formatMessage('debug', ...args);
      console.log(...formatted);
    }
  }

  // Performance logging
  performance(metric, value) {
    if (this.shouldLog('debug') && this.isDevelopment) {
      const formatted = this.formatMessage('PERF', `${metric}: ${value}ms`);
      console.log(...formatted);
    }

    // Send performance metrics to analytics in production
    if (!this.isDevelopment) {
      this.sendToAnalytics('performance', { metric, value });
    }
  }

  // Send errors to monitoring service (placeholder implementation)
  sendToMonitoring(level, args) {
    // In production, this would send to error tracking service
    // like Sentry, LogRocket, or custom endpoint

    try {
      const errorData = {
        level,
        message: args[0],
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        stack: args[0]?.stack
      };

      // Placeholder: would send to monitoring service
      // fetch('/api/logs', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(errorData)
      // }).catch(() => {}); // Silently fail
    } catch (e) {
      // Don't let logging errors break the app
    }
  }

  // Send performance metrics
  sendPerformanceMetric(metric, value) {
    try {
      const perfData = {
        metric,
        value,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      // Placeholder: would send to analytics service
      // fetch('/api/analytics/performance', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(perfData)
      // }).catch(() => {}); // Silently fail
    } catch (e) {
      // Don't let logging errors break the app
    }
  }

  // Create context-specific loggers
  createContext(context) {
    return {
      error: (...args) => this.error(`[${context}]`, ...args),
      warn: (...args) => this.warn(`[${context}]`, ...args),
      info: (...args) => this.info(`[${context}]`, ...args),
      debug: (...args) => this.debug(`[${context}]`, ...args)
    };
  }
}

// Create global logger instance
window.logger = new Logger();

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
}
