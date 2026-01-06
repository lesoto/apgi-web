// Service Worker Registration for APGI Framework
// Handles PWA functionality and offline support

class ServiceWorkerRegistration {
  constructor() {
    this.swUrl = '/assets/js/service-worker.js';
    this.isSupported = 'serviceWorker' in navigator;
    this.registration = null;
    this.init();
  }

  async init() {
    if (!this.isSupported) {
      // Service Worker not supported - silent fail
      this.showUnsupportedMessage();
      return;
    }

    try {
      await this.registerServiceWorker();
      this.setupEventListeners();
      this.checkForUpdates();
    } catch (error) {
      // Service Worker registration failed - silent fail
      this.showRegistrationError(error);
    }
  }

  async registerServiceWorker() {
    try {
      this.registration = await navigator.serviceWorker.register(this.swUrl, {
        scope: '/'
      });

      // Service Worker registered successfully
      this.showRegistrationSuccess();

      return this.registration;
    } catch (error) {
      // Service Worker registration failed - silent fail
      throw error;
    }
  }

  setupEventListeners() {
    // Listen for updates
    navigator.serviceWorker.addEventListener('controllerchange', event => {
      // Service Worker controller changed
      this.showUpdateAvailable();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        // Cache updated
      }
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.registration) {
        this.registration.update();
      }
    });
  }

  async checkForUpdates() {
    if (!this.registration) return;

    try {
      await this.registration.update();
      // Service Worker update check completed
    } catch (error) {
      // Service Worker update check failed - silent fail
    }
  }

  showRegistrationSuccess() {
    // Show subtle success message for development
    if (this.isDevelopment()) {
      this.showMessage('PWA features enabled', 'success');
    }
  }

  showRegistrationError(error) {
    this.showMessage('Offline features unavailable', 'warning');
  }

  showUnsupportedMessage() {
    this.showMessage('PWA features not supported in this browser', 'info');
  }

  showUpdateAvailable() {
    const message = 'New content available. Please refresh the page.';
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh';
    refreshBtn.className = 'btn btn-primary';
    refreshBtn.style.marginLeft = '10px';
    refreshBtn.onclick = () => window.location.reload();

    this.showMessage(message, 'info', refreshBtn);
  }

  showMessage(text, type = 'info', actionElement = null) {
    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = `sw-message sw-message-${type}`;
    messageContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${this.getMessageColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-size: 14px;
            max-width: 300px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
        `;

    messageContainer.textContent = text;

    if (actionElement) {
      messageContainer.appendChild(actionElement);
    }

    document.body.appendChild(messageContainer);

    // Animate in
    setTimeout(() => {
      messageContainer.style.opacity = '1';
      messageContainer.style.transform = 'translateY(0)';
    }, 100);

    // Auto-remove after 5 seconds (unless it has an action)
    if (!actionElement) {
      setTimeout(() => {
        this.removeMessage(messageContainer);
      }, 5000);
    }
  }

  removeMessage(messageContainer) {
    messageContainer.style.opacity = '0';
    messageContainer.style.transform = 'translateY(20px)';
    setTimeout(() => {
      if (messageContainer.parentNode) {
        messageContainer.parentNode.removeChild(messageContainer);
      }
    }, 300);
  }

  getMessageColor(type) {
    const colors = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    };
    return colors[type] || colors.info;
  }

  isDevelopment() {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('.local')
    );
  }

  // Public methods
  async unregister() {
    if (this.registration) {
      await this.registration.unregister();
      // Service Worker unregistered
    }
  }

  async getRegistration() {
    return this.registration;
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.swRegistration = new ServiceWorkerRegistration();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ServiceWorkerRegistration;
}
