/**
 * APGI Framework - Enhanced CDN Fallback System
 * Provides robust fallback loading for all critical CDN resources
 */

class EnhancedCDNFallbackManager {
  constructor() {
    this.fallbacks = {
      // CSS Libraries
      tailwindcss: {
        cdn: "https://cdn.tailwindcss.com",
        local: "assets/css/tailwind-fallback.css",
        type: "css",
        loaded: false,
        critical: true,
      },
      fontawesome: {
        cdn: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
        local: "assets/css/fontawesome-fallback.css",
        type: "css",
        loaded: false,
        critical: true,
      },

      // JavaScript Libraries
      chartjs: {
        cdn: "https://cdn.jsdelivr.net/npm/chart.js",
        local: "assets/js/chartjs-fallback.js",
        type: "js",
        loaded: false,
        critical: true,
        integrity:
          "sha384-jb8JQMbMoBUzgWatfe6COACi2ljcDdZQ2OxczGA3bGNeWe+6DChMTBJemed7ZnvJ",
      },
      lucide: {
        cdn: "https://unpkg.com/lucide@latest/dist/umd/lucide.js",
        local: "assets/js/lucide-fallback.js",
        type: "js",
        loaded: false,
        critical: true,
      },
      stripe: {
        cdn: "https://js.stripe.com/v3/",
        local: "assets/js/stripe-fallback.js",
        type: "js",
        loaded: false,
        critical: true,
      },

      // React Ecosystem
      react: {
        cdn: "https://unpkg.com/react@18/umd/react.production.min.js",
        local: "assets/js/react-fallback.js",
        type: "js",
        loaded: false,
        critical: false,
      },
      reactdom: {
        cdn: "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
        local: "assets/js/react-dom-fallback.js",
        type: "js",
        loaded: false,
        critical: false,
      },
      recharts: {
        cdn: "https://unpkg.com/recharts@2.8.0/umd/Recharts.js",
        local: "assets/js/recharts-fallback.js",
        type: "js",
        loaded: false,
        critical: false,
      },

      // Visualization Libraries
      plotly: {
        cdn: "https://cdn.plot.ly/plotly-3.3.0.min.js",
        local: "assets/js/plotly-fallback.js",
        type: "js",
        loaded: false,
        critical: false,
      },
      d3: {
        cdn: "https://d3js.org/d3.v7.min.js",
        local: "assets/js/d3-fallback.js",
        type: "js",
        loaded: false,
        critical: false,
      },

      // Fonts
      googleFonts: {
        cdn: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap",
        local: "assets/css/fonts-fallback.css",
        type: "css",
        loaded: false,
        critical: true,
      },

      // Additional Chart.js Plugins
      chartjsDatalabels: {
        cdn: "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0",
        local: "assets/js/chartjs-datalabels-fallback.js",
        type: "js",
        loaded: false,
        critical: false,
      },
      chartjsAnnotation: {
        cdn: "https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@1.0.2",
        local: "assets/js/chartjs-annotation-fallback.js",
        type: "js",
        loaded: false,
        critical: false,
      },
    };

    this.timeout = 5000; // 5 seconds timeout
    this.retryAttempts = 2;
    this.loadedResources = new Set();
    this.failedResources = new Set();

    this.init();
  }

  init() {
    // Set up global error handler for script loading
    this.setupGlobalErrorHandler();

    // Start loading critical resources first
    this.loadCriticalResources();

    // Load non-critical resources after a short delay
    setTimeout(() => this.loadNonCriticalResources(), 100);

    // Set up connectivity monitoring
    this.setupConnectivityMonitoring();
  }

  setupGlobalErrorHandler() {
    window.addEventListener("error", (event) => {
      if (
        event.target &&
        (event.target.tagName === "SCRIPT" || event.target.tagName === "LINK")
      ) {
        const src = event.target.src || event.target.href;
        this.handleResourceFailure(src);
      }
    });
  }

  loadCriticalResources() {
    Object.entries(this.fallbacks)
      .filter(([, config]) => config.critical)
      .forEach(([name, config]) => this.loadResource(name, config));
  }

  loadNonCriticalResources() {
    Object.entries(this.fallbacks)
      .filter(([, config]) => !config.critical)
      .forEach(([name, config]) => this.loadResource(name, config));
  }

  async loadResource(name, config) {
    if (this.loadedResources.has(name) || this.failedResources.has(name)) {
      return;
    }

    try {
      await this.loadWithTimeout(name, config);
      this.markResourceLoaded(name);
    } catch (error) {
      console.warn(`Failed to load ${name} from CDN, trying fallback:`, error);
      await this.loadFallback(name, config);
    }
  }

