// Navigation System for APGI Website
class APGINavigation {
  constructor() {
    this.pages = {
      'Home': 'Home.html',
      'Assessment': 'Assessment.html',
      'Assessment-OnePage': 'Assessment-OnePage.html',
      'Quiz-Short': 'Quiz-Short.html',
      'Profile': 'Profile.html',
      'PsyStates': 'PsyStates.html',
      'PsyStates-Visualizer': 'PsyStates-Visualizer.html',
      'Consciousness-Visualization': 'Consciousness-Visualization.html',
      'Neuromoduratory-Cascade': 'Neuromoduratory-Cascade.html',
      'Book-Outline': 'Book-Outline.html',
      'Paper': 'Paper.html',
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
    if (document.getElementById('apgi-navigation')) {
      return;
    }

    const nav = document.createElement('nav');
    nav.id = 'apgi-navigation';
    nav.className = 'apgi-navigation';

    const navHTML = `
      <div class="nav-container">
        <div class="nav-brand">
          <a href="Home.html" class="brand-link">
            <span class="brand-text">APGI Framework</span>
          </a>
        </div>
        <div class="nav-menu">
          <a href="Home.html" data-page="Home" class="nav-item">Home</a>
          <a href="Quiz-Short.html" data-page="Quiz-Short" class="nav-item">Quiz</a>
          <a href="Assessment.html" data-page="Assessment" class="nav-item">Assessment</a>
          <span class="nav-separator">|</span>
          <a href="PsyStates-Visualizer.html" data-page="PsyStates-Visualizer" class="nav-item">PsyStates Visualizer</a>
          <a href="Consciousness-Visualization.html" data-page="Consciousness-Visualization" class="nav-item">Consciousness</a>
          <a href="Neuromoduratory-Cascade.html" data-page="Neuromoduratory-Cascade" class="nav-item">Neuromodulatory Cascade</a>
          <span class="nav-separator">|</span>
          <a href="Paper.html" data-page="Paper" class="nav-item">Research</a>
          <a href="Book-Outline.html" data-page="Book-Outline" class="nav-item">Book Outline</a>
          <a href="Privacy-Policy.html" data-page="Privacy-Policy" class="nav-item">Privacy</a>
          <a href="Terms-of-Service.html" data-page="Terms-of-Service" class="nav-item">Terms</a>
        </div>
        <button class="nav-toggle" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    `;

    nav.innerHTML = navHTML;

    // Insert at the beginning of body
    const body = document.body;
    if (body.firstChild) {
      body.insertBefore(nav, body.firstChild);
    } else {
      body.appendChild(nav);
    }

    // Add styles
    this.addNavigationStyles();
  }

  addNavigationStyles() {
    if (document.getElementById('apgi-nav-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'apgi-nav-styles';
    style.textContent = `
      .apgi-navigation {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 60px;
      }

      .nav-brand .brand-link {
        text-decoration: none;
        font-weight: 600;
        font-size: 18px;
        color: #2563eb;
      }

      .nav-menu {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: nowrap;
      }

      .nav-item {
        text-decoration: none;
        color: #475569;
        padding: 8px 16px;
        border-radius: 6px;
        transition: all 0.2s ease;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }

      .nav-item:hover {
        background: rgba(37, 99, 235, 0.1);
        color: #2563eb;
      }

      .nav-item.current {
        background: #2563eb;
        color: white;
      }

      .nav-item.nav-highlight {
        background: #2563eb;
        color: white;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
      }

      .nav-item.nav-highlight:hover {
        background: #1d4ed8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      }

      .nav-separator {
        color: #cbd5e1;
        font-size: 16px;
        font-weight: 300;
        margin: 0 8px;
      }

      .nav-toggle {
        display: none;
        flex-direction: column;
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
      }

      .nav-toggle span {
        width: 25px;
        height: 2px;
        background: #2563eb;
        margin: 3px 0;
        transition: 0.3s;
      }

      /* Add top margin to body content to account for fixed nav */
      body {
        padding-top: 60px !important;
      }

      @media (max-width: 768px) {
        .nav-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          padding: 20px;
          flex-direction: column;
          gap: 15px;
          align-items: flex-start;
        }

        .nav-menu.active {
          display: flex;
        }

        .nav-separator {
          display: none;
        }

        .nav-item {
          width: 100%;
          padding: 12px 16px;
        }

        .nav-toggle {
          display: flex;
        }

        .nav-toggle.active span:nth-child(1) {
          transform: rotate(-45deg) translate(-5px, 6px);
        }

        .nav-toggle.active span:nth-child(2) {
          opacity: 0;
        }

        .nav-toggle.active span:nth-child(3) {
          transform: rotate(45deg) translate(-5px, -6px);
        }
      }

      @media (max-width: 1200px) {
        .nav-menu {
          gap: 12px;
        }
        
        .nav-item {
          padding: 6px 12px;
          font-size: 13px;
        }
        
        .nav-separator {
          margin: 0 4px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  updateCurrentPage() {
    const links = document.querySelectorAll('.nav-item[data-page]');
    links.forEach(link => {
      const page = link.getAttribute('data-page');
      if (page === this.currentPage) {
        link.classList.add('current');
      } else {
        link.classList.remove('current');
      }
    });
  }

  setupEventListeners() {
    // Mobile menu toggle
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');
    
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        menu.classList.toggle('active');
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.apgi-navigation')) {
        const toggle = document.querySelector('.nav-toggle');
        const menu = document.querySelector('.nav-menu');
        if (toggle && menu) {
          toggle.classList.remove('active');
          menu.classList.remove('active');
        }
      }
    });

    // Update current page on navigation
    const links = document.querySelectorAll('.nav-item');
    links.forEach(link => {
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

  // Method to update all placeholder links in the page
  updatePlaceholderLinks() {
    const placeholderLinks = document.querySelectorAll('a[href="#"]');
    placeholderLinks.forEach(link => {
      const text = link.textContent.trim();
      const pageName = this.findPageByTitle(text);
      
      if (pageName) {
        link.setAttribute('href', this.pages[pageName]);
        link.removeAttribute('onclick');
      }
    });
  }

  findPageByTitle(text) {
    const titleMappings = {
      'Home': 'Home',
      'Quiz': 'Quiz-Short',
      'Assessment': 'Assessment',
      'Profile': 'Profile',
      'PsyStates': 'PsyStates',
      'PsyStates Visualizer': 'PsyStates-Visualizer',
      'Consciousness Visualization': 'Consciousness-Visualization',
      'Neuromoduratory Cascade': 'Neuromoduratory-Cascade',
      'Book Outline': 'Book-Outline',
      'Research': 'Paper',
      'APGI Paper': 'Paper',
      'Privacy': 'Privacy-Policy',
      'Privacy Policy': 'Privacy-Policy',
      'Terms': 'Terms-of-Service',
      'Terms of Service': 'Terms-of-Service'
    };

    // Check for exact matches first
    if (titleMappings[text]) {
      return titleMappings[text];
    }

    // Check for partial matches
    for (const [title, page] of Object.entries(titleMappings)) {
      if (text.toLowerCase().includes(title.toLowerCase()) || 
          title.toLowerCase().includes(text.toLowerCase())) {
        return page;
      }
    }

    return null;
  }
}

// Initialize navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.apgiNavigation = new APGINavigation();
  
  // Update placeholder links after initialization
  setTimeout(() => {
    window.apgiNavigation.updatePlaceholderLinks();
  }, 100);
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading
} else {
  // DOM is already loaded
  if (!window.apgiNavigation) {
    window.apgiNavigation = new APGINavigation();
    setTimeout(() => {
      window.apgiNavigation.updatePlaceholderLinks();
    }, 100);
  }
}
