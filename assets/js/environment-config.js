/**
 * Environment Configuration for APGI Framework
 * Provides client-side configuration with fallbacks and development defaults
 */

class EnvironmentConfig {
  constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration from multiple sources
   */
  loadConfiguration() {
    return {
      // API Configuration
      api: {
        baseUrl: this.getEnvVar("VITE_API_BASE_URL") || "http://localhost:3001",
        timeout: parseInt(this.getEnvVar("VITE_API_TIMEOUT")) || 10000,
      },

      // Email Service Configuration
      email: {
        provider: this.getEnvVar("VITE_EMAIL_PROVIDER") || "local", // 'mailchimp', 'convertkit', 'local'
        mailchimp: {
          apiKey: this.getEnvVar("VITE_MAILCHIMP_API_KEY") || null,
          serverPrefix: this.getEnvVar("VITE_MAILCHIMP_SERVER_PREFIX") || null,
          lists: {
            snapshot: this.getEnvVar("VITE_MAILCHIMP_SNAPSHOT_LIST_ID") || null,
            newsletter:
              this.getEnvVar("VITE_MAILCHIMP_NEWSLETTER_LIST_ID") || null,
            consultations:
              this.getEnvVar("VITE_MAILCHIMP_CONSULTATIONS_LIST_ID") || null,
          },
        },
        convertKit: {
          apiKey: this.getEnvVar("VITE_CONVERTKIT_API_KEY") || null,
          forms: {
            snapshot:
              this.getEnvVar("VITE_CONVERTKIT_SNAPSHOT_FORM_ID") || null,
            professional:
              this.getEnvVar("VITE_CONVERTKIT_PROFESSIONAL_FORM_ID") || null,
          },
        },
      },

      // Stripe Configuration
      stripe: {
        publishableKey: this.getEnvVar("VITE_STRIPE_PUBLISHABLE_KEY"),
        prices: {
          professional: this.getEnvVar("VITE_STRIPE_PROFESSIONAL_PRICE_ID"),
          enterprise: this.getEnvVar("VITE_STRIPE_ENTERPRISE_PRICE_ID"),
        },
      },

      // Analytics Configuration
      analytics: {
        provider: this.getEnvVar("VITE_ANALYTICS_PROVIDER") || "local", // 'google', 'plausible', 'local'
        googleAnalyticsId: this.getEnvVar("VITE_GA_TRACKING_ID") || null,
        plausibleDomain: this.getEnvVar("VITE_PLAUSIBLE_DOMAIN") || null,
      },

      // Feature Flags
      features: {
        enableAnalytics: this.getEnvVar("VITE_ENABLE_ANALYTICS") === "true",
        enableEmailCapture:
          this.getEnvVar("VITE_ENABLE_EMAIL_CAPTURE") !== "false",
        enablePayments: this.getEnvVar("VITE_ENABLE_PAYMENTS") !== "false",
        enableDebugMode: this.getEnvVar("VITE_DEBUG_MODE") === "true",
      },

      // Application Configuration
      app: {
        name: "APGI Framework",
        version: "1.0.0",
        environment: this.getEnvVar("VITE_NODE_ENV") || "development",
        logLevel: this.getEnvVar("VITE_LOG_LEVEL") || "info",
      },
    };
  }

  /**
   * Get environment variable with fallback
   */
  getEnvVar(key) {
    // Try window.env (custom injection)
    if (typeof window !== "undefined" && window.env && window.env[key]) {
      return window.env[key];
    }

    // Try process.env (Node.js - won't work in browser but included for completeness)
    if (typeof process !== "undefined" && process.env) {
      return process.env[key];
    }

    return null;
  }

  /**
   * Get configuration value by path
   */
  get(path, defaultValue = null) {
    const keys = path.split(".");
    let current = this.config;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false);
  }

  /**
   * Get API URL
   */
  getApiUrl(endpoint = "") {
    const baseUrl = this.get("api.baseUrl");
    return endpoint ? `${baseUrl}${endpoint}` : baseUrl;
  }

  /**
   * Check if configuration is ready for production
   */
  isProductionReady() {
    const requiredConfigs = ["api.baseUrl", "stripe.publishableKey"];

    return requiredConfigs.every((path) => {
      const value = this.get(path);
      return value !== null && value !== "" && value !== undefined;
    });
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus() {
    return {
      environment: this.get("app.environment"),
      isProductionReady: this.isProductionReady(),
      missingConfigs: this.getMissingConfigs(),
      features: this.get("features"),
    };
  }

  /**
   * Get missing configurations
   */
  getMissingConfigs() {
    const missing = [];

    // Check critical configurations
    if (
      !this.get("stripe.publishableKey") ||
      this.get("stripe.publishableKey").includes("test")
    ) {
      missing.push("Stripe publishable key");
    }

    if (this.get("app.environment") === "production") {
      if (
        !this.get("email.mailchimp.apiKey") &&
        !this.get("email.convertKit.apiKey")
      ) {
        missing.push("Email service API key");
      }

      if (
        !this.get("analytics.googleAnalyticsId") &&
        !this.get("analytics.plausibleDomain")
      ) {
        missing.push("Analytics configuration");
      }
    }

    return missing;
  }

  /**
   * Log configuration status
   */
  logConfigStatus() {
    const status = this.getConfigStatus();

    if (this.isFeatureEnabled("enableDebugMode")) {
      console.group("🔧 APGI Configuration Status");
      console.log("Environment:", status.environment);
      console.log("Production Ready:", status.isProductionReady);
      console.log("Features:", status.features);

      if (status.missingConfigs.length > 0) {
        console.warn("Missing Configurations:", status.missingConfigs);
      }

      console.groupEnd();
    }
  }
}

// Create singleton instance
window.envConfig = new EnvironmentConfig();

// Auto-log configuration status
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.envConfig.logConfigStatus();
  });
} else {
  window.envConfig.logConfigStatus();
}

// Export for use in other modules
window.EnvironmentConfig = EnvironmentConfig;
