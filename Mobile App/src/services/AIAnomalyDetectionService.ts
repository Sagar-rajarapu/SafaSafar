import {LocationData} from './LocationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnomalyDetectionConfig {
  locationDropoffThreshold: number; // minutes
  inactivityThreshold: number; // minutes
  routeDeviationThreshold: number; // meters
  speedAnomalyThreshold: number; // m/s
  behaviorAnalysisWindow: number; // minutes
  enableMLModels: boolean;
}

export interface AnomalyEvent {
  id: string;
  type:
    | 'location_dropoff'
    | 'inactivity'
    | 'route_deviation'
    | 'speed_anomaly'
    | 'behavior_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  location?: LocationData;
  description: string;
  confidence: number; // 0-1
  isResolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface BehaviorPattern {
  userId: string;
  normalMovementSpeed: number;
  normalActivityHours: number[];
  frequentLocations: Array<{
    coordinates: {latitude: number; longitude: number};
    visitCount: number;
    lastVisit: Date;
  }>;
  averageDailyDistance: number;
  riskTolerance: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

export interface MLModelPrediction {
  anomalyScore: number; // 0-1
  predictedRisk: 'low' | 'medium' | 'high' | 'critical';
  contributingFactors: string[];
  recommendations: string[];
  confidence: number;
}

class AIAnomalyDetectionServiceClass {
  private config: AnomalyDetectionConfig = {
    locationDropoffThreshold: 30, // 30 minutes
    inactivityThreshold: 60, // 1 hour
    routeDeviationThreshold: 1000, // 1 km
    speedAnomalyThreshold: 20, // 20 m/s (72 km/h)
    behaviorAnalysisWindow: 1440, // 24 hours
    enableMLModels: true,
  };

  private locationHistory: LocationData[] = [];
  private behaviorPattern: BehaviorPattern | null = null;
  private anomalyEvents: AnomalyEvent[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  async initialize() {
    try {
      await this.loadConfiguration();
      await this.loadLocationHistory();
      await this.loadBehaviorPattern();
      await this.loadAnomalyEvents();
      console.log('AIAnomalyDetectionService initialized successfully');
    } catch (error) {
      console.error('AIAnomalyDetectionService initialization failed:', error);
    }
  }

  private async loadConfiguration() {
    try {
      const config = await AsyncStorage.getItem('anomalyDetectionConfig');
      if (config) {
        this.config = {...this.config, ...JSON.parse(config)};
      }
    } catch (error) {
      console.error('Failed to load anomaly detection config:', error);
    }
  }

  private async saveConfiguration() {
    try {
      await AsyncStorage.setItem(
        'anomalyDetectionConfig',
        JSON.stringify(this.config),
      );
    } catch (error) {
      console.error('Failed to save anomaly detection config:', error);
    }
  }

  private async loadLocationHistory() {
    try {
      const history = await AsyncStorage.getItem('locationHistory');
      if (history) {
        this.locationHistory = JSON.parse(history).map((item: any) => ({
          ...item,
          timestamp: item.timestamp,
        }));
      }
    } catch (error) {
      console.error('Failed to load location history:', error);
    }
  }

  private async saveLocationHistory() {
    try {
      await AsyncStorage.setItem(
        'locationHistory',
        JSON.stringify(this.locationHistory),
      );
    } catch (error) {
      console.error('Failed to save location history:', error);
    }
  }

  private async loadBehaviorPattern() {
    try {
      const pattern = await AsyncStorage.getItem('behaviorPattern');
      if (pattern) {
        const parsed = JSON.parse(pattern);
        this.behaviorPattern = {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
          frequentLocations: parsed.frequentLocations.map((loc: any) => ({
            ...loc,
            lastVisit: new Date(loc.lastVisit),
          })),
        };
      }
    } catch (error) {
      console.error('Failed to load behavior pattern:', error);
    }
  }

  private async saveBehaviorPattern() {
    try {
      if (this.behaviorPattern) {
        await AsyncStorage.setItem(
          'behaviorPattern',
          JSON.stringify(this.behaviorPattern),
        );
      }
    } catch (error) {
      console.error('Failed to save behavior pattern:', error);
    }
  }

  private async loadAnomalyEvents() {
    try {
      const events = await AsyncStorage.getItem('anomalyEvents');
      if (events) {
        this.anomalyEvents = JSON.parse(events).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp),
          resolvedAt: event.resolvedAt ? new Date(event.resolvedAt) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load anomaly events:', error);
    }
  }

  private async saveAnomalyEvents() {
    try {
      await AsyncStorage.setItem(
        'anomalyEvents',
        JSON.stringify(this.anomalyEvents),
      );
    } catch (error) {
      console.error('Failed to save anomaly events:', error);
    }
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      console.warn('Anomaly detection monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performAnomalyDetection();
    }, 60000); // Check every minute

    console.log('AI Anomaly Detection monitoring started');
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('AI Anomaly Detection monitoring stopped');
  }

  async addLocationData(location: LocationData) {
    this.locationHistory.push(location);

    // Keep only last 24 hours of data
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
    this.locationHistory = this.locationHistory.filter(
      loc => loc.timestamp >= cutoffTime,
    );

    await this.saveLocationHistory();
    await this.updateBehaviorPattern(location);
  }

  private async updateBehaviorPattern(location: LocationData) {
    if (!this.behaviorPattern) {
      this.behaviorPattern = {
        userId: 'current_user',
        normalMovementSpeed: 0,
        normalActivityHours: [],
        frequentLocations: [],
        averageDailyDistance: 0,
        riskTolerance: 'medium',
        lastUpdated: new Date(),
      };
    }

    // Update movement speed
    if (this.locationHistory.length > 1) {
      const recentLocations = this.locationHistory.slice(-10);
      const speeds = this.calculateSpeeds(recentLocations);
      this.behaviorPattern.normalMovementSpeed = this.calculateAverage(speeds);
    }

    // Update activity hours
    const hour = new Date(location.timestamp).getHours();
    if (!this.behaviorPattern.normalActivityHours.includes(hour)) {
      this.behaviorPattern.normalActivityHours.push(hour);
      this.behaviorPattern.normalActivityHours.sort();
    }

    // Update frequent locations
    this.updateFrequentLocations(location);

    // Update average daily distance
    this.updateAverageDailyDistance();

    this.behaviorPattern.lastUpdated = new Date();
    await this.saveBehaviorPattern();
  }

  private calculateSpeeds(locations: LocationData[]): number[] {
    const speeds: number[] = [];
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      const distance = this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
      if (timeDiff > 0) {
        speeds.push(distance / timeDiff);
      }
    }
    return speeds;
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private updateFrequentLocations(location: LocationData) {
    if (!this.behaviorPattern) return;

    const threshold = 100; // 100 meters
    let found = false;

    for (const freqLoc of this.behaviorPattern.frequentLocations) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        freqLoc.coordinates.latitude,
        freqLoc.coordinates.longitude,
      );

      if (distance <= threshold) {
        freqLoc.visitCount++;
        freqLoc.lastVisit = new Date(location.timestamp);
        found = true;
        break;
      }
    }

    if (!found) {
      this.behaviorPattern.frequentLocations.push({
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        visitCount: 1,
        lastVisit: new Date(location.timestamp),
      });
    }

    // Keep only top 10 frequent locations
    this.behaviorPattern.frequentLocations.sort(
      (a, b) => b.visitCount - a.visitCount,
    );
    this.behaviorPattern.frequentLocations =
      this.behaviorPattern.frequentLocations.slice(0, 10);
  }

