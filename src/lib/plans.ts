import type { Plan } from './types';
import { colors } from '@/theme';

/**
 * Employer plans. Prices are starting guesses from the product spec, not final.
 * The real price shown in the app comes from App Store / Google Play once products exist;
 * productId must match the product created in App Store Connect / Play Console and RevenueCat.
 */
export const PLANS: {
  id: Plan;
  name: string;
  for: string;
  price: number;
  productId: string;
  color: string;
  popular?: boolean;
  features: string[];
}[] = [
  {
    id: 'solo',
    name: 'Solo',
    for: 'Independent contractors',
    price: 19,
    productId: 'crave_solo_monthly',
    color: colors.teal,
    features: ['1 open position at a time', 'Show licenses & credentials', 'Unlimited matches and chat'],
  },
  {
    id: 'small',
    name: 'Small Business',
    for: 'One location, growing team',
    price: 79,
    productId: 'crave_small_monthly',
    color: colors.violet,
    popular: true,
    features: ['Unlimited positions at 1 location', 'Culture & position videos', 'Verified badge included', 'Unlimited matches and chat'],
  },
  {
    id: 'pro',
    name: 'Pro',
    for: 'Multiple locations',
    price: 199,
    productId: 'crave_pro_monthly',
    color: colors.coral,
    features: ['Up to 5 locations', 'HR manager profiles for each location', 'Priority placement on the map', 'Everything in Small Business'],
  },
];
