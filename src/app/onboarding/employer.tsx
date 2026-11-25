import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Segmented, StepShell, TagInput } from '@/components/Form';
import { MediaSlot } from '@/components/Media';
import { Avatar, Body, Field } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { Company, CompanyKind, Profile } from '@/lib/types';
import { colors, LAUNCH_CITY } from '@/theme';

const STEPS = 4;

export default function EmployerOnboarding() {
  const { profile, company: existing, refresh } = useSession();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<Partial<Profile>>({
    full_name: profile?.full_name ?? '',
    job_title: profile?.job_title ?? '',
    avatar_url: profile?.avatar_url ?? null,
    bio: profile?.bio ?? '',
    what_i_look_for: profile?.what_i_look_for ?? '',
  });
  const [co, setCo] = useState<Partial<Company>>({
    kind: existing?.kind ?? 'business',
    name: existing?.name ?? '',
    description: existing?.description ?? '',
    address: existing?.address ?? '',
    values: existing?.values ?? [],
    perks: existing?.perks ?? [],
    credentials: existing?.credentials ?? [],
    logo_url: existing?.logo_url ?? null,
    video_url: existing?.video_url ?? null,
    service_radius_km: existing?.service_radius_km ?? null,
  });
  const setM = (p: Partial<Profile>) => setMe((c) => ({ ...c, ...p }));
  const setC = (p: Partial<Company>) => setCo((c) => ({ ...c, ...p }));
  const back = step > 0 ? () => setStep((s) => s - 1) : undefined;
  const next = () => setStep((s) => s + 1);
  const contractor = co.kind === 'contractor';

  const finish = async () => {
    setBusy(true);
    try {
      // Turn the address into map coordinates so the business shows up on the hiring map.
      let coords: { latitude: number; longitude: number } = LAUNCH_CITY;
      if (co.address) {
        try {
          const found = await Location.geocodeAsync(co.address);
          if (found[0]) coords = { latitude: found[0].latitude, longitude: found[0].longitude };
        } catch {
          /* geocoding unavailable (e.g. web preview); fall back to launch city */
        }
      }
      await api.saveMyProfile({ ...me, role: 'employer', onboarded: true });
      await api.saveMyCompany({ ...co, ...coords });
      await refresh();
      if (existing && router.canGoBack()) router.back();
      else router.replace({ pathname: '/employer/job-edit', params: { first: '1' } });
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  switch (step) {
    case 0:
      return (
        <StepShell step={0} total={STEPS} title="First, you" subtitle="Seekers match with people, not logos. Introduce yourself as the hiring contact." onNext={next} nextDisabled={!me.full_name?.trim()}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Avatar name={me.full_name || '?'} uri={me.avatar_url} size={96} />
          </View>
          <MediaSlot kind="photo" bucket="avatars" label="Add your photo" value={me.avatar_url ?? null} onChange={(u) => setM({ avatar_url: u })} />
          <Field label="Your name" value={me.full_name} onChangeText={(t) => setM({ full_name: t })} autoComplete="name" />
          <Field label="Your role" value={me.job_title ?? ''} onChangeText={(t) => setM({ job_title: t })} placeholder="e.g. Hiring Manager, Owner" />
          <Field label="What I look for in a hire" value={me.what_i_look_for ?? ''} onChangeText={(t) => setM({ what_i_look_for: t })} placeholder="Curiosity, reliability, good energy…" multiline />
        </StepShell>
      );
    case 1:
      return (
        <StepShell step={1} total={STEPS} title="Who's hiring?" onNext={next} onBack={back} nextDisabled={!co.name?.trim() || !co.address?.trim()}>
          <Segmented<CompanyKind>
            value={co.kind ?? 'business'}
            onChange={(k) => setC({ kind: k })}
            options={[{ value: 'business', label: 'A business' }, { value: 'contractor', label: 'Independent contractor' }]}
          />
          <Field label={contractor ? 'Your business name' : 'Company name'} value={co.name} onChangeText={(t) => setC({ name: t })} placeholder={contractor ? 'e.g. Lund Electric' : 'e.g. Prairie Byte Labs'} />
          <Field label="About" value={co.description ?? ''} onChangeText={(t) => setC({ description: t })} placeholder="What do you do, and what's it like to work with you?" multiline />
          <Field
            label={contractor ? 'Where you work' : 'Address'}
            value={co.address ?? ''}
            onChangeText={(t) => setC({ address: t })}
            placeholder={contractor ? 'City or area you serve, e.g. Des Moines, IA' : 'Street address, city, state'}
            hint={contractor ? 'Shown as a service area, not your home address.' : 'Used to put you on the hiring map.'}
          />
          <MediaSlot kind="photo" bucket="avatars" label="Add a logo" value={co.logo_url ?? null} onChange={(u) => setC({ logo_url: u })} />
        </StepShell>
      );
    case 2:
      return (
        <StepShell step={2} total={STEPS} title="Your culture" subtitle="This is what makes Gen Z swipe right. Be real." onNext={next} onBack={back}>
          <TagInput label="Values" values={co.values ?? []} onChange={(v) => setC({ values: v })} placeholder="e.g. Ship small, ship often" />
          <TagInput label="Perks" values={co.perks ?? []} onChange={(v) => setC({ perks: v })} placeholder="e.g. Flexible schedule" color={colors.coral} />
          {contractor && (
            <TagInput label="Licenses & certifications" values={co.credentials ?? []} onChange={(v) => setC({ credentials: v })} placeholder="e.g. Iowa Master Electrician" color={colors.teal} />
          )}
          {contractor && <Body muted style={{ fontSize: 13 }}>We verify licenses before showing a checkmark next to them.</Body>}
        </StepShell>
      );
    default:
      return (
        <StepShell step={3} total={STEPS} title="Show the vibe" subtitle="A short video of your team or workplace gets far more likes. Optional." onNext={finish} onBack={back} nextLabel={existing ? 'Save' : 'Post my first position'} busy={busy}>
          <MediaSlot kind="video" label="Upload a culture video" value={co.video_url ?? null} onChange={(u) => setC({ video_url: u })} />
          <Body muted>Your first month is free. After that, plans start at $19/month and you can pause anytime.</Body>
        </StepShell>
      );
  }
}
