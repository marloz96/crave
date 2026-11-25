import type { Company, Job, Profile } from './types';

/**
 * Sample data for demo mode: fictional businesses around Des Moines, Iowa.
 * None of these are real companies.
 */
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

const baseProfile = (p: Partial<Profile> & Pick<Profile, 'id' | 'role' | 'full_name'>): Profile => ({
  avatar_url: null,
  headline: null,
  bio: null,
  city: 'Des Moines, IA',
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
  onboarded: true,
  ...p,
});

export const demoHr: Profile[] = [
  baseProfile({ id: 'hr-1', role: 'employer', full_name: 'Jasmine Ortiz', job_title: 'People Lead', bio: "I've hired 40+ first-jobbers. I care about curiosity over credentials.", what_i_look_for: 'People who ask good questions and follow through.' }),
  baseProfile({ id: 'hr-2', role: 'employer', full_name: 'Derek Lund', job_title: 'Owner & Master Electrician', bio: 'Third-generation electrician. I train apprentices from day one.', what_i_look_for: 'Show up on time, safety first, willing to learn.' }),
  baseProfile({ id: 'hr-3', role: 'employer', full_name: 'Priya Natarajan', job_title: 'Engineering Manager', bio: 'I run a small product team building farm software.', what_i_look_for: 'Builders. Show me something you made, even if it is rough.' }),
  baseProfile({ id: 'hr-4', role: 'employer', full_name: 'Marcus Bell', job_title: 'General Manager', bio: 'Started as a dishwasher here in 2014. Now I run the place.', what_i_look_for: 'Good energy and a team-first attitude.' }),
];

type SeedCompany = Omit<Company, 'created_at' | 'owner_id' | 'logo_url' | 'cover_url' | 'video_url' | 'website' | 'service_radius_km'> &
  Partial<Company>;

const companySeeds: SeedCompany[] = [
  { id: 'c-1', name: 'Prairie Byte Labs', kind: 'business', description: 'Software for Midwest farmers: crop planning, equipment tracking, weather alerts.', address: 'East Village, Des Moines', latitude: 41.5893, longitude: -93.6113, values: ['Ship small, ship often', 'Ask dumb questions', 'Farmers first'], perks: ['Hybrid', 'Learning budget', 'Free lunch Fridays'], credentials: [], verification: 'verified', team: [demoHr[2]] },
  { id: 'c-2', name: 'Lund & Sons Electric', kind: 'contractor', description: 'Residential and light commercial electrical. Family-run since 1979.', address: 'Serves Greater Des Moines', latitude: 41.6005, longitude: -93.6563, service_radius_km: 40, values: ['Safety', 'Craftsmanship'], perks: ['Paid apprenticeship', 'Truck provided', 'Tool allowance'], credentials: ['Iowa Master Electrician License, verified', 'Insured & bonded'], verification: 'verified', team: [demoHr[1]] },
  { id: 'c-3', name: 'Ember & Oak Kitchen', kind: 'business', description: 'Wood-fired restaurant in the Court Avenue district.', address: 'Court Ave, Des Moines', latitude: 41.5847, longitude: -93.6201, values: ['Hospitality is a team sport'], perks: ['Shift meals', 'Tips pooled fairly', 'Flexible schedules'], credentials: [], verification: 'verified', team: [demoHr[3]] },
  { id: 'c-4', name: 'Heartland Credit Union', kind: 'business', description: 'Member-owned credit union with 12 branches across Iowa.', address: 'West Des Moines', latitude: 41.5772, longitude: -93.7113, values: ['Members over profits', 'Financial literacy'], perks: ['401k match', 'Tuition reimbursement'], credentials: [], verification: 'verified', team: [demoHr[0]] },
  { id: 'c-5', name: 'Raccoon River Outfitters', kind: 'business', description: 'Outdoor gear, bikes and kayak rentals by the trail.', address: 'Valley Junction, West Des Moines', latitude: 41.5718, longitude: -93.7096, values: ['Get outside'], perks: ['Gear discount', 'Weekend paddles'], credentials: [], verification: 'pending' },
  { id: 'c-6', name: 'Mercy Plains Clinic', kind: 'business', description: 'Community health clinic offering primary and urgent care.', address: 'Beaverdale, Des Moines', latitude: 41.6152, longitude: -93.6705, values: ['Care for everyone'], perks: ['CNA certification paid', 'Health insurance'], credentials: [], verification: 'verified' },
  { id: 'c-7', name: 'Cornerstone Builders', kind: 'business', description: 'Commercial construction across central Iowa.', address: 'Ankeny', latitude: 41.7297, longitude: -93.6058, values: ['Build it right'], perks: ['OSHA 10 training', 'Overtime'], credentials: [], verification: 'verified' },
  { id: 'c-8', name: 'Golden Hour Studio', kind: 'contractor', description: 'Wedding and brand photography. Looking for a second shooter and editing assistant.', address: 'Sherman Hill, Des Moines', latitude: 41.5942, longitude: -93.6362, service_radius_km: 80, values: ['Make people feel seen'], perks: ['Mentorship', 'Portfolio credit'], credentials: ['Business license, verified'], verification: 'verified' },
  { id: 'c-9', name: 'Hy-Way Logistics', kind: 'business', description: 'Regional freight and warehouse hub off I-80.', address: 'Altoona', latitude: 41.6447, longitude: -93.4783, values: ['On time, every time'], perks: ['Weekly pay', 'Shift differential'], credentials: [], verification: 'unverified' },
  { id: 'c-10', name: 'Cyclone Auto Care', kind: 'business', description: 'Independent auto repair shop. ASE-certified techs.', address: 'Urbandale', latitude: 41.6266, longitude: -93.7122, values: ['Honest work'], perks: ['ASE cert support', 'Tool program'], credentials: [], verification: 'verified' },
  { id: 'c-11', name: 'Bloom Social', kind: 'business', description: 'Social media agency for local restaurants and shops.', address: 'Drake neighborhood, Des Moines', latitude: 41.6031, longitude: -93.6542, values: ['Create boldly', 'Data backs it up'], perks: ['Remote Fridays', 'Creative budget'], credentials: [], verification: 'verified' },
  { id: 'c-12', name: 'Green Acres Co-op', kind: 'business', description: 'Farmer-owned grain and agronomy co-op.', address: 'Grimes', latitude: 41.6883, longitude: -93.7911, values: ['Rooted in community'], perks: ['Harvest bonus', 'CDL training'], credentials: [], verification: 'verified' },
];

