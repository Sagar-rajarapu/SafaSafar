import {
  LocationService,
  GeoFenceZone,
  LocationData,
} from '.bin/src/services/LocationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GeoFenceAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  alertType: 'enter' | 'exit';
  timestamp: Date;
  location: LocationData;
  message: string;
  isRead: boolean;
}

class GeoFencingServiceClass {
  private geoFenceZones: GeoFenceZone[] = [];
  private alertHistory: GeoFenceAlert[] = [];
  private isEnabled = true;
  private alertCallbacks: ((alert: GeoFenceAlert) => void)[] = [];

  async initialize() {
    try {
      await this.loadSettings();
      await this.loadAlertHistory();
      console.log('GeoFencingService initialized successfully');
    } catch (error) {
      console.error('GeoFencingService initialization failed:', error);
    }
  }

  private async loadSettings() {
    try {
      const settings = await AsyncStorage.getItem('geoFencingSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.isEnabled =
          parsed.isEnabled !== undefined ? parsed.isEnabled : true;
      }
    } catch (error) {
      console.error('Failed to load geo-fencing settings:', error);
    }
  }

  private async saveSettings() {
    try {
      await AsyncStorage.setItem(
        'geoFencingSettings',
        JSON.stringify({
          isEnabled: this.isEnabled,
        }),
      );
    } catch (error) {
      console.error('Failed to save geo-fencing settings:', error);
    }
  }

  private async loadAlertHistory() {
    try {
      const history = await AsyncStorage.getItem('geoFenceAlertHistory');
      if (history) {
        this.alertHistory = JSON.parse(history).map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load alert history:', error);
    }
  }

  private async saveAlertHistory() {
    try {
      await AsyncStorage.setItem(
        'geoFenceAlertHistory',
        JSON.stringify(this.alertHistory),
      );
    } catch (error) {
      console.error('Failed to save alert history:', error);
    }
  }

  async enableGeoFencing(): Promise<void> {
    this.isEnabled = true;
    await this.saveSettings();

    // Start location tracking if not already active
    if (!LocationService.isLocationTrackingActive()) {
      LocationService.startLocationTracking(
        this.handleLocationUpdate.bind(this),
      );
    }
  }

  async disableGeoFencing(): Promise<void> {
    this.isEnabled = false;
    await this.saveSettings();
  }

  isGeoFencingEnabled(): boolean {
    return this.isEnabled;
  }

  getGeoFenceZones(): GeoFenceZone[] {
    return [...this.geoFenceZones];
  }

  async addGeoFenceZone(zone: GeoFenceZone): Promise<void> {
    this.geoFenceZones.push(zone);
    LocationService.addGeoFenceZone(zone);
  }

  async updateGeoFenceZone(
    zoneId: string,
    updates: Partial<GeoFenceZone>,
  ): Promise<void> {
    const index = this.geoFenceZones.findIndex(zone => zone.id === zoneId);
    if (index !== -1) {
      this.geoFenceZones[index] = {...this.geoFenceZones[index], ...updates};
      LocationService.updateGeoFenceZone(zoneId, updates);
    }
  }

  async removeGeoFenceZone(zoneId: string): Promise<void> {
    this.geoFenceZones = this.geoFenceZones.filter(zone => zone.id !== zoneId);
    LocationService.removeGeoFenceZone(zoneId);
  }

  private handleLocationUpdate(location: LocationData) {
    if (!this.isEnabled) return;

    this.checkGeoFenceZones(location);
  }

  private checkGeoFenceZones(location: LocationData) {
    this.geoFenceZones.forEach(zone => {
      if (!zone.isActive) return;

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        zone.center.latitude,
        zone.center.longitude,
      );

      const isInside = distance <= zone.radius;
      const wasInside = this.wasLocationInsideZone(location, zone);

      if (isInside && !wasInside) {
        // Entered zone
        this.triggerGeoFenceAlert(zone, location, 'enter');
      } else if (!isInside && wasInside) {
        // Exited zone
        this.triggerGeoFenceAlert(zone, location, 'exit');
      }
    });
  }

  private wasLocationInsideZone(
    _location: LocationData,
    _zone: GeoFenceZone,
  ): boolean {
    // This is a simplified check - in a real implementation, you'd track previous locations
    // For now, we'll assume the user wasn't inside the zone before
    return false;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  private triggerGeoFenceAlert(
    zone: GeoFenceZone,
    location: LocationData,
    alertType: 'enter' | 'exit',
  ) {
    const alert: GeoFenceAlert = {
      id: this.generateAlertId(),
      zoneId: zone.id,
      zoneName: zone.name,
      alertType,
      timestamp: new Date(),
      location,
      message:
        alertType === 'enter'
          ? `You have entered ${zone.name}. ${zone.alertMessage}`
          : `You have exited ${zone.name}`,
      isRead: false,
    };

    this.alertHistory.push(alert);
    this.saveAlertHistory();

    // Notify callbacks
    this.alertCallbacks.forEach(callback => callback(alert));
  }

  getAlertHistory(): GeoFenceAlert[] {
    return [...this.alertHistory];
  }

  getUnreadAlerts(): GeoFenceAlert[] {
    return this.alertHistory.filter(alert => !alert.isRead);
  }

  markAlertAsRead(alertId: string): void {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      this.saveAlertHistory();
    }
  }

  markAllAlertsAsRead(): void {
    this.alertHistory.forEach(alert => {
      alert.isRead = true;
    });
    this.saveAlertHistory();
  }

  clearAlertHistory(): void {
    this.alertHistory = [];
    this.saveAlertHistory();
  }

  addAlertCallback(callback: (alert: GeoFenceAlert) => void) {
    this.alertCallbacks.push(callback);
  }

  removeAlertCallback(callback: (alert: GeoFenceAlert) => void) {
    this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
  }

  private generateAlertId(): string {
    return `geo_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getAlertStats() {
    const totalAlerts = this.alertHistory.length;
    const unreadAlerts = this.getUnreadAlerts().length;
    const enterAlerts = this.alertHistory.filter(
      alert => alert.alertType === 'enter',
    ).length;
    const exitAlerts = this.alertHistory.filter(
      alert => alert.alertType === 'exit',
    ).length;

    return {
      totalAlerts,
      unreadAlerts,
      enterAlerts,
      exitAlerts,
    };
  }
}

export const GeoFencingService = new GeoFencingServiceClass();
