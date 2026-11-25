import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Field, GradientScreen, H1, Logo } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { Role } from '@/lib/types';
import { colors, fonts, radius } from '@/theme';

export default function Auth() {
  const params = useLocalSearchParams<{ role?: Role; mode?: 'signin' | 'signup' }>();
  const [mode, setMode] = useState<'signin' | 'signup'>(params.mode === 'signin' ? 'signin' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refresh } = useSession();
  const role: Role = params.role === 'employer' ? 'employer' : 'seeker';

  const submit = async () => {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await api.signUp(email, password);
        await api.saveMyProfile({ role });
      } else {
        await api.signIn(email, password);
      }
      await refresh();
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <GradientScreen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
          <Logo size={48} />
          <View style={styles.sheet}>
            <H1>{mode === 'signup' ? (role === 'employer' ? 'Start hiring' : 'Create your account') : 'Welcome back'}</H1>
            <Body muted style={{ marginBottom: 20 }}>
              {mode === 'signup'
                ? role === 'employer'
                  ? 'Your first month is free. Cancel anytime.'
                  : 'Free forever for job seekers.'
                : 'Sign in to see your matches.'}
            </Body>
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" />
            {error && <Text style={styles.error}>{error}</Text>}
            <Button title={mode === 'signup' ? 'Create account' : 'Sign in'} onPress={submit} loading={busy} />
            <Pressable onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')} style={{ marginTop: 16 }}>
              <Text style={styles.switch}>
                {mode === 'signup' ? 'Already have an account? Sign in' : "New to CRAVE? Create an account"}
              </Text>
            </Pressable>
            {mode === 'signup' && (
              <Text style={styles.legal}>
                By continuing you agree to the CRAVE Terms and Privacy Policy. Job seekers must be 16 or older.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: colors.bg, borderRadius: radius.xl, padding: 24, marginTop: 20 },
  error: { fontFamily: fonts.medium, color: colors.danger, marginBottom: 12 },
  switch: { fontFamily: fonts.semibold, color: colors.violet, textAlign: 'center' },
  legal: { fontFamily: fonts.regular, color: colors.navyMuted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
