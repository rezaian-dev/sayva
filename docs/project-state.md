# SAYVA Project State

**Snapshot date:** 2026-09-19  
**Current phase:** Phase 9 — Admin + Production Audit (final planned implementation phase)  
**Phase status:** Admin application, server-side role authorization, explicit content/curriculum/practice management, publication validation, production environment guards, response headers, production build/start checks, repository audit, and final documentation are complete. MongoDB, authenticated browser, AI provider, microphone, deployment, and Lighthouse runtime checks remain environment-limited.  
**Next phase:** None. Only maintenance and product evolution remain; do not create Phase 10.

> Historical phase reports retain the stop point that was accurate when each report was written. This file and `docs/phase-9-report.md` supersede those historical markers for the final repository state.

## Repository baseline

This workspace was initialized as a greenfield SAYVA repository after the original repository upload was unavailable. The current implementation is the approved greenfield foundation plus the completed Phase 2 public website, Phase 3 authentication/onboarding boundary, Phase 4 Learning Core, and Phase 5 Practice Engine, not an audit of an existing product repository.

- Next.js 16.3.5 with App Router and Turbopack build
- React / React DOM 19.2.8
- TypeScript 5.9.3
- Tailwind CSS 4.3.3
- shadcn CLI 4.21.0, Radix base, CSS variables enabled
- `next-intl` 4.14.5 with `fa` and `en` locales
- `next-themes` 0.4.6
- `motion` 13.4.0
- React Hook Form 7.88.0 + Zod 4.6.5
- Lucide React 1.47.0
- Better Auth 1.7.5 + official `@better-auth/mongo-adapter` 1.7.5
- MongoDB Node driver 7.6.0 + Mongoose 9.10.1
- `.env.example` with `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, and approved server-only `MONGODB_URI=mongodb://localhost:27017/`

## Phase 1 and Phase 2 implementation

Phase 1 and Phase 2 remain complete:

- Semantic light/dark token system with SAYVA Navy, Gold, and Cream brand anchors.
- Typography hierarchy and local font loading through `next/font/local`.
- Locale-prefixed routing, static locale generation, message catalogs, and direction-aware document roots.
- Light/Dark/System theme provider and accessible theme menu.
- Shadcn/ui primitives and shared `Container`.
- Public sitemap: Home, Features, Learning Experience, About, and FAQ in Persian and English.
- Shared public header with desktop navigation, mobile Sheet navigation, locale switch, theme control, and session-aware auth navigation.
- Shared public footer with meaningful internal links and locale switch.
- Original local hero imagery at `public/images/sayva-study-studio.jpg`.
- Server-rendered public pages with localized metadata, Open Graph/Twitter image metadata, canonical support, `robots.txt`, and `sitemap.xml`.
- Responsive, RTL/LTR-aware layouts using the Phase 1 design tokens and Lucide icons only.

## Phase 3 implementation retained

- Better Auth is the only authentication authority.
- `/api/auth/[...all]` uses `toNextJsHandler(auth)`.
- `src/lib/auth/session.ts` is the single server session access point based on request headers.
- `/[locale]/sign-in` and `/[locale]/sign-up` support bilingual email/password auth UX.
- `/[locale]/onboarding` and `/[locale]/app` remain protected by server-side session and persisted onboarding checks.
- `OnboardingProfile` remains application-owned and keyed by authenticated Better Auth user id.
- The server-rendered header uses the same session source and now links authenticated learners to `/learn`.

## Phase 4 implementation

### Curriculum models

Added Mongoose models under `src/models/learning/`:

- `LearningLevel`: CEFR-capable code, slug, localized title/description, explicit order, status.
- `LearningCourse`: level parent, slug, localized title/description, explicit order, status.
- `LearningUnit`: course parent, slug, localized title/description, explicit order, status.
- `LearningLesson`: unit parent, slug, localized title/description, explicit order, status, optional estimated duration, localized objectives, and ordered instructional content blocks.
- `LessonProgress`: authenticated `userId`, lesson reference, `in_progress`/`completed` status, start/completion timestamps, and Mongoose timestamps.

Curriculum statuses are `draft`, `published`, and `archived`. Ordinary learner queries require every curriculum parent to be `published`.

### Indexes

- Level slug unique; published level order/status query indexes.
- Course level+slug unique; level+order unique; level/status/order query index.
- Unit course+slug unique; course+order unique; course/status/order query index.
- Lesson unit+slug unique; unit+order unique; unit/status/order query index.
- Progress user+lesson unique; user/status/updatedAt query index.

