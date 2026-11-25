import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CompanyView, SeekerProfileView } from '@/components/ProfileView';
import { Card, Logo, Screen, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { Subscription } from '@/lib/types';
import { colors, fonts, radius, type IconName } from '@/theme';

export default function ProfileTab() {
  const { profile, company, refresh } = useSession();
  const [sub, setSub] = useState<Subscription | null>(null);
  const employer = profile?.role === 'employer';

  useFocusEffect(
    useCallback(() => {
      refresh();
      if (employer) api.getSubscription().then(setSub);
    }, [employer, refresh]),
  );

  const confirm = (title: string, msg: string, action: () => void) => {
    if (Platform.OS === 'web') {
      action();
      return;
    }
    Alert.alert(title, msg, [{ text: 'Cancel', style: 'cancel' }, { text: title, style: 'destructive', onPress: action }]);
  };

  const signOut = () => confirm('Sign out', 'See you soon!', async () => {
    await api.signOut();
    await refresh();
    router.replace('/welcome');
  });

  const deleteAccount = () =>
    confirm('Delete account', 'This permanently deletes your profile, matches and messages. This cannot be undone.', async () => {
      await api.deleteAccount();
      await refresh();
      router.replace('/welcome');
    });

  if (!profile) return null;

  const trialDays = sub?.status === 'trialing' && sub.trial_ends_at ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86400000)) : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {employer ? (
          <View style={{ padding: 16 }}>
            <Logo size={30} color={colors.violet} style={{ marginBottom: 8 }} />
            {company && <CompanyView c={company} />}
            <SectionTitle>Hiring tools</SectionTitle>
            <Card style={{ padding: 0 }}>
              <Row icon="shield-checkmark" color={colors.teal} label="Verified badge" value={company?.verification === 'verified' ? 'Verified' : company?.verification === 'pending' ? 'In review' : 'Get verified'} onPress={() => router.push('/employer/verify')} />
              <Row icon="card" color={colors.violet} label="Plan" value={trialDays != null ? `Free trial · ${trialDays} days left` : sub?.plan ? sub.plan.toUpperCase() : 'Choose a plan'} onPress={() => router.push('/employer/plans')} />
              <Row icon="create" color={colors.coral} label="Edit company & profile" onPress={() => router.push('/onboarding/employer')} />
            </Card>
          </View>
        ) : (
          <>
            <SeekerProfileView p={profile} />
            <View style={{ paddingHorizontal: 16 }}>
              <Card style={{ padding: 0 }}>
                <Row icon="create" color={colors.violet} label="Edit profile" onPress={() => router.push('/onboarding/seeker')} />
              </Card>
            </View>
          </>
        )}
        <View style={{ paddingHorizontal: 16 }}>
          <SectionTitle>Account</SectionTitle>
          <Card style={{ padding: 0 }}>
            <Row icon="log-out" color={colors.navyMuted} label="Sign out" onPress={signOut} />
            <Row icon="trash" color={colors.danger} label="Delete account" onPress={deleteAccount} />
          </Card>
          {api.mode === 'demo' && <Text style={styles.demo}>Demo mode: data is saved on this device only.</Text>}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ icon, color, label, value, onPress }: { icon: IconName; color: string; label: string; value?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button">
      <View style={[styles.rowIcon, { backgroundColor: color + '1F' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color={colors.navyMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.bg },
  rowIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.navy, flex: 1 },
  rowValue: { fontFamily: fonts.medium, fontSize: 13, color: colors.navyMuted, marginRight: 6 },
  demo: { fontFamily: fonts.regular, fontSize: 12, color: colors.navyMuted, textAlign: 'center', marginTop: 8 },
});
