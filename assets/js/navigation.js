// Navigation System for APGI Website
class APGINavigation {
  constructor() {
    this.pages = {
      Home: 'Home.html',
      Assessment: 'Assessment.html',
      'Assessment-OnePage': 'Assessment-OnePage.html',
      'Quiz-Short': 'Quiz.html',
      Profile: 'Profile.html',
      PsyStates: 'PsyStates.html',
      'PsyStates-Visualizer': 'PsyStates-Visualizer.html',
      'Consciousness-Visualization': 'Consciousness-Visualization.html',
      'Neuromoduratory-Cascade': 'Neuromoduratory-Cascade.html',
      'Book-Outline': 'Book-Outline.html',
      Paper: 'Paper.html',
      'Privacy-Policy': 'Privacy-Policy.html',
      'Terms-of-Service': 'Terms-of-Service.html'
    };

    this.currentPage = this.getCurrentPage();
    this.init();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const fileName = path.split('/').pop();
    return fileName.replace('.html', '') || 'Home';
  }

  init() {
    this.createNavigation();
    this.updateCurrentPage();
    this.setupEventListeners();
  }

  createNavigation() {
    // Check if navigation already exists
    if (document.querySelector('.main-nav')) {
      return;
    }

    // Create and inject the navigation component
    fetch('components/navigation.html')
      .then(response => response.text())
      .then(html => {
        const navContainer = document.createElement('div');
        navContainer.innerHTML = html;
        
        // Insert at the beginning of body
        const body = document.body;
        if (body.firstChild) {
          body.insertBefore(navContainer.firstChild, body.firstChild);
        } else {
          body.appendChild(navContainer.firstChild);
        }
        
        // Initialize dropdown functionality
        this.initializeDropdowns();
        
        // Update current page highlighting
        this.updateCurrentPage();
        
        // Setup event listeners
        this.setupEventListeners();
      })
      .catch(error => {
        console.error('Failed to load navigation component:', error);
        // Fallback to basic navigation
        this.createFallbackNavigation();
      });
  }

  initializeDropdowns() {
    // Dropdown functionality is already included in the navigation.html component
    // This method can be used for additional initialization if needed
  }

  createFallbackNavigation() {
    // Create a simple fallback navigation if the component fails to load
    const nav = document.createElement('nav');
    nav.className = 'main-nav';
    nav.innerHTML = `
      <div class="nav-container">
        <div class="nav-links">
          <a href="Home.html" class="nav-link">APGI Framework</a>
          <a href="Quiz.html" class="nav-link">Quiz</a>
          <a href="Assessment.html" class="nav-link">Assessment</a>
          <a href="Paper.html" class="nav-link">Research</a>
          <a href="Book-Outline.html" class="nav-link">Book</a>
        </div>
      </div>
    `;
    
    const body = document.body;
    if (body.firstChild) {
      body.insertBefore(nav, body.firstChild);
    } else {
      body.appendChild(nav);
    }
  }

  updateCurrentPage() {
    const currentPage = this.getCurrentPage();
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        // Remove existing active/current classes
        link.classList.remove('active', 'current');
        
        // Check if this link matches the current page
        const linkPage = href.replace('.html', '').replace(/^.*\//, '');
        const currentPageClean = currentPage.replace(/^.*\//, '');
        
        if (linkPage === currentPageClean || 
            (currentPageClean === '' && linkPage === 'Home')) {
          link.classList.add('current');
        }
      }
    });
  }

  setupEventListeners() {
    // Handle dropdown functionality
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    
    dropdowns.forEach(dropdown => {
      const button = dropdown.querySelector('.nav-dropdown-btn');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (button && menu) {
        // Toggle dropdown on button click
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Close all other dropdowns
          dropdowns.forEach(otherDropdown => {
            if (otherDropdown !== dropdown) {
              otherDropdown.classList.remove('active');
              const otherButton = otherDropdown.querySelector('.nav-dropdown-btn');
              if (otherButton) {
                otherButton.setAttribute('aria-expanded', 'false');
              }
            }
          });
          
          // Toggle current dropdown
          const isActive = dropdown.classList.contains('active');
          dropdown.classList.toggle('active');
          button.setAttribute('aria-expanded', !isActive);
        });
        
        // Handle keyboard navigation
        button.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            button.click();
          } else if (e.key === 'Escape') {
            dropdown.classList.remove('active');
            button.setAttribute('aria-expanded', 'false');
            button.focus();
          }
        });
        
        // Handle keyboard navigation within dropdown
        const links = menu.querySelectorAll('.dropdown-link');
        links.forEach((link, index) => {
          link.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              const nextLink = links[index + 1] || links[0];
              nextLink.focus();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              const prevLink = links[index - 1] || links[links.length - 1];
              prevLink.focus();
            } else if (e.key === 'Escape') {
              dropdown.classList.remove('active');
              button.setAttribute('aria-expanded', 'false');
              button.focus();
            }
          });
        });
      }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.nav-dropdown')) {
        dropdowns.forEach(dropdown => {
          dropdown.classList.remove('active');
          const button = dropdown.querySelector('.nav-dropdown-btn');
          if (button) {
            button.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
    
    // Close dropdowns when window is resized (for mobile responsiveness)
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        dropdowns.forEach(dropdown => {
          dropdown.classList.remove('active');
          const button = dropdown.querySelector('.nav-dropdown-btn');
          if (button) {
            button.setAttribute('aria-expanded', 'false');
          }
        });
      }, 250);
    });
    
    // Handle touch events for mobile
    if ('ontouchstart' in window) {
      dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.nav-dropdown-btn');
        if (button) {
          button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            button.click();
          });
        }
      });
    }

    // Theme toggle functionality is now handled by theme-manager.js
    // This prevents conflicts with the centralized ThemeManager

    // Handle navigation clicks
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href !== '#') {
          // Let the browser handle navigation
          return;
        }
        e.preventDefault();
      });
    });
  }
}

// Initialize navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.apgiNavigation = new APGINavigation();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading
} else {
  // DOM is already loaded
  if (!window.apgiNavigation) {
    window.apgiNavigation = new APGINavigation();
  }
}
