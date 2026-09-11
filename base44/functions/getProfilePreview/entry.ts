import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getActiveOwnerPhotos } from '../../shared/photoAccess.ts';

// Safe self-preview: returns the caller's own profile projected exactly as an
// ordinary non-entitled member would see it. Used by the "Preview profile"
// feature so a member can see how they appear to others without exposing
// owner-only data.
//
// SECURITY:
//   - Only the profile owner can call this for their own user_id. A request
//     for any other user_id is rejected (no enumeration).
//   - Never returns wallet, subscription internals, credit balance, staff
//     role, moderation flags, draft fields, analytics, or private photo URLs.
//   - Photos are shown in the locked state (standard non-entitled viewer):
//     has_photos + count, but no signed URLs. The owner's real images are NOT
//     delivered in preview.
//   - bio is returned (visible to all members, not paywalled).
//   - viewer_context = 'standard_member_preview'.
//   - Creates no payment, entitlement, connection, view-analytics, message,
//     notification, or wallet side effect.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const target_user_id = body.user_id || user.id;

    // Only the owner may preview their own profile.
    if (target_user_id !== user.id) {
      return Response.json({ error: 'You can only preview your own profile.' }, { status: 403 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    // Count active photos for the locked placeholder. No signed URLs.
    let photoCount = 0;
    try {
      const photos = await getActiveOwnerPhotos(base44, user.id);
      photoCount = photos.length;
    } catch (e) {
      console.warn('[getProfilePreview] photo count failed:', e?.message || e);
    }

    // Count peer vouches (public indicator — no voucher identities exposed).
    let vouchCount = 0;
    try {
      const vouches = await base44.asServiceRole.entities.PeerVouch.filter({
        vouched_for_user_id: user.id,
      });
      vouchCount = vouches.length;
    } catch (e) {
      console.warn('[getProfilePreview] vouch count failed:', e?.message || e);
    }

    const preview = {
      user_id: profile.user_id,
      display_name: profile.show_in_listings !== false ? profile.display_name : null,
      age: profile.age,
      city: profile.city,
      country: profile.country,
      dating_archetype: profile.dating_archetype,
      zodiac: profile.zodiac,
      gender_pronoun: profile.gender_pronoun,
      bio: profile.bio || null, // visible to all members (not paywalled)
      paired_status: profile.paired_status,
      profile_type: profile.profile_type,
      is_founding_member: profile.is_founding_member === true,
      has_photos: photoCount > 0,
      photo_count: photoCount,
      photos_locked: true, // standard non-entitled viewer sees locked photos
      vouch_count: vouchCount,
      viewer_context: 'standard_member_preview',
    };

    return Response.json({ success: true, data: preview });
  } catch (error) {
    console.error('[getProfilePreview] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});