  private updateAverageDailyDistance() {
    if (!this.behaviorPattern || this.locationHistory.length < 2) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLocations = this.locationHistory.filter(
      loc => new Date(loc.timestamp) >= today,
    );

    let totalDistance = 0;
    for (let i = 1; i < todayLocations.length; i++) {
      const prev = todayLocations[i - 1];
      const curr = todayLocations[i];
      totalDistance += this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
    }

    this.behaviorPattern.averageDailyDistance = totalDistance;
  }

  private async performAnomalyDetection() {
    if (this.locationHistory.length < 2) return;

    const recentLocation =
      this.locationHistory[this.locationHistory.length - 1];
    const now = Date.now();

    // Check for location dropoff
    await this.checkLocationDropoff(recentLocation, now);

    // Check for inactivity
    await this.checkInactivity(recentLocation, now);

    // Check for route deviation
    await this.checkRouteDeviation(recentLocation);

    // Check for speed anomalies
    await this.checkSpeedAnomaly(recentLocation);

    // ML-based behavior analysis
    if (this.config.enableMLModels) {
      await this.performMLAnalysis(recentLocation);
    }
  }

  private async checkLocationDropoff(location: LocationData, now: number) {
    const timeSinceLastUpdate = (now - location.timestamp) / (1000 * 60); // minutes

    if (timeSinceLastUpdate > this.config.locationDropoffThreshold) {
      const anomaly: AnomalyEvent = {
        id: this.generateAnomalyId(),
        type: 'location_dropoff',
        severity: timeSinceLastUpdate > 120 ? 'critical' : 'high',
        timestamp: new Date(now),
        location,
        description: `No location update for ${Math.round(
          timeSinceLastUpdate,
        )} minutes`,
        confidence: 0.9,
        isResolved: false,
        metadata: {
          timeSinceLastUpdate,
          threshold: this.config.locationDropoffThreshold,
        },
      };

      await this.recordAnomaly(anomaly);
    }
  }

