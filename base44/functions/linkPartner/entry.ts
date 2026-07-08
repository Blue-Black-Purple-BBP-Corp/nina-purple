import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { partner_email, from_display_name, action } = body;

    if (action === 'link') {
      if (!partner_email || !partner_email.includes('@')) {
        return Response.json({ error: 'Valid partner email required' }, { status: 400 });
      }
      if (partner_email.toLowerCase() === user.email?.toLowerCase()) {
        return Response.json({ error: 'You cannot link to your own email' }, { status: 400 });
      }

      // Look up partner by indexed email filter — never list() the full user table
      let partnerUser = null;
      try {
        const matches = await base44.asServiceRole.entities.User.filter({ email: partner_email.toLowerCase() });
        partnerUser = matches[0] || null;
      } catch (e) {
        console.log('User search failed, treating as new user:', e.message);
      }

      // Update inviter's profile
      const myProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      if (myProfiles[0]) {
        await base44.entities.UserProfile.update(myProfiles[0].id, {
          profile_type: 'couple',
          paired_status: 'pending',
          partner_email: partner_email.toLowerCase(),
        });
      }

      if (partnerUser) {
        // Existing user — create a link request (partner gets notification in dashboard)
        // Check for existing pending link
        const existing = await base44.entities.PartnerLink.filter({
          from_user_id: user.id,
          to_email: partner_email.toLowerCase(),
          status: 'pending',
        });
        if (existing.length === 0) {
          await base44.entities.PartnerLink.create({
            from_user_id: user.id,
            from_email: user.email,
            from_display_name: from_display_name || user.full_name,
            to_email: partner_email.toLowerCase(),
            to_user_id: partnerUser.id,
            status: 'pending',
            link_type: 'link_request',
          });
        }

        // Also set partner's profile to pending if they have one
        const partnerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: partnerUser.id });
        if (partnerProfiles[0]) {
          await base44.asServiceRole.entities.UserProfile.update(partnerProfiles[0].id, {
            paired_status: 'pending',
            partner_email: user.email?.toLowerCase(),
            partner_user_id: user.id,
          });
        }

        return Response.json({
          success: true,
          link_type: 'link_request',
          message: 'Link request sent to existing user. They will see it in their dashboard.',
        });
      } else {
        // New user — send invite email
        const existing = await base44.entities.PartnerLink.filter({
          from_user_id: user.id,
          to_email: partner_email.toLowerCase(),
          status: 'pending',
        });
        if (existing.length === 0) {
          await base44.entities.PartnerLink.create({
            from_user_id: user.id,
            from_email: user.email,
            from_display_name: from_display_name || user.full_name,
            to_email: partner_email.toLowerCase(),
            status: 'pending',
            link_type: 'invite',
          });
        }

        // Send invite email (may be blocked for external addresses — catch gracefully)
        const inviteBody = `
          <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #7B2FBE; font-family: Playfair Display, serif;">You're Invited to Nina Purple</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              ${from_display_name || user.full_name} has invited you to join them on Nina Purple as a couple.
            </p>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              Nina Purple is a conscious dating and community platform. Your partner has created a couple profile
              and would like you to join so you can explore the Nina Purple Experience together.
            </p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="https://www.ninapurple.love/onboarding" style="background: #F5A800; color: #0B0510; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">
                Create Your Account
              </a>
            </p>
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2026 Nina Purple
            </p>
          </div>
        `;
        try {
          await base44.integrations.Core.SendEmail({
            to: partner_email,
            subject: `${from_display_name || user.full_name} invited you to Nina Purple`,
            body: inviteBody,
          });
        } catch (emailErr) {
          console.log('Invite email could not be sent (external address blocked):', emailErr.message);
        }

        return Response.json({
          success: true,
          link_type: 'invite',
          message: 'Partner invite created. Share the Nina Purple onboarding link with your partner so they can create their account and link with you.',
        });
      }
    }

    if (action === 'accept') {
      const { link_id } = body;
      const links = await base44.entities.PartnerLink.filter({ id: link_id });
      const link = links[0];
      if (!link) return Response.json({ error: 'Link not found' }, { status: 404 });
      if (link.to_user_id !== user.id) return Response.json({ error: 'Not authorized' }, { status: 403 });

      // Update link status
      await base44.entities.PartnerLink.update(link.id, { status: 'accepted', consent_to_given: true });

      // Set both profiles to paired
      const myProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      if (myProfiles[0]) {
        await base44.entities.UserProfile.update(myProfiles[0].id, {
          paired_status: 'paired',
          profile_type: 'couple',
          partner_user_id: link.from_user_id,
          partner_email: link.from_email?.toLowerCase(),
        });
      }

      const partnerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: link.from_user_id });
      if (partnerProfiles[0]) {
        await base44.asServiceRole.entities.UserProfile.update(partnerProfiles[0].id, {
          paired_status: 'paired',
          partner_user_id: user.id,
        });
      }

      return Response.json({ success: true, message: 'Partner link accepted. Both profiles are now paired.' });
    }

    if (action === 'decline') {
      const { link_id } = body;
      const links = await base44.entities.PartnerLink.filter({ id: link_id });
      const link = links[0];
      if (!link) return Response.json({ error: 'Link not found' }, { status: 404 });
      if (link.to_user_id !== user.id) return Response.json({ error: 'Not authorized' }, { status: 403 });

      await base44.entities.PartnerLink.update(link.id, { status: 'declined' });

      // Reset inviter's profile to single
      const partnerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: link.from_user_id });
      if (partnerProfiles[0]) {
        await base44.asServiceRole.entities.UserProfile.update(partnerProfiles[0].id, {
          paired_status: 'single',
          partner_email: null,
          partner_user_id: null,
          profile_type: 'individual',
        });
      }

      return Response.json({ success: true, message: 'Partner link declined.' });
    }

    if (action === 'consent') {
      const { link_id } = body;
      const links = await base44.entities.PartnerLink.filter({ id: link_id });
      const link = links[0];
      if (!link) return Response.json({ error: 'Link not found' }, { status: 404 });

      // The person giving consent
      const isFrom = link.from_user_id === user.id;
      const isTo = link.to_user_id === user.id;
      if (!isFrom && !isTo) return Response.json({ error: 'Not authorized' }, { status: 403 });

      const update = isFrom ? { consent_from_given: true } : { consent_to_given: true };
      await base44.entities.PartnerLink.update(link.id, update);

      // Also mark on the user profile
      const myProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      if (myProfiles[0]) {
        await base44.entities.UserProfile.update(myProfiles[0].id, { couple_consent_given: true });
      }

      // Check if both have consented
      const updated = await base44.entities.PartnerLink.filter({ id: link_id });
      if (updated[0]?.consent_from_given && updated[0]?.consent_to_given) {
        // Finalize: set both to paired
        const myProf = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (myProf[0]) {
          await base44.entities.UserProfile.update(myProf[0].id, { paired_status: 'paired' });
        }
        const partnerId = isFrom ? link.to_user_id : link.from_user_id;
        const partnerProf = await base44.asServiceRole.entities.UserProfile.filter({ user_id: partnerId });
        if (partnerProf[0]) {
          await base44.asServiceRole.entities.UserProfile.update(partnerProf[0].id, { paired_status: 'paired' });
        }
      }

      return Response.json({ success: true, message: 'Consent recorded.' });
    }

    if (action === 'get_status') {
      // Get current user's link status and any pending incoming requests
      const myProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      const myProfile = myProfiles[0];

      const incomingLinks = await base44.entities.PartnerLink.filter({ to_user_id: user.id, status: 'pending' });
      const outgoingLinks = await base44.entities.PartnerLink.filter({ from_user_id: user.id, status: 'pending' });

      return Response.json({
        success: true,
        my_profile: myProfile,
        incoming_requests: incomingLinks,
        outgoing_requests: outgoingLinks,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('linkPartner error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});