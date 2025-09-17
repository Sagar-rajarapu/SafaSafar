const express = require("express");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const { generateToken, generateRefreshToken } = require("../utils/jwt");

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: "Too many authentication attempts, please try again later.",
    code: "AUTH_RATE_LIMIT_EXCEEDED"
  }
});

// Tourist Registration
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
        code: "MISSING_FIELDS"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
        code: "WEAK_PASSWORD"
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists",
        code: "USER_EXISTS"
      });
    }

    // Create user
    const user = await User.create({ name, email, password, phone });
    
    // Generate tokens
    const token = generateToken({ 
      id: user._id, 
      email: user.email,
      verificationLevel: user.verificationLevel 
    });
    const refreshToken = generateRefreshToken({ id: user._id });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          verificationLevel: user.verificationLevel
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
        code: "VALIDATION_ERROR"
      });
    }

    res.status(500).json({
      success: false,
      error: "Registration failed",
      code: "REGISTRATION_ERROR"
    });
  }
});

// JWT Login
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
        code: "MISSING_CREDENTIALS"
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        error: "Account is temporarily locked due to too many failed login attempts",
        code: "ACCOUNT_LOCKED"
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const token = generateToken({ 
      id: user._id, 
      email: user.email,
      verificationLevel: user.verificationLevel 
    });
    const refreshToken = generateRefreshToken({ id: user._id });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          verificationLevel: user.verificationLevel,
          digitalId: user.digitalId
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
      code: "LOGIN_ERROR"
    });
  }
});

// Token refresh endpoint
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
        code: "MISSING_REFRESH_TOKEN"
      });
    }

    // Verify refresh token
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
        code: "INVALID_REFRESH_TOKEN"
      });
    }

    // Generate new tokens
    const newToken = generateToken({ 
      id: user._id, 
      email: user.email,
      verificationLevel: user.verificationLevel 
    });
    const newRefreshToken = generateRefreshToken({ id: user._id });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid refresh token",
      code: "INVALID_REFRESH_TOKEN"
    });
  }
});

// Aadhaar OTP verification with graceful fallback
router.post("/aadhaar/verify", async (req, res) => {
  try {
    const { aadhaarNumber, otp } = req.body;

    if (!aadhaarNumber || !otp) {
      return res.status(400).json({
        success: false,
        error: "Aadhaar number and OTP are required",
        code: "MISSING_FIELDS"
      });
    }

    // Check if Aadhaar API is configured
    if (!process.env.AADHAAR_LICENSE_KEY || !process.env.AADHAAR_API_BASE_URL) {
      // Mock verification for development
      const isValidOTP = otp === "123456" || otp === "000000"; // Mock valid OTPs
      
      return res.json({
        success: true,
        message: "Aadhaar verification completed (mock mode)",
        data: {
          verified: isValidOTP,
          aadhaarNumber: aadhaarNumber.replace(/(\d{4})\d{4}(\d{4})/, "$1****$2"),
          mode: "mock",
          timestamp: new Date().toISOString()
        }
      });
    }

    // Real API integration would go here
    // For now, return service unavailable
    res.status(503).json({
      success: false,
      error: "Aadhaar verification service is not fully configured",
      code: "SERVICE_NOT_CONFIGURED",
      message: "Please configure AADHAAR_LICENSE_KEY and AADHAAR_API_BASE_URL"
    });

  } catch (error) {
    console.error("Aadhaar verification error:", error);
    res.status(500).json({
      success: false,
      error: "Aadhaar verification failed",
      code: "VERIFICATION_ERROR"
    });
  }
});

