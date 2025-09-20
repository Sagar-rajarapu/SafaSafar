module.exports = {
  root: true,
  extends: '@react-native-community',
  env: {
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
    'react-hooks/exhaustive-deps': 'warn',
    'react/no-unstable-nested-components': 'warn',
    curly: 'warn',
  },
};
