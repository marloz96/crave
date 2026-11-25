import type {
  Company,
  Job,
  JobFilters,
  Match,
  Message,
  Profile,
  ResumeImport,
  Role,
  Subscription,
} from './types';
import { isSupabaseConfigured } from './supabase';
import { createDemoApi } from './demoApi';
import { createSupabaseApi } from './supabaseApi';

export type AuthUser = { id: string; email: string | null };
export type ReportTarget = { type: 'profile' | 'company' | 'job' | 'message'; id: string };
export type SwipeResult = { match: Match | null };

/**
 * Everything the app needs from the backend. There are two implementations:
 * - Supabase (real database, used when EXPO_PUBLIC_SUPABASE_URL is set)
 * - Demo (in-memory sample data for Des Moines, used for previews and testing)
 */
export interface CraveApi {
  mode: 'supabase' | 'demo';

  // Auth
  getUser(): Promise<AuthUser | null>;
  onAuthChange(cb: (user: AuthUser | null) => void): () => void;
  signUp(email: string, password: string): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;

  // Profiles
  getMyProfile(): Promise<Profile | null>;
  saveMyProfile(patch: Partial<Profile> & { role?: Role }): Promise<Profile>;
  getProfile(id: string): Promise<Profile | null>;

  // Companies & jobs
  getMyCompany(): Promise<Company | null>;
  saveMyCompany(patch: Partial<Company>): Promise<Company>;
  getCompany(id: string): Promise<Company | null>;
  listMyJobs(): Promise<Job[]>;
  saveJob(job: Partial<Job>): Promise<Job>;
  getJob(id: string): Promise<Job | null>;
  requestVerification(documentUris: string[], notes: string): Promise<void>;
  getSubscription(): Promise<Subscription | null>;

  // Discovery
  jobFeed(filters: JobFilters): Promise<Job[]>;
  mapJobs(filters: JobFilters): Promise<Job[]>;
  seekerFeed(jobId: string): Promise<Profile[]>;
  swipeJob(jobId: string, liked: boolean): Promise<SwipeResult>;
  swipeSeeker(jobId: string, seekerId: string, liked: boolean): Promise<SwipeResult>;

  // Matches & chat
  listMatches(): Promise<Match[]>;
  getMatch(id: string): Promise<Match | null>;
  listMessages(matchId: string): Promise<Message[]>;
  sendMessage(matchId: string, body: string): Promise<Message>;
  subscribeToMessages(matchId: string, cb: (m: Message) => void): () => void;
  unmatch(matchId: string): Promise<void>;

  // Safety
  report(target: ReportTarget, reason: string): Promise<void>;
  block(userId: string): Promise<void>;

  // Media
  uploadMedia(bucket: 'avatars' | 'media' | 'resumes' | 'verification', localUri: string, contentType: string): Promise<string>;
  importResume(localUri: string): Promise<ResumeImport>;
}

export const api: CraveApi = isSupabaseConfigured ? createSupabaseApi() : createDemoApi();
