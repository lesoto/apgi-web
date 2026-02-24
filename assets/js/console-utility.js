/**
 * Console Utility for APGI Framework
 * Gates console statements behind development mode check
 */

// Development mode check
const isDev =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.includes("dev") ||
  window.envConfig?.isDevelopment();

// Safe console methods that only log in development
const safeConsole = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  error: (...args) => {
    if (isDev) console.error(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
  debug: (...args) => {
    if (isDev) console.debug(...args);
  },
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { isDev, safeConsole };
} else {
  window.consoleUtils = { isDev, safeConsole };
}
