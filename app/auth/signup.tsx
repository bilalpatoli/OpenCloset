import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signup } from '../../services/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { Field } from './login';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email.trim() || !username.trim() || !password) {
      Alert.alert('Missing details', 'Please fill out every field to continue.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(email.trim(), password, username.trim());
      router.replace('/(tabs)/feed');
    } catch (err: any) {
      Alert.alert('Unable to sign up', err?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backBtn}
            hitSlop={10}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Create account</Text>
            <Text style={styles.title}>
              Begin your <Text style={styles.titleItalic}>catalogue</Text>
            </Text>
            <Text style={styles.subtitle}>
              Snap, tag, and share the fits that make your wardrobe yours.
            </Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Username"
              value={username}
              onChangeText={(v) => setUsername(v.toLowerCase())}
              placeholder="e.g. rowan"
              autoCapitalize="none"
              maxLength={30}
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              maxLength={254}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry={!showPwd}
              autoCapitalize="none"
              maxLength={72}
              rightSlot={
                <TouchableOpacity onPress={() => setShowPwd((v) => !v)} hitSlop={8}>
                  <Ionicons
                    name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              activeOpacity={0.9}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Creating…' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already keep a closet?</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')} hitSlop={6}>
              <Text style={styles.bottomLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginLeft: -4,
    marginBottom: spacing.lg,
  },
  backText: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.text,
  },
  hero: { gap: 10, marginBottom: spacing.xxl },
  eyebrow: {
    fontFamily: typography.body,
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 36,
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 42,
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
    lineHeight: 22,
    maxWidth: 300,
  },
  form: { gap: spacing.md },
  primaryBtn: {
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    fontFamily: typography.body,
    color: colors.white,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xxl,
  },
  bottomText: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  bottomLink: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.accent,
  },
});
