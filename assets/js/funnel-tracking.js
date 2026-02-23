/**
 * Funnel Conversion Tracking
 * Shared conversion tracking functionality for marketing funnel pages
 */

class FunnelTracker {
  constructor(funnelName) {
    this.funnelName = funnelName;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupTracking());
    } else {
      this.setupTracking();
    }
  }

  setupTracking() {
    this.trackCTAClicks();
    this.trackPricingViews();
    this.trackFormSubmissions();
    this.trackPageEngagement();
  }

  trackConversion(event, email = "unknown", data = {}) {
    const eventData = {
      event: event,
      email: email,
      funnel: this.funnelName,
      timestamp: new Date().toISOString(),
      ...data,
    };

    // Send to Google Analytics if available
    if (window.gtag) {
      gtag("event", "conversion", {
        event_category: "funnel",
        event_label: event,
        value: email,
        custom_parameter: JSON.stringify(eventData),
      });
    }

    // Send to custom analytics if available
    if (window.analytics) {
      window.analytics.track("conversion", eventData);
    }

    // Send to Plausible Analytics if available
    if (window.plausible) {
      window.plausible("conversion", { props: eventData });
    }

    console.log(
      `Conversion tracked: ${event}, Funnel: ${this.funnelName}`,
      eventData,
    );
  }

  trackCTAClicks() {
    const ctaButtons = document.querySelectorAll(
      'a[href="#signup"], .cta-button, .btn-primary, .btn',
    );
    ctaButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const buttonText = button.textContent.trim();
        this.trackConversion("cta_click", "unknown", {
          button_text: buttonText,
          button_href: button.href,
        });
      });
    });
  }

  trackPricingViews() {
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.trackConversion("pricing_view", "unknown");
              observer.disconnect();
            }
          });
        },
        { threshold: 0.5 },
      );
      observer.observe(pricingSection);
    }
  }

  trackFormSubmissions() {
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        const email =
          form.querySelector('input[type="email"]')?.value || "unknown";
        this.trackConversion("form_submit", email, {
          form_id: form.id || "unknown",
          form_action: form.action || "unknown",
        });
      });
    });
  }

  trackPageEngagement() {
    // Track time on page
    let startTime = Date.now();
    let engaged = true;

    // Track engagement
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const resetEngagement = () => {
      engaged = true;
    };

    events.forEach((event) => {
      document.addEventListener(event, resetEngagement, true);
    });

    // Track page leave
    window.addEventListener("beforeunload", () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      if (timeOnPage > 30) {
        // Only track if engaged for more than 30 seconds
        this.trackConversion("page_engagement", "unknown", {
          time_on_page: timeOnPage,
          engaged: engaged,
        });
      }
    });
  }
}

// Auto-initialize funnel tracking
document.addEventListener("DOMContentLoaded", function () {
  // Get funnel name from page title or URL
  const funnelName = document.title.includes("|")
    ? document.title.split("|")[1].trim().toLowerCase().replace(/\s+/g, "_")
    : window.location.pathname.split("/").pop().replace(".html", "");

  // Initialize tracker
  window.funnelTracker = new FunnelTracker(funnelName);
});

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = FunnelTracker;
}
