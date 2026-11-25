import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import type { ColorValue } from 'react-native';
import { useSession } from '@/lib/session';
import { colors, fonts, type IconName } from '@/theme';

const icon = (name: IconName) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color as string} size={size} />;

export default function TabsLayout() {
  const { loading, user, profile } = useSession();
  if (!loading && (!user || !profile?.onboarded)) return <Redirect href="/" />;
  const employer = profile?.role === 'employer';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.violet,
        tabBarInactiveTintColor: colors.navyMuted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 64, paddingTop: 6 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: employer ? 'Candidates' : 'Discover', tabBarIcon: icon('flame') }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: icon('map'), href: employer ? null : undefined }} />
      <Tabs.Screen name="jobs" options={{ title: 'Positions', tabBarIcon: icon('briefcase'), href: employer ? undefined : null }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: icon('chatbubbles') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-circle') }} />
    </Tabs>
  );
}
