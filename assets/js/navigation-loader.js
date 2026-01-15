/**
 * Navigation Component Loader
 * Handles loading navigation component with fallbacks for local development
 */

(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    NAVIGATION_PATH: "components/navigation.html",
    FALLBACK_NAVIGATION_PATH: "../components/navigation.html", // For subdirectories
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  };

  // Cache for navigation HTML
  let navigationCache = null;
  let cacheTimestamp = null;

  /**
   * Load navigation component
   */
  async function loadNavigation(containerId, isSubdirectory = false) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Navigation container with id '${containerId}' not found`);
      return false;
    }

    // Check cache first
    if (
      navigationCache &&
      cacheTimestamp &&
      Date.now() - cacheTimestamp < CONFIG.CACHE_DURATION
    ) {
      container.innerHTML = navigationCache;
      initializeNavigation();
      return true;
    }

    const navigationPath = isSubdirectory
      ? CONFIG.FALLBACK_NAVIGATION_PATH
      : CONFIG.NAVIGATION_PATH;

    try {
      const response = await fetchWithRetry(navigationPath);
      const html = await response.text();

      // Cache the response
      navigationCache = html;
      cacheTimestamp = Date.now();

      container.innerHTML = html;
      initializeNavigation();

      return true;
    } catch (error) {
      console.error("Failed to load navigation:", error);

      // Try fallback path
      if (!isSubdirectory) {
        try {
          const response = await fetchWithRetry(
            CONFIG.FALLBACK_NAVIGATION_PATH,
          );
          const html = await response.text();

          navigationCache = html;
          cacheTimestamp = Date.now();

          container.innerHTML = html;
          initializeNavigation();

          return true;
        } catch (fallbackError) {
          console.error("Fallback navigation also failed:", fallbackError);
        }
      }

      // Load embedded fallback navigation
      loadEmbeddedFallback(container);
      return false;
    }
  }

  /**
   * Fetch with retry logic
   */
  async function fetchWithRetry(url, attempts = CONFIG.RETRY_ATTEMPTS) {
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await fetch(url, {
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        if (i === attempts - 1) throw error;

        console.warn(
          `Navigation load attempt ${i + 1} failed, retrying...`,
          error,
        );
        await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY));
      }
    }
  }

  /**
   * Load embedded fallback navigation
   */
  function loadEmbeddedFallback(container) {
    const fallbackHTML = `
            <nav class="main-nav" role="navigation" aria-label="Main navigation">
                <div class="nav-container">
                    <div class="nav-links">
                        <a href="Home.html" class="nav-link nav-brand">APGI Framework</a>
                        
                        <!-- Mobile Menu Toggle -->
                        <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Toggle mobile menu" aria-expanded="false">
                            <span class="hamburger-line"></span>
                            <span class="hamburger-line"></span>
                            <span class="hamburger-line"></span>
                        </button>
                        
                        <!-- Mobile Menu -->
                        <div class="mobile-menu" id="mobile-menu">
                            <a href="Home.html" class="mobile-menu-link">Home</a>
                            <a href="Quiz.html" class="mobile-menu-link">Quiz</a>
                            <a href="Assessment.html" class="mobile-menu-link">Assessment</a>
                            <a href="Profile.html" class="mobile-menu-link">Profile</a>
                            <a href="API.html" class="mobile-menu-link">API</a>
                        </div>
                        
                        <!-- Theme Toggle -->
                        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
                            <span class="theme-icon">🌙</span>
                        </button>
                    </div>
                </div>
            </nav>
            
            <style>
                .main-nav {
                    background: var(--bg-primary, #ffffff);
                    border-bottom: 1px solid var(--border-color, #e2e8f0);
                    padding: 1rem 0;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                }
                
                .nav-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 1rem;
                }
                
                .nav-links {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 2rem;
                }
                
                .nav-brand {
                    font-weight: 700;
                    font-size: 1.25rem;
                    color: var(--text-primary, #1a202c);
                    text-decoration: none;
                }
                
                .mobile-menu-toggle {
                    display: none;
                    flex-direction: column;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0.5rem;
                    gap: 4px;
                }
                
                .hamburger-line {
                    width: 24px;
                    height: 2px;
                    background: var(--text-primary, #1a202c);
                    transition: all 0.3s ease;
                }
                
                .mobile-menu {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 9999;
                    padding: 4rem 1rem 1rem;
                }
                
                .mobile-menu.active {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .mobile-menu-link {
                    color: white;
                    text-decoration: none;
                    font-size: 1.2rem;
                    padding: 1rem;
                    border-radius: 8px;
                    transition: background 0.2s ease;
                }
                
                .mobile-menu-link:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .theme-toggle {
                    background: var(--bg-secondary, #f8fafc);
                    border: 1px solid var(--border-color, #e2e8f0);
                    border-radius: 8px;
                    padding: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                @media (max-width: 768px) {
                    .mobile-menu-toggle {
                        display: flex;
                    }
                    
                    .mobile-menu {
                        display: none;
                    }
                }
                
                [data-theme="dark"] .main-nav {
                    background: var(--bg-primary, #0f172a);
                    border-color: var(--border-color, #334155);
                }
                
                [data-theme="dark"] .nav-brand {
                    color: var(--text-primary, #f1f5f9);
                }
                
                [data-theme="dark"] .hamburger-line {
                    background: var(--text-primary, #f1f5f9);
                }
                
                [data-theme="dark"] .theme-toggle {
                    background: var(--bg-secondary, #1e293b);
                    border-color: var(--border-color, #334155);
                }
            </style>
        `;

    container.innerHTML = fallbackHTML;
    initializeFallbackNavigation();
  }

  /**
   * Initialize navigation functionality
   */
  function initializeNavigation() {
    // Initialize dropdowns
    initializeDropdowns();

    // Initialize mobile menu
    initializeMobileMenu();

    // Initialize theme toggle
    initializeThemeToggle();

    // Dispatch event for other scripts
    document.dispatchEvent(new CustomEvent("navigationLoaded"));
  }

  /**
   * Initialize fallback navigation
   */
  function initializeFallbackNavigation() {
    initializeMobileMenu();
    initializeThemeToggle();
  }

  /**
   * Initialize dropdown functionality
   */
  function initializeDropdowns() {
    const dropdowns = document.querySelectorAll(".nav-dropdown");

    dropdowns.forEach((dropdown) => {
      const button = dropdown.querySelector(".nav-dropdown-btn");
      const menu = dropdown.querySelector(".dropdown-menu");

      if (!button || !menu) return;

      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Close all other dropdowns
        dropdowns.forEach((otherDropdown) => {
          if (otherDropdown !== dropdown) {
            otherDropdown.classList.remove("active");
            otherDropdown
              .querySelector(".nav-dropdown-btn")
              ?.setAttribute("aria-expanded", "false");
          }
        });

        // Toggle current dropdown
        const isActive = dropdown.classList.contains("active");
        dropdown.classList.toggle("active");
        button.setAttribute("aria-expanded", !isActive);
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener("click", function (e) {
      dropdowns.forEach((dropdown) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove("active");
          dropdown
            .querySelector(".nav-dropdown-btn")
            ?.setAttribute("aria-expanded", "false");
        }
      });
    });

    // Close dropdowns on escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        dropdowns.forEach((dropdown) => {
          dropdown.classList.remove("active");
          dropdown
            .querySelector(".nav-dropdown-btn")
            ?.setAttribute("aria-expanded", "false");
        });
      }
    });
  }

  /**
   * Initialize mobile menu functionality
   */
  function initializeMobileMenu() {
    const toggle = document.getElementById("mobile-menu-toggle");
    const menu = document.getElementById("mobile-menu");

    if (!toggle || !menu) return;

    toggle.addEventListener("click", function () {
      const isActive = menu.classList.contains("active");
      menu.classList.toggle("active");
      toggle.setAttribute("aria-expanded", !isActive);

      // Animate hamburger
      const lines = toggle.querySelectorAll(".hamburger-line");
      if (isActive) {
        lines[0].style.transform = "none";
        lines[1].style.opacity = "1";
        lines[2].style.transform = "none";
      } else {
        lines[0].style.transform = "rotate(45deg) translate(5px, 5px)";
        lines[1].style.opacity = "0";
        lines[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
      }
    });

    // Close menu when clicking links
    const links = menu.querySelectorAll(".mobile-menu-link");
    links.forEach((link) => {
      link.addEventListener("click", function () {
        menu.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");

        // Reset hamburger animation
        const lines = toggle.querySelectorAll(".hamburger-line");
        lines[0].style.transform = "none";
        lines[1].style.opacity = "1";
        lines[2].style.transform = "none";
      });
    });

    // Close menu on escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("active")) {
        menu.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");

        // Reset hamburger animation
        const lines = toggle.querySelectorAll(".hamburger-line");
        lines[0].style.transform = "none";
        lines[1].style.opacity = "1";
        lines[2].style.transform = "none";
      }
    });
  }

  /**
   * Initialize theme toggle functionality
   */
  function initializeThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) return;

    // Get current theme
    const currentTheme =
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    // Apply theme
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeUI(currentTheme);

    // Handle toggle click
    themeToggle.addEventListener("click", function () {
      const newTheme = currentTheme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      updateThemeUI(newTheme);
    });

    function updateThemeUI(theme) {
      const icon = themeToggle.querySelector(".theme-icon");
      const text = themeToggle.querySelector(".theme-text");

      if (icon) {
        icon.textContent = theme === "light" ? "🌙" : "☀️";
      }
      if (text) {
        text.textContent = theme === "light" ? "Dark" : "Light";
      }
    }
  }

  // Export for global use
  window.NavigationLoader = {
    load: loadNavigation,
    initialize: initializeNavigation,
  };

  // Auto-load navigation if container exists
  document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("navigation-container");
    if (container) {
      // Check if we're in a subdirectory (more specific check)
      const isSubdirectory =
        window.location.pathname.includes("/SCI/") ||
        window.location.pathname.match(/\/[^/]+\/[^/]+$/);
      loadNavigation("navigation-container", isSubdirectory);
    }
  });
})();
