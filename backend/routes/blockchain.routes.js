const express = require("express");
const rateLimit = require("express-rate-limit");
const FabricService = require("../services/fabric.service");
const User = require("../models/User");

const router = express.Router();

// Rate limiting for blockchain operations
const blockchainLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    success: false,
    error: "Too many blockchain requests, please try again later.",
    code: "BLOCKCHAIN_RATE_LIMIT_EXCEEDED"
  }
});

/**
 * 1. Mint Digital ID on blockchain
 */
router.post("/mint", blockchainLimiter, async (req, res) => {
  try {
    const { 
      touristId, 
      kycData, 
      documents, 
      expiryDays = 365,
      issuerId = 'digi-id-issuer'
    } = req.body;

    // Validate required fields
    if (!touristId || !kycData) {
      return res.status(400).json({
        success: false,
        error: "Tourist ID and KYC data are required",
        code: "MISSING_REQUIRED_FIELDS"
      });
    }

    // Check if user exists
    const user = await User.findById(touristId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Tourist not found",
        code: "TOURIST_NOT_FOUND"
      });
    }

    // Generate unique Digital ID
    const digitalId = `DID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Prepare data for blockchain
    const digitalIdData = {
      digitalId,
      touristId,
      kycData,
      documents: documents || [],
      expiryDays,
      issuerId
    };

    // Mint on blockchain
    const result = await FabricService.mintDigitalId(digitalIdData);

    // Update user with Digital ID
    user.digitalId = digitalId;
    user.verificationLevel = Math.max(user.verificationLevel, 3); // Digital ID = level 3
    await user.save();

    res.status(201).json({
      success: true,
      message: "Digital ID minted successfully",
      data: {
        digitalId: result.digitalId,
        transactionId: result.transactionId,
        expiryTimestamp: result.expiryTimestamp,
        onChainHash: result.onChainHash,
        touristId: user._id,
        verificationLevel: user.verificationLevel
      }
    });

  } catch (error) {
    console.error("Mint Digital ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mint Digital ID",
      details: error.message,
      code: "MINT_ERROR"
    });
  }
});

/**
 * 2. Verify Digital ID on blockchain
 */
router.post("/verify", blockchainLimiter, async (req, res) => {
  try {
    const { digitalId, kycHash } = req.body;

    if (!digitalId) {
      return res.status(400).json({
        success: false,
        error: "Digital ID is required",
        code: "MISSING_DIGITAL_ID"
      });
    }

    // Verify on blockchain
    const result = await FabricService.verifyDigitalId(digitalId, kycHash);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Verify Digital ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify Digital ID",
      details: error.message,
      code: "VERIFY_ERROR"
    });
  }
});

/**
 * 3. Get Digital ID details
 */
router.get("/details/:digitalId", async (req, res) => {
  try {
    const { digitalId } = req.params;

    const result = await FabricService.getDigitalIdDetails(digitalId);

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error("Get Digital ID details error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get Digital ID details",
      details: error.message,
      code: "GET_DETAILS_ERROR"
    });
  }
});

/**
 * 4. Revoke Digital ID
 */
router.post("/revoke", blockchainLimiter, async (req, res) => {
  try {
    const { digitalId, reason, revokedBy } = req.body;

    if (!digitalId || !reason) {
      return res.status(400).json({
        success: false,
        error: "Digital ID and reason are required",
        code: "MISSING_REQUIRED_FIELDS"
      });
    }

    // Revoke on blockchain
    const result = await FabricService.revokeDigitalId(digitalId, reason, revokedBy);

    // Update user status
    const user = await User.findOne({ digitalId });
    if (user) {
      user.verificationLevel = Math.max(user.verificationLevel - 1, 0);
      await user.save();
    }

    res.json({
      success: true,
      message: "Digital ID revoked successfully",
      data: result
    });

  } catch (error) {
    console.error("Revoke Digital ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to revoke Digital ID",
      details: error.message,
      code: "REVOKE_ERROR"
    });
  }
});

/**
 * 5. Renew Digital ID
 */
router.post("/renew", blockchainLimiter, async (req, res) => {
  try {
    const { digitalId, newExpiryDays, renewedBy } = req.body;

    if (!digitalId || !newExpiryDays) {
      return res.status(400).json({
        success: false,
        error: "Digital ID and new expiry days are required",
        code: "MISSING_REQUIRED_FIELDS"
      });
    }

    // Renew on blockchain
    const result = await FabricService.renewDigitalId(digitalId, newExpiryDays, renewedBy);

    res.json({
      success: true,
      message: "Digital ID renewed successfully",
      data: result
    });

  } catch (error) {
    console.error("Renew Digital ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to renew Digital ID",
      details: error.message,
      code: "RENEW_ERROR"
    });
  }
});

/**
 * 6. Bulk verify Digital IDs
 */
router.post("/bulk-verify", blockchainLimiter, async (req, res) => {
  try {
    const { digitalIds } = req.body;

    if (!digitalIds || !Array.isArray(digitalIds)) {
      return res.status(400).json({
        success: false,
        error: "Digital IDs array is required",
        code: "MISSING_DIGITAL_IDS"
      });
    }

    if (digitalIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Maximum 100 Digital IDs allowed per request",
        code: "TOO_MANY_IDS"
      });
    }

    const result = await FabricService.bulkVerifyDigitalIds(digitalIds);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Bulk verify error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to bulk verify Digital IDs",
      details: error.message,
      code: "BULK_VERIFY_ERROR"
    });
  }
});

/**
 * 7. Get tourist's Digital IDs
 */
router.get("/tourist/:touristId", async (req, res) => {
  try {
    const { touristId } = req.params;

    const result = await FabricService.getTouristDigitalIds(touristId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Get tourist Digital IDs error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get tourist Digital IDs",
      details: error.message,
      code: "GET_TOURIST_IDS_ERROR"
    });
  }
});

/**
 * 8. Admin: Bulk mint Digital IDs
 */
router.post("/admin/bulk-mint", blockchainLimiter, async (req, res) => {
  try {
    // In production, add proper admin authentication
    const { bulkData } = req.body;

    if (!bulkData || !Array.isArray(bulkData)) {
      return res.status(400).json({
        success: false,
        error: "Bulk data array is required",
        code: "MISSING_BULK_DATA"
      });
    }

    if (bulkData.length > 50) {
      return res.status(400).json({
        success: false,
        error: "Maximum 50 Digital IDs allowed per bulk operation",
        code: "TOO_MANY_BULK_IDS"
      });
    }

    const result = await FabricService.bulkMintDigitalIds(bulkData);

    res.json({
      success: true,
      message: "Bulk mint operation completed",
      data: result
    });

  } catch (error) {
    console.error("Bulk mint error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to bulk mint Digital IDs",
      details: error.message,
      code: "BULK_MINT_ERROR"
    });
  }
});

/**
 * 9. Network status and health
 */
router.get("/status", async (req, res) => {
  try {
    const status = await FabricService.getNetworkStatus();

    res.json({
      success: true,
      data: {
        ...status,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
      }
    });

  } catch (error) {
    console.error("Get network status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get network status",
      details: error.message,
      code: "STATUS_ERROR"
    });
  }
});

/**
 * 10. Initialize Fabric connection
 */
router.post("/initialize", async (req, res) => {
  try {
    const result = await FabricService.initialize();

    res.json({
      success: true,
      message: "Fabric network initialized",
      data: result
    });

  } catch (error) {
    console.error("Initialize Fabric error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize Fabric network",
      details: error.message,
      code: "INIT_ERROR"
    });
  }
});

module.exports = router;