import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function OutfitSuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>✓</Text>
      <Text style={styles.title}>Outfit Saved!</Text>
      <Text style={styles.subtitle}>Your items have been added to your closet.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)/feed')}>
        <Text style={styles.buttonText}>View Feed</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/(tabs)/camera')}>
        <Text style={styles.secondaryButtonText}>Add Another Outfit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 40 },
  button: { backgroundColor: '#000', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 48, marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { paddingVertical: 12 },
  secondaryButtonText: { color: '#555', fontSize: 15 },
});
