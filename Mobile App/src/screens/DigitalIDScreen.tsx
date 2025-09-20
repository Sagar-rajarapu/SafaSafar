import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  TextInput,
  List,
  Divider,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {theme, colors} from '../styles/theme';
import {
  BlockchainService,
  DigitalTouristID,
  KYCData,
  TripItinerary,
} from '../services/BlockchainService';

interface DigitalIDScreenProps {
  navigation: any;
}

const DigitalIDScreen: React.FC<DigitalIDScreenProps> = ({
  navigation: _navigation,
}) => {
  const [digitalID, setDigitalID] = useState<DigitalTouristID | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [validityStatus, setValidityStatus] = useState<{
    isValid: boolean;
    daysRemaining: number;
    status: string;
  } | null>(null);

  // KYC Form state
  const [kycForm, setKycForm] = useState({
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    documentType: 'aadhaar' as 'aadhaar' | 'passport',
    documentNumber: '',
  });

  // Trip Itinerary Form state
  const [tripForm, setTripForm] = useState({
    entryPoint: '',
    entryDate: '',
    exitDate: '',
    purpose: '',
    groupSize: '1',
    accommodationName: '',
    accommodationAddress: '',
    accommodationPhone: '',
  });

  useEffect(() => {
    initializeDigitalID();
  }, []);

  const initializeDigitalID = async () => {
    try {
      setIsLoading(true);
      const id = BlockchainService.getCurrentDigitalID();
      setDigitalID(id);

      if (id) {
        const status = await BlockchainService.checkValidityStatus();
        setValidityStatus(status);
      }
    } catch (error) {
      console.error('Failed to initialize digital ID:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDigitalID = async () => {
    if (!validateForms()) return;

    try {
      setIsCreating(true);

      const kycData: KYCData = {
        fullName: kycForm.fullName,
        dateOfBirth: kycForm.dateOfBirth,
        nationality: kycForm.nationality,
        documentType: kycForm.documentType,
        aadhaarNumber:
          kycForm.documentType === 'aadhaar'
            ? kycForm.documentNumber
            : undefined,
        passportNumber:
          kycForm.documentType === 'passport'
            ? kycForm.documentNumber
            : undefined,
        documentHash: generateDocumentHash(kycForm.documentNumber),
        verified: false,
      };

      const tripItinerary: TripItinerary = {
        entryPoint: tripForm.entryPoint,
        entryDate: new Date(tripForm.entryDate),
        exitDate: new Date(tripForm.exitDate),
        plannedLocations: [],
        accommodation: {
          name: tripForm.accommodationName,
          address: tripForm.accommodationAddress,
          coordinates: {latitude: 0, longitude: 0}, // Will be updated with actual location
          contactNumber: tripForm.accommodationPhone,
          checkInDate: new Date(tripForm.entryDate),
          checkOutDate: new Date(tripForm.exitDate),
        },
        purpose: tripForm.purpose,
        groupSize: parseInt(tripForm.groupSize),
      };

      const emergencyContacts = [
        {
          id: '1',
          name: 'Emergency Contact 1',
          phone: '+1234567890',
          relationship: 'Family',
          isPrimary: true,
          isLocal: false,
        },
      ];

      const newDigitalID = await BlockchainService.generateDigitalID(
        kycData,
        tripItinerary,
        emergencyContacts,
      );

      setDigitalID(newDigitalID);
      const status = await BlockchainService.checkValidityStatus();
      setValidityStatus(status);

      Alert.alert(
        'Digital ID Created',
        'Your digital tourist ID has been successfully created and registered on the blockchain.',
        [{text: 'OK'}],
      );
    } catch (error) {
      console.error('Failed to create digital ID:', error);
      Alert.alert('Error', 'Failed to create digital ID. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const validateForms = (): boolean => {
    if (
      !kycForm.fullName ||
      !kycForm.dateOfBirth ||
      !kycForm.nationality ||
      !kycForm.documentNumber
    ) {
      Alert.alert('Validation Error', 'Please fill in all KYC fields');
      return false;
    }

    if (
      !tripForm.entryPoint ||
      !tripForm.entryDate ||
      !tripForm.exitDate ||
      !tripForm.purpose
    ) {
      Alert.alert(
        'Validation Error',
        'Please fill in all trip itinerary fields',
      );
      return false;
    }

    return true;
  };

  const generateDocumentHash = (documentNumber: string): string => {
    // Mock hash generation - in real implementation, this would use proper hashing
    return `hash_${documentNumber}_${Date.now()}`;
  };

  const handleExtendValidity = async () => {
    try {
      await BlockchainService.extendValidityPeriod(30); // Extend by 30 days
      const status = await BlockchainService.checkValidityStatus();
      setValidityStatus(status);
      Alert.alert('Success', 'Validity period extended by 30 days');
    } catch (error) {
      Alert.alert('Error', 'Failed to extend validity period');
    }
  };

  const handleRevokeID = async () => {
    Alert.alert(
      'Revoke Digital ID',
      'Are you sure you want to revoke your digital ID? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await BlockchainService.revokeDigitalID();
              setDigitalID(null);
              setValidityStatus(null);
              Alert.alert('Success', 'Digital ID has been revoked');
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke digital ID');
            }
          },
        },
      ],
    );
  };

  const getValidityStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'expired':
        return colors.error;
      case 'revoked':
        return colors.danger;
      default:
        return colors.disabled;
    }
  };

  const getValidityStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'check-circle';
      case 'expired':
        return 'error';
      case 'revoked':
        return 'block';
      default:
        return 'help';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading Digital ID...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {digitalID ? (
          // Digital ID Display
          <>
            <Card style={styles.headerCard}>
              <Card.Content>
                <View style={styles.headerContent}>
                  <Icon
                    name="verified-user"
                    size={48}
                    color={theme.colors.primary}
                  />
                  <View style={styles.headerText}>
                    <Title style={styles.headerTitle}>Digital Tourist ID</Title>
                    <Paragraph style={styles.headerSubtitle}>
                      Blockchain Verified Identity
                    </Paragraph>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* ID Status */}
            <Card style={styles.statusCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>ID Status</Title>
                <View style={styles.statusRow}>
                  <Icon
                    name={getValidityStatusIcon(validityStatus?.status || '')}
                    size={24}
                    color={getValidityStatusColor(validityStatus?.status || '')}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: getValidityStatusColor(
                          validityStatus?.status || '',
                        ),
                      },
                    ]}>
                    {validityStatus?.status.toUpperCase()}
                  </Text>
                  <Chip
                    mode="outlined"
                    style={[
                      styles.statusChip,
                      {
                        borderColor: getValidityStatusColor(
                          validityStatus?.status || '',
                        ),
                      },
                    ]}>
                    {validityStatus?.daysRemaining} days remaining
                  </Chip>
                </View>
              </Card.Content>
            </Card>

            {/* ID Details */}
            <Card style={styles.detailsCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>ID Details</Title>
                <List.Item
                  title="Tourist ID"
                  description={digitalID.id}
                  left={() => (
                    <Icon
                      name="fingerprint"
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                />
                <Divider />
                <List.Item
                  title="Blockchain Address"
                  description={digitalID.touristAddress}
                  left={() => (
                    <Icon
                      name="account-balance-wallet"
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                />
                <Divider />
                <List.Item
                  title="Transaction Hash"
                  description={digitalID.blockchainTxHash || 'Pending...'}
                  left={() => (
                    <Icon name="link" size={24} color={theme.colors.primary} />
                  )}
                />
                <Divider />
                <List.Item
                  title="Created"
                  description={digitalID.createdAt.toLocaleDateString()}
                  left={() => (
                    <Icon
                      name="schedule"
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                />
              </Card.Content>
            </Card>

            {/* KYC Information */}
            <Card style={styles.kycCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>KYC Information</Title>
                <List.Item
                  title="Full Name"
                  description={digitalID.kycData.fullName}
                  left={() => (
                    <Icon
                      name="person"
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                />
                <Divider />
                <List.Item
                  title="Document Type"
                  description={digitalID.kycData.documentType.toUpperCase()}
                  left={() => (
                    <Icon
                      name="description"
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                />
                <Divider />
                <List.Item
                  title="Nationality"
                  description={digitalID.kycData.nationality}
                  left={() => (
                    <Icon name="flag" size={24} color={theme.colors.primary} />
                  )}
                />
                <Divider />
                <List.Item
                  title="Verification Status"
                  description={
                    digitalID.kycData.verified ? 'Verified' : 'Pending'
                  }
                  left={() => (
                    <Icon
                      name={digitalID.kycData.verified ? 'verified' : 'pending'}
                      size={24}
                      color={
                        digitalID.kycData.verified
                          ? colors.success
                          : colors.warning
                      }
                    />
                  )}
                />
              </Card.Content>
            </Card>

            {/* Trip Itinerary */}
            <Card style={styles.tripCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>Trip Itinerary</Title>
                <List.Item
                  title="Entry Point"
                  description={digitalID.tripItinerary.entryPoint}
                  left={() => (
                    <Icon name="place" size={24} color={theme.colors.primary} />
                  )}
                />
                <Divider />
                <List.Item
                  title="Entry Date"
                  description={digitalID.tripItinerary.entryDate.toLocaleDateString()}
                  left={() => (
                    <Icon name="event" size={24} color={theme.colors.primary} />
                  )}
                />
                <Divider />
                <List.Item
                  title="Exit Date"
                  description={digitalID.tripItinerary.exitDate.toLocaleDateString()}
                  left={() => (
                    <Icon name="event" size={24} color={theme.colors.primary} />
                  )}
                />
                <Divider />
                <List.Item
                  title="Purpose"
                  description={digitalID.tripItinerary.purpose}
                  left={() => (
                    <Icon name="info" size={24} color={theme.colors.primary} />
                  )}
                />
                <Divider />
                <List.Item
                  title="Group Size"
                  description={digitalID.tripItinerary.groupSize.toString()}
                  left={() => (
                    <Icon name="group" size={24} color={theme.colors.primary} />
                  )}
                />
              </Card.Content>
            </Card>

            {/* Actions */}
            <Card style={styles.actionsCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>Actions</Title>
                <View style={styles.actionButtons}>
                  <Button
                    mode="contained"
                    onPress={handleExtendValidity}
                    style={styles.actionButton}
                    disabled={validityStatus?.status !== 'active'}>
                    Extend Validity
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleRevokeID}
                    style={styles.actionButton}
                    buttonColor={colors.danger}
                    textColor={colors.danger}>
                    Revoke ID
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </>
        ) : (
          // Create Digital ID Form
          <>
            <Card style={styles.headerCard}>
              <Card.Content>
                <Title style={styles.headerTitle}>
                  Create Digital Tourist ID
                </Title>
                <Paragraph style={styles.headerSubtitle}>
                  Generate a blockchain-verified digital identity for your trip
                </Paragraph>
              </Card.Content>
            </Card>

            {/* KYC Form */}
            <Card style={styles.formCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>KYC Information</Title>
                <TextInput
                  label="Full Name"
                  value={kycForm.fullName}
                  onChangeText={(text: string) =>
                    setKycForm({...kycForm, fullName: text})
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Date of Birth (YYYY-MM-DD)"
                  value={kycForm.dateOfBirth}
                  onChangeText={(text: string) =>
                    setKycForm({...kycForm, dateOfBirth: text})
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Nationality"
                  value={kycForm.nationality}
                  onChangeText={(text: string) =>
                    setKycForm({...kycForm, nationality: text})
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Document Number"
                  value={kycForm.documentNumber}
                  onChangeText={(text: string) =>
                    setKycForm({...kycForm, documentNumber: text})
                  }
                  style={styles.input}
                />
              </Card.Content>
            </Card>

            {/* Trip Itinerary Form */}
            <Card style={styles.formCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>Trip Itinerary</Title>
                <TextInput
                  label="Entry Point"
                  value={tripForm.entryPoint}
                  onChangeText={(text: string) =>
                    setTripForm({...tripForm, entryPoint: text})
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Entry Date (YYYY-MM-DD)"
                  value={tripForm.entryDate}
                  onChangeText={(text: string) =>
                    setTripForm({...tripForm, entryDate: text})
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Exit Date (YYYY-MM-DD)"
                  value={tripForm.exitDate}
                  onChangeText={(text: string) =>
                    setTripForm({...tripForm, exitDate: text})
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Purpose of Visit"
                  value={tripForm.purpose}
                  onChangeText={(text: string) =>
                    setTripForm({...tripForm, purpose: text})
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Group Size"
                  value={tripForm.groupSize}
                  onChangeText={(text: string) =>
                    setTripForm({...tripForm, groupSize: text})
                  }
                  style={styles.input}
                  keyboardType="numeric"
                />
              </Card.Content>
            </Card>

            {/* Accommodation Form */}
            <Card style={styles.formCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>Accommodation Details</Title>
                <TextInput
                  label="Accommodation Name"
                  value={tripForm.accommodationName}
                  onChangeText={(text: string) =>
                    setTripForm({...tripForm, accommodationName: text})
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Address"
                  value={tripForm.accommodationAddress}
                  onChangeText={(text: string) =>
                    setTripForm({...tripForm, accommodationAddress: text})
                  }
                  style={styles.input}
                />
                <TextInput
                  label="Contact Number"
                  value={tripForm.accommodationPhone}
                  onChangeText={(text: string) =>
                    setTripForm({...tripForm, accommodationPhone: text})
                  }
                  style={styles.input}
                />
              </Card.Content>
            </Card>

            {/* Create Button */}
            <Card style={styles.createCard}>
              <Card.Content>
                <Button
                  mode="contained"
                  onPress={handleCreateDigitalID}
                  loading={isCreating}
                  disabled={isCreating}
                  style={styles.createButton}>
                  {isCreating ? 'Creating Digital ID...' : 'Create Digital ID'}
                </Button>
              </Card.Content>
            </Card>
          </>
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
  statusCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  cardTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  statusChip: {
    marginLeft: theme.spacing.sm,
  },
  detailsCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  kycCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  tripCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  actionsCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  formCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  input: {
    marginBottom: theme.spacing.sm,
  },
  createCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  createButton: {
    paddingVertical: theme.spacing.sm,
  },
});

export default DigitalIDScreen;
