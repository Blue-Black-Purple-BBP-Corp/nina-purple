import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Creates a UserProfile for the authenticated caller.
// Billing fields (subscription_tier, credit_balance) are forced server-side —
// the client cannot grant itself a paid tier or credits at signup.
const ALLOWED_FIELDS = new Set([
  'full_name', 'display_name', 'birthdate', 'city', 'country', 'phone',
  'sexual_orientation', 'gender_pronoun', 'relationship_status',
  'dating_archetype', 'bio', 'photos', 'photos_private',
  'show_in_listings', 'allow_messages_all', 'profile_completeness',
  'language', 'onboarding_complete', 'age_verified', 'guidelines_accepted',
  'profile_type', 'paired_status', 'partner_email',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Build profile data: user_id derived server-side, billing fields forced
    const profileData = { user_id: user.id, subscription_tier: 'solar', credit_balance: 0 };
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) profileData[key] = value;
    }

    if (!profileData.display_name) {
      return Response.json({ error: 'display_name is required' }, { status: 400 });
    }

    // Upsert: if a profile already exists (e.g. admin-migrated account), update it
    // with the onboarding data instead of rejecting. Billing fields are not
    // overwritten on update — only the ALLOWED_FIELDS from the request body.
    const existing = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    if (existing.length > 0) {
      const updateData = {};
      for (const [key, value] of Object.entries(body)) {
        if (ALLOWED_FIELDS.has(key)) updateData[key] = value;
      }
      const updated = await base44.asServiceRole.entities.UserProfile.update(existing[0].id, updateData);
      return Response.json({ success: true, profile: updated, updated: true });
    }

    const created = await base44.asServiceRole.entities.UserProfile.create(profileData);

    // ── Notify admins of the new registration ──
    // Fires only on a brand-new profile (not on updates of admin-migrated accounts).
    try {
      const escapeHtml = (str) => String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

      const displayName = created.full_name || created.display_name || 'Unknown';
      const city = created.city || 'Unknown';
      const phone = created.phone || 'Not provided';
      const tier = created.subscription_tier || 'solar';
      const lang = created.language || 'en';
      const archetype = created.dating_archetype || 'N/A';
      const createdDate = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' });

      const safeDisplayName = escapeHtml(displayName);
      const safeCity = escapeHtml(city);
      const safePhone = escapeHtml(phone);
      const safeArchetype = escapeHtml(archetype);
      const safeTier = escapeHtml(tier.charAt(0).toUpperCase() + tier.slice(1));
      const safeLang = escapeHtml(lang.toUpperCase());
      const safeProfileId = escapeHtml(user.id);

      const plainBody = [
        `Name: ${displayName}`,
        `City: ${city}`,
        `Phone: ${phone}`,
        `Archetype: ${archetype}`,
        `Plan: ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
        `Language: ${lang.toUpperCase()}`,
        `Joined: ${createdDate} (ET)`,
        `Profile ID: ${user.id}`,
      ].join('\n');

      await base44.asServiceRole.entities.AdminNotification.create({
        type: 'new_registration',
        title: `New Member: ${safeDisplayName}`,
        body: plainBody,
        related_user_id: user.id,
      });

      const emailBody = `
        <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7B2FBE; font-family: Playfair Display, serif; margin-bottom: 16px;">New Member Registration</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            A new member has just joined Nina Purple.
          </p>
          <div style="background: #F5F0FF; border: 1px solid rgba(123,47,190,0.2); border-radius: 12px; padding: 20px; font-size: 14px; color: #1A0A2E; line-height: 1.8;">
            <div><strong>Name:</strong> ${safeDisplayName}</div>
            <div><strong>City:</strong> ${safeCity}</div>
            <div><strong>Phone:</strong> ${safePhone}</div>
            <div><strong>Archetype:</strong> ${safeArchetype}</div>
            <div><strong>Plan:</strong> ${safeTier}</div>
            <div><strong>Language:</strong> ${safeLang}</div>
            <div><strong>Joined:</strong> ${createdDate} (ET)</div>
            <div><strong>Profile ID:</strong> ${safeProfileId}</div>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
            © 2026 Nina Purple
          </p>
        </div>
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'contact@NinaPurple.Love',
        subject: `New Member: ${safeDisplayName}`,
        body: emailBody,
      });
      console.info('Admin notification sent for new member:', displayName);
    } catch (notifyErr) {
      console.error('Admin notification failed:', notifyErr.message);
    }

    return Response.json({ success: true, profile: created });
  } catch (error) {
    console.error('createProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});