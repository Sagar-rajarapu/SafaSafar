import AsyncStorage from '@react-native-async-storage/async-storage';
import {LocationData} from './LocationService';
import {SafetyScore} from './SafetyScoreService';
import {AnomalyEvent} from './AIAnomalyDetectionService';

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  category:
    | 'user_action'
    | 'system_event'
    | 'safety_event'
    | 'performance'
    | 'error';
  timestamp: Date;
  userId: string;
  sessionId: string;
  properties: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
  };
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
  };
}

export interface UserBehavior {
  userId: string;
  sessionDuration: number; // minutes
  screenViews: Array<{
    screenName: string;
    timestamp: Date;
    duration: number; // seconds
  }>;
  actions: Array<{
    action: string;
    timestamp: Date;
    properties: Record<string, any>;
  }>;
  safetyInteractions: number;
  panicButtonUsage: number;
  geoFenceAlerts: number;
  anomalyEvents: number;
  lastActive: Date;
}

export interface SafetyAnalytics {
  totalSafetyChecks: number;
  averageSafetyScore: number;
  highRiskEvents: number;
  geoFenceViolations: number;
  panicButtonActivations: number;
  anomalyDetections: number;
  responseTime: {
    panicButton: number; // average seconds
    geoFence: number;
    anomaly: number;
  };
  riskTrends: Array<{
    date: Date;
    averageScore: number;
    highRiskCount: number;
  }>;
}

export interface PerformanceMetrics {
  appLaunchTime: number; // milliseconds
  screenLoadTimes: Record<string, number>;
  apiResponseTimes: Record<string, number>;
  memoryUsage: number; // MB
  crashCount: number;
  errorCount: number;
  lastUpdated: Date;
}

export interface AnalyticsReport {
  period: {
    start: Date;
    end: Date;
  };
  userBehavior: UserBehavior;
  safetyAnalytics: SafetyAnalytics;
  performanceMetrics: PerformanceMetrics;
  topScreens: Array<{
    screenName: string;
    viewCount: number;
    averageDuration: number;
  }>;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  insights: string[];
  recommendations: string[];
}

class AnalyticsServiceClass {
  private events: AnalyticsEvent[] = [];
  private userBehavior: UserBehavior | null = null;
  private safetyAnalytics: SafetyAnalytics = {
    totalSafetyChecks: 0,
    averageSafetyScore: 0,
    highRiskEvents: 0,
    geoFenceViolations: 0,
    panicButtonActivations: 0,
    anomalyDetections: 0,
    responseTime: {
      panicButton: 0,
      geoFence: 0,
      anomaly: 0,
    },
    riskTrends: [],
  };
  private performanceMetrics: PerformanceMetrics = {
    appLaunchTime: 0,
    screenLoadTimes: {},
    apiResponseTimes: {},
    memoryUsage: 0,
    crashCount: 0,
    errorCount: 0,
    lastUpdated: new Date(),
  };

  private currentSessionId: string = '';
  private sessionStartTime: Date | null = null;
  private currentScreen: string = '';
  private screenStartTime: Date | null = null;

  async initialize() {
    try {
      await this.loadAnalyticsData();
      this.startNewSession();
      console.log('AnalyticsService initialized successfully');
    } catch (error) {
      console.error('AnalyticsService initialization failed:', error);
    }
  }

