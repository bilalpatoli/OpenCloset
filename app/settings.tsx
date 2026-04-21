import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { fetchUserProfile, updateUserProfile } from '../services/users';
import { uploadAvatarImage } from '../services/storage';
import { logout } from '../services/auth';
import { colors, radius, spacing, typography } from '../utils/theme';
import type { UserProfile } from '../types/user';

export default function SettingsScreen() {
  const { userId } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchUserProfile(userId)
      .then((p) => {
        if (!p) return;
        setProfile(p);
        setUsername(p.username ?? '');
        setBio(p.bio ?? '');
        setLocation(p.location ?? '');
      })
      .catch(console.error);
  }, [userId]);

  async function handleAvatarPress() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission required', 'Please allow photo library access to update your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatarImage(asset.base64!, mimeType, userId!);
      await updateUserProfile(userId!, { avatar_url: url });
      setProfile((prev) => (prev ? { ...prev, avatar_url: url } : prev));
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not update profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!userId || !dirty) return;
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateUserProfile(userId, {
        username: username.trim(),
        bio,
        location,
      });
      setProfile(updated);
      setDirty(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/auth/login');
          } catch {
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  }

  const initial = (profile?.username ?? '').charAt(0).toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity
            hitSlop={10}
            style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
              activeOpacity={0.8}
            >
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{initial}</Text>
              )}
              <View style={styles.avatarOverlay}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons name="camera" size={18} color={colors.white} />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          {/* Profile section */}
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={(v) => { setUsername(v); setDirty(true); }}
                placeholder="username"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
                returnKeyType="done"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={styles.textArea}
                value={bio}
                onChangeText={(v) => { setBio(v); setDirty(true); }}
                placeholder="Tell people about your style…"
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={300}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/300</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={(v) => { setLocation(v); setDirty(true); }}
                placeholder="City, Country"
                placeholderTextColor={colors.textTertiary}
                maxLength={100}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Account */}
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerTitle: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: colors.accent,
    letterSpacing: 1.2,
  },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { backgroundColor: colors.border },
  saveBtnText: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.3,
  },

  content: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  avatarWrap: {
    width: 90,
    height: 90,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: {
    fontFamily: typography.display,
    fontSize: 36,
    color: colors.text,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
  },

  sectionTitle: {
    fontFamily: typography.body,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  fieldBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  fieldLabel: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  textInput: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.text,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  textArea: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    paddingTop: spacing.xs,
  },
  charCount: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'right',
  },

  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  logoutText: {
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '500',
    color: colors.danger,
  },
});
