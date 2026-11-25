import type { AuthUser, CraveApi } from './api';
import { getSupabase } from './supabase';
import type { Company, Job, Match, Message, Profile, ResumeImport, Subscription } from './types';

/** Real backend: Supabase Postgres + Auth + Storage + Realtime + Edge Functions. */
export function createSupabaseApi(): CraveApi {
  const sb = () => getSupabase();

  const toUser = (u: { id: string; email?: string | null } | null | undefined): AuthUser | null =>
    u ? { id: u.id, email: u.email ?? null } : null;

  async function uid(): Promise<string> {
    const { data } = await sb().auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new Error('Not signed in');
    return id;
  }

  function check<T>(res: { data: T; error: { message: string } | null }): T {
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }

  const MATCH_SELECT = '*, job:jobs(*, company:companies(*)), company:companies(*), seeker:profiles!matches_seeker_id_fkey(*)';

  async function attachLastMessages(matches: Match[]): Promise<Match[]> {
    if (!matches.length) return matches;
    const msgs = check(
      await sb()
        .from('messages')
        .select('*')
        .in('match_id', matches.map((m) => m.id))
        .order('created_at', { ascending: false })
        .limit(500),
    ) as Message[];
    return matches.map((m) => ({ ...m, last_message: msgs.find((x) => x.match_id === m.id) ?? null }));
  }

  const api: CraveApi = {
    mode: 'supabase',

    async getUser() {
      const { data } = await sb().auth.getSession();
      return toUser(data.session?.user);
    },
    onAuthChange(cb) {
      const { data } = sb().auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)));
      return () => data.subscription.unsubscribe();
    },
    async signUp(email, password) {
      const { data, error } = await sb().auth.signUp({ email: email.trim(), password });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error('Check your email to confirm your account, then sign in.');
      return toUser(data.user)!;
    },
    async signIn(email, password) {
      const { data, error } = await sb().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message);
      return toUser(data.user)!;
    },
    async signOut() {
      await sb().auth.signOut();
    },
    async deleteAccount() {
      // Apple requires in-app account deletion. The edge function removes the auth user;
      // all rows cascade from it.
      const { error } = await sb().functions.invoke('delete-account', { body: {} });
      if (error) throw new Error(error.message);
      await sb().auth.signOut();
    },

    async getMyProfile() {
      const { data } = await sb().auth.getSession();
      const id = data.session?.user.id;
      if (!id) return null;
      return check(await sb().from('profiles').select('*').eq('id', id).maybeSingle()) as Profile | null;
    },
    async saveMyProfile(patch) {
      const id = await uid();
      const { id: _i, ...rest } = patch;
      return check(await sb().from('profiles').upsert({ id, ...rest }).select().single()) as Profile;
    },
    async getProfile(id) {
      return check(await sb().from('profiles').select('*').eq('id', id).maybeSingle()) as Profile | null;
    },

    async getMyCompany() {
      const id = await uid();
      const c = check(await sb().from('companies').select('*').eq('owner_id', id).maybeSingle()) as Company | null;
      if (!c) return null;
      return api.getCompany(c.id);
    },
    async saveMyCompany(patch) {
      const owner_id = await uid();
      const { verification: _v, team: _t, id: _id, created_at: _c, ...rest } = patch;
      return check(
        await sb().from('companies').upsert({ owner_id, ...rest }, { onConflict: 'owner_id' }).select().single(),
      ) as Company;
    },
    async getCompany(id) {
      const c = check(
        await sb().from('companies').select('*, members:company_members(profile:profiles(*))').eq('id', id).maybeSingle(),
      ) as (Company & { members?: { profile: Profile }[] }) | null;
      if (!c) return null;
      const { members, ...company } = c;
      return { ...company, team: (members ?? []).map((m) => m.profile).filter(Boolean) };
    },
    async listMyJobs() {
      const c = await api.getMyCompany();
      if (!c) return [];
      return check(
        await sb().from('jobs').select('*, company:companies(*)').eq('company_id', c.id).order('created_at', { ascending: false }),
      ) as Job[];
    },
    async saveJob(job) {
      const c = await api.getMyCompany();
      if (!c) throw new Error('Set up your company first.');
      const { company: _c, distance_km: _d, created_at: _ca, ...rest } = job;
      const row = { latitude: c.latitude, longitude: c.longitude, ...rest, company_id: c.id };
      return check(await sb().from('jobs').upsert(row).select().single()) as Job;
    },
    async getJob(id) {
      const j = check(await sb().from('jobs').select('*').eq('id', id).maybeSingle()) as Job | null;
      if (!j) return null;
      return { ...j, company: (await api.getCompany(j.company_id)) ?? undefined };
    },
    async requestVerification(documentPaths, notes) {
      const c = await api.getMyCompany();
      if (!c) throw new Error('Set up your company first.');
      check(await sb().from('verification_requests').insert({ company_id: c.id, document_paths: documentPaths, notes }));
    },
    async getSubscription() {
      const c = await api.getMyCompany();
      if (!c) return null;
      return check(await sb().from('subscriptions').select('*').eq('company_id', c.id).maybeSingle()) as Subscription | null;
    },

    async jobFeed(f) {
      const rows = check(
        await sb().rpc('job_feed', {
          p_lat: f.near?.latitude ?? null,
          p_lng: f.near?.longitude ?? null,
          p_categories: f.categories?.length ? f.categories : null,
          p_types: f.employmentTypes?.length ? f.employmentTypes : null,
          p_verified_only: f.verifiedOnly ?? false,
          p_radius_km: f.radiusKm ?? null,
          p_exclude_swiped: true,
          p_limit: 50,
        }),
      ) as Job[];
      return rows;
    },
    async mapJobs(f) {
      return check(
        await sb().rpc('job_feed', {
          p_lat: f.near?.latitude ?? null,
          p_lng: f.near?.longitude ?? null,
          p_categories: f.categories?.length ? f.categories : null,
          p_types: f.employmentTypes?.length ? f.employmentTypes : null,
          p_verified_only: f.verifiedOnly ?? false,
          p_radius_km: f.radiusKm ?? null,
          p_exclude_swiped: false,
          p_limit: 300,
        }),
      ) as Job[];
    },
    async seekerFeed(jobId) {
      return check(await sb().rpc('seeker_feed', { p_job_id: jobId, p_limit: 50 })) as Profile[];
    },
    async swipeJob(jobId, liked) {
      const id = await uid();
      check(
        await sb().from('swipes').upsert(
          { actor_id: id, side: 'seeker', job_id: jobId, seeker_id: id, liked },
          { onConflict: 'actor_id,job_id,seeker_id' },
        ),
      );
      // A database trigger creates the match when both sides liked.
      const m = check(
        await sb().from('matches').select(MATCH_SELECT).eq('job_id', jobId).eq('seeker_id', id).maybeSingle(),
      ) as Match | null;
      return { match: liked ? m : null };
    },
    async swipeSeeker(jobId, seekerId, liked) {
      const id = await uid();
      check(
        await sb().from('swipes').upsert(
          { actor_id: id, side: 'employer', job_id: jobId, seeker_id: seekerId, liked },
          { onConflict: 'actor_id,job_id,seeker_id' },
        ),
      );
      const m = check(
        await sb().from('matches').select(MATCH_SELECT).eq('job_id', jobId).eq('seeker_id', seekerId).maybeSingle(),
      ) as Match | null;
      return { match: liked ? m : null };
    },

    async listMatches() {
      const matches = check(await sb().from('matches').select(MATCH_SELECT).order('created_at', { ascending: false })) as Match[];
      const withLast = await attachLastMessages(matches);
      return withLast.sort((a, b) =>
        (b.last_message?.created_at ?? b.created_at).localeCompare(a.last_message?.created_at ?? a.created_at),
      );
    },
    async getMatch(id) {
      const m = check(await sb().from('matches').select(MATCH_SELECT).eq('id', id).maybeSingle()) as Match | null;
      if (!m) return null;
      if (m.company) m.company = (await api.getCompany(m.company.id)) ?? m.company;
      return m;
    },
    async listMessages(matchId) {
      return check(
        await sb().from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true }).limit(500),
      ) as Message[];
    },
    async sendMessage(matchId, body) {
      const id = await uid();
      return check(
        await sb().from('messages').insert({ match_id: matchId, sender_id: id, body: body.trim() }).select().single(),
      ) as Message;
    },
    subscribeToMessages(matchId, cb) {
      const channel = sb()
        .channel(`messages:${matchId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
          (payload) => cb(payload.new as Message),
        )
        .subscribe();
      return () => {
        sb().removeChannel(channel);
      };
    },
    async unmatch(matchId) {
      check(await sb().from('matches').delete().eq('id', matchId));
    },

    async report(target, reason) {
      const id = await uid();
      check(await sb().from('reports').insert({ reporter_id: id, target_type: target.type, target_id: target.id, reason }));
    },
    async block(userId) {
      const id = await uid();
      check(await sb().from('blocks').upsert({ blocker_id: id, blocked_id: userId }));
    },

    async uploadMedia(bucket, localUri, contentType) {
      const id = await uid();
      const ext = contentType.split('/')[1]?.replace('quicktime', 'mov').replace('jpeg', 'jpg') ?? 'bin';
      const path = `${id}/${Date.now()}.${ext}`;
      const body = await (await fetch(localUri)).arrayBuffer();
      check(await sb().storage.from(bucket).upload(path, body, { contentType, upsert: false }));
      if (bucket === 'avatars' || bucket === 'media') return sb().storage.from(bucket).getPublicUrl(path).data.publicUrl;
      return path; // private buckets return the storage path
    },
    async importResume(localUri) {
      const path = await api.uploadMedia('resumes', localUri, 'application/pdf');
      const { data, error } = await sb().functions.invoke('parse-resume', { body: { path } });
      if (error) throw new Error("We couldn't read that file. Try a PDF of your resume or LinkedIn profile.");
      return data as ResumeImport;
    },
  };
  return api;
}
