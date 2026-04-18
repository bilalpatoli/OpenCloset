import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../utils/theme';

export default function OutfitSuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.markTop}>
          <Text style={styles.markIndex}>STEP 03</Text>
          <View style={styles.markLine} />
          <Text style={styles.markDone}>DONE</Text>
        </View>

        <View style={styles.heroArea}>
          <View style={styles.ornament}>
            <View style={styles.ornamentRing} />
            <View style={styles.ornamentInner}>
              <Ionicons name="checkmark" size={36} color={colors.white} />
            </View>
          </View>

          <Text style={styles.eyebrow}>Filed away</Text>
          <Text style={styles.title}>
            Your closet <Text style={styles.titleItalic}>grew</Text>
          </Text>
          <Text style={styles.subtitle}>
            Each piece has been neatly catalogued. Keep going — or take a moment to browse.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.9}
            onPress={() => router.replace('/(tabs)/closet')}
          >
            <Text style={styles.primaryBtnText}>View Closet</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.replace('/(tabs)/camera')}
          >
            <Text style={styles.secondaryBtnText}>Add Another Outfit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryBtn}
            onPress={() => router.replace('/(tabs)/feed')}
          >
            <Text style={styles.tertiaryBtnText}>Back to feed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  markTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  markIndex: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 12,
    letterSpacing: 2,
    color: colors.accent,
  },
  markLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  markDone: {
    fontFamily: typography.body,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  ornament: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ornamentRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ornamentInner: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: typography.body,
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 38,
    color: colors.text,
    letterSpacing: -1,
    textAlign: 'center',
  },
  titleItalic: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    color: colors.accent,
  },
  subtitle: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
    marginTop: 4,
  },
  actions: { gap: spacing.md },
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    paddingVertical: 16,
  },
  primaryBtnText: {
    fontFamily: typography.body,
    color: colors.white,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: typography.body,
    color: colors.text,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  tertiaryBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  tertiaryBtnText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.accent,
  },
});
