import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform, Alert, Linking} from 'react-native';

export interface NotificationConfig {
  enabled: boolean;
  emergencyNotifications: boolean;
  safetyAlerts: boolean;
  geoFenceAlerts: boolean;
  anomalyAlerts: boolean;
  systemUpdates: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'emergency' | 'safety' | 'geo_fence' | 'anomaly' | 'system' | 'info';
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata: Record<string, any>;
  expiresAt?: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: NotificationData['type'];
  priority: NotificationData['priority'];
  variables: string[];
}

class NotificationServiceClass {
  private config: NotificationConfig = {
    enabled: true,
    emergencyNotifications: true,
    safetyAlerts: true,
    geoFenceAlerts: true,
    anomalyAlerts: true,
    systemUpdates: true,
    soundEnabled: true,
    vibrationEnabled: true,
    priority: 'normal',
  };

  private notificationHistory: NotificationData[] = [];
  private templates: NotificationTemplate[] = [];

  async initialize() {
    try {
      await this.loadConfiguration();
      await this.loadNotificationHistory();
      await this.loadTemplates();
      await this.setupNotificationChannels();
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('NotificationService initialization failed:', error);
    }
  }

  private async loadConfiguration() {
    try {
      const config = await AsyncStorage.getItem('notificationConfig');
      if (config) {
        this.config = {...this.config, ...JSON.parse(config)};
      }
    } catch (error) {
      console.error('Failed to load notification config:', error);
    }
  }

  private async saveConfiguration() {
    try {
      await AsyncStorage.setItem(
        'notificationConfig',
        JSON.stringify(this.config),
      );
    } catch (error) {
      console.error('Failed to save notification config:', error);
    }
  }

