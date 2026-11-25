import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

export const colors = {
  violet: '#6C2BFF',
  violetDeep: '#3A0CA3',
  violetSoft: '#EDE4FF',
  coral: '#FF5A6E',
  coralSoft: '#FFE3E7',
  sun: '#FFC53D',
  sunSoft: '#FFF2CC',
  teal: '#00C2A8',
  tealSoft: '#D4F7F1',
  navy: '#17123B',
  navyMuted: '#5B5680',
  bg: '#F6F0FF',
  card: '#FFFFFF',
  line: '#E2D8FA',
  danger: '#E5383B',
  white: '#FFFFFF',
};

export const gradients = {
  hero: ['#6C2BFF', '#B23CFF', '#FF5A6E'] as const,
  sunset: ['#FF5A6E', '#FF8A4C', '#FFC53D'] as const,
  ocean: ['#3A0CA3', '#6C2BFF', '#00C2A8'] as const,
  match: ['#FF5A6E', '#6C2BFF'] as const,
};

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  logo: 'Poppins_800ExtraBold_Italic',
};

export const radius = { sm: 10, md: 16, lg: 24, xl: 32 };

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type Category = { slug: string; name: string; color: string; icon: IconName };

/** Top-level job categories. Each has its own color, which also colors its map pins. */
export const CATEGORIES: Category[] = [
  { slug: 'tech', name: 'Tech', color: '#6C2BFF', icon: 'laptop-outline' },
  { slug: 'finance', name: 'Finance', color: '#0F9D58', icon: 'cash-outline' },
  { slug: 'trades', name: 'Trades', color: '#FF8A00', icon: 'construct-outline' },
  { slug: 'construction', name: 'Construction', color: '#D9480F', icon: 'hammer-outline' },
  { slug: 'agriculture', name: 'Agriculture', color: '#5C940D', icon: 'leaf-outline' },
  { slug: 'healthcare', name: 'Healthcare', color: '#00A3C4', icon: 'medkit-outline' },
  { slug: 'retail', name: 'Retail', color: '#FF5A6E', icon: 'bag-handle-outline' },
  { slug: 'food', name: 'Food & Drink', color: '#F03E3E', icon: 'fast-food-outline' },
  { slug: 'hospitality', name: 'Hospitality', color: '#C2255C', icon: 'bed-outline' },
  { slug: 'creative', name: 'Creative', color: '#AE3EC9', icon: 'color-palette-outline' },
  { slug: 'marketing', name: 'Marketing', color: '#E64980', icon: 'megaphone-outline' },
  { slug: 'education', name: 'Education', color: '#1C7ED6', icon: 'school-outline' },
  { slug: 'logistics', name: 'Logistics', color: '#495057', icon: 'cube-outline' },
  { slug: 'automotive', name: 'Automotive', color: '#364FC7', icon: 'car-sport-outline' },
  { slug: 'customer-service', name: 'Customer Service', color: '#00C2A8', icon: 'chatbubbles-outline' },
  { slug: 'admin', name: 'Office & Admin', color: '#7950F2', icon: 'briefcase-outline' },
];

export const categoryBySlug = (slug: string): Category =>
  CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[0];

/** Hinge-style prompts seekers can answer. */
export const SEEKER_PROMPTS = [
  "A team I'd thrive on…",
  'Something I taught myself…',
  'What I want to learn next…',
  'My coworkers would say I…',
  "The work I'm proudest of…",
  "I'm at my best when…",
  'A green flag in a boss is…',
];

export const MIN_SEEKER_AGE = 16;

/** Launch market. The map opens here when location is not shared. */
export const LAUNCH_CITY = { name: 'Des Moines, IA', latitude: 41.5868, longitude: -93.625 };