export const demoCompanies: Company[] = companySeeds.map((c, i) => ({
  owner_id: `owner-${c.id}`,
  logo_url: null,
  cover_url: null,
  video_url: null,
  website: null,
  service_radius_km: null,
  created_at: daysAgo(60 + i),
  ...c,
}));

type SeedJob = Pick<Job, 'id' | 'company_id' | 'title' | 'category' | 'description' | 'pay_min' | 'pay_max' | 'pay_period' | 'employment_type'>;

const jobSeeds: SeedJob[] = [
  { id: 'j-1', company_id: 'c-1', title: 'Junior Mobile Developer', category: 'tech', description: 'Help build our React Native app used by 3,000 Iowa farmers. Bootcamp grads and self-taught devs welcome.', pay_min: 62000, pay_max: 75000, pay_period: 'year', employment_type: 'full_time' },
  { id: 'j-2', company_id: 'c-1', title: 'Customer Success Intern', category: 'customer-service', description: 'Talk to farmers, learn the product, write help articles. Summer, paid.', pay_min: 18, pay_max: 20, pay_period: 'hour', employment_type: 'internship' },
  { id: 'j-3', company_id: 'c-2', title: 'Electrical Apprentice', category: 'trades', description: 'Paid apprenticeship toward your Iowa journeyman license. No experience needed, we train you.', pay_min: 19, pay_max: 24, pay_period: 'hour', employment_type: 'full_time' },
  { id: 'j-4', company_id: 'c-3', title: 'Line Cook', category: 'food', description: 'Work the wood-fired grill. We will teach you knife skills and fire management.', pay_min: 17, pay_max: 21, pay_period: 'hour', employment_type: 'part_time' },
  { id: 'j-5', company_id: 'c-3', title: 'Host / Server', category: 'hospitality', description: 'Be the first smile guests see. Evenings and weekends.', pay_min: 12, pay_max: 30, pay_period: 'hour', employment_type: 'part_time' },
  { id: 'j-6', company_id: 'c-4', title: 'Member Service Rep', category: 'finance', description: 'Help members open accounts, solve problems, and plan their money. Paid training.', pay_min: 19, pay_max: 22, pay_period: 'hour', employment_type: 'full_time' },
  { id: 'j-7', company_id: 'c-4', title: 'Financial Analyst I', category: 'finance', description: 'Entry-level analyst on our lending team. Excel and curiosity required.', pay_min: 58000, pay_max: 66000, pay_period: 'year', employment_type: 'full_time' },
  { id: 'j-8', company_id: 'c-5', title: 'Bike Mechanic & Sales', category: 'retail', description: 'Tune bikes, rent kayaks, talk gear with customers.', pay_min: 16, pay_max: 19, pay_period: 'hour', employment_type: 'part_time' },
  { id: 'j-9', company_id: 'c-6', title: 'Certified Nursing Assistant (CNA)', category: 'healthcare', description: 'We pay for your CNA certification. Day and night shifts.', pay_min: 20, pay_max: 25, pay_period: 'hour', employment_type: 'full_time' },
  { id: 'j-10', company_id: 'c-6', title: 'Front Desk Coordinator', category: 'admin', description: 'Check in patients, schedule visits, keep the clinic running.', pay_min: 17, pay_max: 19, pay_period: 'hour', employment_type: 'full_time' },
  { id: 'j-11', company_id: 'c-7', title: 'Construction Laborer', category: 'construction', description: 'Commercial job sites around Ankeny. OSHA 10 provided.', pay_min: 21, pay_max: 26, pay_period: 'hour', employment_type: 'full_time' },
  { id: 'j-12', company_id: 'c-8', title: 'Second Shooter (Weddings)', category: 'creative', description: 'Shoot weddings with us on weekends. Bring your own camera.', pay_min: 250, pay_max: 400, pay_period: 'job', employment_type: 'gig' },
  { id: 'j-13', company_id: 'c-8', title: 'Photo Editing Assistant', category: 'creative', description: 'Cull and edit in Lightroom. Remote-friendly.', pay_min: 18, pay_max: 22, pay_period: 'hour', employment_type: 'part_time' },
  { id: 'j-14', company_id: 'c-9', title: 'Warehouse Associate', category: 'logistics', description: 'Pick, pack and load. Forklift training provided.', pay_min: 19, pay_max: 23, pay_period: 'hour', employment_type: 'full_time' },
  { id: 'j-15', company_id: 'c-10', title: 'Lube Tech / Apprentice Mechanic', category: 'automotive', description: 'Start with oil changes, grow into a full tech.', pay_min: 17, pay_max: 22, pay_period: 'hour', employment_type: 'full_time' },
  { id: 'j-16', company_id: 'c-11', title: 'Social Media Coordinator', category: 'marketing', description: 'Plan, shoot and post content for 10 local brands. TikTok fluency a must.', pay_min: 45000, pay_max: 52000, pay_period: 'year', employment_type: 'full_time' },
  { id: 'j-17', company_id: 'c-11', title: 'Content Creator (Gig)', category: 'creative', description: 'Paid per video for restaurant clients.', pay_min: 75, pay_max: 150, pay_period: 'job', employment_type: 'gig' },
  { id: 'j-18', company_id: 'c-12', title: 'Seasonal Grain Handler', category: 'agriculture', description: 'Harvest season at our elevator. Long days, great bonus.', pay_min: 20, pay_max: 24, pay_period: 'hour', employment_type: 'part_time' },
  { id: 'j-19', company_id: 'c-12', title: 'Agronomy Intern', category: 'agriculture', description: 'Scout fields, take soil samples, learn crop science.', pay_min: 18, pay_max: 20, pay_period: 'hour', employment_type: 'internship' },
  { id: 'j-20', company_id: 'c-5', title: 'Weekend Trail Guide', category: 'hospitality', description: 'Lead kayak and bike tours on summer weekends.', pay_min: 18, pay_max: 18, pay_period: 'hour', employment_type: 'gig' },
];

