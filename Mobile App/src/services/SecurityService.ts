import AsyncStorage from '@react-native-async-storage/async-storage';
// import {Platform} from 'react-native';
import CryptoJS from 'crypto-js';

export interface SecurityConfig {
  encryptionKey: string;
  hashSalt: string;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  biometricEnabled: boolean;
  autoLockEnabled: boolean;
  autoLockTimeout: number; // minutes
  auditLogging: boolean;
  dataRetentionDays: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityMetrics {
  totalLoginAttempts: number;
  failedLoginAttempts: number;
  lastLoginAttempt: Date;
  accountLocked: boolean;
  lockoutUntil?: Date;
  suspiciousActivities: number;
  lastSecurityCheck: Date;
}

class SecurityServiceClass {
  private config: SecurityConfig = {
    encryptionKey: this.generateEncryptionKey(),
    hashSalt: this.generateSalt(),
    sessionTimeout: 30, // 30 minutes
    maxLoginAttempts: 5,
    biometricEnabled: true,
    autoLockEnabled: true,
    autoLockTimeout: 5, // 5 minutes
    auditLogging: true,
    dataRetentionDays: 90,
  };

  private securityMetrics: SecurityMetrics = {
    totalLoginAttempts: 0,
    failedLoginAttempts: 0,
    lastLoginAttempt: new Date(),
    accountLocked: false,
    suspiciousActivities: 0,
    lastSecurityCheck: new Date(),
  };

  private sessionStartTime: Date | null = null;
  private isSessionActive = false;

  async initialize() {
    try {
      await this.loadSecurityConfig();
      await this.loadSecurityMetrics();
      await this.initializeBiometricAuth();
      await this.setupAutoLock();
      console.log('SecurityService initialized successfully');
    } catch (error) {
      console.error('SecurityService initialization failed:', error);
    }
  }

  private generateEncryptionKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  private generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
  }

  private async loadSecurityConfig() {
    try {
      const config = await AsyncStorage.getItem('securityConfig');
      if (config) {
        this.config = {...this.config, ...JSON.parse(config)};
      }
    } catch (error) {
      console.error('Failed to load security config:', error);
    }
  }

  private async saveSecurityConfig() {
    try {
      await AsyncStorage.setItem('securityConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save security config:', error);
    }
  }

  private async loadSecurityMetrics() {
    try {
      const metrics = await AsyncStorage.getItem('securityMetrics');
      if (metrics) {
        const parsed = JSON.parse(metrics);
        this.securityMetrics = {
          ...parsed,
          lastLoginAttempt: new Date(parsed.lastLoginAttempt),
          lockoutUntil: parsed.lockoutUntil
            ? new Date(parsed.lockoutUntil)
            : undefined,
          lastSecurityCheck: new Date(parsed.lastSecurityCheck),
        };
      }
    } catch (error) {
      console.error('Failed to load security metrics:', error);
    }
  }

  private async saveSecurityMetrics() {
    try {
      await AsyncStorage.setItem(
        'securityMetrics',
        JSON.stringify(this.securityMetrics),
      );
    } catch (error) {
      console.error('Failed to save security metrics:', error);
    }
  }

