import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Job } from '@/lib/types';
import { categoryBySlug, colors } from '@/theme';

export type MapCenter = { latitude: number; longitude: number };

/** Native map (Apple Maps on iPhone, Google Maps on Android) with a colored pin per job. */
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
  const ref = useRef<MapView>(null);

  useEffect(() => {
    ref.current?.animateToRegion({ ...center, latitudeDelta: 0.18, longitudeDelta: 0.18 }, 400);
  }, [center]);

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...center, latitudeDelta: 0.18, longitudeDelta: 0.18 }}
      showsUserLocation
      onPress={() => onSelect(null)}
    >
      {jobs
        .filter((j) => j.latitude != null && j.longitude != null)
        .map((job) => {
          const cat = categoryBySlug(job.category);
          const selected = job.id === selectedId;
          return (
            <Marker
              key={job.id}
              coordinate={{ latitude: job.latitude!, longitude: job.longitude! }}
              onPress={(e) => {
                e.stopPropagation();
                onSelect(job);
              }}
              tracksViewChanges={false}
            >
              <View style={[styles.pin, { backgroundColor: cat.color }, selected && styles.pinSelected]}>
                <Ionicons name={cat.icon} size={selected ? 20 : 16} color={colors.white} />
              </View>
            </Marker>
          );
        })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinSelected: { width: 44, height: 44, borderRadius: 22 },
});
