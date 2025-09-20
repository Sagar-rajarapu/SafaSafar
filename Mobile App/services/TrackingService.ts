import {LocationData} from '.bin/src/services/LocationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrackingSettings {
  isEnabled: boolean;
  updateInterval: number; // in milliseconds
  shareWithFamily: boolean;
  shareWithPolice: boolean;
  shareWithTourism: boolean;
  maxHistorySize: number;
}

export interface TrackingStats {
  totalDistance: number; // in meters
  totalTime: number; // in seconds
  averageSpeed: number; // in m/s
  maxSpeed: number; // in m/s
  locationCount: number;
}

class TrackingServiceClass {
  private isTracking = false;
  private trackingHistory: LocationData[] = [];
  private trackingSettings: TrackingSettings = {
    isEnabled: false,
    updateInterval: 5000, // 5 seconds
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
      // Request location permission
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      this.isTracking = true;
      this.trackingSettings.isEnabled = true;
      await this.saveSettings();

      // Start tracking interval
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

    // Stop tracking interval
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    console.log('Tracking stopped');
  }

  private startTrackingInterval() {
    this.trackingInterval = setInterval(async () => {
      try {
        // This would typically get location from LocationService
        // For now, we'll simulate location updates
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
    // This would integrate with LocationService
    // For now, return null to indicate no location available
    return null;
  }

  private addLocationToHistory(location: LocationData) {
    this.trackingHistory.push(location);

    // Limit history size
    if (this.trackingHistory.length > this.trackingSettings.maxHistorySize) {
      this.trackingHistory = this.trackingHistory.slice(
        -this.trackingSettings.maxHistorySize,
      );
    }

    // Save to storage
    this.saveTrackingHistory();

    // Notify callbacks
    this.trackingCallbacks.forEach(callback => callback(location));
  }

  private async requestLocationPermission(): Promise<boolean> {
    // This would integrate with permission service
    // For now, return true
    return true;
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

      // Calculate distance
      const distance = this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
      totalDistance += distance;

      // Calculate time
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
      totalTime += timeDiff;

      // Calculate speed
      const speed = distance / timeDiff; // m/s
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

  async importTrackingData(data: string): Promise<void> {
    try {
      const parsed = JSON.parse(data);
      if (parsed.settings) {
        this.trackingSettings = {...this.trackingSettings, ...parsed.settings};
        await this.saveSettings();
      }
      if (parsed.history) {
        this.trackingHistory = parsed.history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        await this.saveTrackingHistory();
      }
    } catch (error) {
      console.error('Failed to import tracking data:', error);
      throw error;
    }
  }
}

export const TrackingService = new TrackingServiceClass();
