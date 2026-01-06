/**
 * Privacy-Focused Analytics Integration
 * Uses Plausible Analytics for privacy-preserving analytics
 */

class AnalyticsManager {
  constructor() {
    this.config = {
      domain: 'apgi-framework.com', // Replace with actual domain
      apiEndpoint: 'https://plausible.io/api/event',
      trackOutbound: true,
      trackDownloads: true,
      respectDoNotTrack: true
    };
    this.init();
  }

  init() {
    // Check for Do Not Track preference
    if (this.config.respectDoNotTrack && navigator.doNotTrack === '1') {
      console.log('Analytics disabled due to Do Not Track preference');
      return;
    }

    // Initialize tracking
    this.setupPageTracking();
    this.setupEventTracking();
    this.setupOutboundTracking();
    this.setupDownloadTracking();
  }

  // Setup automatic page tracking
  setupPageTracking() {
    // Track page view
    this.trackEvent('pageview', {
      url: window.location.pathname,
      referrer: document.referrer,
      title: document.title
    });

    // Track single page app navigation
    this.trackSPA();
  }

  // Track single page app navigation
  trackSPA() {
    let currentPath = window.location.pathname;

    // Override pushState
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.onRouteChange();
    };

    // Override replaceState
    const originalReplaceState = history.replaceState;
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.onRouteChange();
    };

    // Listen to popstate events
    window.addEventListener('popstate', () => {
      this.onRouteChange();
    });

    // Listen to hashchange events
    window.addEventListener('hashchange', () => {
      this.onRouteChange();
    });
  }

  // Handle route changes
  onRouteChange() {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      setTimeout(() => {
        this.trackEvent('pageview', {
          url: window.location.pathname,
          referrer: currentPath,
          title: document.title
        });
      }, 0);
    }
  }

  // Setup custom event tracking
  setupEventTracking() {
    // Track assessment starts
    document.addEventListener('click', e => {
      const target = e.target.closest('[data-track-event]');
      if (target) {
        const eventName = target.dataset.trackEvent;
        const eventProps = this.parseEventProps(target.dataset.trackProps);
        this.trackEvent(eventName, eventProps);
      }
    });

    // Track form submissions
    document.addEventListener('submit', e => {
      const form = e.target;
      if (form.dataset.trackForm) {
        this.trackEvent('form_submit', {
          form_name: form.dataset.trackForm,
          form_id: form.id || 'unknown'
        });
      }
    });

    // Track search queries
    const searchInput = document.getElementById('site-search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', e => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const query = e.target.value.trim();
          if (query.length >= 3) {
            this.trackEvent('search', {
              query: query,
              results_count: document.querySelectorAll('.search-result-item').length
            });
          }
        }, 500);
      });
    }
  }

  // Setup outbound link tracking
  setupOutboundTracking() {
    if (!this.config.trackOutbound) return;

    document.addEventListener('click', e => {
      const target = e.target.closest('a');
      if (target && this.isOutboundLink(target)) {
        this.trackEvent('outbound', {
          url: target.href,
          link_text: target.textContent.trim(),
          link_domain: new URL(target.href).hostname
        });
      }
    });
  }

  // Setup download tracking
  setupDownloadTracking() {
    if (!this.config.trackDownloads) return;

    document.addEventListener('click', e => {
      const target = e.target.closest('a');
      if (target && this.isDownloadLink(target)) {
        this.trackEvent('download', {
          url: target.href,
          file_name: this.getFileName(target.href),
          file_type: this.getFileType(target.href)
        });
      }
    });
  }

  // Check if link is outbound
  isOutboundLink(link) {
    try {
      const linkDomain = new URL(link.href).hostname;
      const currentDomain = window.location.hostname;
      return linkDomain !== currentDomain && !link.href.startsWith('mailto:');
    } catch {
      return false;
    }
  }

  // Check if link is a download
  isDownloadLink(link) {
    const href = link.href;
    const downloadExtensions = ['.pdf', '.zip', '.dmg', '.exe', '.pkg', '.tar.gz'];
    return (
      downloadExtensions.some(ext => href.includes(ext)) ||
      link.hasAttribute('download') ||
      link.textContent.includes('Download')
    );
  }

  // Get filename from URL
  getFileName(url) {
    try {
      return new URL(url).pathname.split('/').pop() || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // Get file type from URL
  getFileType(url) {
    const fileName = this.getFileName(url);
    const extension = fileName.split('.').pop();
    return extension || 'unknown';
  }

  // Parse event properties from data attribute
  parseEventProps(propsString) {
    if (!propsString) return {};

    try {
      return JSON.parse(propsString);
    } catch {
      // Simple key=value format
      const props = {};
      propsString.split(',').forEach(pair => {
        const [key, value] = pair.split('=').map(s => s.trim());
        if (key && value) {
          props[key] = value.replace(/['"]/g, '');
        }
      });
      return props;
    }
  }

  // Track event to Plausible
  trackEvent(eventName, props = {}) {
    const payload = {
      name: eventName,
      url: window.location.pathname,
      domain: this.config.domain,
      referrer: document.referrer,
      ...props
    };

    // Add user agent and screen width
    payload.user_agent = navigator.userAgent;
    payload.screen_width = window.screen.width;

    // Send event
    this.sendEvent(payload);
  }

  // Send event to analytics endpoint
  sendEvent(payload) {
    // Use navigator.sendBeacon for reliable delivery
    if (navigator.sendBeacon) {
      const data = new URLSearchParams();
      Object.keys(payload).forEach(key => {
        data.append(key, payload[key]);
      });

      navigator.sendBeacon(this.config.apiEndpoint, data.toString());
    } else {
      // Fallback to fetch
      fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(payload).toString(),
        keepalive: true
      }).catch(() => {
        // Silently fail to not break user experience
      });
    }
  }

  // Public API for custom tracking
  track(eventName, props = {}) {
    this.trackEvent(eventName, props);
  }

  // Track user engagement metrics
  trackEngagement() {
    let startTime = Date.now();
    let isActive = true;
    let idleTime = 0;

    // Track activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const resetIdle = () => {
      isActive = true;
      idleTime = 0;
    };

    events.forEach(event => {
      document.addEventListener(event, resetIdle, true);
    });

    // Check idle time every 5 seconds
    setInterval(() => {
      if (isActive) {
        idleTime += 5;
        if (idleTime >= 30) {
          // 30 seconds idle
          isActive = false;
        }
      }
    }, 5000);

    // Track time on page when leaving
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      this.trackEvent('page_leave', {
        time_on_page: timeOnPage,
        engaged: isActive
      });
    });
  }
}

// Initialize analytics
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize on production domains
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Analytics disabled in development');
    return;
  }

  window.analytics = new AnalyticsManager();
  window.analytics.trackEngagement();
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsManager;
}
