/**
 * Webhook Testing Utility for APGI Payment System
 * Helps test and debug Stripe webhook events
 */

class WebhookTester {
  constructor() {
    this.webhookUrl =
      window.envConfig?.get("webhook.url") ||
      "https://webhook.site/your-webhook-url";
    this.testEvents = [];
    this.isListening = false;
  }

  /**
   * Initialize webhook tester
   */
  async initialize() {
    console.log("Webhook tester initialized");
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for payment service
   */
  setupEventListeners() {
    // Listen for payment events
    document.addEventListener("paymentCompleted", (event) => {
      this.handlePaymentEvent("payment.completed", event.detail);
    });

    document.addEventListener("paymentFailed", (event) => {
      this.handlePaymentEvent("payment.failed", event.detail);
    });

    document.addEventListener("subscriptionCreated", (event) => {
      this.handlePaymentEvent("subscription.created", event.detail);
    });
  }

  /**
   * Handle payment events and send to webhook
   */
  async handlePaymentEvent(eventType, data) {
    const webhookPayload = {
      event: eventType,
      data: data,
      timestamp: new Date().toISOString(),
      id: this.generateEventId(),
    };

    this.testEvents.push(webhookPayload);

    console.log(`Webhook Event: ${eventType}`, webhookPayload);

    // Send to webhook URL if configured
    if (
      this.webhookUrl &&
      this.webhookUrl !== "https://webhook.site/your-webhook-url"
    ) {
      await this.sendWebhook(webhookPayload);
    }

    // Show in testing UI
    this.displayEvent(webhookPayload);
  }

  /**
   * Send webhook to configured URL
   */
  async sendWebhook(payload) {
    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-APGI-Event": payload.event,
          "X-APGI-Signature": this.generateSignature(payload),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("Webhook sent successfully to:", this.webhookUrl);
      } else {
        console.error("Failed to send webhook:", response.statusText);
      }
    } catch (error) {
      console.error("Webhook sending error:", error);
    }
  }

  /**
   * Generate signature for webhook (simplified)
   */
  generateSignature(payload) {
    // In production, use HMAC with your webhook secret
    const payloadString = JSON.stringify(payload);
    return btoa(payloadString).slice(0, 32);
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Display event in testing UI
   */
  displayEvent(event) {
    const eventList = document.getElementById("webhook-events");
    if (!eventList) return;

    const eventItem = document.createElement("div");
    eventItem.className = "webhook-event mb-4 p-4 border rounded-lg";
    eventItem.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <span class="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">${event.event}</span>
                <span class="text-xs text-gray-500">${new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
            <details class="text-sm">
                <summary class="cursor-pointer font-medium mb-1">View Payload</summary>
                <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">${JSON.stringify(event, null, 2)}</pre>
            </details>
        `;

    eventList.insertBefore(eventItem, eventList.firstChild);

    // Keep only last 10 events
    while (eventList.children.length > 10) {
      eventList.removeChild(eventList.lastChild);
    }
  }

  /**
   * Set webhook URL for testing
   */
  setWebhookUrl(url) {
    this.webhookUrl = url;
    console.log("Webhook URL updated to:", url);

    // Update display
    const urlDisplay = document.getElementById("webhook-url-display");
    if (urlDisplay) {
      urlDisplay.textContent = url;
    }
  }

  /**
   * Create webhook testing UI
   */
  createTestingUI() {
    const ui = document.createElement("div");
    ui.id = "webhook-tester";
    ui.className =
      "fixed bottom-4 right-4 w-96 bg-white border rounded-lg shadow-lg z-50";
    ui.innerHTML = `
            <div class="bg-gray-800 text-white p-3 rounded-t-lg flex justify-between items-center">
                <h3 class="font-semibold">Webhook Tester</h3>
                <button id="toggle-webhook-tester" class="text-gray-300 hover:text-white">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div id="webhook-tester-content" class="p-4">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Webhook URL:</label>
                    <div class="flex gap-2">
                        <input type="url" id="webhook-url-input" class="flex-1 px-2 py-1 border rounded text-sm" value="${this.webhookUrl}">
                        <button id="set-webhook-url" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">Set</button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Get a test URL from <a href="https://webhook.site" target="_blank" rel="noopener noreferrer" class="text-blue-500">webhook.site</a></p>
                </div>
                
                <div class="mb-4">
                    <h4 class="font-medium mb-2">Recent Events:</h4>
                    <div id="webhook-events" class="max-h-64 overflow-y-auto">
                        <p class="text-gray-500 text-sm">No events yet. Complete a payment to see webhook events.</p>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button id="test-checkout-completed" class="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">Test Success</button>
                    <button id="test-checkout-failed" class="flex-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">Test Failure</button>
                    <button id="clear-events" class="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">Clear</button>
                </div>
            </div>
        `;

    document.body.appendChild(ui);

    // Setup event listeners for the UI
    this.setupUIListeners(ui);
  }

  /**
   * Setup UI event listeners
   */
  setupUIListeners(ui) {
    // Toggle visibility
    ui.querySelector("#toggle-webhook-tester").addEventListener("click", () => {
      const content = ui.querySelector("#webhook-tester-content");
      content.style.display =
        content.style.display === "none" ? "block" : "none";
    });

    // Set webhook URL
    ui.querySelector("#set-webhook-url").addEventListener("click", () => {
      const input = ui.querySelector("#webhook-url-input");
      this.setWebhookUrl(input.value);
    });

    // Test events
    ui.querySelector("#test-checkout-completed").addEventListener(
      "click",
      () => {
        this.simulateEvent("checkout.session.completed", {
          sessionId: `cs_test_${Date.now()}`,
          customer_email: "test@example.com",
          amount_total: 2999,
          currency: "usd",
          payment_status: "paid",
        });
      },
    );

    ui.querySelector("#test-checkout-failed").addEventListener("click", () => {
      this.simulateEvent("checkout.session.failed", {
        sessionId: `cs_test_${Date.now()}`,
        customer_email: "test@example.com",
        error: { message: "Payment failed" },
      });
    });

    // Clear events
    ui.querySelector("#clear-events").addEventListener("click", () => {
      const eventList = ui.querySelector("#webhook-events");
      eventList.innerHTML =
        '<p class="text-gray-500 text-sm">No events yet. Complete a payment to see webhook events.</p>';
      this.testEvents = [];
    });
  }

  /**
   * Simulate a webhook event
   */
  simulateEvent(eventType, data) {
    const event = {
      event: eventType,
      data: data,
      timestamp: new Date().toISOString(),
      id: this.generateEventId(),
    };

    this.testEvents.push(event);
    this.displayEvent(event);

    // Send to webhook if configured
    if (
      this.webhookUrl &&
      this.webhookUrl !== "https://webhook.site/your-webhook-url"
    ) {
      this.sendWebhook(event);
    }
  }

  /**
   * Show webhook tester
   */
  show() {
    if (!document.getElementById("webhook-tester")) {
      this.createTestingUI();
    }
  }

  /**
   * Hide webhook tester
   */
  hide() {
    const tester = document.getElementById("webhook-tester");
    if (tester) {
      tester.remove();
    }
  }

  /**
   * Get test events
   */
  getTestEvents() {
    return this.testEvents;
  }

  /**
   * Export test events for debugging
   */
  exportEvents() {
    const dataStr = JSON.stringify(this.testEvents, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `webhook-events-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }
}

// Create global webhook tester instance
window.webhookTester = new WebhookTester();

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.webhookTester.initialize();

  // Show webhook tester in development
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    window.webhookTester.show();
  }
});

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = WebhookTester;
}
