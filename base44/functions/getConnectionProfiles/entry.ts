import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Returns public-safe profile data for users the caller has a Connection with.
// Enforces: caller must be authenticated + a Connection must exist between caller and each requested user_id.
// Never returns PII: phone, birthdate, sexual_orientation, relationship_status are excluded.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_ids } = await req.json();
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return Response.json({ profiles: {} });
    }

    // Fetch all connections for this user (both directions)
    const [outgoing, incoming] = await Promise.all([
      base44.asServiceRole.entities.Connection.filter({ from_user_id: user.id }),
      base44.asServiceRole.entities.Connection.filter({ to_user_id: user.id }),
    ]);

    // Build a set of user_ids the caller is actually connected to, along with unlock state
    const connectionMap = {};
    for (const c of outgoing) {
      connectionMap[c.to_user_id] = { gallery_unlocked: c.gallery_unlocked || false, is_unlocked: c.is_unlocked || false };
    }
    for (const c of incoming) {
      connectionMap[c.from_user_id] = { gallery_unlocked: c.gallery_unlocked || false, is_unlocked: c.is_unlocked || false };
    }

    // Only fetch profiles that have a real connection to the caller
    const authorizedIds = user_ids.filter(id => connectionMap[id] !== undefined);

    // SEGREGATION: load the caller's profile so cross-mode profiles can be excluded
    const myProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const myMode = myProfiles[0]?.profile_type || 'individual';

    const profileMap = {};
    await Promise.all(authorizedIds.map(async (uid) => {
      const results = await base44.asServiceRole.entities.UserProfile.filter({ user_id: uid });
      const p = results[0];
      if (!p) return;

      // SEGREGATION: skip profiles whose experience mode differs from the caller's
      const theirMode = p.profile_type || 'individual';
      if (theirMode !== myMode) return;

      // Photo delivery is now entitlement-based via getPhotoAccess (signed
      // URLs). Here we only expose whether the owner has any active photos,
      // so the client can render a placeholder vs. a photo area. No raw photo
      // URLs are returned in any profile payload.
      let hasPhotos = false;
      try {
        const photoRecs = await base44.asServiceRole.entities.Photo.filter({ owner_native_user_id: uid });
        hasPhotos = photoRecs.some((ph) => ph.status === 'active');
      } catch (e) { /* non-fatal — default false */ }

      // Return only the public-safe subset — never phone, birthdate, sexual_orientation, relationship_status
      const connState = connectionMap[uid] || {};
      profileMap[uid] = {
        user_id: p.user_id,
        display_name: p.show_in_listings !== false ? p.display_name : null,
        age: p.age,
        city: p.city,
        country: p.country,
        dating_archetype: p.dating_archetype,
        bio: connState.is_unlocked ? p.bio : null,
        zodiac: p.zodiac,
        gender_pronoun: p.gender_pronoun,
        paired_status: p.paired_status,
        profile_type: p.profile_type,
        is_founding_member: p.is_founding_member === true,
        has_photos: hasPhotos,
      };
    }));

    return Response.json({ profiles: profileMap });
  } catch (error) {
    console.error('[getConnectionProfiles] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});