/**
 * APGI Backend Server
 * Express.js server for handling email capture, payments, and consultations
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Store consultations in memory (replace with database in production)
const consultations = [];

/**
 * Email Subscription Endpoint
 */
app.post("/api/subscribe", async (req, res) => {
  try {
    const { email, listType, additionalData } = req.body;

    if (!email || !listType) {
      return res.status(400).json({
        success: false,
        error: "Email and list type are required",
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    // Here you would integrate with Mailchimp, ConvertKit, etc.
    // For now, we'll store in memory
    console.log(`Email subscription: ${email} -> ${listType}`, additionalData);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    res.json({
      success: true,
      message: "Successfully subscribed to email list",
      service: "local",
    });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Stripe Checkout Session Creation
 */
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { tier, customerEmail, priceId } = req.body;

    if (!tier || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: "Tier and customer email are required",
      });
    }

    // Price mapping (you'd get these from your Stripe dashboard)
    const prices = {
      professional: "price_1Oxyz1234567890", // Replace with actual price ID
      enterprise: "price_1Oxyz1234567891", // Replace with actual price ID
    };

    const actualPriceId = priceId || prices[tier];
    if (!actualPriceId) {
      return res.status(400).json({
        success: false,
        error: "Invalid tier specified",
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      billing_address_collection: "auto",
      line_items: [
        {
          price: actualPriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.protocol}://${req.get("host")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get("host")}/pricing?canceled=true`,
      metadata: {
        tier: tier,
        customer_email: customerEmail,
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create checkout session",
    });
  }
});

/**
 * Stripe Webhook Handler
 */
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.sendStatus(400);
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Payment successful:", session);

        // Here you would:
        // 1. Update user's subscription status in database
        // 2. Send welcome email
        // 3. Grant access to paid features
        // 4. Track conversion in analytics

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        console.log("Recurring payment successful:", invoice);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("Subscription canceled:", subscription);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  },
);

/**
 * Consultation Request Endpoint
 */
app.post("/api/consultations", async (req, res) => {
  try {
    const { firstName, lastName, email, role, needs, phone } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        success: false,
        error: "Required fields are missing",
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    const consultation = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      role,
      needs: needs || "",
      phone: phone || "",
      timestamp: new Date().toISOString(),
      status: "pending",
    };

    // Store consultation (in production, use database)
    consultations.push(consultation);

    console.log("New consultation request:", consultation);

    // Here you would:
    // 1. Send confirmation email to customer
    // 2. Send notification to sales team
    // 3. Add to CRM (HubSpot, Salesforce, etc.)
    // 4. Create calendar event for consultation

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    res.json({
      success: true,
      message: "Consultation request received successfully",
      consultationId: consultation.id,
    });
  } catch (error) {
    console.error("Consultation error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Get Consultations (for admin use)
 */
app.get("/api/consultations", (req, res) => {
  // In production, add authentication
  res.json({
    success: true,
    consultations: consultations.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    ),
  });
});

/**
 * Health Check Endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

/**
 * Serve Landing Page
 */
app.get("/", (req, res) => {
  res.sendFile("Landing.html", { root: "." });
});

/**
 * Success Page
 */
app.get("/success", (req, res) => {
  const { session_id } = req.query;

  // Here you would verify the session with Stripe
  // and show appropriate success message

  res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Successful - APGI</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .success { color: #28a745; font-size: 2em; margin-bottom: 20px; }
                .message { color: #666; margin-bottom: 30px; }
                .btn { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="success">✓ Payment Successful!</div>
            <div class="message">
                Thank you for joining APGI! Check your email for next steps.
            </div>
            <a href="/" class="btn">Return to Dashboard</a>
        </body>
        </html>
    `);
});

// Start server
app.listen(PORT, () => {
  console.log(`APGI Backend Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
