import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, CompanyLogo } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { Match } from '@/lib/types';
import { colors, fonts, gradients } from '@/theme';

/** The celebratory "It's a match" screen. */
export default function MatchCelebration() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useSession();
  const [match, setMatch] = useState<Match | null>(null);
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    api.getMatch(id).then(setMatch);
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [id, scale]);

  const employer = profile?.role === 'employer';
  const other = employer ? match?.seeker?.full_name : match?.company?.name;

  return (
    <LinearGradient colors={gradients.match} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wrap}>
      <Animated.Text style={[styles.title, { transform: [{ scale }, { rotate: '-6deg' }] }]}>it's a match!</Animated.Text>
      <View style={styles.pair}>
        <View style={[styles.ring, { transform: [{ rotate: '-8deg' }] }]}>
          <Avatar name={profile?.full_name ?? ''} uri={profile?.avatar_url} size={110} />
        </View>
        <View style={[styles.ring, { marginLeft: -24, transform: [{ rotate: '8deg' }] }]}>
          {employer ? <Avatar name={other ?? ''} uri={match?.seeker?.avatar_url} size={110} /> : <CompanyLogo company={match?.company} size={110} />}
        </View>
      </View>
      <Text style={styles.body}>
        You and {other ?? '…'} both want to talk about{'\n'}
        <Text style={{ fontFamily: fonts.bold }}>{match?.job?.title ?? 'this role'}</Text>
      </Text>
      <View style={{ width: '100%', paddingHorizontal: 24, gap: 12 }}>
        <Button title="Send a message" variant="white" icon="chatbubble-ellipses" onPress={() => router.replace(`/chat/${id}`)} />
        <Button title="Keep swiping" variant="outlineWhite" onPress={() => router.back()} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.logo, fontSize: 52, color: colors.white, marginBottom: 32, textAlign: 'center' },
  pair: { flexDirection: 'row', marginBottom: 28 },
  ring: { borderWidth: 5, borderColor: colors.white, borderRadius: 64, padding: 2, backgroundColor: colors.white },
  body: { fontFamily: fonts.medium, color: colors.white, fontSize: 17, textAlign: 'center', lineHeight: 26, marginBottom: 36, paddingHorizontal: 24 },
});