// DigiLocker OAuth integration with graceful fallback
router.get("/digilocker/login", (req, res) => {
  try {
    // Check if DigiLocker is configured
    if (!process.env.DIGILOCKER_CLIENT_ID || !process.env.DIGILOCKER_CLIENT_SECRET) {
      return res.json({
        success: true,
        message: "DigiLocker integration (mock mode)",
        data: {
          redirect: "https://digilocker.gov.in/oauth",
          client_id: "mock_client_id",
          state: "mock_state_" + Date.now(),
          mode: "mock",
          message: "Configure DIGILOCKER_CLIENT_ID and DIGILOCKER_CLIENT_SECRET for real integration"
        }
      });
    }

    // Real OAuth flow would go here
    const state = "state_" + Date.now();
    const redirectUri = process.env.DIGILOCKER_REDIRECT_URI || "http://localhost:5000/api/auth/digilocker/callback";
    
    res.json({
      success: true,
      data: {
        redirect: `https://digilocker.gov.in/oauth/authorize?client_id=${process.env.DIGILOCKER_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}`,
        client_id: process.env.DIGILOCKER_CLIENT_ID,
        state,
        mode: "live"
      }
    });

  } catch (error) {
    console.error("DigiLocker login error:", error);
    res.status(500).json({
      success: false,
      error: "DigiLocker login failed",
      code: "DIGILOCKER_ERROR"
    });
  }
});

// PAN verification with Setu API graceful fallback
router.post("/pan/verify", async (req, res) => {
  try {
    const { panNumber } = req.body;

    if (!panNumber) {
      return res.status(400).json({
        success: false,
        error: "PAN number is required",
        code: "MISSING_PAN"
      });
    }

    // Check if API Setu is configured
    if (!process.env.API_SETU_CLIENT_ID || !process.env.API_SETU_CLIENT_SECRET) {
      // Mock verification for development
      const isValidPAN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber);
      
      return res.json({
        success: true,
        message: "PAN verification completed (mock mode)",
        data: {
          verified: isValidPAN,
          panNumber: panNumber.replace(/(\w{5})\w{4}(\w{1})/, "$1****$2"),
          mode: "mock",
          timestamp: new Date().toISOString()
        }
      });
    }

    // Real API integration would go here
    res.status(503).json({
      success: false,
      error: "PAN verification service is not fully configured",
      code: "SERVICE_NOT_CONFIGURED",
      message: "Please configure API_SETU_CLIENT_ID and API_SETU_CLIENT_SECRET"
    });

  } catch (error) {
    console.error("PAN verification error:", error);
    res.status(500).json({
      success: false,
      error: "PAN verification failed",
      code: "VERIFICATION_ERROR"
    });
  }
});

// Comprehensive Service Status endpoint
router.get("/status", (req, res) => {
  const mongoose = require("mongoose");
  
  const status = {
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    services: {
      database: {
        status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        readyState: mongoose.connection.readyState
      },
      aadhaar: {
        configured: !!process.env.AADHAAR_LICENSE_KEY,
        baseUrl: !!process.env.AADHAAR_API_BASE_URL,
        status: (!!process.env.AADHAAR_LICENSE_KEY && !!process.env.AADHAAR_API_BASE_URL) ? "ready" : "mock"
      },
      digilocker: {
        configured: !!process.env.DIGILOCKER_CLIENT_ID,
        clientSecret: !!process.env.DIGILOCKER_CLIENT_SECRET,
        status: (!!process.env.DIGILOCKER_CLIENT_ID && !!process.env.DIGILOCKER_CLIENT_SECRET) ? "ready" : "mock"
      },
      apiSetu: {
        configured: !!process.env.API_SETU_CLIENT_ID,
        clientSecret: !!process.env.API_SETU_CLIENT_SECRET,
        status: (!!process.env.API_SETU_CLIENT_ID && !!process.env.API_SETU_CLIENT_SECRET) ? "ready" : "mock"
      },
      supabase: {
        configured: !!process.env.SUPABASE_URL,
        status: !!process.env.SUPABASE_URL ? "ready" : "not_configured"
      },
      blockchain: {
        configured: !!process.env.FABRIC_CHANNEL_NAME,
        status: !!process.env.FABRIC_CHANNEL_NAME ? "ready" : "mock"
      }
    },
    security: {
      jwt: !!process.env.JWT_SECRET,
      jwtRefresh: !!process.env.JWT_REFRESH_SECRET,
      encryption: !!process.env.ENCRYPTION_KEY
    }
  };

  // Calculate overall health
  const criticalServices = [
    status.services.database.status === "connected",
    status.security.jwt,
    status.security.jwtRefresh
  ];
  
  const overallHealth = criticalServices.every(service => service);
  status.overallHealth = overallHealth ? "healthy" : "degraded";

  res.status(overallHealth ? 200 : 503).json(status);
});

module.exports = router;
