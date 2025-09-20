module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-vector-icons|react-native-paper|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-reanimated|react-native-flash-message|react-native-haptic-feedback|react-native-linear-gradient|react-native-chart-kit|react-native-maps|react-native-geolocation-service|@react-native-async-storage|react-native-svg)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
