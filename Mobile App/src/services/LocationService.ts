import Geolocation from 'react-native-geolocation-service';
import {Platform, PermissionsAndroid, Alert} from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  timestamp: number;
}

export interface GeoFenceZone {
  id: string;
  name: string;
  type: 'high-risk' | 'restricted' | 'safe' | 'cave' | 'forest';
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
  alertMessage: string;
  isActive: boolean;
}

class LocationServiceClass {
  private watchId: number | null = null;
  private currentLocation: LocationData | null = null;
  private locationCallbacks: ((location: LocationData) => void)[] = [];
  private geoFenceZones: GeoFenceZone[] = [];
  private isTracking = false;

  async initialize() {
    try {
      await this.requestLocationPermission();
      await this.loadGeoFenceZones();
      console.log('LocationService initialized successfully');
    } catch (error) {
      console.error('LocationService initialization failed:', error);
    }
  }

  private async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'SafeSafar needs access to your location to provide safety monitoring.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Location permission error:', err);
        return false;
      }
    }
    return true;
  }

  private async loadGeoFenceZones() {
    // Load predefined geo-fence zones
    this.geoFenceZones = [
      {
        id: 'cave-1',
        name: 'Elephant Caves',
        type: 'cave',
        center: {latitude: 20.2961, longitude: 85.8245},
        radius: 500,
        alertMessage:
          'You are entering a cave area. Please stay with your group and follow safety guidelines.',
        isActive: true,
      },
      {
        id: 'forest-1',
        name: 'Simlipal Forest',
        type: 'forest',
        center: {latitude: 21.75, longitude: 86.3333},
        radius: 1000,
        alertMessage:
          'You are entering a forest area. Wildlife may be present. Stay alert and follow guide instructions.',
        isActive: true,
      },
      {
        id: 'restricted-1',
        name: 'Military Restricted Zone',
        type: 'restricted',
        center: {latitude: 20.2961, longitude: 85.8245},
        radius: 200,
        alertMessage:
          'WARNING: You are entering a restricted area. Turn back immediately.',
        isActive: true,
      },
    ];
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp,
          };
          this.currentLocation = location;
          resolve(location);
        },
        error => {
          console.error('Location error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }

  startLocationTracking(callback: (location: LocationData) => void) {
    if (this.isTracking) {
      console.warn('Location tracking is already active');
      return;
    }

    this.locationCallbacks.push(callback);
    this.isTracking = true;

    this.watchId = Geolocation.watchPosition(
      position => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp,
        };

        this.currentLocation = location;

        // Notify all callbacks
        this.locationCallbacks.forEach(cb => cb(location));

        // Check geo-fencing
        this.checkGeoFencing(location);
      },
      error => {
        console.error('Location tracking error:', error);
        this.stopLocationTracking();
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
        fastestInterval: 2000, // Fastest update every 2 seconds
      },
    );
  }

  stopLocationTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.locationCallbacks = [];
  }

  private checkGeoFencing(location: LocationData) {
    this.geoFenceZones.forEach(zone => {
      if (!zone.isActive) return;

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        zone.center.latitude,
        zone.center.longitude,
      );

      if (distance <= zone.radius) {
        this.triggerGeoFenceAlert(zone, location);
      }
    });
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

  private triggerGeoFenceAlert(zone: GeoFenceZone, _location: LocationData) {
    Alert.alert(
      `Entering ${zone.name}`,
      zone.alertMessage,
      [
        {
          text: 'OK',
          onPress: () => {
            console.log(
              `User entered ${zone.name} at ${new Date().toISOString()}`,
            );
          },
        },
      ],
      {cancelable: false},
    );
  }

  getGeoFenceZones(): GeoFenceZone[] {
    return this.geoFenceZones;
  }

  addGeoFenceZone(zone: GeoFenceZone) {
    this.geoFenceZones.push(zone);
  }

  updateGeoFenceZone(zoneId: string, updates: Partial<GeoFenceZone>) {
    const index = this.geoFenceZones.findIndex(zone => zone.id === zoneId);
    if (index !== -1) {
      this.geoFenceZones[index] = {...this.geoFenceZones[index], ...updates};
    }
  }

  removeGeoFenceZone(zoneId: string) {
    this.geoFenceZones = this.geoFenceZones.filter(zone => zone.id !== zoneId);
  }

  getCurrentLocationData(): LocationData | null {
    return this.currentLocation;
  }

  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }
}

export const LocationService = new LocationServiceClass();