  private async checkInactivity(location: LocationData, now: number) {
    const recentLocations = this.locationHistory.filter(
      loc =>
        (now - loc.timestamp) / (1000 * 60) <=
        this.config.behaviorAnalysisWindow,
    );

    if (recentLocations.length < 2) return;

    const totalDistance = this.calculateTotalDistance(recentLocations);
    const timeSpan = (now - recentLocations[0].timestamp) / (1000 * 60 * 60); // hours

    const averageSpeed = totalDistance / timeSpan; // m/h

    if (averageSpeed < 100) {
      // Less than 100m/h indicates inactivity
      const anomaly: AnomalyEvent = {
        id: this.generateAnomalyId(),
        type: 'inactivity',
        severity: 'medium',
        timestamp: new Date(now),
        location,
        description: `Low activity detected: ${Math.round(
          averageSpeed,
        )}m/h over ${Math.round(timeSpan)}h`,
        confidence: 0.7,
        isResolved: false,
        metadata: {
          averageSpeed,
          timeSpan,
          totalDistance,
        },
      };

      await this.recordAnomaly(anomaly);
    }
  }

  private async checkRouteDeviation(location: LocationData) {
    if (!this.behaviorPattern) return;

    const nearestFrequentLocation = this.findNearestFrequentLocation(location);
    if (!nearestFrequentLocation) return;

    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      nearestFrequentLocation.coordinates.latitude,
      nearestFrequentLocation.coordinates.longitude,
    );