These indexes support the actual hierarchy queries, deterministic ordering, and duplicate-progress protection.

### Server-side data access

`src/lib/db/learning.ts` reads levels, courses, units, lessons, and the authenticated learner’s progress directly from Server Components. It produces server-rendered DTOs for:

- Learning home
- Level curriculum
- Course units
- Unit lessons
- Lesson content and previous/next navigation

No internal learning REST API or client-side initial fetch was added.

### Learning routes

- `/[locale]/learn`
- `/[locale]/learn/[level]`
- `/[locale]/learn/[level]/[course]`
- `/[locale]/learn/[level]/[course]/[unit]`
- `/[locale]/learn/[level]/[course]/[unit]/[lesson]`

The previous `/[locale]/app` route remains stable and redirects completed learners to `/learn`.

### Learning UI

- Server-rendered learning home with current level, published levels, progress summary, current lesson, and continuation CTA.
- Data-driven curriculum browsing from level to course to unit to lesson.
- Lesson view with localized title, objective list, estimated duration, instructional content blocks, previous/next navigation, and completion state.
- Persian RTL and English LTR translations for learning labels, states, navigation, and errors.
- Existing SAYVA typography, semantic tokens, Card, Badge, Button, and Lucide primitives reused.
- Honest empty states are rendered when no matching published curriculum exists. No fake seed curriculum was created because the repository did not require a seed mechanism and MongoDB is unavailable.

### Learning mutation

`src/actions/learning.ts` exports `completeLesson`.

Flow:

```text
Better Auth session
→ completed onboarding authorization
→ Zod lesson id validation
→ published lesson and parent authorization
→ unique progress upsert
→ concurrent duplicate-key retry
→ revalidate learning paths
→ typed result
```

The action derives `userId` from the Better Auth session and never trusts browser identity or completion state.

## Phase 5 implementation

### Practice content and models

Added under `src/models/practice/`:

- `PracticeSet`: published practice reference linked to a published Learning Core lesson.
- `PracticeExercise`: explicit Mongoose discriminator base with separate multiple-choice, fill-blank, matching, and ordering payload schemas.
- `PracticeSession`: authenticated learner session with deterministic persisted exercise order, lifecycle, embedded historical attempts, and embedded completed result.

The embedded attempt is the actual `PracticeAttempt` persistence boundary: it stores learner id, session id, exercise id/type, normalized response, server-derived correctness, evaluation version, and timestamp inside its owning session. This keeps session progress, answer persistence, completion, and result summary atomic on the approved standalone MongoDB topology. A partial unique index allows only one active session per user and practice set.

### Practice rules and mutations

- `src/lib/practice/normalize.ts`, `evaluate.ts`, and `score.ts` contain pure deterministic normalization, evaluation, score, and completion rules.
- Supported exercise types are multiple-choice, fill-blank, matching, and ordering only. Listening, Reading, and Speaking are separate domain products, not Practice Engine exercise types; AI, contextual/adaptive behavior, and authoring are not Practice Engine features.
- `src/actions/practice.ts` has separate start and submit Server Actions. Each independently obtains Better Auth identity, verifies completed onboarding, validates input with Zod, checks published content/session ownership/lifecycle/order, evaluates on the server, and persists safely.
- A conditional MongoDB update pipeline rejects a duplicate exercise append, derives completion/result from the post-append attempt list, and returns an existing attempt result when a concurrent duplicate wins.
- Start order is deterministic `{ order: 1, _id: 1 }`; no random ordering is introduced. Retry starts a new session and preserves completed history.
- Practice never writes `LessonProgress`; Learning Core retains lesson-progress ownership.

### Practice routes and UI

- `/[locale]/practice` — localized protected practice home.
- `/[locale]/practice/[practiceSetId]` — start/resume session and one-question interaction.
- `/[locale]/practice/[practiceSetId]/results` — latest completed session result boundary.
- Server Components perform normal reads. A narrow Client Component owns temporary answer state and `useActionState` only; answer keys, user id, correctness, score, and completion remain server-authoritative.
- Persian RTL and English LTR messages, keyboard-native controls, live feedback announcements, focusable next/result controls, and non-drag ordering controls are implemented.
- No fake practice content or seed data was added.

## Phase 6 implementation

