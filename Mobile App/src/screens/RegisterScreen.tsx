import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {theme} from '../styles/theme';
import {
  AuthService,
  RegisterData,
  // EmergencyContact,
} from '../services/AuthService';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({navigation}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleRegister = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const registerData: RegisterData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        emergencyContacts: [
          {
            id: '1',
            name: 'Emergency Contact',
            phone: '+1234567890',
            relationship: 'Family',
            isPrimary: true,
          },
        ],
      };

      await AuthService.register(registerData);
      // Navigation will be handled by App.tsx based on auth status
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>SafeSafar</Text>
            <Text style={styles.subtitle}>Create Your Account</Text>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Sign Up</Title>
              <Paragraph style={styles.cardSubtitle}>
                Join SafeSafar for enhanced tourist safety
              </Paragraph>

              <TextInput
                label="Full Name *"
                value={formData.name}
                onChangeText={value => handleInputChange('name', value)}
                mode="outlined"
                style={styles.input}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                  },
                }}
              />

              <TextInput
                label="Email *"
                value={formData.email}
                onChangeText={value => handleInputChange('email', value)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                  },
                }}
              />

              <TextInput
                label="Phone Number *"
                value={formData.phone}
                onChangeText={value => handleInputChange('phone', value)}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                  },
                }}
              />

              <TextInput
                label="Password *"
                value={formData.password}
                onChangeText={value => handleInputChange('password', value)}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                  },
                }}
              />

              <TextInput
                label="Confirm Password *"
                value={formData.confirmPassword}
                onChangeText={value =>
                  handleInputChange('confirmPassword', value)
                }
                mode="outlined"
                secureTextEntry
                style={styles.input}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                  },
                }}
              />

              <Button
                mode="contained"
                onPress={handleRegister}
                style={styles.registerButton}
                contentStyle={styles.buttonContent}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  'Create Account'
                )}
              </Button>

              <Button
                mode="text"
                onPress={handleLogin}
                style={styles.loginButton}
                labelStyle={styles.loginButtonText}>
                Already have an account? Sign In
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  card: {
    elevation: 4,
  },
  cardTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardSubtitle: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  registerButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  loginButton: {
    marginTop: theme.spacing.sm,
  },
  loginButtonText: {
    color: theme.colors.primary,
  },
});

export default RegisterScreen;
