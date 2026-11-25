export type Role = 'seeker' | 'employer';
export type EmploymentType = 'full_time' | 'part_time' | 'gig' | 'internship';
export type PayPeriod = 'hour' | 'year' | 'job';
export type Verification = 'unverified' | 'pending' | 'verified' | 'revoked';
export type CompanyKind = 'business' | 'contractor';

export type PromptAnswer = { prompt: string; answer: string };
export type Experience = { title: string; org: string; start?: string; end?: string; description?: string };
export type Education = { school: string; degree?: string; year?: string };

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  city: string | null;
  birth_year: number | null;
  categories: string[];
  video_url: string | null;
  prompts: PromptAnswer[];
  experience: Experience[];
  education: Education[];
  skills: string[];
  activities: string[];
  availability: EmploymentType[];
  looking_for: string | null;
  /** Employer-side fields (HR / hiring managers) */
  job_title: string | null;
  what_i_look_for: string | null;
  onboarded: boolean;
};

export type Company = {
  id: string;
  owner_id: string;
  name: string;
  kind: CompanyKind;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  video_url: string | null;
  website: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  service_radius_km: number | null;
  values: string[];
  perks: string[];
  credentials: string[];
  verification: Verification;
  created_at: string;
  team?: Profile[];
};

export type Job = {
  id: string;
  company_id: string;
  title: string;
  category: string;
  description: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_period: PayPeriod;
  employment_type: EmploymentType;
  latitude: number | null;
  longitude: number | null;
  video_url: string | null;
  is_active: boolean;
  created_at: string;
  company?: Company;
  distance_km?: number | null;
};

export type Match = {
  id: string;
  job_id: string;
  seeker_id: string;
  company_id: string;
  created_at: string;
  job?: Job;
  company?: Company;
  seeker?: Profile;
  last_message?: Message | null;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  flagged?: boolean;
};

export type Plan = 'solo' | 'small' | 'pro';
export type Subscription = {
  company_id: string;
  plan: Plan | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'none';
  trial_ends_at: string | null;
  current_period_end: string | null;
};

export type JobFilters = {
  categories?: string[];
  employmentTypes?: EmploymentType[];
  verifiedOnly?: boolean;
  minPay?: number;
  radiusKm?: number;
  near?: { latitude: number; longitude: number };
};

export type ResumeImport = Partial<
  Pick<Profile, 'full_name' | 'headline' | 'bio' | 'city' | 'experience' | 'education' | 'skills' | 'activities' | 'categories'>
>;
