# Where I left off

_Last updated: November 25, 2026_

## What's done

- The full app for iPhone and Android: sign-up for job seekers (16+) and employers, profiles with video, swipe matching, "It's a match!", live chat with report and block, the hiring map, employer verification, and subscription plans.
- The database is set up in Supabase (project `ntzphpuwdxabtushztlp`). Two SQL scripts were run in the Supabase SQL editor: `supabase/migrations/20261125000000_init.sql` and `supabase/migrations/20261125220000_grants.sql`.
- The app runs on a phone through Expo Go. Tested sign-up and profile creation for real on an iPhone.
- Supabase "Confirm email" is turned **off** for testing.

## How to run it again

1. If Supabase says the project is paused, open the Supabase dashboard and click **Restore**.
2. Download this repo (green **Code** button, then **Download ZIP**) and unzip it.
3. In Terminal, go to the folder (`cd ` then drag the folder in), then run:
   ```bash
   npm install
   npx expo login                # your free Expo account
   npx expo start --go           # scan the QR code with your phone camera / Expo Go
   ```
4. To see the app full of sample Des Moines businesses and jobs instead of the real (empty) database:
   - Mac: `EXPO_PUBLIC_DEMO=1 npx expo start --go`
   - Windows: `$env:EXPO_PUBLIC_DEMO=1; npx expo start --go`

## What's not done yet

**Features**
- Push notifications for new matches and messages (not built yet).
- Resume / LinkedIn PDF import: the code is written (`supabase/functions/parse-resume`) but not switched on. It needs to be deployed to Supabase and needs an Anthropic API key (prepaid, about $5 to start, a few cents per resume).
- Account deletion and payment updater programs (`supabase/functions/delete-account`, `revenuecat-webhook`) are written but not deployed.
- Ames as a second launch city (for an Iowa State career fair launch).
- Possible "listed jobs" from licensed job feeds (Adzuna, USAJobs, Greenhouse/Lever job boards) with "Apply on their site", to fill the app before employers join. Do not scrape Indeed or LinkedIn.

**Accounts and setup before launch**
- Apple Developer account ($99/year) and Google Play account ($25 once).
- RevenueCat account plus subscription products in both stores. Prices in `src/lib/plans.ts` ($19 / $79 / $199) are placeholders.
- A real email sender for Supabase (for example Resend, free tier), turn "Confirm email" back on, and set the Site URL.
- Google Maps Android key in `app.json`.
- Privacy policy and terms page (extra care because users can be 16 or 17).
- Final bundle ID (currently `com.craveapp.crave`) and a trademark check on the name "CRAVE".

## Ideas still open

- Is there demand? Plan: talk to 10 Des Moines employers and 20 people aged 16 to 25, show them the sample mode, and see who signs up.
- Launch at Iowa State's career fair (likely spring semester). Walk the fair with a QR code flyer rather than relying on the university to promote it.
- Pricing tiers and the 30-day free trial for employers.

More detail on launching: see the step-by-step launch guide and the "Before launch checklist" in the [README](../README.md).
