import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, EmptyState, H1, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { EMPLOYMENT_LABELS, formatPay } from '@/lib/format';
import type { Job } from '@/lib/types';
import { categoryBySlug, colors, fonts, radius } from '@/theme';

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.listMyJobs().then(setJobs);
    }, []),
  );

  const toggle = async (job: Job) => {
    const saved = await api.saveJob({ id: job.id, is_active: !job.is_active });
    setJobs((cur) => cur.map((j) => (j.id === job.id ? { ...j, is_active: saved.is_active } : j)));
  };

  return (
    <Screen>
      <View style={styles.head}>
        <H1>Your positions</H1>
        <Pressable onPress={() => router.push('/employer/job-edit')} style={styles.add} accessibilityLabel="Add position">
          <Ionicons name="add" size={26} color={colors.white} />
        </Pressable>
      </View>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState icon="briefcase" title="No positions yet" body="Post a position and it shows up on the map and in seekers' feeds." action={<Button title="Post a position" onPress={() => router.push('/employer/job-edit')} />} />
        }
        renderItem={({ item }) => {
          const c = categoryBySlug(item.category);
          return (
            <Pressable onPress={() => router.push({ pathname: '/employer/job-edit', params: { id: item.id } })} style={styles.row}>
              <View style={[styles.icon, { backgroundColor: c.color }]}>
                <Ionicons name={c.icon} size={22} color={colors.white} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>{formatPay(item)} · {EMPLOYMENT_LABELS[item.employment_type]}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Switch value={item.is_active} onValueChange={() => toggle(item)} trackColor={{ true: colors.teal, false: colors.line }} />
                <Text style={styles.status}>{item.is_active ? 'Live' : 'Paused'}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  add: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 12 },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.navy },
  meta: { fontFamily: fonts.medium, fontSize: 13, color: colors.navyMuted, marginTop: 2 },
  status: { fontFamily: fonts.semibold, fontSize: 11, color: colors.navyMuted },
});
