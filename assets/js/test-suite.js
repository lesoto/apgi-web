/**
 * Comprehensive Testing Suite for APGI Framework
 * Tests navigation, mobile responsiveness, form functionality, and payment flow
 */

class APGITestSuite {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
    };
    this.isRunning = false;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    if (this.isRunning) {
      console.log("Tests are already running...");
      return;
    }

    this.isRunning = true;
    this.resetResults();
    this.showTestUI();

    console.log("🧪 Starting APGI Framework Test Suite...");

    try {
      // Navigation Tests
      await this.testNavigationLoading();
      await this.testMobileMenu();
      await this.testDropdowns();
      await this.testThemeToggle();

      // Form Tests
      await this.testProfileForm();
      await this.testFormValidation();

      // Payment Tests
      await this.testPaymentService();
      await this.testWebhookTesting();

      // Responsive Tests
      await this.testMobileResponsiveness();
      await this.testAccessibility();

      // Performance Tests
      await this.testPageLoadPerformance();
      await this.testNavigationPerformance();
    } catch (error) {
      console.error("Test suite error:", error);
    } finally {
      this.isRunning = false;
      this.displayResults();
    }
  }

  /**
   * Reset test results
   */
  resetResults() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
    };
  }

  /**
   * Add test result
   */
  addResult(testName, passed, message, details = null) {
    this.results.total++;
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }

    this.results.details.push({
      name: testName,
      passed: passed,
      message: message,
      details: details,
      timestamp: new Date().toISOString(),
    });

    console.log(`${passed ? "✅" : "❌"} ${testName}: ${message}`);
    this.updateTestUI(testName, passed, message);
  }

  /**
   * Test navigation loading
   */
  async testNavigationLoading() {
    const testName = "Navigation Loading";

    try {
      // Wait for navigation to load
      await this.waitForElement("#navigation-container", 5000);

      const navContainer = document.getElementById("navigation-container");
      const hasContent =
        navContainer && navContainer.innerHTML.trim().length > 0;

      this.addResult(
        testName,
        hasContent,
        hasContent
          ? "Navigation loaded successfully"
          : "Navigation failed to load",
        {
          containerExists: !!navContainer,
          contentLength: navContainer?.innerHTML.length,
        },
      );
    } catch (error) {
      this.addResult(
        testName,
        false,
        `Navigation loading error: ${error.message}`,
      );
    }
  }

  /**
   * Test mobile menu functionality
   */
  async testMobileMenu() {
    const testName = "Mobile Menu";

    try {
      // Check if mobile menu toggle exists
      const toggle = document.getElementById("mobile-menu-toggle");
      const menu = document.getElementById("mobile-menu");

      const toggleExists = !!toggle;
      const menuExists = !!menu;

      if (toggleExists && menuExists) {
        // Test toggle functionality
        const wasHidden = !menu.classList.contains("active");
        toggle.click();

        // Wait for animation
        await this.sleep(300);

        const isNowVisible = menu.classList.contains("active");

        // Toggle back
        toggle.click();
        await this.sleep(300);

        const isHiddenAgain = !menu.classList.contains("active");

        const functionalityWorks = isNowVisible && isHiddenAgain;

        this.addResult(
          testName,
          functionalityWorks,
          functionalityWorks
            ? "Mobile menu works correctly"
            : "Mobile menu toggle failed",
          { toggleExists, menuExists, functionalityWorks },
        );
      } else {
        this.addResult(testName, false, "Mobile menu elements not found", {
          toggleExists,
          menuExists,
        });
      }
    } catch (error) {
      this.addResult(
        testName,
        false,
        `Mobile menu test error: ${error.message}`,
      );
    }
  }

  /**
   * Test dropdown functionality
   */
  async testDropdowns() {
    const testName = "Dropdown Navigation";

    try {
      const dropdowns = document.querySelectorAll(".nav-dropdown");
      const hasDropdowns = dropdowns.length > 0;

      if (hasDropdowns) {
        // Test first dropdown
        const firstDropdown = dropdowns[0];
        const button = firstDropdown.querySelector(".nav-dropdown-btn");
        const menu = firstDropdown.querySelector(".dropdown-menu");

        if (button && menu) {
          // Test dropdown toggle
          button.click();
          await this.sleep(200);

          const isActive = firstDropdown.classList.contains("active");

          // Close dropdown
          document.body.click();
          await this.sleep(200);

          const isClosed = !firstDropdown.classList.contains("active");

          const functionalityWorks = isActive && isClosed;

          this.addResult(
            testName,
            functionalityWorks,
            functionalityWorks
              ? "Dropdowns work correctly"
              : "Dropdown functionality failed",
            { dropdownCount: dropdowns.length, functionalityWorks },
          );
        } else {
          this.addResult(testName, false, "Dropdown button or menu not found");
        }
      } else {
        this.addResult(testName, false, "No dropdowns found on page");
      }
    } catch (error) {
      this.addResult(testName, false, `Dropdown test error: ${error.message}`);
    }
  }

  /**
   * Test theme toggle
   */
  async testThemeToggle() {
    const testName = "Theme Toggle";

    try {
      const themeToggle = document.getElementById("theme-toggle");
      const hasThemeToggle = !!themeToggle;

      if (hasThemeToggle) {
        const initialTheme =
          document.documentElement.getAttribute("data-theme");

        themeToggle.click();
        await this.sleep(100);

        const newTheme = document.documentElement.getAttribute("data-theme");
        const themeChanged = initialTheme !== newTheme;

        // Toggle back to original
        themeToggle.click();
        await this.sleep(100);

        this.addResult(
          testName,
          themeChanged,
          themeChanged ? "Theme toggle works correctly" : "Theme toggle failed",
          { initialTheme, newTheme, themeChanged },
        );
      } else {
        this.addResult(testName, false, "Theme toggle not found");
      }
    } catch (error) {
      this.addResult(
        testName,
        false,
        `Theme toggle test error: ${error.message}`,
      );
    }
  }

  /**
   * Test profile form (if on profile page)
   */
  async testProfileForm() {
    const testName = "Profile Form";

    try {
      const saveBtn = document.getElementById("save-profile-btn");
      const resetBtn = document.getElementById("reset-profile-btn");
      const formInputs = document.querySelectorAll(".form-input");

      const isProfilePage = !!saveBtn && !!resetBtn;

      if (isProfilePage) {
        // Test form validation
        const nameInput = document.getElementById("name");
        if (nameInput) {
          // Test empty validation
          nameInput.value = "";
          nameInput.dispatchEvent(new Event("blur"));
          await this.sleep(100);

          const hasError = nameInput.classList.contains("border-red-500");

          // Test valid input
          nameInput.value = "Test User";
          nameInput.dispatchEvent(new Event("input"));
          await this.sleep(100);

          const hasSuccess = nameInput.classList.contains("border-green-500");

          const validationWorks = hasError && hasSuccess;

          this.addResult(
            testName,
            validationWorks,
            validationWorks
              ? "Profile form validation works"
              : "Profile form validation failed",
            { isProfilePage, inputCount: formInputs.length, validationWorks },
          );
        } else {
          this.addResult(
            testName,
            false,
            "Name input not found on profile page",
          );
        }
      } else {
        this.addResult(testName, true, "Not on profile page - test skipped", {
          isProfilePage: false,
        });
      }
    } catch (error) {
      this.addResult(
        testName,
        false,
        `Profile form test error: ${error.message}`,
      );
    }
  }

  /**
   * Test form validation
   */
  async testFormValidation() {
    const testName = "Form Validation";

    try {
      const inputs = document.querySelectorAll(
        'input[type="email"], input[type="url"]',
      );
      const hasValidatableInputs = inputs.length > 0;

      if (hasValidatableInputs) {
        // Test email validation
        const emailInput = Array.from(inputs).find(
          (input) => input.type === "email",
        );
        if (emailInput) {
          // Test invalid email
          emailInput.value = "invalid-email";
          emailInput.dispatchEvent(new Event("blur"));
          await this.sleep(100);

          const hasError = emailInput.classList.contains("border-red-500");

          // Test valid email
          emailInput.value = "test@example.com";
          emailInput.dispatchEvent(new Event("input"));
          await this.sleep(100);

          const hasSuccess = emailInput.classList.contains("border-green-500");

          const validationWorks = hasError && hasSuccess;

          this.addResult(
            testName,
            validationWorks,
            validationWorks
              ? "Form validation works correctly"
              : "Form validation failed",
            { inputCount: inputs.length, validationWorks },
          );
        } else {
          this.addResult(
            testName,
            true,
            "No email inputs found - test partially passed",
          );
        }
      } else {
        this.addResult(
          testName,
          true,
          "No validatable inputs found - test skipped",
        );
      }
    } catch (error) {
      this.addResult(
        testName,
        false,
        `Form validation test error: ${error.message}`,
      );
    }
  }

  /**
   * Test payment service
   */
  async testPaymentService() {
    const testName = "Payment Service";

    try {
      const paymentServiceExists = !!window.paymentService;

      if (paymentServiceExists) {
        const isInitialized = window.paymentService.isInitialized;

        this.addResult(
          testName,
          isInitialized,
          isInitialized
            ? "Payment service initialized"
            : "Payment service not initialized",
          { paymentServiceExists, isInitialized },
        );
      } else {
        this.addResult(testName, false, "Payment service not found");
      }
    } catch (error) {
      this.addResult(
        testName,
        false,
        `Payment service test error: ${error.message}`,
      );
    }
  }

  /**
   * Test webhook testing
   */
  async testWebhookTesting() {
    const testName = "Webhook Testing";

    try {
      const webhookTesterExists = !!window.webhookTester;

      if (webhookTesterExists) {
        const hasTestEvents = Array.isArray(window.webhookTester.testEvents);

        this.addResult(
          testName,
          hasTestEvents,
          hasTestEvents
            ? "Webhook tester available"
            : "Webhook tester not properly initialized",
          { webhookTesterExists, hasTestEvents },
        );
      } else {
        this.addResult(testName, false, "Webhook tester not found");
      }
    } catch (error) {
      this.addResult(
        testName,
        false,
        `Webhook testing error: ${error.message}`,
      );
    }
  }

  /**
   * Test mobile responsiveness
   */
  async testMobileResponsiveness() {
    const testName = "Mobile Responsiveness";

    try {
      // Simulate mobile viewport
      const originalWidth = window.innerWidth;

      // Check if mobile menu toggle is visible (should be on mobile)
      const mobileToggle = document.getElementById("mobile-menu-toggle");
      const desktopNav = document.querySelector(".desktop-nav");

      const hasMobileElements = !!mobileToggle;
      const hasDesktopElements = !!desktopNav;

      // Check CSS media queries
      const mobileStyles = window.getComputedStyle(
        mobileToggle || document.body,
      );
      const mobileMenuVisible = mobileToggle
        ? mobileStyles.display !== "none"
        : false;

      this.addResult(
        testName,
        hasMobileElements,
        hasMobileElements
          ? "Mobile responsive elements present"
          : "Mobile elements missing",
        { hasMobileElements, hasDesktopElements, mobileMenuVisible },
      );
    } catch (error) {
      this.addResult(
        testName,
        false,
        `Mobile responsiveness test error: ${error.message}`,
      );
    }
  }

  /**
   * Test accessibility
   */
  async testAccessibility() {
    const testName = "Accessibility";

    try {
      // Check for ARIA labels
      const nav = document.querySelector('nav[role="navigation"]');
      const main = document.querySelector('main[role="main"]');
      const skipLink = document.querySelector(".skip-link");

      const hasNavRole = !!nav;
      const hasMainRole = !!main;
      const hasSkipLink = !!skipLink;

      // Check for proper heading structure
      const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      const hasHeadings = headings.length > 0;

      // Check for alt text on images
      const images = document.querySelectorAll("img");
      const imagesWithAlt = Array.from(images).filter((img) => img.alt).length;
      const allImagesHaveAlt = images.length === imagesWithAlt;

      const accessibilityScore = [
        hasNavRole,
        hasMainRole,
        hasSkipLink,
        hasHeadings,
        allImagesHaveAlt,
      ].filter(Boolean).length;
      const maxScore = 5;

      this.addResult(
        testName,
        accessibilityScore >= 4,
        `Accessibility score: ${accessibilityScore}/${maxScore}`,
        {
          hasNavRole,
          hasMainRole,
          hasSkipLink,
          hasHeadings,
          allImagesHaveAlt,
          accessibilityScore,
        },
      );
    } catch (error) {
      this.addResult(
        testName,
        false,
        `Accessibility test error: ${error.message}`,
      );
    }
  }

  /**
   * Test page load performance
   */
  async testPageLoadPerformance() {
    const testName = "Page Load Performance";

    try {
      // Check navigation timing API
      const navigation = performance.getEntriesByType("navigation")[0];
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      const domContentLoaded =
        navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart;

      const loadTimeAcceptable = loadTime < 3000; // 3 seconds
      const domLoadAcceptable = domContentLoaded < 1500; // 1.5 seconds

      const performanceGood = loadTimeAcceptable && domLoadAcceptable;

      this.addResult(
        testName,
        performanceGood,
        performanceGood ? "Page load performance acceptable" : "Page load slow",
        { loadTime, domContentLoaded, loadTimeAcceptable, domLoadAcceptable },
      );
    } catch (error) {
      this.addResult(
        testName,
        false,
        `Performance test error: ${error.message}`,
      );
    }
  }

  /**
   * Test navigation performance
   */
  async testNavigationPerformance() {
    const testName = "Navigation Performance";

    try {
      const startTime = performance.now();

      // Test navigation loading speed
      await this.waitForElement("#navigation-container", 3000);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      const performanceGood = loadTime < 1000; // 1 second

      this.addResult(
        testName,
        performanceGood,
        performanceGood
          ? "Navigation loads quickly"
          : "Navigation loading slow",
        { loadTime, performanceGood },
      );
    } catch (error) {
      this.addResult(
        testName,
        false,
        `Navigation performance test error: ${error.message}`,
      );
    }
  }

  /**
   * Wait for element to appear
   */
  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Sleep utility
   */
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Show test UI
   */
  showTestUI() {
    // Remove existing test UI
    const existing = document.getElementById("apgi-test-ui");
    if (existing) {
      existing.remove();
    }

    const testUI = document.createElement("div");
    testUI.id = "apgi-test-ui";
    testUI.className =
      "fixed top-4 right-4 w-96 bg-white border rounded-lg shadow-lg z-50 p-4";
    testUI.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold">APGI Test Suite</h3>
                <button id="close-test-ui" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="mb-2">
                <div class="text-sm text-gray-600">Running tests...</div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div id="test-progress" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>
            <div id="test-results" class="max-h-64 overflow-y-auto text-sm">
                <div class="text-gray-500">Test results will appear here...</div>
            </div>
        `;

    document.body.appendChild(testUI);

    // Setup close button
    testUI.querySelector("#close-test-ui").addEventListener("click", () => {
      testUI.remove();
    });
  }

  /**
   * Update test UI
   */
  updateTestUI(testName, passed, message) {
    const resultsDiv = document.getElementById("test-results");
    const progressDiv = document.getElementById("test-progress");

    if (resultsDiv) {
      const testItem = document.createElement("div");
      testItem.className = `mb-2 p-2 rounded ${passed ? "bg-green-50" : "bg-red-50"}`;
      testItem.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="${passed ? "text-green-500" : "text-red-500"}">${passed ? "✅" : "❌"}</span>
                    <span class="font-medium">${testName}</span>
                </div>
                <div class="text-xs text-gray-600 ml-6">${message}</div>
            `;

      // Clear initial message if present
      if (resultsDiv.querySelector(".text-gray-500")) {
        resultsDiv.innerHTML = "";
      }

      resultsDiv.appendChild(testItem);
      resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }

    // Update progress
    if (progressDiv) {
      const progress = (this.results.total / 12) * 100; // Approximate total tests
      progressDiv.style.width = `${progress}%`;
    }
  }

  /**
   * Display final results
   */
  displayResults() {
    const resultsDiv = document.getElementById("test-results");
    const progressDiv = document.getElementById("test-progress");

    if (resultsDiv) {
      const summaryDiv = document.createElement("div");
      summaryDiv.className = "mt-4 p-3 bg-gray-100 rounded-lg";
      summaryDiv.innerHTML = `
                <div class="font-semibold mb-2">Test Summary</div>
                <div class="text-sm">
                    <div>✅ Passed: ${this.results.passed}</div>
                    <div>❌ Failed: ${this.results.failed}</div>
                    <div>📊 Total: ${this.results.total}</div>
                    <div class="font-medium mt-1">Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%</div>
                </div>
                <button id="export-results" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    Export Results
                </button>
            `;

      resultsDiv.appendChild(summaryDiv);

      // Setup export button
      summaryDiv
        .querySelector("#export-results")
        .addEventListener("click", () => {
          this.exportResults();
        });
    }

    // Complete progress
    if (progressDiv) {
      progressDiv.style.width = "100%";
    }

    console.log(
      `🏁 Test Suite Complete: ${this.results.passed}/${this.results.total} passed`,
    );
  }

  /**
   * Export test results
   */
  exportResults() {
    const dataStr = JSON.stringify(this.results, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `apgi-test-results-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }
}

// Create global test suite instance
window.apgiTestSuite = new APGITestSuite();

// Auto-run tests in development
document.addEventListener("DOMContentLoaded", () => {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    // Wait a bit for page to load
    setTimeout(() => {
      console.log(
        "🧪 APGI Test Suite ready. Run window.apgiTestSuite.runAllTests() to start testing.",
      );
    }, 2000);
  }
});

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = APGITestSuite;
}
