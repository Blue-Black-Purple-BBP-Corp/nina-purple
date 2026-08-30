import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { generateBbpMemberId } from '../../shared/bbpRules.ts';
import { processReferralSignup } from '../../shared/referral.ts';
import { sendAdminEmail } from '../../shared/adminEmail.ts';

// Creates a UserProfile for the authenticated caller.
// Billing fields (subscription_tier, credit_balance) are forced server-side —
// the client cannot grant itself a paid tier or credits at signup.
const ALLOWED_FIELDS = new Set([
  'full_name', 'display_name', 'birthdate', 'city', 'country', 'phone',
  'sexual_orientation', 'gender_pronoun', 'relationship_status',
  'dating_archetype', 'bio',
  'show_in_listings', 'allow_messages_all', 'profile_completeness',
  'language', 'onboarding_complete', 'age_verified', 'guidelines_accepted',
  'profile_type', 'paired_status', 'partner_email',
  'onboarding_status', 'onboarding_completed_at', 'onboarding_version', 'onboarding_step',
  'onboarding_current_step', 'onboarding_started_at', 'last_saved_at',
  'age_confirmation_status', 'age_confirmed_at',
  'membership_selection_status', 'membership_subscription_reference',
  'referred_by_code',
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

    // If marking onboarding as complete, validate all required fields server-side
    if (profileData.onboarding_status === 'complete') {
      const requiredFields = [
        !!profileData.display_name,
        !!profileData.city,
        !!profileData.birthdate,
        !!profileData.sexual_orientation,
        !!profileData.gender_pronoun,
        !!profileData.relationship_status,
        !!profileData.dating_archetype,
      ];
      // Photos are validated from the Photo entity (private storage), not the
      // legacy UserProfile.photos[] array.
      const photoRecs = await base44.asServiceRole.entities.Photo.filter({ owner_native_user_id: user.id });
      const photosCount = photoRecs.filter((p) => p.status === 'active').length;
      if (!requiredFields.every(f => f) || photosCount < 3) {
        return Response.json({ error: 'Required profile fields or photos missing for onboarding completion' }, { status: 400 });
      }
      // Check 21 compatibility questions
      const answers = await base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: user.id });
      const questionKeys = [
        'q11_core_values', 'q12_success', 'q13_conflict', 'q14_spirituality',
        'q15_personal_growth', 'q16_stress', 'q17_living_env', 'q18_family',
        'q19_work_life', 'q20_relationship_goal', 'q21_money', 'q22_gender_roles',
        'q23_leisure', 'q24_communication', 'q25_intellectual', 'q26_boundaries',
        'q27_change', 'q28_diversity', 'q29_activism', 'q30_emotional_intimacy',
        'q31_partner_growth',
      ];
      const answeredCount = questionKeys.filter(k => answers[0]?.[k]).length;
      if (answeredCount < 21) {
        return Response.json({ error: 'Not all compatibility questions answered' }, { status: 400 });
      }
      profileData.onboarding_completed_at = new Date().toISOString();
      profileData.onboarding_version = '1.0';
      profileData.onboarding_complete = true;
    } else if (profileData.onboarding_status === 'in_progress') {
      profileData.onboarding_complete = false;
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
      // Include server-computed completion fields not present in the request body
      if (profileData.onboarding_completed_at) updateData.onboarding_completed_at = profileData.onboarding_completed_at;
      if (profileData.onboarding_version) updateData.onboarding_version = profileData.onboarding_version;
      if ('onboarding_complete' in profileData) updateData.onboarding_complete = profileData.onboarding_complete;
      const updated = await base44.asServiceRole.entities.UserProfile.update(existing[0].id, updateData);

      // ── Referral signup reward (onboarding complete + referred_by_code present) ──
      // Idempotent: processReferralSignup skips if a Referral or ledger entry already exists.
      if (profileData.onboarding_status === 'complete') {
        const refCode = updated.referred_by_code || existing[0].referred_by_code || body.referred_by_code;
        if (refCode) {
          try { await processReferralSignup(base44, user.id, refCode); }
          catch (e) { console.error('Referral processing failed:', e.message); }
        }
      }

      return Response.json({ success: true, profile: updated, updated: true });
    }

    const created = await base44.asServiceRole.entities.UserProfile.create(profileData);

    // ── Assign signup sequence number and issue Special Code if eligible ──
    try {
      const allProfiles = await base44.asServiceRole.entities.UserProfile.list();
      const seqNum = allProfiles.length;
      await base44.asServiceRole.entities.UserProfile.update(created.id, { signup_sequence_number: seqNum });

      // Issue Special Code to first 200 users (fraud control: one per user)
      if (seqNum <= 200) {
        const existingCodes = await base44.asServiceRole.entities.SpecialCode.filter({ issued_to_user_id: user.id });
        if (existingCodes.length === 0) {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let code = '';
          for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
          await base44.asServiceRole.entities.SpecialCode.create({
            code,
            status: 'issued',
            issued_to_user_id: user.id,
            issued_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            feedback_status: 'pending',
          });
          console.info('[createProfile] Special code issued:', code, 'seq:', seqNum);
        }
      }
    } catch (codeErr) {
      console.error('[createProfile] Special code issuance failed:', codeErr.message);
    }

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

      const emailResult = await sendAdminEmail(`New Member: ${safeDisplayName}`, emailBody);
      if (!emailResult.success) {
        console.error('Admin email failed:', emailResult.error);
      } else {
        console.info('Admin notification sent for new member:', displayName);
      }
    } catch (notifyErr) {
      console.error('Admin notification failed:', notifyErr.message);
    }

    // ── Ensure MemberEngagementProfile + BBPWalletBalance exist ──
    // Generates the immutable bbp_member_id for this new member idempotently.
    try {
      const existingEngagement = await base44.asServiceRole.entities.MemberEngagementProfile.filter({ native_user_id: user.id });
      if (existingEngagement.length === 0) {
        const bbpMemberId = generateBbpMemberId();
        await base44.asServiceRole.entities.MemberEngagementProfile.create({
          bbp_member_id: bbpMemberId,
          native_user_id: user.id,
          onboarding_state: 'getting_started',
          community_standing_state: 'getting_started',
          language_preference: profileData.language || 'en',
          account_confirmed: false,
        });
        await base44.asServiceRole.entities.BBPWalletBalance.create({
          bbp_member_id: bbpMemberId,
          native_user_id: user.id,
          available_points: 0,
          pending_points: 0,
          lifetime_earned: 0,
          lifetime_redeemed: 0,
        });
      }
    } catch (engErr) {
      console.error('Engagement profile creation failed:', engErr.message);
    }

    // ── Referral signup reward (onboarding complete + referred_by_code present) ──
    // Idempotent: processReferralSignup skips if a Referral or ledger entry already exists.
    if (profileData.onboarding_status === 'complete' && created.referred_by_code) {
      try { await processReferralSignup(base44, user.id, created.referred_by_code); }
      catch (e) { console.error('Referral processing failed:', e.message); }
    }

    return Response.json({ success: true, profile: created });
  } catch (error) {
    console.error('createProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});