import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser, CraveApi, SwipeResult } from './api';
import type { Company, Job, JobFilters, Match, Message, Profile, Subscription } from './types';
import { DEMO_EMPLOYER_GREETINGS, demoCompanies, demoHr, demoJobs, demoSeekerLikes, demoSeekers } from './demoData';
import { distanceKm } from './geo';

/**
 * Demo backend: an in-memory copy of the database, saved on the device.
 * Lets anyone try every screen without a server. Swap to Supabase by
 * setting EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
 */

type Swipe = { actor_id: string; side: 'seeker' | 'employer'; job_id: string; seeker_id: string; liked: boolean };
type Store = {
  user: AuthUser | null;
  accounts: Record<string, { id: string; password: string }>;
  profiles: Record<string, Profile>;
  companies: Company[];
  jobs: Job[];
  swipes: Swipe[];
  matches: Match[];
  messages: Message[];
  blocked: string[];
  subscriptions: Record<string, Subscription>;
};

const KEY = 'crave-demo-store-v1';
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const fresh = (): Store => ({
  user: null,
  accounts: {},
  profiles: Object.fromEntries([...demoSeekers, ...demoHr].map((p) => [p.id, p])),
  companies: demoCompanies,
  jobs: demoJobs,
  swipes: demoSeekerLikes.map((l) => ({ actor_id: l.seeker_id, side: 'seeker', job_id: l.job_id, seeker_id: l.seeker_id, liked: true })),
  matches: [],
  messages: [],
  blocked: [],
  subscriptions: {},
});

export const emptyProfile = (id: string, role: Profile['role']): Profile => ({
  id,
  role,
  full_name: '',
  avatar_url: null,
  headline: null,
  bio: null,
  city: null,
  birth_year: null,
  categories: [],
  video_url: null,
  prompts: [],
  experience: [],
  education: [],
  skills: [],
  activities: [],
  availability: [],
  looking_for: null,
  job_title: null,
  what_i_look_for: null,
  onboarded: false,
});

