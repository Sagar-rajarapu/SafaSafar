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

class SafetyScoreServiceClass {
  private currentScore: SafetyScore | null = null;

  async initialize() {
    try {
      console.log('SafetyScoreService initialized successfully');
    } catch (error) {
      console.error('SafetyScoreService initialization failed:', error);
    }
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

  private calculateLocationRisk(location: LocationData): number {
    const riskZones = [
      {lat: 20.2961, lng: 85.8245, radius: 500, risk: 80},
      {lat: 21.75, lng: 86.3333, radius: 1000, risk: 70},
      {lat: 20.2961, lng: 85.8245, radius: 200, risk: 90},
    ];

    for (const zone of riskZones) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        zone.lat,
        zone.lng,
      );
      if (distance <= zone.radius) {
        return zone.risk;
      }
    }

    const distanceFromMainCity = this.calculateDistance(
      location.latitude,
      location.longitude,
      20.2961,
      85.8245,
    );

    if (distanceFromMainCity > 50000) return 60;
    if (distanceFromMainCity > 20000) return 40;
    return 20;
  }

  private calculateTimeRisk(): number {
    const hour = new Date().getHours();

    if (hour >= 22 || hour <= 5) return 80;
    if (hour >= 19 || hour <= 7) return 60;
    if (hour >= 17 || hour <= 9) return 40;
    return 20;
  }

  private calculateMovementRisk(): number {
    return 30; // Simplified for demo
  }

  private calculateBehaviorRisk(): number {
    return 25; // Simplified for demo
  }

  private calculateEnvironmentalRisk(_location: LocationData): number {
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

  getCurrentSafetyScore(): SafetyScore | null {
    return this.currentScore;
  }
}

export const SafetyScoreService = new SafetyScoreServiceClass();
