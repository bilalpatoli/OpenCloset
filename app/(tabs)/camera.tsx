import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system/legacy';
import { VideoView, useVideoPlayer } from 'expo-video';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { analyzeOutfitImage, type DetectedItem } from '../../services/ai';
import { saveClosetItem } from '../../services/closet';
import { createOutfitPost } from '../../services/outfits';
import { uploadOutfitImage, uploadOutfitVideo } from '../../services/storage';
import { uploadStore } from '../../services/uploadStore';
import { useAuth } from '../../hooks/useAuth';
import { CLOTHING_CATEGORIES, type ClothingCategory } from '../../utils/constants';
import { colors, radius, spacing, typography } from '../../utils/theme';

const VIDEO_MAX_DURATION = 3;

type MediaType = 'image/jpeg' | 'image/png' | 'image/webp';
type Phase = 'camera' | 'analyzing' | 'review';
type CameraMode = 'photo' | 'video';

interface EditableItem extends DetectedItem {
  key: string;
  confirmed: boolean;
}

const ZOOM_LEVELS = [
  { label: '0.5×', value: 0 },
  { label: '1×', value: 0.1 },
  { label: '2×', value: 0.5 },
];

function mimeFromUri(uri: string): MediaType {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export default function CameraScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [phase, setPhase] = useState<Phase>('camera');
  const [cameraMode, setCameraMode] = useState<CameraMode>('photo');
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [zoomIdx, setZoomIdx] = useState(1);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordingProgress = useRef(new Animated.Value(0)).current;
  const recordingAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const thumbnailBase64Ref = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsCameraActive(true);
      return () => setIsCameraActive(false);
    }, [])
  );

  async function runAnalysis(uri: string, base64: string, mediaType: MediaType) {
    setImageUri(uri);
    setItems([]);
    setCaption('');
    setPhase('analyzing');
    try {
      const analysis = await analyzeOutfitImage(base64, mediaType);
      setItems(analysis.items.map((item, i) => ({ ...item, key: String(i), confirmed: true })));
      setPhase('review');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Analysis failed', message);
      setPhase('camera');
      setImageUri(null);
    }
  }

  async function takePhoto() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
      if (!photo?.base64) {
        Alert.alert('Error', 'Could not capture photo. Please try again.');
        return;
      }
      const mediaType = mimeFromUri(photo.uri);
      uploadStore.set(photo.base64, mediaType);
      await runAnalysis(photo.uri, photo.base64, mediaType);
    } catch {
      Alert.alert('Error', 'Could not take photo. Please try again.');
    }
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: cameraMode === 'video' ? 'videos' : 'images',
      base64: cameraMode === 'photo',
      quality: 0.8,
      videoMaxDuration: VIDEO_MAX_DURATION,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    if (asset.type === 'video') {
      await processVideo(asset.uri);
      return;
    }

    if (!asset.base64) {
      Alert.alert('Error', 'Could not read image data. Please try again.');
      return;
    }
    const mediaType = mimeFromUri(asset.uri);
    uploadStore.set(asset.base64, mediaType);
    await runAnalysis(asset.uri, asset.base64, mediaType);
  }

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  }

  function resetToCamera() {
    setPhase('camera');
    setImageUri(null);
    setVideoUri(null);
    setItems([]);
    setCaption('');
    thumbnailBase64Ref.current = null;
  }

  async function startRecording() {
    if (!cameraRef.current || isRecording) return;
    if (!micPermission?.granted) {
      const result = await requestMicPermission();
      if (!result.granted) {
        Alert.alert('Microphone required', 'Please allow microphone access to record video.');
        return;
      }
    }
    try {
      setIsRecording(true);
      recordingProgress.setValue(0);
      recordingAnimation.current = Animated.timing(recordingProgress, {
        toValue: 1,
        duration: VIDEO_MAX_DURATION * 1000,
        useNativeDriver: false,
      });
      recordingAnimation.current.start();

      const video = await cameraRef.current.recordAsync({ maxDuration: VIDEO_MAX_DURATION });
      setIsRecording(false);
      recordingAnimation.current?.stop();
      recordingProgress.setValue(0);

      if (!video?.uri) {
        Alert.alert('Error', 'Could not record video. Please try again.');
        return;
      }
      await processVideo(video.uri);
    } catch {
      setIsRecording(false);
      recordingAnimation.current?.stop();
      recordingProgress.setValue(0);
      Alert.alert('Error', 'Could not record video. Please try again.');
    }
  }

  function stopRecording() {
    if (!cameraRef.current || !isRecording) return;
    cameraRef.current.stopRecording();
  }

  async function processVideo(uri: string) {
    try {
      // Try first frame, then 500ms as fallback
      let thumbnailUri: string;
      try {
        const t = await VideoThumbnails.getThumbnailAsync(uri, { time: 0 });
        thumbnailUri = t.uri;
      } catch {
        const t = await VideoThumbnails.getThumbnailAsync(uri, { time: 500 });
        thumbnailUri = t.uri;
      }

      const base64 = await FileSystem.readAsStringAsync(thumbnailUri, {
        encoding: 'base64',
      });
      thumbnailBase64Ref.current = base64;
      uploadStore.set(base64, 'image/jpeg');
      setVideoUri(uri);
      await runAnalysis(thumbnailUri, base64, 'image/jpeg');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Error', `Could not process video: ${msg}`);
    }
  }

  async function handleSave() {
    if (!userId) {
      Alert.alert('Not logged in', 'Please log in to save your outfit.');
      return;
    }
    const confirmed = items.filter((i) => i.confirmed);
    if (confirmed.length === 0) {
      Alert.alert('No items selected', 'Keep at least one item to save.');
      return;
    }

    setSaving(true);
    try {
      if (videoUri && thumbnailBase64Ref.current) {
        uploadStore.set(thumbnailBase64Ref.current, 'image/jpeg');
      }
      const imageUrl = await uploadOutfitImage(imageUri!, userId);
      let videoUrl: string | undefined;
      if (videoUri) {
        videoUrl = await uploadOutfitVideo(videoUri, userId);
      }

      const results = await Promise.allSettled(
        confirmed.map((item) =>
          saveClosetItem({
            user_id: userId,
            name: item.name.trim(),
            category: item.category,
            color: item.color,
            image_url: imageUrl,
          })
        )
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0 && failed === confirmed.length) {
        Alert.alert('Save failed', 'None of your items could be saved. Please try again.');
        return;
      }
      const savedIds = results
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof saveClosetItem>>> => r.status === 'fulfilled')
        .map((r) => r.value.id);
      await createOutfitPost(
        {
          user_id: userId,
          image_url: imageUrl,
          caption: caption.trim() || undefined,
          media_type: videoUri ? 'video' : 'image',
          video_url: videoUrl,
        },
        savedIds
      );
      resetToCamera();
      router.replace('/outfit/success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong uploading your photo. Please try again.';
      Alert.alert('Save failed', msg);
    } finally {
      setSaving(false);
    }
  }

  const confirmedCount = items.filter((i) => i.confirmed).length;

  // ── Permission gate ────────────────────────────────────────────────────────
  if (!permission) {
    return <SafeAreaView style={styles.safe} edges={['top']} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.permRoot}>
          <Ionicons name="camera-outline" size={48} color={colors.accent} />
          <Text style={styles.permTitle}>Camera Access</Text>
          <Text style={styles.permSub}>
            Grant access so OpenCloset can capture your outfits
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Text style={styles.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Camera viewfinder ──────────────────────────────────────────────────────
  if (phase === 'camera') {
    const progressWidth = recordingProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <SafeAreaView style={styles.safeCamera} edges={['top']}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          zoom={ZOOM_LEVELS[zoomIdx].value}
          active={isCameraActive}
          mode={cameraMode}
        >
          {/* Recording progress bar */}
          {isRecording && (
            <View style={styles.recordingBarBg}>
              <Animated.View style={[styles.recordingBarFill, { width: progressWidth }]} />
            </View>
          )}

          {/* Top bar */}
          <View style={styles.cameraTopBar}>
            <TouchableOpacity
              style={styles.cameraIconBtn}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              hitSlop={8}
            >
              <Ionicons name="camera-reverse-outline" size={26} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            {(['photo', 'video'] as CameraMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, cameraMode === m && styles.modeBtnActive]}
                onPress={() => setCameraMode(m)}
                hitSlop={8}
              >
                <Text style={[styles.modeBtnText, cameraMode === m && styles.modeBtnTextActive]}>
                  {m === 'photo' ? 'Photo' : 'Video'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Zoom picker */}
          <View style={styles.zoomBar}>
            {ZOOM_LEVELS.map((level, i) => (
              <TouchableOpacity
                key={level.label}
                style={[styles.zoomBtn, zoomIdx === i && styles.zoomBtnActive]}
                onPress={() => setZoomIdx(i)}
                hitSlop={8}
              >
                <Text style={[styles.zoomText, zoomIdx === i && styles.zoomTextActive]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom bar */}
          <View style={styles.cameraBottomBar}>
            <TouchableOpacity style={styles.libraryBtn} onPress={pickFromLibrary} hitSlop={8}>
              <Ionicons name={cameraMode === 'video' ? 'videocam-outline' : 'image-outline'} size={22} color={colors.white} />
            </TouchableOpacity>

            {cameraMode === 'photo' ? (
              <TouchableOpacity style={styles.shutterBtn} onPress={takePhoto} activeOpacity={0.75}>
                <View style={styles.shutterRing}>
                  <View style={styles.shutterCore} />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.shutterBtn}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.75}
              >
                <View style={[styles.shutterRing, styles.shutterRingVideo]}>
                  {isRecording ? (
                    <View style={styles.stopSquare} />
                  ) : (
                    <View style={styles.recordDot} />
                  )}
                </View>
              </TouchableOpacity>
            )}

            <View style={{ width: 44 }} />
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  // ── Analyzing ─────────────────────────────────────────────────────────────
  if (phase === 'analyzing') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.analyzeRoot}>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.analyzeImage} />}
          <View style={styles.analyzeOverlay}>
            <ActivityIndicator color={colors.white} size="large" />
            <Text style={styles.analyzeTitle}>Reading the scene…</Text>
            <Text style={styles.analyzeSub}>Identifying each piece</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Review ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <View>
              <View style={styles.reviewHeader}>
                {(imageUri || videoUri) && (
                  <View style={styles.thumbWrap}>
                    {videoUri ? (
                      <ReviewVideoThumb uri={videoUri} />
                    ) : (
                      <Image source={{ uri: imageUri! }} style={styles.thumb} />
                    )}
                    <View style={styles.thumbBadge}>
                      <Text style={styles.thumbBadgeText}>{confirmedCount}/{items.length}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewHeading}>Item Breakdown</Text>
                  <Text style={styles.reviewCount}>
                    {items.length} {items.length === 1 ? 'piece' : 'pieces'} detected
                  </Text>
                  <View style={styles.reviewActions}>
                    <TouchableOpacity style={styles.actionChip} onPress={resetToCamera} hitSlop={8}>
                      <Ionicons name="camera-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.actionChipText}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionChip} onPress={pickFromLibrary} hitSlop={8}>
                      <Ionicons name="image-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.actionChipText}>Library</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.captionCard}>
                <Text style={styles.captionLabel}>Caption</Text>
                <TextInput
                  style={styles.captionInput}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Describe your outfit or add a note…"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={200}
                  editable={!saving}
                  multiline
                  scrollEnabled={false}
                />
              </View>
              <View style={styles.itemsLabel}>
                <Text style={styles.itemsLabelText}>Items</Text>
              </View>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={24} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Nothing detected. Try a brighter, full-body photo.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <ItemCard item={item} index={index} onUpdate={(patch) => updateItem(item.key, patch)} />
          )}
          ListFooterComponent={<View style={{ height: spacing.xl }} />}
        />

        <View style={styles.bottomBar}>
          <View style={styles.bottomStat}>
            <Text style={styles.bottomStatValue}>{String(confirmedCount).padStart(2, '0')}</Text>
            <Text style={styles.bottomStatLabel}>Pieces to save</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, (saving || confirmedCount === 0) && styles.saveBtnDisabled]}
            activeOpacity={0.9}
            onPress={handleSave}
            disabled={saving || confirmedCount === 0}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Save to Closet</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReviewVideoThumb({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return <VideoView player={player} style={styles.thumb} contentFit="cover" nativeControls={false} />;
}

function ItemCard({
  item,
  index,
  onUpdate,
}: {
  item: EditableItem;
  index: number;
  onUpdate: (patch: Partial<EditableItem>) => void;
}) {
  return (
    <View style={[cardStyles.card, !item.confirmed && cardStyles.cardDismissed]}>
      <View style={cardStyles.headRow}>
        <Text style={cardStyles.cardIndex}>{String(index + 1).padStart(2, '0')}</Text>
        <View style={cardStyles.headText}>
          <Text style={cardStyles.cardCategory}>{item.category}</Text>
          <TextInput
            style={cardStyles.nameInput}
            value={item.name}
            onChangeText={(text) => onUpdate({ name: text })}
            editable={item.confirmed}
            placeholder="Item name"
            maxLength={60}
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <TouchableOpacity
          style={[cardStyles.toggleBtn, !item.confirmed && cardStyles.toggleBtnAdd]}
          onPress={() => onUpdate({ confirmed: !item.confirmed })}
          hitSlop={8}
        >
          <Ionicons
            name={item.confirmed ? 'close' : 'add'}
            size={16}
            color={item.confirmed ? colors.textSecondary : colors.white}
          />
        </TouchableOpacity>
      </View>

      {item.confirmed && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={cardStyles.chipRow}
          >
            {CLOTHING_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[cardStyles.chip, item.category === cat && cardStyles.chipActive]}
                onPress={() => onUpdate({ category: cat as ClothingCategory })}
                activeOpacity={0.8}
              >
                <Text style={[cardStyles.chipText, item.category === cat && cardStyles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {item.color ? (
            <View style={cardStyles.metaRow}>
              <View style={cardStyles.colorDot} />
              <Text style={cardStyles.metaText}>{item.color}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeCamera: { flex: 1, backgroundColor: colors.black },

  // Permission
  permRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  permTitle: {
    fontFamily: typography.display,
    fontSize: 22,
    color: colors.text,
    marginTop: spacing.sm,
  },
  permSub: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  permBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
  },
  permBtnText: {
    fontFamily: typography.body,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: colors.white,
  },

  // Camera viewfinder
  camera: { flex: 1 },
  cameraTopBar: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
  },
  cameraIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBar: {
    position: 'absolute',
    bottom: 152,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  zoomBtn: {
    width: 52,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
  },
  zoomBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  zoomText: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  zoomTextActive: {
    color: colors.white,
  },
  cameraBottomBar: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
  },
  libraryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterRingVideo: {
    borderColor: '#E53935',
  },
  shutterCore: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
  },
  recordDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E53935',
  },
  stopSquare: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#E53935',
  },
  modeToggle: {
    position: 'absolute',
    bottom: 104,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  modeBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  modeBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modeBtnText: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
  },
  modeBtnTextActive: {
    color: colors.white,
  },
  recordingBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  recordingBarFill: {
    height: 3,
    backgroundColor: '#E53935',
  },

  // Analyzing
  analyzeRoot: { flex: 1, position: 'relative' },
  analyzeImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  analyzeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,26,26,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  analyzeTitle: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.white,
  },
  analyzeSub: {
    fontFamily: typography.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },

  // Review list
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  thumbWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    width: 96,
    aspectRatio: 3 / 4,
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(26,26,26,0.75)',
  },
  thumbBadgeText: {
    fontFamily: typography.body,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.white,
    fontWeight: '600',
  },
  reviewMeta: { flex: 1, paddingTop: spacing.xs },
  reviewHeading: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.text,
    letterSpacing: -0.3,
  },
  reviewCount: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionChipText: {
    fontFamily: typography.body,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  itemsLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  itemsLabelText: {
    fontFamily: typography.body,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '600',
  },
  captionCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  captionLabel: {
    fontFamily: typography.body,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  captionInput: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    minHeight: 60,
    padding: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  bottomStat: { alignItems: 'flex-start' },
  bottomStatValue: {
    fontFamily: typography.display,
    fontSize: 24,
    color: colors.text,
    letterSpacing: -0.5,
  },
  bottomStatLabel: {
    fontFamily: typography.body,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    paddingVertical: 16,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontFamily: typography.body,
    color: colors.white,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardDismissed: { opacity: 0.55, backgroundColor: colors.surface },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIndex: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 20,
    color: colors.accent,
    width: 30,
  },
  headText: { flex: 1 },
  cardCategory: {
    fontFamily: typography.body,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  nameInput: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.3,
    padding: 0,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  toggleBtnAdd: { backgroundColor: colors.accent },
  chipRow: { gap: 6, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.text },
  chipText: {
    fontFamily: typography.body,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: { color: colors.white },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.accent },
  metaText: { fontFamily: typography.body, fontSize: 12, color: colors.textSecondary, letterSpacing: 0.2 },
});
