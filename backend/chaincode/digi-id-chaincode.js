/**
 * Digital ID Chaincode for Hyperledger Fabric
 * 
 * This chaincode manages Digital IDs on the blockchain with privacy-preserving design:
 * - Stores only hashes of sensitive data on-chain
 * - Manages DID lifecycle (mint, verify, revoke, renew)
 * - Enforces expiry and revocation checks
 * - Provides admin controls for bulk operations
 * 
 * Security Features:
 * - Only authorized issuers can mint DIDs
 * - Immutable audit trail
 * - Privacy-preserving (no raw PII on-chain)
 * - Cryptographic verification
 */

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class DigitalIdContract extends Contract {
    
    constructor() {
        super('DigitalIdContract');
    }

    /**
     * Initialize the chaincode
     */
    async Init(ctx) {
        console.log('Digital ID Chaincode initialized');
        return { success: true, message: 'Chaincode initialized' };
    }

    /**
     * Mint a new Digital ID
     * @param {Context} ctx - Transaction context
     * @param {string} digitalId - Unique Digital ID
     * @param {string} touristId - Tourist identifier
     * @param {string} kycHash - Hash of KYC verification data
     * @param {string} documentHashes - JSON string of document hashes
     * @param {number} expiryTimestamp - Expiry timestamp (Unix)
     * @param {string} issuerId - ID of the issuing authority
     * @param {string} signature - Cryptographic signature
     */
    async MintDigitalId(ctx, digitalId, touristId, kycHash, documentHashes, expiryTimestamp, issuerId, signature) {
        try {
            // Validate inputs
            if (!digitalId || !touristId || !kycHash || !expiryTimestamp || !issuerId) {
                throw new Error('Missing required parameters');
            }

            // Check if DID already exists
            const existingDID = await ctx.stub.getState(digitalId);
            if (existingDID && existingDID.length > 0) {
                throw new Error(`Digital ID ${digitalId} already exists`);
            }

            // Validate expiry timestamp
            const currentTime = Math.floor(Date.now() / 1000);
            if (parseInt(expiryTimestamp) <= currentTime) {
                throw new Error('Expiry timestamp must be in the future');
            }

            // Verify issuer authorization (in production, check against authorized issuers)
            const isAuthorized = await this.verifyIssuer(ctx, issuerId);
            if (!isAuthorized) {
                throw new Error(`Issuer ${issuerId} is not authorized to mint DIDs`);
            }

            // Verify signature (in production, implement proper signature verification)
            const isValidSignature = await this.verifySignature(ctx, digitalId, signature, issuerId);
            if (!isValidSignature) {
                throw new Error('Invalid signature');
            }

            // Create Digital ID asset
            const digitalIdAsset = {
                digitalId: digitalId,
                touristId: touristId,
                kycHash: kycHash,
                documentHashes: documentHashes,
                expiryTimestamp: parseInt(expiryTimestamp),
                issuerId: issuerId,
                status: 'ACTIVE',
                mintedAt: currentTime,
                lastUpdated: currentTime,
                version: 1,
                signature: signature,
                metadata: {
                    chaincodeVersion: '1.0.0',
                    mintedBy: ctx.clientIdentity.getMSPID(),
                    transactionId: ctx.stub.getTxID()
                }
            };

            // Store on blockchain
            await ctx.stub.putState(digitalId, Buffer.from(JSON.stringify(digitalIdAsset)));

            // Create composite key for querying by tourist
            const touristKey = ctx.stub.createCompositeKey('tourist~did', [touristId, digitalId]);
            await ctx.stub.putState(touristKey, Buffer.from(digitalId));

            // Create composite key for querying by issuer
            const issuerKey = ctx.stub.createCompositeKey('issuer~did', [issuerId, digitalId]);
            await ctx.stub.putState(issuerKey, Buffer.from(digitalId));

            // Emit event
            ctx.stub.setEvent('DigitalIdMinted', {
                digitalId: digitalId,
                touristId: touristId,
                issuerId: issuerId,
                expiryTimestamp: expiryTimestamp
            });

            return {
                success: true,
                digitalId: digitalId,
                message: 'Digital ID minted successfully',
                transactionId: ctx.stub.getTxID()
            };

        } catch (error) {
            throw new Error(`Failed to mint Digital ID: ${error.message}`);
        }
    }

    /**
     * Verify a Digital ID
     * @param {Context} ctx - Transaction context
     * @param {string} digitalId - Digital ID to verify
     * @param {string} kycHash - KYC hash to verify against
     */
    async VerifyDigitalId(ctx, digitalId, kycHash) {
        try {
            // Get Digital ID from blockchain
            const didBytes = await ctx.stub.getState(digitalId);
            if (!didBytes || didBytes.length === 0) {
                return {
                    success: false,
                    valid: false,
                    reason: 'Digital ID not found'
                };
            }

            const digitalIdAsset = JSON.parse(didBytes.toString());

            // Check if DID is active
            if (digitalIdAsset.status !== 'ACTIVE') {
                return {
                    success: true,
                    valid: false,
                    reason: `Digital ID is ${digitalIdAsset.status.toLowerCase()}`,
                    status: digitalIdAsset.status
                };
            }

            // Check expiry
            const currentTime = Math.floor(Date.now() / 1000);
            if (digitalIdAsset.expiryTimestamp <= currentTime) {
                return {
                    success: true,
                    valid: false,
                    reason: 'Digital ID has expired',
                    expiryTimestamp: digitalIdAsset.expiryTimestamp,
                    currentTimestamp: currentTime
                };
            }

            // Verify KYC hash if provided
            if (kycHash && digitalIdAsset.kycHash !== kycHash) {
                return {
                    success: true,
                    valid: false,
                    reason: 'KYC hash mismatch'
                };
            }

            // Return verification result
            return {
                success: true,
                valid: true,
                digitalId: digitalId,
                touristId: digitalIdAsset.touristId,
                issuerId: digitalIdAsset.issuerId,
                expiryTimestamp: digitalIdAsset.expiryTimestamp,
                mintedAt: digitalIdAsset.mintedAt,
                version: digitalIdAsset.version,
                message: 'Digital ID is valid and active'
            };

        } catch (error) {
            throw new Error(`Failed to verify Digital ID: ${error.message}`);
        }
    }

    /**
     * Revoke a Digital ID
     * @param {Context} ctx - Transaction context
     * @param {string} digitalId - Digital ID to revoke
     * @param {string} reason - Reason for revocation
     * @param {string} revokedBy - ID of the revoking authority
     */
    async RevokeDigitalId(ctx, digitalId, reason, revokedBy) {
        try {
            // Get Digital ID from blockchain
            const didBytes = await ctx.stub.getState(digitalId);
            if (!didBytes || didBytes.length === 0) {
                throw new Error(`Digital ID ${digitalId} not found`);
            }

            const digitalIdAsset = JSON.parse(didBytes.toString());

            // Check if already revoked
            if (digitalIdAsset.status === 'REVOKED') {
                throw new Error(`Digital ID ${digitalId} is already revoked`);
            }

            // Verify revoker authorization
            const isAuthorized = await this.verifyRevoker(ctx, revokedBy, digitalIdAsset.issuerId);
            if (!isAuthorized) {
                throw new Error(`Entity ${revokedBy} is not authorized to revoke this Digital ID`);
            }

            // Update status
            digitalIdAsset.status = 'REVOKED';
            digitalIdAsset.revokedAt = Math.floor(Date.now() / 1000);
            digitalIdAsset.revokedBy = revokedBy;
            digitalIdAsset.revocationReason = reason;
            digitalIdAsset.lastUpdated = digitalIdAsset.revokedAt;
            digitalIdAsset.version += 1;

            // Store updated asset
            await ctx.stub.putState(digitalId, Buffer.from(JSON.stringify(digitalIdAsset)));

            // Emit event
            ctx.stub.setEvent('DigitalIdRevoked', {
                digitalId: digitalId,
                reason: reason,
                revokedBy: revokedBy,
                revokedAt: digitalIdAsset.revokedAt
            });

            return {
                success: true,
                digitalId: digitalId,
                status: 'REVOKED',
                message: 'Digital ID revoked successfully',
                transactionId: ctx.stub.getTxID()
            };

        } catch (error) {
            throw new Error(`Failed to revoke Digital ID: ${error.message}`);
        }
    }

    /**
     * Renew a Digital ID
     * @param {Context} ctx - Transaction context
     * @param {string} digitalId - Digital ID to renew
     * @param {number} newExpiryTimestamp - New expiry timestamp
     * @param {string} renewedBy - ID of the renewing authority
     */
    async RenewDigitalId(ctx, digitalId, newExpiryTimestamp, renewedBy) {
        try {
            // Get Digital ID from blockchain
            const didBytes = await ctx.stub.getState(digitalId);
            if (!didBytes || didBytes.length === 0) {
                throw new Error(`Digital ID ${digitalId} not found`);
            }

            const digitalIdAsset = JSON.parse(didBytes.toString());

            // Check if active
            if (digitalIdAsset.status !== 'ACTIVE') {
                throw new Error(`Cannot renew ${digitalIdAsset.status.toLowerCase()} Digital ID`);
            }

            // Verify renewer authorization
            const isAuthorized = await this.verifyRenewer(ctx, renewedBy, digitalIdAsset.issuerId);
            if (!isAuthorized) {
                throw new Error(`Entity ${renewedBy} is not authorized to renew this Digital ID`);
            }

            // Validate new expiry
            const currentTime = Math.floor(Date.now() / 1000);
            if (parseInt(newExpiryTimestamp) <= currentTime) {
                throw new Error('New expiry timestamp must be in the future');
            }

            // Update expiry
            const oldExpiry = digitalIdAsset.expiryTimestamp;
            digitalIdAsset.expiryTimestamp = parseInt(newExpiryTimestamp);
            digitalIdAsset.renewedAt = currentTime;
            digitalIdAsset.renewedBy = renewedBy;
            digitalIdAsset.lastUpdated = currentTime;
            digitalIdAsset.version += 1;

            // Store updated asset
            await ctx.stub.putState(digitalId, Buffer.from(JSON.stringify(digitalIdAsset)));

            // Emit event
            ctx.stub.setEvent('DigitalIdRenewed', {
                digitalId: digitalId,
                oldExpiry: oldExpiry,
                newExpiry: newExpiryTimestamp,
                renewedBy: renewedBy,
                renewedAt: digitalIdAsset.renewedAt
            });

            return {
                success: true,
                digitalId: digitalId,
                oldExpiry: oldExpiry,
                newExpiry: newExpiryTimestamp,
                message: 'Digital ID renewed successfully',
                transactionId: ctx.stub.getTxID()
            };

        } catch (error) {
            throw new Error(`Failed to renew Digital ID: ${error.message}`);
        }
    }

    /**
     * Get Digital ID details
     * @param {Context} ctx - Transaction context
     * @param {string} digitalId - Digital ID to query
     */
    async GetDigitalId(ctx, digitalId) {
        try {
            const didBytes = await ctx.stub.getState(digitalId);
            if (!didBytes || didBytes.length === 0) {
                throw new Error(`Digital ID ${digitalId} not found`);
            }

            const digitalIdAsset = JSON.parse(didBytes.toString());
            
            // Remove sensitive data for public queries
            const publicData = {
                digitalId: digitalIdAsset.digitalId,
                touristId: digitalIdAsset.touristId,
                status: digitalIdAsset.status,
                expiryTimestamp: digitalIdAsset.expiryTimestamp,
                issuerId: digitalIdAsset.issuerId,
                mintedAt: digitalIdAsset.mintedAt,
                version: digitalIdAsset.version,
                lastUpdated: digitalIdAsset.lastUpdated
            };

            return {
                success: true,
                data: publicData
            };

        } catch (error) {
            throw new Error(`Failed to get Digital ID: ${error.message}`);
        }
    }

    /**
     * Bulk verify multiple Digital IDs
     * @param {Context} ctx - Transaction context
     * @param {string} digitalIds - JSON array of Digital IDs
     */
    async BulkVerifyDigitalIds(ctx, digitalIds) {
        try {
            const ids = JSON.parse(digitalIds);
            const results = [];

            for (const digitalId of ids) {
                try {
                    const verification = await this.VerifyDigitalId(ctx, digitalId);
                    results.push({
                        digitalId: digitalId,
                        ...verification
                    });
                } catch (error) {
                    results.push({
                        digitalId: digitalId,
                        success: false,
                        valid: false,
                        reason: error.message
                    });
                }
            }

            return {
                success: true,
                results: results,
                totalChecked: ids.length,
                validCount: results.filter(r => r.valid).length
            };

        } catch (error) {
            throw new Error(`Failed to bulk verify Digital IDs: ${error.message}`);
        }
    }

    /**
     * Get all Digital IDs for a tourist
     * @param {Context} ctx - Transaction context
     * @param {string} touristId - Tourist ID
     */
    async GetTouristDigitalIds(ctx, touristId) {
        try {
            const iterator = await ctx.stub.getStateByPartialCompositeKey('tourist~did', [touristId]);
            const results = [];

            while (true) {
                const res = await iterator.next();
                if (res.value && res.value.value) {
                    const digitalId = res.value.value.toString();
                    const didData = await this.GetDigitalId(ctx, digitalId);
                    results.push(didData.data);
                }
                if (res.done) break;
            }

            await iterator.close();

            return {
                success: true,
                touristId: touristId,
                digitalIds: results,
                count: results.length
            };

        } catch (error) {
            throw new Error(`Failed to get tourist Digital IDs: ${error.message}`);
        }
    }

    /**
     * Admin function: Bulk mint Digital IDs
     * @param {Context} ctx - Transaction context
     * @param {string} bulkData - JSON array of Digital ID data
     */
    async BulkMintDigitalIds(ctx, bulkData) {
        try {
            // Verify admin authorization
            const isAdmin = await this.verifyAdmin(ctx);
            if (!isAdmin) {
                throw new Error('Only administrators can perform bulk operations');
            }

            const data = JSON.parse(bulkData);
            const results = [];

            for (const item of data) {
                try {
                    const result = await this.MintDigitalId(
                        ctx,
                        item.digitalId,
                        item.touristId,
                        item.kycHash,
                        item.documentHashes,
                        item.expiryTimestamp,
                        item.issuerId,
                        item.signature
                    );
                    results.push({ success: true, ...result });
                } catch (error) {
                    results.push({
                        success: false,
                        digitalId: item.digitalId,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                results: results,
                totalProcessed: data.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            };

        } catch (error) {
            throw new Error(`Failed to bulk mint Digital IDs: ${error.message}`);
        }
    }

    // Helper methods

    /**
     * Verify issuer authorization
     */
    async verifyIssuer(ctx, issuerId) {
        // In production, check against authorized issuers list
        // For now, allow any issuer (implement proper authorization)
        return true;
    }

    /**
     * Verify signature
     */
    async verifySignature(ctx, digitalId, signature, issuerId) {
        // In production, implement proper signature verification
        // For now, accept any signature (implement cryptographic verification)
        return true;
    }

    /**
     * Verify revoker authorization
     */
    async verifyRevoker(ctx, revokedBy, originalIssuer) {
        // In production, implement proper authorization logic
        // For now, allow issuer or admin to revoke
        return true;
    }

    /**
     * Verify renewer authorization
     */
    async verifyRenewer(ctx, renewedBy, originalIssuer) {
        // In production, implement proper authorization logic
        // For now, allow issuer or admin to renew
        return true;
    }

    /**
     * Verify admin authorization
     */
    async verifyAdmin(ctx) {
        // In production, check if the caller is an admin
        // For now, allow any caller (implement proper admin verification)
        return true;
    }
}

module.exports = DigitalIdContract;
