import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { colors, typography } from '../utils/theme';

export default function Index() {
  const { userId, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.mark}>
          <Text style={styles.markIndex}>01</Text>
          <Text style={styles.markTitle}>OpenCloset</Text>
          <Text style={styles.markSub}>A quiet place for what you wear</Text>
        </View>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return userId ? <Redirect href="/(tabs)/feed" /> : <Redirect href="/auth/login" />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  mark: { alignItems: 'center', gap: 6 },
  markIndex: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.accent,
    letterSpacing: 2,
  },
  markTitle: {
    fontFamily: typography.display,
    fontSize: 34,
    color: colors.text,
    letterSpacing: -0.5,
  },
  markSub: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
