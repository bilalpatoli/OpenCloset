import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { loginWithUsername } from '../../services/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password) {
      Alert.alert('Missing details', 'Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      await loginWithUsername(username.trim(), password);
      router.replace('/(tabs)/feed');
    } catch (err: any) {
      Alert.alert('Unable to sign in', err?.message ?? 'Please try again.');
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
          <View style={styles.topMark}>
            <Text style={styles.markIndex}>NO. 00</Text>
            <View style={styles.markLine} />
            <Text style={styles.markVol}>Vol. I</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Welcome back</Text>
            <Text style={styles.title}>
              Step into your <Text style={styles.titleItalic}>closet</Text>
            </Text>
            <Text style={styles.subtitle}>
              So, what are you wearing today?
            </Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Username"
              value={username}
              onChangeText={(v) => setUsername(v.toLowerCase())}
              placeholder="yourhandle"
              autoCapitalize="none"
              keyboardType="default"
              autoComplete="username"
              maxLength={30}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPwd}
              autoCapitalize="none"
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

            <TouchableOpacity style={styles.forgot} hitSlop={8}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              activeOpacity={0.9}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>New here</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={styles.secondaryBtnText}>Create an account</Text>
          </TouchableOpacity>

          <Text style={styles.footnote}>
            By continuing you agree to our terms and privacy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  autoComplete?: string;
  maxLength?: number;
  rightSlot?: React.ReactNode;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  autoComplete,
  maxLength,
  rightSlot,
}: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputRow}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoComplete={autoComplete as any}
          maxLength={maxLength}
        />
        {rightSlot}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  topMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  markIndex: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 12,
    letterSpacing: 2,
    color: colors.accent,
  },
  markLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  markVol: {
    fontFamily: typography.body,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
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
  fieldWrap: { gap: 6 },
  fieldLabel: {
    fontFamily: typography.body,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  fieldInput: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 4,
  },
  forgot: { alignSelf: 'flex-end', paddingVertical: 4 },
  forgotText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.accent,
  },
  primaryBtn: {
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: {
    fontFamily: typography.body,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
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
  footnote: {
    marginTop: spacing.xl,
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
