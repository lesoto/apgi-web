// Performance Optimization System for APGI Website
class APIPerformanceOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.implementLazyLoading();
    this.optimizeImages();
    this.implementCodeSplitting();
    this.addResourceHints();
    this.monitorPerformance();
    this.optimizeCriticalRenderingPath();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  this.showUpdateNotification();
                }
              });
            });
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      });
    }
  }

  showUpdateNotification() {
    // Create update notification
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.innerHTML = `
      <div style="position: fixed; top: 80px; right: 20px; background: #2563eb; color: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001; max-width: 300px;">
        <p style="margin: 0 0 10px 0; font-size: 14px;">A new version of the APGI Framework is available!</p>
        <button onclick="this.parentElement.parentElement.remove(); location.reload();" style="background: white; color: #2563eb; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">Update Now</button>
        <button onclick="this.parentElement.parentElement.remove();" style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-left: 8px;">Later</button>
      </div>
    `;
    document.body.appendChild(notification);
  }

  implementLazyLoading() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));

    // Lazy load iframes and heavy content
    const heavyElements = document.querySelectorAll('iframe[data-src], .heavy-content[data-src]');
    const heavyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          if (element.tagName === 'IFRAME') {
            element.src = element.dataset.src;
          } else {
            // Load heavy content
            this.loadHeavyContent(element);
          }
          heavyObserver.unobserve(element);
        }
      });
    });

    heavyElements.forEach((element) => heavyObserver.observe(element));
  }

  loadHeavyContent(element) {
    const src = element.dataset.src;
    if (src) {
      fetch(src)
        .then(response => response.text())
        .then(html => {
          element.innerHTML = html;
          element.classList.remove('loading');
        })
        .catch(error => {
          console.error('Failed to load heavy content:', error);
          element.innerHTML = '<p>Content failed to load</p>';
        });
    }
  }

  optimizeImages() {
    // Add responsive image attributes
    const images = document.querySelectorAll('img:not([sizes])');
    images.forEach((img) => {
      if (!img.hasAttribute('sizes')) {
        img.setAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw');
      }
      
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });

    // Convert images to WebP format if supported
    if (this.supportsWebP()) {
      this.convertImagesToWebP();
    }
  }

  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  convertImagesToWebP() {
    const images = document.querySelectorAll('img[src$=".jpg"], img[src$=".png"]');
    images.forEach((img) => {
      const src = img.src;
      if (src.includes('.jpg') || src.includes('.png')) {
        const webpSrc = src.replace(/\.(jpg|png)$/, '.webp');
        
        // Test if WebP version exists
        fetch(webpSrc, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              img.src = webpSrc;
            }
          })
          .catch(() => {
            // WebP version not available, keep original
          });
      }
    });
  }

  implementCodeSplitting() {
    // Dynamic imports for heavy components
    this.setupDynamicImports();
    
    // Split CSS by media queries
    this.splitCSSByMedia();
  }

  setupDynamicImports() {
    // Quiz components
    const quizContainers = document.querySelectorAll('.quiz-container');
    quizContainers.forEach((container) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadQuizComponent(container);
            observer.unobserve(container);
          }
        });
      });
      observer.observe(container);
    });

    // Visualization components
    const vizContainers = document.querySelectorAll('.visualization-container');
    vizContainers.forEach((container) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadVisualizationComponent(container);
            observer.unobserve(container);
          }
        });
      });
      observer.observe(container);
    });
  }

  loadQuizComponent(container) {
    // Dynamically load quiz functionality
    import('./quiz-components.js')
      .then((module) => {
        module.initializeQuiz(container);
      })
      .catch((error) => {
        console.error('Failed to load quiz component:', error);
      });
  }

  loadVisualizationComponent(container) {
    // Dynamically load visualization functionality
    import('./visualization-components.js')
      .then((module) => {
        module.initializeVisualization(container);
      })
      .catch((error) => {
        console.error('Failed to load visualization component:', error);
      });
  }

  splitCSSByMedia() {
    // Add print-specific CSS
    const printCSS = `
      @media print {
        .apgi-navigation, .controls, .loading-spinner {
          display: none !important;
        }
        
        body {
          font-size: 12pt;
          line-height: 1.4;
        }
        
        .plot-container {
          break-inside: avoid;
        }
      }
    `;
    
    const printStyle = document.createElement('style');
    printStyle.setAttribute('media', 'print');
    printStyle.textContent = printCSS;
    document.head.appendChild(printStyle);
  }

  addResourceHints() {
    // Preconnect to external domains
    const preconnectDomains = [
      'https://cdn.plot.ly',
      'https://cdnjs.cloudflare.com',
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net'
    ];

    preconnectDomains.forEach((domain) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });

    // DNS prefetch for likely navigation targets
    const dnsPrefetchLinks = [
      '/Dashboard.html',
      '/Quiz.html',
      '/Assessment.html'
    ];

    dnsPrefetchLinks.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = href;
      document.head.appendChild(link);
    });
  }

  monitorPerformance() {
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Track resource loading performance
    this.trackResourcePerformance();
    
    // Monitor user interactions
    this.trackUserInteractions();
  }

  monitorCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
      
      // Send to analytics if needed
      this.sendPerformanceMetric('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime);
        this.sendPerformanceMetric('FID', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      console.log('CLS:', clsValue);
      this.sendPerformanceMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  trackResourcePerformance() {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');
      
      resources.forEach((resource) => {
        if (resource.duration > 1000) {
          console.log('Slow resource:', {
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize
          });
        }
      });
    });
  }

  trackUserInteractions() {
    // Track time to interactive
    const measureTTI = () => {
      const tti = performance.now() - performance.timing.navigationStart;
      console.log('TTI:', tti);
      this.sendPerformanceMetric('TTI', tti);
    };

    if (document.readyState === 'complete') {
      setTimeout(measureTTI, 0);
    } else {
      window.addEventListener('load', () => {
        setTimeout(measureTTI, 0);
      });
    }
  }

  sendPerformanceMetric(name, value) {
    // Send to analytics service
    if (window.gtag) {
      gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value,
        custom_parameter: 'apgi_framework'
      });
    }
  }

  optimizeCriticalRenderingPath() {
    // Inline critical CSS
    this.inlineCriticalCSS();
    
    // Defer non-critical CSS
    this.deferNonCriticalCSS();
    
    // Optimize font loading
    this.optimizeFontLoading();
  }

  inlineCriticalCSS() {
    const criticalCSS = `
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .apgi-navigation { position: fixed; top: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.95); z-index: 1000; }
      .loading-spinner { display: flex; justify-content: center; align-items: center; }
    `;
    
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  deferNonCriticalCSS() {
    const nonCriticalLinks = document.querySelectorAll('link[rel="stylesheet"][href*="font-awesome"]');
    nonCriticalLinks.forEach((link) => {
      link.rel = 'preload';
      link.as = 'style';
      link.onload = function() {
        this.rel = 'stylesheet';
      };
    });
  }

  optimizeFontLoading() {
    // Add font display swap
    const fontDisplayStyle = document.createElement('style');
    fontDisplayStyle.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2') format('woff2');
      }
    `;
    document.head.appendChild(fontDisplayStyle);
  }

  // Public method to manually trigger performance optimization
  static optimize() {
    if (!window.apgiPerformanceOptimizer) {
      window.apgiPerformanceOptimizer = new APIPerformanceOptimizer();
    }
    return window.apgiPerformanceOptimizer;
  }
}

// Initialize performance optimizer
document.addEventListener('DOMContentLoaded', () => {
  window.apgiPerformanceOptimizer = new APIPerformanceOptimizer();
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
  if (!window.apgiPerformanceOptimizer) {
    window.apgiPerformanceOptimizer = new APIPerformanceOptimizer();
  }
}
