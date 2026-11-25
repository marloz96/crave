import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Card, Field, H1, VerifiedBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, fonts } from '@/theme';

export default function Verify() {
  const { company, refresh } = useSession();
  const [docs, setDocs] = useState<{ name: string; uri: string; type: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const contractor = company?.kind === 'contractor';

  if (company?.verification === 'verified' || company?.verification === 'pending')
    return (
      <View style={{ flex: 1, padding: 24, backgroundColor: colors.bg }}>
        <VerifiedBadge status={company.verification} />
        <H1 style={{ marginTop: 12 }}>{company.verification === 'verified' ? "You're verified" : "We're reviewing your documents"}</H1>
        <Body muted style={{ marginTop: 8 }}>
          {company.verification === 'verified'
            ? 'Your badge shows on every listing. Seekers trust verified employers more and like them more often.'
            : 'This usually takes 1 to 2 business days. We will notify you when your badge is live.'}
        </Body>
      </View>
    );

  const add = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], multiple: true });
    if (res.canceled) return;
    setDocs((d) => [...d, ...res.assets.map((a) => ({ name: a.name, uri: a.uri, type: a.mimeType ?? 'application/pdf' }))]);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const paths = await Promise.all(docs.map((d) => api.uploadMedia('verification', d.uri, d.type)));
      await api.requestVerification(paths, notes);
      await refresh();
      Alert.alert('Submitted', "We'll review your documents in 1 to 2 business days.");
      router.back();
    } catch (e) {
      Alert.alert('Could not submit', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const items = contractor
    ? ['A photo ID', 'Your trade license or certification', 'Proof of insurance (if you have it)']
    : ['Business registration or EIN letter', 'A recent utility bill or lease showing the address', 'Use a work email on your company website if you can'];

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Ionicons name="shield-checkmark" size={44} color={colors.teal} />
        <H1 style={{ marginTop: 8 }}>Get the verified badge</H1>
        <Body muted>Verified employers get more likes and show up first. It's how seekers know you're real.</Body>
      </View>
      <Card>
        <Text style={styles.head}>What we need</Text>
        {items.map((i) => (
          <View key={i} style={styles.item}>
            <Ionicons name="document-text-outline" size={18} color={colors.violet} />
            <Body style={{ flex: 1 }}>{i}</Body>
          </View>
        ))}
      </Card>
      {docs.map((d, i) => (
        <View key={i} style={styles.doc}>
          <Ionicons name="attach" size={18} color={colors.navy} />
          <Text style={styles.docName} numberOfLines={1}>{d.name}</Text>
          <Ionicons name="close-circle" size={20} color={colors.coral} onPress={() => setDocs(docs.filter((_, j) => j !== i))} />
        </View>
      ))}
      <Button title="Add documents" variant="outline" icon="cloud-upload-outline" onPress={add} style={{ marginBottom: 16 }} />
      <Field label="Anything we should know? (optional)" value={notes} onChangeText={setNotes} multiline />
      <Button title="Submit for review" onPress={submit} loading={busy} disabled={!docs.length} />
      <Body muted style={{ fontSize: 12, marginTop: 12, textAlign: 'center' }}>Documents are stored privately and only seen by the CRAVE trust team.</Body>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'flex-start', marginBottom: 16 },
  head: { fontFamily: fonts.bold, fontSize: 16, color: colors.navy, marginBottom: 10 },
  item: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 },
  doc: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 8 },
  docName: { flex: 1, fontFamily: fonts.medium, color: colors.navy },
});
