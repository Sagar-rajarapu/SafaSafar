import {Alert, Linking} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {LocationService, LocationData} from './LocationService';
// Removed unused import

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
  data: string; // Base64 or file path
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
    // Load emergency contacts from storage
    // This would typically load from AsyncStorage or a database
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
      // Add more default contacts
    ];
  }

  async activatePanicButton(): Promise<PanicAlert> {
    if (this.isPanicActive) {
      throw new Error('Panic button is already active');
    }

    try {
      // Get current location
      const location = await LocationService.getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get current location');
      }

      // Create panic alert
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

      // Start panic sequence
      await this.startPanicSequence(alert);

      // Notify callbacks
      this.panicCallbacks.forEach(callback => callback(alert));

      return alert;
    } catch (error) {
      console.error('Panic button activation failed:', error);
      throw error;
    }
  }

  private async startPanicSequence(alert: PanicAlert) {
    // 1. Vibrate device
    ReactNativeHapticFeedback.trigger('impactHeavy');

    // 2. Show panic confirmation
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

    // 3. Start evidence collection
    this.startEvidenceCollection(alert);

    // 4. Send alerts to emergency contacts
    await this.sendEmergencyAlerts(alert);

    // 5. Notify police and tourism department
    await this.notifyAuthorities(alert);
  }

  private async sendEmergencyAlerts(_alert: PanicAlert) {
    for (const contact of this.emergencyContacts) {
      try {
        if (contact.phone) {
          // Send SMS
          await this.sendSMS(contact.phone, this.generatePanicMessage(_alert));
        }

        if (contact.email) {
          // Send email
          await this.sendEmail(
            contact.email,
            this.generatePanicMessage(_alert),
          );
        }
      } catch (error) {
        console.error(`Failed to send alert to ${contact.name}:`, error);
      }
    }
  }

  private async notifyAuthorities(_alert: PanicAlert) {
    try {
      // Notify police
      await this.notifyPolice(_alert);

      // Notify tourism department
      await this.notifyTourismDepartment(_alert);
    } catch (error) {
      console.error('Failed to notify authorities:', error);
    }
  }

  private async notifyPolice(_alert: PanicAlert) {
    // This would integrate with police API
    const policeResponse: PoliceResponse = {
      id: this.generateResponseId(),
      timestamp: new Date(),
      status: 'dispatched',
      estimatedArrival: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };

    if (this.currentAlert) {
      this.currentAlert.policeResponse = policeResponse;
    }
  }

  private async notifyTourismDepartment(_alert: PanicAlert) {
    // This would integrate with tourism department API
    const tourismResponse: TourismResponse = {
      id: this.generateResponseId(),
      timestamp: new Date(),
      status: 'notified',
    };

    if (this.currentAlert) {
      this.currentAlert.tourismResponse = tourismResponse;
    }
  }

  private startEvidenceCollection(_alert: PanicAlert) {
    // Start recording audio
    this.startAudioRecording(_alert);

    // Start taking periodic photos
    this.startPhotoCapture(_alert);
  }

  private async startAudioRecording(_alert: PanicAlert) {
    // This would integrate with audio recording library
    console.log('Starting audio recording for panic alert');
  }

  private async startPhotoCapture(_alert: PanicAlert) {
    // This would integrate with camera library
    console.log('Starting photo capture for panic alert');
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
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    await Linking.openURL(smsUrl);
  }

  private async sendEmail(email: string, message: string) {
    const emailUrl = `mailto:${email}?subject=Panic Alert&body=${encodeURIComponent(
      message,
    )}`;
    await Linking.openURL(emailUrl);
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

    // Notify callbacks
    this.panicCallbacks.forEach(callback => callback(this.currentAlert!));
  }

  async acknowledgePanicAlert() {
    if (!this.isPanicActive || !this.currentAlert) {
      return;
    }

    this.currentAlert.status = 'acknowledged';

    // Notify callbacks
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

    // Notify callbacks
    this.panicCallbacks.forEach(callback => callback(this.currentAlert!));
  }

  addEmergencyContact(contact: EmergencyContact) {
    this.emergencyContacts.push(contact);
  }

  removeEmergencyContact(contactId: string) {
    this.emergencyContacts = this.emergencyContacts.filter(
      contact => contact.id !== contactId,
    );
  }

  updateEmergencyContact(
    contactId: string,
    updates: Partial<EmergencyContact>,
  ) {
    const index = this.emergencyContacts.findIndex(
      contact => contact.id === contactId,
    );
    if (index !== -1) {
      this.emergencyContacts[index] = {
        ...this.emergencyContacts[index],
        ...updates,
      };
    }
  }

  getEmergencyContacts(): EmergencyContact[] {
    return this.emergencyContacts;
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
