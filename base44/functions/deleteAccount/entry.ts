import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete user's related data
        const [profiles, answers] = await Promise.all([
            base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id }),
            base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: user.id }),
        ]);

        const deletions = [];
        if (profiles.length) deletions.push(base44.asServiceRole.entities.UserProfile.delete(profiles[0].id));
        if (answers.length) deletions.push(base44.asServiceRole.entities.MatchingAnswers.delete(answers[0].id));

        // Delete messages
        const messages = await base44.asServiceRole.entities.Message.filter({
            $or: [{ from_user_id: user.id }, { to_user_id: user.id }]
        });
        for (const msg of messages) {
            deletions.push(base44.asServiceRole.entities.Message.delete(msg.id));
        }

        // Delete connections
        const connections = await base44.asServiceRole.entities.Connection.filter({
            $or: [{ from_user_id: user.id }, { to_user_id: user.id }]
        });
        for (const conn of connections) {
            deletions.push(base44.asServiceRole.entities.Connection.delete(conn.id));
        }

        await Promise.all(deletions);

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});