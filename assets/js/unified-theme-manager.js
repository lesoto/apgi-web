/**
 * APGI Framework - Standardized Theme Manager
 * Provides consistent theme toggle functionality across all pages
 */

class APGIThemeManager {
    constructor() {
        this.storageKey = 'apgi-theme';
        this.defaultTheme = 'dark';
        this.themes = {
            dark: {
                name: 'Dark Mode',
                icon: 'fas fa-moon',
                dataTheme: 'dark'
            },
            light: {
                name: 'Light Mode', 
                icon: 'fas fa-sun',
                dataTheme: 'light'
            }
        };
        
        this.init();
    }
    
    init() {
        // Load saved theme or use default
        const savedTheme = this.getSavedTheme();
        this.setTheme(savedTheme);
        
        // Create theme toggle if it doesn't exist
        this.createThemeToggle();
        
        // Listen for system theme changes
        this.setupSystemThemeListener();
    }
    
    getSavedTheme() {
        try {
            return localStorage.getItem(this.storageKey) || this.defaultTheme;
        } catch (error) {
            console.warn('Could not access localStorage for theme:', error);
            return this.defaultTheme;
        }
    }
    
    setTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Unknown theme: ${themeName}`);
            return;
        }
        
        const theme = this.themes[themeName];
        
        // Update HTML data attribute
        document.documentElement.setAttribute('data-theme', theme.dataTheme);
        
        // Update body class for additional styling
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme.dataTheme}`);
        
        // Save preference
        try {
            localStorage.setItem(this.storageKey, themeName);
        } catch (error) {
            console.warn('Could not save theme preference:', error);
        }
        
        // Update toggle button
        this.updateThemeToggle(themeName);
        
        // Dispatch custom event
        this.dispatchThemeChange(themeName);
    }
    
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || this.defaultTheme;
    }
    
    createThemeToggle() {
        // Check if toggle already exists
        if (document.getElementById('apgi-theme-toggle')) {
            return;
        }
        
        const toggle = document.createElement('div');
        toggle.id = 'apgi-theme-toggle';
        toggle.className = 'apgi-theme-toggle';
        toggle.innerHTML = `
            <button class="apgi-theme-toggle-btn" aria-label="Toggle theme">
                <i class="apgi-theme-icon apgi-theme-icon-moon fas fa-moon"></i>
                <div class="apgi-theme-toggle-slider"></div>
                <i class="apgi-theme-icon apgi-theme-icon-sun fas fa-sun"></i>
            </button>
        `;
        
        // Add styles
        this.addThemeStyles();
        
        // Add click handler
        toggle.addEventListener('click', () => this.toggleTheme());
        
        // Insert into page
        document.body.appendChild(toggle);
        
        // Update initial state
        this.updateThemeToggle(this.getCurrentTheme());
    }
    
    updateThemeToggle(themeName) {
        const toggle = document.getElementById('apgi-theme-toggle');
        if (!toggle) return;
        
        const theme = this.themes[themeName];
        const slider = toggle.querySelector('.apgi-theme-toggle-slider');
        const moonIcon = toggle.querySelector('.apgi-theme-icon-moon');
        const sunIcon = toggle.querySelector('.apgi-theme-icon-sun');
        
        if (themeName === 'light') {
            slider?.classList.add('apgi-theme-toggle-slider-light');
            moonIcon?.classList.add('apgi-theme-icon-hidden');
            sunIcon?.classList.remove('apgi-theme-icon-hidden');
        } else {
            slider?.classList.remove('apgi-theme-toggle-slider-light');
            moonIcon?.classList.remove('apgi-theme-icon-hidden');
            sunIcon?.classList.add('apgi-theme-icon-hidden');
        }
    }
    
    addThemeStyles() {
        if (document.getElementById('apgi-theme-styles')) {
            return;
        }
        
        const styles = document.createElement('style');
        styles.id = 'apgi-theme-styles';
        styles.textContent = `
            .apgi-theme-toggle {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 8px;
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            }
            
            .apgi-theme-toggle:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            
            .apgi-theme-toggle-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 6px 12px;
                border-radius: 8px;
                transition: background 0.3s ease;
            }
            
            .apgi-theme-toggle-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .apgi-theme-icon {
                font-size: 16px;
                color: #ffffff;
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            
            .apgi-theme-icon-hidden {
                opacity: 0;
                transform: scale(0.8);
            }
            
            .apgi-theme-toggle-slider {
                width: 44px;
                height: 24px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 12px;
                position: relative;
                transition: background 0.3s ease;
            }
            
            .apgi-theme-toggle-slider::after {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 20px;
                height: 20px;
                background: #ffffff;
                border-radius: 50%;
                transition: transform 0.3s ease;
            }
            
            .apgi-theme-toggle-slider-light {
                background: #3b82f6;
            }
            
            .apgi-theme-toggle-slider-light::after {
                transform: translateX(20px);
            }
            
            /* Light theme adjustments */
            [data-theme="light"] .apgi-theme-toggle {
                background: rgba(0, 0, 0, 0.05);
                border-color: rgba(0, 0, 0, 0.1);
            }
            
            [data-theme="light"] .apgi-theme-toggle:hover {
                background: rgba(0, 0, 0, 0.1);
            }
            
            [data-theme="light"] .apgi-theme-icon {
                color: #000000;
            }
            
            [data-theme="light"] .apgi-theme-toggle-btn:hover {
                background: rgba(0, 0, 0, 0.05);
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                .apgi-theme-toggle {
                    top: 15px;
                    right: 15px;
                }
                
                .apgi-theme-icon {
                    font-size: 14px;
                }
                
                .apgi-theme-toggle-slider {
                    width: 38px;
                    height: 20px;
                }
                
                .apgi-theme-toggle-slider::after {
                    width: 16px;
                    height: 16px;
                }
                
                .apgi-theme-toggle-slider-light::after {
                    transform: translateX(18px);
                }
            }
            
            /* Print styles */
            @media print {
                .apgi-theme-toggle {
                    display: none !important;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    setupSystemThemeListener() {
        if (!window.matchMedia) return;
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem(this.storageKey)) {
                const systemTheme = e.matches ? 'dark' : 'light';
                this.setTheme(systemTheme);
            }
        });
    }
    
    dispatchThemeChange(themeName) {
        const event = new CustomEvent('apgi-theme-change', {
            detail: {
                theme: themeName,
                themeData: this.themes[themeName]
            }
        });
        document.dispatchEvent(event);
    }
    
    // Public API for other scripts
    getThemeData(themeName) {
        return this.themes[themeName];
    }
    
    getAllThemes() {
        return this.themes;
    }
    
    resetToDefault() {
        localStorage.removeItem(this.storageKey);
        this.setTheme(this.defaultTheme);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.apgiThemeManager = new APGIThemeManager();
    });
} else {
    window.apgiThemeManager = new APGIThemeManager();
}

// Global function for compatibility with existing code
window.toggleTheme = function() {
    if (window.apgiThemeManager) {
        window.apgiThemeManager.toggleTheme();
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APGIThemeManager;
}
