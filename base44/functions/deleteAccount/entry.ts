import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const feedback = body.feedback || '';

        // Store feedback before deleting
        if (feedback.trim()) {
            await base44.asServiceRole.entities.DeleteFeedback.create({
                user_id: user.id,
                reason: feedback.trim(),
            });
        }

        // Best-effort, logged deletion of all user-linked data.
        // Non-atomic by design (Base44 has no cross-entity transactions);
        // each failure is logged so orphans can be reconciled manually.
        const errors = [];

        const safeDelete = async (label, fn) => {
            try { await fn(); }
            catch (err) { errors.push(`${label}: ${err.message}`); console.error('[deleteAccount]', label, err.message); }
        };

        // Fetch all user-linked records
        const [profiles, answers, messages, connections, chatPosts, events] = await Promise.all([
            base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id }),
            base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: user.id }),
            base44.asServiceRole.entities.Message.filter({ $or: [{ from_user_id: user.id }, { to_user_id: user.id }] }),
            base44.asServiceRole.entities.Connection.filter({ $or: [{ from_user_id: user.id }, { to_user_id: user.id }] }),
            base44.asServiceRole.entities.ChatPost.filter({ author_id: user.id }),
            base44.asServiceRole.entities.Event.filter({ created_by_id: user.id }),
        ]);

        // Profile
        if (profiles.length) {
            await safeDelete('UserProfile', () => base44.asServiceRole.entities.UserProfile.delete(profiles[0].id));
        }
        // Matching answers
        if (answers.length) {
            await safeDelete('MatchingAnswers', () => base44.asServiceRole.entities.MatchingAnswers.delete(answers[0].id));
        }
        // Messages
        for (const msg of messages) {
            await safeDelete('Message', () => base44.asServiceRole.entities.Message.delete(msg.id));
        }
        // Connections
        for (const conn of connections) {
            await safeDelete('Connection', () => base44.asServiceRole.entities.Connection.delete(conn.id));
        }
        // Community posts (was previously missed)
        for (const post of chatPosts) {
            await safeDelete('ChatPost', () => base44.asServiceRole.entities.ChatPost.delete(post.id));
        }
        // Events created by the user (hosted events)
        for (const ev of events) {
            await safeDelete('Event', () => base44.asServiceRole.entities.Event.delete(ev.id));
        }

        // NOTE: The underlying User record and uploaded photos (storage) cannot be
        // removed via the Base44 entity SDK — User records are managed by the auth
        // system and photos live in object storage. These are handled out-of-band
        // by Base44 support on request (contact@NinaPurple.love).

        console.info('[deleteAccount] Completed for user:', user.id, 'errors:', errors.length);

        return Response.json({ success: true, partial_failures: errors });
    } catch (error) {
        console.error('[deleteAccount] Fatal:', error.message, error.stack);
        return Response.json({ error: error.message }, { status: 500 });
    }
});