/**
 * Payment Service for APGI Framework
 * Handles Stripe integration and payment processing
 */

// Development mode check
const isDev =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.includes("dev") ||
  window.envConfig?.isDevelopment();

class PaymentService {
  constructor() {
    // Check if environment config is available
    if (typeof window.envConfig === "undefined") {
      if (isDev)
        console.error(
          "Environment configuration not loaded. Please include environment-config.js before payment-service.js",
        );
    }

    this.stripe = null;
    this.isInitialized = false;
    this.testMode = !window.envConfig?.isProductionReady();

    // Test webhook endpoint for development
    this.webhookUrl = "https://webhook.site/your-webhook-url"; // Replace with actual webhook.site URL
  }

  /**
   * Initialize Stripe with appropriate keys
   */
  async initialize() {
    try {
      // Load Stripe.js if not already loaded
      if (typeof Stripe === "undefined") {
        await this.loadStripeScript();
      }

      // Get publishable key from environment config
      const publishableKey = window.envConfig?.get("stripe.publishableKey");

      if (!publishableKey) {
        throw new Error("Stripe publishable key not configured");
      }

      this.stripe = Stripe(publishableKey);
      this.isInitialized = true;

      if (isDev)
        console.log(
          "Payment service initialized in",
          this.testMode ? "test" : "production",
          "mode",
        );

      return true;
    } catch (error) {
      if (isDev) console.error("Failed to initialize payment service:", error);
      return false;
    }
  }

  /**
   * Load Stripe.js script dynamically
   */
  loadStripeScript() {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="stripe.com"]')) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Create checkout session for payment
   */
  async createCheckoutSession(tier, customerEmail) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const tierConfigs = {
      starter: {
        priceId: "price_1Oabcdef1234567890", // Replace with actual test price ID
        quantity: 1,
        metadata: {
          tier: "starter",
          features: "Basic assessments, limited storage",
        },
      },
      professional: {
        priceId: "price_1Oabcdef1234567891", // Replace with actual test price ID
        quantity: 1,
        metadata: {
          tier: "professional",
          features: "Advanced assessments, client management, analytics",
        },
      },
      enterprise: {
        priceId: "price_1Oabcdef1234567892", // Replace with actual test price ID
        quantity: 1,
        metadata: {
          tier: "enterprise",
          features: "Full API access, custom integrations, priority support",
        },
      },
    };

