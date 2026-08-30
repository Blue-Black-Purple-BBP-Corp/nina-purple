import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { ulid } from '../../shared/bbpRules.ts';
import {
  verifyMemberStepUp,
  validateRequestedValue,
  getCurrentValue,
  maskValue,
  STEP_UP_REQUIRED_FIELDS,
} from '../../shared/profileChanges.ts';
import { writeStaffAuditLog } from '../../shared/staffAuth.ts';

// Member-facing: create a profile change request for email/full_name/phone/
// birthdate. Requires fresh step-up authentication. Phone requests are held in
// pending_verification_unavailable (no SMS/OTP provider wired yet). Email
// requests notify the existing email address (best-effort). Idempotent per
// field (one active request at a time). Neutral validation errors.
Deno.serve(async (req) => {
  const correlation_id = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { field_name, requested_value, auth_method, reauth_password, sso_reauth } = await req.json().catch(() => ({}));
    if (!field_name || !STEP_UP_REQUIRED_FIELDS.includes(field_name)) {
      return Response.json({ error: 'Invalid field' }, { status: 400 });
    }

    // Step-up required for all critical fields.
    const stepUp = await verifyMemberStepUp(base44, user, auth_method, reauth_password, sso_reauth);
    if (!stepUp.ok) return Response.json({ error: stepUp.error, code: 'step_up_failed' }, { status: stepUp.status });

    // Validate the requested value (neutral errors).
    const validationError = validateRequestedValue(field_name, requested_value);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });

    const current_value = await getCurrentValue(base44, user, field_name);

    // No-op if the requested value equals the current value.
    if (String(requested_value).trim() === String(current_value).trim()) {
      return Response.json({ error: 'The new value matches the current value.', code: 'no_change' }, { status: 400 });
    }

    // One active request per field at a time.
    const existing = await base44.asServiceRole.entities.ProfileChangeRequest.filter({
      native_user_id: user.id,
      field_name,
      status: { $in: ['pending_review', 'pending_verification_unavailable', 'under_review', 'approved'] },
    });
    if (existing.length > 0) {
      return Response.json({ error: 'A request for this field is already in progress.', code: 'duplicate_pending' }, { status: 409 });
    }

    // Phone: hold pending verification until an SMS/OTP provider is wired.
    const status = field_name === 'phone' ? 'pending_verification_unavailable' : 'pending_review';
    const now = new Date().toISOString();
    const request_id = ulid();

    await base44.asServiceRole.entities.ProfileChangeRequest.create({
      request_id,
      native_user_id: user.id,
      field_name,
      current_value,
      requested_value: String(requested_value).trim(),
      status,
      step_up_method: auth_method,
      step_up_verified_at: now,
      step_up_assurance: stepUp.assurance,
      requested_at: now,
      correlation_id,
    });

    await writeStaffAuditLog(base44, {
      actor_native_user_id: user.id,
      action_type: 'profile_change.requested',
      target_entity_type: 'ProfileChangeRequest',
      target_entity_id: request_id,
      reason_code: field_name,
      result: 'success',
      correlation_id,
      previous_state: { field_name, current: maskValue(field_name, current_value) },
      new_state: { field_name, requested: maskValue(field_name, String(requested_value).trim()), status },
    });

    // Best-effort: notify the existing email that a change was requested (email field only).
    if (field_name === 'email' && current_value) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: current_value,
          subject: 'Nina Purple — profile change request',
          body: 'A request was made to change the email address on your Nina Purple account. If this was you, no action is needed; the change requires staff review. If this was not you, please contact Nina Purple support immediately.',
        });
      } catch (e) {
        console.error('Change-request notification email failed:', e.message);
      }
    }

    return Response.json({ success: true, request_id, status });
  } catch (error) {
    console.error('[requestProfileChange] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});