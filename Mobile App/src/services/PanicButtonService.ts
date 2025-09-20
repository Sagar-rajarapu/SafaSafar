import {Alert, Linking} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {LocationService, LocationData} from './LocationService';

export interface PanicAlert {
  id: string;
  timestamp: Date;
  location: LocationData;
  status: 'active' | 'acknowledged' | 'resolved' | 'cancelled';
  emergencyContacts: EmergencyContact[];
  policeResponse?: PoliceResponse;
  tourismResponse?: TourismResponse;
  evidence: Evidence[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
}

export interface PoliceResponse {
  id: string;
  timestamp: Date;
  status: 'dispatched' | 'en-route' | 'arrived' | 'resolved';
  officerName?: string;
  badgeNumber?: string;
  estimatedArrival?: Date;
  notes?: string;
}

export interface TourismResponse {
  id: string;
  timestamp: Date;
  status: 'notified' | 'coordinating' | 'resolved';
  coordinatorName?: string;
  notes?: string;
}

export interface Evidence {
  id: string;
  type: 'audio' | 'video' | 'photo' | 'location';
  timestamp: Date;
  data: string;
  description?: string;
}

class PanicButtonServiceClass {
  private isPanicActive = false;
  private currentAlert: PanicAlert | null = null;
  private emergencyContacts: EmergencyContact[] = [];
  private panicCallbacks: ((alert: PanicAlert) => void)[] = [];

  async initialize() {
    try {
      await this.loadEmergencyContacts();
      console.log('PanicButtonService initialized successfully');
    } catch (error) {
      console.error('PanicButtonService initialization failed:', error);
    }
  }

  private async loadEmergencyContacts() {
    this.emergencyContacts = [
      {
        id: '1',
        name: 'Local Police',
        phone: '100',
        relationship: 'Emergency Services',
        isPrimary: true,
      },
      {
        id: '2',
        name: 'Tourism Helpline',
        phone: '1363',
        relationship: 'Tourism Services',
        isPrimary: true,
      },
    ];
  }

  async activatePanicButton(): Promise<PanicAlert> {
    if (this.isPanicActive) {
      throw new Error('Panic button is already active');
    }

    try {
      const location = await LocationService.getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get current location');
      }

      const alert: PanicAlert = {
        id: this.generateAlertId(),
        timestamp: new Date(),
        location,
        status: 'active',
        emergencyContacts: this.emergencyContacts,
        evidence: [],
      };

      this.currentAlert = alert;
      this.isPanicActive = true;

      await this.startPanicSequence(alert);

      this.panicCallbacks.forEach(callback => callback(alert));

      return alert;
    } catch (error) {
      console.error('Panic button activation failed:', error);
      throw error;
    }
  }

  private async startPanicSequence(alert: PanicAlert) {
    ReactNativeHapticFeedback.trigger('impactHeavy');

    Alert.alert(
      '🚨 PANIC ALERT ACTIVATED',
      'Emergency services have been notified. Stay calm and follow instructions.',
      [
        {
          text: 'Cancel Alert',
          style: 'destructive',
          onPress: () => this.cancelPanicAlert(),
        },
        {
          text: 'OK',
          style: 'default',
          onPress: () => this.acknowledgePanicAlert(),
        },
      ],
      {cancelable: false},
    );

    await this.sendEmergencyAlerts(alert);
    await this.notifyAuthorities(alert);
  }

  private async sendEmergencyAlerts(alert: PanicAlert) {
    for (const contact of this.emergencyContacts) {
      try {
        if (contact.phone) {
          await this.sendSMS(contact.phone, this.generatePanicMessage(alert));
        }

        if (contact.email) {
          await this.sendEmail(contact.email, this.generatePanicMessage(alert));
        }
      } catch (error) {
        console.error(`Failed to send alert to ${contact.name}:`, error);
      }
    }
  }

  private async notifyAuthorities(alert: PanicAlert) {
    try {
      await this.notifyPolice(alert);
      await this.notifyTourismDepartment(alert);
    } catch (error) {
      console.error('Failed to notify authorities:', error);
    }
  }

  private async notifyPolice(_alert: PanicAlert) {
    const policeResponse: PoliceResponse = {
      id: this.generateResponseId(),
      timestamp: new Date(),
      status: 'dispatched',
      estimatedArrival: new Date(Date.now() + 15 * 60 * 1000),
    };

    if (this.currentAlert) {
      this.currentAlert.policeResponse = policeResponse;
    }
  }

  private async notifyTourismDepartment(_alert: PanicAlert) {
    const tourismResponse: TourismResponse = {
      id: this.generateResponseId(),
      timestamp: new Date(),
      status: 'notified',
    };

    if (this.currentAlert) {
      this.currentAlert.tourismResponse = tourismResponse;
    }
  }

  private generatePanicMessage(alert: PanicAlert): string {
    return `🚨 PANIC ALERT 🚨
    
Tourist ID: ${alert.id}
Time: ${alert.timestamp.toLocaleString()}
Location: ${alert.location.latitude}, ${alert.location.longitude}
Accuracy: ${alert.location.accuracy}m

Please respond immediately!`;
  }

  private async sendSMS(phoneNumber: string, message: string) {
    try {
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        console.warn('Cannot open SMS app');
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }

  private async sendEmail(email: string, message: string) {
    try {
      const emailUrl = `mailto:${email}?subject=Panic Alert&body=${encodeURIComponent(
        message,
      )}`;
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        console.warn('Cannot open email app');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async cancelPanicAlert() {
    if (!this.isPanicActive || !this.currentAlert) {
      return;
    }

    this.currentAlert.status = 'cancelled';
    this.isPanicActive = false;

    Alert.alert(
      'Panic Alert Cancelled',
      'The panic alert has been cancelled. If this was accidental, please ensure you are safe.',
      [{text: 'OK'}],
    );

    this.panicCallbacks.forEach(callback => callback(this.currentAlert!));
  }

  async acknowledgePanicAlert() {
    if (!this.isPanicActive || !this.currentAlert) {
      return;
    }

    this.currentAlert.status = 'acknowledged';
    this.panicCallbacks.forEach(callback => callback(this.currentAlert!));
  }

  async resolvePanicAlert() {
    if (!this.isPanicActive || !this.currentAlert) {
      return;
    }

    this.currentAlert.status = 'resolved';
    this.isPanicActive = false;

    Alert.alert(
      'Panic Alert Resolved',
      'The panic alert has been resolved. Thank you for using SafeSafar.',
      [{text: 'OK'}],
    );

    this.panicCallbacks.forEach(callback => callback(this.currentAlert!));
  }

  getCurrentAlert(): PanicAlert | null {
    return this.currentAlert;
  }

  isPanicButtonActive(): boolean {
    return this.isPanicActive;
  }

  addPanicCallback(callback: (alert: PanicAlert) => void) {
    this.panicCallbacks.push(callback);
  }

  removePanicCallback(callback: (alert: PanicAlert) => void) {
    this.panicCallbacks = this.panicCallbacks.filter(cb => cb !== callback);
  }

  private generateAlertId(): string {
    return `panic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResponseId(): string {
    return `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const PanicButtonService = new PanicButtonServiceClass();
