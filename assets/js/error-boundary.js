/**
 * Error Boundary Components for APGI Framework
 * Provides React-style error boundaries for vanilla JavaScript applications
 */

class ErrorBoundary {
  constructor(options = {}) {
    this.fallbackComponent = options.fallbackComponent || this.defaultFallback;
    this.onError = options.onError || this.defaultErrorHandler;
    this.enableRetry = options.enableRetry !== false;
    this.maxRetries = options.maxRetries || 3;
    this.retryCount = 0;
    this.isErrorState = false;
    this.originalContent = null;
    this.container = options.container;
    this.componentName = options.componentName || "Component";

    this.init();
  }

  init() {
    if (!this.container) {
      console.warn("ErrorBoundary: No container provided");
      return;
    }

    this.originalContent = this.container.innerHTML;
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    // Capture errors in the container's event handlers
    this.container.addEventListener(
      "error",
      this.handleEventError.bind(this),
      true,
    );

    // Monitor for script errors within the container
    this.monitorScriptErrors();
  }

  monitorScriptErrors() {
    const scripts = this.container.querySelectorAll("script");
    scripts.forEach((script) => {
      if (!script.hasAttribute("data-error-handled")) {
        script.setAttribute("data-error-handled", "true");

        // Wrap script execution in try-catch
        const originalCode = script.textContent;
        if (originalCode.trim()) {
          script.textContent = `
            try {
              ${originalCode}
            } catch (error) {
              window.errorBoundaryHandlers = window.errorBoundaryHandlers || {};
              window.errorBoundaryHandlers['${this.componentName}'] && 
              window.errorBoundaryHandlers['${this.componentName}'].handleError(error);
            }
          `;
        }
      }
    });
  }

  handleEventError(event) {
    event.preventDefault();
    this.handleError(event.error || new Error(event.message));
  }

  handleError(error) {
    if (this.isErrorState) return; // Prevent infinite error loops

    this.isErrorState = true;

    // Log the error
    console.error(`ErrorBoundary [${this.componentName}]:`, error);

    // Call custom error handler
    this.onError(error, this.componentName);

    // Show fallback UI
    this.showErrorFallback(error);
  }

  showErrorFallback(error) {
    const fallbackHTML = this.fallbackComponent(
      error,
      this.componentName,
      this.enableRetry,
    );
    this.container.innerHTML = fallbackHTML;

    // Setup retry functionality if enabled
    if (this.enableRetry) {
      this.setupRetry();
    }
  }

  setupRetry() {
    const retryButton = this.container.querySelector("[data-error-retry]");
    if (retryButton) {
      retryButton.addEventListener("click", () => this.retry());
    }
  }

  retry() {
    if (this.retryCount >= this.maxRetries) {
      this.showErrorFallback(new Error("Maximum retry attempts exceeded"));
      return;
    }

    this.retryCount++;
    this.isErrorState = false;

    // Restore original content and reinitialize
    this.container.innerHTML = this.originalContent;
    this.init();

    // Show retry notification
    if (window.errorHandler) {
      window.errorHandler.showInfo(
        `Retrying ${this.componentName}... (Attempt ${this.retryCount}/${this.maxRetries})`,
        "Retry Attempt",
      );
    }
  }

  defaultFallback(error, componentName, enableRetry) {
    const errorMessage = error?.message || "An unexpected error occurred";
    const errorStack = error?.stack || "";

    return `
      <div class="error-boundary-fallback" style="
        padding: 2rem;
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border: 2px solid #fecaca;
        border-radius: 12px;
        text-align: center;
        font-family: var(--font-body, system-ui);
        color: #991b1b;
        margin: 1rem 0;
      ">
        <div style="
          width: 48px;
          height: 48px;
          margin: 0 auto 1rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        ">
          ⚠️
        </div>
        
        <h3 style="margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 600;">
          ${componentName} Error
        </h3>
        
        <p style="margin: 0 0 1rem 0; line-height: 1.5;">
          Something went wrong with this component. Our team has been notified.
        </p>
        
        <details style="
          margin: 1rem 0;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          text-align: left;
        ">
          <summary style="cursor: pointer; font-weight: 500; margin-bottom: 0.5rem;">
            Error Details
          </summary>
          <pre style="
            margin: 0.5rem 0 0 0;
            font-size: 0.875rem;
            overflow-x: auto;
            white-space: pre-wrap;
            color: #7f1d1d;
          ">${errorMessage}</pre>
          ${
            errorStack
              ? `<pre style="
            margin: 0.5rem 0 0 0;
            font-size: 0.75rem;
            overflow-x: auto;
            white-space: pre-wrap;
            color: #991b1b;
            opacity: 0.7;
          ">${errorStack}</pre>`
              : ""
          }
        </details>
        