  // Encryption/Decryption Methods
  encryptData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(
        jsonString,
        this.config.encryptionKey,
      ).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decryptData(encryptedData: string): any {
    try {
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData,
        this.config.encryptionKey,
      );
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hashing Methods
  hashPassword(password: string): string {
    return CryptoJS.PBKDF2(password, this.config.hashSalt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();
  }

  hashData(data: string): string {
    return CryptoJS.SHA256(data + this.config.hashSalt).toString();
  }

  // Session Management
  startSession(): void {
    this.sessionStartTime = new Date();
    this.isSessionActive = true;
    this.logSecurityEvent('session_started', 'authentication', {});
  }

  endSession(): void {
    this.sessionStartTime = null;
    this.isSessionActive = false;
    this.logSecurityEvent('session_ended', 'authentication', {});
  }

  isSessionValid(): boolean {
    if (!this.isSessionActive || !this.sessionStartTime) {
      return false;
    }

    const now = new Date();
    const sessionDuration =
      (now.getTime() - this.sessionStartTime.getTime()) / (1000 * 60); // minutes

    if (sessionDuration > this.config.sessionTimeout) {
      this.endSession();
      return false;
    }

    return true;
  }

  // Biometric Authentication
  private async initializeBiometricAuth(): Promise<void> {
    if (!this.config.biometricEnabled) return;

    try {
      // Mock biometric initialization
      // In real implementation, this would use react-native-biometrics or similar
      console.log('Biometric authentication initialized');
    } catch (error) {
      console.error('Biometric authentication initialization failed:', error);
    }
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    if (!this.config.biometricEnabled) return false;

    try {
      // Mock biometric authentication
      // In real implementation, this would use actual biometric APIs
      return new Promise(resolve => {
        setTimeout(() => {
          const success = Math.random() > 0.1; // 90% success rate for demo
          this.logSecurityEvent('biometric_auth', 'authentication', {success});
          resolve(success);
        }, 1000);
      });
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  // Auto-lock functionality
  private setupAutoLock(): void {
    if (!this.config.autoLockEnabled) return;

    // Set up auto-lock timer
    setInterval(() => {
      if (this.isSessionActive && this.sessionStartTime) {
        const now = new Date();
        const idleTime =
          (now.getTime() - this.sessionStartTime.getTime()) / (1000 * 60); // minutes

        if (idleTime > this.config.autoLockTimeout) {
          this.autoLock();
        }
      }
    }, 60000); // Check every minute
  }

  private autoLock(): void {
    this.endSession();
    this.logSecurityEvent('auto_lock', 'security', {});
    // In real implementation, this would trigger app lock screen
  }

  // Login Security
  async validateLoginAttempt(
    email: string,
    password: string,
  ): Promise<{success: boolean; reason?: string}> {
    this.securityMetrics.totalLoginAttempts++;
    this.securityMetrics.lastLoginAttempt = new Date();

    // Check if account is locked
    if (this.securityMetrics.accountLocked) {
      if (
        this.securityMetrics.lockoutUntil &&
        new Date() < this.securityMetrics.lockoutUntil
      ) {
        this.logSecurityEvent('login_attempt_blocked', 'authentication', {
          reason: 'account_locked',
          email,
        });
        return {success: false, reason: 'Account is temporarily locked'};
      } else {
        // Unlock account if lockout period has expired
        this.securityMetrics.accountLocked = false;
        this.securityMetrics.lockoutUntil = undefined;
        this.securityMetrics.failedLoginAttempts = 0;
      }
    }

    // Validate credentials (mock implementation)
    const isValid = await this.validateCredentials(email, password);

    if (isValid) {
      this.securityMetrics.failedLoginAttempts = 0;
      this.startSession();
      this.logSecurityEvent('login_success', 'authentication', {email});
      await this.saveSecurityMetrics();
      return {success: true};
    } else {
      this.securityMetrics.failedLoginAttempts++;
      this.logSecurityEvent('login_failed', 'authentication', {
        email,
        attempt: this.securityMetrics.failedLoginAttempts,
      });

      // Lock account after max attempts
      if (
        this.securityMetrics.failedLoginAttempts >= this.config.maxLoginAttempts
      ) {
        this.securityMetrics.accountLocked = true;
        this.securityMetrics.lockoutUntil = new Date(
          Date.now() + 15 * 60 * 1000,
        ); // 15 minutes
        this.logSecurityEvent('account_locked', 'security', {
          email,
          reason: 'max_attempts_exceeded',
        });
      }

      await this.saveSecurityMetrics();
      return {
        success: false,
        reason: `Invalid credentials. ${
          this.config.maxLoginAttempts -
          this.securityMetrics.failedLoginAttempts
        } attempts remaining.`,
      };
    }
  }

  private async validateCredentials(
    email: string,
    password: string,
  ): Promise<boolean> {
    // Mock credential validation
    // In real implementation, this would validate against secure backend
    return new Promise(resolve => {
      setTimeout(() => {
        const isValid =
          email === 'demo@example.com' && password === 'password123';
        resolve(isValid);
      }, 1000);
    });
  }

  // Audit Logging
  private async logSecurityEvent(
    action: string,
    resource: string,
    details: Record<string, any>,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low',
  ): Promise<void> {
    if (!this.config.auditLogging) return;

    const auditLog: AuditLog = {
      id: this.generateAuditId(),
      userId: 'current_user', // In real implementation, get from auth context
      action,
      resource,
      timestamp: new Date(),
      success: details.success !== false,
      details,
      riskLevel,
    };

    try {
      const existingLogs = await this.getAuditLogs();
      existingLogs.push(auditLog);

      // Keep only last 1000 logs
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }

      await AsyncStorage.setItem('auditLogs', this.encryptData(existingLogs));
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const encryptedLogs = await AsyncStorage.getItem('auditLogs');
      if (encryptedLogs) {
        return this.decryptData(encryptedLogs);
      }
      return [];
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  // Data Sanitization
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;]/g, '') // Remove semicolons
      .trim();
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): {isValid: boolean; errors: string[]} {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Security Monitoring
  async performSecurityCheck(): Promise<{score: number; issues: string[]}> {
    const issues: string[] = [];
    let score = 100;

    // Check session validity
    if (!this.isSessionValid()) {
      issues.push('Session expired');
      score -= 20;
    }

    // Check for suspicious activities
    if (this.securityMetrics.suspiciousActivities > 5) {
      issues.push('High number of suspicious activities detected');
      score -= 30;
    }

    // Check failed login attempts
    if (this.securityMetrics.failedLoginAttempts > 3) {
      issues.push('Multiple failed login attempts');
      score -= 25;
    }

    // Check account lock status
    if (this.securityMetrics.accountLocked) {
      issues.push('Account is locked');
      score -= 50;
    }

    this.securityMetrics.lastSecurityCheck = new Date();
    await this.saveSecurityMetrics();

    return {score: Math.max(0, score), issues};
  }

  // Data Retention
  async cleanupOldData(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.dataRetentionDays);

      // Clean up old audit logs
      const auditLogs = await this.getAuditLogs();
      const filteredLogs = auditLogs.filter(log => log.timestamp > cutoffDate);
      await AsyncStorage.setItem('auditLogs', this.encryptData(filteredLogs));

      console.log('Old data cleanup completed');
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }
  }

  // Utility Methods
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSecurityMetrics(): SecurityMetrics {
    return {...this.securityMetrics};
  }

  getSecurityConfig(): SecurityConfig {
    return {...this.config};
  }

  async updateSecurityConfig(updates: Partial<SecurityConfig>): Promise<void> {
    this.config = {...this.config, ...updates};
    await this.saveSecurityConfig();
  }

  // Secure Storage
  async storeSecureData(key: string, data: any): Promise<void> {
    try {
      const encryptedData = this.encryptData(data);
      await AsyncStorage.setItem(`secure_${key}`, encryptedData);
    } catch (error) {
      console.error('Failed to store secure data:', error);
      throw error;
    }
  }

  async getSecureData(key: string): Promise<any> {
    try {
      const encryptedData = await AsyncStorage.getItem(`secure_${key}`);
      if (encryptedData) {
        return this.decryptData(encryptedData);
      }
      return null;
    } catch (error) {
      console.error('Failed to get secure data:', error);
      return null;
    }
  }

  async removeSecureData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error('Failed to remove secure data:', error);
    }
  }
}

export const SecurityService = new SecurityServiceClass();
