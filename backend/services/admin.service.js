/**
 * Admin Service for Digital ID Management
 * 
 * This service provides administrative functions for:
 * - Bulk Digital ID operations
 * - System monitoring and health checks
 * - User management and verification
 * - Audit logging and compliance
 * - System configuration management
 */

const User = require('../models/User');
const FabricService = require('./fabric.service');
const KeyManagementService = require('./key-management.service');
const mongoose = require('mongoose');

class AdminService {
    constructor() {
        this.auditLog = [];
        this.maxAuditLogSize = 10000; // Maximum audit log entries
    }

    /**
     * Bulk mint Digital IDs for multiple users
     * @param {Array} users - Array of user data for Digital ID creation
     * @param {string} adminId - Admin performing the operation
     */
    async bulkMintDigitalIds(users, adminId = 'admin') {
        try {
            const results = [];
            const startTime = Date.now();

            this.logAudit('BULK_MINT_START', {
                adminId,
                userCount: users.length,
                timestamp: new Date().toISOString()
            });

            for (const userData of users) {
                try {
                    const { touristId, kycData, documents, expiryDays } = userData;

                    // Validate user exists
                    const user = await User.findById(touristId);
                    if (!user) {
                        results.push({
                            touristId,
                            success: false,
                            error: 'User not found'
                        });
                        continue;
                    }

                    // Check if user already has Digital ID
                    if (user.digitalId) {
                        results.push({
                            touristId,
                            success: false,
                            error: 'User already has Digital ID'
                        });
                        continue;
                    }

                    // Generate Digital ID
                    const digitalId = `DID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                    // Prepare blockchain data
                    const blockchainData = {
                        digitalId,
                        touristId,
                        kycData,
                        documents: documents || [],
                        expiryDays: expiryDays || 365,
                        issuerId: 'bulk-issuer'
                    };

                    // Mint on blockchain
                    const mintResult = await FabricService.mintDigitalId(blockchainData);

                    // Update user
                    user.digitalId = digitalId;
                    user.verificationLevel = Math.max(user.verificationLevel, 3);
                    await user.save();

                    results.push({
                        touristId,
                        digitalId,
                        success: true,
                        transactionId: mintResult.transactionId
                    });

                } catch (error) {
                    results.push({
                        touristId: userData.touristId,
                        success: false,
                        error: error.message
                    });
                }
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            this.logAudit('BULK_MINT_COMPLETE', {
                adminId,
                totalProcessed: users.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                duration: `${duration}ms`
            });

            return {
                success: true,
                results,
                summary: {
                    total: users.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                    duration: `${duration}ms`
                }
            };

        } catch (error) {
            this.logAudit('BULK_MINT_ERROR', {
                adminId,
                error: error.message
            });
            throw new Error(`Bulk mint operation failed: ${error.message}`);
        }
    }

    /**
     * Bulk revoke Digital IDs
     * @param {Array} digitalIds - Array of Digital IDs to revoke
     * @param {string} reason - Reason for revocation
     * @param {string} adminId - Admin performing the operation
     */
    async bulkRevokeDigitalIds(digitalIds, reason, adminId = 'admin') {
        try {
            const results = [];
            const startTime = Date.now();

            this.logAudit('BULK_REVOKE_START', {
                adminId,
                digitalIdCount: digitalIds.length,
                reason,
                timestamp: new Date().toISOString()
            });

            for (const digitalId of digitalIds) {
                try {
                    // Revoke on blockchain
                    const revokeResult = await FabricService.revokeDigitalId(digitalId, reason, adminId);

                    // Update user status
                    const user = await User.findOne({ digitalId });
                    if (user) {
                        user.verificationLevel = Math.max(user.verificationLevel - 1, 0);
                        await user.save();
                    }

                    results.push({
                        digitalId,
                        success: true,
                        transactionId: revokeResult.transactionId
                    });

                } catch (error) {
                    results.push({
                        digitalId,
                        success: false,
                        error: error.message
                    });
                }
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            this.logAudit('BULK_REVOKE_COMPLETE', {
                adminId,
                totalProcessed: digitalIds.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                duration: `${duration}ms`
            });

            return {
                success: true,
                results,
                summary: {
                    total: digitalIds.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                    duration: `${duration}ms`
                }
            };

        } catch (error) {
            this.logAudit('BULK_REVOKE_ERROR', {
                adminId,
                error: error.message
            });
            throw new Error(`Bulk revoke operation failed: ${error.message}`);
        }
    }

    /**
     * Get system health and status
     */
    async getSystemHealth() {
        try {
            const health = {
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                services: {}
            };

            // Database health
            try {
                const dbState = mongoose.connection.readyState;
                health.services.database = {
                    status: dbState === 1 ? 'connected' : 'disconnected',
                    readyState: dbState,
                    name: mongoose.connection.name
                };
            } catch (error) {
                health.services.database = {
                    status: 'error',
                    error: error.message
                };
            }

            // Blockchain health
            try {
                const blockchainStatus = await FabricService.getNetworkStatus();
                health.services.blockchain = blockchainStatus;
            } catch (error) {
                health.services.blockchain = {
                    connected: false,
                    error: error.message
                };
            }

            // Key management health
            try {
                const keyStatus = KeyManagementService.getKeyStatus();
                const keyValidation = KeyManagementService.validateKeyConfiguration();
                health.services.keyManagement = {
                    ...keyStatus,
                    validation: keyValidation
                };
            } catch (error) {
                health.services.keyManagement = {
                    error: error.message
                };
            }

            // User statistics
            try {
                const userStats = await this.getUserStatistics();
                health.services.users = userStats;
            } catch (error) {
                health.services.users = {
                    error: error.message
                };
            }

            // Calculate overall health
            const criticalServices = [
                health.services.database?.status === 'connected',
                health.services.blockchain?.connected,
                health.services.keyManagement?.encryptionKeyConfigured,
                health.services.keyManagement?.hmacSecretConfigured
            ];

            health.overallHealth = criticalServices.every(service => service) ? 'healthy' : 'degraded';
            health.criticalServicesCount = criticalServices.filter(service => service).length;
            health.totalCriticalServices = criticalServices.length;

            return health;

        } catch (error) {
            throw new Error(`System health check failed: ${error.message}`);
        }
    }

    /**
     * Get user statistics
     */
    async getUserStatistics() {
        try {
            const stats = await User.aggregate([
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        usersWithDigitalId: {
                            $sum: { $cond: [{ $ne: ['$digitalId', null] }, 1, 0] }
                        },
                        avgVerificationLevel: { $avg: '$verificationLevel' },
                        maxVerificationLevel: { $max: '$verificationLevel' },
                        minVerificationLevel: { $min: '$verificationLevel' }
                    }
                }
            ]);

            const verificationLevelStats = await User.aggregate([
                {
                    $group: {
                        _id: '$verificationLevel',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            return {
                ...stats[0] || {},
                verificationLevelDistribution: verificationLevelStats,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`User statistics failed: ${error.message}`);
        }
    }

    /**
     * Get audit log
     * @param {number} limit - Maximum number of entries to return
     * @param {string} type - Filter by audit type
     */
    getAuditLog(limit = 100, type = null) {
        try {
            let log = [...this.auditLog];

            if (type) {
                log = log.filter(entry => entry.type === type);
            }

            return {
                success: true,
                entries: log.slice(-limit),
                total: log.length,
                filtered: type ? true : false
            };

        } catch (error) {
            throw new Error(`Audit log retrieval failed: ${error.message}`);
        }
    }

    /**
     * Log audit event
     * @param {string} type - Audit event type
     * @param {Object} data - Audit data
     */
    logAudit(type, data) {
        try {
            const auditEntry = {
                type,
                timestamp: new Date().toISOString(),
                data,
                id: this.generateAuditId()
            };

            this.auditLog.push(auditEntry);

            // Maintain log size limit
            if (this.auditLog.length > this.maxAuditLogSize) {
                this.auditLog = this.auditLog.slice(-this.maxAuditLogSize);
            }

            console.log(`📋 Audit: ${type}`, data);

        } catch (error) {
            console.error('Audit logging failed:', error);
        }
    }

    /**
     * Generate unique audit ID
     */
    generateAuditId() {
        return `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get system configuration
     */
    getSystemConfiguration() {
        return {
            environment: process.env.NODE_ENV || 'development',
            port: process.env.PORT || 5000,
            database: {
                uri: process.env.MONGODB_URI ? 'configured' : 'not configured',
                connected: mongoose.connection.readyState === 1
            },
            blockchain: {
                channel: process.env.FABRIC_CHANNEL_NAME || 'not configured',
                chaincode: process.env.FABRIC_CHAINCODE_NAME || 'not configured',
                connected: false // Will be updated by FabricService
            },
            security: {
                jwt: !!process.env.JWT_SECRET,
                jwtRefresh: !!process.env.JWT_REFRESH_SECRET,
                encryption: !!process.env.ENCRYPTION_KEY,
                hmac: !!process.env.HMAC_SECRET
            },
            apis: {
                aadhaar: !!process.env.AADHAAR_LICENSE_KEY,
                digilocker: !!process.env.DIGILOCKER_CLIENT_ID,
                apiSetu: !!process.env.API_SETU_CLIENT_ID
            },
            storage: {
                supabase: !!process.env.SUPABASE_URL,
                localUploads: true
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate system configuration
     */
    validateSystemConfiguration() {
        const issues = [];
        const warnings = [];

        // Critical configuration checks
        if (!process.env.JWT_SECRET) {
            issues.push('JWT_SECRET is required');
        }
        if (!process.env.JWT_REFRESH_SECRET) {
            issues.push('JWT_REFRESH_SECRET is required');
        }
        if (!process.env.ENCRYPTION_KEY) {
            issues.push('ENCRYPTION_KEY is required');
        }
        if (!process.env.HMAC_SECRET) {
            issues.push('HMAC_SECRET is required');
        }

        // Database checks
        if (!process.env.MONGODB_URI) {
            issues.push('MONGODB_URI is required');
        }

        // Optional but recommended
        if (!process.env.FABRIC_CHANNEL_NAME) {
            warnings.push('FABRIC_CHANNEL_NAME not configured - blockchain features disabled');
        }
        if (!process.env.AADHAAR_LICENSE_KEY) {
            warnings.push('AADHAAR_LICENSE_KEY not configured - Aadhaar verification in mock mode');
        }
        if (!process.env.SUPABASE_URL) {
            warnings.push('SUPABASE_URL not configured - using local file storage');
        }

        return {
            valid: issues.length === 0,
            issues,
            warnings,
            criticalIssues: issues.length,
            warningsCount: warnings.length,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate system report
     */
    async generateSystemReport() {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                systemHealth: await this.getSystemHealth(),
                configuration: this.getSystemConfiguration(),
                configurationValidation: this.validateSystemConfiguration(),
                userStatistics: await this.getUserStatistics(),
                recentAuditLog: this.getAuditLog(50)
            };

            return {
                success: true,
                report
            };

        } catch (error) {
            throw new Error(`System report generation failed: ${error.message}`);
        }
    }
}

// Export singleton instance
module.exports = new AdminService();
