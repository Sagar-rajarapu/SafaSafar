import {Platform, Alert} from 'react-native';

export interface BiometricConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'iris' | 'voice' | 'none';
  fallbackEnabled: boolean;
  fallbackType: 'pin' | 'password' | 'pattern';
  maxAttempts: number;
  lockoutDuration: number; // minutes
  autoLockEnabled: boolean;
  autoLockTimeout: number; // minutes
}

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: string;
  attemptsRemaining?: number;
  isLocked?: boolean;
  lockoutUntil?: Date;
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  supportedTypes: string[];
  hasFingerprint: boolean;
  hasFace: boolean;
  hasIris: boolean;
  hasVoice: boolean;
  isEnrolled: boolean;
  isSecure: boolean;
}

class BiometricServiceClass {
  private config: BiometricConfig = {
    enabled: true,
    type: 'fingerprint',
    fallbackEnabled: true,
    fallbackType: 'pin',
    maxAttempts: 5,
    lockoutDuration: 5, // 5 minutes
    autoLockEnabled: true,
    autoLockTimeout: 5, // 5 minutes
  };

  private capabilities: BiometricCapabilities = {
    isAvailable: false,
    supportedTypes: [],
    hasFingerprint: false,
    hasFace: false,
    hasIris: false,
    hasVoice: false,
    isEnrolled: false,
    isSecure: false,
  };

  private failedAttempts = 0;
  private isLocked = false;
  private lockoutUntil: Date | null = null;
  private lastActivity: Date | null = null;

  async initialize() {
    try {
      await this.loadConfiguration();
      await this.checkCapabilities();
      await this.setupAutoLock();
      console.log('BiometricService initialized successfully');
    } catch (error) {
      console.error('BiometricService initialization failed:', error);
    }
  }

  private async loadConfiguration() {
    try {
      // Mock configuration loading
      // In real implementation, this would load from secure storage
      console.log('Biometric configuration loaded');
    } catch (error) {
      console.error('Failed to load biometric configuration:', error);
    }
  }

  private async checkCapabilities(): Promise<void> {
    try {
      // Mock capability check
      // In real implementation, this would use actual biometric APIs
      this.capabilities = {
        isAvailable: Platform.OS === 'android' || Platform.OS === 'ios',
        supportedTypes:
          Platform.OS === 'android'
            ? ['fingerprint', 'face']
            : ['face', 'fingerprint'],
        hasFingerprint: true,
        hasFace: Platform.OS === 'ios' || Platform.OS === 'android',
        hasIris: false,
        hasVoice: false,
        isEnrolled: true, // Mock enrolled state
        isSecure: true,
      };
    } catch (error) {
      console.error('Failed to check biometric capabilities:', error);
    }
  }

  private setupAutoLock(): void {
    if (!this.config.autoLockEnabled) return;

    setInterval(() => {
      if (this.lastActivity) {
        const now = new Date();
        const idleTime =
          (now.getTime() - this.lastActivity.getTime()) / (1000 * 60); // minutes

        if (idleTime > this.config.autoLockTimeout) {
          this.lockApp();
        }
      }
    }, 60000); // Check every minute
  }

  // Check if biometric authentication is available
  async isBiometricAvailable(): Promise<boolean> {
    return this.capabilities.isAvailable && this.capabilities.isEnrolled;
  }

  // Get supported biometric types
  getSupportedTypes(): string[] {
    return this.capabilities.supportedTypes;
  }

  // Get capabilities
  getCapabilities(): BiometricCapabilities {
    return {...this.capabilities};
  }

  // Authenticate with biometrics
  async authenticate(
    reason: string = 'Authenticate to access SafeSafar',
  ): Promise<BiometricResult> {
    try {
      // Check if locked
      if (
        this.isLocked &&
        this.lockoutUntil &&
        new Date() < this.lockoutUntil
      ) {
        return {
          success: false,
          error: 'Biometric authentication is locked',
          isLocked: true,
          lockoutUntil: this.lockoutUntil,
        };
      }

      // Check if biometric is available
      if (!(await this.isBiometricAvailable())) {
        return {
          success: false,
          error: 'Biometric authentication not available',
        };
      }

      // Mock biometric authentication
      const result = await this.performBiometricAuth(reason);

      if (result.success) {
        this.failedAttempts = 0;
        this.isLocked = false;
        this.lockoutUntil = null;
        this.lastActivity = new Date();
        this.updateActivity();
      } else {
        this.failedAttempts++;

        if (this.failedAttempts >= this.config.maxAttempts) {
          this.lockBiometric();
        }
      }

      return {
        ...result,
        attemptsRemaining: this.config.maxAttempts - this.failedAttempts,
        isLocked: this.isLocked,
        lockoutUntil: this.lockoutUntil || undefined,
      };
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  private async performBiometricAuth(
    _reason: string,
  ): Promise<BiometricResult> {
    // Mock biometric authentication
    // In real implementation, this would use actual biometric APIs
    return new Promise(resolve => {
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate for demo

        if (success) {
          resolve({
            success: true,
            biometricType: this.config.type,
          });
        } else {
          resolve({
            success: false,
            error: 'Biometric authentication failed',
          });
        }
      }, 2000);
    });
  }

