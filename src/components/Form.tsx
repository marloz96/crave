import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '@/theme';
import { Body, Button, H1 } from './ui';

/** Multi-step onboarding frame with a progress bar. */
export function StepShell({
  step,
  total,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'Continue',
  nextDisabled,
  busy,
  onSkip,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
  onSkip?: () => void;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.top}>
        <Pressable
          accessibilityLabel="Back"
          onPress={onBack ?? (() => router.canGoBack() && router.back())}
          style={{ opacity: step === 0 && !onBack ? 0 : 1, padding: 4 }}
          disabled={step === 0 && !onBack}
        >
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </Pressable>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${((step + 1) / total) * 100}%` }]} />
        </View>
        {onSkip ? (
          <Text style={styles.skip} onPress={onSkip}>Skip</Text>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <H1>{title}</H1>
          {subtitle && <Body muted style={{ marginTop: 4, marginBottom: 20 }}>{subtitle}</Body>}
          {!subtitle && <View style={{ height: 16 }} />}
          {children}
        </ScrollView>
        <View style={{ padding: 20, paddingTop: 8 }}>
          <Button title={nextLabel} onPress={onNext} disabled={nextDisabled} loading={busy} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Add short items (skills, perks, values) as removable chips. */
export function TagInput({
  label,
  values,
  onChange,
  placeholder,
  color = colors.violet,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  color?: string;
}) {
  const [text, setText] = useState('');
  const add = () => {
    const t = text.trim();
    if (t && !values.includes(t)) onChange([...values, t]);
    setText('');
  };
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.tagRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor={colors.navyMuted + '99'}
          style={styles.tagInput}
          blurOnSubmit={false}
        />
        <Pressable onPress={add} style={[styles.addBtn, { backgroundColor: color }]} accessibilityLabel={`Add ${label}`}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {values.map((v) => (
          <Pressable key={v} onPress={() => onChange(values.filter((x) => x !== v))} style={[styles.tag, { backgroundColor: color + '1A', borderColor: color }]}>
            <Text style={[styles.tagText, { color }]}>{v}</Text>
            <Ionicons name="close" size={14} color={color} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.seg}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.segItem, value === o.value && styles.segActive]}
          accessibilityState={{ selected: value === o.value }}
        >
          <Text style={[styles.segText, value === o.value && { color: colors.white }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  track: { flex: 1, height: 8, backgroundColor: colors.line, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.coral, borderRadius: 4 },
  skip: { fontFamily: fonts.semibold, color: colors.violet, width: 32 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.navy, marginBottom: 6 },
  tagRow: { flexDirection: 'row', gap: 8 },
  tagInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.navy,
  },
  addBtn: { width: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  tagText: { fontFamily: fonts.semibold, fontSize: 13 },
  seg: { flexDirection: 'row', backgroundColor: colors.violetSoft, borderRadius: 999, padding: 4, marginBottom: 16 },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  segActive: { backgroundColor: colors.violet },
  segText: { fontFamily: fonts.semibold, color: colors.violet, fontSize: 14 },
});
