import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Segmented } from '@/components/Form';
import { MediaSlot } from '@/components/Media';
import { Body, Button, Chip, Field, H1 } from '@/components/ui';
import { api } from '@/lib/api';
import { EMPLOYMENT_LABELS } from '@/lib/format';
import type { EmploymentType, Job, PayPeriod } from '@/lib/types';
import { CATEGORIES, colors, fonts } from '@/theme';

export default function JobEdit() {
  const { id, first } = useLocalSearchParams<{ id?: string; first?: string }>();
  const [job, setJob] = useState<Partial<Job>>({ category: 'tech', employment_type: 'full_time', pay_period: 'hour', is_active: true });
  const [payMin, setPayMin] = useState('');
  const [payMax, setPayMax] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<Job>) => setJob((c) => ({ ...c, ...p }));

  useEffect(() => {
    if (!id) return;
    api.getJob(id).then((j) => {
      if (!j) return;
      setJob(j);
      setPayMin(j.pay_min != null ? String(j.pay_min) : '');
      setPayMax(j.pay_max != null ? String(j.pay_max) : '');
    });
  }, [id]);

  const save = async () => {
    if (!job.title?.trim()) return Alert.alert('Add a title', 'What position are you hiring for?');
    setBusy(true);
    try {
      const { company: _c, ...rest } = job;
      await api.saveJob({
        ...rest,
        pay_min: payMin ? Number(payMin) : null,
        pay_max: payMax ? Number(payMax) : payMin ? Number(payMin) : null,
      });
      if (first) router.replace('/discover');
      else router.back();
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: id ? 'Edit position' : 'New position', headerBackVisible: !first }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {first && (
          <View style={{ marginBottom: 16 }}>
            <H1>Post your first position</H1>
            <Body muted>It goes live on the map and in seekers' feeds right away.</Body>
          </View>
        )}
        <Field label="Position title" value={job.title ?? ''} onChangeText={(t) => set({ title: t })} placeholder="e.g. Electrical Apprentice" />
        <Text style={{ fontFamily: fonts.semibold, color: colors.navy, marginBottom: 8 }}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.slug} label={c.name} icon={c.icon} color={c.color} small selected={job.category === c.slug} onPress={() => set({ category: c.slug })} />
          ))}
        </View>
        <Text style={{ fontFamily: fonts.semibold, color: colors.navy, marginBottom: 8, marginTop: 8 }}>Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          {(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map((t) => (
            <Chip key={t} label={EMPLOYMENT_LABELS[t]} color={colors.navy} selected={job.employment_type === t} onPress={() => set({ employment_type: t })} />
          ))}
        </View>
        <Text style={{ fontFamily: fonts.semibold, color: colors.navy, marginBottom: 8, marginTop: 8 }}>Pay</Text>
        <Segmented<PayPeriod>
          value={job.pay_period ?? 'hour'}
          onChange={(v) => set({ pay_period: v })}
          options={[{ value: 'hour', label: 'Hourly' }, { value: 'year', label: 'Yearly' }, { value: 'job', label: 'Per job' }]}
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="From ($)" value={payMin} onChangeText={(t) => setPayMin(t.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" placeholder="18" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="To ($)" value={payMax} onChangeText={(t) => setPayMax(t.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" placeholder="22" />
          </View>
        </View>
        <Body muted style={{ fontSize: 13, marginTop: -8, marginBottom: 16 }}>Listings with pay get far more likes.</Body>
        <Field label="Describe the job" value={job.description ?? ''} onChangeText={(t) => set({ description: t })} placeholder="What will they do day to day? What will they learn?" multiline />
        <MediaSlot kind="video" label="Add a video: “We're looking for someone who…”" value={job.video_url ?? null} onChange={(u) => set({ video_url: u })} />
        <Button title={id ? 'Save changes' : 'Post position'} onPress={save} loading={busy} icon="rocket" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