Phase 6 adds four conceptually separate published-content domains while preserving the existing Learning Core and Practice Engine boundaries. Each content family has an explicit Mongoose model/type, localized structured fields, published-only bounded reads, a domain DTO, a focused Zod mutation schema, a domain Server Action, a pure rule module, and localized home/detail UI.

### Vocabulary

Vocabulary items support localized word/presentation data, definitions, translations, examples, part of speech, level association, optional pronunciation metadata, optional published PracticeSet relationship, and minimal learner states: `new`, `learning`, and `known`. The normalization rule is deterministic and does not imply mastery.

### Grammar

Grammar topics support localized explanations, examples, optional common mistakes, level association, optional published PracticeSet relationship, and explicit `in_progress`/`completed` progress. Grammar completion is a review event, not a mastery claim.

### Listening

Listening items support localized metadata, repository-local `/audio/...` sources only, optional duration, transcript visibility control, and optional published PracticeSet relationship. The detail UI uses native `<audio controls preload="metadata">`, no autoplay, no recording, no speech recognition, and no playback-derived completion. Completion is an explicit server action.

### Reading

Reading items support localized metadata, ordered semantic structured sections, optional duration, optional comprehension PracticeSet relationship, and explicit `in_progress`/`completed` progress. Scroll position never completes reading.

### Shared domain state and boundaries

`learner_domain_progress` owns the minimal learner state for the four domains with a unique `(userId, domain, contentId)` index. It is separate from `LessonProgress`. All mutations independently resolve the Better Auth learner, validate untrusted fields with Zod, verify published ownership/content, upsert atomically, and revalidate the locale route. The browser never supplies user id, ownership, correctness, score, completion authority, or answer keys. Practice links resolve only published PracticeSets and Practice Engine remains the only execution/evaluation engine.

## Phase 7 implementation

Phase 7 adds an isolated AI Speaking domain. It does not write Learning Core lesson progress, Phase 6 learner-domain progress, Practice Engine sessions, analytics, recommendations, personalization, or official level/mastery state.

### AI provider decision

Phase 0–6 architecture and project-state records did not select or approve an AI provider, and no provider credential is configured in the repository. The implementation therefore uses a provider-neutral server contract at `src/lib/ai/` and fails closed with `AI_PROVIDER_NOT_CONFIGURED`. It does not silently choose OpenAI, add a provider SDK, expose a key, fabricate transcription, or fabricate feedback. A concrete approved provider must implement the `SpeakingAiProvider` contract before live AI execution is enabled.

### Scenario and attempt persistence

Added `SpeakingScenario` in `speaking_scenarios` with localized title, description, instructions, context, role, objective, success criteria, preparation tips, level/topic, expected target language, duration limit, publication status, and deterministic order. Learner reads expose only published scenarios and are bounded to 24 records.

Added `SpeakingAttempt` in `ai_speaking_attempts` with authenticated `userId`, `scenarioId`, `status`, optional server transcript, optional bounded structured feedback, failure code, lifecycle timestamps, and Mongoose timestamps. Indexes support `userId + createdAt` and `userId + scenarioId + createdAt`. Raw audio, provider prompts, secrets, and raw provider responses are not stored.

### Speaking flow and recording

The flow uses explicit states: `scenario`, `preparation`, `requesting_permission`, `ready`, `recording`, `processing`, `transcript`, `feedback`, and `error`. `getUserMedia({ audio: true })` is called only after an explicit preparation action. The Client Component detects a supported MIME type using `MediaRecorder.isTypeSupported`, records a temporary in-memory Blob, shows a live timer, enforces the scenario limit for UX, supports Stop and Cancel, and stops tracks/timers/recorder handlers on stop, cancel, processing, navigation, and unmount.

The browser sends the Blob only through `POST /api/speaking/[scenarioId]/[attemptId]/audio`. The Route Handler runs on Node, authenticates the session, checks published scenario access and attempt ownership, validates content type, bounded file size, declared duration, and state, then processes the temporary buffer. Raw audio is never written to MongoDB or logged.

### AI boundary and UI

The provider-neutral `SpeakingAiProvider` contract separates server-side transcription and structured feedback from SAYVA’s speaking flow. The contract has bounded timeouts and output validation through Zod. The no-provider implementation returns an honest provider-unavailable failure. No pronunciation metric or fake precision exists.

