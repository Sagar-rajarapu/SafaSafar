const express = require("express");
const HybridService = require("../services/hybrid.service");

const router = express.Router();

/**
 * 1. Real-time verification status (push updates via WebSocket)
 */
router.get("/realtime", async (req, res) => {
  try {
    // Start subscription
    HybridService.subscribeToVerificationStatus((payload) => {
      console.log("🔔 Realtime change detected:", payload);
    });

    res.json({ message: "Realtime subscription started (check server logs for events)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Cross-database health check
 */
router.get("/health", async (req, res) => {
  try {
    const status = await HybridService.checkDatabases();
    res.json({ status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Service availability (env-based)
 */
router.get("/availability", async (req, res) => {
  try {
    const report = await HybridService.serviceAvailability();
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
