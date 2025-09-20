import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {Card, Title, Paragraph, Button, Switch, List} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {theme, colors} from '../styles/theme';
import {
  TrackingService,
  TrackingSettings,
  TrackingStats,
} from '../services/TrackingService';

interface TrackingScreenProps {
  navigation: any;
}

const TrackingScreen: React.FC<TrackingScreenProps> = ({
  navigation: _navigation,
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [settings, setSettings] = useState<TrackingSettings | null>(null);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeTracking();
  }, []);

  const initializeTracking = async () => {
    try {
      setIsLoading(true);

      const trackingActive = TrackingService.isTrackingActive();
      setIsTracking(trackingActive);

      const trackingSettings = TrackingService.getTrackingSettings();
      setSettings(trackingSettings);

      const trackingStats = TrackingService.getTrackingStats();
      setStats(trackingStats);
    } catch (error) {
      console.error('Tracking initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTracking = async () => {
    try {
      if (isTracking) {
        TrackingService.stopTracking();
        setIsTracking(false);
      } else {
        await TrackingService.startTracking();
        setIsTracking(true);
      }
      await initializeTracking();
    } catch (error) {
      console.error('Failed to toggle tracking:', error);
      Alert.alert('Error', 'Failed to update tracking settings');
    }
  };

  const updateSettings = async (newSettings: Partial<TrackingSettings>) => {
    try {
      await TrackingService.updateTrackingSettings(newSettings);
      const updatedSettings = TrackingService.getTrackingSettings();
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      Alert.alert('Error', 'Failed to update tracking settings');
    }
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear Tracking History',
      'Are you sure you want to clear all tracking history? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            TrackingService.clearTrackingHistory();
            initializeTracking();
          },
        },
      ],
    );
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatSpeed = (speed: number) => {
    return `${speed.toFixed(1)} m/s`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading tracking data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <View>
                <Title style={styles.headerTitle}>Location Tracking</Title>
                <Paragraph style={styles.headerSubtitle}>
                  {isTracking
                    ? 'Currently tracking your location'
                    : 'Location tracking is disabled'}
                </Paragraph>
              </View>
              <Switch
                value={isTracking}
                onValueChange={toggleTracking}
                color={theme.colors.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Tracking Status</Title>
            <View style={styles.statusItem}>
              <Icon
                name="my-location"
                size={24}
                color={isTracking ? colors.success : colors.disabled}
              />
              <Text style={styles.statusText}>
                {isTracking ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Icon name="history" size={24} color={colors.primary} />
              <Text style={styles.statusText}>
                {stats?.locationCount || 0} locations recorded
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Statistics */}
        {stats && (
          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Tracking Statistics</Title>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {formatDistance(stats.totalDistance)}
                  </Text>
                  <Text style={styles.statLabel}>Total Distance</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {formatTime(stats.totalTime)}
                  </Text>
                  <Text style={styles.statLabel}>Total Time</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {formatSpeed(stats.averageSpeed)}
                  </Text>
                  <Text style={styles.statLabel}>Avg Speed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {formatSpeed(stats.maxSpeed)}
                  </Text>
                  <Text style={styles.statLabel}>Max Speed</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Settings */}
        {settings && (
          <Card style={styles.settingsCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Tracking Settings</Title>

              <List.Item
                title="Share with Family"
                description="Allow family members to view your location"
                left={props => <List.Icon {...props} icon="family-tree" />}
                right={() => (
                  <Switch
                    value={settings.shareWithFamily}
                    onValueChange={value =>
                      updateSettings({shareWithFamily: value})
                    }
                    color={theme.colors.primary}
                  />
                )}
              />

              <List.Item
                title="Share with Police"
                description="Allow police access during emergencies"
                left={props => <List.Icon {...props} icon="local-police" />}
                right={() => (
                  <Switch
                    value={settings.shareWithPolice}
                    onValueChange={value =>
                      updateSettings({shareWithPolice: value})
                    }
                    color={theme.colors.primary}
                  />
                )}
              />

              <List.Item
                title="Share with Tourism Dept"
                description="Allow tourism department access for safety"
                left={props => <List.Icon {...props} icon="support-agent" />}
                right={() => (
                  <Switch
                    value={settings.shareWithTourism}
                    onValueChange={value =>
                      updateSettings({shareWithTourism: value})
                    }
                    color={theme.colors.primary}
                  />
                )}
              />

              <List.Item
                title="Update Interval"
                description={`${settings.updateInterval / 1000} seconds`}
                left={props => <List.Icon {...props} icon="schedule" />}
              />
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Actions</Title>
            <Button
              mode="outlined"
              onPress={clearHistory}
              style={styles.actionButton}
              icon="delete"
              buttonColor={colors.error}
              textColor="white">
              Clear History
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                TrackingService.exportTrackingData();
                // In a real app, you would share this data
                Alert.alert('Export', 'Tracking data exported successfully');
              }}
              style={styles.actionButton}
              icon="download">
              Export Data
            </Button>
          </Card.Content>
        </Card>

        {/* Privacy Notice */}
        <Card style={styles.privacyCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Privacy Notice</Title>
            <Paragraph style={styles.privacyText}>
              Your location data is stored locally on your device and is only
              shared with authorized parties when you explicitly enable sharing
              options. You can disable tracking at any time.
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
    marginTop: theme.spacing.xs,
  },
  statusCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  card: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  cardTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.secondary,
    marginLeft: theme.spacing.sm,
  },
  statsCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  settingsCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  actionsCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  privacyCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  privacyText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
    lineHeight: 20,
  },
});

export default TrackingScreen;