    if (distance > this.config.routeDeviationThreshold) {
      const anomaly: AnomalyEvent = {
        id: this.generateAnomalyId(),
        type: 'route_deviation',
        severity: distance > 5000 ? 'high' : 'medium',
        timestamp: new Date(),
        location,
        description: `Significant deviation from normal route: ${Math.round(
          distance,
        )}m from frequent location`,
        confidence: 0.8,
        isResolved: false,
        metadata: {
          deviationDistance: distance,
          nearestFrequentLocation,
        },
      };

      await this.recordAnomaly(anomaly);
    }
  }

  private async checkSpeedAnomaly(location: LocationData) {
    if (this.locationHistory.length < 2) return;

    const recentSpeeds = this.calculateSpeeds(this.locationHistory.slice(-5));
    const averageSpeed = this.calculateAverage(recentSpeeds);

    if (averageSpeed > this.config.speedAnomalyThreshold) {
      const anomaly: AnomalyEvent = {
        id: this.generateAnomalyId(),
        type: 'speed_anomaly',
        severity: averageSpeed > 50 ? 'high' : 'medium',
        timestamp: new Date(),
        location,
        description: `Unusual speed detected: ${Math.round(
          averageSpeed * 3.6,
        )} km/h`,
        confidence: 0.8,
        isResolved: false,
        metadata: {
          speed: averageSpeed,
          threshold: this.config.speedAnomalyThreshold,
        },
      };

      await this.recordAnomaly(anomaly);
    }
  }

  private async performMLAnalysis(
    location: LocationData,
  ): Promise<MLModelPrediction> {
    // Mock ML model prediction
    // In real implementation, this would call actual ML models
    const features = this.extractFeatures(location);
    const prediction = await this.runMLModel(features);

    if (prediction.anomalyScore > 0.7) {
      const anomaly: AnomalyEvent = {
        id: this.generateAnomalyId(),
        type: 'behavior_anomaly',
        severity: prediction.predictedRisk,
        timestamp: new Date(),
        location,
        description: `ML model detected behavioral anomaly: ${prediction.contributingFactors.join(
          ', ',
        )}`,
        confidence: prediction.confidence,
        isResolved: false,
        metadata: {
          mlPrediction: prediction,
          features,
        },
      };

      await this.recordAnomaly(anomaly);
    }

    return prediction;
  }

  private extractFeatures(location: LocationData): Record<string, number> {
    const hour = new Date(location.timestamp).getHours();
    const recentLocations = this.locationHistory.slice(-10);
    const speeds = this.calculateSpeeds(recentLocations);
    const averageSpeed = this.calculateAverage(speeds);

    return {
      hour,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      speed: averageSpeed,
      altitude: location.altitude || 0,
      isWeekend: new Date(location.timestamp).getDay() >= 6 ? 1 : 0,
    };
  }

  private async runMLModel(
    _features: Record<string, number>,
  ): Promise<MLModelPrediction> {
    // Mock ML model - in real implementation, this would call actual ML service
    return new Promise(resolve => {
      setTimeout(() => {
        const anomalyScore = Math.random();
        const predictedRisk =
          anomalyScore > 0.8
            ? 'critical'
            : anomalyScore > 0.6
            ? 'high'
            : anomalyScore > 0.4
            ? 'medium'
            : 'low';

        resolve({
          anomalyScore,
          predictedRisk: predictedRisk as
            | 'low'
            | 'medium'
            | 'high'
            | 'critical',
          contributingFactors: [
            'Unusual time of day',
            'Abnormal speed pattern',
            'Location deviation',
          ],
          recommendations: [
            'Check if user is safe',
            'Verify location accuracy',
            'Contact emergency services if critical',
          ],
          confidence: 0.85,
        });
      }, 1000);
    });
  }

  private findNearestFrequentLocation(location: LocationData) {
    if (
      !this.behaviorPattern ||
      this.behaviorPattern.frequentLocations.length === 0
    ) {
      return null;
    }

    let nearest = null;
    let minDistance = Infinity;

    for (const freqLoc of this.behaviorPattern.frequentLocations) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        freqLoc.coordinates.latitude,
        freqLoc.coordinates.longitude,
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = freqLoc;
      }
    }

    return nearest;
  }

  private calculateTotalDistance(locations: LocationData[]): number {
    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      totalDistance += this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
    }
    return totalDistance;
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

    return R * c;
  }

  private async recordAnomaly(anomaly: AnomalyEvent) {
    this.anomalyEvents.push(anomaly);
    await this.saveAnomalyEvents();

    // Trigger alert if critical
    if (anomaly.severity === 'critical') {
      await this.triggerCriticalAlert(anomaly);
    }
  }

  private async triggerCriticalAlert(anomaly: AnomalyEvent) {
    // In real implementation, this would trigger emergency alerts
    console.log('CRITICAL ANOMALY DETECTED:', anomaly);
  }

  private generateAnomalyId(): string {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getAnomalyEvents(): AnomalyEvent[] {
    return [...this.anomalyEvents];
  }

  getUnresolvedAnomalies(): AnomalyEvent[] {
    return this.anomalyEvents.filter(anomaly => !anomaly.isResolved);
  }

  async resolveAnomaly(anomalyId: string) {
    const anomaly = this.anomalyEvents.find(a => a.id === anomalyId);
    if (anomaly) {
      anomaly.isResolved = true;
      anomaly.resolvedAt = new Date();
      await this.saveAnomalyEvents();
    }
  }

  getBehaviorPattern(): BehaviorPattern | null {
    return this.behaviorPattern;
  }

  updateConfiguration(config: Partial<AnomalyDetectionConfig>) {
    this.config = {...this.config, ...config};
    this.saveConfiguration();
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

export const AIAnomalyDetectionService = new AIAnomalyDetectionServiceClass();
