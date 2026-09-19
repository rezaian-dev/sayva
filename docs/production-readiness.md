# SAYVA Production Readiness

**Audit date:** 2026-09-19  
**Scope:** Final planned Phase 9 Admin + Production Audit  
**Overall score:** intentionally not assigned. Readiness is classified per area.

## Repository validation

| Area | Status | Evidence / boundary |
|---|---|---|
| TypeScript | READY | `npx tsc --noEmit` passed. |
| Lint | READY | `npm run lint` passed with no warnings/errors. |
| Production build | READY WITH LIMITATIONS | `NEXT_TELEMETRY_DISABLED=1 npm run build` passed and produced the Next 16.3.5 build. |
| `next start` | READY WITH LIMITATIONS | `npm run start` was run against that build with explicit local audit variables; `/en` returned 200, `/robots.txt` returned 200, and guest `/en/admin` redirected to sign-in. This was not a deployed production environment. |
| Existing automated tests | READY WITH LIMITATIONS | Practice 6/6, domains 3/3, speaking 5/5, progress 5/5 passed. These are deterministic tests, not end-to-end production tests. |
| Admin route authorization | READY WITH LIMITATIONS | Server `requireAdmin` protects pages and `getAdminAccess` independently protects mutations; authenticated admin CRUD against MongoDB was not exercised. |
| AI runtime | NOT READY | No approved provider or credentials are configured; provider state remains `NOT CONFIGURED`. |
| MongoDB runtime | NOT VALIDATED | **The execution environment cannot access the user's local MongoDB instance at localhost:27017.** |
| Browser/microphone | NOT VALIDATED | No real authenticated browser, microphone, or MediaRecorder session was available. |
| Lighthouse/Core Web Vitals | NOT VALIDATED | No Lighthouse runner or real production URL was available. |

## Required deployment controls

Before a public deployment, configure a strong unique `BETTER_AUTH_SECRET`, the canonical `BETTER_AUTH_URL`/`NEXT_PUBLIC_SITE_URL`, and a least-privilege authenticated `MONGODB_URI`. Bootstrap the first administrator through the official Better Auth Admin mechanism, then verify the role from a server session. Do not use a browser-supplied role or user id.

The deployment must provide HTTPS termination, a correctly forwarded host/protocol, a reverse proxy with request/body/time limits, and operational rate limiting. Rate-limit authentication attempts, audio uploads/processing, future AI calls, and Admin mutations at the edge or server boundary. Configure backups, restore drills, MongoDB access control, TLS, restricted network exposure, monitoring, and alerting outside this repository.

## Implemented repository controls

- Better Auth is the sole identity/session authority; only `learner` and `admin` roles are used.
- Admin pages and mutations authenticate and authorize independently.
- Content and curriculum mutations validate again on the server and revalidate after persistence.
- Draft/published/archived semantics are preserved; publishing has stronger checks; archive is preferred over delete.
- Admin reads are bounded, explicitly sorted, and filterable without introducing search infrastructure.
- Public learner reads remain published-only and user-specific data reads derive ownership from the server session.
- Raw speaking audio is temporary and is not persisted; the audio handler checks auth, ownership, state, content type, and bounded size.
- AI provider is isolated behind a server-only boundary and fails closed while unconfigured.
- `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` are configured. No CSP or HSTS is claimed as configured; they require deployment-specific review.
- Production runtime fails closed when the auth secret, site/auth origin, or MongoDB URI is absent. Local development fallback values are not production credentials.

## Not claimed

This document does not claim formal WCAG compliance, browser compatibility, authenticated CRUD success, MongoDB availability, AI output quality, microphone behavior, rate-limit effectiveness, HTTPS/TLS correctness, backup recoverability, production load capacity, deployment success, or Lighthouse scores. Those are release-gate checks for the real deployment environment, not facts that can be inferred from repository inspection.
