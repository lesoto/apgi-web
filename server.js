/**
 * APGI Backend Server
 * Express.js server for handling email capture, payments, and consultations
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.stripe.com"],
      },
    },
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});

app.use(limiter);

// API-specific rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 API requests per windowMs
  message: {
    error: "Too many API requests from this IP, please try again later.",
  },
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://apgi-framework.com",
      "https://www.apgi-framework.com",
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static("."));

// Store consultations in memory (replace with database in production)
const consultations = [];

// Store users in memory (replace with database in production)
const users = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access token required",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: "Invalid or expired token",
      });
    }
    req.user = user;
    next();
  });
};

// Simple API key authentication for admin endpoints
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const validApiKey = process.env.ADMIN_API_KEY || "dev-api-key-12345";

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      error: "Invalid or missing API key",
    });
  }

  next();
};

// Request logging middleware
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`,
  );
  next();
});

/**
 * Authentication Endpoints
 */

/**
 * User Registration
 */
app.post("/api/auth/register", apiLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = "user" } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "All required fields must be provided",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    // Check if user already exists
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * User Login
 */
app.post("/api/auth/login", apiLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find user
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Get User Profile
 */
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const user = users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Update User Profile
 */
app.put(
  "/api/auth/profile",
  authenticateToken,
  apiLimiter,
  async (req, res) => {
    try {
      const { firstName, lastName } = req.body;
      const userIndex = users.findIndex((u) => u.id === req.user.id);

      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Update user data
      if (firstName) users[userIndex].firstName = firstName;
      if (lastName) users[userIndex].lastName = lastName;
      users[userIndex].updatedAt = new Date().toISOString();

      // Remove password from response
      const { password: _, ...userWithoutPassword } = users[userIndex];

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
);

/**
 * Change Password
 */
app.post(
  "/api/auth/change-password",
  authenticateToken,
  apiLimiter,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: "Current password and new password are required",
        });
      }

      const user = users.find((u) => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Current password is incorrect",
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedNewPassword;
      user.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
);

/**
 * Logout
 */
app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  try {
    // In a real implementation, you would invalidate the token on the server side
    // For now, we'll just return success (client will handle token removal)
    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Refresh Token
 */
app.post("/api/auth/refresh", authenticateToken, async (req, res) => {
  try {
    // Generate new token
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Email Subscription Endpoint
 */
app.post("/api/subscribe", apiLimiter, async (req, res) => {
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
app.post("/api/create-checkout-session", apiLimiter, async (req, res) => {
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
app.post("/api/consultations", apiLimiter, async (req, res) => {
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
app.get("/api/consultations", authenticateApiKey, (req, res) => {
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
