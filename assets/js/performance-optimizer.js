// Performance Optimizer for APGI Website
// Ensure logger is available
if (typeof logger === "undefined") {
  // Fallback logger if not loaded - only logs in development
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes(".local") ||
    window.location.hostname.includes(".dev") ||
    window.location.hostname.includes(".test") ||
    window.location.protocol === "file:";

  window.logger = {
    error: (...args) => isDev && console.error("[ERROR]", ...args),
    warn: (...args) => isDev && console.warn("[WARN]", ...args),
    info: (...args) => isDev && console.info("[INFO]", ...args),
    debug: (...args) => isDev && console.log("[DEBUG]", ...args),
    performance: (metric, value) =>
      isDev && console.log(`[PERF] ${metric}: ${value}ms`),
  };
}

class APIPerformanceOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.implementLazyLoading();
    this.optimizeImages();
    this.implementCodeSplitting();
    this.addResourceHints();
    this.monitorPerformance();
    this.optimizeCriticalRenderingPath();
  }

  implementLazyLoading() {
    // Lazy load images
    const images = document.querySelectorAll("img[data-src]");
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));

    // Lazy load iframes and heavy content
    const heavyElements = document.querySelectorAll(
      "iframe[data-src], .heavy-content[data-src]",
    );
    const heavyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          if (element.tagName === "IFRAME") {
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
        .then((response) => response.text())
        .then((html) => {
          element.innerHTML = html;
          element.classList.remove("loading");
        })
        .catch((error) => {
          logger.error("Failed to load heavy content:", error);
          element.innerHTML = "<p>Content failed to load</p>";
        });
    }
  }

  optimizeImages() {
    // Add responsive image attributes
    const images = document.querySelectorAll("img:not([sizes])");
    images.forEach((img) => {
      if (!img.hasAttribute("sizes")) {
        img.setAttribute(
          "sizes",
          "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
        );
      }

      if (!img.hasAttribute("loading")) {
        img.setAttribute("loading", "lazy");
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
    const quizContainers = document.querySelectorAll(".quiz-container");
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
    const vizContainers = document.querySelectorAll(".visualization-container");
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
    import("./quiz-components.js")
      .then((module) => {
        module.initializeQuiz(container);
      })
      .catch((error) => {
        logger.error("Failed to load quiz component:", error);
      });
  }

  loadVisualizationComponent(container) {
    // Dynamically load visualization functionality
    import("./visualization-components.js")
      .then((module) => {
        module.initializeVisualization(container);
      })
      .catch((error) => {
        logger.error("Failed to load visualization component:", error);
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

    const printStyle = document.createElement("style");
    printStyle.setAttribute("media", "print");
    printStyle.textContent = printCSS;
    document.head.appendChild(printStyle);
  }

  addResourceHints() {
    // Preconnect to external domains
    const preconnectDomains = [
      "https://cdn.plot.ly",
      "https://cdnjs.cloudflare.com",
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net",
    ];

    preconnectDomains.forEach((domain) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = domain;
      document.head.appendChild(link);
    });

    // DNS prefetch for likely navigation targets
    const dnsPrefetchLinks = [
      "/Dashboard.html",
      "/Quiz.html",
      "/Assessment.html",
    ];

    dnsPrefetchLinks.forEach((href) => {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
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
      logger.performance("LCP", lastEntry.startTime);

      // Send to analytics if needed
      this.sendPerformanceMetric("LCP", lastEntry.startTime);
    }).observe({ entryTypes: ["largest-contentful-paint"] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        logger.performance("FID", entry.processingStart - entry.startTime);
        this.sendPerformanceMetric(
          "FID",
          entry.processingStart - entry.startTime,
        );
      });
    }).observe({ entryTypes: ["first-input"] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      logger.performance("CLS", clsValue);
      this.sendPerformanceMetric("CLS", clsValue);
    }).observe({ entryTypes: ["layout-shift"] });
  }

  trackResourcePerformance() {
    window.addEventListener("load", () => {
      const resources = performance.getEntriesByType("resource");

      resources.forEach((resource) => {
        if (resource.duration > 1000) {
          logger.debug("Slow resource:", {
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize,
          });
        }
      });
    });
  }

  trackUserInteractions() {
    // Track time to interactive with robust timing
    const measureTTI = () => {
      let navigationStart;

      // Use multiple timing sources for robustness
      if (performance.timing && performance.timing.navigationStart) {
        navigationStart = performance.timing.navigationStart;
      } else if (performance.timeOrigin) {
        navigationStart = performance.timeOrigin;
      } else {
        // Fallback: use a reasonable estimate
        navigationStart = Date.now() - 1000; // Assume 1 second load time
      }

      const currentTime = performance.now();
      const tti = currentTime + navigationStart - Date.now();

      // Only log valid TTI values
      if (tti > 0 && tti < 60000) {
        // Reasonable TTI range: 0-60 seconds
        logger.performance("TTI", tti);
        this.sendPerformanceMetric("TTI", tti);
      } else {
        logger.performance("TTI_INVALID", tti);
      }
    };

    if (document.readyState === "complete") {
      setTimeout(measureTTI, 0);
    } else {
      window.addEventListener("load", () => {
        setTimeout(measureTTI, 0);
      });
    }
  }

  sendPerformanceMetric(name, value) {
    // Send to analytics service
    if (window.gtag) {
      gtag("event", "performance_metric", {
        metric_name: name,
        metric_value: value,
        custom_parameter: "apgi_framework",
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

    const style = document.createElement("style");
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  deferNonCriticalCSS() {
    const nonCriticalLinks = document.querySelectorAll(
      'link[rel="stylesheet"][href*="font-awesome"]',
    );
    nonCriticalLinks.forEach((link) => {
      link.rel = "preload";
      link.as = "style";
      link.onload = function () {
        this.rel = "stylesheet";
      };
    });
  }

  optimizeFontLoading() {
    // Add font display swap
    const fontDisplayStyle = document.createElement("style");
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
document.addEventListener("DOMContentLoaded", () => {
  window.apgiPerformanceOptimizer = new APIPerformanceOptimizer();
});

// Also initialize if DOM is already loaded
if (document.readyState !== "loading") {
  if (!window.apgiPerformanceOptimizer) {
    window.apgiPerformanceOptimizer = new APIPerformanceOptimizer();
  }
}
