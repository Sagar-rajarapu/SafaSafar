import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {Card, Title, Button, ProgressBar} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {BarChart} from 'react-native-chart-kit';
import {Dimensions} from 'react-native';

import {theme, colors} from '../styles/theme';
import {SafetyScoreService, SafetyScore} from '../services/SafetyScoreService';
import {LocationService} from '../services/LocationService';

interface SafetyScoreScreenProps {
  navigation: any;
}

const {width} = Dimensions.get('window');

const SafetyScoreScreen: React.FC<SafetyScoreScreenProps> = ({
  navigation: _navigation,
}) => {
  const [safetyScore, setSafetyScore] = useState<SafetyScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateSafetyScore();
  }, []);

  const calculateSafetyScore = async () => {
    try {
      setIsLoading(true);
      const location = await LocationService.getCurrentLocation();
      if (location) {
        const score = SafetyScoreService.calculateSafetyScore(location);
        setSafetyScore(score);
      }
    } catch (error) {
      console.error('Failed to calculate safety score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return colors.lowRisk;
      case 'medium':
        return colors.mediumRisk;
      case 'high':
        return colors.highRisk;
      default:
        return colors.mediumRisk;
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'check-circle';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'help';
    }
  };

  const getChartData = () => {
    if (!safetyScore) return null;

    return {
      labels: safetyScore.factors.map(factor => factor.name.split(' ')[0]),
      datasets: [
        {
          data: safetyScore.factors.map(factor => factor.value),
          color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        },
      ],
    };
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Calculating safety score...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!safetyScore) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Unable to calculate safety score</Text>
          <Button onPress={calculateSafetyScore}>Retry</Button>
        </View>
      </SafeAreaView>
    );
  }

  const chartData = getChartData();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Overall Score Card */}
        <Card style={styles.scoreCard}>
          <Card.Content>
            <View style={styles.scoreHeader}>
              <Title style={styles.scoreTitle}>Overall Safety Score</Title>
              <Icon
                name={getRiskIcon(safetyScore.riskLevel)}
                size={32}
                color={getRiskColor(safetyScore.riskLevel)}
              />
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreNumber}>{safetyScore.score}</Text>
              <Text style={styles.scoreMax}>/ 100</Text>
            </View>

            <ProgressBar
              progress={safetyScore.score / 100}
              color={getRiskColor(safetyScore.riskLevel)}
              style={styles.progressBar}
            />

            <Text style={styles.riskLevelText}>
              {safetyScore.riskLevel.toUpperCase()} RISK
            </Text>
          </Card.Content>
        </Card>

        {/* Factors Chart */}
        {chartData && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.chartTitle}>Risk Factors Breakdown</Title>
              <BarChart
                data={chartData}
                width={width - 80}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: theme.colors.surface,
                  backgroundGradientFrom: theme.colors.surface,
                  backgroundGradientTo: theme.colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        )}

        {/* Individual Factors */}
        <Card style={styles.factorsCard}>
          <Card.Content>
            <Title style={styles.factorsTitle}>Risk Factors</Title>
            {safetyScore.factors.map((factor, index) => (
              <View key={index} style={styles.factorItem}>
                <View style={styles.factorInfo}>
                  <Text style={styles.factorName}>{factor.name}</Text>
                  <Text style={styles.factorDescription}>
                    {factor.description}
                  </Text>
                </View>
                <View style={styles.factorValue}>
                  <Text style={styles.factorScore}>{factor.value}</Text>
                  <Icon
                    name={
                      factor.impact === 'positive'
                        ? 'trending-up'
                        : factor.impact === 'negative'
                        ? 'trending-down'
                        : 'trending-flat'
                    }
                    size={20}
                    color={
                      factor.impact === 'positive'
                        ? colors.success
                        : factor.impact === 'negative'
                        ? colors.error
                        : colors.disabled
                    }
                  />
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Recommendations */}
        <Card style={styles.recommendationsCard}>
          <Card.Content>
            <Title style={styles.recommendationsTitle}>Recommendations</Title>
            {safetyScore.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Icon
                  name="lightbulb-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Last Updated */}
        <Card style={styles.updateCard}>
          <Card.Content>
            <Text style={styles.updateText}>
              Last updated: {safetyScore.lastUpdated.toLocaleString()}
            </Text>
            <Button
              mode="outlined"
              onPress={calculateSafetyScore}
              style={styles.refreshButton}
              icon="refresh">
              Refresh Score
            </Button>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCard: {
    margin: theme.spacing.md,
    elevation: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  scoreTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.primary,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  scoreMax: {
    fontSize: theme.typography.h3.fontSize,
    color: theme.colors.secondary,
    marginLeft: theme.spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: theme.spacing.md,
  },
  riskLevelText: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  chartCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  chartTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  factorsCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  factorsTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  factorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  factorInfo: {
    flex: 1,
  },
  factorName: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  factorDescription: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  factorValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorScore: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  recommendationsCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  recommendationsTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  recommendationText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  updateCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  updateText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  refreshButton: {
    alignSelf: 'center',
  },
});

export default SafetyScoreScreen;
