import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';

import {theme, colors} from '../styles/theme';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({navigation}) => {
  const [isPanicActive] = useState(false);
  const [isTracking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);

      // Simulate initialization
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      Alert.alert('Error', 'Failed to initialize dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await initializeDashboard();
    setIsRefreshing(false);
  };

  const handlePanicButton = () => {
    navigation.navigate('PanicButton');
  };

  const handleLocationTracking = () => {
    navigation.navigate('Tracking');
  };

  const handleGeoFencing = () => {
    navigation.navigate('GeoFencing');
  };

  const handleSafetyScore = () => {
    navigation.navigate('SafetyScore');
  };

  // const getRiskColor = (riskLevel: string) => {
  //   switch (riskLevel) {
  //     case 'low':
  //       return colors.lowRisk;
  //     case 'medium':
  //       return colors.mediumRisk;
  //     case 'high':
  //       return colors.highRisk;
  //     default:
  //       return colors.mediumRisk;
  //   }
  // };

  // const getRiskIcon = (riskLevel: string) => {
  //   switch (riskLevel) {
  //     case 'low':
  //       return 'check-circle';
  //     case 'medium':
  //       return 'warning';
  //     case 'high':
  //       return 'error';
  //     default:
  //       return 'help';
  //   }
  // };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SafeSafar Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Location: Demo Location (37.7749, -122.4194)
          </Text>
        </View>

        {/* Safety Score Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.safetyScoreHeader}>
              <Title style={styles.cardTitle}>Safety Score</Title>
              <Chip
                style={[styles.riskChip, {backgroundColor: colors.lowRisk}]}
                textStyle={styles.riskChipText}>
                LOW
              </Chip>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>85</Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>

            <Paragraph style={styles.scoreDescription}>
              Stay safe and follow guidelines
            </Paragraph>

            <Button
              mode="outlined"
              onPress={handleSafetyScore}
              style={styles.actionButton}
              icon="arrow-forward">
              View Details
            </Button>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Actions</Title>

            <View style={styles.actionGrid}>
              <Button
                mode="contained"
                onPress={handlePanicButton}
                style={[
                  styles.actionButton,
                  isPanicActive && styles.panicButtonActive,
                ]}
                contentStyle={styles.actionButtonContent}
                icon="emergency"
                buttonColor={
                  isPanicActive ? colors.panic : theme.colors.primary
                }>
                {isPanicActive ? 'Panic Active' : 'Panic Button'}
              </Button>

              <Button
                mode="outlined"
                onPress={handleLocationTracking}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                icon="my-location">
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </Button>

              <Button
                mode="outlined"
                onPress={handleGeoFencing}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                icon="location-on">
                Geo-Fencing
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Status Cards */}
        <View style={styles.statusGrid}>
          <Card style={styles.statusCard}>
            <Card.Content style={styles.statusContent}>
              <Text style={styles.statusIcon}>📍</Text>
              <Text style={styles.statusText}>Location Active</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statusCard}>
            <Card.Content style={styles.statusContent}>
              <Text style={styles.statusIcon}>🛡️</Text>
              <Text style={styles.statusText}>Safety Monitored</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Emergency Contacts */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Emergency Contacts</Title>
            <View style={styles.contactList}>
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>🚔</Text>
                <Text style={styles.contactText}>Police: 100</Text>
              </View>
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactText}>Tourism Helpline: 1363</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.secondary,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.surface,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.surface,
    opacity: 0.8,
  },
  card: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  safetyScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  riskChip: {
    borderRadius: theme.roundness,
  },
  riskChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  scoreLabel: {
    fontSize: 16,
    color: theme.colors.secondary,
    marginLeft: 4,
  },
  scoreDescription: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    color: theme.colors.secondary,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    margin: theme.spacing.xs,
    minWidth: 120,
  },
  actionButtonContent: {
    paddingVertical: theme.spacing.sm,
  },
  panicButtonActive: {
    elevation: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    margin: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statusCard: {
    flex: 1,
    elevation: 1,
  },
  statusContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  statusIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  contactList: {
    marginTop: theme.spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  contactText: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
});

export default DashboardScreen;