  loadWithTimeout(name, config) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading ${name}`));
      }, this.timeout);

      const element = this.createElement(name, config);

      const cleanup = () => {
        clearTimeout(timeoutId);
      };

      if (config.type === "css") {
        element.onload = () => {
          cleanup();
          resolve();
        };
        element.onerror = () => {
          cleanup();
          reject(new Error(`Failed to load CSS: ${name}`));
        };
      } else {
        element.onload = () => {
          cleanup();
          // Verify the library loaded properly
          if (this.verifyLibraryLoaded(name)) {
            resolve();
          } else {
            reject(new Error(`Library ${name} failed to initialize`));
          }
        };
        element.onerror = () => {
          cleanup();
          reject(new Error(`Failed to load JS: ${name}`));
        };
      }

      document.head.appendChild(element);
    });
  }

  createElement(name, config) {
    let element;

    if (config.type === "css") {
      element = document.createElement("link");
      element.rel = "stylesheet";
      element.href = config.cdn;
      if (config.integrity) {
        element.integrity = config.integrity;
        element.crossOrigin = "anonymous";
      }
    } else {
      element = document.createElement("script");
      element.src = config.cdn;
      element.async = true;
      if (config.integrity) {
        element.integrity = config.integrity;
        element.crossOrigin = "anonymous";
      }
    }

    element.setAttribute("data-resource-name", name);
    element.setAttribute("data-cdn-source", "true");

    return element;
  }

  async loadFallback(name, config) {
    try {
      const element = this.createFallbackElement(name, config);
      document.head.appendChild(element);

      // Wait a bit for the fallback to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (this.verifyLibraryLoaded(name)) {
        this.markResourceLoaded(name);
        console.log(`Successfully loaded fallback for ${name}`);
      } else {
        throw new Error(`Fallback for ${name} failed to initialize`);
      }
    } catch (error) {
      console.error(`Both CDN and fallback failed for ${name}:`, error);
      this.markResourceFailed(name);
      this.showFallbackNotification(name);
    }
  }

  createFallbackElement(name, config) {
    let element;

    if (config.type === "css") {
      element = document.createElement("link");
      element.rel = "stylesheet";
      element.href = config.local;
    } else {
      element = document.createElement("script");
      element.src = config.local;
      element.async = true;
    }

    element.setAttribute("data-resource-name", name);
    element.setAttribute("data-fallback-source", "true");

    return element;
  }

  verifyLibraryLoaded(name) {
    switch (name) {
      case "chartjs":
        return typeof window.Chart !== "undefined";
      case "lucide":
        return typeof window.lucide !== "undefined";
      case "stripe":
        return typeof window.Stripe !== "undefined";
      case "react":
        return typeof window.React !== "undefined";
      case "reactdom":
        return typeof window.ReactDOM !== "undefined";
      case "recharts":
        return typeof window.Recharts !== "undefined";
      case "plotly":
        return typeof window.Plotly !== "undefined";
      case "d3":
        return typeof window.d3 !== "undefined";
      case "tailwindcss":
        // Check if Tailwind classes are available
        return (
          document.querySelector("style[data-tailwind]") ||
          document.querySelector('link[href*="tailwind"]')
        );
      case "fontawesome":
        // Check if FA icons are available
        return (
          document.querySelector('link[href*="font-awesome"]') ||
          typeof window.FontAwesome !== "undefined"
        );
      default:
        return true; // Assume other resources loaded if no error thrown
    }
  }

  markResourceLoaded(name) {
    this.loadedResources.add(name);
    this.fallbacks[name].loaded = true;
    this.dispatchResourceEvent(name, "loaded");
  }

  markResourceFailed(name) {
    this.failedResources.add(name);
    this.dispatchResourceEvent(name, "failed");
  }

  dispatchResourceEvent(name, status) {
    const event = new CustomEvent("cdn-resource-status", {
      detail: { name, status },
    });
    document.dispatchEvent(event);
  }

  showFallbackNotification(resourceName) {
    // Only show notifications for critical resources
    if (!this.fallbacks[resourceName]?.critical) return;

    const notification = document.createElement("div");
    notification.className = "cdn-fallback-notification";
    notification.innerHTML = `
            <div class="cdn-fallback-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Some resources failed to load. Functionality may be limited.</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

    // Add styles if not already present
    this.addNotificationStyles();

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  addNotificationStyles() {
    if (document.getElementById("cdn-notification-styles")) return;

    const styles = document.createElement("style");
    styles.id = "cdn-notification-styles";
    styles.textContent = `
            .cdn-fallback-notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                background: #ff6b6b;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                max-width: 400px;
                animation: slideDown 0.3s ease-out;
            }
            
            .cdn-fallback-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .cdn-fallback-content button {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                margin-left: auto;
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @media (max-width: 768px) {
                .cdn-fallback-notification {
                    left: 20px;
                    right: 20px;
                    transform: none;
                    max-width: none;
                }
            }
        `;

    document.head.appendChild(styles);
  }

  setupConnectivityMonitoring() {
    window.addEventListener("online", () => {
      console.log("Connection restored, retrying failed resources...");
      this.retryFailedResources();
    });

    window.addEventListener("offline", () => {
      console.log("Connection lost, using fallbacks...");
    });
  }

  retryFailedResources() {
    const failed = Array.from(this.failedResources);
    this.failedResources.clear();

    failed.forEach((name) => {
      const config = this.fallbacks[name];
      if (config) {
        this.loadResource(name, config);
      }
    });
  }

  // Public API
  isResourceLoaded(name) {
    return this.loadedResources.has(name);
  }

  getLoadedResources() {
    return Array.from(this.loadedResources);
  }

  getFailedResources() {
    return Array.from(this.failedResources);
  }

  forceReload(name) {
    const config = this.fallbacks[name];
    if (config) {
      this.loadedResources.delete(name);
      this.failedResources.delete(name);
      this.loadResource(name, config);
    }
  }
}

// Auto-initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.cdnFallbackManager = new EnhancedCDNFallbackManager();
  });
} else {
  window.cdnFallbackManager = new EnhancedCDNFallbackManager();
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = EnhancedCDNFallbackManager;
}
