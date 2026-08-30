# Legacy Billing Deprecation Report

## Scope
This document records the deprecation status of the legacy subscription tiers
(`solar`, `lunar`, `stellar`, `galactic`) and the plan to retire them without
breaking existing subscribers. It is the audited migration reference required
before any billing-compatibility code is deleted.

## Decision (Phase 2)
Legacy tier billing compatibility is **preserved** for existing subscribers.
Old tiers are retired **only from member-facing display and tag rendering**.
No new subscriptions are created using retired plan IDs. Active legacy
price-ID mappings, webhook handling, renewals, cancellations, refunds,
entitlement calculation, and historical billing continuity remain intact.

## Current state

### `base44/shared/planLimits.ts`
- `LEGACY_TIERS = ['solar', 'lunar', 'stellar', 'galactic']` — explicit
  deprecation marker. Code that needs to test whether a tier is legacy should
  use this set.
- `PLAN_LIMITS` — still contains entries for all legacy tiers + the active
  `nina_membership` plan. Legacy entries are **not removed**; they drive
  entitlement calculation for existing subscribers.
- `hasActiveMembership()` — still treats `lunar`/`stellar`/`galactic` as active
  for legacy subscribers who have not migrated.
- `getBillingCycleStart()` — legacy tiers fall back to calendar-month start;
  `nina_membership` uses the individual `subscription_renewal_date`.

### `base44/functions/stripeWebhook/entry.ts`
- Legacy price-ID → tier mappings are preserved. The webhook continues to
  handle renewals, cancellations, and refunds for legacy subscribers.
- No new checkout sessions are created with legacy price IDs (see
  `createCheckout`).

### `src/lib/plans.js` / `src/lib/i18n.js` (member-facing)
- Member-facing plan display and tag rendering surface only the active
  `nina_membership` plan and the current pricing. Legacy tier names may still
  appear as read-only badges for existing subscribers (so they can see their
  current state), but no upsell or new-subscription path offers legacy tiers.

## What is NOT done in this phase
- No deletion of `PLAN_LIMITS` legacy entries.
- No deletion of legacy price-ID mappings in `stripeWebhook`.
- No forced migration of existing subscribers.
- No removal of `hasActiveMembership()` legacy-tier handling.

## Migration plan (to be executed separately, before deletion)
1. **Audit** — produce a report of all active legacy subscribers (by tier and
   price ID) from Stripe + the UserProfile store.
2. **Renewal migration** — at each legacy subscriber's next renewal, move them
   onto the `nina_membership` plan via a Stripe subscription update
   (subscription_schedules or proration). Record the migration in an audit log.
3. **Entitlement parity** — confirm `nina_membership` entitlements meet or
   exceed each legacy tier's entitlements so no member loses value.
4. **Sunset** — once zero active legacy subscriptions remain, archive the
   legacy price IDs in Stripe (`active=false`), remove the legacy
   `PLAN_LIMITS` entries, remove the legacy price-ID mappings from
   `stripeWebhook`, and simplify `hasActiveMembership()`.
5. **Audit trail** — every migration step is recorded in `AdminAuditLog` with
   before/after state and a correlation id.

## Deprecation markers
- `LEGACY_TIERS` export in `planLimits.ts` is the single source of truth for
  "is this tier legacy?". New code must not branch on individual legacy tier
  names; use `LEGACY_TIERS.includes(tier)`.
- Comments in `planLimits.ts` and `stripeWebhook` mark legacy blocks as
  deprecated and reference this document.