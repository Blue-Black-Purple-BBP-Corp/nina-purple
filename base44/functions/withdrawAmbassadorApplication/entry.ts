import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Lets a member withdraw their own pending/under-review ambassador application.
// Runs as service role because the AmbassadorApplication RLS update rule is
// admin-only — withdrawal is the one user-initiated status change, handled
// here so the RLS policy stays locked down for all other transitions.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { application_id } = body;
    if (!application_id) return Response.json({ error: 'application_id required' }, { status: 400 });

    const apps = await base44.asServiceRole.entities.AmbassadorApplication.filter({ id: application_id });
    if (!apps.length) return Response.json({ error: 'Application not found' }, { status: 404 });
    const app = apps[0];

    // Ownership check — can only withdraw your own application
    if (app.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can only withdraw from active states, not after approval/rejection
    const withdrawable = ['pending', 'under_review', 'interview_scheduled'];
    if (!withdrawable.includes(app.status)) {
      return Response.json({ error: 'Cannot withdraw an application that is already ' + app.status }, { status: 400 });
    }

    await base44.asServiceRole.entities.AmbassadorApplication.update(application_id, { status: 'withdrawn' });

    console.info('Ambassador application withdrawn:', application_id);
    return Response.json({ success: true });
  } catch (err) {
    console.error('withdrawAmbassadorApplication error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});