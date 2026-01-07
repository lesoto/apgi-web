/**
 * Site-wide Search Functionality
 * Provides search across all APGI Framework pages
 */

class SiteSearch {
  constructor() {
    this.searchIndex = [];
    this.init();
  }

  init() {
    this.createSearchIndex();
    this.setupSearchUI();
    this.bindEvents();
  }

  // Create search index from page content
  createSearchIndex() {
    const pages = [
      {
        title: 'APGI Framework',
        url: 'Home.html',
        description:
          'Understanding consciousness through the Allostatic Precision-Gated Ignition framework',
        keywords: ['consciousness', 'framework', 'apgi', 'home', 'introduction']
      },
      {
        title: 'Assessment',
        url: 'Assessment.html',
        description: 'Take the comprehensive APGI consciousness assessment',
        keywords: ['assessment', 'quiz', 'test', 'consciousness', 'evaluation']
      },
      {
        title: 'Quick Quiz',
        url: 'Quiz.html',
        description: 'Quick APGI consciousness assessment',
        keywords: ['quiz', 'short', 'quick', 'assessment', 'test']
      },
      {
        title: 'PsyStates Visualizer',
        url: 'PsyStates-Visualizer.html',
        description: 'Interactive visualization of psychological states',
        keywords: ['psychology', 'states', 'visualization', 'interactive', 'mental']
      },
      {
        title: 'Consciousness Visualization',
        url: 'Consciousness-Visualization.html',
        description: 'Visual representations of consciousness states',
        keywords: ['consciousness', 'visualization', 'states', 'awareness']
      },
      {
        title: 'Research Paper',
        url: 'Paper.html',
        description: 'Scientific research on APGI framework',
        keywords: ['research', 'paper', 'science', 'academic', 'study']
      },
      {
        title: '3D State Network',
        url: 'State-Network.html',
        description: '3D visualization of consciousness networks',
        keywords: ['3d', 'network', 'visualization', 'states', 'interactive']
      },
      {
        title: 'Academic Dashboard',
        url: 'Dashboard.html',
        description: 'Academic analysis dashboard for researchers',
        keywords: ['dashboard', 'academic', 'research', 'analysis', 'data']
      },
      {
        title: 'APGI Explorer',
        url: 'App-Explorer.html',
        description: 'macOS app for consciousness exploration',
        keywords: ['app', 'explorer', 'macos', 'application', 'desktop']
      },
      {
        title: 'APGI Appendix',
        url: 'App-Appendix.html',
        description: 'Interactive companion to consciousness science',
        keywords: ['appendix', 'companion', 'interactive', 'science']
      },
      {
        title: 'APGI Experiments',
        url: 'APGI-Experiments.html',
        description: 'Computational consciousness modeling experiments',
        keywords: ['experiments', 'computational', 'modeling', 'research']
      },
      {
        title: 'APGI Software System',
        url: 'APGI-Software-System.html',
        description: 'Software architecture for consciousness research',
        keywords: ['software', 'system', 'architecture', 'development']
      },
      {
        title: 'Book-Available-Now.',
        url: 'Book-Available-Now.html',
        description: 'When Consciousness Turns On - APGI Book',
        keywords: ['book', 'consciousness', 'publication', 'reading']
      },
      {
        title: 'Book Outline',
        url: 'Book-Outline.html',
        description: 'Complete outline of APGI framework book',
        keywords: ['book', 'outline', 'structure', 'chapters']
      },
      {
        title: 'Profile',
        url: 'Profile.html',
        description: 'APGI Framework profile and social links',
        keywords: ['profile', 'social', 'about', 'contact']
      },
      {
        title: 'Privacy Policy',
        url: 'Privacy-Policy.html',
        description: 'Privacy policy and data protection',
        keywords: ['privacy', 'policy', 'data', 'protection', 'legal']
      },
      {
        title: 'Terms of Service',
        url: 'Terms-of-Service.html',
        description: 'Terms of service and usage',
        keywords: ['terms', 'service', 'legal', 'usage', 'conditions']
      }
    ];

    this.searchIndex = pages;
  }

