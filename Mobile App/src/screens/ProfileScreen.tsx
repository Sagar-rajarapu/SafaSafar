import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {Card, Title, Paragraph, Button, List, Avatar} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/MaterialIcons';

import {theme, colors} from '../styles/theme';
import {AuthService, User} from '../services/AuthService';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  navigation: _navigation,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const currentUser = AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.logout();
            // Navigation will be handled by App.tsx
          } catch (error) {
            console.error('Logout failed:', error);
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    Alert.alert('Edit Profile', 'Edit profile functionality coming soon');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Unable to load profile</Text>
          <Button onPress={loadUserProfile}>Retry</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text
                size={80}
                label={user.name.charAt(0).toUpperCase()}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Title style={styles.userName}>{user.name}</Title>
                <Paragraph style={styles.userEmail}>{user.email}</Paragraph>
                <Paragraph style={styles.userPhone}>{user.phone}</Paragraph>
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={handleEditProfile}
              style={styles.editButton}
              icon="edit">
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        {/* Account Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Account Information</Title>
            <List.Item
              title="Member Since"
              description={user.createdAt.toLocaleDateString()}
              left={props => <List.Icon {...props} icon="calendar" />}
            />
            <List.Item
              title="Last Login"
              description={user.lastLogin.toLocaleString()}
              left={props => <List.Icon {...props} icon="login" />}
            />
            <List.Item
              title="User ID"
              description={user.id}
              left={props => <List.Icon {...props} icon="fingerprint" />}
            />
          </Card.Content>
        </Card>

        {/* Emergency Contacts */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Emergency Contacts</Title>
            {user.emergencyContacts.length === 0 ? (
              <Paragraph style={styles.emptyText}>
                No emergency contacts added
              </Paragraph>
            ) : (
              user.emergencyContacts.map(contact => (
                <List.Item
                  key={contact.id}
                  title={contact.name}
                  description={`${contact.phone} • ${contact.relationship}`}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={contact.isPrimary ? 'star' : 'person'}
                      color={
                        contact.isPrimary
                          ? colors.warning
                          : theme.colors.primary
                      }
                    />
                  )}
                />
              ))
            )}
            <Button
              mode="text"
              onPress={() =>
                Alert.alert(
                  'Add Contact',
                  'Add contact functionality coming soon',
                )
              }
              style={styles.addButton}
              icon="plus">
              Add Emergency Contact
            </Button>
          </Card.Content>
        </Card>

        {/* Preferences */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Preferences</Title>
            <List.Item
              title="Language"
              description={user.preferences.language}
              left={props => <List.Icon {...props} icon="language" />}
            />
            <List.Item
              title="Theme"
              description={user.preferences.theme}
              left={props => <List.Icon {...props} icon="palette" />}
            />
            <List.Item
              title="Notifications"
              description={
                user.preferences.notifications ? 'Enabled' : 'Disabled'
              }
              left={props => <List.Icon {...props} icon="notifications" />}
            />
            <List.Item
              title="Location Tracking"
              description={
                user.preferences.trackingEnabled ? 'Enabled' : 'Disabled'
              }
              left={props => <List.Icon {...props} icon="my-location" />}
            />
            <List.Item
              title="Panic Button"
              description={
                user.preferences.panicButtonEnabled ? 'Enabled' : 'Disabled'
              }
              left={props => <List.Icon {...props} icon="emergency" />}
            />
            <List.Item
              title="Geo-Fencing"
              description={
                user.preferences.geoFencingEnabled ? 'Enabled' : 'Disabled'
              }
              left={props => <List.Icon {...props} icon="location-on" />}
            />
          </Card.Content>
        </Card>

        {/* App Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>App Information</Title>
            <List.Item
              title="Version"
              description="1.0.0"
              left={props => <List.Icon {...props} icon="info" />}
            />
            <List.Item
              title="Build"
              description="2024.01.01"
              left={props => <List.Icon {...props} icon="build" />}
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
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Card style={styles.logoutCard}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.logoutButton}
              buttonColor={colors.error}
              icon="logout">
              Logout
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
  profileCard: {
    margin: theme.spacing.md,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  userPhone: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
  },
  editButton: {
    alignSelf: 'flex-start',
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
  emptyText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  addButton: {
    marginTop: theme.spacing.sm,
  },
  logoutCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  logoutButton: {
    marginVertical: theme.spacing.sm,
  },
});

export default ProfileScreen;
