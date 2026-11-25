import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, GradientScreen, Logo } from '@/components/ui';
import { api } from '@/lib/api';
import { colors, fonts } from '@/theme';

const FLOATERS = [
  { icon: 'laptop-outline', top: '12%', left: '8%', bg: colors.sun },
  { icon: 'construct-outline', top: '18%', left: '74%', bg: colors.teal },
  { icon: 'fast-food-outline', top: '34%', left: '82%', bg: colors.coral },
  { icon: 'medkit-outline', top: '24%', left: '36%', bg: '#00A3C4' },
  { icon: 'color-palette-outline', top: '6%', left: '46%', bg: '#AE3EC9' },
] as const;

export default function Welcome() {
  return (
    <GradientScreen>
      {FLOATERS.map((f) => (
        <View key={f.icon} style={[styles.floater, { top: f.top, left: f.left, backgroundColor: f.bg }]}>
          <Ionicons name={f.icon} size={24} color={colors.white} />
        </View>
      ))}
      <View style={styles.center}>
        <Logo size={76} />
        <Text style={styles.tagline}>Find work you crave.</Text>
        <Text style={styles.sub}>Swipe on jobs. Match with real people. Get hired for who you are, not just your resume.</Text>
      </View>
      <View style={styles.bottom}>
        <Button title="I'm looking for work" icon="sparkles" variant="white" onPress={() => router.push({ pathname: '/auth', params: { role: 'seeker' } })} />
        <Button title="I'm hiring" icon="briefcase" variant="coral" style={{ marginTop: 12 }} onPress={() => router.push({ pathname: '/auth', params: { role: 'employer' } })} />
        <Text style={styles.link} onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin' } })}>
          I already have an account
        </Text>
        {api.mode === 'demo' && <Text style={styles.demo}>Demo mode: sample jobs around Des Moines</Text>}
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  floater: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
    opacity: 0.95,
  },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingTop: 80 },
  tagline: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, color: colors.white, marginTop: 4 },
  sub: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, color: '#FFFFFFD9', marginTop: 10 },
  bottom: { paddingHorizontal: 24, paddingBottom: 24 },
  link: { fontFamily: fonts.semibold, color: colors.white, textAlign: 'center', marginTop: 18, fontSize: 15, textDecorationLine: 'underline' },
  demo: { fontFamily: fonts.medium, color: '#FFFFFFB3', textAlign: 'center', marginTop: 10, fontSize: 12 },
});