Server-rendered routes are `/[locale]/speaking`, `/[locale]/speaking/[scenarioId]`, and `/[locale]/speaking/[scenarioId]/results/[attemptId]`. The scenario page keeps scenario content server-rendered and mounts only the recorder/flow Client Component. Persisted results are server-rendered and ownership-checked. Retry creates a new attempt boundary; Continue returns to the speaking library.

### Privacy and failure handling

Audio is temporary request data and is not retained. Transcripts and structured feedback are persisted only when an approved provider returns validated output. Processing failures are recorded with bounded failure codes. A valid transcript can be retained with a failed feedback status if feedback generation fails; no feedback is generated from a missing transcript. No recording, transcript-view, retry, or playback analytics events were added.

## Phase 8 implementation

Phase 8 adds a protected, server-rendered progress experience at `/[locale]/progress`. It derives current position, current-level lesson completion, practice evidence, domain progress, bounded activity signals, valid Speaking result availability, and one next useful step from the existing authoritative records. It does not create a second progress engine or accept browser-supplied identity.

### Progress reads

`src/lib/db/progress-dashboard.ts` obtains the authenticated learner id at the route boundary and consumes published Learning Core, Vocabulary, Grammar, Listening, Reading, Practice Engine, shared domain-progress, and Speaking records. Published content is the denominator for domain summaries. Historical progress is not deleted when content is archived. Practice reads use aggregate result counts plus a bounded latest-session sample; they do not infer topics, difficulty, response time, or improvement. Speaking counts only completed attempts with transcript and feedback; provider failures are not learner errors.

### Personalization rules

`src/lib/progress/rules.ts` is pure and deterministic. Current lesson has priority 100, recent practice attention priority 80 after at least five attempts in the 14-day UTC window and accuracy below 60%, started unfinished Grammar/Listening/Reading priority 60 in fixed domain order, vocabulary marked learning priority 50, and previous completed practice priority 40. Practice accuracy requires at least five answers; evidence is insufficient below five recent attempts, developing at five through nine, and reliable at ten or more. Reasons are fixed bilingual copy. No AI, randomness, arbitrary weighted score, unsupported taxonomy, or fabricated Speaking score is used.

### Activity analytics and index

Phase 8 intentionally adds no event collection: the dashboard is observational analytics derived from successful authoritative records, so no analytics write can roll back a learning mutation and no UI-noise stream is created. The existing PracticeSession model adds `{ userId: 1, status: 1, completedAt: -1 }` for the completed-session aggregate/recent-session workload. Activity source reads use UTC last-30-day windows and a 500-record cap per source.

### UI and validation

The progress UI reuses existing server components, Cards, theme tokens, next-intl messages, Lucide icons, and RTL/LTR layout. It includes honest no-data/provider-unavailable states. Pure progress/personalization tests cover formulas, evidence thresholds, recency, priority, stable domain tie-breaking, and fallback behavior. MongoDB and authenticated browser validation remain not run in this environment.

## Phase 9 implementation: Admin + Production Audit

Phase 9 is complete and is the final planned implementation phase. Admin is an authenticated surface under `src/app/[locale]/(admin)/admin/`, using the Better Auth Admin plugin's persisted `user.role` as the role authority. Only `learner` and `admin` roles are used. The Admin layout requires a server session and `admin` role; every Admin Server Action independently repeats that authorization. The client-visible Admin link is convenience only and is not an authorization boundary.

The Admin surface covers bounded, explicitly sorted management for Learning/Curriculum, Vocabulary, Grammar, Listening, Reading, Speaking Scenarios, and the existing PracticeSet/PracticeExercise models. It uses no duplicate Admin models or generic CRUD engine. New content defaults to `draft`; publish transitions perform stronger required-field, parent, reference, structured-payload, and status validation. Drafts can remain incomplete within schema limits, and archived content is retained rather than destructively deleted.

Added Admin files include the protected route shell and pages under `src/app/[locale]/(admin)/admin/`, `src/components/admin/`, bounded reads in `src/lib/db/admin.ts`, explicit content/curriculum/practice actions, and repaired bilingual Admin messages. The matcher includes `/admin`, but security does not depend on matcher or navigation visibility.

Production audit changes are intentionally small: Better Auth secret/site URL and MongoDB URI are required at production runtime; development fallbacks remain explicit for local work. Next config disables the powered-by header and configures `nosniff`, referrer, and permissions-policy headers. CSP/HSTS, rate limiting, TLS/reverse-proxy configuration, backup/monitoring, real MongoDB, authenticated browser, AI, microphone, deployment, and Lighthouse validation are not claimed without the relevant production environment. AI remains `NOT CONFIGURED`.

