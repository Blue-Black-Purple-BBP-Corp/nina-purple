# Nina Purple

Nina Purple is a relationship and community platform built for singles and couples, combining matchmaker-assisted compatibility matching, consent-based photo sharing, real-world events, community chat, and a member loyalty program (BBP Rewards). The app is built on **React + Vite** on the frontend and **Base44** (a managed low-code backend platform) for data, authentication, and serverless business logic.

> This README reflects the current state of the codebase as of commit `ff68a85` (2026-09-10). It is intended to give any engineer, contributor, or reviewer an accurate map of what exists in this repository before making changes. It replaces the previous README, which did not reflect the current architecture.

---

## What This Repository Contains

This is a **single repository** covering both the client application and the backend. There is no separate backend service repo — the backend is Base44-managed code committed directly under `/base44`.

| Layer | Where | What |
|---|---|---|
| Frontend | `src/` | React SPA (Vite build), Tailwind CSS + shadcn/ui component library |
| Backend data model | `base44/entities/` | 44 entity schemas (`.jsonc`) — the equivalent of database tables/collections |
| Backend API | `base44/functions/` | 76 serverless functions (`entry.ts`) — the equivalent of API endpoints/controllers |
| Shared backend logic | `base44/shared/` | Reusable modules (auth, scoring, plan limits, referral rules, etc.) |
| Scheduled jobs | `base44/workflows/` | Automated jobs (expirations, monthly conversions, notifications) |
| Static assets | `public/` | Images and audio used by the app |

---

## Tech Stack

