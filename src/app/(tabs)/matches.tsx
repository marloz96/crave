import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, CompanyLogo, EmptyState, H1, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Match } from '@/lib/types';
import { categoryBySlug, colors, fonts, radius } from '@/theme';

export default function Matches() {
  const { profile, user } = useSession();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const employer = profile?.role === 'employer';

  useFocusEffect(
    useCallback(() => {
      api.listMatches().then(setMatches).catch(() => setMatches([]));
    }, []),
  );

  const fresh = (matches ?? []).filter((m) => !m.last_message);
  const convos = (matches ?? []).filter((m) => m.last_message);

  const nameFor = (m: Match) => (employer ? m.seeker?.full_name ?? 'Candidate' : m.company?.name ?? 'Employer');

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <H1>Matches</H1>
      </View>
      {matches && !matches.length ? (
        <EmptyState icon="heart" title="No matches yet" body={employer ? 'Swipe right on candidates. When they like your position too, you match.' : 'Swipe right on jobs you crave. When the employer likes you back, you match and can chat.'} />
      ) : (
        <FlatList
          data={convos}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={
            fresh.length ? (
              <View>
                <Text style={styles.section}>New matches</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {fresh.map((m) => (
                    <Pressable key={m.id} onPress={() => router.push(`/chat/${m.id}`)} style={styles.fresh}>
                      <View style={[styles.ring, { borderColor: categoryBySlug(m.job?.category ?? '').color }]}>
                        {employer ? <Avatar name={nameFor(m)} uri={m.seeker?.avatar_url} size={64} /> : <CompanyLogo company={m.company} size={64} />}
                      </View>
                      <Text style={styles.freshName} numberOfLines={1}>{nameFor(m)}</Text>
                      <Text style={styles.freshJob} numberOfLines={1}>{m.job?.title}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                {!!convos.length && <Text style={styles.section}>Messages</Text>}
              </View>
            ) : convos.length ? (
              <Text style={styles.section}>Messages</Text>
            ) : undefined
          }
          renderItem={({ item }) => {
            const mine = item.last_message?.sender_id === user?.id;
            return (
              <Pressable onPress={() => router.push(`/chat/${item.id}`)} style={styles.row}>
                {employer ? <Avatar name={nameFor(item)} uri={item.seeker?.avatar_url} size={56} /> : <CompanyLogo company={item.company} size={56} />}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.name} numberOfLines={1}>{nameFor(item)}</Text>
                    <Text style={styles.time}>{timeAgo(item.last_message!.created_at)}</Text>
                  </View>
                  <Text style={styles.job} numberOfLines={1}>{item.job?.title}</Text>
                  <Text style={[styles.preview, !mine && { fontFamily: fonts.semibold, color: colors.navy }]} numberOfLines={1}>
                    {mine ? 'You: ' : ''}{item.last_message!.body}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: colors.violet, marginHorizontal: 20, marginTop: 16, marginBottom: 10 },
  fresh: { width: 84, alignItems: 'center', marginRight: 8 },
  ring: { borderWidth: 3, borderRadius: 40, padding: 3 },
  freshName: { fontFamily: fonts.semibold, fontSize: 13, color: colors.navy, marginTop: 6 },
  freshJob: { fontFamily: fonts.regular, fontSize: 11, color: colors.navyMuted },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 16, marginBottom: 10, borderRadius: radius.lg, padding: 12 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.navy, flex: 1 },
  time: { fontFamily: fonts.regular, fontSize: 12, color: colors.navyMuted },
  job: { fontFamily: fonts.medium, fontSize: 12, color: colors.violet },
  preview: { fontFamily: fonts.regular, fontSize: 14, color: colors.navyMuted, marginTop: 2 },
});
