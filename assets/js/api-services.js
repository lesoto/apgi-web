/**
 * APGI Backend API Services
 * Handles email capture, payment processing, and consultation requests
 */

// Import environment configuration
// Note: This should be loaded before this script
if (typeof window.envConfig === "undefined") {
  console.error(
    "Environment configuration not loaded. Please include environment-config.js before api-services.js",
  );
}

// Email service configurations
const EMAIL_CONFIG = {
  mailchimp: {
    apiKey: window.envConfig?.get("email.mailchimp.apiKey"),
    serverPrefix: window.envConfig?.get("email.mailchimp.serverPrefix"),
    lists: {
      snapshot: window.envConfig?.get("email.mailchimp.lists.snapshot"),
      newsletter: window.envConfig?.get("email.mailchimp.lists.newsletter"),
      consultations: window.envConfig?.get(
        "email.mailchimp.lists.consultations",
      ),
    },
  },
  convertKit: {
    apiKey: window.envConfig?.get("email.convertKit.apiKey"),
    forms: {
      snapshot: window.envConfig?.get("email.convertKit.forms.snapshot"),
      professional: window.envConfig?.get(
        "email.convertKit.forms.professional",
      ),
    },
  },
};

// Stripe configuration
const STRIPE_CONFIG = {
  publishableKey: window.envConfig?.get("stripe.publishableKey"),
  prices: {
    professional: window.envConfig?.get("stripe.prices.professional"),
    enterprise: window.envConfig?.get("stripe.prices.enterprise"),
  },
};

/**
 * Email Service Integration
 */
class EmailService {
  static async subscribeToList(email, listType, additionalData = {}) {
    try {
      // Try Mailchimp first, fallback to ConvertKit
      if (EMAIL_CONFIG.mailchimp.apiKey) {
        return await this.subscribeMailchimp(email, listType, additionalData);
      } else if (EMAIL_CONFIG.convertKit.apiKey) {
        return await this.subscribeConvertKit(email, listType, additionalData);
      } else {
        // Fallback to local storage for development
        return await this.storeLocally(email, listType, additionalData);
      }
    } catch (error) {
      console.error("Email service error:", error);
      throw new Error("Failed to subscribe to email list");
    }
  }

  static async subscribeMailchimp(email, listType, additionalData) {
    const listId = EMAIL_CONFIG.mailchimp.lists[listType];
    const url = `https://${EMAIL_CONFIG.mailchimp.serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`;

    const data = {
      email_address: email,
      status: "pending",
      merge_fields: {
        FNAME: additionalData.firstName || "",
        LNAME: additionalData.lastName || "",
        ROLE: additionalData.role || "",
        NEEDS: additionalData.needs || "",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `apikey ${EMAIL_CONFIG.mailchimp.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Mailchimp subscription failed");
    }

    return { success: true, service: "mailchimp" };
  }

  static async subscribeConvertKit(email, listType, additionalData) {
    const formId = EMAIL_CONFIG.convertKit.forms[listType];
    const url = `https://api.convertkit.com/v3/forms/${formId}/subscribe`;

    const data = {
      email: email,
      first_name: additionalData.firstName || "",
      fields: {
        role: additionalData.role || "",
        needs: additionalData.needs || "",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EMAIL_CONFIG.convertKit.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("ConvertKit subscription failed");
    }

    return { success: true, service: "convertkit" };
  }

  static async storeLocally(email, listType, additionalData) {
    // Development fallback - store in localStorage
    const subscriptions = JSON.parse(
      localStorage.getItem("apgi_subscriptions") || "[]",
    );
    subscriptions.push({
      email,
      listType,
      additionalData,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("apgi_subscriptions", JSON.stringify(subscriptions));

    return { success: true, service: "local" };
  }
}

/**
 * Payment Processing Service
 */
class PaymentService {
  static async createCheckoutSession(tier, customerEmail) {
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier: tier,
          customerEmail: customerEmail,
          priceId: STRIPE_CONFIG.prices[tier],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const session = await response.json();
      return session;
    } catch (error) {
      console.error("Payment service error:", error);
      throw new Error("Payment processing failed");
    }
  }

  static async handleStripeCheckout(tier, customerEmail) {
    if (!window.Stripe) {
      throw new Error("Stripe.js not loaded");
    }

    const stripe = Stripe(STRIPE_CONFIG.publishableKey);

    try {
      const session = await this.createCheckoutSession(tier, customerEmail);

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      throw error;
    }
  }
}

/**
 * Consultation Booking Service
 */
class ConsultationService {
  static async submitConsultationRequest(consultationData) {
    try {
      // Store consultation request
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...consultationData,
          timestamp: new Date().toISOString(),
          status: "pending",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit consultation request");
      }

      // Also add to email list for follow-up
      await EmailService.subscribeToList(
        consultationData.email,
        "consultations",
        {
          firstName: consultationData.firstName,
          lastName: consultationData.lastName,
          role: consultationData.role,
          needs: consultationData.needs,
        },
      );

      return { success: true };
    } catch (error) {
      console.error("Consultation service error:", error);
      throw new Error("Failed to submit consultation request");
    }
  }
}

/**
 * Analytics and Conversion Tracking
 */
class AnalyticsService {
  static trackConversion(event, data = {}) {
    // Google Analytics 4
    if (typeof gtag !== "undefined") {
      gtag("event", event, {
        event_category: "conversion",
        event_label: data.email || "unknown",
        value: data.value || 0,
        currency: data.currency || "USD",
      });
    }

    // Facebook Pixel
    if (typeof fbq !== "undefined") {
      fbq("track", "Lead", {
        email: data.email,
        value: data.value || 0,
        currency: data.currency || "USD",
      });
    }

    // Mixpanel (if available)
    if (typeof mixpanel !== "undefined") {
      mixpanel.track(event, {
        email: data.email,
        tier: data.tier,
        timestamp: new Date().toISOString(),
      });
    }

    // Custom analytics
    console.log("Conversion tracked:", event, data);
  }

  static trackPageView(page) {
    if (typeof gtag !== "undefined") {
      gtag("config", "GA_MEASUREMENT_ID", {
        page_path: page,
      });
    }
  }
}

// Export for use in frontend
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    EmailService,
    PaymentService,
    ConsultationService,
    AnalyticsService,
  };
}
