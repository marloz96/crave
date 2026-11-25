import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '@/lib/session';
import { colors } from '@/theme';

/** Sends people to the right place: welcome, onboarding, or the app. */
export default function Index() {
  const { loading, user, profile } = useSession();
  if (loading)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.violet }}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  if (!user) return <Redirect href="/welcome" />;
  if (!profile) return <Redirect href="/onboarding/role" />;
  if (!profile.onboarded) return <Redirect href={profile.role === 'employer' ? '/onboarding/employer' : '/onboarding/seeker'} />;
  return <Redirect href="/discover" />;
}
