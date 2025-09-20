import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';

// Simple SafeSafar App
export default function App() {
  const handlePanicButton = () => {
    Alert.alert('Emergency', 'Panic button activated! Help is on the way.');
  };

  const handleSafetyScore = () => {
    Alert.alert('Safety Score', 'Your current safety score is 85/100');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SafeSafar</Text>
      <Text style={styles.subtitle}>Your Safety Companion</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSafetyScore}>
          <Text style={styles.buttonText}>Safety Score</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.panicButton]}
          onPress={handlePanicButton}>
          <Text style={styles.buttonText}>PANIC BUTTON</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Location Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  panicButton: {
    backgroundColor: '#D32F2F',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