### Phase 9 validation

Passed: `npx tsc --noEmit`, `npm run lint`, all four existing test scripts, `NEXT_TELEMETRY_DISABLED=1 npm run build`, and `npm run start` against that build with explicit local audit environment variables. The production server returned `200` for `/en`, `200` for `/robots.txt`, and an unauthenticated `307` redirect from `/en/admin` to localized sign-in; configured response headers were observed.

Not validated: local MongoDB connectivity, authenticated Admin CRUD against persisted data, authenticated browser behavior, console/network tracing in a browser, hard refresh/back-forward, responsive viewports, RTL/LTR and theme behavior in a browser, microphone, provider AI, rate-limit behavior, TLS, reverse proxy, backups, deployment, and Lighthouse/Core Web Vitals. The environment result is: `The execution environment cannot access the user's local MongoDB instance at localhost:27017.`

## Explicitly not implemented

- AI Practice, generic AI assistant, chatbot, AI tutor, vocabulary AI, grammar AI, AI Reading evaluation, AI Listening evaluation, pronunciation scoring, adaptive learning engine, achievements, streaks, XP, gamification, analytics SaaS, CMS, prompt management UI, subscriptions, payments, search infrastructure, vector search, embeddings, RAG, AI memory, or social/passkey auth.
- A concrete AI provider, provider SDK, provider API key, live transcription, or live AI feedback because no provider was approved in Phase 0–6.
- Permanent raw-audio storage, remote audio storage, audio archives, audio analytics, or public audio access.
- A second auth, database, validation, state, i18n, progress, or practice system.
- Generic AI manager/orchestrator/framework layers, a generic provider platform, or a giant cross-domain schema.

## Phase 8 validation record

Passed during this phase:

- `npx tsc --noEmit`
- `npm run lint`
- `NODE_OPTIONS=--max-old-space-size=1536 NEXT_TELEMETRY_DISABLED=1 npm run build` — production build compiled, typechecked, generated 39 routes, and listed `/[locale]/progress`.
- `npm run test:progress` — 5 deterministic progress and personalization tests passed.
- `npm run test:practice` — 6 existing deterministic Practice tests passed.
- `npm run test:domains` — 3 existing deterministic domain tests passed.
- `npm run test:speaking` — 5 existing deterministic Speaking tests passed.

Not run: authenticated MongoDB runtime, authenticated browser rendering, hard refresh, back/forward, responsive viewport checks, RTL/LTR browser checks, theme browser checks, console/network inspection, and real authenticated mutation analytics. The required MongoDB limitation is:

```text
The execution environment cannot access the user's local MongoDB instance at localhost:27017.
```

## Validation record

### Passed

- `npx tsc --noEmit`
- `npm run lint` (`eslint .`)
- `npm run test:practice` — 6 existing deterministic tests passed.
- `npm run test:domains` — 3 existing Phase 6 deterministic tests passed.
- `npm run test:speaking` — 5 deterministic tests passed for state transitions, duration limits, MIME selection, retry rules, and bounded structured feedback validation.
- `NODE_OPTIONS=--max-old-space-size=1536 NEXT_TELEMETRY_DISABLED=1 npm run build` — production build compiled, typechecked, generated 37 routes, and listed Speaking pages and the audio Route Handler.
- Guest HTTP checks for `/en/speaking` and `/fa/speaking` returned localized `307` redirects to sign-in.
- Unauthenticated audio upload boundary returned `401 {"ok":false,"code":"UNAUTHORIZED"}`.
- No dependency was added.

### Not run

The environment cannot provide a configured AI provider, microphone permission/hardware, authenticated MongoDB data, or a real authenticated browser session. The following remain **NOT RUN** rather than fabricated: provider transcription, structured AI feedback, microphone permission, MediaRecorder start/stop, upload, processing, transcript, feedback, retry, continue, audio cleanup in a real browser, authenticated hard refresh, authenticated back/forward, browser console/network inspection, responsive viewports, RTL/LTR browser validation, theme validation, and MongoDB persistence.

MongoDB runtime limitation:

```text
The execution environment cannot access the user's local MongoDB instance at localhost:27017.
```

AI runtime limitation:

