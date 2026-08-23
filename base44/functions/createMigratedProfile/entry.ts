import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only: provisions a user account from a migration record.
// 1. Invites the user (platform sends the password-setup email).
// 2. Creates an incomplete UserProfile pre-filled with the migration data.
// 3. Sends a branded confirmation email (best-effort).
// 4. Logs an AdminNotification.
// The invited user sets their password, logs in, and is redirected by the
// onboarding gate to complete their profile (onboarding_complete stays false).

const ALLOWED_FIELDS = new Set([
  'full_name', 'display_name', 'birthdate', 'city', 'country', 'phone',
  'sexual_orientation', 'gender_pronoun', 'relationship_status',
  'dating_archetype', 'bio', 'language', 'profile_type',
]);

const escapeHtml = (str) => String(str ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (admin.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { email, ...profileFields } = body;

    if (!email || !profileFields.display_name) {
      return Response.json({ error: 'email and display_name are required' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Look up whether a user already exists for this email
    let existingUsers = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
    let migratedUserId = existingUsers[0]?.id;
    const userAlreadyExisted = !!migratedUserId;

    if (!migratedUserId) {
      // Invite the user — provisions the auth account and sends the platform's
      // password-setup email (the "confirmation email that brings them to set up a password").
      try {
        await base44.users.inviteUser(normalizedEmail, 'user');
      } catch (inviteErr) {
        if (!/already|exists/i.test(String(inviteErr.message || ''))) {
          throw inviteErr;
        }
      }
      existingUsers = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
      migratedUserId = existingUsers[0]?.id;
    }

    if (!migratedUserId) {
      return Response.json({ error: 'Failed to provision user account' }, { status: 500 });
    }

    // Prevent duplicate profile creation
    const existingProfile = await base44.asServiceRole.entities.UserProfile.filter({ user_id: migratedUserId });
    if (existingProfile.length > 0) {
      return Response.json({ error: 'A profile already exists for this user' }, { status: 409 });
    }

    // Build profile data — billing fields forced server-side
    const profileData = {
      user_id: migratedUserId,
      subscription_tier: 'solar',
      credit_balance: 0,
      onboarding_complete: false,
      age_verified: false,
      guidelines_accepted: false,
    };
    for (const [key, value] of Object.entries(profileFields)) {
      if (ALLOWED_FIELDS.has(key)) profileData[key] = value;
    }
    if (!profileData.language) profileData.language = 'en';
    if (!profileData.profile_type) profileData.profile_type = 'individual';

    const created = await base44.asServiceRole.entities.UserProfile.create(profileData);

    // Best-effort branded confirmation email (the platform invite email carries the setup link)
    const lang = profileData.language === 'fr' ? 'fr' : 'en';
    const safeName = escapeHtml(profileData.display_name);
    const origin = new URL(req.url).origin;
    const loginUrl = `${origin}/login`;
    const emailBody = lang === 'fr'
      ? `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2 style="color:#7B2FBE;font-family:Playfair Display,serif;margin-bottom:16px;">Bienvenue sur Nina Purple, ${safeName}</h2>
          <p style="color:#333;font-size:15px;line-height:1.6;margin-bottom:16px;">Votre compte a été migré vers Nina Purple par notre équipe. Un courriel séparé contenant votre lien de configuration du mot de passe vous a été envoyé. Vérifiez votre boîte de réception (et vos courriers indésirables).</p>
          <p style="color:#333;font-size:15px;line-height:1.6;margin-bottom:16px;">Une fois votre mot de passe défini, <a href="${loginUrl}" style="color:#7B2FBE;">connectez-vous</a> pour compléter votre profil et commencer votre parcours.</p>
          <p style="color:#999;font-size:12px;margin-top:24px;">© 2026 Nina Purple</p>
        </div>`
      : `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2 style="color:#7B2FBE;font-family:Playfair Display,serif;margin-bottom:16px;">Welcome to Nina Purple, ${safeName}</h2>
          <p style="color:#333;font-size:15px;line-height:1.6;margin-bottom:16px;">Your account has been migrated to Nina Purple by our team. A separate email with your password setup link has been sent to you. Check your inbox (and spam folder).</p>
          <p style="color:#333;font-size:15px;line-height:1.6;margin-bottom:16px;">Once you have set your password, <a href="${loginUrl}" style="color:#7B2FBE;">log in</a> to complete your profile and begin your journey.</p>
          <p style="color:#999;font-size:12px;margin-top:24px;">© 2026 Nina Purple</p>
        </div>`;

    try {
      await base44.integrations.Core.SendEmail({
        to: normalizedEmail,
        subject: lang === 'fr' ? 'Bienvenue sur Nina Purple — Configurez votre compte' : 'Welcome to Nina Purple — Set up your account',
        body: emailBody,
      });
    } catch (emailErr) {
      console.error('Migration confirmation email failed:', emailErr.message);
    }

    // Admin notification
    await base44.asServiceRole.entities.AdminNotification.create({
      type: 'system',
      title: `Migrated profile: ${profileData.display_name} (${normalizedEmail})`,
      body: `Admin ${admin.email || admin.id} migrated an account${userAlreadyExisted ? ' (user already existed)' : ''}. User must set up password and complete onboarding.`,
      related_user_id: migratedUserId,
    });

    console.info('Migrated profile created for:', normalizedEmail);
    return Response.json({ success: true, profile: created, userAlreadyExisted });
  } catch (error) {
    console.error('createMigratedProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}