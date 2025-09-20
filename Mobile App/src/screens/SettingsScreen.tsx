import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {Card, Title, Button, Switch, List} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/MaterialIcons';

import {theme, colors} from '../styles/theme';
import {AuthService, User} from '../services/AuthService';
import {TrackingService} from '../services/TrackingService';
import {GeoFencingService} from '../services/GeoFencingService';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation: _navigation,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [geoFencingEnabled, setGeoFencingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);

      const currentUser = AuthService.getCurrentUser();
      setUser(currentUser);

      const trackingSettings = TrackingService.getTrackingSettings();
      setTrackingEnabled(trackingSettings.isEnabled);

      const geoFencingStatus = GeoFencingService.isGeoFencingEnabled();
      setGeoFencingEnabled(geoFencingStatus);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTracking = async () => {
    try {
      if (trackingEnabled) {
        TrackingService.stopTracking();
        setTrackingEnabled(false);
      } else {
        await TrackingService.startTracking();
        setTrackingEnabled(true);
      }
    } catch (error) {
      console.error('Failed to toggle tracking:', error);
      Alert.alert('Error', 'Failed to update tracking settings');
    }
  };

  const toggleGeoFencing = async () => {
    try {
      if (geoFencingEnabled) {
        await GeoFencingService.disableGeoFencing();
        setGeoFencingEnabled(false);
      } else {
        await GeoFencingService.enableGeoFencing();
        setGeoFencingEnabled(true);
      }
    } catch (error) {
      console.error('Failed to toggle geo-fencing:', error);
      Alert.alert('Error', 'Failed to update geo-fencing settings');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all your tracking history, alerts, and settings. This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: () => {
            // Clear tracking data
            TrackingService.clearTrackingHistory();
            // Clear geo-fencing alerts
            GeoFencingService.clearAlertHistory();
            Alert.alert('Success', 'All data has been cleared');
          },
        },
      ],
    );
  };

  const handleExportData = () => {
    TrackingService.exportTrackingData();
    Alert.alert('Export Data', 'Your data has been exported successfully');
  };

  const handleAbout = () => {
    Alert.alert(
      'About SafeSafar',
      'SafeSafar v1.0.0\n\nSmart Tourist Safety Monitoring & Incident Response System\n\nDeveloped for enhanced tourist safety in Odisha, India.',
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Safety Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Safety Settings</Title>

            <List.Item
              title="Location Tracking"
              description="Track your location for safety monitoring"
              left={props => <List.Icon {...props} icon="my-location" />}
              right={() => (
                <Switch
                  value={trackingEnabled}
                  onValueChange={toggleTracking}
                  color={theme.colors.primary}
                />
              )}
            />

            <List.Item
              title="Geo-Fencing"
              description="Receive alerts when entering/exiting zones"
              left={props => <List.Icon {...props} icon="location-on" />}
              right={() => (
                <Switch
                  value={geoFencingEnabled}
                  onValueChange={toggleGeoFencing}
                  color={theme.colors.primary}
                />
              )}
            />

            <List.Item
              title="Panic Button"
              description="Enable emergency panic button"
              left={props => <List.Icon {...props} icon="emergency" />}
              right={() => (
                <Switch
                  value={user?.preferences.panicButtonEnabled || false}
                  onValueChange={_value => {
                    // Update user preferences
                    Alert.alert(
                      'Panic Button',
                      'Panic button settings updated',
                    );
                  }}
                  color={theme.colors.primary}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Privacy Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Privacy Settings</Title>

            <List.Item
              title="Share with Family"
              description="Allow family members to view your location"
              left={props => <List.Icon {...props} icon="family-tree" />}
              right={() => (
                <Switch
                  value={user?.preferences.trackingEnabled || false}
                  onValueChange={_value => {
                    Alert.alert(
                      'Family Sharing',
                      'Family sharing settings updated',
                    );
                  }}
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
                  value={false}
                  onValueChange={_value => {
                    Alert.alert(
                      'Police Access',
                      'Police access settings updated',
                    );
                  }}
                  color={theme.colors.primary}
                />
              )}
            />

            <List.Item
              title="Share with Tourism Dept"
              description="Allow tourism department access"
              left={props => <List.Icon {...props} icon="support-agent" />}
              right={() => (
                <Switch
                  value={false}
                  onValueChange={_value => {
                    Alert.alert(
                      'Tourism Access',
                      'Tourism access settings updated',
                    );
                  }}
                  color={theme.colors.primary}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Notification Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Notifications</Title>

            <List.Item
              title="Push Notifications"
              description="Receive push notifications"
              left={props => <List.Icon {...props} icon="notifications" />}
              right={() => (
                <Switch
                  value={user?.preferences.notifications || false}
                  onValueChange={_value => {
                    Alert.alert(
                      'Notifications',
                      'Notification settings updated',
                    );
                  }}
                  color={theme.colors.primary}
                />
              )}
            />

            <List.Item
              title="Email Alerts"
              description="Receive email alerts for emergencies"
              left={props => <List.Icon {...props} icon="email" />}
              right={() => (
                <Switch
                  value={true}
                  onValueChange={_value => {
                    Alert.alert('Email Alerts', 'Email alert settings updated');
                  }}
                  color={theme.colors.primary}
                />
              )}
            />

            <List.Item
              title="SMS Alerts"
              description="Receive SMS alerts for emergencies"
              left={props => <List.Icon {...props} icon="sms" />}
              right={() => (
                <Switch
                  value={true}
                  onValueChange={_value => {
                    Alert.alert('SMS Alerts', 'SMS alert settings updated');
                  }}
                  color={theme.colors.primary}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* App Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>App Settings</Title>

            <List.Item
              title="Language"
              description="English"
              left={props => <List.Icon {...props} icon="language" />}
              onPress={() =>
                Alert.alert('Language', 'Language selection coming soon')
              }
            />

            <List.Item
              title="Theme"
              description={user?.preferences.theme || 'Light'}
              left={props => <List.Icon {...props} icon="palette" />}
              onPress={() =>
                Alert.alert('Theme', 'Theme selection coming soon')
              }
            />

            <List.Item
              title="Units"
              description="Metric (km, m)"
              left={props => <List.Icon {...props} icon="straighten" />}
              onPress={() => Alert.alert('Units', 'Unit selection coming soon')}
            />
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Data Management</Title>

            <Button
              mode="outlined"
              onPress={handleExportData}
              style={styles.actionButton}
              icon="download">
              Export My Data
            </Button>

            <Button
              mode="outlined"
              onPress={handleClearData}
              style={styles.actionButton}
              icon="delete"
              buttonColor={colors.error}
              textColor="white">
              Clear All Data
            </Button>
          </Card.Content>
        </Card>

        {/* Support & Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Support & Information</Title>

            <List.Item
              title="Help & Support"
              description="Get help with using the app"
              left={props => <List.Icon {...props} icon="help" />}
              onPress={() => Alert.alert('Help', 'Help section coming soon')}
            />

            <List.Item
              title="Privacy Policy"
              description="View our privacy policy"
              left={props => <List.Icon {...props} icon="privacy-tip" />}
              onPress={() =>
                Alert.alert('Privacy Policy', 'Privacy policy coming soon')
              }
            />

            <List.Item
              title="Terms of Service"
              description="View terms of service"
              left={props => <List.Icon {...props} icon="description" />}
              onPress={() =>
                Alert.alert('Terms of Service', 'Terms of service coming soon')
              }
            />

            <List.Item
              title="About"
              description="App version and information"
              left={props => <List.Icon {...props} icon="info" />}
              onPress={handleAbout}
            />
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
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
});

export default SettingsScreen;
