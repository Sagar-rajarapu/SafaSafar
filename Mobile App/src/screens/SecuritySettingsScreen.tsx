import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {Card, Button} from 'react-native-paper';
import {SecurityService} from '../services/SecurityService';
import {BiometricService} from '../services/BiometricService';
import {NotificationService} from '../services/NotificationService';
import {theme} from '../styles/theme';

const SecuritySettingsScreen: React.FC = () => {
  const [securityConfig, setSecurityConfig] = useState(
    SecurityService.getSecurityConfig(),
  );
  const [biometricConfig, setBiometricConfig] = useState(
    BiometricService.getConfiguration(),
  );
  const [notificationConfig, setNotificationConfig] = useState(
    NotificationService.getConfiguration(),
  );
  const [securityMetrics] = useState(SecurityService.getSecurityMetrics());
  const [biometricCapabilities, setBiometricCapabilities] = useState(
    BiometricService.getCapabilities(),
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const logs = await SecurityService.getAuditLogs();
      setAuditLogs(logs.slice(0, 20)); // Show last 20 logs
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  };

  const handleSecurityConfigUpdate = async (updates: any) => {
    try {
      await SecurityService.updateSecurityConfig(updates);
      setSecurityConfig({...securityConfig, ...updates});
      Alert.alert('Success', 'Security settings updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update security settings');
    }
  };

  const handleBiometricConfigUpdate = async (updates: any) => {
    try {
      await BiometricService.updateConfiguration(updates);
      setBiometricConfig({...biometricConfig, ...updates});
      Alert.alert('Success', 'Biometric settings updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const handleNotificationConfigUpdate = async (updates: any) => {
    try {
      await NotificationService.updateConfiguration(updates);
      setNotificationConfig({...notificationConfig, ...updates});
      Alert.alert('Success', 'Notification settings updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const validation = SecurityService.validatePassword(newPassword);
    if (!validation.isValid) {
      Alert.alert('Error', validation.errors.join('\n'));
      return;
    }

    try {
      // Mock password change
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const handleBiometricEnrollment = async () => {
    try {
      const result = await BiometricService.enrollBiometric();
      if (result.success) {
        Alert.alert(
          'Success',
          'Biometric authentication enrolled successfully',
        );
        setBiometricCapabilities(BiometricService.getCapabilities());
      } else {
        Alert.alert(
          'Error',
          result.error || 'Failed to enroll biometric authentication',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to enroll biometric authentication');
    }
  };

  const handleBiometricRemoval = async () => {
    Alert.alert(
      'Remove Biometric Authentication',
      'Are you sure you want to remove biometric authentication?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await BiometricService.removeBiometric();
              if (result.success) {
                Alert.alert(
                  'Success',
                  'Biometric authentication removed successfully',
                );
                setBiometricCapabilities(BiometricService.getCapabilities());
              } else {
                Alert.alert(
                  'Error',
                  result.error || 'Failed to remove biometric authentication',
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove biometric authentication');
            }
          },
        },
      ],
    );
  };

  const performSecurityCheck = async () => {
    try {
      const result = await SecurityService.performSecurityCheck();
      Alert.alert(
        'Security Check',
        `Security Score: ${result.score}/100\n\nIssues:\n${
          result.issues.join('\n') || 'None'
        }`,
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to perform security check');
    }
  };

  const clearAuditLogs = async () => {
    Alert.alert(
      'Clear Audit Logs',
      'Are you sure you want to clear all audit logs?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Mock clearing audit logs
              setAuditLogs([]);
              Alert.alert('Success', 'Audit logs cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear audit logs');
            }
          },
        },
      ],
    );
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return '#f44336';
      case 'high':
        return '#ff9800';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Security Settings</Text>

      {/* Security Configuration */}
      <Card style={styles.card}>
        <Card.Title title="Security Configuration" />
        <Card.Content>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Session Timeout (minutes)</Text>
            <TextInput
              style={styles.numberInput}
              value={securityConfig.sessionTimeout.toString()}
              onChangeText={text =>
                handleSecurityConfigUpdate({
                  sessionTimeout: parseInt(text) || 30,
                })
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Max Login Attempts</Text>
            <TextInput
              style={styles.numberInput}
              value={securityConfig.maxLoginAttempts.toString()}
              onChangeText={text =>
                handleSecurityConfigUpdate({
                  maxLoginAttempts: parseInt(text) || 5,
                })
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Lock Enabled</Text>
            <Switch
              value={securityConfig.autoLockEnabled}
              onValueChange={value =>
                handleSecurityConfigUpdate({autoLockEnabled: value})
              }
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Lock Timeout (minutes)</Text>
            <TextInput
              style={styles.numberInput}
              value={securityConfig.autoLockTimeout.toString()}
              onChangeText={text =>
                handleSecurityConfigUpdate({
                  autoLockTimeout: parseInt(text) || 5,
                })
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Audit Logging</Text>
            <Switch
              value={securityConfig.auditLogging}
              onValueChange={value =>
                handleSecurityConfigUpdate({auditLogging: value})
              }
            />
          </View>
        </Card.Content>
      </Card>

      {/* Biometric Authentication */}
      <Card style={styles.card}>
        <Card.Title title="Biometric Authentication" />
        <Card.Content>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Biometric Enabled</Text>
            <Switch
              value={biometricConfig.enabled}
              onValueChange={value =>
                handleBiometricConfigUpdate({enabled: value})
              }
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Biometric Type</Text>
            <Text style={styles.valueText}>{biometricConfig.type}</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Fallback Enabled</Text>
            <Switch
              value={biometricConfig.fallbackEnabled}
              onValueChange={value =>
                handleBiometricConfigUpdate({fallbackEnabled: value})
              }
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Max Attempts</Text>
            <TextInput
              style={styles.numberInput}
              value={biometricConfig.maxAttempts.toString()}
              onChangeText={text =>
                handleBiometricConfigUpdate({maxAttempts: parseInt(text) || 5})
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={handleBiometricEnrollment}
              disabled={!biometricCapabilities.isAvailable}
              style={styles.button}>
              Enroll Biometric
            </Button>
            <Button
              mode="outlined"
              onPress={handleBiometricRemoval}
              disabled={!biometricCapabilities.isEnrolled}
              style={styles.button}>
              Remove Biometric
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Notification Settings */}
      <Card style={styles.card}>
        <Card.Title title="Notification Settings" />
        <Card.Content>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Emergency Notifications</Text>
            <Switch
              value={notificationConfig.emergencyNotifications}
              onValueChange={value =>
                handleNotificationConfigUpdate({emergencyNotifications: value})
              }
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Safety Alerts</Text>
            <Switch
              value={notificationConfig.safetyAlerts}
              onValueChange={value =>
                handleNotificationConfigUpdate({safetyAlerts: value})
              }
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Geo-fence Alerts</Text>
            <Switch
              value={notificationConfig.geoFenceAlerts}
              onValueChange={value =>
                handleNotificationConfigUpdate({geoFenceAlerts: value})
              }
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Anomaly Alerts</Text>
            <Switch
              value={notificationConfig.anomalyAlerts}
              onValueChange={value =>
                handleNotificationConfigUpdate({anomalyAlerts: value})
              }
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound Enabled</Text>
            <Switch
              value={notificationConfig.soundEnabled}
              onValueChange={value =>
                handleNotificationConfigUpdate({soundEnabled: value})
              }
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Vibration Enabled</Text>
            <Switch
              value={notificationConfig.vibrationEnabled}
              onValueChange={value =>
                handleNotificationConfigUpdate({vibrationEnabled: value})
              }
            />
          </View>
        </Card.Content>
      </Card>

      {/* Security Metrics */}
      <Card style={styles.card}>
        <Card.Title title="Security Metrics" />
        <Card.Content>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Login Attempts:</Text>
            <Text style={styles.metricValue}>
              {securityMetrics.totalLoginAttempts}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Failed Login Attempts:</Text>
            <Text style={styles.metricValue}>
              {securityMetrics.failedLoginAttempts}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Account Locked:</Text>
            <Text
              style={[
                styles.metricValue,
                {color: securityMetrics.accountLocked ? '#f44336' : '#4caf50'},
              ]}>
              {securityMetrics.accountLocked ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Suspicious Activities:</Text>
            <Text style={styles.metricValue}>
              {securityMetrics.suspiciousActivities}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Last Login Attempt:</Text>
            <Text style={styles.metricValue}>
              {formatTimestamp(securityMetrics.lastLoginAttempt)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Security Actions */}
      <Card style={styles.card}>
        <Card.Title title="Security Actions" />
        <Card.Content>
          <Button
            mode="contained"
            onPress={performSecurityCheck}
            style={styles.actionButton}>
            Perform Security Check
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowPasswordModal(true)}
            style={styles.actionButton}>
            Change Password
          </Button>
          <Button
            mode="outlined"
            onPress={clearAuditLogs}
            style={styles.actionButton}>
            Clear Audit Logs
          </Button>
        </Card.Content>
      </Card>

      {/* Audit Logs */}
      <Card style={styles.card}>
        <Card.Title title="Recent Audit Logs" />
        <Card.Content>
          {auditLogs.length > 0 ? (
            auditLogs.map((log, index) => (
              <View key={index} style={styles.logRow}>
                <View style={styles.logHeader}>
                  <Text style={styles.logAction}>{log.action}</Text>
                  <View
                    style={[
                      styles.riskBadge,
                      {backgroundColor: getRiskLevelColor(log.riskLevel)},
                    ]}>
                    <Text style={styles.riskText}>
                      {log.riskLevel.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.logTimestamp}>
                  {formatTimestamp(log.timestamp)}
                </Text>
                <Text style={styles.logDetails}>{log.details}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noLogsText}>No audit logs available</Text>
          )}
        </Card.Content>
      </Card>

      {/* Password Change Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowPasswordModal(false)}
                style={styles.modalButton}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handlePasswordChange}
                style={styles.modalButton}>
                Change Password
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  valueText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  metricValue: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  actionButton: {
    marginVertical: 4,
  },
  logRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logAction: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  logTimestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  logDetails: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  noLogsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default SecuritySettingsScreen;
