import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { analyzeOutfitImage } from '../../services/ai';

type MediaType = 'image/jpeg' | 'image/png' | 'image/webp';

function mimeFromUri(uri: string): MediaType {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export default function CameraScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function pickImage(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to continue.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8 });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setImageUri(asset.uri);

    if (!asset.base64) {
      Alert.alert('Error', 'Could not read image data. Please try again.');
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = await analyzeOutfitImage(asset.base64, mimeFromUri(asset.uri));
      router.push({
        pathname: '/outfit/review',
        params: {
          imageUri: asset.uri,
          items: JSON.stringify(analysis.items),
        },
      });
    } catch (err) {
      Alert.alert('Analysis failed', 'Claude could not analyse the image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Outfit</Text>
      <Text style={styles.subtitle}>Take or upload a photo to detect your clothing items</Text>

      {imageUri && !analyzing && (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      )}

      {analyzing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Analysing outfit...</Text>
        </View>
      ) : (
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => pickImage(true)}>
            <Text style={styles.primaryButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => pickImage(false)}>
            <Text style={styles.secondaryButtonText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 },
  preview: { width: 280, height: 360, borderRadius: 16, marginBottom: 24 },
  loadingBox: { alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: '#444' },
  buttons: { width: '100%', gap: 12 },
  primaryButton: { backgroundColor: '#000', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { borderWidth: 1.5, borderColor: '#000', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
