import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

const VALID_METHODS = ['password', 'google', 'microsoft', 'apple'];

// Records the sign-in method a member just used, onto their UserProfile.auth_methods.
// Called once after login completes (the client stashes the method in
// sessionStorage before the login redirect, then invokes this on load).
//
// This is a SELF-DECLARED record, not a platform-verified one: Base44 does not
// expose linked identities, so this best-effort list is the only source the
// privileged step-up modal has to show only methods the member has actually used.
// It is idempotent (dedups) and never weakens authentication — it only records
// what already succeeded.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const { method } = await req.json().catch(() => ({}));
    if (!method || !VALID_METHODS.includes(method)) {
      return Response.json({ error: 'Invalid method' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    if (!profile) {
      // No profile yet (e.g. pre-onboarding). Nothing to record; the onboarding
      // flow will create the profile and the method can be re-recorded next login.
      return Response.json({ success: true, recorded: false, reason: 'no_profile' });
    }

    const existing = Array.isArray(profile.auth_methods) ? profile.auth_methods : [];
    if (existing.includes(method)) {
      return Response.json({ success: true, recorded: false, reason: 'already_recorded', auth_methods: existing });
    }

    const updated = [...existing, method];
    await base44.asServiceRole.entities.UserProfile.update(profile.id, { auth_methods: updated });
    return Response.json({ success: true, recorded: true, auth_methods: updated });
  } catch (error) {
    console.error('[recordAuthMethod] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});