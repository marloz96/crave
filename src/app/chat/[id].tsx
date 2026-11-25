import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, CompanyLogo } from '@/components/ui';
import { api } from '@/lib/api';
import { looksLikeScam } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Match, Message } from '@/lib/types';
import { colors, fonts, radius } from '@/theme';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useSession();
  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Message>>(null);
  const employer = profile?.role === 'employer';

  useEffect(() => {
    api.getMatch(id).then(setMatch);
    api.listMessages(id).then(setMessages);
    return api.subscribeToMessages(id, (m) =>
      setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m])),
    );
  }, [id]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      const m = await api.sendMessage(id, body);
      setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
    } catch (e) {
      Alert.alert('Not sent', (e as Error).message);
      setText(body);
    }
  };

  const otherId = employer ? match?.seeker_id : match?.company?.owner_id;
  const title = employer ? match?.seeker?.full_name : match?.company?.name;

  const openMenu = () => {
    const options = ['Report', 'Block', 'Unmatch', 'Cancel'];
    const handle = async (i: number) => {
      if (!match || !otherId) return;
      if (i === 0) {
        await api.report({ type: employer ? 'profile' : 'company', id: employer ? match.seeker_id : match.company_id }, 'Reported from chat');
        Alert.alert('Thanks for reporting', 'Our team will review this within 24 hours.');
      } else if (i === 1) {
        await api.block(otherId);
        await api.unmatch(match.id);
        router.back();
      } else if (i === 2) {
        await api.unmatch(match.id);
        router.back();
      }
    };
    if (Platform.OS === 'ios') ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 3, destructiveButtonIndex: [0, 1] }, handle);
    else Alert.alert('Options', undefined, [
      { text: 'Report', onPress: () => handle(0) },
      { text: 'Block', onPress: () => handle(1) },
      { text: 'Unmatch', onPress: () => handle(2) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              onPress={() => match && router.push(employer ? `/seeker/${match.seeker_id}` : `/job/${match.job_id}`)}
            >
              {employer ? <Avatar name={title ?? ''} uri={match?.seeker?.avatar_url} size={32} /> : <CompanyLogo company={match?.company} size={32} />}
              <View>
                <Text style={styles.headTitle}>{title ?? ''}</Text>
                <Text style={styles.headSub}>{match?.job?.title ?? ''}</Text>
              </View>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={openMenu} accessibilityLabel="Chat options" style={{ padding: 6 }}>
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.navy} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90} style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View style={styles.safety}>
              <Ionicons name="shield-checkmark" size={18} color={colors.teal} />
              <Text style={styles.safetyText}>
                Stay safe: real employers never ask you to pay, buy gift cards, or share bank info or your SSN in chat.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id;
            const warn = !mine && (item.flagged || looksLikeScam(item.body));
            return (
              <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.msg, mine && { color: colors.white }]}>{item.body}</Text>
                </View>
                {warn && (
                  <Text style={styles.warn}>⚠️ This message looks like a common scam. Never send money or personal financial info.</Text>
                )}
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Say something nice…"
            placeholderTextColor={colors.navyMuted + '99'}
            style={styles.input}
            multiline
            maxLength={2000}
          />
          <Pressable onPress={send} style={[styles.send, !text.trim() && { opacity: 0.5 }]} disabled={!text.trim()} accessibilityLabel="Send">
            <Ionicons name="arrow-up" size={22} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.navy },
  headSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.navyMuted },
  safety: { flexDirection: 'row', gap: 8, backgroundColor: colors.tealSoft, borderRadius: radius.md, padding: 12, marginBottom: 16, alignItems: 'center' },
  safetyText: { flex: 1, fontFamily: fonts.medium, fontSize: 12, color: '#00665A', lineHeight: 17 },
  bubble: { maxWidth: '80%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { backgroundColor: colors.violet, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.white, borderBottomLeftRadius: 6 },
  msg: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.navy },
  warn: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger, maxWidth: '80%', marginTop: 4 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, gap: 8, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  input: { flex: 1, maxHeight: 120, backgroundColor: colors.bg, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontFamily: fonts.regular, fontSize: 15, color: colors.navy },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
});
