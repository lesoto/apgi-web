// Accessibility Enhancement System for APGI Website
class APGIAccessibility {
  constructor() {
    this.init();
  }

  // Input sanitization utility
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate form inputs
  validateFormInput(input, type = 'text') {
    const sanitized = this.sanitizeInput(input);
    
    switch (type) {
      case 'email':
        return this.isValidEmail(sanitized) ? sanitized : null;
      case 'number':
        const num = parseFloat(sanitized);
        return !isNaN(num) ? num : null;
      case 'text':
      default:
        return sanitized.length > 0 ? sanitized : null;
    }
  }

  init() {
    this.addARIALabels();
    this.improveKeyboardNavigation();
    this.enhanceFocusIndicators();
    this.addScreenReaderSupport();
    this.improveColorContrast();
    this.addSkipLinks();
    this.enhanceFormAccessibility();
  }

  addARIALabels() {
    // Add ARIA labels to navigation
    const nav = document.querySelector('.apgi-navigation');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Main navigation');
    }

    // Add ARIA labels to interactive elements
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
      const text = button.textContent.trim();
      if (text && !button.getAttribute('aria-label')) {
        button.setAttribute('aria-label', text);
      }
    });

    // Add ARIA labels to links that lack descriptive text
    const links = document.querySelectorAll('a:not([aria-label])');
    links.forEach(link => {
      const text = link.textContent.trim();
      const href = link.getAttribute('href');
      
      if (!text && href) {
        // Handle icon-only links
        const icon = link.querySelector('i, svg');
        if (icon) {
          const className = icon.className || icon.getAttribute('data-lucide');
          link.setAttribute('aria-label', this.getIconDescription(className));
        }
      }
    });

    // Add ARIA labels to visualization containers
    const plots = document.querySelectorAll('[id*="plot"], .plot-container');
    plots.forEach((plot, index) => {
      if (!plot.getAttribute('role')) {
        plot.setAttribute('role', 'img');
        plot.setAttribute('aria-label', `Interactive visualization ${index + 1}`);
      }
    });

    // Add ARIA descriptions for complex content
    const descriptions = document.querySelectorAll('.description, .subtitle');
    descriptions.forEach(desc => {
      if (!desc.getAttribute('role')) {
        desc.setAttribute('role', 'doc-introduction');
      }
    });
  }

  getIconDescription(className) {
    const iconMap = {
      'home': 'Home page',
      'menu': 'Menu',
      'settings': 'Settings',
      'user': 'User profile',
      'search': 'Search',
      'close': 'Close',
      'chevron': 'Navigate',
      'arrow': 'Navigate',
      'download': 'Download',
      'upload': 'Upload',
      'edit': 'Edit',
      'delete': 'Delete',
      'share': 'Share',
      'facebook': 'Facebook',
      'twitter': 'Twitter',
      'instagram': 'Instagram',
      'linkedin': 'LinkedIn',
      'youtube': 'YouTube',
      'github': 'GitHub'
    };

    for (const [key, description] of Object.entries(iconMap)) {
      if (className.includes(key)) {
        return description;
      }
    }
    
    return 'Interactive element';
  }

  improveKeyboardNavigation() {
    // Ensure all interactive elements are focusable
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
    interactiveElements.forEach(element => {
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', element.disabled ? '-1' : '0');
      }
    });

    // Add keyboard navigation for custom components
    this.addKeyboardNavigationForCustomComponents();
    
    // Focus management for modals and overlays
    this.addFocusManagement();
  }

  addKeyboardNavigationForCustomComponents() {
    // Add keyboard support for quiz navigation
    const quizButtons = document.querySelectorAll('.quiz-nav button, .btn');
    quizButtons.forEach(button => {
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });

    // Add arrow key navigation for button groups
    const buttonGroups = document.querySelectorAll('.controls, .button-group');
    buttonGroups.forEach(group => {
      const buttons = group.querySelectorAll('button');
      
      group.addEventListener('keydown', (e) => {
        let currentIndex = -1;
        buttons.forEach((btn, index) => {
          if (btn === document.activeElement) {
            currentIndex = index;
          }
        });

        let newIndex = currentIndex;
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            newIndex = (currentIndex + 1) % buttons.length;
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            newIndex = currentIndex === 0 ? buttons.length - 1 : currentIndex - 1;
            break;
          default:
            return;
        }

        if (newIndex !== currentIndex && buttons[newIndex]) {
          e.preventDefault();
          buttons[newIndex].focus();
        }
      });
    });
  }

  addFocusManagement() {
    // Trap focus within modal dialogs
    const modals = document.querySelectorAll('.modal, [role="dialog"]');
    modals.forEach(modal => {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
              }
            }
          }
        });
      }
    });
  }

  enhanceFocusIndicators() {
    // Add enhanced focus styles
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced focus indicators */
      *:focus {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
      }
      
      *:focus:not(:focus-visible) {
        outline: 2px solid transparent !important;
      }
      
      *:focus-visible {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2) !important;
      }
      
      /* High contrast focus for better visibility */
      @media (prefers-contrast: high) {
        *:focus-visible {
          outline: 3px solid #000000 !important;
          outline-offset: 2px !important;
        }
      }
      
      /* Skip links styling */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #2563eb;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transition: top 0.3s;
      }
      
      .skip-link:focus {
        top: 6px;
      }
      
      /* Enhanced button focus */
      button:focus-visible,
      .btn:focus-visible {
        transform: translateY(-1px);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
      }
      
      /* Link focus improvements */
      a:focus-visible {
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 2px;
      }
      
      /* Form field focus improvements */
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        border-color: #2563eb !important;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
      }
      
      /* Interactive element focus */
      [role="button"]:focus-visible,
      [tabindex="0"]:focus-visible {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
      }
      
      /* High contrast mode improvements */
      @media (prefers-contrast: high) {
        .btn, button {
          border: 2px solid #000000 !important;
        }
        
        a {
          text-decoration: underline !important;
        }
        
        input, textarea, select {
          border: 2px solid #000000 !important;
        }
      }
      
      /* Reduced motion for focus animations */
      @media (prefers-reduced-motion: reduce) {
        *:focus-visible {
          transition: none !important;
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  addScreenReaderSupport() {
    // Add live regions for dynamic content
    this.addLiveRegions();
    
    // Add announcements for page changes
    this.addPageAnnouncements();
    
    // Enhance form validation announcements
    this.enhanceFormValidation();
  }

  addLiveRegions() {
    // Create live region container
    if (!document.getElementById('accessibility-live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'accessibility-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    // Announce loading states
    const loadingElements = document.querySelectorAll('.loading, [id*="loading"]');
    loadingElements.forEach(element => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const text = element.textContent.trim();
            if (text) {
              this.announceToScreenReader(text);
            }
          }
        });
      });
      
      observer.observe(element, { childList: true, subtree: true });
    });
  }

  addPageAnnouncements() {
    // Announce page title changes
    const titleObserver = new MutationObserver(() => {
      const title = document.title;
      if (title) {
        this.announceToScreenReader(`Page: ${title}`);
      }
    });
    
    titleObserver.observe(document.querySelector('title'), { childList: true });
  }

  enhanceFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        const errors = form.querySelectorAll('.error, [aria-invalid="true"]');
        if (errors.length > 0) {
          e.preventDefault();
          const errorMessages = Array.from(errors).map(error => 
            error.textContent || error.getAttribute('aria-describedby')
          ).filter(Boolean);
          
          if (errorMessages.length > 0) {
            this.announceToScreenReader(`Form has ${errorMessages.length} error(s): ${errorMessages.join(', ')}`);
          }
        }
      });
    });
  }

  announceToScreenReader(message) {
    const liveRegion = document.getElementById('accessibility-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  improveColorContrast() {
    // Add high contrast mode support
    const style = document.createElement('style');
    style.textContent = `
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        :root {
          --text: #000000;
          --bg: #ffffff;
          --accent: #0000ff;
          --border: #000000;
        }
        
        body {
          background: #ffffff !important;
          color: #000000 !important;
        }
        
        .container, main, .card, .panel {
          background: #ffffff !important;
          border: 2px solid #000000 !important;
        }
        
        button, .btn {
          background: #000000 !important;
          color: #ffffff !important;
          border: 2px solid #000000 !important;
        }
        
        a {
          color: #0000ff !important;
          text-decoration: underline !important;
        }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  addSkipLinks() {
    // Add skip links for keyboard navigation
    const skipLinks = document.createElement('div');
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
    `;
    document.body.insertBefore(skipLinks, document.body.firstChild);

    // Add main content landmark
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (main && !main.id) {
      main.id = 'main-content';
    }

    // Add navigation landmark
    const nav = document.querySelector('.apgi-navigation');
    if (nav && !nav.id) {
      nav.id = 'navigation';
    }
  }

  enhanceFormAccessibility() {
    // Add proper form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) {
          input.setAttribute('aria-labelledby', label.id || `label-${input.id}`);
          if (!label.id) {
            label.id = `label-${input.id}`;
          }
        }
      }

      // Add required field indicators
      if (input.required && !input.getAttribute('aria-required')) {
        input.setAttribute('aria-required', 'true');
      }
    });

    // Add fieldset and legend for form groups
    const formGroups = document.querySelectorAll('.form-group, .input-group');
    formGroups.forEach(group => {
      if (!group.querySelector('fieldset')) {
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        
        // Move group content into fieldset
        while (group.firstChild) {
          fieldset.appendChild(group.firstChild);
        }
        
        // Add legend if there's a heading
        const heading = group.querySelector('h3, h4, .group-label');
        if (heading) {
          legend.textContent = heading.textContent;
          heading.remove();
        }
        
        group.appendChild(fieldset);
        if (legend.textContent) {
          fieldset.insertBefore(legend, fieldset.firstChild);
        }
      }
    });
  }

  // Public method to announce messages
  static announce(message) {
    if (!window.apgiAccessibility) {
      window.apgiAccessibility = new APGIAccessibility();
    }
    window.apgiAccessibility.announceToScreenReader(message);
  }
}

// Initialize accessibility enhancements
document.addEventListener('DOMContentLoaded', () => {
  window.apgiAccessibility = new APGIAccessibility();
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
  if (!window.apgiAccessibility) {
    window.apgiAccessibility = new APGIAccessibility();
  }
}
