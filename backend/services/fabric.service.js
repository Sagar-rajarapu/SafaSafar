/**
 * Hyperledger Fabric SDK Integration Service
 * 
 * This service provides blockchain operations for Digital ID management:
 * - Connect to Fabric network
 * - Mint Digital IDs on-chain
 * - Verify Digital IDs
 * - Manage DID lifecycle (revoke, renew)
 * - Handle key management and signing
 */

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FabricService {
    constructor() {
        this.gateway = new Gateway();
        this.wallet = null;
        this.network = null;
        this.contract = null;
        this.isConnected = false;
    }

    /**
     * Initialize Fabric connection
     */
    async initialize() {
        try {
            // Load network configuration
            const ccpPath = process.env.FABRIC_NETWORK_CONFIG || './config/network-config.json';
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

            // Create wallet
            const walletPath = process.env.FABRIC_WALLET_PATH || './wallet';
            this.wallet = await Wallets.newFileSystemWallet(walletPath);

            // Check if user exists in wallet
            const userExists = await this.wallet.get(process.env.FABRIC_USER || 'admin');
            if (!userExists) {
                throw new Error(`User ${process.env.FABRIC_USER || 'admin'} not found in wallet`);
            }

            // Connect to gateway
            await this.gateway.connect(ccp, {
                wallet: this.wallet,
                identity: process.env.FABRIC_USER || 'admin',
                discovery: { enabled: true, asLocalhost: true }
            });

            // Get network and contract
            this.network = await this.gateway.getNetwork(process.env.FABRIC_CHANNEL_NAME || 'mychannel');
            this.contract = this.network.getContract(process.env.FABRIC_CHAINCODE_NAME || 'digi-id-chaincode');

            this.isConnected = true;
            console.log('✅ Fabric network connected successfully');

            return { success: true, message: 'Fabric network connected' };

        } catch (error) {
            console.error('❌ Fabric connection failed:', error.message);
            this.isConnected = false;
            throw new Error(`Fabric initialization failed: ${error.message}`);
        }
    }

    /**
     * Mint a Digital ID on the blockchain
     * @param {Object} digitalIdData - Digital ID data
     */
    async mintDigitalId(digitalIdData) {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const {
                digitalId,
                touristId,
                kycData,
                documents,
                expiryDays = 365,
                issuerId = 'digi-id-issuer'
            } = digitalIdData;

            // Generate hashes for privacy preservation
            const kycHash = this.generateHash(JSON.stringify(kycData));
            const documentHashes = this.generateDocumentHashes(documents);
            
            // Calculate expiry timestamp
            const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60);

            // Generate signature
            const signature = await this.generateSignature(digitalId, kycHash, issuerId);

            // Submit transaction
            const result = await this.contract.submitTransaction(
                'MintDigitalId',
                digitalId,
                touristId,
                kycHash,
                JSON.stringify(documentHashes),
                expiryTimestamp.toString(),
                issuerId,
                signature
            );

            const response = JSON.parse(result.toString());

            // Store off-chain data mapping
            await this.storeOffChainMapping(digitalId, {
                kycData,
                documents,
                onChainHash: kycHash,
                documentHashes
            });

            return {
                success: true,
                digitalId: digitalId,
                transactionId: response.transactionId,
                onChainHash: kycHash,
                expiryTimestamp: expiryTimestamp,
                message: 'Digital ID minted successfully on blockchain'
            };

        } catch (error) {
            console.error('Mint Digital ID error:', error);
            throw new Error(`Failed to mint Digital ID: ${error.message}`);
        }
    }

    /**
     * Verify a Digital ID on the blockchain
     * @param {string} digitalId - Digital ID to verify
     * @param {string} kycHash - Optional KYC hash to verify against
     */
    async verifyDigitalId(digitalId, kycHash = null) {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            // Submit query transaction
            const result = await this.contract.evaluateTransaction(
                'VerifyDigitalId',
                digitalId,
                kycHash || ''
            );

            const response = JSON.parse(result.toString());

            // If verification is successful, get full details
            if (response.valid) {
                const details = await this.getDigitalIdDetails(digitalId);
                response.details = details.data;
            }

            return response;

        } catch (error) {
            console.error('Verify Digital ID error:', error);
            throw new Error(`Failed to verify Digital ID: ${error.message}`);
        }
    }

    /**
     * Get Digital ID details from blockchain
     * @param {string} digitalId - Digital ID to query
     */
    async getDigitalIdDetails(digitalId) {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const result = await this.contract.evaluateTransaction(
                'GetDigitalId',
                digitalId
            );

            return JSON.parse(result.toString());

        } catch (error) {
            console.error('Get Digital ID details error:', error);
            throw new Error(`Failed to get Digital ID details: ${error.message}`);
        }
    }

    /**
     * Revoke a Digital ID
     * @param {string} digitalId - Digital ID to revoke
     * @param {string} reason - Reason for revocation
     * @param {string} revokedBy - ID of revoking authority
     */
    async revokeDigitalId(digitalId, reason, revokedBy = 'admin') {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const result = await this.contract.submitTransaction(
                'RevokeDigitalId',
                digitalId,
                reason,
                revokedBy
            );

            return JSON.parse(result.toString());

        } catch (error) {
            console.error('Revoke Digital ID error:', error);
            throw new Error(`Failed to revoke Digital ID: ${error.message}`);
        }
    }

    /**
     * Renew a Digital ID
     * @param {string} digitalId - Digital ID to renew
     * @param {number} newExpiryDays - New expiry in days
     * @param {string} renewedBy - ID of renewing authority
     */
    async renewDigitalId(digitalId, newExpiryDays, renewedBy = 'admin') {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const newExpiryTimestamp = Math.floor(Date.now() / 1000) + (newExpiryDays * 24 * 60 * 60);

            const result = await this.contract.submitTransaction(
                'RenewDigitalId',
                digitalId,
                newExpiryTimestamp.toString(),
                renewedBy
            );

            return JSON.parse(result.toString());

        } catch (error) {
            console.error('Renew Digital ID error:', error);
            throw new Error(`Failed to renew Digital ID: ${error.message}`);
        }
    }

    /**
     * Bulk verify multiple Digital IDs
     * @param {Array} digitalIds - Array of Digital IDs to verify
     */
    async bulkVerifyDigitalIds(digitalIds) {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const result = await this.contract.evaluateTransaction(
                'BulkVerifyDigitalIds',
                JSON.stringify(digitalIds)
            );

            return JSON.parse(result.toString());

        } catch (error) {
            console.error('Bulk verify error:', error);
            throw new Error(`Failed to bulk verify Digital IDs: ${error.message}`);
        }
    }

    /**
     * Get all Digital IDs for a tourist
     * @param {string} touristId - Tourist ID
     */
    async getTouristDigitalIds(touristId) {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const result = await this.contract.evaluateTransaction(
                'GetTouristDigitalIds',
                touristId
            );

            return JSON.parse(result.toString());

        } catch (error) {
            console.error('Get tourist Digital IDs error:', error);
            throw new Error(`Failed to get tourist Digital IDs: ${error.message}`);
        }
    }

    /**
     * Admin function: Bulk mint Digital IDs
     * @param {Array} bulkData - Array of Digital ID data
     */
    async bulkMintDigitalIds(bulkData) {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const result = await this.contract.submitTransaction(
                'BulkMintDigitalIds',
                JSON.stringify(bulkData)
            );

            return JSON.parse(result.toString());

        } catch (error) {
            console.error('Bulk mint error:', error);
            throw new Error(`Failed to bulk mint Digital IDs: ${error.message}`);
        }
    }

    /**
     * Get network status and health
     */
    async getNetworkStatus() {
        try {
            if (!this.isConnected) {
                return {
                    connected: false,
                    message: 'Not connected to Fabric network'
                };
            }

            // Get network info
            const networkInfo = {
                connected: this.isConnected,
                channel: this.network ? this.network.getChannel().getName() : null,
                chaincode: this.contract ? this.contract.getChaincodeId() : null,
                timestamp: new Date().toISOString()
            };

            return networkInfo;

        } catch (error) {
            console.error('Get network status error:', error);
            return {
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * Disconnect from Fabric network
     */
    async disconnect() {
        try {
            if (this.gateway) {
                await this.gateway.disconnect();
                this.isConnected = false;
                console.log('✅ Disconnected from Fabric network');
            }
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    // Helper methods

    /**
     * Generate hash for data
     * @param {string} data - Data to hash
     */
    generateHash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generate hashes for documents
     * @param {Array} documents - Array of document data
     */
    generateDocumentHashes(documents) {
        return documents.map(doc => ({
            type: doc.type,
            hash: this.generateHash(JSON.stringify(doc.data)),
            timestamp: Math.floor(Date.now() / 1000)
        }));
    }

    /**
     * Generate cryptographic signature
     * @param {string} digitalId - Digital ID
     * @param {string} kycHash - KYC hash
     * @param {string} issuerId - Issuer ID
     */
    async generateSignature(digitalId, kycHash, issuerId) {
        try {
            // In production, use proper cryptographic signing
            // For now, generate a deterministic signature
            const data = `${digitalId}:${kycHash}:${issuerId}:${Date.now()}`;
            const signature = crypto.createHmac('sha256', process.env.ENCRYPTION_KEY || 'default-key')
                .update(data)
                .digest('hex');
            
            return signature;
        } catch (error) {
            throw new Error(`Failed to generate signature: ${error.message}`);
        }
    }

    /**
     * Store off-chain data mapping
     * @param {string} digitalId - Digital ID
     * @param {Object} data - Data to store off-chain
     */
    async storeOffChainMapping(digitalId, data) {
        try {
            // In production, store in secure off-chain storage (Supabase, IPFS, etc.)
            // For now, store in local file system
            const mappingPath = `./off-chain-mappings/${digitalId}.json`;
            const mappingDir = path.dirname(mappingPath);
            
            if (!fs.existsSync(mappingDir)) {
                fs.mkdirSync(mappingDir, { recursive: true });
            }

            fs.writeFileSync(mappingPath, JSON.stringify({
                digitalId,
                storedAt: new Date().toISOString(),
                data
            }, null, 2));

            console.log(`Off-chain mapping stored for Digital ID: ${digitalId}`);

        } catch (error) {
            console.error('Store off-chain mapping error:', error);
            // Don't throw error as this is not critical for blockchain operation
        }
    }

    /**
     * Retrieve off-chain data mapping
     * @param {string} digitalId - Digital ID
     */
    async getOffChainMapping(digitalId) {
        try {
            const mappingPath = `./off-chain-mappings/${digitalId}.json`;
            
            if (fs.existsSync(mappingPath)) {
                const data = fs.readFileSync(mappingPath, 'utf8');
                return JSON.parse(data);
            }

            return null;

        } catch (error) {
            console.error('Get off-chain mapping error:', error);
            return null;
        }
    }
}

// Export singleton instance
module.exports = new FabricService();
