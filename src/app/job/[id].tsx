import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoPlayer } from '@/components/Media';
import { CompanyView } from '@/components/ProfileView';
import { Body, Button, Card, Chip, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { EMPLOYMENT_LABELS, formatPay } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Job } from '@/lib/types';
import { categoryBySlug, colors, fonts, radius } from '@/theme';

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useSession();
  const [job, setJob] = useState<Job | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    api.getJob(id).then(setJob);
  }, [id]);

  if (!job) return <ActivityIndicator style={{ flex: 1 }} color={colors.violet} />;
  const cat = categoryBySlug(job.category);

  const like = async () => {
    setLiked(true);
    const { match } = await api.swipeJob(job.id, true);
    if (match) router.push({ pathname: '/match', params: { id: match.id } });
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <LinearGradient colors={[cat.color, colors.violetDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Chip label={cat.name} icon={cat.icon} color={colors.white} small />
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.pay}>{formatPay(job)}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Chip label={EMPLOYMENT_LABELS[job.employment_type]} color={colors.white} small />
          </View>
        </LinearGradient>
        <View style={{ padding: 16 }}>
          {job.video_url && (
            <Card>
              <SectionTitle>About this role</SectionTitle>
              <VideoPlayer uri={job.video_url} height={360} />
            </Card>
          )}
          {job.description && (
            <Card>
              <SectionTitle>The job</SectionTitle>
              <Body>{job.description}</Body>
            </Card>
          )}
          {job.company && <CompanyView c={job.company} />}
          <View style={styles.report}>
            <Ionicons name="flag-outline" size={14} color={colors.navyMuted} />
            <Text
              style={styles.reportText}
              onPress={async () => {
                await api.report({ type: 'job', id: job.id }, 'Reported from job page');
                setLiked(true);
              }}
            >
              Report this listing
            </Text>
          </View>
        </View>
      </ScrollView>
      {profile?.role === 'seeker' && (
        <View style={{ padding: 16, paddingTop: 0 }}>
          <Button title={liked ? 'Sent!' : 'Crave it'} icon="heart" variant="coral" onPress={like} disabled={liked} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 24, paddingTop: 20, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, color: colors.white, marginTop: 12 },
  pay: { fontFamily: fonts.semibold, fontSize: 18, color: '#FFFFFFE6' },
  report: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  reportText: { fontFamily: fonts.medium, color: colors.navyMuted, fontSize: 13, textDecorationLine: 'underline' },
});