    const config = tierConfigs[tier];
    if (!config) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    try {
      // For development, simulate checkout session creation
      if (this.testMode) {
        return this.simulateCheckoutSession(tier, customerEmail, config);
      }

      // Production implementation would call your backend
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: config.priceId,
          customerEmail: customerEmail,
          metadata: config.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      return await response.json();
    } catch (error) {
      if (isDev) console.error("Error creating checkout session:", error);
      throw error;
    }
  }

  /**
   * Simulate checkout session for testing
   */
  simulateCheckoutSession(tier, customerEmail, config) {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        resolve({
          success: true,
          sessionId: `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tier: tier,
          email: customerEmail,
          metadata: config.metadata,
          testMode: true,
        });
      }, 1000);
    });
  }

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(sessionId) {
    if (!this.isInitialized) {
      throw new Error("Payment service not initialized");
    }

    try {
      if (this.testMode) {
        // Simulate successful checkout in test mode
        return this.simulateSuccessfulCheckout(sessionId);
      }

      const result = await this.stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      if (isDev) console.error("Error redirecting to checkout:", error);
      throw error;
    }
  }

  /**
   * Simulate successful checkout for testing
   */
  simulateSuccessfulCheckout(sessionId) {
    return new Promise((resolve) => {
      // Show loading state
      this.showPaymentProcessing();

      setTimeout(() => {
        this.hidePaymentProcessing();
        this.showPaymentSuccess({
          sessionId: sessionId,
          tier: "professional", // Default for demo
          message: "Payment successful! This is a test transaction.",
        });
        resolve();
      }, 2000);
    });
  }

  /**
   * Start payment flow
   */
  async startPayment(tier) {
    try {
      // Show email input modal
      const email = await this.showEmailModal();
      if (!email) {
        return; // User cancelled
      }

      if (!this.isValidEmail(email)) {
        this.showError("Please enter a valid email address");
        return;
      }

      // Create checkout session
      this.showLoading("Creating payment session...");
      const session = await this.createCheckoutSession(tier, email);

      if (session.success) {
        // Redirect to checkout
        await this.redirectToCheckout(session.sessionId);
      } else {
        throw new Error("Failed to create payment session");
      }
    } catch (error) {
      if (isDev) console.error("Payment error:", error);
      this.showError("Payment processing failed. Please try again.");
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Show email input modal
   */
  showEmailModal() {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
      modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 class="text-lg font-semibold mb-4">Enter Your Email</h3>
                    <p class="text-gray-600 mb-4">We'll use this to send your receipt and account details.</p>
                    <label for="payment-email" class="sr-only">Email for receipt and account details</label>
                    <input type="email" id="payment-email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your@email.com">
                    <div class="flex gap-3 mt-4">
                        <button id="payment-cancel" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button id="payment-confirm" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Continue</button>
                    </div>
                </div>
            `;

      document.body.appendChild(modal);

      const emailInput = modal.querySelector("#payment-email");
      const cancelBtn = modal.querySelector("#payment-cancel");
      const confirmBtn = modal.querySelector("#payment-confirm");

      emailInput.focus();

      const closeModal = (email = null) => {
        document.body.removeChild(modal);
        resolve(email);
      };

      cancelBtn.addEventListener("click", () => closeModal(null));
      confirmBtn.addEventListener("click", () => closeModal(emailInput.value));

      emailInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") closeModal(emailInput.value);
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(null);
      });
    });
  }

  /**
   * Show loading state
   */
  showLoading(message = "Processing...") {
    this.hideLoading(); // Remove any existing loading

    const loading = document.createElement("div");
    loading.id = "payment-loading";
    loading.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    loading.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p class="text-gray-700">${message}</p>
            </div>
        `;

    document.body.appendChild(loading);
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const loading = document.getElementById("payment-loading");
    if (loading) {
      document.body.removeChild(loading);
    }
  }

  /**
   * Show payment processing
   */
  showPaymentProcessing() {
    this.showLoading("Processing payment...");
  }

  /**
   * Hide payment processing
   */
  hidePaymentProcessing() {
    this.hideLoading();
  }

  /**
   * Show success message
   */
  showPaymentSuccess(data) {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2">Payment Successful!</h3>
                <p class="text-gray-600 mb-4">${data.message}</p>
                <div class="text-sm text-gray-500 mb-4">
                    <p>Session ID: ${data.sessionId}</p>
                    <p>Tier: ${data.tier}</p>
                </div>
                <button id="payment-success-close" class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Got it</button>
            </div>
        `;

    document.body.appendChild(modal);

    modal
      .querySelector("#payment-success-close")
      .addEventListener("click", () => {
        document.body.removeChild(modal);
      });

    // Test webhook notification
    this.testWebhookNotification(data);
  }

  /**
   * Show error message
   */
  showError(message) {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2">Payment Failed</h3>
                <p class="text-gray-600 mb-4">${message}</p>
                <button id="payment-error-close" class="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Close</button>
            </div>
        `;

    document.body.appendChild(modal);

    modal
      .querySelector("#payment-error-close")
      .addEventListener("click", () => {
        document.body.removeChild(modal);
      });
  }

  /**
   * Test webhook notification
   */
  async testWebhookNotification(paymentData) {
    if (!this.testMode) return;

    try {
      // Simulate webhook payload
      const webhookPayload = {
        event: "checkout.session.completed",
        data: {
          object: {
            id: paymentData.sessionId,
            customer_email: paymentData.email,
            metadata: paymentData.metadata,
            payment_status: "paid",
            amount_total: 2999, // Example amount in cents
            currency: "usd",
          },
        },
        timestamp: new Date().toISOString(),
      };

      // Log webhook payload for testing
      if (isDev) console.log("Webhook payload (for testing):", webhookPayload);

      // In a real implementation, you would send this to your webhook endpoint
      // For testing, you can use webhook.site to capture the payload
      if (
        this.webhookUrl &&
        this.webhookUrl !== "https://webhook.site/your-webhook-url"
      ) {
        await fetch(this.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });
      }
    } catch (error) {
      if (isDev) console.error("Webhook test failed:", error);
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Set webhook URL for testing
   */
  setWebhookUrl(url) {
    this.webhookUrl = url;
    if (isDev) console.log("Webhook URL set to:", url);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(sessionId) {
    // In production, this would call your backend API
    // For testing, return simulated status
    return {
      status: "completed",
      paid: true,
      tier: "professional",
    };
  }
}

// Create global payment service instance
window.paymentService = new PaymentService();

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.paymentService.initialize();
});

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = PaymentService;
}