        ${
          enableRetry && this.retryCount < this.maxRetries
            ? `
          <button 
            data-error-retry
            style="
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
              margin-right: 0.5rem;
              transition: transform 0.2s;
            "
            onmouseover="this.style.transform='translateY(-1px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            Try Again
          </button>
        `
            : ""
        }
        
        <button 
          onclick="window.location.reload()"
          style="
            background: transparent;
            color: #991b1b;
            border: 1px solid #fecaca;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          "
          onmouseover="this.style.background='#fecaca'"
          onmouseout="this.style.background='transparent'"
        >
          Reload Page
        </button>
      </div>
    `;
  }

  defaultErrorHandler(error, componentName) {
    // Report to global error handler if available
    if (window.errorHandler) {
      window.errorHandler.handleError({
        type: "component",
        message: error.message,
        componentName: componentName,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }

    // Log to console for debugging
    console.error(`ErrorBoundary [${componentName}]:`, error);
  }

  // Static method to create boundary for any element
  static create(selector, options = {}) {
    const element =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;
    if (!element) {
      console.warn("ErrorBoundary: Element not found:", selector);
      return null;
    }

    return new ErrorBoundary({ ...options, container: element });
  }

  // Static method to protect multiple components
  static protectAll(selectors, options = {}) {
    const boundaries = [];

    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        const boundary = new ErrorBoundary({
          ...options,
          container: element,
          componentName: `${options.componentName || "Component"}-${index}`,
        });
        boundaries.push(boundary);
      });
    });

    return boundaries;
  }
}

// Specialized error boundaries for different component types
class FormErrorBoundary extends ErrorBoundary {
  constructor(options = {}) {
    super({
      componentName: "Form",
      ...options,
      fallbackComponent: (error, componentName, enableRetry) => `
        <div class="form-error-boundary" style="
          padding: 1.5rem;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 2px solid #fecaca;
          border-radius: 12px;
          text-align: center;
          font-family: var(--font-body, system-ui);
          color: #991b1b;
        ">
          <div style="font-size: 2rem; margin-bottom: 1rem;">📝</div>
          <h3 style="margin: 0 0 1rem 0;">Form Error</h3>
          <p style="margin: 0 0 1rem;">
            There was a problem with this form. Please try again or contact support if the issue persists.
          </p>
          ${
            enableRetry
              ? `
            <button data-error-retry style="
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
            ">
              Retry Form
            </button>
          `
              : ""
          }
        </div>
      `,
    });
  }
}

class APIErrorBoundary extends ErrorBoundary {
  constructor(options = {}) {
    super({
      componentName: "API Component",
      ...options,
      fallbackComponent: (error, componentName, enableRetry) => `
        <div class="api-error-boundary" style="
          padding: 1.5rem;
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
          border: 2px solid #fcd34d;
          border-radius: 12px;
          text-align: center;
          font-family: var(--font-body, system-ui);
          color: #92400e;
        ">
          <div style="font-size: 2rem; margin-bottom: 1rem;">🔌</div>
          <h3 style="margin: 0 0 1rem 0;">Connection Error</h3>
          <p style="margin: 0 0 1rem;">
            Unable to connect to our services. Please check your internet connection and try again.
          </p>
          ${
            enableRetry
              ? `
            <button data-error-retry style="
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
            ">
              Retry Connection
            </button>
          `
              : ""
          }
        </div>
      `,
    });
  }
}

// Auto-initialize error boundaries for common selectors
document.addEventListener("DOMContentLoaded", () => {
  // Store handlers globally for script error monitoring
  window.errorBoundaryHandlers = {};

  // Create boundaries for common component types
  const commonSelectors = [
    { selector: ".form-container", Boundary: FormErrorBoundary },
    { selector: ".api-component", Boundary: APIErrorBoundary },
    { selector: ".critical-component", Boundary: ErrorBoundary },
  ];

  commonSelectors.forEach(({ selector, Boundary }) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      const boundary = new Boundary({
        container: element,
        componentName: `${selector.replace(".", "")}-${index}`,
      });
      window.errorBoundaryHandlers[boundary.componentName] = boundary;
    });
  });
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ErrorBoundary, FormErrorBoundary, APIErrorBoundary };
} else {
  window.ErrorBoundary = ErrorBoundary;
  window.FormErrorBoundary = FormErrorBoundary;
  window.APIErrorBoundary = APIErrorBoundary;
}
