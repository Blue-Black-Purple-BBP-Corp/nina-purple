import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Community chat posting + post retrieval with bidirectional block enforcement.
// Mirrors the block-check logic from sendMessage: a member cannot post in a
// room owned by someone who blocked them (or whom they blocked), and posts
// from blocked/blocked-by authors are filtered out of the feed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, room_id, content } = body;

    // ── get_posts: return room posts, filtered by block status ──
    if (action === 'get_posts') {
      if (!room_id) return Response.json({ error: 'room_id required' }, { status: 400 });

      const [posts, blocksByMe, blocksOfMe] = await Promise.all([
        base44.asServiceRole.entities.ChatPost.filter({ room_id }, '-created_date', 30),
        base44.asServiceRole.entities.BlockedUser.filter({ blocker_user_id: user.id }),
        base44.asServiceRole.entities.BlockedUser.filter({ blocked_user_id: user.id }),
      ]);

      const blockedAuthorIds = new Set([
        ...blocksByMe.map((b) => b.blocked_user_id),
        ...blocksOfMe.map((b) => b.blocker_user_id),
      ]);

      const filteredPosts = posts.filter((p) => !blockedAuthorIds.has(p.author_id));
      return Response.json({ success: true, posts: filteredPosts.reverse() });
    }

    // ── post: create a chat post with block enforcement ──
    if (action === 'post') {
      if (!content?.trim() || !room_id) {
        return Response.json({ error: 'content and room_id required' }, { status: 400 });
      }

      // Fetch room to check ownership for block enforcement
      const rooms = await base44.asServiceRole.entities.ChatRoom.filter({ id: room_id });
      const room = rooms[0];
      if (!room) return Response.json({ error: 'Room not found' }, { status: 404 });

      // Bidirectional block check against room owner (same logic as sendMessage)
      const roomOwnerId = room.created_by_id;
      if (roomOwnerId && roomOwnerId !== user.id) {
        const [blocksByMe, blocksOfMe] = await Promise.all([
          base44.asServiceRole.entities.BlockedUser.filter({ blocker_user_id: user.id, blocked_user_id: roomOwnerId }),
          base44.asServiceRole.entities.BlockedUser.filter({ blocker_user_id: roomOwnerId, blocked_user_id: user.id }),
        ]);
        if (blocksByMe.length > 0 || blocksOfMe.length > 0) {
          return Response.json({ error: 'You cannot post in this room.' }, { status: 403 });
        }
      }

      // Get user profile for display name
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
      const displayName = profiles[0]?.display_name || user.full_name || 'Member';

      // Create the post using the user client (not asServiceRole) so created_by_id
      // is set to the user's ID — required for client-side RLS on subsequent
      // updates (e.g. toggleLike in Community.jsx).
      const post = await base44.entities.ChatPost.create({
        room_id,
        author_id: user.id,
        author_name: displayName,
        content: content.trim(),
        likes_count: 0,
        comments_count: 0,
      });

      // Update room post count
      await base44.asServiceRole.entities.ChatRoom.update(room_id, {
        posts_count: (room.posts_count || 0) + 1,
      });

      return Response.json({ success: true, post });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('communityChat error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});