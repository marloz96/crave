import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { Job } from '@/lib/types';
import { categoryBySlug, colors, fonts } from '@/theme';

export type MapCenter = { latitude: number; longitude: number };

/**
 * Web preview stand-in for the native map: plots pins on a stylized grid.
 * The phone apps use real Apple / Google maps (HiringMap.tsx).
 */
export function HiringMap({
  jobs,
  center,
  selectedId,
  onSelect,
}: {
  jobs: Job[];
  center: MapCenter;
  selectedId: string | null;
  onSelect: (job: Job | null) => void;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const span = 0.36; // degrees shown across the shorter side
  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const scale = Math.min(size.w, size.h) / span;

  return (
    <Pressable style={[StyleSheet.absoluteFill, styles.bg]} onLayout={onLayout} onPress={() => onSelect(null)}>
      {Array.from({ length: 14 }).map((_, i) => (
        <View key={`h${i}`} style={[styles.road, { top: `${(i + 1) * 7}%`, height: i % 4 === 0 ? 6 : 2 }]} />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <View key={`v${i}`} style={[styles.road, { left: `${(i + 1) * 9}%`, width: i % 3 === 0 ? 6 : 2, height: '100%', top: 0 }]} />
      ))}
      <View style={[styles.river]} />
      <Text style={styles.city}>Des Moines</Text>
      {size.w > 0 &&
        jobs
          .filter((j) => j.latitude != null && j.longitude != null)
          .map((job) => {
            const x = size.w / 2 + (job.longitude! - center.longitude) * scale * Math.cos((center.latitude * Math.PI) / 180);
            const y = size.h / 2 - (job.latitude! - center.latitude) * scale;
            if (x < -20 || y < -20 || x > size.w + 20 || y > size.h + 20) return null;
            const cat = categoryBySlug(job.category);
            const selected = job.id === selectedId;
            const d = selected ? 44 : 34;
            return (
              <Pressable
                key={job.id}
                accessibilityLabel={`${job.title}, ${job.company?.name ?? ''}`}
                onPress={(e) => {
                  e.stopPropagation();
                  onSelect(job);
                }}
                style={[styles.pin, { left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: d / 2, backgroundColor: cat.color }]}
              >
                <Ionicons name={cat.icon} size={selected ? 20 : 16} color={colors.white} />
              </Pressable>
            );
          })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: '#EAF4EC', overflow: 'hidden' },
  road: { position: 'absolute', left: 0, right: 0, backgroundColor: '#FFFFFF' },
  river: {
    position: 'absolute',
    left: '-10%',
    top: '52%',
    width: '130%',
    height: 18,
    backgroundColor: '#A5D8FF',
    transform: [{ rotate: '-8deg' }],
  },
  city: { position: 'absolute', left: '40%', top: '46%', fontFamily: fonts.bold, color: '#9BB5A0', fontSize: 14 },
  pin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
