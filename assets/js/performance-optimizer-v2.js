// Performance Optimizer v2.0 - Advanced optimization for APGI Framework
class PerformanceOptimizer {
  constructor() {
    this.loadedScripts = new Set();
    this.loadedData = new Map();
    this.loadingPromises = new Map();
    this.init();
  }

  init() {
    // Preload critical resources
    this.preloadCriticalResources();

    // Setup intersection observer for lazy loading
    this.setupIntersectionObserver();

    // Optimize images
    this.optimizeImages();

    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  preloadCriticalResources() {
    // Preload navigation and critical CSS
    const criticalResources = [
      'navigation.js',
      'performance-optimizer.js',
      'accessibility-enhancer.js'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = resource.endsWith('.js') ? 'script' : 'style';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadLazyContent(entry.target);
            }
          });
        },
        {
          rootMargin: '50px'
        }
      );

      // Observe all lazy-load elements
      document.querySelectorAll('[data-lazy-load]').forEach(el => {
        this.intersectionObserver.observe(el);
      });
    }
  }

  loadLazyContent(element) {
    const resource = element.getAttribute('data-lazy-load');

    if (resource && !this.loadedScripts.has(resource)) {
      this.loadedScripts.add(resource);
      this.loadScript(resource);
    }
  }

  async loadScript(src) {
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        this.loadingPromises.delete(src);
        resolve();
      };
      script.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  async loadData(url) {
    if (this.loadedData.has(url)) {
      return this.loadedData.get(url);
    }

    const promise = fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load ${url}`);
        }
        return response.json();
      })
      .then(data => {
        this.loadedData.set(url, data);
        return data;
      });

    this.loadedData.set(url, promise);
    return promise;
  }

  optimizeImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
    });
  }

  setupPerformanceMonitoring() {
    // Monitor page load performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation');
          if (perfData.length > 0) {
            const navigation = perfData[0];
            console.log('Page Load Performance:', {
              domContentLoaded:
                navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              totalLoadTime: navigation.loadEventEnd - navigation.navigationStart
            });
          }
        }, 0);
      });
    }
  }

  // Utility method to create loading spinner
  createLoadingSpinner(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">${message}</div>
        `;

    container.appendChild(spinner);
  }

  // Utility method to remove loading spinner
  removeLoadingSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      const spinner = container.querySelector('.loading-spinner');
      if (spinner) {
        spinner.remove();
      }
    }
  }

  // Utility method to show error
  showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const error = document.createElement('div');
    error.className = 'error-message';
    error.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-text">${message}</div>
        `;

    container.appendChild(error);
  }

  // Utility method to get file size reduction info
  getFileSizeReduction(originalSize, optimizedSize) {
    const reduction = originalSize - optimizedSize;
    const percentageReduction = ((reduction / originalSize) * 100).toFixed(1);

    console.log(`File Size Optimization:`, {
      original: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
      optimized: `${(optimizedSize / 1024 / 1024).toFixed(2)} MB`,
      reduction: `${(reduction / 1024 / 1024).toFixed(2)} MB`,
      percentageReduction: `${percentageReduction}%`
    });
  }
}

// Initialize performance optimizer
window.performanceOptimizer = new PerformanceOptimizer();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceOptimizer;
}
