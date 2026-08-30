import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Returns the stored Connection Brief for a conversation, if one exists.
// RLS on ConnectionBrief restricts reads to user_a_id / user_b_id / admin.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { connection_id } = await req.json();
    if (!connection_id) return Response.json({ error: 'connection_id required' }, { status: 400 });

    const briefs = await base44.entities.ConnectionBrief.filter({ connection_id });
    return Response.json({ brief: briefs[0] || null });
  } catch (error) {
    console.error('getConnectionBrief error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});