export const demoJobs: Job[] = jobSeeds.map((j, i) => {
  const c = demoCompanies.find((x) => x.id === j.company_id)!;
  // Small offsets so multiple jobs at one company don't stack exactly.
  const jitter = (n: number) => ((n % 5) - 2) * 0.0012;
  return {
    ...j,
    latitude: (c.latitude ?? 0) + jitter(i),
    longitude: (c.longitude ?? 0) + jitter(i + 2),
    video_url: null,
    is_active: true,
    created_at: daysAgo(i % 9),
  };
});

export const demoSeekers: Profile[] = [
  baseProfile({ id: 's-1', role: 'seeker', full_name: 'Ava Thompson', headline: 'Self-taught developer, building apps since 15', birth_year: 2005, categories: ['tech', 'creative'], skills: ['JavaScript', 'React Native', 'Figma'], activities: ['Hackathon winner, Hack Iowa 2025', 'Robotics club captain'], availability: ['full_time', 'internship'], looking_for: 'A small team where I can ship real features.', prompts: [{ prompt: 'Something I taught myself…', answer: 'How to build and publish an app. 2,000 downloads and counting.' }, { prompt: "A team I'd thrive on…", answer: 'Fast, kind, and not afraid to say "I don\'t know".' }], experience: [{ title: 'Freelance web developer', org: 'Self-employed', start: '2023' }], education: [{ school: 'Des Moines Area Community College', degree: 'AAS, Computer Programming', year: '2026' }] }),
  baseProfile({ id: 's-2', role: 'seeker', full_name: 'Jayden Brooks', headline: 'Hands-on, mechanically minded, ready to learn a trade', birth_year: 2006, categories: ['trades', 'automotive', 'construction'], skills: ['Small engine repair', 'Welding basics', 'Forklift'], activities: ['Varsity wrestling', 'FFA member'], availability: ['full_time'], looking_for: 'An apprenticeship that leads to a license.', prompts: [{ prompt: "I'm at my best when…", answer: 'My hands are busy and I can see what I built at the end of the day.' }], experience: [{ title: 'Farmhand', org: 'Family farm, Boone County', start: '2019' }] }),
  baseProfile({ id: 's-3', role: 'seeker', full_name: 'Sofia Ramirez', headline: 'Bilingual people-person who loves numbers', birth_year: 2003, categories: ['finance', 'customer-service', 'admin'], skills: ['Spanish', 'Excel', 'Customer service'], activities: ['Treasurer, Latino Student Union'], availability: ['full_time', 'part_time'], looking_for: 'A finance role where I can help my community.', prompts: [{ prompt: 'My coworkers would say I…', answer: 'Remember everyone\'s birthday and every customer\'s name.' }], experience: [{ title: 'Bank teller', org: 'Hometown Bank', start: '2024' }], education: [{ school: 'Drake University', degree: 'BS, Finance', year: '2025' }] }),
  baseProfile({ id: 's-4', role: 'seeker', full_name: 'Malik Johnson', headline: 'Line cook with big dreams of my own food truck', birth_year: 2004, categories: ['food', 'hospitality'], skills: ['Grill', 'Prep', 'ServSafe certified'], availability: ['part_time', 'full_time'], looking_for: 'A kitchen where I can learn from great chefs.', prompts: [{ prompt: 'What I want to learn next…', answer: 'Fire cooking and running a whole kitchen.' }] }),
  baseProfile({ id: 's-5', role: 'seeker', full_name: 'Emma Nguyen', headline: 'Future nurse, current CNA student', birth_year: 2007, categories: ['healthcare', 'admin'], skills: ['CPR certified', 'Patient care'], availability: ['part_time'], looking_for: 'Healthcare experience while I finish school.', prompts: [{ prompt: 'A green flag in a boss is…', answer: 'They explain the "why", not just the "what".' }] }),
  baseProfile({ id: 's-6', role: 'seeker', full_name: 'Noah Peterson', headline: 'Content creator, 40k followers, ready to go pro', birth_year: 2005, categories: ['marketing', 'creative'], skills: ['Video editing', 'CapCut', 'Lightroom', 'Copywriting'], availability: ['full_time', 'gig'], looking_for: 'Creative work with real clients.', prompts: [{ prompt: "The work I'm proudest of…", answer: 'A video for a local bakery that got 300k views and sold them out.' }] }),
];

/** Seekers who already liked a job, so employers get matches quickly in the demo. */
export const demoSeekerLikes: { seeker_id: string; job_id: string }[] = [
  { seeker_id: 's-1', job_id: 'j-1' },
  { seeker_id: 's-2', job_id: 'j-3' },
  { seeker_id: 's-4', job_id: 'j-4' },
  { seeker_id: 's-6', job_id: 'j-16' },
];

export const DEMO_EMPLOYER_GREETINGS = [
  "Hey! Loved your profile. Want to hop on a quick call this week?",
  "Thanks for the like! What does your availability look like?",
  "Hi! We'd love to tell you more about the team. Any questions for us?",
];
