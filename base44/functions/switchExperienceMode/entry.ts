import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Switches a user's experience mode to Single (clears partner-specific data).
// Switching INTO Couple mode is handled by the existing linkPartner 'link' flow,
// so this function only handles mode === 'single'.
//
// Does NOT clear existing Connection records, unlocked profiles, or message
// history — only partner-link data (per the existing couple flow's behavior).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { mode } = body;
    if (mode !== 'single') {
      return Response.json({ error: 'Only mode=single is supported here. Switch to couple uses linkPartner.' }, { status: 400 });
    }

    const myProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    const myProfile = myProfiles[0];
    if (!myProfile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    // Clear partner-specific data and revert to individual
    await base44.asServiceRole.entities.UserProfile.update(myProfile.id, {
      profile_type: 'individual',
      paired_status: 'single',
      partner_email: null,
      partner_user_id: null,
      couple_consent_given: false,
    });

    // Cancel any pending outgoing PartnerLink requests
    const outgoing = await base44.entities.PartnerLink.filter({ from_user_id: user.id, status: 'pending' });
    for (const link of outgoing) {
      await base44.entities.PartnerLink.update(link.id, { status: 'declined' });
    }

    // If this user was paired, also reset the partner's profile to single
    if (myProfile.partner_user_id) {
      const partnerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: myProfile.partner_user_id });
      if (partnerProfiles[0]) {
        await base44.asServiceRole.entities.UserProfile.update(partnerProfiles[0].id, {
          paired_status: 'single',
          partner_user_id: null,
          partner_email: null,
          profile_type: 'individual',
        });
      }
    }

    return Response.json({ success: true, message: 'Switched to Single mode.' });
  } catch (error) {
    console.error('[switchExperienceMode] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});