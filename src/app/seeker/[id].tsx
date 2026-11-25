import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { SeekerProfileView } from '@/components/ProfileView';
import { api } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { colors } from '@/theme';

export default function SeekerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [p, setP] = useState<Profile | null>(null);
  useEffect(() => {
    api.getProfile(id).then(setP);
  }, [id]);
  if (!p) return <ActivityIndicator style={{ flex: 1 }} color={colors.violet} />;
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      <SeekerProfileView p={p} />
    </ScrollView>
  );
}
