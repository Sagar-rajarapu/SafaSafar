import {LocationData} from './LocationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrackingSettings {
  isEnabled: boolean;
  updateInterval: number;
  shareWithFamily: boolean;
  shareWithPolice: boolean;
  shareWithTourism: boolean;
  maxHistorySize: number;
}

export interface TrackingStats {
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  maxSpeed: number;
  locationCount: number;
}

class TrackingServiceClass {
  private isTracking = false;
  private trackingHistory: LocationData[] = [];
  private trackingSettings: TrackingSettings = {
    isEnabled: false,
    updateInterval: 5000,
    shareWithFamily: false,
    shareWithPolice: false,
    shareWithTourism: false,
    maxHistorySize: 1000,
  };
  private trackingCallbacks: ((location: LocationData) => void)[] = [];
  private trackingInterval: NodeJS.Timeout | null = null;

  async initialize() {
    try {
      await this.loadSettings();
      await this.loadTrackingHistory();
      console.log('TrackingService initialized successfully');
    } catch (error) {
      console.error('TrackingService initialization failed:', error);
    }
  }

  private async loadSettings() {
    try {
      const settings = await AsyncStorage.getItem('trackingSettings');
      if (settings) {
        this.trackingSettings = {
          ...this.trackingSettings,
          ...JSON.parse(settings),
        };
      }
    } catch (error) {
      console.error('Failed to load tracking settings:', error);
    }
  }

  private async saveSettings() {
    try {
      await AsyncStorage.setItem(
        'trackingSettings',
        JSON.stringify(this.trackingSettings),
      );
    } catch (error) {
      console.error('Failed to save tracking settings:', error);
    }
  }

  private async loadTrackingHistory() {
    try {
      const history = await AsyncStorage.getItem('trackingHistory');
      if (history) {
        this.trackingHistory = JSON.parse(history).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load tracking history:', error);
    }
  }

  private async saveTrackingHistory() {
    try {
      await AsyncStorage.setItem(
        'trackingHistory',
        JSON.stringify(this.trackingHistory),
      );
    } catch (error) {
      console.error('Failed to save tracking history:', error);
    }
  }

  async startTracking(): Promise<void> {
    if (this.isTracking) {
      console.warn('Tracking is already active');
      return;
    }

    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      this.isTracking = true;
      this.trackingSettings.isEnabled = true;
      await this.saveSettings();

      this.startTrackingInterval();

      console.log('Tracking started successfully');
    } catch (error) {
      console.error('Failed to start tracking:', error);
      throw error;
    }
  }

  stopTracking(): void {
    if (!this.isTracking) {
      console.warn('Tracking is not active');
      return;
    }

    this.isTracking = false;
    this.trackingSettings.isEnabled = false;
    this.saveSettings();

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    console.log('Tracking stopped');
  }

  private startTrackingInterval() {
    this.trackingInterval = setInterval(async () => {
      try {
        const location = await this.getCurrentLocation();
        if (location) {
          this.addLocationToHistory(location);
        }
      } catch (error) {
        console.error('Tracking interval error:', error);
      }
    }, this.trackingSettings.updateInterval);
  }

  private async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const {LocationService} = await import('./LocationService');
      return await LocationService.getCurrentLocation();
    } catch (error) {
      console.error('Failed to get current location for tracking:', error);
      return null;
    }
  }

  private addLocationToHistory(location: LocationData) {
    this.trackingHistory.push(location);

    if (this.trackingHistory.length > this.trackingSettings.maxHistorySize) {
      this.trackingHistory = this.trackingHistory.slice(
        -this.trackingSettings.maxHistorySize,
      );
    }

    this.saveTrackingHistory();

    this.trackingCallbacks.forEach(callback => callback(location));
  }

  private async requestLocationPermission(): Promise<boolean> {
    try {
      await import('./LocationService');
      // LocationService already handles permission requests
      return true;
    } catch (error) {
      console.error('Failed to request location permission:', error);
      return false;
    }
  }

  getTrackingHistory(): LocationData[] {
    return [...this.trackingHistory];
  }

  getTrackingStats(): TrackingStats {
    if (this.trackingHistory.length < 2) {
      return {
        totalDistance: 0,
        totalTime: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        locationCount: this.trackingHistory.length,
      };
    }

    let totalDistance = 0;
    let totalTime = 0;
    let maxSpeed = 0;
    let totalSpeed = 0;

    for (let i = 1; i < this.trackingHistory.length; i++) {
      const prev = this.trackingHistory[i - 1];
      const curr = this.trackingHistory[i];

      const distance = this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
      totalDistance += distance;

      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      totalTime += timeDiff;

      const speed = distance / timeDiff;
      totalSpeed += speed;
      maxSpeed = Math.max(maxSpeed, speed);
    }

    const averageSpeed = totalSpeed / (this.trackingHistory.length - 1);

    return {
      totalDistance,
      totalTime,
      averageSpeed,
      maxSpeed,
      locationCount: this.trackingHistory.length,
    };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  getTrackingSettings(): TrackingSettings {
    return {...this.trackingSettings};
  }

  async updateTrackingSettings(
    settings: Partial<TrackingSettings>,
  ): Promise<void> {
    this.trackingSettings = {...this.trackingSettings, ...settings};
    await this.saveSettings();
  }

  isTrackingActive(): boolean {
    return this.isTracking;
  }

  addTrackingCallback(callback: (location: LocationData) => void) {
    this.trackingCallbacks.push(callback);
  }

  removeTrackingCallback(callback: (location: LocationData) => void) {
    this.trackingCallbacks = this.trackingCallbacks.filter(
      cb => cb !== callback,
    );
  }

  clearTrackingHistory(): void {
    this.trackingHistory = [];
    this.saveTrackingHistory();
  }

  exportTrackingData(): string {
    return JSON.stringify({
      settings: this.trackingSettings,
      history: this.trackingHistory,
      stats: this.getTrackingStats(),
      exportedAt: new Date().toISOString(),
    });
  }
}

export const TrackingService = new TrackingServiceClass();
