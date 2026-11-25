import type { EmploymentType, Job } from './types';

export function formatPay(job: Pick<Job, 'pay_min' | 'pay_max' | 'pay_period'>) {
  const { pay_min: min, pay_max: max, pay_period: period } = job;
  if (min == null && max == null) return 'Pay discussed in chat';
  const fmt = (n: number) =>
    period === 'year' ? `$${Math.round(n / 1000)}k` : `$${n % 1 === 0 ? n : n.toFixed(2)}`;
  const suffix = period === 'hour' ? '/hr' : period === 'year' ? '/yr' : ' per job';
  if (min != null && max != null && min !== max) return `${fmt(min)}–${fmt(max)}${suffix}`;
  return `${fmt((min ?? max) as number)}${suffix}`;
}

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  gig: 'Gig',
  internship: 'Internship',
};

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/** Phrases that commonly show up in job scams. Messages containing them get a warning. */
const SCAM_PATTERNS = [
  /gift ?card/i,
  /wire (me|the) money/i,
  /western union/i,
  /zelle|cash ?app|venmo me/i,
  /social security (number|#)/i,
  /\bssn\b/i,
  /bank (account|login|password)/i,
  /pay (a|the) (fee|deposit)/i,
  /crypto|bitcoin/i,
];

export const looksLikeScam = (text: string) => SCAM_PATTERNS.some((p) => p.test(text));
