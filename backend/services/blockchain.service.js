const fabricConfig = require("../config/fabric.config");

class BlockchainService {
  /**
   * Verify a digital ID against Fabric ledger
   * Stub returns true if ID starts with "DID-"
   */
  static async verifyDigitalId(digitalId) {
    return digitalId && digitalId.startsWith("DID-");
  }

  /**
   * Bulk verification for admin controls
   */
  static async bulkVerify(ids) {
    return ids.map((id) => ({
      id,
      valid: id.startsWith("DID-"),
    }));
  }

  /**
   * Return network status from .env config
   */
  static async getNetworkStatus() {
    return {
      caUrl: fabricConfig.caUrl,
      peerUrl: fabricConfig.peerUrl,
      ordererUrl: fabricConfig.ordererUrl,
      channel: fabricConfig.channel,
      chaincode: fabricConfig.chaincode,
      walletPath: fabricConfig.walletPath,
      adminUser: fabricConfig.adminUser,
      mspId: fabricConfig.mspId,
    };
  }

  /**
   * Validate configuration from .env
   */
  static async validateConfig() {
    const missing = [];
    for (const [key, value] of Object.entries(fabricConfig)) {
      if (!value) missing.push(key);
    }
    return missing.length === 0
      ? { valid: true }
      : { valid: false, missing };
  }

  /**
   * Integrity check – confirm chaincode & MSP are set
   */
  static async integrityCheck() {
    return {
      chaincodeSet: !!fabricConfig.chaincode,
      mspConfigured: !!fabricConfig.mspId,
    };
  }
}

module.exports = BlockchainService;