  private async loadAnalyticsData() {
    try {
      const events = await AsyncStorage.getItem('analyticsEvents');
      if (events) {
        this.events = JSON.parse(events).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp),
        }));
      }

      const behavior = await AsyncStorage.getItem('userBehavior');
      if (behavior) {
        const parsed = JSON.parse(behavior);
        this.userBehavior = {
          ...parsed,
          lastActive: new Date(parsed.lastActive),
          screenViews: parsed.screenViews.map((view: any) => ({
            ...view,
            timestamp: new Date(view.timestamp),
          })),
          actions: parsed.actions.map((action: any) => ({
            ...action,
            timestamp: new Date(action.timestamp),
          })),
        };
      }

      const safety = await AsyncStorage.getItem('safetyAnalytics');
      if (safety) {
        const parsed = JSON.parse(safety);
        this.safetyAnalytics = {
          ...parsed,
          riskTrends: parsed.riskTrends.map((trend: any) => ({
            ...trend,
            date: new Date(trend.date),
          })),
        };
      }

      const performance = await AsyncStorage.getItem('performanceMetrics');
      if (performance) {
        const parsed = JSON.parse(performance);
        this.performanceMetrics = {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
        };
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }

  private async saveAnalyticsData() {
    try {
      await AsyncStorage.setItem(
        'analyticsEvents',
        JSON.stringify(this.events),
      );
      if (this.userBehavior) {
        await AsyncStorage.setItem(
          'userBehavior',
          JSON.stringify(this.userBehavior),
        );
      }
      await AsyncStorage.setItem(
        'safetyAnalytics',
        JSON.stringify(this.safetyAnalytics),
      );
      await AsyncStorage.setItem(
        'performanceMetrics',
        JSON.stringify(this.performanceMetrics),
      );
    } catch (error) {
      console.error('Failed to save analytics data:', error);
    }
  }

  private startNewSession() {
    this.currentSessionId = this.generateSessionId();
    this.sessionStartTime = new Date();

    this.trackEvent('session_start', 'system_event', {
      sessionId: this.currentSessionId,
      timestamp: this.sessionStartTime,
    });
  }

  // Event Tracking
  trackEvent(
    eventType: string,
    category: AnalyticsEvent['category'],
    properties: Record<string, any> = {},
    location?: {latitude: number; longitude: number},
  ): void {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      eventType,
      category,
      timestamp: new Date(),
      userId: 'current_user', // In real implementation, get from auth context
      sessionId: this.currentSessionId,
      properties,
      location,
      deviceInfo: {
        platform: 'React Native',
        version: '1.0.0',
        model: 'Unknown',
      },
    };

    this.events.push(event);
    this.updateUserBehavior(event);
    this.saveAnalyticsData();
  }

  // Screen Tracking
  trackScreenView(screenName: string): void {
    // End previous screen tracking
    if (this.currentScreen && this.screenStartTime) {
      const duration = (Date.now() - this.screenStartTime.getTime()) / 1000;
      this.trackEvent('screen_view_end', 'user_action', {
        screenName: this.currentScreen,
        duration,
      });
    }

    // Start new screen tracking
    this.currentScreen = screenName;
    this.screenStartTime = new Date();

    this.trackEvent('screen_view_start', 'user_action', {
      screenName,
    });

    // Update user behavior
    if (this.userBehavior) {
      this.userBehavior.screenViews.push({
        screenName,
        timestamp: new Date(),
        duration: 0, // Will be updated when screen ends
      });
    }
  }

  // Action Tracking
  trackAction(action: string, properties: Record<string, any> = {}): void {
    this.trackEvent('user_action', 'user_action', {
      action,
      ...properties,
    });

    // Update user behavior
    if (this.userBehavior) {
      this.userBehavior.actions.push({
        action,
        timestamp: new Date(),
        properties,
      });
    }
  }

  // Safety Analytics
  trackSafetyScore(safetyScore: SafetyScore, location?: LocationData): void {
    this.safetyAnalytics.totalSafetyChecks++;

    // Update average safety score
    const totalScore =
      this.safetyAnalytics.averageSafetyScore *
      (this.safetyAnalytics.totalSafetyChecks - 1);
    this.safetyAnalytics.averageSafetyScore =
      (totalScore + safetyScore.score) / this.safetyAnalytics.totalSafetyChecks;

    if (safetyScore.riskLevel === 'high') {
      this.safetyAnalytics.highRiskEvents++;
    }

    // Add to risk trends
    this.safetyAnalytics.riskTrends.push({
      date: new Date(),
      averageScore: safetyScore.score,
      highRiskCount: safetyScore.riskLevel === 'high' ? 1 : 0,
    });

    // Keep only last 30 days of trends
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    this.safetyAnalytics.riskTrends = this.safetyAnalytics.riskTrends.filter(
      trend => trend.date > cutoffDate,
    );

    this.trackEvent(
      'safety_score_calculated',
      'safety_event',
      {
        score: safetyScore.score,
        riskLevel: safetyScore.riskLevel,
        factors: safetyScore.factors.length,
      },
      location
        ? {latitude: location.latitude, longitude: location.longitude}
        : undefined,
    );
  }

  trackPanicButtonActivation(responseTime: number): void {
    this.safetyAnalytics.panicButtonActivations++;

    // Update average response time
    const totalTime =
      this.safetyAnalytics.responseTime.panicButton *
      (this.safetyAnalytics.panicButtonActivations - 1);
    this.safetyAnalytics.responseTime.panicButton =
      (totalTime + responseTime) / this.safetyAnalytics.panicButtonActivations;

    this.trackEvent('panic_button_activated', 'safety_event', {
      responseTime,
    });
  }

  trackGeoFenceAlert(responseTime: number): void {
    this.safetyAnalytics.geoFenceViolations++;

    const totalTime =
      this.safetyAnalytics.responseTime.geoFence *
      (this.safetyAnalytics.geoFenceViolations - 1);
    this.safetyAnalytics.responseTime.geoFence =
      (totalTime + responseTime) / this.safetyAnalytics.geoFenceViolations;

    this.trackEvent('geo_fence_alert', 'safety_event', {
      responseTime,
    });
  }

  trackAnomalyDetection(anomaly: AnomalyEvent, responseTime: number): void {
    this.safetyAnalytics.anomalyDetections++;

    const totalTime =
      this.safetyAnalytics.responseTime.anomaly *
      (this.safetyAnalytics.anomalyDetections - 1);
    this.safetyAnalytics.responseTime.anomaly =
      (totalTime + responseTime) / this.safetyAnalytics.anomalyDetections;

    this.trackEvent(
      'anomaly_detected',
      'safety_event',
      {
        anomalyType: anomaly.type,
        severity: anomaly.severity,
        confidence: anomaly.confidence,
        responseTime,
      },
      anomaly.location
        ? {
            latitude: anomaly.location.latitude,
            longitude: anomaly.location.longitude,
          }
        : undefined,
    );
  }

  // Performance Tracking
  trackAppLaunch(launchTime: number): void {
    this.performanceMetrics.appLaunchTime = launchTime;
    this.performanceMetrics.lastUpdated = new Date();

    this.trackEvent('app_launch', 'performance', {
      launchTime,
    });
  }

  trackScreenLoadTime(screenName: string, loadTime: number): void {
    this.performanceMetrics.screenLoadTimes[screenName] = loadTime;
    this.performanceMetrics.lastUpdated = new Date();

    this.trackEvent('screen_load', 'performance', {
      screenName,
      loadTime,
    });
  }

  trackApiCall(endpoint: string, responseTime: number, success: boolean): void {
    this.performanceMetrics.apiResponseTimes[endpoint] = responseTime;
    this.performanceMetrics.lastUpdated = new Date();

    if (!success) {
      this.performanceMetrics.errorCount++;
    }

    this.trackEvent('api_call', 'performance', {
      endpoint,
      responseTime,
      success,
    });
  }

  trackCrash(error: Error): void {
    this.performanceMetrics.crashCount++;
    this.performanceMetrics.lastUpdated = new Date();

    this.trackEvent('app_crash', 'error', {
      errorMessage: error.message,
      errorStack: error.stack,
    });
  }

  trackError(error: Error, context: string): void {
    this.performanceMetrics.errorCount++;
    this.performanceMetrics.lastUpdated = new Date();

    this.trackEvent('app_error', 'error', {
      errorMessage: error.message,
      context,
    });
  }

  // User Behavior Analysis
  private updateUserBehavior(event: AnalyticsEvent): void {
    if (!this.userBehavior) {
      this.userBehavior = {
        userId: event.userId,
        sessionDuration: 0,
        screenViews: [],
        actions: [],
        safetyInteractions: 0,
        panicButtonUsage: 0,
        geoFenceAlerts: 0,
        anomalyEvents: 0,
        lastActive: new Date(),
      };
    }

    this.userBehavior.lastActive = new Date();

    // Update session duration
    if (this.sessionStartTime) {
      this.userBehavior.sessionDuration =
        (Date.now() - this.sessionStartTime.getTime()) / (1000 * 60);
    }

    // Count specific interactions
    switch (event.eventType) {
      case 'safety_score_calculated':
        this.userBehavior.safetyInteractions++;
        break;
      case 'panic_button_activated':
        this.userBehavior.panicButtonUsage++;
        break;
      case 'geo_fence_alert':
        this.userBehavior.geoFenceAlerts++;
        break;
      case 'anomaly_detected':
        this.userBehavior.anomalyEvents++;
        break;
    }
  }

  // Generate Reports
  async generateReport(periodDays: number = 7): Promise<AnalyticsReport> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const periodEvents = this.events.filter(
      event => event.timestamp >= startDate && event.timestamp <= endDate,
    );

    // Calculate top screens
    const screenViews = periodEvents.filter(
      e => e.eventType === 'screen_view_start',
    );
    const screenCounts: Record<string, {count: number; totalDuration: number}> =
      {};

    screenViews.forEach(event => {
      const screenName = event.properties.screenName;
      if (!screenCounts[screenName]) {
        screenCounts[screenName] = {count: 0, totalDuration: 0};
      }
      screenCounts[screenName].count++;
      screenCounts[screenName].totalDuration += event.properties.duration || 0;
    });

    const topScreens = Object.entries(screenCounts)
      .map(([screenName, data]) => ({
        screenName,
        viewCount: data.count,
        averageDuration: data.totalDuration / data.count,
      }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);

    // Calculate top actions
    const actions = periodEvents.filter(e => e.eventType === 'user_action');
    const actionCounts: Record<string, number> = {};

    actions.forEach(event => {
      const action = event.properties.action;
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({action, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate insights and recommendations
    const insights = this.generateInsights(periodEvents);
    const recommendations = this.generateRecommendations(periodEvents);

    return {
      period: {start: startDate, end: endDate},
      userBehavior: this.userBehavior || {
        userId: 'current_user',
        sessionDuration: 0,
        screenViews: [],
        actions: [],
        safetyInteractions: 0,
        panicButtonUsage: 0,
        geoFenceAlerts: 0,
        anomalyEvents: 0,
        lastActive: new Date(),
      },
      safetyAnalytics: this.safetyAnalytics,
      performanceMetrics: this.performanceMetrics,
      topScreens,
      topActions,
      insights,
      recommendations,
    };
  }

  private generateInsights(events: AnalyticsEvent[]): string[] {
    const insights: string[] = [];

    // Safety insights
    const safetyEvents = events.filter(e => e.category === 'safety_event');
    if (safetyEvents.length > 0) {
      insights.push(
        `User had ${safetyEvents.length} safety-related events in this period`,
      );
    }

    // Performance insights
    const avgLaunchTime = this.performanceMetrics.appLaunchTime;
    if (avgLaunchTime > 3000) {
      insights.push('App launch time is slower than recommended (>3s)');
    }

    // Usage insights
    const screenViews = events.filter(e => e.eventType === 'screen_view_start');
    if (screenViews.length > 50) {
      insights.push('High app usage detected - user is very active');
    }

    return insights;
  }

  private generateRecommendations(events: AnalyticsEvent[]): string[] {
    const recommendations: string[] = [];

    // Safety recommendations
    const panicEvents = events.filter(
      e => e.eventType === 'panic_button_activated',
    );
    if (panicEvents.length > 2) {
      recommendations.push(
        'Consider reviewing safety protocols - multiple panic button activations',
      );
    }

    // Performance recommendations
    if (this.performanceMetrics.crashCount > 0) {
      recommendations.push(
        'App stability needs improvement - crashes detected',
      );
    }

    // Usage recommendations
    const safetyInteractions = events.filter(
      e => e.eventType === 'safety_score_calculated',
    );
    if (safetyInteractions.length < 5) {
      recommendations.push('Encourage more frequent safety score checks');
    }

    return recommendations;
  }

  // Utility Methods
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getUserBehavior(): UserBehavior | null {
    return this.userBehavior;
  }

  getSafetyAnalytics(): SafetyAnalytics {
    return {...this.safetyAnalytics};
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return {...this.performanceMetrics};
  }

  // Cleanup old data
  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.events = this.events.filter(event => event.timestamp > cutoffDate);
    await this.saveAnalyticsData();
  }
}

export const AnalyticsService = new AnalyticsServiceClass();