  // Setup search UI
  setupSearchUI() {
    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
            <div class="search-input-wrapper">
                <input 
                    type="text" 
                    id="site-search-input" 
                    placeholder="Search APGI Framework..." 
                    autocomplete="off"
                    aria-label="Search site"
                >
                <button id="search-clear-btn" class="search-clear-btn" aria-label="Clear search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div id="search-results" class="search-results" role="listbox" aria-label="Search results"></div>
        `;

    // Add to navigation
    const navContainer = document.querySelector('.nav-links');
    if (navContainer) {
      navContainer.appendChild(searchContainer);
    }

    // Add styles
    this.addSearchStyles();
  }

  // Add search styles
  addSearchStyles() {
    const style = document.createElement('style');
    style.textContent = `
            .search-container {
                position: relative;
                margin-left: 1rem;
            }

            .search-input-wrapper {
                position: relative;
                display: flex;
                align-items: center;
            }

            #site-search-input {
                padding: 0.5rem 2.5rem 0.5rem 1rem;
                border: 1px solid var(--border, #e2e8f0);
                border-radius: 0.375rem;
                background: var(--background, #ffffff);
                color: var(--text, #1a202c);
                font-size: 0.875rem;
                width: 250px;
                transition: all 0.2s ease;
            }

            #site-search-input:focus {
                outline: none;
                border-color: var(--primary, #3b82f6);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .search-clear-btn {
                position: absolute;
                right: 0.5rem;
                background: none;
                border: none;
                color: var(--text-muted, #718096);
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 0.25rem;
                display: none;
            }

            .search-clear-btn:hover {
                background: var(--background-hover, #f7fafc);
                color: var(--text, #1a202c);
            }

            .search-results {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--background, #ffffff);
                border: 1px solid var(--border, #e2e8f0);
                border-radius: 0.375rem;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                max-height: 400px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
            }

            .search-results.show {
                display: block;
            }

            .search-result-item {
                padding: 0.75rem 1rem;
                border-bottom: 1px solid var(--border, #e2e8f0);
                cursor: pointer;
                transition: background-color 0.2s ease;
            }

            .search-result-item:last-child {
                border-bottom: none;
            }

            .search-result-item:hover,
            .search-result-item:focus {
                background: var(--background-hover, #f7fafc);
            }

            .search-result-title {
                font-weight: 600;
                color: var(--text, #1a202c);
                margin-bottom: 0.25rem;
            }

            .search-result-description {
                font-size: 0.875rem;
                color: var(--text-muted, #718096);
                margin-bottom: 0.25rem;
            }

            .search-result-url {
                font-size: 0.75rem;
                color: var(--primary, #3b82f6);
            }

            .search-no-results {
                padding: 1rem;
                text-align: center;
                color: var(--text-muted, #718096);
            }

            @media (max-width: 768px) {
                .search-container {
                    margin-left: 0;
                    margin-top: 0.5rem;
                    width: 100%;
                }

                #site-search-input {
                    width: 100%;
                }
            }
        `;
    document.head.appendChild(style);
  }

  // Bind events
  bindEvents() {
    const searchInput = document.getElementById('site-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    const resultsContainer = document.getElementById('search-results');

    if (!searchInput || !resultsContainer) return;

    // Search input events
    searchInput.addEventListener('input', e => {
      const query = e.target.value.trim();

      if (query) {
        clearBtn.style.display = 'block';
        this.performSearch(query);
      } else {
        clearBtn.style.display = 'none';
        this.hideResults();
      }
    });

    // Clear button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        this.hideResults();
        searchInput.focus();
      });
    }

    // Click outside to close
    document.addEventListener('click', e => {
      if (!e.target.closest('.search-container')) {
        this.hideResults();
      }
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.hideResults();
        searchInput.blur();
      }
    });
  }

  // Perform search
  performSearch(query) {
    const results = this.searchIndex.filter(page => {
      const searchText =
        `${page.title} ${page.description} ${page.keywords.join(' ')}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    this.displayResults(results, query);
  }

  // Display search results
  displayResults(results, query) {
    const resultsContainer = document.getElementById('search-results');

    if (!resultsContainer) return;

    if (results.length === 0) {
      resultsContainer.innerHTML = `
                <div class="search-no-results">
                    No results found for "${query}"
                </div>
            `;
    } else {
      resultsContainer.innerHTML = results
        .map(
          page => `
                <div class="search-result-item" role="option" data-url="${page.url}">
                    <div class="search-result-title">${this.highlightMatch(page.title, query)}</div>
                    <div class="search-result-description">${this.highlightMatch(page.description, query)}</div>
                    <div class="search-result-url">${page.url}</div>
                </div>
            `
        )
        .join('');

      // Add click handlers
      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const url = item.dataset.url;
          window.location.href = url;
        });
      });
    }

    resultsContainer.classList.add('show');
  }

  // Highlight matching text
  highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Hide results
  hideResults() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
      resultsContainer.classList.remove('show');
    }
  }
}

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SiteSearch();
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SiteSearch;
}
