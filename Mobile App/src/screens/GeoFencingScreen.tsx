import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {Card, Title, Paragraph, Switch, Chip} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, {Marker, Circle} from 'react-native-maps';

import {theme, colors} from '../styles/theme';
import {GeoFencingService, GeoFenceAlert} from '../services/GeoFencingService';
import {LocationService, GeoFenceZone} from '../services/LocationService';

interface GeoFencingScreenProps {
  navigation: any;
}

const GeoFencingScreen: React.FC<GeoFencingScreenProps> = ({
  navigation: _navigation,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [zones, setZones] = useState<GeoFenceZone[]>([]);
  const [alerts, setAlerts] = useState<GeoFenceAlert[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  useEffect(() => {
    initializeGeoFencing();
  }, []);

  const initializeGeoFencing = async () => {
    try {
      const enabled = GeoFencingService.isGeoFencingEnabled();
      setIsEnabled(enabled);

      const geoZones = GeoFencingService.getGeoFenceZones();
      setZones(geoZones);

      const alertHistory = GeoFencingService.getAlertHistory();
      setAlerts(alertHistory);

      // Get current location
      const location = await LocationService.getCurrentLocation();
      if (location) {
        setCurrentLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Geo-fencing initialization failed:', error);
    }
  };

  const toggleGeoFencing = async () => {
    try {
      if (isEnabled) {
        await GeoFencingService.disableGeoFencing();
        setIsEnabled(false);
      } else {
        await GeoFencingService.enableGeoFencing();
        setIsEnabled(true);
      }
    } catch (error) {
      console.error('Failed to toggle geo-fencing:', error);
      Alert.alert('Error', 'Failed to update geo-fencing settings');
    }
  };

  const getZoneTypeColor = (type: string) => {
    switch (type) {
      case 'high-risk':
        return colors.highRisk;
      case 'restricted':
        return colors.panic;
      case 'cave':
        return colors.warning;
      case 'forest':
        return colors.success;
      case 'safe':
        return colors.lowRisk;
      default:
        return colors.disabled;
    }
  };

  const getZoneTypeIcon = (type: string) => {
    switch (type) {
      case 'high-risk':
        return 'warning';
      case 'restricted':
        return 'block';
      case 'cave':
        return 'terrain';
      case 'forest':
        return 'park';
      case 'safe':
        return 'check-circle';
      default:
        return 'help';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <View>
                <Title style={styles.headerTitle}>Geo-Fencing</Title>
                <Paragraph style={styles.headerSubtitle}>
                  Monitor your location against predefined zones
                </Paragraph>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={toggleGeoFencing}
                color={theme.colors.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Map View */}
        {currentLocation && (
          <Card style={styles.mapCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Current Location & Zones</Title>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  region={currentLocation}
                  showsUserLocation
                  showsMyLocationButton>
                  {zones.map(zone => (
                    <React.Fragment key={zone.id}>
                      <Marker
                        coordinate={zone.center}
                        title={zone.name}
                        description={zone.alertMessage}
                      />
                      <Circle
                        center={zone.center}
                        radius={zone.radius}
                        fillColor={`${getZoneTypeColor(zone.type)}20`}
                        strokeColor={getZoneTypeColor(zone.type)}
                        strokeWidth={2}
                      />
                    </React.Fragment>
                  ))}
                </MapView>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Active Zones */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Active Zones</Title>
            {zones.length === 0 ? (
              <Paragraph style={styles.emptyText}>
                No geo-fence zones configured
              </Paragraph>
            ) : (
              zones.map(zone => (
                <View key={zone.id} style={styles.zoneItem}>
                  <View style={styles.zoneInfo}>
                    <Icon
                      name={getZoneTypeIcon(zone.type)}
                      size={24}
                      color={getZoneTypeColor(zone.type)}
                    />
                    <View style={styles.zoneDetails}>
                      <Text style={styles.zoneName}>{zone.name}</Text>
                      <Text style={styles.zoneType}>
                        {zone.type.toUpperCase()}
                      </Text>
                      <Text style={styles.zoneRadius}>
                        Radius: {zone.radius}m
                      </Text>
                    </View>
                  </View>
                  <Chip
                    style={[
                      styles.zoneStatusChip,
                      {
                        backgroundColor: zone.isActive
                          ? colors.success
                          : colors.disabled,
                      },
                    ]}
                    textStyle={styles.zoneStatusText}>
                    {zone.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Chip>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Recent Alerts */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Recent Alerts</Title>
            {alerts.length === 0 ? (
              <Paragraph style={styles.emptyText}>No recent alerts</Paragraph>
            ) : (
              alerts.slice(0, 5).map(alert => (
                <View key={alert.id} style={styles.alertItem}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertZone}>{alert.zoneName}</Text>
                    <Text style={styles.alertType}>
                      {alert.alertType === 'enter' ? 'Entered' : 'Exited'}
                    </Text>
                    <Text style={styles.alertTime}>
                      {alert.timestamp.toLocaleString()}
                    </Text>
                  </View>
                  <Chip
                    style={[
                      styles.alertChip,
                      {
                        backgroundColor: alert.isRead
                          ? colors.disabled
                          : colors.warning,
                      },
                    ]}
                    textStyle={styles.alertChipText}>
                    {alert.isRead ? 'READ' : 'NEW'}
                  </Chip>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Statistics */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Statistics</Title>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{zones.length}</Text>
                <Text style={styles.statLabel}>Total Zones</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {zones.filter(z => z.isActive).length}
                </Text>
                <Text style={styles.statLabel}>Active Zones</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{alerts.length}</Text>
                <Text style={styles.statLabel}>Total Alerts</Text>
              </View>
            </View>
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
  mapCard: {
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
  mapContainer: {
    height: 200,
    borderRadius: theme.roundness,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  emptyText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  zoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  zoneDetails: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  zoneName: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  zoneType: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  zoneRadius: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.secondary,
  },
  zoneStatusChip: {
    borderRadius: theme.roundness,
  },
  zoneStatusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  alertInfo: {
    flex: 1,
  },
  alertZone: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  alertType: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  alertTime: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  alertChip: {
    borderRadius: theme.roundness,
  },
  alertChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
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
  },
});

export default GeoFencingScreen;
