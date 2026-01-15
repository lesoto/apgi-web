// Lucide Icons Fallback - Minimal Icon Set
// Provides basic icon functionality when CDN fails

class LucideFallback {
  constructor() {
    this.icons = {
      // Navigation
      menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
      home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-5.5 5.5v11l11-11v-11z"></path><polyline points="3 9 9 15"></polyline></svg>',

      // Actions
      search:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35a1 1 0 0 1-1.41 0l-9.39 9.39h.09a1 1 0 0 1 .91-.31l7.07-7.07a1 1 0 0 1 1.41 0z"></path></svg>',
      download:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15"></polyline><polyline points="3 14 12 21"></polyline></svg>',
      settings:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="m12 1 0 6 0m0 6 0 6 0m-6-6h12"></path></svg>',

      // UI
      check:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4"></polyline><path d="m20 12-7-7 7"></path></svg>',
      x: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      arrowRight:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12"></polyline></svg>',
      arrowLeft:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 5 5 12"></polyline></svg>',

      // Content
      brain:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9.5 2.5-1.5 1.5h6l6 6v11l-6 6h-6a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2z"></path></svg>',
      book: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m4 19.5a2.5 2.5 0 0 1 0 5h0a2.5 2.5 0 0 1 0-5z"></path><path d="m19.5 19.5a2.5 2.5 0 0 1 0-5h0a2.5 2.5 0 0 1 0 5z"></path><path d="m16 13.5a2.5 2.5 0 0 1 0-5h-6a2.5 2.5 0 0 1 0 5z"></path></svg>',

      // Status
      alertTriangle:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m10.29 3.86 1.64 1.64-6.89 6.89a2 2 0 0 1 2.83 2.83l6.89 6.89a2 2 0 0 1 2.83-2.83z"></path><path d="m13.17 19-6.89-6.89a2 2 0 0 1-2.83 0l-6.89 6.89a2 2 0 0 1-2.83 2.83z"></path></svg>',
      info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    };
  }

  createIcon(name, options = {}) {
    const icon = this.icons[name];
    if (!icon) return `<span>[${name}]</span>`;

    const size = options.size || 24;
    const className = options.className || "";

    return `<span class="lucide-fallback-icon ${className}" style="width: ${size}px; height: ${size}px; display: inline-block; vertical-align: middle;">${icon}</span>`;
  }

  createIcons() {
    // Replace all data-lucide elements with fallbacks
    document.querySelectorAll("[data-lucide]").forEach((element) => {
      const iconName = element.getAttribute("data-lucide");
      if (iconName && this.icons[iconName]) {
        element.innerHTML = this.createIcon(iconName, {
          className: element.className,
          size:
            element.getAttribute("width") ||
            element.getAttribute("height") ||
            24,
        });
      }
    });
  }
}

// Initialize fallback if Lucide is not available
if (typeof lucide === "undefined") {
  window.lucide = {
    createIcons: () => {
      const fallback = new LucideFallback();
      fallback.createIcons();
    },
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.lucide.createIcons();
    });
  } else {
    window.lucide.createIcons();
  }
}

// Export for potential module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { LucideFallback };
}
