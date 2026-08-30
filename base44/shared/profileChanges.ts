// Profile change request engine — shared logic for the request → review →
// completion state machine covering email, full_name, phone, and birthdate.
//
// email:     request → staff-assisted → platform-support updates the auth email
//            (Base44 does not expose email mutation to app code). The app never
//            auto-verifies or directly mutates the active email.
// full_name: request → staff approval → staff applies the change to UserProfile.
// phone:     request → pending_verification_unavailable (no SMS/OTP provider
//            wired yet). The active phone and phone_verified are NOT altered.
// birthdate: request → staff review → staff applies the change.
//
// All requests require a fresh step-up authentication. All request/review/
// completion events are written to the append-only AdminAuditLog. Sensitive
// values (email, phone) are masked in audit views.

import { getAuthMethods } from './staffAuth.ts';

export const CRITICAL_FIELDS = ['email', 'full_name', 'phone', 'birthdate'] as const;

// All critical fields require step-up auth to request.
export const STEP_UP_REQUIRED_FIELDS = ['email', 'full_name', 'phone', 'birthdate'];

// Mask a sensitive value for audit/log views. Email and phone are masked;
// full_name and birthdate are returned as-is (staff need the real value to
// review, and they are less sensitive than contact identifiers).
export function maskValue(field: string, value: string): string {
  if (!value) return '';
  if (field === 'email') {
    const [local, domain] = String(value).split('@');
    if (!domain) return '••••';
    const maskedLocal = local.length <= 2
      ? '••'
      : local.slice(0, 2) + '•'.repeat(Math.max(2, local.length - 2));
    return `${maskedLocal}@${domain}`;
  }
  if (field === 'phone') {
    const s = String(value).replace(/\s/g, '');
    if (s.length <= 4) return '••••';
    return '•'.repeat(s.length - 4) + s.slice(-4);
  }
  return String(value);
}

// Verify a member's step-up authentication for a profile change request.
// Mirrors the activatePrivilegedSession step-up pattern: password is verified
// server-side via loginViaEmailPassword; SSO is platform-mediated (best-effort
// via self-declared auth_methods). Returns { ok, assurance } or { error }.
export async function verifyMemberStepUp(
  base44: any,
  user: any,
  auth_method: string,
  reauth_password: string,
  sso_reauth: boolean
): Promise<{ ok: boolean; assurance?: string; error?: string; status?: number }> {
  const VALID_METHODS = ['password', 'google', 'microsoft', 'apple'];
  if (!auth_method || !VALID_METHODS.includes(auth_method)) {
    return { ok: false, error: 'auth_method is required (password|google|microsoft|apple)', status: 400 };
  }
  const isPassword = auth_method === 'password';
  if (isPassword) {
    if (!reauth_password || !String(reauth_password).trim()) {
      return { ok: false, error: 'Re-authentication password is required', status: 400 };
    }
    try {
      await base44.auth.loginViaEmailPassword(user.email, String(reauth_password));
    } catch (e) {
      return { ok: false, error: 'Re-authentication failed. Please re-enter your password.', status: 401 };
    }
    return { ok: true, assurance: 'password_reauth' };
  }
  // SSO
  if (!sso_reauth) {
    return { ok: false, error: 'sso_reauth is required for provider step-up', status: 400 };
  }
  const linked = await getAuthMethods(base44, user.id);
  if (linked.length > 0 && !linked.includes(auth_method)) {
    return { ok: false, error: 'That sign-in method is not linked to your account.', status: 403 };
  }
  return { ok: true, assurance: 'platform_sso_reauth' };
}

// Basic format validation. Uses neutral errors that don't reveal whether a
// value is already in use (anti-enumeration).
export function validateRequestedValue(field: string, value: string): string | null {
  const v = String(value || '').trim();
  if (!v) return 'A value is required.';
  if (field === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address.';
    if (v.length > 254) return 'Email is too long.';
    return null;
  }
  if (field === 'phone') {
    if (!/^[+\d][\d\s\-()]{6,20}$/.test(v)) return 'Please enter a valid phone number.';
    return null;
  }
  if (field === 'full_name') {
    if (v.length < 2) return 'Name is too short.';
    if (v.length > 100) return 'Name is too long.';
    return null;
  }
  if (field === 'birthdate') {
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'Please enter a valid date of birth.';
    if (d > new Date()) return 'Date of birth cannot be in the future.';
    return null;
  }
  return null;
}

// Resolve the current active value for a field.
export async function getCurrentValue(base44: any, user: any, field: string): Promise<string> {
  if (field === 'email') return user.email || '';
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
  const p = profiles[0];
  if (!p) return '';
  if (field === 'full_name') return p.full_name || '';
  if (field === 'phone') return p.phone || '';
  if (field === 'birthdate') return p.birthdate || '';
  return '';
}