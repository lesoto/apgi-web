// Centralized Theme Manager for APGI Framework
// Ensures consistent theme handling across all pages

class ThemeManager {
  constructor() {
    this.storageKey = 'theme';
    this.darkClass = 'data-theme';
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
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    this.applyTheme(theme);
  }

  applyTheme(theme) {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.setAttribute(this.darkClass, 'dark');
    } else {
      html.removeAttribute(this.darkClass);
    }

    this.updateThemeUI(theme);
  }

  updateThemeUI(theme) {
    // Update theme toggle button if it exists
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (themeToggle) {
      // Update button state
      themeToggle.setAttribute('aria-expanded', theme === 'dark');

      // Update icon
      if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeIcon.setAttribute(
          'aria-label',
          theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
        );
      }

      // Update text
      if (themeText) {
        themeText.textContent = theme === 'dark' ? 'Light' : 'Dark';
      }
    }

    // Update slider-style toggles (like in PsyStates-Visualizer)
    const sliderIcon = document.querySelector('.theme-toggle-slider i');
    if (sliderIcon) {
      sliderIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Also handle keyboard navigation
    themeToggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.hasAttribute(this.darkClass);
    const newTheme = isDark ? 'light' : 'dark';

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
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', e => {
      // Only change theme if user hasn't explicitly set one
      if (!localStorage.getItem(this.storageKey)) {
        const systemTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(systemTheme);
      }
    });
  }

  addThemeTransition() {
    const html = document.documentElement;
    html.style.transition = 'color-scheme 0.3s ease';

    setTimeout(() => {
      html.style.transition = '';
    }, 300);
  }

  dispatchThemeChangeEvent(theme) {
    const event = new CustomEvent('themechange', {
      detail: { theme }
    });
    document.dispatchEvent(event);
  }

  // Public methods for external use
  getTheme() {
    return localStorage.getItem(this.storageKey) || 'light';
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
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
