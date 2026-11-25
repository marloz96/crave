import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

/**
 * Employer subscriptions are sold through Apple / Google in-app purchases, managed by RevenueCat.
 * RevenueCat tells our backend about purchases via the revenuecat-webhook edge function.
 */
const key = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  default: undefined,
});

export const purchasesEnabled = Boolean(key);
let configured = false;

export function identifyPurchaser(userId: string) {
  if (!purchasesEnabled) return;
  try {
    if (!configured) {
      Purchases.configure({ apiKey: key!, appUserID: userId });
      configured = true;
    } else {
      Purchases.logIn(userId).catch(() => {});
    }
  } catch {
    // Purchases is unavailable in some environments (e.g. web preview).
  }
}

export async function getPlanPackages(): Promise<PurchasesPackage[]> {
  if (!purchasesEnabled || !configured) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function buyPackage(pkg: PurchasesPackage) {
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  if (!purchasesEnabled || !configured) return null;
  return Purchases.restorePurchases();
}
