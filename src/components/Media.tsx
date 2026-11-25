import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { colors, fonts, radius } from '@/theme';

export const MAX_VIDEO_SECONDS = 60;

export function VideoPlayer({ uri, height = 220 }: { uri: string; height?: number }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="cover"
      style={{ width: '100%', height, borderRadius: radius.md, backgroundColor: colors.navy }}
    />
  );
}

/** Pick a photo or a short video and upload it. Returns the public URL. */
export async function pickAndUpload(kind: 'photo' | 'video', bucket: 'avatars' | 'media'): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow photo library access in Settings to add media.');
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind === 'photo' ? ['images'] : ['videos'],
    allowsEditing: kind === 'photo',
    aspect: kind === 'photo' ? [1, 1] : undefined,
    quality: 0.8,
    videoMaxDuration: MAX_VIDEO_SECONDS,
  });
  if (res.canceled || !res.assets[0]) return null;
  const asset = res.assets[0];
  if (kind === 'video' && asset.duration && asset.duration / 1000 > MAX_VIDEO_SECONDS + 1) {
    Alert.alert('Too long', `Keep videos under ${MAX_VIDEO_SECONDS} seconds.`);
    return null;
  }
  const type = asset.mimeType ?? (kind === 'photo' ? 'image/jpeg' : 'video/mp4');
  return api.uploadMedia(bucket, asset.uri, type);
}

export function MediaSlot({
  kind,
  value,
  onChange,
  label,
  bucket = 'media',
}: {
  kind: 'photo' | 'video';
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  bucket?: 'avatars' | 'media';
}) {
  const [busy, setBusy] = useState(false);
  const pick = async () => {
    setBusy(true);
    try {
      const url = await pickAndUpload(kind, bucket);
      if (url) onChange(url);
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (value && kind === 'video')
    return (
      <View style={{ marginBottom: 16 }}>
        <VideoPlayer uri={value} />
        <Pressable onPress={() => onChange(null)} style={{ marginTop: 6 }}>
          <Text style={styles.remove}>Remove video</Text>
        </Pressable>
      </View>
    );
  return (
    <Pressable onPress={pick} style={styles.slot} accessibilityRole="button">
      <Ionicons name={busy ? 'cloud-upload-outline' : kind === 'photo' ? 'camera-outline' : 'videocam-outline'} size={30} color={colors.violet} />
      <Text style={styles.slotText}>{busy ? 'Uploading…' : value ? 'Change photo' : label}</Text>
      {kind === 'video' && <Text style={styles.slotHint}>Up to {MAX_VIDEO_SECONDS} seconds</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.violet,
    backgroundColor: colors.violetSoft,
    borderRadius: radius.md,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  slotText: { fontFamily: fonts.bold, color: colors.violet, marginTop: 6, fontSize: 15 },
  slotHint: { fontFamily: fonts.regular, color: colors.navyMuted, fontSize: 12, marginTop: 2 },
  remove: { fontFamily: fonts.semibold, color: colors.coral },
});
