// Keeps employer subscriptions in sync with Apple / Google billing via RevenueCat.
// Deploy: supabase functions deploy revenuecat-webhook --no-verify-jwt
// Secret:  supabase secrets set REVENUECAT_WEBHOOK_SECRET=<any long random string>
// In RevenueCat > Integrations > Webhooks, set the URL to
//   https://<project>.supabase.co/functions/v1/revenuecat-webhook
// and the Authorization header to "Bearer <same secret>".
import { createClient } from 'npm:@supabase/supabase-js@2';

// RevenueCat product identifiers -> CRAVE plan. Create these products in App Store Connect / Play Console.
const PLAN_BY_PRODUCT: Record<string, 'solo' | 'small' | 'pro'> = {
  crave_solo_monthly: 'solo',
  crave_small_monthly: 'small',
  crave_pro_monthly: 'pro',
};

Deno.serve(async (req) => {
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!secret || req.headers.get('Authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { event } = await req.json();
  // The app logs users in to RevenueCat with their Supabase user id.
  const ownerId: string | undefined = event?.app_user_id;
  if (!ownerId) return new Response('ok');

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: company } = await admin.from('companies').select('id').eq('owner_id', ownerId).maybeSingle();
  if (!company) return new Response('ok');

  const plan = PLAN_BY_PRODUCT[event.product_id as string] ?? null;
  const expires = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

  let status: 'active' | 'past_due' | 'canceled' | null = null;
  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'UNCANCELLATION':
      status = 'active';
      break;
    case 'BILLING_ISSUE':
      status = 'past_due';
      break;
    case 'CANCELLATION': // still active until the period ends
      status = 'canceled';
      break;
    case 'EXPIRATION':
      status = 'canceled';
      break;
  }
  if (!status) return new Response('ok');

  await admin.from('subscriptions').upsert({
    company_id: company.id,
    plan,
    status,
    current_period_end: event.type === 'EXPIRATION' ? new Date().toISOString() : expires,
    revenuecat_app_user_id: ownerId,
    updated_at: new Date().toISOString(),
  });

  return new Response('ok');
});
