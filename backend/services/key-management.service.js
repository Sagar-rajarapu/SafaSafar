/**
 * Key Management Service
 * 
 * This service handles cryptographic operations for Digital ID management:
 * - Secure key generation and storage
 * - Digital signatures for blockchain transactions
 * - HMAC-based authentication
 * - Encryption/decryption of sensitive data
 * - Key rotation and management
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class KeyManagementService {
    constructor() {
        this.encryptionKey = process.env.ENCRYPTION_KEY;
        this.hmacSecret = process.env.HMAC_SECRET;
        this.keyStorePath = process.env.KEY_STORE_PATH || './keys';
        this.ensureKeyStore();
    }

    /**
     * Ensure key store directory exists
     */
    ensureKeyStore() {
        if (!fs.existsSync(this.keyStorePath)) {
            fs.mkdirSync(this.keyStorePath, { recursive: true });
            console.log(`✅ Key store directory created: ${this.keyStorePath}`);
        }
    }

    /**
     * Generate a new encryption key
     * @param {number} length - Key length in bytes (default: 32)
     */
    generateEncryptionKey(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate a new HMAC secret
     * @param {number} length - Secret length in bytes (default: 64)
     */
    generateHmacSecret(length = 64) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Encrypt sensitive data
     * @param {string} data - Data to encrypt
     * @param {string} key - Encryption key (optional, uses default if not provided)
     */
    encrypt(data, key = null) {
        try {
            const encryptionKey = key || this.encryptionKey;
            if (!encryptionKey) {
                throw new Error('No encryption key available');
            }

            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
            
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                algorithm: 'aes-256-cbc'
            };
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt sensitive data
     * @param {string} encryptedData - Encrypted data
     * @param {string} iv - Initialization vector
     * @param {string} key - Decryption key (optional, uses default if not provided)
     */
    decrypt(encryptedData, iv, key = null) {
        try {
            const encryptionKey = key || this.encryptionKey;
            if (!encryptionKey) {
                throw new Error('No encryption key available');
            }

            const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
            
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    /**
     * Generate HMAC signature
     * @param {string} data - Data to sign
     * @param {string} secret - HMAC secret (optional, uses default if not provided)
     */
    generateHmac(data, secret = null) {
        try {
            const hmacSecret = secret || this.hmacSecret;
            if (!hmacSecret) {
                throw new Error('No HMAC secret available');
            }

            return crypto.createHmac('sha256', hmacSecret)
                .update(data)
                .digest('hex');
        } catch (error) {
            throw new Error(`HMAC generation failed: ${error.message}`);
        }
    }

    /**
     * Verify HMAC signature
     * @param {string} data - Original data
     * @param {string} signature - HMAC signature to verify
     * @param {string} secret - HMAC secret (optional, uses default if not provided)
     */
    verifyHmac(data, signature, secret = null) {
        try {
            const expectedSignature = this.generateHmac(data, secret);
            return crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate digital signature for blockchain transactions
     * @param {string} digitalId - Digital ID
     * @param {string} kycHash - KYC hash
     * @param {string} issuerId - Issuer ID
     * @param {string} timestamp - Transaction timestamp
     */
    generateDigitalSignature(digitalId, kycHash, issuerId, timestamp = null) {
        try {
            const ts = timestamp || Date.now().toString();
            const data = `${digitalId}:${kycHash}:${issuerId}:${ts}`;
            
            // Use HMAC for signature (in production, use proper digital signatures)
            const signature = this.generateHmac(data);
            
            return {
                signature,
                timestamp: ts,
                data,
                algorithm: 'HMAC-SHA256'
            };
        } catch (error) {
            throw new Error(`Digital signature generation failed: ${error.message}`);
        }
    }

    /**
     * Verify digital signature
     * @param {string} digitalId - Digital ID
     * @param {string} kycHash - KYC hash
     * @param {string} issuerId - Issuer ID
     * @param {string} signature - Signature to verify
     * @param {string} timestamp - Original timestamp
     */
    verifyDigitalSignature(digitalId, kycHash, issuerId, signature, timestamp) {
        try {
            const data = `${digitalId}:${kycHash}:${issuerId}:${timestamp}`;
            return this.verifyHmac(data, signature);
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate hash for privacy-preserving storage
     * @param {string} data - Data to hash
     * @param {string} algorithm - Hash algorithm (default: sha256)
     */
    generateHash(data, algorithm = 'sha256') {
        return crypto.createHash(algorithm).update(data).digest('hex');
    }

    /**
     * Generate secure random token
     * @param {number} length - Token length in bytes (default: 32)
     */
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate key pair for asymmetric encryption (if needed)
     */
    generateKeyPair() {
        try {
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });

            return {
                publicKey,
                privateKey
            };
        } catch (error) {
            throw new Error(`Key pair generation failed: ${error.message}`);
        }
    }

    /**
     * Store key securely
     * @param {string} keyName - Name of the key
     * @param {string} keyData - Key data to store
     * @param {boolean} encrypt - Whether to encrypt the stored key
     */
    storeKey(keyName, keyData, encrypt = true) {
        try {
            const keyPath = path.join(this.keyStorePath, `${keyName}.key`);
            
            let dataToStore = keyData;
            if (encrypt && this.encryptionKey) {
                const encrypted = this.encrypt(keyData);
                dataToStore = JSON.stringify(encrypted);
            }
            
            fs.writeFileSync(keyPath, dataToStore, { mode: 0o600 });
            console.log(`✅ Key stored securely: ${keyName}`);
            
            return { success: true, keyPath };
        } catch (error) {
            throw new Error(`Key storage failed: ${error.message}`);
        }
    }

    /**
     * Retrieve stored key
     * @param {string} keyName - Name of the key
     * @param {boolean} decrypt - Whether to decrypt the retrieved key
     */
    retrieveKey(keyName, decrypt = true) {
        try {
            const keyPath = path.join(this.keyStorePath, `${keyName}.key`);
            
            if (!fs.existsSync(keyPath)) {
                throw new Error(`Key not found: ${keyName}`);
            }
            
            const keyData = fs.readFileSync(keyPath, 'utf8');
            
            if (decrypt && this.encryptionKey) {
                try {
                    const encryptedData = JSON.parse(keyData);
                    return this.decrypt(encryptedData.encrypted, encryptedData.iv);
                } catch (parseError) {
                    // If parsing fails, assume it's not encrypted
                    return keyData;
                }
            }
            
            return keyData;
        } catch (error) {
            throw new Error(`Key retrieval failed: ${error.message}`);
        }
    }

    /**
     * Rotate encryption key
     * @param {string} newKey - New encryption key
     */
    rotateEncryptionKey(newKey) {
        try {
            if (!newKey) {
                newKey = this.generateEncryptionKey();
            }
            
            // Store old key for migration
            const oldKey = this.encryptionKey;
            if (oldKey) {
                this.storeKey('old_encryption_key', oldKey, false);
            }
            
            // Update current key
            this.encryptionKey = newKey;
            this.storeKey('current_encryption_key', newKey, false);
            
            console.log('✅ Encryption key rotated successfully');
            return { success: true, newKey };
        } catch (error) {
            throw new Error(`Key rotation failed: ${error.message}`);
        }
    }

    /**
     * Rotate HMAC secret
     * @param {string} newSecret - New HMAC secret
     */
    rotateHmacSecret(newSecret) {
        try {
            if (!newSecret) {
                newSecret = this.generateHmacSecret();
            }
            
            // Store old secret for migration
            const oldSecret = this.hmacSecret;
            if (oldSecret) {
                this.storeKey('old_hmac_secret', oldSecret, false);
            }
            
            // Update current secret
            this.hmacSecret = newSecret;
            this.storeKey('current_hmac_secret', newSecret, false);
            
            console.log('✅ HMAC secret rotated successfully');
            return { success: true, newSecret };
        } catch (error) {
            throw new Error(`HMAC secret rotation failed: ${error.message}`);
        }
    }

    /**
     * Get key management status
     */
    getKeyStatus() {
        return {
            encryptionKeyConfigured: !!this.encryptionKey,
            hmacSecretConfigured: !!this.hmacSecret,
            keyStorePath: this.keyStorePath,
            keyStoreExists: fs.existsSync(this.keyStorePath),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate key configuration
     */
    validateKeyConfiguration() {
        const issues = [];
        
        if (!this.encryptionKey) {
            issues.push('Encryption key not configured');
        } else if (this.encryptionKey.length < 32) {
            issues.push('Encryption key too short (minimum 32 characters)');
        }
        
        if (!this.hmacSecret) {
            issues.push('HMAC secret not configured');
        } else if (this.hmacSecret.length < 32) {
            issues.push('HMAC secret too short (minimum 32 characters)');
        }
        
        return {
            valid: issues.length === 0,
            issues,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate secure environment variables
     */
    generateSecureEnvironment() {
        return {
            ENCRYPTION_KEY: this.generateEncryptionKey(),
            HMAC_SECRET: this.generateHmacSecret(),
            JWT_SECRET: this.generateSecureToken(64),
            JWT_REFRESH_SECRET: this.generateSecureToken(64)
        };
    }
}

// Export singleton instance
module.exports = new KeyManagementService();
