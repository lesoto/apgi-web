/**
 * APGI Backend API Services
 * Handles email capture, payment processing, and consultation requests
 */

// Email service configurations
const EMAIL_CONFIG = {
  mailchimp: {
    apiKey: process.env.MAILCHIMP_API_KEY,
    serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX,
    lists: {
      snapshot: process.env.MAILCHIMP_SNAPSHOT_LIST_ID,
      newsletter: process.env.MAILCHIMP_NEWSLETTER_LIST_ID,
      consultations: process.env.MAILCHIMP_CONSULTATIONS_LIST_ID,
    },
  },
  convertKit: {
    apiKey: process.env.CONVERTKIT_API_KEY,
    forms: {
      snapshot: process.env.CONVERTKIT_SNAPSHOT_FORM_ID,
      professional: process.env.CONVERTKIT_PROFESSIONAL_FORM_ID,
    },
  },
};

// Stripe configuration
const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY,
  prices: {
    professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
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
