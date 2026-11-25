import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { JobCard, SeekerCard } from '@/components/Cards';
import { SwipeDeck } from '@/components/SwipeDeck';
import { Button, Chip, EmptyState, Logo, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useUserLocation } from '@/lib/location';
import { useSession } from '@/lib/session';
import type { Job, Profile } from '@/lib/types';
import { CATEGORIES, categoryBySlug, colors, fonts } from '@/theme';

export default function Discover() {
  const { profile } = useSession();
  return profile?.role === 'employer' ? <EmployerDiscover /> : <SeekerDiscover />;
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <View style={styles.header}>
      <Logo size={34} color={colors.violet} />
      <Text style={styles.headerSub}>{subtitle}</Text>
    </View>
  );
}

function SeekerDiscover() {
  const { profile } = useSession();
  const { location } = useUserLocation();
  const [category, setCategory] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);

  const load = useCallback(async () => {
    setJobs(null);
    const list = await api.jobFeed({ categories: category ? [category] : undefined, near: location }).catch(() => []);
    setJobs(list);
  }, [category, location]);

  useEffect(() => {
    load();
  }, [load]);

  const onSwipe = async (job: Job, liked: boolean) => {
    const { match } = await api.swipeJob(job.id, liked);
    if (match) router.push({ pathname: '/match', params: { id: match.id } });
  };

  const mine = profile?.categories ?? [];
  const cats = [...CATEGORIES].sort((a, b) => Number(mine.includes(b.slug)) - Number(mine.includes(a.slug)));

  return (
    <Screen>
      <Header subtitle="Jobs near you" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={{ flexGrow: 0 }}>
        <Chip label="For you" icon="sparkles" color={colors.violet} selected={!category} onPress={() => setCategory(null)} />
        {cats.map((c) => (
          <Chip key={c.slug} label={c.name} icon={c.icon} color={c.color} selected={category === c.slug} onPress={() => setCategory(category === c.slug ? null : c.slug)} />
        ))}
      </ScrollView>
      {jobs == null ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.violet} />
      ) : (
        <SwipeDeck
          items={jobs}
          onSwipe={onSwipe}
          renderCard={(job) => <JobCard job={job} />}
          empty={
            <EmptyState
              icon="sparkles"
              title="You've seen everything here"
              body={category ? `No more ${categoryBySlug(category).name} jobs nearby right now. Try another category or check the map.` : 'New jobs drop every day. Check the map or come back soon.'}
              action={<Button title="Open the map" icon="map" onPress={() => router.push('/map')} />}
            />
          }
        />
      )}
    </Screen>
  );
}

function EmployerDiscover() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [seekers, setSeekers] = useState<Profile[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.listMyJobs().then((list) => {
        const active = list.filter((j) => j.is_active);
        setJobs(active);
        setJobId((cur) => (cur && active.some((j) => j.id === cur) ? cur : active[0]?.id ?? null));
      });
    }, []),
  );

  useEffect(() => {
    if (!jobId) return;
    setSeekers(null);
    api.seekerFeed(jobId).then(setSeekers).catch(() => setSeekers([]));
  }, [jobId]);

  const onSwipe = async (s: Profile, liked: boolean) => {
    if (!jobId) return;
    const { match } = await api.swipeSeeker(jobId, s.id, liked);
    if (match) router.push({ pathname: '/match', params: { id: match.id } });
  };

  if (jobs && !jobs.length)
    return (
      <Screen>
        <Header subtitle="Candidates" />
        <EmptyState
          icon="briefcase"
          title="Post a position to start"
          body="Candidates who fit your position show up here to swipe on."
          action={<Button title="Post a position" icon="add" onPress={() => router.push('/employer/job-edit')} />}
        />
      </Screen>
    );

  return (
    <Screen>
      <Header subtitle="Candidates for" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={{ flexGrow: 0 }}>
        {(jobs ?? []).map((j) => {
          const c = categoryBySlug(j.category);
          return <Chip key={j.id} label={j.title} icon={c.icon} color={c.color} selected={j.id === jobId} onPress={() => setJobId(j.id)} />;
        })}
      </ScrollView>
      {seekers == null ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.violet} />
      ) : (
        <SwipeDeck
          items={seekers}
          onSwipe={onSwipe}
          likeLabel="INTERESTED"
          renderCard={(s) => <SeekerCard seeker={s} onOpen={() => router.push(`/seeker/${s.id}`)} />}
          empty={<EmptyState icon="people" title="No new candidates" body="We'll show new people as they join. Try another position or boost your profile with a video." />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4 },
  headerSub: { fontFamily: fonts.semibold, color: colors.navyMuted, fontSize: 14 },
  filters: { paddingHorizontal: 16, paddingVertical: 10 },
});
