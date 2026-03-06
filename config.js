// Client-side configuration
// This file contains client-side configuration settings

window.APGI_CONFIG = {
  // API endpoints
  API_BASE_URL: window.location.protocol + "//" + window.location.host,
  API_VERSION: "v1",

  // Feature flags
  ENABLE_ANALYTICS: false,
  ENABLE_DEBUG_MODE: false,
  ENABLE_OFFLINE_MODE: true,

  // UI settings
  THEME_DEFAULT: "light",
  ANIMATION_DURATION: 300,

  // Assessment settings
  ASSESSMENT_TIMEOUT: 3600000, // 1 hour in milliseconds
  MAX_RETRIES: 3,

  // Payment settings
  STRIPE_PUBLISHABLE_KEY: "pk_test_placeholder", // Replace with actual key in production

  // Email service settings
  EMAILJS_SERVICE_ID: "service_placeholder",
  EMAILJS_TEMPLATE_ID: "template_placeholder",
  EMAILJS_USER_ID: "user_placeholder",

  // Chart settings
  CHART_DEFAULT_HEIGHT: 400,
  CHART_DEFAULT_WIDTH: 600,

  // Performance settings
  LAZY_LOAD_THRESHOLD: 200,
  DEBOUNCE_DELAY: 250,

  // Accessibility settings
  HIGH_CONTRAST_MODE: false,
  REDUCED_MOTION: false,

  // Development settings
  DEV_MODE:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes(".local"),

  // Social media links
  SOCIAL_LINKS: {
    twitter: "https://twitter.com/apgiframework",
    linkedin: "https://linkedin.com/company/apgi-framework",
    github: "https://github.com/apgi-framework",
  },
};

// Environment-specific overrides
if (window.APGI_CONFIG.DEV_MODE) {
  window.APGI_CONFIG.ENABLE_DEBUG_MODE = true;
  window.APGI_CONFIG.ENABLE_ANALYTICS = false;
}

// Export for module usage if needed
if (typeof module !== "undefined" && module.exports) {
  module.exports = window.APGI_CONFIG;
}
