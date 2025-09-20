import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {Card, Button, ProgressBar, Chip} from 'react-native-paper';
import {AnalyticsService} from '../services/AnalyticsService';
import {SecurityService} from '../services/SecurityService';
import {theme} from '../styles/theme';

const {width} = Dimensions.get('window');

const AnalyticsDashboardScreen: React.FC = () => {
  const [analyticsReport, setAnalyticsReport] = useState<any>(null);
  const [securityMetrics, setSecurityMetrics] = useState(
    SecurityService.getSecurityMetrics(),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(7); // days

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, loadAnalyticsData]);

  const loadAnalyticsData = React.useCallback(async () => {
    try {
      const report = await AnalyticsService.generateReport(selectedPeriod);
      setAnalyticsReport(report);
      setSecurityMetrics(SecurityService.getSecurityMetrics());
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }, [selectedPeriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  // const _formatTimestamp = (timestamp: Date) => {
  //   return new Date(timestamp).toLocaleDateString();
  // };

  const getPerformanceColor = (
    value: number,
    thresholds: {good: number; warning: number},
  ) => {
    if (value <= thresholds.good) return '#4caf50';
    if (value <= thresholds.warning) return '#ff9800';
    return '#f44336';
  };

  const renderMetricCard = (
    title: string,
    value: any,
    subtitle?: string,
    color?: string,
  ) => (
    <Card style={styles.metricCard}>
      <Card.Content>
        <Text
          style={[styles.metricValue, {color: color || theme.colors.primary}]}>
          {value}
        </Text>
        <Text style={styles.metricTitle}>{title}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );

  const renderProgressBar = (
    label: string,
    value: number,
    max: number,
    color?: string,
  ) => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressLabel}>{label}</Text>
      <ProgressBar
        progress={value / max}
        color={color || theme.colors.primary}
        style={styles.progressBar}
      />
      <Text style={styles.progressText}>
        {value}/{max}
      </Text>
    </View>
  );

  if (!analyticsReport) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <Text style={styles.title}>Analytics Dashboard</Text>

      {/* Period Selection */}
      <View style={styles.periodContainer}>
        {[1, 7, 30, 90].map(days => (
          <Chip
            key={days}
            selected={selectedPeriod === days}
            onPress={() => setSelectedPeriod(days)}
            style={styles.periodChip}>
            {days === 1 ? 'Today' : `${days} Days`}
          </Chip>
        ))}
      </View>

      {/* Overview Metrics */}
      <Card style={styles.card}>
        <Card.Title title="Overview" />
        <Card.Content>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Session Duration',
              formatDuration(analyticsReport.userBehavior.sessionDuration),
              'Average per session',
            )}
            {renderMetricCard(
              'Safety Interactions',
              analyticsReport.userBehavior.safetyInteractions,
              'Total safety checks',
            )}
            {renderMetricCard(
              'Panic Button Usage',
              analyticsReport.userBehavior.panicButtonUsage,
              'Emergency activations',
            )}
            {renderMetricCard(
              'Geo-fence Alerts',
              analyticsReport.userBehavior.geoFenceAlerts,
              'Zone violations',
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Safety Analytics */}
      <Card style={styles.card}>
        <Card.Title title="Safety Analytics" />
        <Card.Content>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Average Safety Score',
              `${analyticsReport.safetyAnalytics.averageSafetyScore.toFixed(
                1,
              )}/100`,
              'Overall safety rating',
              getPerformanceColor(
                analyticsReport.safetyAnalytics.averageSafetyScore,
                {good: 80, warning: 60},
              ),
            )}
            {renderMetricCard(
              'High Risk Events',
              analyticsReport.safetyAnalytics.highRiskEvents,
              'Critical safety incidents',
            )}
            {renderMetricCard(
              'Anomaly Detections',
              analyticsReport.safetyAnalytics.anomalyDetections,
              'Unusual activity alerts',
            )}
            {renderMetricCard(
              'Total Safety Checks',
              analyticsReport.safetyAnalytics.totalSafetyChecks,
              'Safety score calculations',
            )}
          </View>

          {/* Response Times */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Response Times</Text>
            {renderProgressBar(
              'Panic Button',
              analyticsReport.safetyAnalytics.responseTime.panicButton,
              10,
              getPerformanceColor(
                analyticsReport.safetyAnalytics.responseTime.panicButton,
                {good: 2, warning: 5},
              ),
            )}
            {renderProgressBar(
              'Geo-fence Alert',
              analyticsReport.safetyAnalytics.responseTime.geoFence,
              10,
              getPerformanceColor(
                analyticsReport.safetyAnalytics.responseTime.geoFence,
                {good: 2, warning: 5},
              ),
            )}
            {renderProgressBar(
              'Anomaly Detection',
              analyticsReport.safetyAnalytics.responseTime.anomaly,
              10,
              getPerformanceColor(
                analyticsReport.safetyAnalytics.responseTime.anomaly,
                {good: 2, warning: 5},
              ),
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Performance Metrics */}
      <Card style={styles.card}>
        <Card.Title title="Performance Metrics" />
        <Card.Content>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'App Launch Time',
              `${analyticsReport.performanceMetrics.appLaunchTime}ms`,
              'Cold start time',
              getPerformanceColor(
                analyticsReport.performanceMetrics.appLaunchTime,
                {good: 2000, warning: 3000},
              ),
            )}
            {renderMetricCard(
              'Memory Usage',
              `${analyticsReport.performanceMetrics.memoryUsage}MB`,
              'Current memory consumption',
            )}
            {renderMetricCard(
              'Crash Count',
              analyticsReport.performanceMetrics.crashCount,
              'Application crashes',
              analyticsReport.performanceMetrics.crashCount > 0
                ? '#f44336'
                : '#4caf50',
            )}
            {renderMetricCard(
              'Error Count',
              analyticsReport.performanceMetrics.errorCount,
              'Runtime errors',
              analyticsReport.performanceMetrics.errorCount > 0
                ? '#f44336'
                : '#4caf50',
            )}
          </View>

          {/* Screen Load Times */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Screen Load Times</Text>
            {Object.entries(
              analyticsReport.performanceMetrics.screenLoadTimes,
            ).map(([screen, time]) => (
              <View key={screen} style={styles.screenTimeRow}>
                <Text style={styles.screenName}>{screen}</Text>
                <Text
                  style={[
                    styles.screenTime,
                    {
                      color: getPerformanceColor(time as number, {
                        good: 1000,
                        warning: 2000,
                      }),
                    },
                  ]}>
                  {`${time}ms`}
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Top Screens */}
      <Card style={styles.card}>
        <Card.Title title="Most Visited Screens" />
        <Card.Content>
          {analyticsReport.topScreens.map((screen: any, index: number) => (
            <View key={index} style={styles.topItemRow}>
              <View style={styles.topItemInfo}>
                <Text style={styles.topItemName}>{screen.screenName}</Text>
                <Text style={styles.topItemSubtitle}>
                  {screen.viewCount} views • {screen.averageDuration.toFixed(1)}
                  s avg
                </Text>
              </View>
              <View style={styles.topItemRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Top Actions */}
      <Card style={styles.card}>
        <Card.Title title="Most Used Actions" />
        <Card.Content>
          {analyticsReport.topActions.map((action: any, index: number) => (
            <View key={index} style={styles.topItemRow}>
              <View style={styles.topItemInfo}>
                <Text style={styles.topItemName}>{action.action}</Text>
                <Text style={styles.topItemSubtitle}>{action.count} times</Text>
              </View>
              <View style={styles.topItemRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Security Metrics */}
      <Card style={styles.card}>
        <Card.Title title="Security Metrics" />
        <Card.Content>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Login Attempts',
              securityMetrics.totalLoginAttempts,
              'Total attempts',
            )}
            {renderMetricCard(
              'Failed Attempts',
              securityMetrics.failedLoginAttempts,
              'Unsuccessful logins',
              securityMetrics.failedLoginAttempts > 0 ? '#f44336' : '#4caf50',
            )}
            {renderMetricCard(
              'Account Status',
              securityMetrics.accountLocked ? 'Locked' : 'Active',
              'Current status',
              securityMetrics.accountLocked ? '#f44336' : '#4caf50',
            )}
            {renderMetricCard(
              'Suspicious Activities',
              securityMetrics.suspiciousActivities,
              'Detected anomalies',
              securityMetrics.suspiciousActivities > 0 ? '#f44336' : '#4caf50',
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Insights and Recommendations */}
      <Card style={styles.card}>
        <Card.Title title="Insights & Recommendations" />
        <Card.Content>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            {analyticsReport.insights.map((insight: string, index: number) => (
              <View key={index} style={styles.insightRow}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {analyticsReport.recommendations.map(
              (recommendation: string, index: number) => (
                <View key={index} style={styles.insightRow}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.insightText}>{recommendation}</Text>
                </View>
              ),
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Risk Trends Chart Placeholder */}
      <Card style={styles.card}>
        <Card.Title title="Safety Score Trends" />
        <Card.Content>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartText}>Safety Score Trend Chart</Text>
            <Text style={styles.chartSubtext}>
              {analyticsReport.safetyAnalytics.riskTrends.length} data points
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Export Button */}
      <Button
        mode="contained"
        onPress={() => {
          // Mock export functionality
          console.log('Exporting analytics report...');
        }}
        style={styles.exportButton}>
        Export Report
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  periodChip: {
    marginHorizontal: 4,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 48) / 2,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  metricTitle: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: theme.colors.text,
    width: 120,
  },
  progressBar: {
    flex: 1,
    height: 8,
    marginHorizontal: 8,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  screenTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  screenName: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  screenTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  topItemSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  topItemRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rankNumber: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: theme.colors.primary,
    marginRight: 8,
    marginTop: 2,
  },
  insightText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  chartText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  chartSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  exportButton: {
    marginVertical: 16,
  },
});

export default AnalyticsDashboardScreen;
