import {LocationData} from './LocationService';

export interface SafetyScore {
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  factors: SafetyFactor[];
  lastUpdated: Date;
  recommendations: string[];
}

export interface SafetyFactor {
  name: string;
  value: number;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface TravelHistory {
  locations: LocationData[];
  duration: number; // in minutes
  riskZones: string[];
  panicButtonPresses: number;
  lastActivity: Date;
}

export interface BehaviorPattern {
  averageSpeed: number;
  movementPattern: 'stationary' | 'walking' | 'driving' | 'unknown';
  timeInRiskZones: number;
  panicButtonFrequency: number;
  appInteractionFrequency: number;
}

class SafetyScoreServiceClass {
  private currentScore: SafetyScore | null = null;
  private travelHistory: TravelHistory = {
    locations: [],
    duration: 0,
    riskZones: [],
    panicButtonPresses: 0,
    lastActivity: new Date(),
  };
  private behaviorPattern: BehaviorPattern = {
    averageSpeed: 0,
    movementPattern: 'unknown',
    timeInRiskZones: 0,
    panicButtonFrequency: 0,
    appInteractionFrequency: 0,
  };

  async initialize() {
    try {
      // Load any saved data
      await this.loadSavedData();
      console.log('SafetyScoreService initialized successfully');
    } catch (error) {
      console.error('SafetyScoreService initialization failed:', error);
    }
  }

  private async loadSavedData() {
    // Load saved travel history and behavior patterns
    // This would typically load from AsyncStorage or a database
  }

  calculateSafetyScore(
    location: LocationData,
    _additionalFactors?: any,
  ): SafetyScore {
    const factors: SafetyFactor[] = [];

    // 1. Location Risk Factor (30% weight)
    const locationRisk = this.calculateLocationRisk(location);
    factors.push({
      name: 'Location Risk',
      value: locationRisk,
      weight: 0.3,
      impact:
        locationRisk > 70
          ? 'negative'
          : locationRisk > 40
          ? 'neutral'
          : 'positive',
      description: this.getLocationRiskDescription(locationRisk),
    });

    // 2. Time-based Risk Factor (20% weight)
    const timeRisk = this.calculateTimeRisk();
    factors.push({
      name: 'Time Risk',
      value: timeRisk,
      weight: 0.2,
      impact:
        timeRisk > 70 ? 'negative' : timeRisk > 40 ? 'neutral' : 'positive',
      description: this.getTimeRiskDescription(timeRisk),
    });

    // 3. Movement Pattern Factor (15% weight)
    const movementRisk = this.calculateMovementRisk();
    factors.push({
      name: 'Movement Pattern',
      value: movementRisk,
      weight: 0.15,
      impact:
        movementRisk > 70
          ? 'negative'
          : movementRisk > 40
          ? 'neutral'
          : 'positive',
      description: this.getMovementRiskDescription(movementRisk),
    });

    // 4. Historical Behavior Factor (20% weight)
    const behaviorRisk = this.calculateBehaviorRisk();
    factors.push({
      name: 'Historical Behavior',
      value: behaviorRisk,
      weight: 0.2,
      impact:
        behaviorRisk > 70
          ? 'negative'
          : behaviorRisk > 40
          ? 'neutral'
          : 'positive',
      description: this.getBehaviorRiskDescription(behaviorRisk),
    });

    // 5. Environmental Factor (15% weight)
    const environmentalRisk = this.calculateEnvironmentalRisk(location);
    factors.push({
      name: 'Environmental Risk',
      value: environmentalRisk,
      weight: 0.15,
      impact:
        environmentalRisk > 70
          ? 'negative'
          : environmentalRisk > 40
          ? 'neutral'
          : 'positive',
      description: this.getEnvironmentalRiskDescription(environmentalRisk),
    });

    // Calculate weighted score
    const weightedScore = factors.reduce((total, factor) => {
      return total + factor.value * factor.weight;
    }, 0);

    const finalScore = Math.round(Math.max(0, Math.min(100, weightedScore)));
    const riskLevel = this.determineRiskLevel(finalScore);
    const recommendations = this.generateRecommendations(factors, finalScore);

    const safetyScore: SafetyScore = {
      score: finalScore,
      riskLevel,
      factors,
      lastUpdated: new Date(),
      recommendations,
    };

    this.currentScore = safetyScore;
    return safetyScore;
  }

  private calculateLocationRisk(_location: LocationData): number {
    // Check if location is in a high-risk zone
    const riskZones = [
      {lat: 20.2961, lng: 85.8245, radius: 500, risk: 80}, // Cave area
      {lat: 21.75, lng: 86.3333, radius: 1000, risk: 70}, // Forest area
      {lat: 20.2961, lng: 85.8245, radius: 200, risk: 90}, // Restricted area
    ];

    for (const zone of riskZones) {
      const distance = this.calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        zone.lat,
        zone.lng,
      );
      if (distance <= zone.radius) {
        return zone.risk;
      }
    }

    // Check if location is in remote area (far from main roads/cities)
    const distanceFromMainCity = this.calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      20.2961, // Main city coordinates
      85.8245,
    );