export function createDemoApi(): CraveApi {
  let store: Store | null = null;
  const authListeners = new Set<(u: AuthUser | null) => void>();
  const msgListeners = new Map<string, Set<(m: Message) => void>>();

  async function db(): Promise<Store> {
    if (store) return store;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      store = raw ? (JSON.parse(raw) as Store) : fresh();
    } catch {
      store = fresh();
    }
    return store;
  }
  const save = async () => {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(store));
    } catch {
      /* storage can be unavailable (private browsing); demo keeps working in memory */
    }
  };
  const me = async () => {
    const s = await db();
    if (!s.user) throw new Error('Not signed in');
    return s.user;
  };
  const withCompany = (s: Store, job: Job, near?: JobFilters['near']): Job => {
    const company = s.companies.find((c) => c.id === job.company_id);
    return {
      ...job,
      company,
      distance_km:
        near && job.latitude != null && job.longitude != null
          ? distanceKm(near, { latitude: job.latitude, longitude: job.longitude })
          : null,
    };
  };
  const hydrateMatch = (s: Store, m: Match): Match => {
    const job = s.jobs.find((j) => j.id === m.job_id);
    const msgs = s.messages.filter((x) => x.match_id === m.id);
    return {
      ...m,
      job: job ? withCompany(s, job) : undefined,
      company: s.companies.find((c) => c.id === m.company_id),
      seeker: s.profiles[m.seeker_id],
      last_message: msgs[msgs.length - 1] ?? null,
    };
  };
  const emitMessage = (m: Message) => msgListeners.get(m.match_id)?.forEach((cb) => cb(m));

  function filterJobs(s: Store, f: JobFilters): Job[] {
    return s.jobs
      .filter((j) => j.is_active)
      .filter((j) => !f.categories?.length || f.categories.includes(j.category))
      .filter((j) => !f.employmentTypes?.length || f.employmentTypes.includes(j.employment_type))
      .filter((j) => !f.minPay || (j.pay_max ?? j.pay_min ?? 0) >= f.minPay || j.pay_period !== 'hour')
      .map((j) => withCompany(s, j, f.near))
      .filter((j) => !f.verifiedOnly || j.company?.verification === 'verified')
      .filter((j) => !f.radiusKm || j.distance_km == null || j.distance_km <= f.radiusKm)
      .filter((j) => !s.blocked.includes(j.company?.owner_id ?? ''));
  }

  function makeMatch(s: Store, jobId: string, seekerId: string): Match {
    const existing = s.matches.find((m) => m.job_id === jobId && m.seeker_id === seekerId);
    if (existing) return existing;
    const job = s.jobs.find((j) => j.id === jobId)!;
    const m: Match = { id: uid(), job_id: jobId, seeker_id: seekerId, company_id: job.company_id, created_at: new Date().toISOString() };
    s.matches.push(m);
    return m;
  }

  const api: CraveApi = {
    mode: 'demo',

    async getUser() {
      return (await db()).user;
    },
    onAuthChange(cb) {
      authListeners.add(cb);
      return () => authListeners.delete(cb);
    },
    async signUp(email, password) {
      const s = await db();
      const key = email.trim().toLowerCase();
      if (s.accounts[key]) throw new Error('An account with this email already exists. Try signing in.');
      if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
      const id = uid();
      s.accounts[key] = { id, password };
      s.user = { id, email: key };
      await save();
      authListeners.forEach((cb) => cb(s.user));
      return s.user;
    },
    async signIn(email, password) {
      const s = await db();
      const acct = s.accounts[email.trim().toLowerCase()];
      if (!acct || acct.password !== password) throw new Error('Email or password is incorrect.');
      s.user = { id: acct.id, email: email.trim().toLowerCase() };
      await save();
      authListeners.forEach((cb) => cb(s.user));
      return s.user;
    },
    async signOut() {
      const s = await db();
      s.user = null;
      await save();
      authListeners.forEach((cb) => cb(null));
    },
    async deleteAccount() {
      const s = await db();
      const u = await me();
      delete s.profiles[u.id];
      s.companies = s.companies.filter((c) => c.owner_id !== u.id);
      for (const [k, v] of Object.entries(s.accounts)) if (v.id === u.id) delete s.accounts[k];
      s.user = null;
      await save();
      authListeners.forEach((cb) => cb(null));
    },

    async getMyProfile() {
      const s = await db();
      return s.user ? s.profiles[s.user.id] ?? null : null;
    },
    async saveMyProfile(patch) {
      const s = await db();
      const u = await me();
      const cur = s.profiles[u.id] ?? emptyProfile(u.id, patch.role ?? 'seeker');
      s.profiles[u.id] = { ...cur, ...patch, id: u.id };
      await save();
      return s.profiles[u.id];
    },
    async getProfile(id) {
      return (await db()).profiles[id] ?? null;
    },

    async getMyCompany() {
      const s = await db();
      const u = s.user;
      if (!u) return null;
      const c = s.companies.find((x) => x.owner_id === u.id);
      return c ? { ...c, team: [s.profiles[u.id]].filter(Boolean) } : null;
    },
    async saveMyCompany(patch) {
      const s = await db();
      const u = await me();
      let c = s.companies.find((x) => x.owner_id === u.id);
      if (!c) {
        c = {
          id: uid(), owner_id: u.id, name: '', kind: 'business', description: null, logo_url: null, cover_url: null,
          video_url: null, website: null, address: null, latitude: null, longitude: null, service_radius_km: null,
          values: [], perks: [], credentials: [], verification: 'unverified', created_at: new Date().toISOString(),
        };
        s.companies.push(c);
        s.subscriptions[c.id] = {
          company_id: c.id, plan: null, status: 'trialing',
          trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString(), current_period_end: null,
        };
      }
      const { verification: _ignored, ...safe } = patch; // verification is only set by CRAVE staff
      Object.assign(c, safe);
      await save();
      return c;
    },
    async getCompany(id) {
      const s = await db();
      const c = s.companies.find((x) => x.id === id);
      if (!c) return null;
      const team = c.team ?? [s.profiles[c.owner_id]].filter(Boolean);
      return { ...c, team };
    },
    async listMyJobs() {
      const s = await db();
      const c = await api.getMyCompany();
      return c ? s.jobs.filter((j) => j.company_id === c.id).map((j) => withCompany(s, j)) : [];
    },
    async saveJob(job) {
      const s = await db();
      const c = await api.getMyCompany();
      if (!c) throw new Error('Set up your company first.');
      const existing = job.id ? s.jobs.find((j) => j.id === job.id && j.company_id === c.id) : undefined;
      if (existing) {
        Object.assign(existing, job);
        await save();
        return existing;
      }
      const created: Job = {
        id: uid(), company_id: c.id, title: '', category: 'tech', description: null, pay_min: null, pay_max: null,
        pay_period: 'hour', employment_type: 'full_time', latitude: c.latitude, longitude: c.longitude,
        video_url: null, is_active: true, created_at: new Date().toISOString(), ...job,
      };
      s.jobs.unshift(created);
      await save();
      return created;
    },
    async getJob(id) {
      const s = await db();
      const j = s.jobs.find((x) => x.id === id);
      if (!j) return null;
      const job = withCompany(s, j);
      if (job.company) job.company = (await api.getCompany(job.company.id)) ?? job.company;
      return job;
    },
    async requestVerification() {
      const s = await db();
      const u = await me();
      const c = s.companies.find((x) => x.owner_id === u.id);
      if (c) c.verification = 'pending';
      await save();
    },
    async getSubscription() {
      const s = await db();
      const c = await api.getMyCompany();
      return c ? s.subscriptions[c.id] ?? null : null;
    },

    async jobFeed(f) {
      const s = await db();
      const u = await me();
      const swiped = new Set(s.swipes.filter((x) => x.actor_id === u.id).map((x) => x.job_id));
      const jobs = filterJobs(s, f).filter((j) => !swiped.has(j.id));
      const mine = s.profiles[u.id]?.categories ?? [];
      // Rank: categories I picked first, then verified, then closest.
      return jobs.sort((a, b) => {
        const score = (j: Job) =>
          (mine.includes(j.category) ? 100 : 0) + (j.company?.verification === 'verified' ? 20 : 0) - (j.distance_km ?? 0);
        return score(b) - score(a);
      });
    },
    async mapJobs(f) {
      return filterJobs(await db(), f);
    },
    async seekerFeed(jobId) {
      const s = await db();
      const u = await me();
      const job = s.jobs.find((j) => j.id === jobId);
      if (!job) return [];
      const swiped = new Set(s.swipes.filter((x) => x.actor_id === u.id && x.job_id === jobId).map((x) => x.seeker_id));
      const likedJob = new Set(s.swipes.filter((x) => x.side === 'seeker' && x.job_id === jobId && x.liked).map((x) => x.seeker_id));
      return Object.values(s.profiles)
        .filter((p) => p.role === 'seeker' && p.onboarded && !swiped.has(p.id) && !s.blocked.includes(p.id))
        .sort((a, b) => {
          const score = (p: Profile) => (likedJob.has(p.id) ? 100 : 0) + (p.categories.includes(job.category) ? 50 : 0);
          return score(b) - score(a);
        });
    },
    async swipeJob(jobId, liked): Promise<SwipeResult> {
      const s = await db();
      const u = await me();
      s.swipes.push({ actor_id: u.id, side: 'seeker', job_id: jobId, seeker_id: u.id, liked });
      let match: Match | null = null;
      const job = s.jobs.find((j) => j.id === jobId);
      // Demo employers like back about half the time, so you can try chat.
      if (liked && job && Math.random() < 0.5) {
        match = makeMatch(s, jobId, u.id);
        const company = s.companies.find((c) => c.id === job.company_id);
        const sender = company?.team?.[0]?.id ?? company?.owner_id ?? 'system';
        const greeting = DEMO_EMPLOYER_GREETINGS[Math.floor(Math.random() * DEMO_EMPLOYER_GREETINGS.length)];
        s.messages.push({ id: uid(), match_id: match.id, sender_id: sender, body: greeting, created_at: new Date().toISOString() });
      }
      await save();
      return { match: match ? hydrateMatch(s, match) : null };
    },
    async swipeSeeker(jobId, seekerId, liked) {
      const s = await db();
      const u = await me();
      s.swipes.push({ actor_id: u.id, side: 'employer', job_id: jobId, seeker_id: seekerId, liked });
      let match: Match | null = null;
      const theyLiked = s.swipes.some((x) => x.side === 'seeker' && x.job_id === jobId && x.seeker_id === seekerId && x.liked);
      if (liked && theyLiked) match = makeMatch(s, jobId, seekerId);
      await save();
      return { match: match ? hydrateMatch(s, match) : null };
    },

    async listMatches() {
      const s = await db();
      const u = await me();
      const myCompanyIds = s.companies.filter((c) => c.owner_id === u.id).map((c) => c.id);
      return s.matches
        .filter((m) => m.seeker_id === u.id || myCompanyIds.includes(m.company_id))
        .map((m) => hydrateMatch(s, m))
        .sort((a, b) => (b.last_message?.created_at ?? b.created_at).localeCompare(a.last_message?.created_at ?? a.created_at));
    },
    async getMatch(id) {
      const s = await db();
      const m = s.matches.find((x) => x.id === id);
      return m ? hydrateMatch(s, m) : null;
    },
    async listMessages(matchId) {
      return (await db()).messages.filter((m) => m.match_id === matchId);
    },
    async sendMessage(matchId, body) {
      const s = await db();
      const u = await me();
      const msg: Message = { id: uid(), match_id: matchId, sender_id: u.id, body: body.trim(), created_at: new Date().toISOString() };
      s.messages.push(msg);
      await save();
      emitMessage(msg);
      return msg;
    },
    subscribeToMessages(matchId, cb) {
      if (!msgListeners.has(matchId)) msgListeners.set(matchId, new Set());
      msgListeners.get(matchId)!.add(cb);
      return () => msgListeners.get(matchId)?.delete(cb);
    },
    async unmatch(matchId) {
      const s = await db();
      s.matches = s.matches.filter((m) => m.id !== matchId);
      s.messages = s.messages.filter((m) => m.match_id !== matchId);
      await save();
    },

    async report() {
      /* In demo mode reports are discarded. */
    },
    async block(userId) {
      const s = await db();
      s.blocked.push(userId);
      await save();
    },

    async uploadMedia(_bucket, localUri) {
      return localUri; // demo keeps files on the device
    },
    async importResume() {
      // Simulate what the real resume parser returns.
      await new Promise((r) => setTimeout(r, 1200));
      return {
        headline: 'Hard-working and eager to learn',
        experience: [{ title: 'Team Member', org: 'Corner Market', start: '2023', end: '2025', description: 'Customer service, stocking, training new hires.' }],
        education: [{ school: 'Roosevelt High School', degree: 'High School Diploma', year: '2024' }],
        skills: ['Customer service', 'Teamwork', 'Microsoft Excel'],
        activities: ['Varsity soccer', 'Volunteer at Food Bank of Iowa'],
      };
    },
  };
  return api;
}
