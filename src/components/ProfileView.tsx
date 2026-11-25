import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { EMPLOYMENT_LABELS } from '@/lib/format';
import type { Company, Profile } from '@/lib/types';
import { categoryBySlug, colors, fonts, gradients, radius } from '@/theme';
import { VideoPlayer } from './Media';
import { Avatar, Body, Card, Chip, CompanyLogo, H1, SectionTitle, VerifiedBadge } from './ui';

/** Hinge-style seeker profile: photo, headline, prompts, video, then the details. */
export function SeekerProfileView({ p }: { p: Profile }) {
  return (
    <View>
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Avatar name={p.full_name} uri={p.avatar_url} size={110} />
        <H1 color={colors.white} style={{ marginTop: 10, textAlign: 'center' }}>{p.full_name}</H1>
        {p.headline && <Text style={styles.heroSub}>{p.headline}</Text>}
        {p.city && (
          <View style={styles.loc}>
            <Ionicons name="location" size={14} color="#FFFFFFCC" />
            <Text style={styles.locText}>{p.city}</Text>
          </View>
        )}
      </LinearGradient>
      <View style={{ padding: 16 }}>
        {p.prompts.map((pr, i) => (
          <View key={i} style={[styles.prompt, { backgroundColor: [colors.violetSoft, colors.coralSoft, colors.tealSoft][i % 3] }]}>
            <Text style={styles.promptQ}>{pr.prompt}</Text>
            <Text style={styles.promptA}>{pr.answer}</Text>
          </View>
        ))}
        {p.video_url && (
          <Card>
            <SectionTitle>Video intro</SectionTitle>
            <VideoPlayer uri={p.video_url} height={360} />
          </Card>
        )}
        <Card>
          <SectionTitle>Interested in</SectionTitle>
          <View style={styles.wrap}>
            {p.categories.map((s) => {
              const c = categoryBySlug(s);
              return <Chip key={s} label={c.name} icon={c.icon} color={c.color} small />;
            })}
            {p.availability.map((a) => <Chip key={a} label={EMPLOYMENT_LABELS[a]} color={colors.navy} small />)}
          </View>
          {p.looking_for && <Body style={{ marginTop: 6 }}>{p.looking_for}</Body>}
        </Card>
        {!!p.experience.length && (
          <Card>
            <SectionTitle>Experience</SectionTitle>
            {p.experience.map((x, i) => (
              <View key={i} style={styles.item}>
                <Text style={styles.itemTitle}>{x.title}</Text>
                <Text style={styles.itemSub}>{x.org}{x.start ? ` · ${x.start}${x.end ? `–${x.end}` : '–now'}` : ''}</Text>
                {x.description ? <Body muted style={{ fontSize: 14 }}>{x.description}</Body> : null}
              </View>
            ))}
          </Card>
        )}
        {!!p.education.length && (
          <Card>
            <SectionTitle>Education</SectionTitle>
            {p.education.map((x, i) => (
              <View key={i} style={styles.item}>
                <Text style={styles.itemTitle}>{x.school}</Text>
                <Text style={styles.itemSub}>{[x.degree, x.year].filter(Boolean).join(' · ')}</Text>
              </View>
            ))}
          </Card>
        )}
        {(!!p.skills.length || !!p.activities.length) && (
          <Card>
            {!!p.skills.length && (
              <>
                <SectionTitle>Skills</SectionTitle>
                <View style={styles.wrap}>{p.skills.map((s) => <Chip key={s} label={s} color={colors.violet} small />)}</View>
              </>
            )}
            {!!p.activities.length && (
              <>
                <SectionTitle>Activities</SectionTitle>
                <View style={styles.wrap}>{p.activities.map((s) => <Chip key={s} label={s} color={colors.coral} small />)}</View>
              </>
            )}
          </Card>
        )}
      </View>
    </View>
  );
}

/** Company profile with HR / hiring manager cards. */
export function CompanyView({ c }: { c: Company }) {
  return (
    <View>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <CompanyLogo company={c} size={60} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.coName}>{c.name}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center' }}>
              <VerifiedBadge status={c.verification} />
              {c.kind === 'contractor' && <Text style={styles.itemSub}>Independent contractor</Text>}
            </View>
          </View>
        </View>
        {c.description && <Body style={{ marginTop: 12 }}>{c.description}</Body>}
        {c.address && (
          <View style={[styles.loc, { justifyContent: 'flex-start', marginTop: 8 }]}>
            <Ionicons name="location" size={14} color={colors.navyMuted} />
            <Text style={[styles.locText, { color: colors.navyMuted }]}>{c.address}</Text>
          </View>
        )}
      </Card>
      {c.video_url && (
        <Card>
          <SectionTitle>Life at {c.name}</SectionTitle>
          <VideoPlayer uri={c.video_url} />
        </Card>
      )}
      {!!c.credentials.length && (
        <Card>
          <SectionTitle>Licenses & credentials</SectionTitle>
          {c.credentials.map((cr) => (
            <View key={cr} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.teal} />
              <Body>{cr}</Body>
            </View>
          ))}
        </Card>
      )}
      {(!!c.values.length || !!c.perks.length) && (
        <Card>
          {!!c.values.length && (
            <>
              <SectionTitle>What we value</SectionTitle>
              {c.values.map((v) => <Text key={v} style={styles.value}>“{v}”</Text>)}
            </>
          )}
          {!!c.perks.length && (
            <>
              <SectionTitle>Perks</SectionTitle>
              <View style={styles.wrap}>{c.perks.map((p) => <Chip key={p} label={p} color={colors.coral} small />)}</View>
            </>
          )}
        </Card>
      )}
      {!!c.team?.length && (
        <>
          <SectionTitle>You'll be talking to</SectionTitle>
          {c.team.map((m) => (
            <Card key={m.id} style={{ backgroundColor: colors.violetSoft }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar name={m.full_name} uri={m.avatar_url} size={52} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.itemTitle}>{m.full_name}</Text>
                  {m.job_title && <Text style={styles.itemSub}>{m.job_title}</Text>}
                </View>
              </View>
              {m.bio && <Body style={{ marginTop: 10 }}>{m.bio}</Body>}
              {m.what_i_look_for && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.promptQ}>What I look for in a hire</Text>
                  <Text style={[styles.promptA, { fontSize: 16 }]}>{m.what_i_look_for}</Text>
                </View>
              )}
              {m.video_url && <View style={{ marginTop: 10 }}><VideoPlayer uri={m.video_url} /></View>}
            </Card>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  heroSub: { fontFamily: fonts.medium, color: '#FFFFFFE6', fontSize: 15, textAlign: 'center', marginTop: 2 },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, justifyContent: 'center' },
  locText: { fontFamily: fonts.medium, color: '#FFFFFFCC', fontSize: 13 },
  prompt: { borderRadius: radius.lg, padding: 18, marginBottom: 14 },
  promptQ: { fontFamily: fonts.semibold, fontSize: 14, color: colors.violet },
  promptA: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 29, color: colors.navy, marginTop: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  item: { marginBottom: 10 },
  itemTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.navy },
  itemSub: { fontFamily: fonts.medium, fontSize: 13, color: colors.navyMuted },
  coName: { fontFamily: fonts.bold, fontSize: 20, color: colors.navy },
  value: { fontFamily: fonts.medium, fontSize: 16, color: colors.navy, fontStyle: 'italic', marginBottom: 6 },
});
