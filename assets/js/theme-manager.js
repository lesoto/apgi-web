// Centralized Theme Manager for APGI Framework
// Ensures consistent theme handling across all pages

class ThemeManager {
  constructor() {
    this.storageKey = "theme";
    this.darkClass = "data-theme";

    // Bind methods to maintain context
    this.toggleHandler = this.toggleHandler.bind(this);
    this.keyHandler = this.keyHandler.bind(this);

    this.init();
  }

  init() {
    // Initialize theme on page load
    this.loadSavedTheme();

    // Set up theme toggle listeners
    this.setupThemeToggle();

    // Listen for system theme changes
    this.setupSystemThemeListener();
  }

  loadSavedTheme() {
    const savedTheme = localStorage.getItem(this.storageKey);
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const theme = savedTheme || (systemPrefersDark ? "dark" : "light");

    this.applyTheme(theme);
  }

  applyTheme(theme) {
    const html = document.documentElement;

    // Handle both data-theme attribute and dark class for compatibility
    if (theme === "dark") {
      html.setAttribute(this.darkClass, "dark");
      html.classList.add("dark");
    } else {
      html.removeAttribute(this.darkClass);
      html.classList.remove("dark");
    }

    this.updateThemeUI(theme);

    // Reinitialize Lucide icons if available (for Paper.html)
    if (typeof lucide !== "undefined" && lucide.createIcons) {
      setTimeout(() => lucide.createIcons(), 100);
    }
  }

  updateThemeUI(theme) {
    // Update all theme toggle buttons
    const themeToggles = document.querySelectorAll(".theme-toggle");

    themeToggles.forEach((toggle) => {
      const toggleId = toggle.id;
      const themeIcon = toggle.querySelector(
        '.theme-icon-sun, .theme-icon-moon, [data-lucide="sun"], [data-lucide="moon"], .theme-icon',
      );
      const themeText = toggle.querySelector(".theme-text");

      // Update button state
      toggle.setAttribute("aria-expanded", theme === "dark");

      // Update text
      if (themeText) {
        themeText.textContent = theme === "dark" ? "Light" : "Dark";
      }

      // Update Lucide icons (like in Paper.html)
      const moonIcon = toggle.querySelector('[data-lucide="moon"]');
      const sunIcon = toggle.querySelector('[data-lucide="sun"]');
      if (moonIcon && sunIcon) {
        if (theme === "dark") {
          moonIcon.classList.remove("hidden");
          sunIcon.classList.add("hidden");
        } else {
          moonIcon.classList.add("hidden");
          sunIcon.classList.remove("hidden");
        }
      }

      // Update icon classes for theme-icon-sun/moon
      const sunIconClass = toggle.querySelector(".theme-icon-sun");
      const moonIconClass = toggle.querySelector(".theme-icon-moon");
      if (sunIconClass && moonIconClass) {
        if (theme === "dark") {
          sunIconClass.classList.add("hidden");
          moonIconClass.classList.remove("hidden");
        } else {
          sunIconClass.classList.remove("hidden");
          moonIconClass.classList.add("hidden");
        }
      }

      // Update emoji icons for main pages (Home, Assessment, etc.)
      if (themeIcon && themeIcon.classList.contains("theme-icon")) {
        themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
      }
    });

    // Reinitialize Lucide icons to ensure proper display
    if (typeof lucide !== "undefined" && lucide.createIcons) {
      setTimeout(() => lucide.createIcons(), 50);
    }

    // Update slider-style toggles (like in PsyStates-Visualizer)
    const sliderIcon = document.querySelector(".theme-toggle-slider i");
    if (sliderIcon) {
      sliderIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }

    // Update slider-style toggles with span icons (like in State-Network)
    const sliderSpanIcon = document.querySelector(".theme-toggle-icon");
    if (sliderSpanIcon) {
      sliderSpanIcon.textContent = theme === "dark" ? "🌙" : "☀️";
    }

    // Update inline theme toggle buttons (like in Assessment-OnePage)
    const inlineToggle = document.querySelector(".theme-toggle i");
    const inlineText = document.querySelector(".theme-toggle span");
    if (inlineToggle && inlineText) {
      if (theme === "dark") {
        inlineToggle.className = "fas fa-sun";
        inlineText.textContent = "Light Mode";
      } else {
        inlineToggle.className = "fas fa-moon";
        inlineText.textContent = "Dark Mode";
      }
    }
  }

  setupThemeToggle() {
    const setupToggles = () => {
      const themeToggles = document.querySelectorAll(".theme-toggle");

      themeToggles.forEach((toggle, index) => {
        if (!toggle) return;

        // Remove existing listeners to prevent duplicates
        toggle.removeEventListener("click", this.toggleHandler);
        toggle.removeEventListener("keydown", this.keyHandler);

        // Add new listeners
        toggle.addEventListener("click", this.toggleHandler);
        toggle.addEventListener("keydown", this.keyHandler);
      });
    };

    // Setup immediately if DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupToggles);
    } else {
      setupToggles();
    }

    // Also setup after a delay to catch dynamically loaded content
    setTimeout(setupToggles, 100);
    setTimeout(setupToggles, 500);
  }

  // Bind handlers to maintain context
  toggleHandler(e) {
    e.preventDefault();
    this.toggleTheme();
  }

  keyHandler(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.toggleTheme();
    }
  }

  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.hasAttribute(this.darkClass);
    const newTheme = isDark ? "light" : "dark";

    // Apply theme
    this.applyTheme(newTheme);

    // Save to localStorage
    localStorage.setItem(this.storageKey, newTheme);

    // Add transition animation class
    this.addThemeTransition();

    // Dispatch custom event for other components
    this.dispatchThemeChangeEvent(newTheme);
  }

  setupSystemThemeListener() {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    mediaQuery.addEventListener("change", (e) => {
      // Only change theme if user hasn't explicitly set one
      if (!localStorage.getItem(this.storageKey)) {
        const systemTheme = e.matches ? "dark" : "light";
        this.applyTheme(systemTheme);
      }
    });
  }

  addThemeTransition() {
    const html = document.documentElement;
    html.style.transition = "color-scheme 0.3s ease";

    setTimeout(() => {
      html.style.transition = "";
    }, 300);
  }

  dispatchThemeChangeEvent(theme) {
    const event = new CustomEvent("themechange", {
      detail: { theme },
    });
    document.dispatchEvent(event);
  }

  // Public methods for external use
  getTheme() {
    return localStorage.getItem(this.storageKey) || "light";
  }

  setTheme(theme) {
    this.applyTheme(theme);
    localStorage.setItem(this.storageKey, theme);
  }

  resetTheme() {
    localStorage.removeItem(this.storageKey);
    this.loadSavedTheme();
  }
}

// Initialize theme manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.themeManager = new ThemeManager();
});

// Export for potential module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = ThemeManager;
}
