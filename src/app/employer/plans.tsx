import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Body, Button, H1 } from '@/components/ui';
import { buyPackage, getPlanPackages, purchasesEnabled, restorePurchases } from '@/lib/purchases';
import { PLANS } from '@/lib/plans';
import type { Plan } from '@/lib/types';
import { colors, fonts, radius } from '@/theme';

export default function Plans() {
  const [selected, setSelected] = useState<Plan>('small');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPlanPackages().then(setPackages).catch(() => {});
  }, []);

  const subscribe = async () => {
    const plan = PLANS.find((p) => p.id === selected)!;
    const pkg = packages.find((p) => p.product.identifier === plan.productId);
    if (!purchasesEnabled || !pkg) {
      Alert.alert('Coming soon', 'Subscriptions turn on once the app is in the App Store. Your free month keeps you hiring until then.');
      return;
    }
    setBusy(true);
    try {
      await buyPackage(pkg);
      Alert.alert("You're all set", 'Your plan is active. Happy hiring!');
    } catch (e) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (!err.userCancelled) Alert.alert('Purchase failed', err.message ?? 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <H1>Hire on CRAVE</H1>
      <Body muted style={{ marginBottom: 20 }}>First month free. Pause or cancel anytime between hiring rounds.</Body>
      {PLANS.map((p) => {
        const on = p.id === selected;
        const storePrice = packages.find((x) => x.product.identifier === p.productId)?.product.priceString;
        return (
          <Pressable key={p.id} onPress={() => setSelected(p.id)} style={[styles.plan, on && { borderColor: p.color }]} accessibilityState={{ selected: on }}>
            {p.popular && (
              <LinearGradient colors={[colors.coral, colors.violet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.popular}>
                <Text style={styles.popularText}>Most popular</Text>
              </LinearGradient>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.dot, { borderColor: p.color }, on && { backgroundColor: p.color }]}>
                {on && <Ionicons name="checkmark" size={14} color={colors.white} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: p.color }]}>{p.name}</Text>
                <Text style={styles.for}>{p.for}</Text>
              </View>
              <Text style={styles.price}>{storePrice ?? `$${p.price}`}<Text style={styles.per}>/mo</Text></Text>
            </View>
            {on && (
              <View style={{ marginTop: 12 }}>
                {p.features.map((f) => (
                  <View key={f} style={styles.feature}>
                    <Ionicons name="checkmark-circle" size={18} color={p.color} />
                    <Body style={{ flex: 1, fontSize: 14 }}>{f}</Body>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        );
      })}
      <Button title="Continue" onPress={subscribe} loading={busy} style={{ marginTop: 8 }} />
      <Pressable onPress={() => restorePurchases().then(() => Alert.alert('Restored', 'Any active plan has been restored.'))} style={{ marginTop: 16 }}>
        <Text style={styles.restore}>Restore purchases</Text>
      </Pressable>
      <Body muted style={{ fontSize: 11, textAlign: 'center', marginTop: 12 }}>
        Subscriptions renew monthly until canceled. Manage or cancel anytime in your App Store or Google Play account settings.
      </Body>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  plan: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 3, borderColor: 'transparent', overflow: 'hidden' },
  popular: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 12 },
  popularText: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 18 },
  for: { fontFamily: fonts.regular, fontSize: 13, color: colors.navyMuted },
  price: { fontFamily: fonts.bold, fontSize: 24, color: colors.navy },
  per: { fontFamily: fonts.medium, fontSize: 13, color: colors.navyMuted },
  feature: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
  restore: { fontFamily: fonts.semibold, color: colors.violet, textAlign: 'center' },
});
