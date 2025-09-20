import AsyncStorage from '@react-native-async-storage/async-storage';
import {showMessage} from 'react-native-flash-message';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  emergencyContacts: EmergencyContact[];
  preferences: UserPreferences;
  createdAt: Date;
  lastLogin: Date;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
}

export interface UserPreferences {
  language: string;
  notifications: boolean;
  trackingEnabled: boolean;
  panicButtonEnabled: boolean;
  geoFencingEnabled: boolean;
  theme: 'light' | 'dark';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  emergencyContacts: EmergencyContact[];
}

class AuthServiceClass {
  private currentUser: User | null = null;
  private isAuthenticated = false;

  async initialize() {
    try {
      await this.loadStoredUser();
      console.log('AuthService initialized successfully');
    } catch (error) {
      console.error('AuthService initialization failed:', error);
    }
  }

  private async loadStoredUser() {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        this.currentUser = {
          ...user,
          createdAt: new Date(user.createdAt),
          lastLogin: new Date(user.lastLogin),
        };
        this.isAuthenticated = true;
      }
    } catch (error) {
      console.error('Failed to load stored user:', error);
    }
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      await this.simulateApiDelay();

      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      const user = await this.findUserByEmail(credentials.email);
      if (!user) {
        throw new Error('User not found');
      }

      if (credentials.password !== 'password123') {
        throw new Error('Invalid password');
      }

      user.lastLogin = new Date();
      this.currentUser = user;
      this.isAuthenticated = true;

      await this.storeUser(user);

      showMessage({
        message: 'Login successful',
        type: 'success',
      });

      return user;
    } catch (error) {
      console.error('Login error:', error);
      showMessage({
        message: error instanceof Error ? error.message : 'Login failed',
        type: 'danger',
      });
      throw error;
    }
  }

  async register(data: RegisterData): Promise<User> {
    try {
      await this.simulateApiDelay();

      if (!data.email || !data.password || !data.name || !data.phone) {
        throw new Error('All fields are required');
      }

      const existingUser = await this.findUserByEmail(data.email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      const user: User = {
        id: this.generateUserId(),
        email: data.email,
        name: data.name,
        phone: data.phone,
        emergencyContacts: data.emergencyContacts || [],
        preferences: {
          language: 'en',
          notifications: true,
          trackingEnabled: false,
          panicButtonEnabled: true,
          geoFencingEnabled: true,
          theme: 'light' as 'light' | 'dark',
        },
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      this.currentUser = user;
      this.isAuthenticated = true;

      await this.storeUser(user);

      showMessage({
        message: 'Registration successful',
        type: 'success',
      });

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      showMessage({
        message: error instanceof Error ? error.message : 'Registration failed',
        type: 'danger',
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      this.currentUser = null;
      this.isAuthenticated = false;

      await AsyncStorage.removeItem('currentUser');

      showMessage({
        message: 'Logged out successfully',
        type: 'info',
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  async checkAuthStatus(): Promise<boolean> {
    await this.loadStoredUser();
    return this.isAuthenticated;
  }

  private async storeUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user:', error);
      throw error;
    }
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    const mockUsers = [
      {
        id: '1',
        email: 'demo@example.com',
        name: 'Demo User',
        phone: '+1234567890',
        emergencyContacts: [
          {
            id: '1',
            name: 'Emergency Contact',
            phone: '+1234567891',
            relationship: 'Family',
            isPrimary: true,
          },
        ],
        preferences: {
          language: 'en',
          notifications: true,
          trackingEnabled: false,
          panicButtonEnabled: true,
          geoFencingEnabled: true,
          theme: 'light' as 'light' | 'dark',
        },
        createdAt: new Date(),
        lastLogin: new Date(),
      },
    ];

    return mockUsers.find(user => user.email === email) || null;
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export const AuthService = new AuthServiceClass();