- **Frontend framework:** React (JSX), built and served via **Vite** (`vite.config.js`)
- **Styling:** Tailwind CSS (`tailwind.config.js`, `postcss.config.js`) with the **shadcn/ui** component system on top of Radix UI primitives (`src/components/ui/`)
- **Backend/BaaS:** [Base44](https://base44.com) — provides the database, auth, RLS-style access rules, and function hosting. The frontend talks to it through `src/api/base44Client.js`.
- **Payments:** Stripe (checkout + webhook handling — see `base44/functions/createCheckout`, `base44/functions/stripeWebhook`)
- **Location services:** Google Places API (`base44/functions/placesAutocomplete`, `src/components/LocationAutocomplete.jsx`)
- **Linting:** ESLint (`eslint.config.js`)

Deployment is managed through Base44's own publish pipeline — commits are largely authored by the `base44-builder[bot]` GitHub App, which syncs changes made in the Base44 builder back into this repository.

---

## Project Structure

```
nina-purple/
├── base44/                    # Backend (Base44-managed)
│   ├── config.jsonc
│   ├── entities/              # 44 data model schemas (User, UserProfile, Connection,
│   │                          #   PartnerLink, Photo, PhotoRevealRequest, Event,
│   │                          #   BBPPointsLedger, ModerationItem, VerificationRequest, ...)
│   ├── functions/              # 76 serverless functions, one folder per function
│   │                          #   (createProfile, linkPartner, generateMatches,
│   │                          #   createCheckout, stripeWebhook, awardPoints, ...)
│   ├── shared/                # Shared TS modules (staffAuth, compatibilityScoring,
│   │                          #   bbpRules, planLimits, referral, ...)
│   └── workflows/              # Scheduled jobs (expire points/codes/photo-reveal
│                                #   requests, monthly BBP conversion, admin notifications)
├── src/
│   ├── api/
│   │   └── base44Client.js    # Base44 SDK initialization
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives (button, dialog, form, etc.)
│   │   ├── admin/               # Admin console components (moderation, verification,
│   │                            #   matchmaker panel, audit log)
│   │   ├── bbp/                 # BBP Rewards components
│   │   ├── cards/                # Discovery card UI
│   │   ├── dashboard/            # Member dashboard widgets
│   │   ├── onboarding/           # Onboarding-specific components
│   │   ├── photos/               # Photo reveal request UI
│   │   ├── profile/              # Profile editing/preview components
│   │   └── *.jsx                 # Layouts, route guards, icons, modals
│   ├── hooks/                   # usePhotoAccess, usePlanLimits, use-mobile
│   ├── lib/                      # Contexts (Auth, Language, Theme, StaffSession),
│   │                             #   i18n, compatibility quiz, plans, utils
│   ├── pages/                    # One file per route/screen (28 pages)
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   ├── audio/
│   └── images/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── components.json             # shadcn/ui config
├── package.json
└── LEGACY_BILLING_DEPRECATION.md   # Notes on the retired multi-tier billing model
```

---

## Core Product Areas

- **Onboarding & Profiles** — Multi-step onboarding (`src/pages/Onboarding.jsx`) branching into individual or couple paths (`CoupleSegmentation.jsx`), capturing profile data, compatibility answers, and photos.
- **Membership** — Stripe-based paid membership with a founding-member program (first cohort gets free months) tracked through the `FoundingMemberBenefit` entity and related functions.
- **Matching** — Compatibility scoring (`base44/shared/compatibilityScoring.ts`) combined with a matchmaker-review layer (`getMatchmakerAnalysis`, admin `MatchmakerPanel.jsx`) and a mutual opt-in `Connection` model — not a purely automated swipe algorithm.
- **Couples** — A separate `PartnerLink` mechanism allows two individual accounts to link as a couple (`linkPartner` function, `CoupleComparison.jsx`).
- **Private Photos & Consent** — Photos are private by default; viewing them requires an explicit request/response cycle (`requestPhotoReveal` → `respondPhotoReveal` → `revealPhotos`), with access logged (`PhotoAccessAudit`) and requests auto-expiring.
- **Trust & Safety** — Profile/identity verification reviewed by staff (`VerificationRequest`, `reviewVerification`), plus a general moderation queue (`ModerationItem`, `SafetyReviewCase`).
- **Events & Experiences** — Real-world meetup discovery and attendance confirmation (`Event`, `EventAttendance`, `MeetupConfirmation`).
- **Community Chat** — Group conversation space (`ChatRoom`, `ChatPost`) distinct from one-to-one messaging.
- **BBP Rewards** — A points/wallet loyalty program (`BBPPointsLedger`, `BBPWalletBalance`, `RedemptionCatalog`) tied to referrals, event attendance, and membership.
- **Admin Console** — Staff dashboard with role-based, session-elevated access (`PrivilegedSession`, `StaffSessionContext.jsx`) for moderation, verification review, rewards administration, and audit logging.
- **Localization** — English/French toggle via `src/lib/i18n.js` and `LanguageContext.jsx`.

---

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```

> **Note:** Confirm the exact script names in `package.json` before relying on the commands above — they follow standard Vite conventions but have not been individually verified against this repository's `package.json`.

### Environment Configuration

This project depends on a Base44 project connection and at least the following external services. Confirm required environment variables directly in the Base44 project settings and `src/api/base44Client.js` before running locally:

- **Base44** — project/app credentials (backend, auth, database)
- **Stripe** — API keys for checkout and webhook signature verification
- **Google Places API** — key for location autocomplete

Do not commit API keys or secrets to this repository.

---

## Contributing

- Most day-to-day changes are made through the Base44 builder and synced to this repository automatically (commits from `base44-builder[bot]`); direct commits from contributors should stay consistent with that generated structure (e.g., one function per folder under `base44/functions/`, one schema per entity under `base44/entities/`).
- Run `npm run lint` (or the equivalent script defined in `package.json`) before committing frontend changes.
- Avoid introducing new top-level dependencies without checking `package.json` for existing equivalents (the project already uses Tailwind, shadcn/ui/Radix, and Base44's SDK — prefer those over new UI or data libraries).
- Keep loose media/test assets out of the repository root — place static files under `public/` or `src/assets/`.

---

## Status

Nina Purple is in **pre-beta / MVP preparation**. Known open items — including verification of founding-member allocation safety, user-blocking functionality, and event registration flows — are tracked outside this README in the project's audit and launch-planning documentation. See the team's internal MVP audit and launch plan documents for the current beta-readiness assessment before assuming any feature described above is fully verified end-to-end.
