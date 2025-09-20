import {StackNavigationProp} from '@react-navigation/stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  SafetyScore: undefined;
  GeoFencing: undefined;
  PanicButton: undefined;
  Tracking: undefined;
  DigitalID: undefined;
  AuthorityDashboard: undefined;
  Profile: undefined;
  Settings: undefined;
  SecuritySettings: undefined;
  AnalyticsDashboard: undefined;
};

export type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;
export type RegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Register'
>;
export type MainTabsNavigationProp = StackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

export type DashboardScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  'Dashboard'
>;
export type SafetyScoreScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  'SafetyScore'
>;
export type GeoFencingScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  'GeoFencing'
>;
export type PanicButtonScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  'PanicButton'
>;
export type TrackingScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  'Tracking'
>;
export type DigitalIDScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  'DigitalID'
>;
export type AuthorityDashboardScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  'AuthorityDashboard'
>;
export type ProfileScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  'Profile'
>;
export type SettingsScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  'Settings'
>;
export type SecuritySettingsScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  'SecuritySettings'
>;
export type AnalyticsDashboardScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  'AnalyticsDashboard'
>;
