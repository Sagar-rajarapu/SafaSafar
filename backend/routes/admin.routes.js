/**
 * Admin Routes for Digital ID Management
 * 
 * These routes provide administrative functions for:
 * - Bulk operations (mint, revoke, verify)
 * - System monitoring and health checks
 * - User management and statistics
 * - Configuration management
 * - Audit logging
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const AdminService = require('../services/admin.service');
const FabricService = require('../services/fabric.service');
const KeyManagementService = require('../services/key-management.service');

const router = express.Router();

// Admin rate limiting (more restrictive)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: "Too many admin requests, please try again later.",
    code: "ADMIN_RATE_LIMIT_EXCEEDED"
  }
});

// Middleware to check admin authorization (basic implementation)
const requireAdmin = (req, res, next) => {
  // In production, implement proper admin authentication
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
      code: "ADMIN_ACCESS_DENIED"
    });
  }
  next();
};

/**
 * 1. System Health Check
 */
router.get('/health', async (req, res) => {
  try {
    const health = await AdminService.getSystemHealth();
    
    res.status(health.overallHealth === 'healthy' ? 200 : 503).json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({
      success: false,
      error: "System health check failed",
      details: error.message,
      code: "HEALTH_CHECK_ERROR"
    });
  }
});

/**
 * 2. System Configuration
 */
router.get('/config', requireAdmin, async (req, res) => {
  try {
    const config = AdminService.getSystemConfiguration();
    
    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get system configuration",
      details: error.message,
      code: "CONFIG_ERROR"
    });
  }
});

/**
 * 3. Validate System Configuration
 */
router.get('/config/validate', requireAdmin, async (req, res) => {
  try {
    const validation = AdminService.validateSystemConfiguration();
    
    res.status(validation.valid ? 200 : 400).json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('Config validation error:', error);
    res.status(500).json({
      success: false,
      error: "Configuration validation failed",
      details: error.message,
      code: "CONFIG_VALIDATION_ERROR"
    });
  }
});

/**
 * 4. User Statistics
 */
router.get('/users/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await AdminService.getUserStatistics();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('User statistics error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get user statistics",
      details: error.message,
      code: "USER_STATS_ERROR"
    });
  }
});

/**
 * 5. Bulk Mint Digital IDs
 */
router.post('/bulk/mint', requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { users, adminId } = req.body;

    if (!users || !Array.isArray(users)) {
      return res.status(400).json({
        success: false,
        error: "Users array is required",
        code: "MISSING_USERS"
      });
    }

    if (users.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Maximum 100 users allowed per bulk operation",
        code: "TOO_MANY_USERS"
      });
    }

    const result = await AdminService.bulkMintDigitalIds(users, adminId);

    res.json({
      success: true,
      message: "Bulk mint operation completed",
      data: result
    });

  } catch (error) {
    console.error('Bulk mint error:', error);
    res.status(500).json({
      success: false,
      error: "Bulk mint operation failed",
      details: error.message,
      code: "BULK_MINT_ERROR"
    });
  }
});

/**
 * 6. Bulk Revoke Digital IDs
 */
router.post('/bulk/revoke', requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { digitalIds, reason, adminId } = req.body;

    if (!digitalIds || !Array.isArray(digitalIds)) {
      return res.status(400).json({
        success: false,
        error: "Digital IDs array is required",
        code: "MISSING_DIGITAL_IDS"
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: "Revocation reason is required",
        code: "MISSING_REASON"
      });
    }

    if (digitalIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Maximum 100 Digital IDs allowed per bulk operation",
        code: "TOO_MANY_IDS"
      });
    }

    const result = await AdminService.bulkRevokeDigitalIds(digitalIds, reason, adminId);

    res.json({
      success: true,
      message: "Bulk revoke operation completed",
      data: result
    });

  } catch (error) {
    console.error('Bulk revoke error:', error);
    res.status(500).json({
      success: false,
      error: "Bulk revoke operation failed",
      details: error.message,
      code: "BULK_REVOKE_ERROR"
    });
  }
});

/**
 * 7. Bulk Verify Digital IDs
 */
