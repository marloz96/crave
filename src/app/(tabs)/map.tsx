import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HiringMap } from '@/components/HiringMap';
import { Chip, CompanyLogo, VerifiedBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { EMPLOYMENT_LABELS, formatPay } from '@/lib/format';
import { kmToMiles } from '@/lib/geo';
import { useUserLocation } from '@/lib/location';
import type { EmploymentType, Job } from '@/lib/types';
import { CATEGORIES, categoryBySlug, colors, fonts, radius } from '@/theme';

export default function MapScreen() {
  const { location } = useUserLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [type, setType] = useState<EmploymentType | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selected, setSelected] = useState<Job | null>(null);

  useEffect(() => {
    api
      .mapJobs({
        categories: category ? [category] : undefined,
        employmentTypes: type ? [type] : undefined,
        verifiedOnly,
        near: location,
      })
      .then(setJobs)
      .catch(() => setJobs([]));
  }, [category, type, verifiedOnly, location]);

  return (
    <View style={{ flex: 1 }}>
      <HiringMap jobs={jobs} center={location} selectedId={selected?.id ?? null} onSelect={setSelected} />
      <SafeAreaView edges={['top']} style={styles.overlay} pointerEvents="box-none">
        <View style={styles.countPill}>
          <Ionicons name="flame" size={16} color={colors.coral} />
          <Text style={styles.countText}>{jobs.length} open positions nearby</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Chip surface label="Verified" icon="shield-checkmark" color={colors.teal} selected={verifiedOnly} onPress={() => setVerifiedOnly(!verifiedOnly)} />
          {(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map((t) => (
            <Chip surface key={t} label={EMPLOYMENT_LABELS[t]} color={colors.navy} selected={type === t} onPress={() => setType(type === t ? null : t)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filters, { paddingTop: 0 }]}>
          {CATEGORIES.map((c) => (
            <Chip surface key={c.slug} label={c.name} icon={c.icon} color={c.color} selected={category === c.slug} onPress={() => setCategory(category === c.slug ? null : c.slug)} />
          ))}
        </ScrollView>
      </SafeAreaView>
      {selected && <JobSheet job={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

function JobSheet({ job, onClose }: { job: Job; onClose: () => void }) {
  const cat = categoryBySlug(job.category);
  const companyJobs = job.company?.name;
  return (
    <View style={styles.sheet}>
      <View style={[styles.sheetStripe, { backgroundColor: cat.color }]} />
      <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Close">
        <Ionicons name="close" size={20} color={colors.navyMuted} />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CompanyLogo company={job.company} size={52} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
          <Text style={styles.company} numberOfLines={1}>{companyJobs}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {job.company && <VerifiedBadge status={job.company.verification} />}
        <Text style={styles.pay}>{formatPay(job)}</Text>
        <Text style={styles.meta}>· {EMPLOYMENT_LABELS[job.employment_type]}</Text>
        {job.distance_km != null && <Text style={styles.meta}>· {kmToMiles(job.distance_km).toFixed(1)} mi</Text>}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Pressable style={[styles.action, { backgroundColor: colors.violetSoft }]} onPress={() => router.push(`/job/${job.id}`)}>
          <Text style={[styles.actionText, { color: colors.violet }]}>Details</Text>
        </Pressable>
        <Pressable
          style={[styles.action, { backgroundColor: colors.violet }]}
          onPress={async () => {
            const { match } = await api.swipeJob(job.id, true);
            onClose();
            if (match) router.push({ pathname: '/match', params: { id: match.id } });
          }}
        >
          <Ionicons name="heart" size={18} color={colors.white} />
          <Text style={[styles.actionText, { color: colors.white, marginLeft: 6 }]}>Crave it</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  countText: { fontFamily: fonts.bold, color: colors.navy, fontSize: 14 },
  filters: { paddingHorizontal: 12, paddingTop: 10 },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 18,
    paddingTop: 22,
    overflow: 'hidden',
    shadowColor: colors.violetDeep,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 },
  close: { position: 'absolute', right: 12, top: 14, padding: 4, zIndex: 2 },
  title: { fontFamily: fonts.bold, fontSize: 18, color: colors.navy },
  company: { fontFamily: fonts.medium, fontSize: 14, color: colors.navyMuted },
  pay: { fontFamily: fonts.bold, color: colors.navy, fontSize: 14 },
  meta: { fontFamily: fonts.medium, color: colors.navyMuted, fontSize: 13 },
  action: { flex: 1, height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: fonts.bold, fontSize: 15 },
});
