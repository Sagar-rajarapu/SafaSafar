import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

import {theme, colors} from '../styles/theme';
import {PanicButtonService, PanicAlert} from '../services/PanicButtonService';
// import {LocationService} from '../services/LocationService';

interface PanicButtonScreenProps {
  navigation: any;
}

// const {width: _width, height: _height} = Dimensions.get('window');

const PanicButtonScreen: React.FC<PanicButtonScreenProps> = ({
  navigation: _navigation,
}) => {
  const [isPanicActive, setIsPanicActive] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<PanicAlert | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    checkPanicStatus();
    setupPanicCallbacks();
  }, []);

  const checkPanicStatus = () => {
    setIsPanicActive(PanicButtonService.isPanicButtonActive());
    setCurrentAlert(PanicButtonService.getCurrentAlert());
  };

  const setupPanicCallbacks = () => {
    PanicButtonService.addPanicCallback(alert => {
      setCurrentAlert(alert);
      setIsPanicActive(alert.status === 'active');

      if (alert.status === 'active') {
        startPulseAnimation();
      } else {
        stopPulseAnimation();
      }
    });
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const activatePanicButton = async () => {
    try {
      ReactNativeHapticFeedback.trigger('impactHeavy');

      setIsLoading(true);
      const alert = await PanicButtonService.activatePanicButton();
      setCurrentAlert(alert);
      setIsPanicActive(true);
      startPulseAnimation();
    } catch (error) {
      console.error('Panic button activation failed:', error);
      Alert.alert(
        'Error',
        'Failed to activate panic button. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const cancelPanicAlert = async () => {
    Alert.alert(
      'Cancel Panic Alert',
      'Are you sure you want to cancel the panic alert?',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await PanicButtonService.cancelPanicAlert();
            setCurrentAlert(null);
            setIsPanicActive(false);
            stopPulseAnimation();
          },
        },
      ],
    );
  };

  const resolvePanicAlert = async () => {
    Alert.alert(
      'Resolve Panic Alert',
      'Are you safe now? This will resolve the panic alert.',
      [
        {text: 'No', style: 'cancel'},
        {
          text: "Yes, I'm Safe",
          style: 'default',
          onPress: async () => {
            await PanicButtonService.resolvePanicAlert();
            setCurrentAlert(null);
            setIsPanicActive(false);
            stopPulseAnimation();
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.panic;
      case 'acknowledged':
        return colors.warning;
      case 'resolved':
        return colors.success;
      case 'cancelled':
        return colors.disabled;
      default:
        return colors.disabled;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'acknowledged':
        return 'ACKNOWLEDGED';
      case 'resolved':
        return 'RESOLVED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return 'UNKNOWN';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Emergency Panic Button</Title>
          <Paragraph style={styles.headerSubtitle}>
            {isPanicActive
              ? 'Panic alert is currently active'
              : 'Press the button below in case of emergency'}
          </Paragraph>
        </View>

        {/* Panic Button */}
        <View style={styles.panicButtonContainer}>
          <Animated.View
            style={[
              styles.panicButtonWrapper,
              {transform: [{scale: pulseAnim}]},
            ]}>
            <TouchableOpacity
              style={[
                styles.panicButton,
                isPanicActive && styles.panicButtonActive,
              ]}
              onPress={isPanicActive ? undefined : activatePanicButton}
              disabled={isLoading || isPanicActive}>
              <LinearGradient
                colors={
                  isPanicActive
                    ? [colors.panic, colors.emergency]
                    : [theme.colors.primary, theme.colors.accent]
                }
                style={styles.panicButtonGradient}>
                {isLoading ? (
                  <ActivityIndicator color="white" size="large" />
                ) : (
                  <Icon name="emergency" size={60} color="white" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.panicButtonText}>
            {isPanicActive ? 'PANIC ACTIVE' : 'PRESS FOR EMERGENCY'}
          </Text>
        </View>

        {/* Status Card */}
        {currentAlert && (
          <Card style={styles.statusCard}>
            <Card.Content>
              <View style={styles.statusHeader}>
                <Title style={styles.statusTitle}>Alert Status</Title>
                <Chip
                  style={[
                    styles.statusChip,
                    {backgroundColor: getStatusColor(currentAlert.status)},
                  ]}
                  textStyle={styles.statusChipText}>
                  {getStatusText(currentAlert.status)}
                </Chip>
              </View>

              <Paragraph style={styles.statusText}>
                Alert ID: {currentAlert.id}
              </Paragraph>
              <Paragraph style={styles.statusText}>
                Time: {currentAlert.timestamp.toLocaleString()}
              </Paragraph>
              <Paragraph style={styles.statusText}>
                Location: {currentAlert.location.latitude.toFixed(4)},{' '}
                {currentAlert.location.longitude.toFixed(4)}
              </Paragraph>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        {isPanicActive && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={cancelPanicAlert}
              style={styles.actionButton}
              buttonColor={colors.warning}
              textColor="white"
              icon="cancel">
              Cancel Alert
            </Button>

            <Button
              mode="contained"
              onPress={resolvePanicAlert}
              style={styles.actionButton}
              buttonColor={colors.success}
              icon="check">
              I'm Safe
            </Button>
          </View>
        )}

        {/* Emergency Contacts */}
        <Card style={styles.contactsCard}>
          <Card.Content>
            <Title style={styles.contactsTitle}>Emergency Contacts</Title>
            <View style={styles.contactList}>
              <View style={styles.contactItem}>
                <Icon name="local-police" size={24} color={colors.panic} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>Police</Text>
                  <Text style={styles.contactNumber}>100</Text>
                </View>
              </View>

              <View style={styles.contactItem}>
                <Icon name="support-agent" size={24} color={colors.alert} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>Tourism Helpline</Text>
                  <Text style={styles.contactNumber}>1363</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Instructions */}
        <Card style={styles.instructionsCard}>
          <Card.Content>
            <Title style={styles.instructionsTitle}>Instructions</Title>
            <Paragraph style={styles.instructionText}>
              • Press the panic button only in genuine emergencies
            </Paragraph>
            <Paragraph style={styles.instructionText}>
              • Your location will be automatically shared with authorities
            </Paragraph>
            <Paragraph style={styles.instructionText}>
              • Stay calm and follow instructions from emergency services
            </Paragraph>
            <Paragraph style={styles.instructionText}>
              • Use the action buttons to cancel or resolve the alert
            </Paragraph>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  panicButtonContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  panicButtonWrapper: {
    marginBottom: theme.spacing.lg,
  },
  panicButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    elevation: 8,
    shadowColor: colors.panic,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  panicButtonActive: {
    elevation: 12,
    shadowOpacity: 0.5,
  },
  panicButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panicButtonText: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  statusCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusTitle: {
    fontSize: theme.typography.h4.fontSize,
    color: theme.colors.primary,
  },
  statusChip: {
    borderRadius: theme.roundness,
  },
  statusChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  contactsCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  contactsTitle: {
    fontSize: theme.typography.h4.fontSize,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  contactList: {
    gap: theme.spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    marginLeft: theme.spacing.md,
  },
  contactName: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  contactNumber: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
  },
  instructionsCard: {
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: theme.typography.h4.fontSize,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  instructionText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
  },
});

export default PanicButtonScreen;
