// CDN Fallback Manager for APGI Framework
// Provides fallback loading when CDN resources fail

class CDNFallbackManager {
  constructor() {
    this.fallbacks = {
      tailwindcss: {
        cdn: 'https://cdn.tailwindcss.com',
        local: 'assets/css/tailwind-fallback.css',
        loaded: false,
        element: null
      },
      lucide: {
        cdn: 'https://unpkg.com/lucide@latest',
        local: 'assets/js/lucide-fallback.js',
        loaded: false,
        element: null
      },
      fontawesome: {
        cdn: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
        local: 'assets/css/fontawesome-fallback.css',
        loaded: false,
        element: null
      },
      chartjs: {
        cdn: 'https://cdn.jsdelivr.net/npm/chart.js',
        local: 'assets/js/chartjs-fallback.js',
        loaded: false,
        element: null
      },
      plotly: {
        cdn: 'https://cdn.plot.ly/plotly-3.3.0.min.js',
        local: 'assets/js/plotly-fallback.js',
        loaded: false,
        element: null
      },
      fonts: {
        google:
          'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap',
        local: 'assets/css/fonts-fallback.css',
        loaded: false,
        element: null
      },
      react: {
        cdn: 'https://unpkg.com/react@18',
        local: 'assets/js/react-fallback.js',
        loaded: false,
        element: null
      },
      reactdom: {
        cdn: 'https://unpkg.com/react-dom@18',
        local: 'assets/js/react-dom-fallback.js',
        loaded: false,
        element: null
      },
      recharts: {
        cdn: 'https://unpkg.com/recharts@2.8.0',
        local: 'assets/js/recharts-fallback.js',
        loaded: false,
        element: null
      }
    };

    this.init();
  }

  init() {
    // Monitor CDN loading failures
    this.setupErrorMonitoring();

    // Set up timeout for CDN fallbacks
    this.setupTimeouts();

    // Create fallback indicators
    this.createFallbackIndicator();
  }

  setupErrorMonitoring() {
    // Monitor script loading errors
    window.addEventListener(
      'error',
      event => {
        const target = event.target;
        if (target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
          this.handleCDNFailure(target);
        }
      },
      true
    );

    // Monitor CSS loading failures
    document.addEventListener(
      'error',
      event => {
        const target = event.target;
        if (target.tagName === 'LINK' && target.rel === 'stylesheet') {
          this.handleCDNFailure(target);
        }
      },
      true
    );
  }

  setupTimeouts() {
    // Set timeout for each CDN resource
    Object.keys(this.fallbacks).forEach(key => {
      if (key === 'fonts') return; // Fonts handled separately

      setTimeout(() => {
        if (!this.fallbacks[key].loaded) {
          console.warn(`CDN timeout for ${key}, loading fallback`);
          this.loadFallback(key);
        }
      }, this.getTimeout(key));
    });
  }

  getTimeout(key) {
    const timeouts = {
      tailwindcss: 5000,
      lucide: 3000,
      fontawesome: 4000,
      chartjs: 4000,
      plotly: 6000,
      react: 3000,
      reactdom: 3000,
      recharts: 4000
    };
    return timeouts[key] || 5000;
  }

  handleCDNFailure(element) {
    const src = element.src || element.href;
    if (!src) return;

    // Find which CDN resource failed
    Object.keys(this.fallbacks).forEach(key => {
      const fallback = this.fallbacks[key];
      if (src.includes(fallback.cdn) && !fallback.loaded) {
        this.loadFallback(key);
        this.showFallbackMessage(key);
      }
    });
  }

  loadFallback(key) {
    const fallback = this.fallbacks[key];
    if (fallback.loaded) return;

    try {
      if (key === 'fonts') {
        // Load fallback CSS for fonts
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fallback.local;
        link.onload = () => {
          fallback.loaded = true;
          fallback.element = link;
          console.info(`Fallback loaded for ${key}`);
        };
        link.onerror = () => {
          console.error(`Failed to load fallback for ${key}`);
        };
        document.head.appendChild(link);
      } else if (fallback.local.endsWith('.css')) {
        // Load fallback CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fallback.local;
        link.onload = () => {
          fallback.loaded = true;
          fallback.element = link;
          console.info(`Fallback loaded for ${key}`);
        };
        link.onerror = () => {
          console.error(`Failed to load fallback for ${key}`);
        };
        document.head.appendChild(link);
      } else {
        // Load fallback JavaScript
        const script = document.createElement('script');
        script.src = fallback.local;
        script.onload = () => {
          fallback.loaded = true;
          fallback.element = script;
          console.info(`Fallback loaded for ${key}`);

          // Initialize library if needed
          this.initializeFallback(key);
        };
        script.onerror = () => {
          console.error(`Failed to load fallback for ${key}`);
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error(`Error loading fallback for ${key}:`, error);
    }
  }

  initializeFallback(key) {
    switch (key) {
      case 'lucide':
        // Initialize Lucide icons if fallback loaded
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
        break;
      case 'chartjs':
        // Chart.js will initialize automatically
        break;
      case 'plotly':
        // Plotly will initialize automatically
        break;
      case 'react':
      case 'reactdom':
        // React components will initialize automatically
        break;
      case 'recharts':
        // Recharts will initialize automatically
        break;
    }
  }

  createFallbackIndicator() {
    // Create a small indicator to show when fallbacks are active
    const indicator = document.createElement('div');
    indicator.id = 'cdn-fallback-indicator';
    indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: #f59e0b;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
    indicator.innerHTML = '⚠️ Using offline resources';
    document.body.appendChild(indicator);

    this.fallbackIndicator = indicator;
  }

  showFallbackMessage(key) {
    if (!this.fallbackIndicator) return;

    // Show indicator
    this.fallbackIndicator.style.opacity = '1';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (this.fallbackIndicator) {
        this.fallbackIndicator.style.opacity = '0';
      }
    }, 5000);

    console.warn(`Using fallback for ${key} due to CDN failure`);
  }

  // Public methods
  getFallbackStatus() {
    const status = {};
    Object.keys(this.fallbacks).forEach(key => {
      status[key] = {
        loaded: this.fallbacks[key].loaded,
        usingFallback: this.fallbacks[key].loaded
      };
    });
    return status;
  }

  forceFallback(key) {
    this.loadFallback(key);
  }
}

// Initialize CDN fallback manager
document.addEventListener('DOMContentLoaded', () => {
  window.cdnFallbackManager = new CDNFallbackManager();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CDNFallbackManager;
}
