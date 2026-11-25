import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, gradients, radius, type IconName } from '@/theme';
import type { Company, Verification } from '@/lib/types';

/** The CRAVE wordmark: lowercase, bold italic, friendly. Original lettering set in Poppins. */
export function Logo({ size = 44, color = colors.white, style }: { size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text
      accessibilityRole="header"
      accessibilityLabel="crave"
      style={[{ fontFamily: fonts.logo, fontSize: size, color, letterSpacing: -size * 0.04, lineHeight: size * 1.25 }, style]}
    >
      crave
      <Text style={{ color: colors.sun }}>.</Text>
    </Text>
  );
}

export function Screen({ children, style, edges }: { children: ReactNode; style?: StyleProp<ViewStyle>; edges?: ('top' | 'bottom' | 'left' | 'right')[] }) {
  return (
    <SafeAreaView edges={edges ?? ['top']} style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function GradientScreen({ children, colorsOverride }: { children: ReactNode; colorsOverride?: readonly [string, string, ...string[]] }) {
  return (
    <LinearGradient colors={colorsOverride ?? gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

type ButtonVariant = 'primary' | 'coral' | 'white' | 'ghost' | 'outline' | 'outlineWhite';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = { primary: colors.violet, coral: colors.coral, white: colors.white, ghost: 'transparent', outline: 'transparent', outlineWhite: 'transparent' }[variant];
  const fg = { primary: colors.white, coral: colors.white, white: colors.violet, ghost: colors.violet, outline: colors.violet, outlineWhite: colors.white }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        variant === 'outline' && { borderWidth: 2, borderColor: colors.violet },
        variant === 'outlineWhite' && { borderWidth: 2, borderColor: colors.white },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={fg} style={{ marginRight: 8 }} />}
          <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  color = colors.violet,
  icon,
  onPress,
  small,
  surface,
}: {
  label: string;
  selected?: boolean;
  color?: string;
  icon?: IconName;
  onPress?: () => void;
  small?: boolean;
  /** Solid white background when unselected (for chips over maps or photos). */
  surface?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        small && { paddingVertical: 4, paddingHorizontal: 10 },
        { borderColor: color, backgroundColor: selected ? color : surface ? colors.white : color + '18' },
      ]}
    >
      {icon && <Ionicons name={icon} size={small ? 13 : 16} color={selected ? colors.white : color} style={{ marginRight: 5 }} />}
      <Text style={{ fontFamily: fonts.semibold, fontSize: small ? 12 : 14, color: selected ? colors.white : color }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, hint, style, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.navyMuted + '99'}
        style={[styles.input, props.multiline && { minHeight: 96, textAlignVertical: 'top' }, style]}
        {...props}
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export function H1({ children, color = colors.navy, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontFamily: fonts.bold, fontSize: 28, color, lineHeight: 36 }, style]}>{children}</Text>;
}
export function H2({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontFamily: fonts.bold, fontSize: 20, color: colors.navy, lineHeight: 28 }, style]}>{children}</Text>;
}
export function Body({ children, style, muted }: { children: ReactNode; style?: StyleProp<TextStyle>; muted?: boolean }) {
  return (
    <Text style={[{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: muted ? colors.navyMuted : colors.navy }, style]}>
      {children}
    </Text>
  );
}

const AVATAR_COLORS = [colors.violet, colors.coral, colors.teal, '#FF8A00', '#AE3EC9', '#1C7ED6'];

export function Avatar({ name, uri, size = 48 }: { name: string; uri?: string | null; size?: number }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityLabel={name} />;
  const initials = name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  const bg = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.bold, color: colors.white, fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function CompanyLogo({ company, size = 48 }: { company?: Pick<Company, 'name' | 'logo_url'>; size?: number }) {
  if (company?.logo_url) return <Image source={{ uri: company.logo_url }} style={{ width: size, height: size, borderRadius: size * 0.28 }} />;
  const name = company?.name ?? '?';
  const bg = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.logo, color: colors.white, fontSize: size * 0.5 }}>{name[0]?.toLowerCase()}</Text>
    </View>
  );
}

export function VerifiedBadge({ status, compact }: { status: Verification; compact?: boolean }) {
  if (status === 'verified')
    return (
      <View style={[styles.badge, { backgroundColor: colors.tealSoft }]} accessibilityLabel="Verified employer">
        <Ionicons name="shield-checkmark" size={14} color={colors.teal} />
        {!compact && <Text style={[styles.badgeText, { color: '#00806F' }]}>Verified</Text>}
      </View>
    );
  if (compact) return null;
  return (
    <View style={[styles.badge, { backgroundColor: colors.sunSoft }]}>
      <Ionicons name="alert-circle-outline" size={14} color="#B7791F" />
      <Text style={[styles.badgeText, { color: '#B7791F' }]}>{status === 'pending' ? 'Verification pending' : 'Not verified'}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <LinearGradient colors={gradients.sunset} style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Ionicons name={icon} size={44} color={colors.white} />
      </LinearGradient>
      <H2 style={{ textAlign: 'center' }}>{title}</H2>
      <Body muted style={{ textAlign: 'center', marginTop: 8, marginBottom: 20 }}>{body}</Body>
      {action}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.xl,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontFamily: fonts.bold, fontSize: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.navy, marginBottom: 6 },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.navyMuted, marginTop: 4 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.navy,
  },
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14,
    shadowColor: colors.violetDeep,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.violet,
    marginBottom: 8,
    marginTop: 4,
  },
});
