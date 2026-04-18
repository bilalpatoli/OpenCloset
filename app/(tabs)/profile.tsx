import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { useCloset } from '../../hooks/useCloset';
import { fetchOutfitsByUser } from '../../services/outfits';
import { fetchUserProfile } from '../../services/users';
import { logout } from '../../services/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';
import type { UserProfile } from '../../types/user';
import type { OutfitPostWithItems } from '../../types/outfit';

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, loading: authLoading } = useAuth();
  const { items } = useCloset(userId);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [outfits, setOutfits] = useState<OutfitPostWithItems[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchUserProfile(userId).then(setProfile).catch(console.error);
    fetchOutfitsByUser(userId).then(setOutfits).catch(console.error);
  }, [userId]);

  async function handleLogout() {
    try {
      await logout();
      router.replace('/auth/login');
    } catch {
      Alert.alert('Error', 'Could not sign out. Please try again.');
    }
  }

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeLoading}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const username = profile?.username ?? 'you';
  const initial = username.charAt(0).toUpperCase();
  const recentOutfits = outfits.slice(0, 6);

  const headerRight = (
    <TouchableOpacity
      hitSlop={10}
      style={styles.iconBtn}
      onPress={handleLogout}
    >
      <Ionicons name="log-out-outline" size={20} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header
          index="NO. 04"
          eyebrow="Your"
          title={"Profile"}
          right={headerRight}
        />

        <View style={styles.hero}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
          <Text style={styles.bio}>
            A personal index of what you wear, quietly kept.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatBlock value={items.length} label="Pieces" />
          <View style={styles.statsDivider} />
          <StatBlock value={outfits.length} label="Looks" />
          <View style={styles.statsDivider} />
          <StatBlock
            value={new Set(items.map((i) => i.category)).size}
            label="Categories"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Recent looks</Text>
          <View style={styles.sectionLine} />
          <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
            <Text style={styles.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentOutfits.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.looksRow}
          >
            {recentOutfits.map((outfit, idx) => (
              <View key={outfit.id} style={styles.lookCard}>
                <View style={styles.lookImgFrame}>
                  {outfit.image_url ? (
                    <Image source={{ uri: outfit.image_url }} style={styles.lookImg} />
                  ) : (
                    <View style={styles.lookFallback}>
                      <Ionicons name="shirt-outline" size={24} color={colors.textTertiary} />
                    </View>
                  )}
                  <Text style={styles.lookIndex}>
                    {String(idx + 1).padStart(2, '0')}
                  </Text>
                </View>
                <Text style={styles.lookMeta}>
                  {outfit.items.length} {outfit.items.length === 1 ? 'piece' : 'pieces'}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="image-outline" size={24} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No looks captured yet</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Settings</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.settingsGroup}>
          <SettingsRow icon="person-circle-outline" label="Edit Profile" onPress={() => {}} />
          <SettingsRow icon="shield-checkmark-outline" label="Privacy" onPress={() => {}} />
          <SettingsRow icon="notifications-outline" label="Notifications" onPress={() => {}} />
          <SettingsRow
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            destructive
          />
        </View>

        <Text style={styles.footnote}>OpenCloset · 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? colors.danger : colors.text}
        />
      </View>
      <Text
        style={[
          styles.settingsLabel,
          destructive && { color: colors.danger },
        ]}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeLoading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingBottom: spacing.xxxl },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 999,
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
    fontSize: 38,
    color: colors.text,
  },
  bio: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  statsRow: {
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  statBlock: { flex: 1, alignItems: 'center', gap: 4 },
  statsDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  statValue: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: typography.body,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontFamily: typography.body,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  sectionLink: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.accent,
  },
  looksRow: { paddingHorizontal: spacing.lg, gap: spacing.md },
  lookCard: { width: 140, gap: 8 },
  lookImgFrame: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    position: 'relative',
  },
  lookImg: { width: '100%', aspectRatio: 3 / 4, resizeMode: 'cover' },
  lookFallback: {
    width: '100%',
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookIndex: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 11,
    color: colors.white,
    backgroundColor: 'rgba(26,26,26,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  lookMeta: {
    fontFamily: typography.body,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.textSecondary,
  },
  settingsGroup: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  settingsIcon: { width: 24, alignItems: 'center' },
  settingsLabel: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.text,
    letterSpacing: -0.1,
  },
  footnote: {
    marginTop: spacing.xxl,
    textAlign: 'center',
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textTertiary,
  },
});
