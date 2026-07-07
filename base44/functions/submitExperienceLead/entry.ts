import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

const ALLOWED_EXPERIENCE_TYPES = ['singles', 'couples'];
const ALLOWED_DURATIONS = ['2w', '3w', 'flexible'];
const ALLOWED_PLANS = ['work_along', 'dedicated'];
const ALLOWED_BUDGETS = ['under_4k', '4k_6k', '6k_8k', '8k_10k', '10k_plus', 'discuss'];
const ALLOWED_ACCOMS = ['shared', 'private', 'premium_suite', 'no_pref'];
const ALLOWED_GOALS = ['self_discovery', 'healing', 'relationship_prep', 'communication', 'reconnection', 'emotional_resilience', 'life_transition', 'other'];
const ALLOWED_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Per-IP rate limiting (10 requests per 10 minutes)
const ipCache = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const window = 10 * 60 * 1000;
  const limit = 10;
  const record = ipCache.get(ip) || { count: 0, start: now };
  if (now - record.start > window) {
    ipCache.set(ip, { count: 1, start: now });
    return false;
  }
  if (record.count >= limit) return true;
  record.count++;
  ipCache.set(ip, record);
  return false;
}

function getIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function sanitize(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  try {
    const ip = getIp(req);
    if (isRateLimited(ip)) {
      return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();

    // Honeypot check
    if (body._trap) {
      return Response.json({ success: true }); // silently discard bot submissions
    }

    // Validate required fields
    const full_name = sanitize(body.full_name, 200);
    const email = sanitize(body.email, 200).toLowerCase();
    const phone = sanitize(body.phone, 50);
    const country = sanitize(body.country, 100);
    const preferred_language = ['en', 'fr'].includes(body.preferred_language) ? body.preferred_language : 'en';

    if (!full_name || !email || !email.includes('@')) {
      return Response.json({ error: 'Name and valid email are required.' }, { status: 400 });
    }

    const experience_type = ALLOWED_EXPERIENCE_TYPES.includes(body.experience_type) ? body.experience_type : null;
    if (!experience_type) {
      return Response.json({ error: 'Invalid experience type.' }, { status: 400 });
    }

    const attending_with_partner = experience_type === 'couples' ? Boolean(body.attending_with_partner) : false;
    const relationship_length = experience_type === 'couples' ? sanitize(body.relationship_length, 100) : '';

    const raw_goals = Array.isArray(body.goals) ? body.goals : [];
    const goals = raw_goals.filter(g => ALLOWED_GOALS.includes(g));
    const goals_freetext = sanitize(body.goals_freetext, 2000);

    const earliest_month = ALLOWED_MONTHS.includes(body.earliest_month) ? body.earliest_month : '';
    const raw_preferred_months = Array.isArray(body.preferred_months) ? body.preferred_months : [];
    const preferred_months = raw_preferred_months.filter(m => ALLOWED_MONTHS.includes(m));
    const flexible_dates = Boolean(body.flexible_dates);
    const preferred_duration = ALLOWED_DURATIONS.includes(body.preferred_duration) ? body.preferred_duration : 'flexible';
    const availability_plan = ALLOWED_PLANS.includes(body.availability_plan) ? body.availability_plan : null;

    const budget_band = ALLOWED_BUDGETS.includes(body.budget_band) ? body.budget_band : 'discuss';
    const accommodation_pref = ALLOWED_ACCOMS.includes(body.accommodation_pref) ? body.accommodation_pref : 'no_pref';
    const attended_retreat_before = Boolean(body.attended_retreat_before);
    const working_with_therapist = typeof body.working_with_therapist === 'boolean' ? body.working_with_therapist : null;
    const notes = sanitize(body.notes, 2000);
    const consent_marketing = Boolean(body.consent_marketing);

    const base44 = createClientFromRequest(req);

    // Persist the lead (service role — public endpoint, no auth required)
    const lead = await base44.asServiceRole.entities.ExperienceLead.create({
      full_name,
      email,
      phone,
      country,
      preferred_language,
      experience_type,
      attending_with_partner,
      relationship_length,
      goals,
      goals_freetext,
      earliest_month,
      preferred_months,
      flexible_dates,
      preferred_duration,
      availability_plan,
      budget_band,
      accommodation_pref,
      attended_retreat_before,
      working_with_therapist,
      notes,
      consent_marketing,
      status: 'new',
    });

    // Create AdminNotification
    const budgetLabel = {
      under_4k: '< €4,000', '4k_6k': '€4,000–€6,000', '6k_8k': '€6,000–€8,000',
      '8k_10k': '€8,000–€10,000', '10k_plus': '€10,000+', discuss: 'Discuss options',
    }[budget_band] || budget_band;

    await base44.asServiceRole.entities.AdminNotification.create({
      type: 'new_registration',
      title: `New Experience Lead — ${full_name}`,
      body: [
        `Name: ${full_name}`,
        `Email: ${email}`,
        `Phone: ${phone || '—'}`,
        `Country: ${country || '—'}`,
        `Language: ${preferred_language}`,
        `Experience: ${experience_type}${attending_with_partner ? ' (with partner)' : ''}`,
        `Goals: ${goals.join(', ') || '—'}`,
        `Duration: ${preferred_duration}`,
        `Plan: ${availability_plan || '—'}`,
        `Budget: ${budgetLabel}`,
        `Accommodation: ${accommodation_pref}`,
        `Retreat before: ${attended_retreat_before ? 'Yes' : 'No'}`,
        `With therapist: ${working_with_therapist === null ? '—' : working_with_therapist ? 'Yes' : 'No'}`,
        `Notes: ${notes || '—'}`,
      ].join('\n'),
      is_read: false,
    });

    console.log(`ExperienceLead created: ${lead.id} for ${email}`);
    return Response.json({ success: true });

  } catch (error) {
    console.error('submitExperienceLead error:', error.message);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
});