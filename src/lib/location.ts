import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { LAUNCH_CITY } from '@/theme';

export type LatLng = { latitude: number; longitude: number };

/** The person's location if they share it, otherwise the launch city. */
export function useUserLocation() {
  const [loc, setLoc] = useState<LatLng>(LAUNCH_CITY);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (Platform.OS === 'web') return; // keep the web preview centered on the launch city
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getLastKnownPositionAsync() ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (pos && !cancelled) {
          setLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setShared(true);
        }
      } catch {
        /* location unavailable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { location: loc, shared };
}
