import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { StepShell, TagInput } from '@/components/Form';
import { MediaSlot } from '@/components/Media';
import { Avatar, Body, Chip, Field } from '@/components/ui';
import { api } from '@/lib/api';
import { EMPLOYMENT_LABELS } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { EmploymentType, Profile, PromptAnswer } from '@/lib/types';
import { CATEGORIES, colors, fonts, MIN_SEEKER_AGE, radius, SEEKER_PROMPTS } from '@/theme';

const STEPS = 6;
const thisYear = new Date().getFullYear();

export default function SeekerOnboarding() {
  const { profile, refresh } = useSession();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [p, setP] = useState<Partial<Profile>>({
    full_name: profile?.full_name ?? '',
    headline: profile?.headline ?? '',
    city: profile?.city ?? 'Des Moines, IA',
    birth_year: profile?.birth_year ?? null,
    categories: profile?.categories ?? [],
    availability: profile?.availability ?? [],
    prompts: profile?.prompts?.length ? profile.prompts : [{ prompt: SEEKER_PROMPTS[0], answer: '' }, { prompt: SEEKER_PROMPTS[1], answer: '' }],
    skills: profile?.skills ?? [],
    activities: profile?.activities ?? [],
    experience: profile?.experience ?? [],
    education: profile?.education ?? [],
    looking_for: profile?.looking_for ?? '',
    avatar_url: profile?.avatar_url ?? null,
    video_url: profile?.video_url ?? null,
  });
  const [birthYearText, setBirthYearText] = useState(p.birth_year ? String(p.birth_year) : '');
  const set = (patch: Partial<Profile>) => setP((cur) => ({ ...cur, ...patch }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS - 1));
  const back = step > 0 ? () => setStep((s) => s - 1) : undefined;

  const importResume = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    setBusy(true);
    try {
      const data = await api.importResume(res.assets[0].uri);
      setP((cur) => ({
        ...cur,
        ...Object.fromEntries(Object.entries(data).filter(([, v]) => (Array.isArray(v) ? v.length : v))),
        categories: data.categories?.length ? data.categories : cur.categories,
      }));
      Alert.alert('Imported!', "We filled in what we found. You can review and edit everything next.");
      next();
    } catch (e) {
      Alert.alert('Import failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    try {
      await api.saveMyProfile({
        ...p,
        role: 'seeker',
        prompts: (p.prompts ?? []).filter((x) => x.answer.trim()),
        onboarded: true,
      });
      const wasOnboarded = profile?.onboarded;
      await refresh();
      if (wasOnboarded && router.canGoBack()) router.back();
      else router.replace('/discover');
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const age = birthYearText.length === 4 ? thisYear - Number(birthYearText) : null;
  const tooYoung = age != null && age < MIN_SEEKER_AGE;

  switch (step) {
    case 0:
      return (
        <StepShell step={0} total={STEPS} title="Let's build your profile fast" subtitle="Import your resume or LinkedIn profile and we'll fill things in for you." onNext={next} nextLabel="Fill it in myself" busy={false}>
          <Pressable onPress={importResume} style={styles.importCard} disabled={busy}>
            <Ionicons name={busy ? 'hourglass-outline' : 'document-text'} size={36} color={colors.white} />
            <Text style={styles.importTitle}>{busy ? 'Reading your resume…' : 'Upload resume (PDF)'}</Text>
            <Text style={styles.importSub}>Works with any resume.</Text>
          </Pressable>
          <View style={styles.tip}>
            <Ionicons name="logo-linkedin" size={22} color="#0A66C2" />
            <Body style={{ flex: 1, marginLeft: 10, fontSize: 14 }}>
              Have LinkedIn? Open your profile on linkedin.com, tap <Text style={{ fontFamily: fonts.bold }}>More → Save to PDF</Text>, then upload that file here.
            </Body>
          </View>
        </StepShell>
      );
    case 1:
      return (
        <StepShell step={1} total={STEPS} title="The basics" onNext={() => { set({ birth_year: Number(birthYearText) }); next(); }} onBack={back} nextDisabled={!p.full_name?.trim() || birthYearText.length !== 4 || tooYoung}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Avatar name={p.full_name || '?'} uri={p.avatar_url} size={96} />
          </View>
          <MediaSlot kind="photo" bucket="avatars" label="Add a profile photo" value={p.avatar_url ?? null} onChange={(url) => set({ avatar_url: url })} />
          <Field label="Your name" value={p.full_name} onChangeText={(t) => set({ full_name: t })} placeholder="First and last name" autoComplete="name" />
          <Field
            label="Birth year"
            value={birthYearText}
            onChangeText={(t) => setBirthYearText(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            placeholder="2006"
            hint={tooYoung ? `CRAVE is for job seekers ${MIN_SEEKER_AGE} and older.` : 'Only used to check you are 16+. Never shown on your profile.'}
          />
          <Field label="City" value={p.city ?? ''} onChangeText={(t) => set({ city: t })} placeholder="Des Moines, IA" />
          <Field label="Your headline" value={p.headline ?? ''} onChangeText={(t) => set({ headline: t })} placeholder="e.g. Self-taught designer who loves a deadline" maxLength={90} />
        </StepShell>
      );
    case 2:
      return (
        <StepShell step={2} total={STEPS} title="What kind of work?" subtitle="Pick the categories you're into. You can change these anytime." onNext={next} onBack={back} nextDisabled={!p.categories?.length || !p.availability?.length}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => {
              const on = p.categories?.includes(c.slug);
              return (
                <Chip key={c.slug} label={c.name} icon={c.icon} color={c.color} selected={on}
                  onPress={() => set({ categories: on ? p.categories!.filter((x) => x !== c.slug) : [...(p.categories ?? []), c.slug] })} />
              );
            })}
          </View>
          <Text style={styles.label}>I'm open to</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map((t) => {
              const on = p.availability?.includes(t);
              return (
                <Chip key={t} label={EMPLOYMENT_LABELS[t]} color={colors.navy} selected={on}
                  onPress={() => set({ availability: on ? p.availability!.filter((x) => x !== t) : [...(p.availability ?? []), t] })} />
              );
            })}
          </View>
        </StepShell>
      );
    case 3:
      return (
        <StepShell step={3} total={STEPS} title="Show your personality" subtitle="Answer two prompts. Employers can like an answer to start a match." onNext={next} onBack={back}
          nextDisabled={!(p.prompts ?? []).some((x) => x.answer.trim().length > 3)}>
          {(p.prompts ?? []).map((pr, i) => (
            <PromptEditor key={i} value={pr} taken={(p.prompts ?? []).map((x) => x.prompt)} onChange={(v) => {
              const prompts = [...(p.prompts ?? [])];
              prompts[i] = v;
              set({ prompts });
            }} />
          ))}
          <Field label="What are you looking for?" value={p.looking_for ?? ''} onChangeText={(t) => set({ looking_for: t })} placeholder="A team where I can learn fast and grow into a lead" multiline />
        </StepShell>
      );
    case 4:
      return (
        <StepShell step={4} total={STEPS} title="Skills & experience" subtitle="Add what you're good at. Clubs, sports and side projects count." onNext={next} onBack={back}>
          <TagInput label="Skills" values={p.skills ?? []} onChange={(v) => set({ skills: v })} placeholder="e.g. Excel, Spanish, Forklift" />
          <TagInput label="Activities & extracurriculars" values={p.activities ?? []} onChange={(v) => set({ activities: v })} placeholder="e.g. Team captain, volunteer" color={colors.coral} />
          {!!p.experience?.length && (
            <>
              <Text style={styles.label}>Experience (from your resume)</Text>
              {p.experience.map((x, i) => (
                <View key={i} style={styles.expRow}>
                  <Text style={styles.expTitle}>{x.title}</Text>
                  <Text style={styles.expOrg}>{x.org}{x.start ? ` · ${x.start}${x.end ? `–${x.end}` : ''}` : ''}</Text>
                </View>
              ))}
            </>
          )}
        </StepShell>
      );
    default:
      return (
        <StepShell step={5} total={STEPS} title="Say hi on video" subtitle="A 60-second intro helps you stand out. Optional, but employers love it." onNext={finish} onBack={back} nextLabel={profile?.onboarded ? 'Save' : 'Start swiping'} busy={busy}>
          <MediaSlot kind="video" label="Record or upload an intro" value={p.video_url ?? null} onChange={(url) => set({ video_url: url })} />
          <Body muted>Ideas: who you are, what you're great at, and what kind of team you want to join.</Body>
        </StepShell>
      );
  }
}