  // Authenticate with fallback method
  async authenticateWithFallback(
    reason: string = 'Authenticate to access SafeSafar',
  ): Promise<BiometricResult> {
    try {
      // Try biometric first
      const biometricResult = await this.authenticate(reason);

      if (biometricResult.success) {
        return biometricResult;
      }

      // If biometric fails and fallback is enabled, try fallback
      if (this.config.fallbackEnabled) {
        return await this.performFallbackAuth();
      }

      return biometricResult;
    } catch (error) {
      console.error('Fallback authentication failed:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  private async performFallbackAuth(): Promise<BiometricResult> {
    // Mock fallback authentication
    // In real implementation, this would show PIN/password/pattern input
    return new Promise(resolve => {
      Alert.alert(
        'Fallback Authentication',
        `Please enter your ${this.config.fallbackType.toUpperCase()}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({success: false, error: 'Cancelled'}),
          },
          {
            text: 'OK',
            onPress: () =>
              resolve({success: true, biometricType: this.config.fallbackType}),
          },
        ],
      );
    });
  }

  // Lock biometric authentication
  private lockBiometric(): void {
    this.isLocked = true;
    this.lockoutUntil = new Date(
      Date.now() + this.config.lockoutDuration * 60 * 1000,
    );
    console.log(
      'Biometric authentication locked due to too many failed attempts',
    );
  }

  // Lock app
  private lockApp(): void {
    this.lastActivity = null;
    console.log('App locked due to inactivity');
    // In real implementation, this would trigger app lock screen
  }

  // Update activity timestamp
  updateActivity(): void {
    this.lastActivity = new Date();
  }

  // Check if app is locked
  isAppLocked(): boolean {
    if (!this.lastActivity) return true;

    const now = new Date();
    const idleTime =
      (now.getTime() - this.lastActivity.getTime()) / (1000 * 60); // minutes

    return idleTime > this.config.autoLockTimeout;
  }

  // Unlock app
  async unlockApp(): Promise<BiometricResult> {
    if (!this.isAppLocked()) {
      return {success: true};
    }

    return await this.authenticateWithFallback('Unlock SafeSafar');
  }

  // Enroll biometric
  async enrollBiometric(): Promise<BiometricResult> {
    try {
      if (!this.capabilities.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not supported on this device',
        };
      }

      // Mock enrollment process
      // In real implementation, this would guide user through enrollment
      return new Promise(resolve => {
        Alert.alert(
          'Enroll Biometric',
          'Please follow the on-screen instructions to enroll your biometric data.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () =>
                resolve({success: false, error: 'Enrollment cancelled'}),
            },
            {
              text: 'Start',
              onPress: () => {
                setTimeout(() => {
                  resolve({success: true, biometricType: this.config.type});
                }, 3000);
              },
            },
          ],
        );
      });
    } catch (error) {
      console.error('Biometric enrollment failed:', error);
      return {
        success: false,
        error: 'Enrollment failed',
      };
    }
  }

  // Remove biometric enrollment
  async removeBiometric(): Promise<BiometricResult> {
    try {
      // Mock removal process
      // In real implementation, this would remove biometric data
      this.capabilities.isEnrolled = false;

      return {
        success: true,
        biometricType: this.config.type,
      };
    } catch (error) {
      console.error('Biometric removal failed:', error);
      return {
        success: false,
        error: 'Removal failed',
      };
    }
  }

  // Update configuration
  async updateConfiguration(updates: Partial<BiometricConfig>): Promise<void> {
    this.config = {...this.config, ...updates};

    // Restart auto-lock if timeout changed
    if (updates.autoLockTimeout) {
      this.setupAutoLock();
    }
  }

  // Get configuration
  getConfiguration(): BiometricConfig {
    return {...this.config};
  }

  // Get lock status
  getLockStatus(): {
    isLocked: boolean;
    lockoutUntil: Date | null;
    attemptsRemaining: number;
  } {
    return {
      isLocked: this.isLocked,
      lockoutUntil: this.lockoutUntil,
      attemptsRemaining: this.config.maxAttempts - this.failedAttempts,
    };
  }

  // Reset failed attempts
  resetFailedAttempts(): void {
    this.failedAttempts = 0;
    this.isLocked = false;
    this.lockoutUntil = null;
  }

  // Check if specific biometric type is supported
  isTypeSupported(type: string): boolean {
    return this.capabilities.supportedTypes.includes(type);
  }

  // Get recommended biometric type
  getRecommendedType(): string {
    if (this.capabilities.hasFace) return 'face';
    if (this.capabilities.hasFingerprint) return 'fingerprint';
    if (this.capabilities.hasIris) return 'iris';
    if (this.capabilities.hasVoice) return 'voice';
    return 'none';
  }

  // Validate biometric configuration
  validateConfiguration(): {isValid: boolean; errors: string[]} {
    const errors: string[] = [];

    if (this.config.enabled && !this.capabilities.isAvailable) {
      errors.push('Biometric authentication is not available on this device');
    }

    if (this.config.enabled && !this.capabilities.isEnrolled) {
      errors.push('No biometric data is enrolled');
    }

    if (this.config.maxAttempts < 1 || this.config.maxAttempts > 10) {
      errors.push('Max attempts must be between 1 and 10');
    }

    if (this.config.lockoutDuration < 1 || this.config.lockoutDuration > 60) {
      errors.push('Lockout duration must be between 1 and 60 minutes');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const BiometricService = new BiometricServiceClass();
