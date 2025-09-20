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
  DataTable,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {theme, colors} from '../styles/theme';
import {
  AuthorityDashboardService,
  DashboardStats,
  TouristCluster,
  HeatMapData,
  EFIRData,
  AuthorityUser,
} from '../services/AuthorityDashboardService';

interface AuthorityDashboardScreenProps {
  navigation: any;
}

const AuthorityDashboardScreen: React.FC<AuthorityDashboardScreenProps> = ({
  navigation: _navigation,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthorityUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [touristClusters, setTouristClusters] = useState<TouristCluster[]>([]);
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([]);
  const [efirRecords, setEfirRecords] = useState<EFIRData[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'clusters' | 'heatmap' | 'efir'
  >('overview');

  const initializeDashboard = React.useCallback(async () => {
    try {
      setIsLoading(true);

      // Mock login for demo purposes
      const user = await AuthorityDashboardService.login(
        'police_001',
        'password123',
      );
      setCurrentUser(user);

      // Load dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      Alert.alert('Error', 'Failed to initialize dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const dashboardStats = AuthorityDashboardService.getDashboardStats();
      const clusters = AuthorityDashboardService.getTouristClusters();
      const heatMap = AuthorityDashboardService.getHeatMapData();
      const efir = AuthorityDashboardService.getEFIRRecords();

      setStats(dashboardStats);
      setTouristClusters(clusters);
      setHeatMapData(heatMap);
      setEfirRecords(efir);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  // const _handleCreateEFIR = (touristId: string) => {
  //   Alert.prompt('Create E-FIR', 'Enter incident description:', [
  //     {text: 'Cancel', style: 'cancel'},
  //     {
  //       text: 'Create',
  //       onPress: async description => {
  //         if (description) {
  //           try {
  //             const efir = await AuthorityDashboardService.generateEFIR(
  //               touristId,
  //               'safety_concern',
  //               description,
  //             );
  //             setEfirRecords([...efirRecords, efir]);
  //             Alert.alert('Success', 'E-FIR created successfully');
  //           } catch (error) {
  //             Alert.alert('Error', 'Failed to create E-FIR');
  //           }
  //         }
  //       },
  //     },
  //   ]);
  // };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'high':
        return colors.error;
      case 'critical':
        return colors.danger;
      default:
        return colors.disabled;
    }
  };

  // const _getRiskLevelIcon = (riskLevel: string) => {
  //   switch (riskLevel) {
  //     case 'low':
  //       return 'check-circle';
  //     case 'medium':
  //       return 'warning';
  //     case 'high':
  //       return 'error';
  //     case 'critical':
  //       return 'dangerous';
  //     default:
  //       return 'help';
  //   }
  // };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <Icon name="dashboard" size={32} color={theme.colors.primary} />
              <View style={styles.headerText}>
                <Title style={styles.headerTitle}>Authority Dashboard</Title>
                <Paragraph style={styles.headerSubtitle}>
                  Welcome, {currentUser?.name}
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Tab Navigation */}
        <Card style={styles.tabCard}>
          <Card.Content>
            <View style={styles.tabContainer}>
              <Button
                mode={selectedTab === 'overview' ? 'contained' : 'outlined'}
                onPress={() => setSelectedTab('overview')}
                style={styles.tabButton}>
                Overview
              </Button>
              <Button
                mode={selectedTab === 'clusters' ? 'contained' : 'outlined'}
                onPress={() => setSelectedTab('clusters')}
                style={styles.tabButton}>
                Clusters
              </Button>
              <Button
                mode={selectedTab === 'heatmap' ? 'contained' : 'outlined'}
                onPress={() => setSelectedTab('heatmap')}
                style={styles.tabButton}>
                Heat Map
              </Button>
              <Button
                mode={selectedTab === 'efir' ? 'contained' : 'outlined'}
                onPress={() => setSelectedTab('efir')}
                style={styles.tabButton}>
                E-FIR
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Overview Tab */}
        {selectedTab === 'overview' && stats && (
          <>
            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
              <Card style={styles.statCard}>
                <Card.Content>
                  <View style={styles.statContent}>
                    <Icon
                      name="people"
                      size={24}
                      color={theme.colors.primary}
                    />
                    <View style={styles.statText}>
                      <Text style={styles.statNumber}>
                        {stats.totalTourists}
                      </Text>
                      <Text style={styles.statLabel}>Total Tourists</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content>
                  <View style={styles.statContent}>
                    <Icon name="location-on" size={24} color={colors.success} />
                    <View style={styles.statText}>
                      <Text style={styles.statNumber}>
                        {stats.activeTourists}
                      </Text>
                      <Text style={styles.statLabel}>Active</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content>
                  <View style={styles.statContent}>
                    <Icon name="warning" size={24} color={colors.error} />
                    <View style={styles.statText}>
                      <Text style={styles.statNumber}>
                        {stats.missingTourists}
                      </Text>
                      <Text style={styles.statLabel}>Missing</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content>
                  <View style={styles.statContent}>
                    <Icon name="dangerous" size={24} color={colors.danger} />
                    <View style={styles.statText}>
                      <Text style={styles.statNumber}>
                        {stats.highRiskTourists}
                      </Text>
                      <Text style={styles.statLabel}>High Risk</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </View>

            {/* Recent Incidents */}
            <Card style={styles.incidentsCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>Recent Incidents</Title>
                <Text style={styles.incidentText}>
                  Total Incidents: {stats.totalIncidents}
                </Text>
                <Text style={styles.incidentText}>
                  Resolved: {stats.resolvedIncidents}
                </Text>
                <Text style={styles.incidentText}>
                  Pending E-FIRs: {stats.pendingEFIRs}
                </Text>
                <Text style={styles.incidentText}>
                  Avg Response Time: {stats.averageResponseTime} min
                </Text>
              </Card.Content>
            </Card>
          </>
        )}

        {/* Clusters Tab */}
        {selectedTab === 'clusters' && (
          <Card style={styles.clustersCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Tourist Clusters</Title>
              {touristClusters.length === 0 ? (
                <Text style={styles.noDataText}>No tourist clusters found</Text>
              ) : (
                touristClusters.map(cluster => (
                  <Card key={cluster.id} style={styles.clusterItem}>
                    <Card.Content>
                      <View style={styles.clusterHeader}>
                        <View style={styles.clusterInfo}>
                          <Text style={styles.clusterTitle}>
                            Cluster {cluster.id.slice(-6)}
                          </Text>
                          <Text style={styles.clusterSubtitle}>
                            {cluster.touristCount} tourists
                          </Text>
                        </View>
                        <Chip
                          mode="outlined"
                          style={[
                            styles.riskChip,
                            {borderColor: getRiskLevelColor(cluster.riskLevel)},
                          ]}>
                          {cluster.riskLevel.toUpperCase()}
                        </Chip>
                      </View>
                      <Text style={styles.clusterLocation}>
                        Location: {cluster.center.latitude.toFixed(4)},{' '}
                        {cluster.center.longitude.toFixed(4)}
                      </Text>
                      <Text style={styles.clusterRadius}>
                        Radius: {cluster.radius}m
                      </Text>
                    </Card.Content>
                  </Card>
                ))
              )}
            </Card.Content>
          </Card>
        )}

        {/* Heat Map Tab */}
        {selectedTab === 'heatmap' && (
          <Card style={styles.heatmapCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Risk Heat Map</Title>
              {heatMapData.length === 0 ? (
                <Text style={styles.noDataText}>
                  No heat map data available
                </Text>
              ) : (
                heatMapData.map(point => (
                  <Card key={point.id} style={styles.heatmapItem}>
                    <Card.Content>
                      <View style={styles.heatmapHeader}>
                        <View style={styles.heatmapInfo}>
                          <Text style={styles.heatmapTitle}>
                            {point.zoneType.toUpperCase()} Zone
                          </Text>
                          <Text style={styles.heatmapSubtitle}>
                            Intensity: {(point.intensity * 100).toFixed(1)}%
                          </Text>
                        </View>
                        <Chip
                          mode="outlined"
                          style={[
                            styles.riskChip,
                            {borderColor: getRiskLevelColor(point.riskLevel)},
                          ]}>
                          {point.riskLevel.toUpperCase()}
                        </Chip>
                      </View>
                      <Text style={styles.heatmapLocation}>
                        Location: {point.coordinates.latitude.toFixed(4)},{' '}
                        {point.coordinates.longitude.toFixed(4)}
                      </Text>
                      <Text style={styles.heatmapIncidents}>
                        Incidents: {point.incidentCount}
                      </Text>
                    </Card.Content>
                  </Card>
                ))
              )}
            </Card.Content>
          </Card>
        )}

        {/* E-FIR Tab */}
        {selectedTab === 'efir' && (
          <Card style={styles.efirCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>E-FIR Records</Title>
              {efirRecords.length === 0 ? (
                <Text style={styles.noDataText}>No E-FIR records found</Text>
              ) : (
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Case No.</DataTable.Title>
                    <DataTable.Title>Tourist</DataTable.Title>
                    <DataTable.Title>Type</DataTable.Title>
                    <DataTable.Title>Status</DataTable.Title>
                  </DataTable.Header>
                  {efirRecords.map(efir => (
                    <DataTable.Row key={efir.id}>
                      <DataTable.Cell>{efir.caseNumber}</DataTable.Cell>
                      <DataTable.Cell>{efir.touristName}</DataTable.Cell>
                      <DataTable.Cell>{efir.incidentType}</DataTable.Cell>
                      <DataTable.Cell>
                        <Chip
                          mode="outlined"
                          style={[
                            styles.statusChip,
                            {borderColor: getRiskLevelColor(efir.severity)},
                          ]}>
                          {efir.status}
                        </Chip>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              )}
            </Card.Content>
          </Card>
        )}
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
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text,
  },
  headerCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  tabCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statCard: {
    width: '48%',
    marginBottom: theme.spacing.sm,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: theme.spacing.sm,
  },
  statNumber: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  incidentsCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  cardTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  incidentText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  clustersCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  clusterItem: {
    marginBottom: theme.spacing.sm,
    elevation: 1,
  },
  clusterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  clusterInfo: {
    flex: 1,
  },
  clusterTitle: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  clusterSubtitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  clusterLocation: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  clusterRadius: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  heatmapCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  heatmapItem: {
    marginBottom: theme.spacing.sm,
    elevation: 1,
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  heatmapInfo: {
    flex: 1,
  },
  heatmapTitle: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  heatmapSubtitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  heatmapLocation: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  heatmapIncidents: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  efirCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  riskChip: {
    marginLeft: theme.spacing.sm,
  },
  statusChip: {
    marginLeft: theme.spacing.sm,
  },
  noDataText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: theme.spacing.lg,
  },
});

export default AuthorityDashboardScreen;
