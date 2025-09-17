require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth");
const touristRoutes = require("./routes/tourist.routes");
const blockchainRoutes = require("./routes/blockchain.routes");
const hybridRoutes = require("./routes/hybrid.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED"
  }
});
app.use(limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  const healthStatus = {
    status: "operational",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    services: {
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      aadhaar: !!process.env.AADHAAR_LICENSE_KEY,
      digilocker: !!process.env.DIGILOCKER_CLIENT_ID,
      apiSetu: !!process.env.API_SETU_CLIENT_ID,
      supabase: !!process.env.SUPABASE_URL,
      blockchain: !!process.env.FABRIC_CHANNEL_NAME
    }
  };
  
  const allCriticalServices = healthStatus.services.database === "connected";
  res.status(allCriticalServices ? 200 : 503).json(healthStatus);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tourist", touristRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/hybrid", hybridRoutes);
app.use("/api/admin", adminRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    code: "INTERNAL_ERROR"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    code: "ROUTE_NOT_FOUND",
    path: req.originalUrl
  });
});

// Database connection with graceful fallback
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("✅ MongoDB Connected");
    } else {
      console.log("⚠️  MongoDB URI not configured - running in mock mode");
    }
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    console.log("⚠️  Continuing without database connection");
  }
};

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    
    // Log service status
    const services = {
      "Aadhaar API": !!process.env.AADHAAR_LICENSE_KEY,
      "DigiLocker": !!process.env.DIGILOCKER_CLIENT_ID,
      "API Setu": !!process.env.API_SETU_CLIENT_ID,
      "Supabase": !!process.env.SUPABASE_URL,
      "Blockchain": !!process.env.FABRIC_CHANNEL_NAME
    };
    
    console.log("\n📋 Service Configuration:");
    Object.entries(services).forEach(([service, configured]) => {
      console.log(`   ${configured ? "✅" : "⚠️ "} ${service}: ${configured ? "configured" : "not configured"}`);
    });
  });
};

startServer().catch(console.error);