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
const sqlite3 = require("sqlite3").verbose();

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET", "ADMIN_API_KEY", "STRIPE_SECRET_KEY"];
const missingVars = requiredEnvVars.filter(
  (varName) =>
    !process.env[varName] ||
    process.env[varName].includes("your-") ||
    process.env[varName].includes("change-this-in-production") ||
    process.env[varName].includes("placeholder"),
);

if (missingVars.length > 0) {
  console.error(
    "ERROR: Missing or placeholder environment variables:",
    missingVars.join(", "),
  );
  console.error(
    "Please set proper values in your .env file before starting the server.",
  );
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware with CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.tailwindcss.com",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
          "https://cdnjs.cloudflare.com",
          "https://js.stripe.com",
          "https://www.googletagmanager.com",
        ],
        imgSrc: ["'self'", "data:", "https:", "https://*.stripe.com"],
        connectSrc: [
          "'self'",
          "https://api.stripe.com",
          "https://www.google-analytics.com",
        ],
        frameSrc: ["'self'", "https://js.stripe.com"],
      },
    },
  }),
);
const db = new sqlite3.Database("./apgi.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Consultations table
  db.run(`CREATE TABLE IF NOT EXISTS consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    preferredDate TEXT,
    preferredTime TEXT,
    consultationType TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Progress table
  db.run(`CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    assessmentId TEXT NOT NULL,
    progressData TEXT,
    completedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

  // Quiz results table
  db.run(`CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    quizId TEXT NOT NULL,
    answers TEXT NOT NULL,
    score INTEGER,
    completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);
}

// Security: JWT_SECRET must be set in production environments
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "your-secret-key-change-in-production") {
  console.warn(
    "WARNING: Using default JWT_SECRET. Set a strong JWT_SECRET in environment variables for production!",
  );
}

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.tailwindcss.com",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
          "https://cdnjs.cloudflare.com",
          "https://js.stripe.com",
          "https://www.googletagmanager.com",
        ],
        imgSrc: ["'self'", "data:", "https:", "https://*.stripe.com"],
        connectSrc: [
          "'self'",
          "https://api.stripe.com",
          "https://www.google-analytics.com",
        ],
        frameSrc: ["'self'", "https://js.stripe.com"],
      },
    },
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});

app.use(limiter);

// API-specific rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 API requests per windowMs
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

// Serve favicon
app.get("/favicon.ico", (req, res) => {
  res.sendFile("favicon.svg", { root: "." });
});

// Store consultations in memory (replace with database in production)
const consultations = [];

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
  const validApiKey = process.env.ADMIN_API_KEY;

  if (
    !validApiKey ||
    validApiKey === "your-secure-admin-api-key-change-this-in-production"
  ) {
    console.warn(
      "WARNING: Using default ADMIN_API_KEY. Set a strong ADMIN_API_KEY in environment variables for production!",
    );
  }

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

    // Sanitize and validate input
    const sanitizedFirstName = firstName.trim().replace(/[<>]/g, "");
    const sanitizedLastName = lastName.trim().replace(/[<>]/g, "");
    const sanitizedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    // Check if user already exists
    db.get(
      "SELECT * FROM users WHERE email = ?",
      [sanitizedEmail],
      (err, existingUser) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            error: "Internal server error",
          });
        }

        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: "User with this email already exists",
          });
        }

        // Hash password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            console.error("Password hashing error:", err);
            return res.status(500).json({
              success: false,
              error: "Internal server error",
            });
          }

          // Create new user
          const stmt = db.prepare(`
          INSERT INTO users (firstName, lastName, email, password, role)
          VALUES (?, ?, ?, ?, ?)
        `);

          stmt.run(
            [
              sanitizedFirstName,
              sanitizedLastName,
              sanitizedEmail,
              hashedPassword,
              role.trim().replace(/[<>]/g, ""),
            ],
            function (err) {
              if (err) {
                console.error("Database insertion error:", err);
                return res.status(500).json({
                  success: false,
                  error: "Internal server error",
                });
              }

              // Get the created user
              db.get(
                "SELECT id, firstName, lastName, email, role, createdAt, updatedAt FROM users WHERE id = ?",
                [this.lastID],
                (err, newUser) => {
                  if (err) {
                    console.error("Database retrieval error:", err);
                    return res.status(500).json({
                      success: false,
                      error: "Internal server error",
                    });
                  }

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

                  res.status(201).json({
                    success: true,
                    message: "User registered successfully",
                    user: newUser,
                    token,
                  });
                },
              );
            },
          );

          stmt.finalize();
        });
      },
    );
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

    // Sanitize input
    const sanitizedEmail = email.trim().toLowerCase();

    if (!sanitizedEmail || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find user
    db.get(
      "SELECT * FROM users WHERE email = ?",
      [sanitizedEmail],
      (err, user) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            error: "Internal server error",
          });
        }

        if (!user) {
          return res.status(401).json({
            success: false,
            error: "Invalid email or password",
          });
        }

        // Verify password
        bcrypt.compare(password, user.password, (err, isValidPassword) => {
          if (err) {
            console.error("Password comparison error:", err);
            return res.status(500).json({
              success: false,
              error: "Internal server error",
            });
          }

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
        });
      },
    );
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
    db.get(
      "SELECT id, firstName, lastName, email, role, createdAt, updatedAt FROM users WHERE id = ?",
      [req.user.id],
      (err, user) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            error: "Internal server error",
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            error: "User not found",
          });
        }

        res.json({
          success: true,
          user: user,
        });
      },
    );
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

      db.get(
        "SELECT id FROM users WHERE id = ?",
        [req.user.id],
        (err, user) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
              success: false,
              error: "Internal server error",
            });
          }

          if (!user) {
            return res.status(404).json({
              success: false,
              error: "User not found",
            });
          }

          // Update user data
          const updates = [];
          const values = [];

          if (firstName) {
            updates.push("firstName = ?");
            values.push(firstName);
          }
          if (lastName) {
            updates.push("lastName = ?");
            values.push(lastName);
          }

          updates.push("updatedAt = datetime('now')");
          values.push(req.user.id);

          const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

          db.run(sql, values, function (err) {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({
                success: false,
                error: "Internal server error",
              });
            }

            // Get updated user data
            db.get(
              "SELECT id, firstName, lastName, email, role, createdAt, updatedAt FROM users WHERE id = ?",
              [req.user.id],
              (err, updatedUser) => {
                if (err) {
                  console.error("Database error:", err);
                  return res.status(500).json({
                    success: false,
                    error: "Internal server error",
                  });
                }

                res.json({
                  success: true,
                  user: updatedUser,
                });
              },
            );
          });
        },
      );
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

      db.get(
        "SELECT password FROM users WHERE id = ?",
        [req.user.id],
        async (err, user) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
              success: false,
              error: "Internal server error",
            });
          }

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

          // Update password in database
          db.run(
            "UPDATE users SET password = ?, updatedAt = datetime('now') WHERE id = ?",
            [hashedNewPassword, req.user.id],
            (err) => {
              if (err) {
                console.error("Database error:", err);
                return res.status(500).json({
                  success: false,
                  error: "Internal server error",
                });
              }

              res.json({
                success: true,
                message: "Password changed successfully",
              });
            },
          );
        },
      );
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

    // Sanitize input
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedListType = listType.trim().replace(/[<>]/g, "");

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    // EMAIL PROVIDER INTEGRATION REQUIRED
    // ====================================
    // The code below only stores emails in memory.
    // To integrate with real email providers, uncomment and configure one of the following:

    /*
    // Mailchimp Integration Example:
    const mailchimp = require('@mailchimp/mailchimp_marketing');
    mailchimp.setConfig({
      apiKey: process.env.VITE_MAILCHIMP_API_KEY,
      server: process.env.VITE_MAILCHIMP_SERVER_PREFIX
    });
    
    const listId = process.env[`VITE_MAILCHIMP_${sanitizedListType.toUpperCase()}_LIST_ID`];
    await mailchimp.lists.addListMember(listId, {
      email_address: sanitizedEmail,
      status: 'subscribed'
    });
    */

    /*
    // ConvertKit Integration Example:
    const convertkit = require('convertkit-api');
    const ck = new convertkit(process.env.VITE_CONVERTKIT_API_KEY);
    const formId = process.env[`VITE_CONVERTKIT_${sanitizedListType.toUpperCase()}_FORM_ID`];
    await ck.subscribers.subscribe({ form_id: formId, email: sanitizedEmail });
    */

    // TEMPORARY: Store in memory only (no emails sent)
    console.log(
      `Email subscription: ${sanitizedEmail} -> ${sanitizedListType}`,
      additionalData,
    );

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

    // Sanitize input
    const sanitizedCustomerEmail = customerEmail.trim().toLowerCase();
    const sanitizedTier = tier.trim().replace(/[<>]/g, "");

    if (!sanitizedTier || !sanitizedCustomerEmail) {
      return res.status(400).json({
        success: false,
        error: "Tier and customer email are required",
      });
    }

    // Price mapping (you'd get these from your Stripe dashboard)
    const prices = {
      professional: "price_1Oxyz1234567890", // Replace with actual price ID
      enterprise: "price_1Oxyz1234567891", // Replace with actual price ID
      individual: "price_1Oxyz1234567892", // Replace with actual price ID
    };

    const actualPriceId = priceId || prices[tier];
    if (!actualPriceId) {
      return res.status(400).json({
        success: false,
        error: "Invalid tier specified",
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: sanitizedCustomerEmail,
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
        tier: sanitizedTier,
        customer_email: sanitizedCustomerEmail,
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

    // Sanitize input
    const sanitizedFirstName = firstName.trim().replace(/[<>]/g, "");
    const sanitizedLastName = lastName.trim().replace(/[<>]/g, "");
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedRole = role.trim().replace(/[<>]/g, "");
    const sanitizedNeeds = needs ? needs.trim().replace(/[<>]/g, "") : "";
    const sanitizedPhone = phone
      ? phone.trim().replace(/[^0-9+\-\s]/g, "")
      : "";

    if (
      !sanitizedFirstName ||
      !sanitizedLastName ||
      !sanitizedEmail ||
      !sanitizedRole
    ) {
      return res.status(400).json({
        success: false,
        error: "Required fields are missing",
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    const consultation = {
      id: Date.now().toString(),
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      email: sanitizedEmail,
      role: sanitizedRole,
      needs: sanitizedNeeds,
      phone: sanitizedPhone,
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
 * Progress Tracking Endpoints
 */

// Store progress in memory (TODO: migrate to database)
const progressData = new Map();

/**
 * Save assessment progress
 */
app.post("/api/progress", authenticateToken, async (req, res) => {
  try {
    const progress = req.body;

    // Validate required fields
    if (!progress.id || !progress.type) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: id and type",
      });
    }

    // Store progress
    progressData.set(progress.id, {
      ...progress,
      lastUpdated: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Progress saved successfully",
    });
  } catch (error) {
    console.error("Progress save error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Get assessment progress
 */
app.get("/api/progress/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const progress = progressData.get(id);

  if (progress) {
    res.json({
      success: true,
      progress,
    });
  } else {
    res.status(404).json({
      success: false,
      error: "Progress not found",
    });
  }
});

/**
 * Get user assessments
 */
app.get("/api/assessments", authenticateToken, (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "userId is required",
    });
  }

  // Filter assessments by userId
  const userAssessments = Array.from(progressData.values())
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

  res.json({
    success: true,
    assessments: userAssessments,
  });
});

/**
 * Store quiz results
 */
app.post("/api/quiz-results", authenticateToken, async (req, res) => {
  try {
    const quizResult = req.body;

    // Validate required fields
    if (!quizResult.userId || !quizResult.quizId || !quizResult.answers) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, quizId, answers",
      });
    }

    // Store quiz result with timestamp
    const resultId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    progressData.set(resultId, {
      ...quizResult,
      id: resultId,
      type: "quiz-result",
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Quiz results saved successfully",
      resultId,
    });
  } catch (error) {
    console.error("Quiz results save error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
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
 * 404 Error Handler
 */
app.use((req, res, next) => {
  res.status(404).sendFile("404.html", { root: "." });
});

/**
 * Success Page
 */
app.get("/success", (req, res) => {
  const { session_id } = req.query;

  // Here you would verify the session with Stripe
  // and show appropriate success message

  // For now, just serve the success page with the session_id parameter
  if (session_id) {
    return res.sendFile("Payment-Success.html", { root: "." });
  }

  // If no session_id, redirect to home or show error
  res.redirect("/");
});

// Frontend configuration endpoint
app.get("/config.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");

  // Sanitize environment variables for frontend consumption
  const frontendConfig = {
    // API Configuration
    VITE_API_BASE_URL: process.env.API_BASE_URL || "http://localhost:3001/api",
    VITE_API_TIMEOUT: process.env.API_TIMEOUT || "10000",

    // Stripe Configuration (public only)
    VITE_STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || "",
    VITE_STRIPE_PROFESSIONAL_PRICE_ID:
      process.env.STRIPE_PROFESSIONAL_PRICE_ID || "",
    VITE_STRIPE_ENTERPRISE_PRICE_ID:
      process.env.STRIPE_ENTERPRISE_PRICE_ID || "",

    // Email Service Configuration (public only)
    VITE_EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "local",
    VITE_MAILCHIMP_SERVER_PREFIX: process.env.MAILCHIMP_SERVER_PREFIX || "",
    VITE_MAILCHIMP_SNAPSHOT_LIST_ID:
      process.env.MAILCHIMP_SNAPSHOT_LIST_ID || "",
    VITE_MAILCHIMP_NEWSLETTER_LIST_ID:
      process.env.MAILCHIMP_NEWSLETTER_LIST_ID || "",
    VITE_MAILCHIMP_CONSULTATIONS_LIST_ID:
      process.env.MAILCHIMP_CONSULTATIONS_LIST_ID || "",
    VITE_CONVERTKIT_SNAPSHOT_FORM_ID:
      process.env.CONVERTKIT_SNAPSHOT_FORM_ID || "",
    VITE_CONVERTKIT_PROFESSIONAL_FORM_ID:
      process.env.CONVERTKIT_PROFESSIONAL_FORM_ID || "",

    // Analytics Configuration (public only)
    VITE_ANALYTICS_PROVIDER: process.env.ANALYTICS_PROVIDER || "local",
    VITE_GA_TRACKING_ID: process.env.GA_TRACKING_ID || "",
    VITE_PLAUSIBLE_DOMAIN: process.env.PLAUSIBLE_DOMAIN || "",

    // Feature Flags
    VITE_ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS || "false",
    VITE_ENABLE_EMAIL_CAPTURE: process.env.ENABLE_EMAIL_CAPTURE || "true",
    VITE_ENABLE_PAYMENTS: process.env.ENABLE_PAYMENTS || "true",
    VITE_DEBUG_MODE: process.env.DEBUG_MODE || "false",

    // Application Configuration
    VITE_NODE_ENV: process.env.NODE_ENV || "development",
    VITE_LOG_LEVEL: process.env.LOG_LEVEL || "info",
  };

  // Generate JavaScript code with sanitized config
  const configJS = `window.env = ${JSON.stringify(frontendConfig)};`;

  res.send(configJS);
});

// Start server
app.listen(PORT, () => {
  console.log(`APGI Backend Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
