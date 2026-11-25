import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EMPLOYMENT_LABELS, formatPay } from '@/lib/format';
import { kmToMiles } from '@/lib/geo';
import type { Job, Profile } from '@/lib/types';
import { categoryBySlug, colors, fonts, radius } from '@/theme';
import { Avatar, Chip, CompanyLogo, VerifiedBadge } from './ui';

export function JobCard({ job }: { job: Job }) {
  const cat = categoryBySlug(job.category);
  const c = job.company;
  return (
    <View style={styles.card}>
      <LinearGradient colors={[cat.color, shade(cat.color)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroRow}>
          <Chip label={cat.name} icon={cat.icon} color={colors.white} small />
          {job.distance_km != null && (
            <View style={styles.pill}>
              <Ionicons name="location" size={12} color={colors.white} />
              <Text style={styles.pillText}>{kmToMiles(job.distance_km).toFixed(1)} mi</Text>
            </View>
          )}
        </View>
        <Ionicons name={cat.icon} size={120} color="#ffffff26" style={styles.heroIcon} />
        <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
        <Text style={styles.pay}>{formatPay(job)}</Text>
      </LinearGradient>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.push(`/job/${job.id}`)} style={styles.companyRow}>
          <CompanyLogo company={c} size={44} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.company} numberOfLines={1}>{c?.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {c && <VerifiedBadge status={c.verification} />}
              {c?.kind === 'contractor' && <Text style={styles.meta}>Independent contractor</Text>}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.navyMuted} />
        </Pressable>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
          <Chip label={EMPLOYMENT_LABELS[job.employment_type]} color={colors.violet} small />
          {c?.address && <Chip label={c.address} icon="map-outline" color={colors.navyMuted} small />}
        </View>
        {job.description && <Text style={styles.body}>{job.description}</Text>}
        {!!c?.credentials?.length && (
          <View style={{ marginTop: 10 }}>
            {c.credentials.map((cr) => (
              <View key={cr} style={styles.credential}>
                <Ionicons name="checkmark-circle" size={16} color={colors.teal} />
                <Text style={styles.credentialText}>{cr}</Text>
              </View>
            ))}
          </View>
        )}
        {!!c?.perks?.length && (
          <>
            <Text style={styles.subhead}>Perks</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {c.perks.map((p) => <Chip key={p} label={p} color={colors.coral} small />)}
            </View>
          </>
        )}
        {!!c?.values?.length && (
          <>
            <Text style={styles.subhead}>Culture</Text>
            {c.values.map((v) => <Text key={v} style={styles.value}>“{v}”</Text>)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

export function SeekerCard({ seeker, onOpen }: { seeker: Profile; onOpen?: () => void }) {
  const firstPrompt = seeker.prompts[0];
  return (
    <View style={styles.card}>
      <LinearGradient colors={[colors.violet, colors.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { alignItems: 'center' }]}>
        <Avatar name={seeker.full_name} uri={seeker.avatar_url} size={96} />
        <Text style={[styles.title, { textAlign: 'center', marginTop: 10 }]}>{seeker.full_name}</Text>
        {seeker.headline && <Text style={[styles.pay, { textAlign: 'center', fontSize: 15 }]}>{seeker.headline}</Text>}
      </LinearGradient>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
        {firstPrompt && (
          <View style={styles.prompt}>
            <Text style={styles.promptQ}>{firstPrompt.prompt}</Text>
            <Text style={styles.promptA}>{firstPrompt.answer}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {seeker.categories.map((slug) => {
            const c = categoryBySlug(slug);
            return <Chip key={slug} label={c.name} icon={c.icon} color={c.color} small />;
          })}
          {seeker.availability.map((a) => <Chip key={a} label={EMPLOYMENT_LABELS[a]} color={colors.navyMuted} small />)}
        </View>
        {!!seeker.skills.length && (
          <>
            <Text style={styles.subhead}>Skills</Text>
            <Text style={styles.body}>{seeker.skills.join(' · ')}</Text>
          </>
        )}
        {seeker.looking_for && (
          <>
            <Text style={styles.subhead}>Looking for</Text>
            <Text style={styles.body}>{seeker.looking_for}</Text>
          </>
        )}
        {onOpen && (
          <Pressable onPress={onOpen} style={styles.more}>
            <Text style={styles.moreText}>See full profile</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.violet} />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

/** Darken a hex color a little for gradient ends. */
function shade(hex: string, amt = -40) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: colors.violetDeep,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  hero: { padding: 20, paddingTop: 16, minHeight: 190, justifyContent: 'flex-end', overflow: 'hidden' },
  heroRow: { position: 'absolute', top: 16, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroIcon: { position: 'absolute', right: -10, bottom: -14 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00000033', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, gap: 4 },
  pillText: { fontFamily: fonts.semibold, color: colors.white, fontSize: 12 },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, color: colors.white, marginTop: 40 },
  pay: { fontFamily: fonts.semibold, fontSize: 18, color: '#FFFFFFE6', marginTop: 2 },
  companyRow: { flexDirection: 'row', alignItems: 'center' },
  company: { fontFamily: fonts.bold, fontSize: 17, color: colors.navy },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.navyMuted },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.navy, marginTop: 8 },
  subhead: { fontFamily: fonts.bold, fontSize: 13, color: colors.violet, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 6 },
  value: { fontFamily: fonts.medium, fontSize: 15, color: colors.navy, fontStyle: 'italic', marginBottom: 4 },
  credential: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  credentialText: { fontFamily: fonts.medium, fontSize: 14, color: colors.navy },
  prompt: { backgroundColor: colors.violetSoft, borderRadius: radius.md, padding: 16, marginBottom: 12 },
  promptQ: { fontFamily: fonts.semibold, fontSize: 13, color: colors.violet },
  promptA: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 26, color: colors.navy, marginTop: 4 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, alignSelf: 'flex-start' },
  moreText: { fontFamily: fonts.bold, color: colors.violet, fontSize: 15 },
});
