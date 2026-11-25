import { router } from 'expo-router';
import { View } from 'react-native';
import { Body, Button, GradientScreen, H1, Logo } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { Role } from '@/lib/types';
import { colors } from '@/theme';

/** Shown if someone signed in without picking seeker or employer. */
export default function PickRole() {
  const { refresh } = useSession();
  const pick = async (role: Role) => {
    await api.saveMyProfile({ role });
    await refresh();
    router.replace(role === 'employer' ? '/onboarding/employer' : '/onboarding/seeker');
  };
  return (
    <GradientScreen>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Logo size={56} />
        <H1 color={colors.white} style={{ marginTop: 12 }}>What brings you here?</H1>
        <Body style={{ color: '#FFFFFFD9', marginBottom: 24 }}>You can be both later with a second account.</Body>
        <Button title="I'm looking for work" variant="white" icon="sparkles" onPress={() => pick('seeker')} />
        <Button title="I'm hiring" variant="coral" icon="briefcase" style={{ marginTop: 12 }} onPress={() => pick('employer')} />
      </View>
    </GradientScreen>
  );
}
