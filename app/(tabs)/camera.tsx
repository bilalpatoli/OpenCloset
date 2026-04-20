import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import CameraButton from '../../components/CameraButton';
import { analyzeOutfitImage } from '../../services/ai';
import { uploadStore } from '../../services/uploadStore';
import { colors, radius, spacing, typography } from '../../utils/theme';

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
  const [pendingBase64, setPendingBase64] = useState<{ data: string; mediaType: MediaType } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function runAnalysis(uri: string, base64: string, mediaType: MediaType) {
    setAnalyzing(true);
    try {
      const analysis = await analyzeOutfitImage(base64, mediaType);
      setPendingBase64(null);
      router.push({
        pathname: '/outfit/review',
        params: {
          imageUri: uri,
          items: JSON.stringify(analysis.items),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Analysis failed', message);
    } finally {
      setAnalyzing(false);
    }
  }

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

    const mediaType = mimeFromUri(asset.uri);
    setPendingBase64({ data: asset.base64, mediaType });
    uploadStore.set(asset.base64, mediaType);
    await runAnalysis(asset.uri, asset.base64, mediaType);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header
          index="Capture"
        />

        <View style={styles.stageCard}>
          <View style={styles.stageFrame}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} />
            ) : (
              <View style={styles.placeholder}>
                <View style={styles.placeholderLines}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <Ionicons name="camera-outline" size={40} color={colors.accent} />
                <Text style={styles.placeholderLabel}>Frame your look</Text>
                <Text style={styles.placeholderSub}>
                  Full-body photos work best for accurate detection
                </Text>
              </View>
            )}
            {analyzing && (
              <View style={styles.overlay}>
                <ActivityIndicator color={colors.white} size="large" />
                <Text style={styles.overlayText}>Reading the scene…</Text>
                <Text style={styles.overlaySub}>
                  Identifying each piece
                </Text>
              </View>
            )}
          </View>

          {imageUri && !analyzing && (
            <View style={styles.imageActions}>
              {pendingBase64 && (
                <TouchableOpacity
                  style={styles.retakeChip}
                  onPress={() => runAnalysis(imageUri, pendingBase64.data, pendingBase64.mediaType)}
                  hitSlop={8}
                >
                  <Ionicons name="refresh" size={14} color={colors.text} />
                  <Text style={styles.retakeText}>Retry</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.retakeChip}
                onPress={() => { setImageUri(null); setPendingBase64(null); }}
                hitSlop={8}
              >
                <Ionicons name="close" size={14} color={colors.text} />
                <Text style={styles.retakeText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {!imageUri && (
            <View style={styles.cardActions}>
              <CameraButton
                label={analyzing ? 'Analysing…' : 'Take Photo'}
                icon="camera"
                variant="primary"
                onPress={() => pickImage(true)}
                loading={analyzing}
              />
              <CameraButton
                label="Choose from Library"
                icon="image"
                variant="ghost"
                onPress={() => pickImage(false)}
                disabled={analyzing}
              />
            </View>
          )}
        </View>

        <View style={styles.steps}>
          <StepRow index="01" title="Capture" body="Snap or select a photo of your outfit" />
          <StepRow index="02" title="Review" body="Edit or remove items detected" />
          <StepRow index="03" title="Save" body="Pieces are filed into your closet" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepRow({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.stepIndex}>{index}</Text>
      <View style={styles.stepBody}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepBodyText}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl },
  stageCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stageFrame: {
    borderRadius: radius.md,
    aspectRatio: 3 / 4,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  placeholderLines: { ...StyleSheet.absoluteFillObject },
  corner: { position: 'absolute', width: 22, height: 22, borderColor: colors.accent },
  cornerTL: { top: 16, left: 16, borderTopWidth: 1.2, borderLeftWidth: 1.2 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 1.2, borderRightWidth: 1.2 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 1.2, borderLeftWidth: 1.2 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 1.2, borderRightWidth: 1.2 },
  placeholderLabel: {
    marginTop: spacing.md,
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.text,
  },
  placeholderSub: {
    marginTop: 4,
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,26,26,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  overlayText: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.white,
  },
  overlaySub: {
    fontFamily: typography.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  retakeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  retakeText: {
    fontFamily: typography.body,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.text,
    fontWeight: '600',
  },
  steps: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepIndex: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 20,
    color: colors.accent,
    width: 32,
  },
  stepBody: { flex: 1, gap: 2 },
  stepTitle: {
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.2,
  },
  stepBodyText: {
    fontFamily: typography.body,
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cardActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