router.post('/bulk/verify', requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { digitalIds } = req.body;

    if (!digitalIds || !Array.isArray(digitalIds)) {
      return res.status(400).json({
        success: false,
        error: "Digital IDs array is required",
        code: "MISSING_DIGITAL_IDS"
      });
    }

    if (digitalIds.length > 200) {
      return res.status(400).json({
        success: false,
        error: "Maximum 200 Digital IDs allowed per bulk verification",
        code: "TOO_MANY_IDS"
      });
    }

    const result = await FabricService.bulkVerifyDigitalIds(digitalIds);

    res.json({
      success: true,
      message: "Bulk verification completed",
      data: result
    });

  } catch (error) {
    console.error('Bulk verify error:', error);
    res.status(500).json({
      success: false,
      error: "Bulk verification failed",
      details: error.message,
      code: "BULK_VERIFY_ERROR"
    });
  }
});

/**
 * 8. Get Audit Log
 */
router.get('/audit', requireAdmin, async (req, res) => {
  try {
    const { limit = 100, type } = req.query;
    const limitNum = parseInt(limit);

    if (limitNum > 1000) {
      return res.status(400).json({
        success: false,
        error: "Maximum 1000 audit entries allowed per request",
        code: "LIMIT_TOO_HIGH"
      });
    }

    const auditLog = AdminService.getAuditLog(limitNum, type);

    res.json({
      success: true,
      data: auditLog
    });

  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get audit log",
      details: error.message,
      code: "AUDIT_LOG_ERROR"
    });
  }
});

/**
 * 9. Generate System Report
 */
router.get('/report', requireAdmin, async (req, res) => {
  try {
    const report = await AdminService.generateSystemReport();

    res.json({
      success: true,
      data: report.report
    });

  } catch (error) {
    console.error('Generate system report error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to generate system report",
      details: error.message,
      code: "REPORT_ERROR"
    });
  }
});

/**
 * 10. Key Management Status
 */
router.get('/keys/status', requireAdmin, async (req, res) => {
  try {
    const keyStatus = KeyManagementService.getKeyStatus();
    const keyValidation = KeyManagementService.validateKeyConfiguration();

    res.json({
      success: true,
      data: {
        status: keyStatus,
        validation: keyValidation
      }
    });

  } catch (error) {
    console.error('Key management status error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get key management status",
      details: error.message,
      code: "KEY_STATUS_ERROR"
    });
  }
});

/**
 * 11. Rotate Encryption Key
 */
router.post('/keys/rotate/encryption', requireAdmin, async (req, res) => {
  try {
    const { newKey } = req.body;
    const result = KeyManagementService.rotateEncryptionKey(newKey);

    res.json({
      success: true,
      message: "Encryption key rotated successfully",
      data: result
    });

  } catch (error) {
    console.error('Rotate encryption key error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to rotate encryption key",
      details: error.message,
      code: "KEY_ROTATION_ERROR"
    });
  }
});

/**
 * 12. Rotate HMAC Secret
 */
router.post('/keys/rotate/hmac', requireAdmin, async (req, res) => {
  try {
    const { newSecret } = req.body;
    const result = KeyManagementService.rotateHmacSecret(newSecret);

    res.json({
      success: true,
      message: "HMAC secret rotated successfully",
      data: result
    });

  } catch (error) {
    console.error('Rotate HMAC secret error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to rotate HMAC secret",
      details: error.message,
      code: "HMAC_ROTATION_ERROR"
    });
  }
});

/**
 * 13. Generate Secure Environment Variables
 */
router.get('/keys/generate-env', requireAdmin, async (req, res) => {
  try {
    const secureEnv = KeyManagementService.generateSecureEnvironment();

    res.json({
      success: true,
      message: "Secure environment variables generated",
      data: {
        variables: secureEnv,
        note: "Copy these to your .env file and restart the application"
      }
    });

  } catch (error) {
    console.error('Generate secure env error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to generate secure environment variables",
      details: error.message,
      code: "GENERATE_ENV_ERROR"
    });
  }
});

/**
 * 14. Initialize Fabric Network
 */
router.post('/blockchain/initialize', requireAdmin, async (req, res) => {
  try {
    const result = await FabricService.initialize();

    res.json({
      success: true,
      message: "Fabric network initialized",
      data: result
    });

  } catch (error) {
    console.error('Initialize Fabric error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize Fabric network",
      details: error.message,
      code: "FABRIC_INIT_ERROR"
    });
  }
});

/**
 * 15. Get Blockchain Status
 */
router.get('/blockchain/status', requireAdmin, async (req, res) => {
  try {
    const status = await FabricService.getNetworkStatus();

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get blockchain status error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get blockchain status",
      details: error.message,
      code: "BLOCKCHAIN_STATUS_ERROR"
    });
  }
});

module.exports = router;