    if (distanceFromMainCity > 50000) return 60; // 50km+ from main city
    if (distanceFromMainCity > 20000) return 40; // 20km+ from main city
    return 20; // Close to main city
  }

  private calculateTimeRisk(): number {
    const hour = new Date().getHours();

    // Night time is riskier
    if (hour >= 22 || hour <= 5) return 80;
    if (hour >= 19 || hour <= 7) return 60;
    if (hour >= 17 || hour <= 9) return 40;
    return 20;
  }

  private calculateMovementRisk(): number {
    const {movementPattern} = this.behaviorPattern;

    switch (movementPattern) {
      case 'stationary':
        return 30; // Being stationary for too long can be risky
      case 'walking':
        return 20; // Walking is generally safe
      case 'driving':
        return 40; // Driving can be risky in unfamiliar areas
      case 'unknown':
        return 50; // Unknown movement pattern is concerning
      default:
        return 30;
    }
  }

  private calculateBehaviorRisk(): number {
    const {panicButtonFrequency, timeInRiskZones, appInteractionFrequency} =
      this.behaviorPattern;

    let risk = 0;

    // Panic button frequency
    if (panicButtonFrequency > 3) risk += 40;
    else if (panicButtonFrequency > 1) risk += 20;

    // Time in risk zones
    if (timeInRiskZones > 120) risk += 30; // 2+ hours in risk zones
    else if (timeInRiskZones > 60) risk += 15; // 1+ hour in risk zones

    // App interaction frequency (low interaction = higher risk)
    if (appInteractionFrequency < 0.1) risk += 20; // Very low interaction
    else if (appInteractionFrequency < 0.3) risk += 10; // Low interaction

    return Math.min(100, risk);
  }

  private calculateEnvironmentalRisk(_location: LocationData): number {
    // This would integrate with weather APIs, crime data, etc.
    // For now, using a simple calculation based on location
    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour <= 6;

    if (isNight) return 60;
    return 30;
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

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private generateRecommendations(
    factors: SafetyFactor[],
    score: number,
  ): string[] {
    const recommendations: string[] = [];

    factors.forEach(factor => {
      if (factor.impact === 'negative' && factor.value > 60) {
        switch (factor.name) {
          case 'Location Risk':
            recommendations.push('Consider moving to a safer area');
            break;
          case 'Time Risk':
            recommendations.push('Avoid traveling during high-risk hours');
            break;
          case 'Movement Pattern':
            recommendations.push('Maintain steady movement patterns');
            break;
          case 'Historical Behavior':
            recommendations.push('Follow safety guidelines more closely');
            break;
          case 'Environmental Risk':
            recommendations.push('Be extra cautious of your surroundings');
            break;
        }
      }
    });

    if (score >= 70) {
      recommendations.push('High risk detected - consider emergency contacts');
    } else if (score >= 40) {
      recommendations.push(
        'Medium risk - stay alert and follow safety guidelines',
      );
    } else {
      recommendations.push('Low risk - continue following safety practices');
    }

    return recommendations;
  }

  private getLocationRiskDescription(risk: number): string {
    if (risk >= 80) return 'Very high risk location';
    if (risk >= 60) return 'High risk location';
    if (risk >= 40) return 'Medium risk location';
    return 'Low risk location';
  }

  private getTimeRiskDescription(risk: number): string {
    if (risk >= 80) return 'Very high risk time period';
    if (risk >= 60) return 'High risk time period';
    if (risk >= 40) return 'Medium risk time period';
    return 'Low risk time period';
  }

  private getMovementRiskDescription(risk: number): string {
    if (risk >= 80) return 'Very concerning movement pattern';
    if (risk >= 60) return 'Concerning movement pattern';
    if (risk >= 40) return 'Unusual movement pattern';
    return 'Normal movement pattern';
  }

  private getBehaviorRiskDescription(risk: number): string {
    if (risk >= 80) return 'Very concerning behavior pattern';
    if (risk >= 60) return 'Concerning behavior pattern';
    if (risk >= 40) return 'Unusual behavior pattern';
    return 'Normal behavior pattern';
  }

  private getEnvironmentalRiskDescription(risk: number): string {
    if (risk >= 80) return 'Very high environmental risk';
    if (risk >= 60) return 'High environmental risk';
    if (risk >= 40) return 'Medium environmental risk';
    return 'Low environmental risk';
  }

  updateTravelHistory(location: LocationData) {
    this.travelHistory.locations.push(location);
    this.travelHistory.lastActivity = new Date();

    // Keep only last 100 locations to prevent memory issues
    if (this.travelHistory.locations.length > 100) {
      this.travelHistory.locations = this.travelHistory.locations.slice(-100);
    }
  }

  updateBehaviorPattern(data: Partial<BehaviorPattern>) {
    this.behaviorPattern = {...this.behaviorPattern, ...data};
  }

  recordPanicButtonPress() {
    this.travelHistory.panicButtonPresses++;
    this.behaviorPattern.panicButtonFrequency =
      this.travelHistory.panicButtonPresses /
      Math.max(1, this.travelHistory.duration / 60);
  }

  getCurrentSafetyScore(): SafetyScore | null {
    return this.currentScore;
  }

  getTravelHistory(): TravelHistory {
    return this.travelHistory;
  }

  getBehaviorPattern(): BehaviorPattern {
    return this.behaviorPattern;
  }

  resetData() {
    this.currentScore = null;
    this.travelHistory = {
      locations: [],
      duration: 0,
      riskZones: [],
      panicButtonPresses: 0,
      lastActivity: new Date(),
    };
    this.behaviorPattern = {
      averageSpeed: 0,
      movementPattern: 'unknown',
      timeInRiskZones: 0,
      panicButtonFrequency: 0,
      appInteractionFrequency: 0,
    };
  }
}

export const SafetyScoreService = new SafetyScoreServiceClass();
