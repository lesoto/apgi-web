/**
 * Global Error Handler for APGI Framework
 * Provides centralized error handling with user-friendly notifications
 */

class GlobalErrorHandler {
  constructor() {
    this.errorContainer = null;
    this.errorQueue = [];
    this.isShowing = false;
    this.errorCounts = {};
    this.init();
  }

  init() {
    this.createErrorContainer();
    this.setupGlobalErrorListeners();
    this.setupUnhandledRejectionHandler();
  }

  createErrorContainer() {
    // Create error notification container
    this.errorContainer = document.createElement("div");
    this.errorContainer.id = "global-error-container";
    this.errorContainer.className = "fixed top-4 right-4 z-50 max-w-md";
    document.body.appendChild(this.errorContainer);

    // Add styles for error notifications
    const style = document.createElement("style");
    style.textContent = `
      #global-error-container {
        pointer-events: none;
      }
      
      .error-notification {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        margin-bottom: 12px;
        box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: all;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }

      .error-notification.show {
        transform: translateX(0);
        opacity: 1;
      }

      .error-notification.hide {
        transform: translateX(400px);
        opacity: 0;
      }

      .error-notification.warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
      }

      .error-notification.info {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
      }

      .error-notification.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
      }

      .error-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 4px;
        font-family: var(--font-body, system-ui);
      }

      .error-message {
        font-size: 13px;
        opacity: 0.9;
        line-height: 1.4;
        font-family: var(--font-body, system-ui);
      }

      .error-action {
        margin-top: 8px;
        font-size: 12px;
        opacity: 0.8;
        font-style: italic;
      }

      .error-close {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: background 0.2s;
      }

      .error-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      @media (max-width: 640px) {
        #global-error-container {
          top: auto;
          bottom: 20px;
          right: 20px;
          left: 20px;
          max-width: none;
        }

        .error-notification {
          transform: translateY(100px);
        }

        .error-notification.show {
          transform: translateY(0);
        }

        .error-notification.hide {
          transform: translateY(100px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupGlobalErrorListeners() {
    // Catch synchronous errors
    window.addEventListener("error", (event) => {
      this.handleError({
        type: "javascript",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString(),
      });
    });
  }

  setupUnhandledRejectionHandler() {
    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.handleError({
        type: "promise",
        message: event.reason?.message || "Unhandled promise rejection",
        reason: event.reason,
        timestamp: new Date().toISOString(),
      });
    });
  }

  handleError(errorInfo) {
    // Log to console for debugging
    console.error("Global Error Handler:", errorInfo);

    // Track error frequency
    const errorKey = `${errorInfo.type}:${errorInfo.message}`;
    this.errorCounts[errorKey] = (this.errorCounts[errorKey] || 0) + 1;

    // Don't show the same error more than 3 times in a session
    if (this.errorCounts[errorKey] > 3) {
      return;
    }

    // Create user-friendly error message
    const userError = this.createUserFriendlyError(errorInfo);

    // Add to queue
    this.errorQueue.push(userError);

    // Show next error if ready
    if (!this.isShowing) {
      this.showNextError();
    }
  }

  createUserFriendlyError(errorInfo) {
    const errorMessages = {
      // Network errors
      NetworkError: {
        type: "warning",
        title: "Connection Issue",
        message:
          "Having trouble connecting to our servers. Please check your internet connection.",
        action: "Try refreshing the page if the problem persists.",
      },
      FetchError: {
        type: "warning",
        title: "Network Request Failed",
        message:
          "Unable to complete the request. The server may be temporarily unavailable.",
        action: "Please try again in a few moments.",
      },

      // Authentication errors
      AuthenticationError: {
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to access this feature.",
        action: "Please log in to continue.",
      },

      // Permission errors
      PermissionError: {
        type: "warning",
        title: "Access Denied",
        message: "You don't have permission to perform this action.",
        action: "Contact support if you believe this is an error.",
      },

      // Validation errors
      ValidationError: {
        type: "info",
        title: "Invalid Input",
        message: "Please check your input and try again.",
        action: "Make sure all required fields are filled correctly.",
      },

      // Default JavaScript errors
      TypeError: {
        type: "warning",
        title: "Application Error",
        message: "Something unexpected happened. We're working to fix it.",
        action: "Try refreshing the page to continue.",
      },
      ReferenceError: {
        type: "warning",
        title: "Application Error",
        message: "A feature is temporarily unavailable.",
        action: "Please try again later.",
      },
    };

    // Determine error type from message or error name
    let errorType = "javascript";
    let userMessage = errorMessages.javascript;

    if (errorInfo.error && errorInfo.error.name) {
      userMessage = errorMessages[errorInfo.error.name] || userMessage;
      errorType = errorInfo.error.name;
    } else if (errorInfo.message) {
      // Check message content for known patterns
      const message = errorInfo.message.toLowerCase();
      if (message.includes("network") || message.includes("fetch")) {
        userMessage = errorMessages.NetworkError;
        errorType = "NetworkError";
      } else if (
        message.includes("unauthorized") ||
        message.includes("authentication")
      ) {
        userMessage = errorMessages.AuthenticationError;
        errorType = "AuthenticationError";
      } else if (
        message.includes("permission") ||
        message.includes("forbidden")
      ) {
        userMessage = errorMessages.PermissionError;
        errorType = "PermissionError";
      } else if (
        message.includes("validation") ||
        message.includes("invalid")
      ) {
        userMessage = errorMessages.ValidationError;
        errorType = "ValidationError";
      }
    }

    return {
      ...userMessage,
      originalError: errorInfo,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
    };
  }

  showNextError() {
    if (this.errorQueue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const error = this.errorQueue.shift();
    this.showErrorNotification(error);
  }

  showErrorNotification(error) {
    const notification = document.createElement("div");
    notification.className = `error-notification ${error.type}`;
    notification.innerHTML = `
      <button class="error-close" aria-label="Close">&times;</button>
      <div class="error-title">${error.title}</div>
      <div class="error-message">${error.message}</div>
      ${error.action ? `<div class="error-action">${error.action}</div>` : ""}
    `;

    // Add close functionality
    const closeBtn = notification.querySelector(".error-close");
    const closeHandler = () => this.closeError(notification);
    closeBtn.addEventListener("click", closeHandler);
    notification.addEventListener("click", closeHandler);

    // Auto-hide after 8 seconds
    const autoHide = setTimeout(() => {
      if (notification.parentNode) {
        this.closeError(notification);
      }
    }, 8000);

    // Add to container and show
    this.errorContainer.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.add("show");
    });

    // Store timeout for cleanup
    notification._autoHide = autoHide;
  }

  closeError(notification) {
    if (notification._autoHide) {
      clearTimeout(notification._autoHide);
    }

    notification.classList.add("hide");

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.showNextError();
    }, 300);
  }

  // Public API for manual error handling
  showError(message, type = "warning", title = null) {
    this.handleError({
      type: "manual",
      message: message,
      title: title,
      errorType: type,
      timestamp: new Date().toISOString(),
    });
  }

  // Show success messages
  showSuccess(message, title = "Success") {
    const success = {
      type: "success",
      title: title,
      message: message,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
    };

    this.errorQueue.unshift(success);
    if (!this.isShowing) {
      this.showNextError();
    }
  }

  // Show info messages
  showInfo(message, title = "Information") {
    const info = {
      type: "info",
      title: title,
      message: message,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
    };

    this.errorQueue.unshift(info);
    if (!this.isShowing) {
      this.showNextError();
    }
  }
}

// Initialize global error handler
const globalErrorHandler = new GlobalErrorHandler();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = GlobalErrorHandler;
} else {
  window.GlobalErrorHandler = GlobalErrorHandler;
  window.errorHandler = globalErrorHandler;
}