```text
AI runtime validation: NOT RUN — no approved provider or credentials are configured.
```

Microphone runtime limitation:

```text
Microphone runtime validation: NOT RUN — no real browser microphone permission/hardware session was available.
```

## Testing matrix

| Scenario | Result |
|---|---|
| Pure Speaking state transitions | PASSED: Node test |
| Recording duration limit rule | PASSED: Node test |
| MIME capability selection rule | PASSED: Node test |
| Retry rule | PASSED: Node test |
| Feedback schema code path | Typechecked; provider runtime not run |
| Scenario/attempt ownership integration | NOT RUN: MongoDB unavailable |
| Provider transcription | NOT RUN: no approved provider |
| Provider feedback generation | NOT RUN: no approved provider |
| Microphone permission | NOT RUN: no browser/hardware session |
| MediaRecorder start/stop | NOT RUN: no browser/hardware session |
| Audio upload | NOT RUN: no authenticated browser/database session |
| Guest English Speaking route | PASSED: localized auth redirect |
| Guest Persian Speaking route | PASSED: localized auth redirect |
| Hard refresh | NOT RUN: no authenticated runtime |
| Back/forward | NOT RUN: no authenticated runtime |
| Responsive 320/390/768/1024/1440 | NOT RUN: no authenticated browser run |
| RTL/LTR browser behavior | NOT RUN: no authenticated browser run |
| Light/Dark/System browser behavior | NOT RUN: no authenticated browser run |
| Browser console/network | NOT RUN: no authenticated browser run |

## Dependency integrity

Phase 7 dependency changes:

```text
Added: NONE
Removed: NONE
Updated: NONE
Downgraded: NONE
```

The existing Next.js Route Handler capability, Better Auth session boundary, Mongoose, MongoDB, Zod, next-intl, theme, UI primitives, and native browser MediaStream/MediaRecorder APIs were reused.

## Files changed in Phases 4–8

Phase 7 additions/updates include:

- `src/models/speaking/types.ts`, `src/models/speaking/scenario.ts`, `src/models/speaking/attempt.ts`
- `src/lib/speaking/types.ts`, `src/lib/speaking/rules.ts`
- `src/lib/ai/types.ts`, `src/lib/ai/speaking.ts`
- `src/lib/db/speaking.ts`
- `src/actions/speaking.ts`
- `src/validation/speaking/scenario.ts`, `audio.ts`, `attempt.ts`, `feedback.ts`
- `src/app/[locale]/(protected)/speaking/**/page.tsx`
- `src/app/api/speaking/[scenarioId]/[attemptId]/audio/route.ts`
- `src/components/speaking/*`
- `src/proxy.ts`, `src/components/public/authenticated-nav.tsx`
- `messages/en.json`, `messages/fa.json`, `package.json`
- `tests/speaking/rules.test.mjs`
- `docs/architecture.md`, `docs/project-state.md`, `docs/phase-7-report.md`

Phase 8 additions/updates include:

- `src/lib/progress/types.ts`, `src/lib/progress/rules.ts`, `src/lib/db/progress-dashboard.ts`
- `src/components/progress/progress-dashboard.tsx`
- `src/app/[locale]/(protected)/progress/page.tsx`
- `src/models/practice/session.ts`
- `src/components/public/authenticated-nav.tsx`, `src/proxy.ts`
- `messages/en.json`, `messages/fa.json`, `package.json`
- `tests/progress/rules.test.mjs`
- `docs/architecture.md`, `docs/project-state.md`, `docs/phase-8-report.md`

Phase 4–7 files remain in the repository and retain their existing ownership boundaries.

## Known limitations

1. No AI provider was approved or configured in the prior phase records, so the live provider adapter, transcription, and feedback runtime are intentionally unavailable.
2. No real browser microphone/hardware session was available for runtime recording validation.
3. MongoDB-backed authenticated runtime validation remains unavailable.
4. Scenario pages render honest empty states until published MongoDB SpeakingScenario documents exist; no fake seed data was added.
5. The server validates the client-declared duration against the scenario limit and the upload size/content type; exact encoded audio duration requires a provider/media parser and is not claimed.
6. The application does not persist raw audio, so replay after upload is intentionally unavailable.

## Stop point

Phase 9 is complete and is the final planned implementation phase. Work stops after the Phase 9 documentation and report. There is no Phase 10; future work is maintenance or explicitly approved product evolution.