  private async loadNotificationHistory() {
    try {
      const history = await AsyncStorage.getItem('notificationHistory');
      if (history) {
        this.notificationHistory = JSON.parse(history).map(
          (notification: any) => ({
            ...notification,
            timestamp: new Date(notification.timestamp),
            expiresAt: notification.expiresAt
              ? new Date(notification.expiresAt)
              : undefined,
          }),
        );
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  }

  private async saveNotificationHistory() {
    try {
      await AsyncStorage.setItem(
        'notificationHistory',
        JSON.stringify(this.notificationHistory),
      );
    } catch (error) {
      console.error('Failed to save notification history:', error);
    }
  }

  private async loadTemplates() {
    try {
      const templates = await AsyncStorage.getItem('notificationTemplates');
      if (templates) {
        this.templates = JSON.parse(templates);
      } else {
        await this.initializeDefaultTemplates();
      }
    } catch (error) {
      console.error('Failed to load notification templates:', error);
    }
  }

  private async saveTemplates() {
    try {
      await AsyncStorage.setItem(
        'notificationTemplates',
        JSON.stringify(this.templates),
      );
    } catch (error) {
      console.error('Failed to save notification templates:', error);
    }
  }

  private async initializeDefaultTemplates() {
    this.templates = [
      {
        id: 'emergency_panic',
        name: 'Emergency Panic Alert',
        title: '🚨 EMERGENCY ALERT',
        message:
          'Panic button activated by {userName} at {location}. Immediate response required.',
        type: 'emergency',
        priority: 'critical',
        variables: ['userName', 'location'],
      },
      {
        id: 'safety_score_high',
        name: 'High Safety Risk',
        title: '⚠️ Safety Alert',
        message:
          'Your safety score is {score}. Please move to a safer location.',
        type: 'safety',
        priority: 'high',
        variables: ['score'],
      },
      {
        id: 'geo_fence_enter',
        name: 'Geo-fence Entry',
        title: '📍 Zone Alert',
        message: 'You have entered {zoneName}. {alertMessage}',
        type: 'geo_fence',
        priority: 'normal',
        variables: ['zoneName', 'alertMessage'],
      },
      {
        id: 'anomaly_detected',
        name: 'Anomaly Detected',
        title: '🔍 Anomaly Alert',
        message:
          'Unusual activity detected: {anomalyType}. Please verify your safety.',
        type: 'anomaly',
        priority: 'high',
        variables: ['anomalyType'],
      },
      {
        id: 'digital_id_expiring',
        name: 'Digital ID Expiring',
        title: '🆔 ID Expiration',
        message:
          'Your digital tourist ID expires in {daysRemaining} days. Please renew.',
        type: 'system',
        priority: 'normal',
        variables: ['daysRemaining'],
      },
    ];

    await this.saveTemplates();
  }

  private async setupNotificationChannels() {
    // Mock notification channel setup
    // In real implementation, this would set up Android notification channels
    console.log('Notification channels configured');
  }

  // Send Notifications
  async sendNotification(
    title: string,
    message: string,
    type: NotificationData['type'],
    priority: NotificationData['priority'] = 'normal',
    metadata: Record<string, any> = {},
    actionUrl?: string,
    expiresIn?: number, // minutes
  ): Promise<string> {
    if (!this.config.enabled) {
      console.log('Notifications disabled');
      return '';
    }

    if (!this.isNotificationTypeEnabled(type)) {
      console.log(`Notification type ${type} is disabled`);
      return '';
    }

    const notification: NotificationData = {
      id: this.generateNotificationId(),
      title,
      message,
      type,
      priority,
      timestamp: new Date(),
      isRead: false,
      actionUrl,
      metadata,
      expiresAt: expiresIn
        ? new Date(Date.now() + expiresIn * 60 * 1000)
        : undefined,
    };

    // Add to history
    this.notificationHistory.unshift(notification);
    await this.saveNotificationHistory();

    // Show notification based on platform
    await this.displayNotification(notification);

    return notification.id;
  }

  async sendTemplateNotification(
    templateId: string,
    variables: Record<string, string> = {},
    metadata: Record<string, any> = {},
  ): Promise<string> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let title = template.title;
    let message = template.message;

    // Replace variables in template
    template.variables.forEach(variable => {
      const value = variables[variable] || `{${variable}}`;
      title = title.replace(`{${variable}}`, value);
      message = message.replace(`{${variable}}`, value);
    });

    return this.sendNotification(
      title,
      message,
      template.type,
      template.priority,
      {...metadata, templateId},
      undefined,
      60, // 1 hour expiration
    );
  }

  private async displayNotification(notification: NotificationData) {
    try {
      if (Platform.OS === 'android') {
        await this.showAndroidNotification(notification);
      } else {
        await this.showIOSNotification(notification);
      }
    } catch (error) {
      console.error('Failed to display notification:', error);
    }
  }

  private async showAndroidNotification(notification: NotificationData) {
    // Mock Android notification
    // In real implementation, this would use react-native-push-notification
    console.log(
      'Android Notification:',
      notification.title,
      notification.message,
    );

    // Show alert for critical notifications
    if (notification.priority === 'critical') {
      Alert.alert(
        notification.title,
        notification.message,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'View',
            onPress: () => this.handleNotificationAction(notification),
          },
        ],
        {cancelable: false},
      );
    }
  }

  private async showIOSNotification(notification: NotificationData) {
    // Mock iOS notification
    // In real implementation, this would use react-native-push-notification
    console.log('iOS Notification:', notification.title, notification.message);

    // Show alert for critical notifications
    if (notification.priority === 'critical') {
      Alert.alert(notification.title, notification.message, [
        {
          text: 'OK',
          onPress: () => this.handleNotificationAction(notification),
        },
      ]);
    }
  }

  private async handleNotificationAction(notification: NotificationData) {
    if (notification.actionUrl) {
      try {
        const canOpen = await Linking.canOpenURL(notification.actionUrl);
        if (canOpen) {
          await Linking.openURL(notification.actionUrl);
        }
      } catch (error) {
        console.error('Failed to open notification URL:', error);
      }
    }
  }

  // Emergency Notifications
  async sendEmergencyAlert(
    userName: string,
    location: string,
    emergencyType: 'panic' | 'medical' | 'security' | 'other',
  ): Promise<string> {
    const emergencyMessages = {
      panic: 'Panic button activated! Emergency services have been notified.',
      medical: 'Medical emergency reported! Help is on the way.',
      security: 'Security threat detected! Please follow safety protocols.',
      other: 'Emergency situation reported! Assistance is being dispatched.',
    };

    return this.sendNotification(
      '🚨 EMERGENCY ALERT',
      `${emergencyMessages[emergencyType]} Location: ${location}`,
      'emergency',
      'critical',
      {userName, location, emergencyType},
      undefined,
      0, // No expiration for emergency alerts
    );
  }

  // Safety Notifications
  async sendSafetyAlert(
    safetyScore: number,
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    recommendations: string[],
  ): Promise<string> {
    const riskMessages = {
      low: 'You are in a safe area. Continue following safety guidelines.',
      medium:
        'Moderate risk detected. Stay alert and follow safety recommendations.',
      high: 'High risk area! Please move to a safer location immediately.',
      critical: 'CRITICAL RISK! Emergency evacuation recommended.',
    };

    return this.sendNotification(
      `⚠️ Safety Alert - ${riskLevel.toUpperCase()}`,
      `${riskMessages[riskLevel]} Score: ${safetyScore}/100`,
      'safety',
      riskLevel === 'critical' ? 'critical' : 'high',
      {safetyScore, riskLevel, recommendations},
    );
  }

  // Geo-fence Notifications
  async sendGeoFenceAlert(
    zoneName: string,
    alertType: 'enter' | 'exit',
    alertMessage: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
  ): Promise<string> {
    const action = alertType === 'enter' ? 'entered' : 'exited';

    return this.sendNotification(
      `📍 Zone ${alertType === 'enter' ? 'Entry' : 'Exit'}`,
      `You have ${action} ${zoneName}. ${alertMessage}`,
      'geo_fence',
      riskLevel === 'critical' ? 'critical' : 'normal',
      {zoneName, alertType, riskLevel},
    );
  }

  // Anomaly Notifications
  async sendAnomalyAlert(
    anomalyType: string,
    description: string,
    confidence: number,
    location?: string,
  ): Promise<string> {
    return this.sendNotification(
      '🔍 Anomaly Detected',
      `${anomalyType}: ${description}${location ? ` at ${location}` : ''}`,
      'anomaly',
      confidence > 0.8 ? 'high' : 'normal',
      {anomalyType, description, confidence, location},
    );
  }

  // System Notifications
  async sendSystemNotification(
    title: string,
    message: string,
    priority: NotificationData['priority'] = 'normal',
  ): Promise<string> {
    return this.sendNotification(`ℹ️ ${title}`, message, 'system', priority);
  }

  // Notification Management
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notificationHistory.find(
      n => n.id === notificationId,
    );
    if (notification) {
      notification.isRead = true;
      await this.saveNotificationHistory();
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notificationHistory.forEach(notification => {
      notification.isRead = true;
    });
    await this.saveNotificationHistory();
  }

  async deleteNotification(notificationId: string): Promise<void> {
    this.notificationHistory = this.notificationHistory.filter(
      n => n.id !== notificationId,
    );
    await this.saveNotificationHistory();
  }

  async clearAllNotifications(): Promise<void> {
    this.notificationHistory = [];
    await this.saveNotificationHistory();
  }

  async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date();
    this.notificationHistory = this.notificationHistory.filter(notification => {
      return !notification.expiresAt || notification.expiresAt > now;
    });
    await this.saveNotificationHistory();
  }

  // Configuration Management
  private isNotificationTypeEnabled(type: NotificationData['type']): boolean {
    switch (type) {
      case 'emergency':
        return this.config.emergencyNotifications;
      case 'safety':
        return this.config.safetyAlerts;
      case 'geo_fence':
        return this.config.geoFenceAlerts;
      case 'anomaly':
        return this.config.anomalyAlerts;
      case 'system':
        return this.config.systemUpdates;
      case 'info':
        return this.config.enabled;
      default:
        return false;
    }
  }

  async updateConfiguration(
    updates: Partial<NotificationConfig>,
  ): Promise<void> {
    this.config = {...this.config, ...updates};
    await this.saveConfiguration();
  }

  // Getters
  getNotifications(): NotificationData[] {
    return [...this.notificationHistory];
  }

  getUnreadNotifications(): NotificationData[] {
    return this.notificationHistory.filter(n => !n.isRead);
  }

  getUnreadCount(): number {
    return this.getUnreadNotifications().length;
  }

  getNotificationsByType(type: NotificationData['type']): NotificationData[] {
    return this.notificationHistory.filter(n => n.type === type);
  }

  getConfiguration(): NotificationConfig {
    return {...this.config};
  }

  getTemplates(): NotificationTemplate[] {
    return [...this.templates];
  }

  // Utility Methods
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Scheduled Notifications
  async scheduleNotification(
    title: string,
    message: string,
    delay: number, // minutes
    type: NotificationData['type'] = 'info',
  ): Promise<string> {
    const notificationId = this.generateNotificationId();

    setTimeout(async () => {
      await this.sendNotification(title, message, type);
    }, delay * 60 * 1000);

    return notificationId;
  }

  // Batch Notifications
  async sendBatchNotifications(
    notifications: Array<{
      title: string;
      message: string;
      type: NotificationData['type'];
      priority?: NotificationData['priority'];
    }>,
  ): Promise<string[]> {
    const ids: string[] = [];

    for (const notification of notifications) {
      const id = await this.sendNotification(
        notification.title,
        notification.message,
        notification.type,
        notification.priority,
      );
      ids.push(id);
    }

    return ids;
  }
}

export const NotificationService = new NotificationServiceClass();