function PromptEditor({ value, onChange, taken }: { value: PromptAnswer; onChange: (v: PromptAnswer) => void; taken: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.promptBox}>
      <Pressable onPress={() => setOpen(!open)} style={styles.promptHead}>
        <Text style={styles.promptQ}>{value.prompt}</Text>
        <Ionicons name={open ? 'chevron-up' : 'swap-vertical'} size={18} color={colors.violet} />
      </Pressable>
      {open &&
        SEEKER_PROMPTS.filter((q) => q === value.prompt || !taken.includes(q)).map((q) => (
          <Text key={q} style={styles.promptOption} onPress={() => { onChange({ ...value, prompt: q }); setOpen(false); }}>{q}</Text>
        ))}
      <Field label="" value={value.answer} onChangeText={(t) => onChange({ ...value, answer: t })} placeholder="Your answer" multiline maxLength={200} />
    </View>
  );
}

const styles = StyleSheet.create({
  importCard: { backgroundColor: colors.violet, borderRadius: radius.lg, padding: 28, alignItems: 'center' },
  importTitle: { fontFamily: fonts.bold, color: colors.white, fontSize: 18, marginTop: 10 },
  importSub: { fontFamily: fonts.regular, color: '#FFFFFFCC', marginTop: 2 },
  tip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginTop: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.navy, marginTop: 16, marginBottom: 8 },
  promptBox: { backgroundColor: colors.violetSoft, borderRadius: radius.md, padding: 14, marginBottom: 14 },
  promptHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  promptQ: { fontFamily: fonts.bold, color: colors.violet, fontSize: 15, flex: 1 },
  promptOption: { fontFamily: fonts.medium, color: colors.navy, paddingVertical: 8, fontSize: 14 },
  expRow: { backgroundColor: colors.white, borderRadius: radius.sm, padding: 12, marginBottom: 8 },
  expTitle: { fontFamily: fonts.semibold, color: colors.navy },
  expOrg: { fontFamily: fonts.regular, color: colors.navyMuted, fontSize: 13 },
});
