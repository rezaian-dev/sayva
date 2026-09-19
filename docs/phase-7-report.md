# SAYVA Phase 7 Report

## 1. AI Provider

No AI provider was selected or approved in the Phase 0–6 architecture/project-state records. The implementation therefore uses a provider-neutral `SpeakingAiProvider` contract in `src/lib/ai/` and fails closed with `AI_PROVIDER_NOT_CONFIGURED`.

Provider: none approved/configured.

API mechanism: none enabled; no provider SDK, endpoint, secret, or model was silently introduced.

Transcription capability: the server contract accepts a provider transcription result, but no live provider implementation is present.

Feedback capability: the server contract accepts structured feedback, but no live provider implementation is present.

This decision follows the phase instruction not to invent a provider or fabricate transcript/feedback. Official documentation reviewed for the implemented boundaries included:

- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- React `useActionState`: https://react.dev/reference/react/useActionState
- Better Auth session management: https://better-auth.com/docs/concepts/session-management
- MongoDB indexes/data modeling: https://www.mongodb.com/docs/manual/indexes/
- Mongoose schemas: https://mongoosejs.com/docs/guide.html
- Zod parsing and safe validation: https://zod.dev/basics
- React Hook Form documentation: https://react-hook-form.com/
- MDN `getUserMedia()`: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- MDN `MediaRecorder`: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder

OpenAI documentation was not used to implement a provider because OpenAI was not approved by the existing SAYVA architecture and no provider decision was present.

## 2. AI Architecture

The intended server boundary is:

```text
Browser recorder
    ↓ same-origin authenticated audio Route Handler
SAYVA server
    ↓ provider-neutral SpeakingAiProvider contract
Approved AI provider, when one is configured
```

The browser never receives or uses an AI secret. It never calls an AI provider directly. The current configured behavior is an explicit provider-unavailable failure, not a fake result.

## 3. Speaking State Machine

Implemented flow states:

```text
scenario
→ preparation
→ requesting_permission
→ ready
→ recording
→ processing
→ transcript
→ feedback
→ error
```

The state machine is explicit and tested. Retry returns to `preparation` and creates a new attempt after permission is granted. Processing has no fake percentage progress. If a provider later returns a valid transcript but feedback fails, the transcript may be persisted with a failed feedback status.

## 4. Scenario Model

`SpeakingScenario` persists:

- `slug` — stable scenario identity.
- `title`, `description`, `instructions` — localized learner-facing content.
- `context`, `role`, `objective` — the task framing.
- `successCriteria` — localized, bounded success guidance.
- `preparationTips` — localized preparation support.
- `level`, `topic` — focused scenario metadata.
- `durationLimitSeconds` — explicit recording limit, bounded from 15 to 180 seconds.
- `expectedLanguage` — target spoken language, independent from UI locale.
- `status` — draft/published/archived publication boundary.
- `order` — deterministic published list ordering.
- timestamps.

Learner queries expose only published scenarios and are bounded to 24 records. No CMS or authoring UI was added.

## 5. Attempt Model

`SpeakingAttempt` persists:

- `_id` — attempt identity.
- `userId` — server-derived Better Auth owner.
- `scenarioId` — scenario reference.
- `status` — `started`, `recorded`, `processing`, `completed`, or `failed`.
- `transcript` — validated server transcription result when available.
- `feedback` — bounded structured feedback when available.
- `failureCode` — bounded failure category.
- `startedAt`, `recordedAt`, `processingStartedAt`, `completedAt`, `failedAt` — lifecycle timestamps.
- `createdAt`, `updatedAt` — Mongoose timestamps.

Indexes:

- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, scenarioId: 1, createdAt: -1 }`

Raw audio, provider requests/responses, prompts, secrets, and duplicated user/scenario objects are not persisted.

## 6. Recording Architecture

The narrow `SpeakingFlow` Client Component requests `navigator.mediaDevices.getUserMedia({ audio: true })` only after the learner explicitly continues from preparation. It handles permission denial, dismissed permission, missing device, unsupported browser, secure-context failure, and generic device failure.

The component detects the first supported MIME type from browser capability checks using `MediaRecorder.isTypeSupported`. It creates a native `MediaRecorder`, keeps chunks in memory, exposes Start, Stop, and Cancel controls, displays an explicit timer, and stops automatically at the scenario limit for UX.

The component stops microphone tracks and clears recorder/timer state on stop, cancel, processing, navigation, and unmount. The timer is an ephemeral client aid; the server still validates the declared duration against the scenario limit and validates the upload size/type.

Real microphone recording was not runtime-validated in this environment.

## 7. Audio Upload

Binary audio uses one Route Handler:

```text
POST /api/speaking/[scenarioId]/[attemptId]/audio
```

The browser sends a `FormData` body containing the temporary Blob and a declared duration. Audio is not placed in query parameters, localStorage, or cookies.

The Node Route Handler validates:

- Better Auth session.
- Published scenario access.
- Attempt ownership by server-derived user id.
- Attempt lifecycle state.
- Audio presence.
- Normalized content type: `audio/webm`, `audio/mp4`, or `audio/ogg`.
- Maximum body file size: 4,000,000 bytes.
- Declared duration from 1 to 180 seconds and against the scenario limit.

Exact encoded duration is not claimed because no media parser/provider is configured. Raw audio exists only in the request/buffer processing path and is not stored.

## 8. Transcription

The Route Handler transitions an owned attempt from `started` to `recorded` to `processing`, reads the temporary buffer, and calls `processSpeakingAudio` through the server-only provider-neutral contract.

The contract expects a provider to return a bounded transcription object. The transcript is validated with `speakingTranscriptSchema` before any feedback call or persistence.

Actual provider transcription: **NOT RUN**. No provider was approved or configured. The current implementation records a failed attempt with `AI_PROVIDER_NOT_CONFIGURED` rather than fabricating a transcript.

## 9. Feedback

When a provider is eventually approved, feedback receives:

- Scenario context, role, objective, instructions, success criteria, preparation context, level, and expected language.
- The validated server transcript.
- UI locale as presentation context, separate from target spoken language.

The intended structured output contains:

- `overallFeedback`
- `strengths`
- `areasToImprove`
- `grammarNotes`
- `vocabularySuggestions`
- `fluencyNotes`
- `correctionExamples`
- `nextAttemptSuggestion`

`src/validation/speaking/feedback.ts` bounds all strings, array sizes, and correction object fields with Zod before persistence/rendering. No score, pronunciation percentage, accent metric, or scientific precision is produced.

Actual AI feedback: **NOT RUN**. No provider was approved or configured.

## 10. Security

- Authentication uses the existing Better Auth server session boundary.
- Scenario access requires published content.
- Attempt reads and mutations require the authenticated owner’s server-derived user id.
- The browser never supplies an authoritative user id or ownership decision.
- Provider credentials are not present in the client and no provider key was added.
- Audio processing is server-side through the Route Handler.
- Transcript content is treated as untrusted data, not instructions.
- AI output must match the Zod contract before persistence.
- AI feedback cannot alter curriculum, lesson progress, domain progress, account status, or official learner level.
- Duplicate audio submissions are rejected after the attempt leaves `started`.
- Retry creates a new attempt boundary rather than overwriting a prior attempt.

## 11. Privacy

Raw audio retention: none. Audio is held temporarily in the request/server processing path and is not stored in MongoDB, public storage, localStorage, cookies, or analytics.

Transcript retention: only a validated provider transcript would be persisted on the owning attempt. With no provider configured, no transcript is fabricated or persisted.

Feedback retention: only bounded Zod-validated structured feedback would be persisted.

Logging: raw audio, full provider payloads, secrets, and unnecessary full private transcripts are not logged. Existing error logging records only safe failure categories/messages.

Deletion behavior: because raw audio is not persisted, there is no audio archive deletion workflow. Persisted transcript/feedback deletion is not implemented in this phase and remains an application data-lifecycle decision for a later approved phase/provider configuration.

## 12. Server Actions / Route Handlers

Actual boundaries:

- `startSpeakingAttempt(scenarioId)` — Server Action. Authenticates, validates the scenario id, verifies published scenario access, creates a server-owned `started` attempt, and revalidates speaking UI.
- `cancelSpeakingAttempt(scenarioId, attemptId)` — Server Action. Authenticates, validates ids, verifies owned lifecycle state, marks the attempt failed with `CANCELLED`, and revalidates speaking UI.
- `POST /api/speaking/[scenarioId]/[attemptId]/audio` — Route Handler. Handles binary transport, request validation, ownership, lifecycle transitions, provider boundary, transcript/feedback validation, and attempt persistence. A Route Handler is used because audio is binary multipart data.
- `GET` for the result page is not implemented as a duplicate API. The server-rendered result route reads MongoDB directly through the existing server DB boundary.

## 13. Validation Schemas

Actual schemas:

- `src/validation/speaking/scenario.ts` — scenario and attempt ObjectId-shaped route/action ids.
- `src/validation/speaking/audio.ts` — allowed audio content types, bounded file size metadata, duration bounds, and transcript length.
- `src/validation/speaking/attempt.ts` — explicit attempt status values.
- `src/validation/speaking/feedback.ts` — bounded structured provider feedback.

Pure rule validation in `src/lib/speaking/rules.ts` covers state transitions, duration limits, MIME selection ordering, and retry eligibility.

## 14. Routes

Protected locale routes:

- `/[locale]/speaking` — published Speaking scenario library.
- `/[locale]/speaking/[scenarioId]` — scenario context, preparation, permission, recorder, processing, transcript, and feedback flow.
- `/[locale]/speaking/[scenarioId]/results/[attemptId]` — server-rendered owned attempt result.

Authenticated binary boundary:

- `/api/speaking/[scenarioId]/[attemptId]/audio` — temporary audio processing upload.

The proxy protects the locale Speaking route family, while each page/action/handler performs its own server-side authorization.

## 15. Client / Server Boundaries

Server Components:

- Scenario list and published scenario reads.
- Scenario detail content and localized metadata.
- Result page, transcript, feedback, ownership, and persistence reads.
- Better Auth session checks and database access.
- AI contract, validation, processing, and persistence.

Client Components:

- `SpeakingFlow` only. It owns permission requests, MediaStream/MediaRecorder, temporary Blob chunks, timer, explicit flow state, upload feedback, and action buttons.
- It does not own scenario authorization, user identity, transcript authority, feedback authority, or database persistence.

The AI boundary is never imported into the Client Component.

## 16. Automated Tests

Unit:

- `npm run test:speaking` — 5 tests passed for state transitions, duration limits, MIME selection, retry rules, and bounded structured feedback validation.
- `npm run test:practice` — 6 existing tests passed.
- `npm run test:domains` — 3 existing Phase 6 tests passed.

Component: **NOT RUN**. No component test runner is installed and no fake browser permission result was created.

Integration: **NOT RUN**. MongoDB is unavailable.

E2E: **NOT RUN**. No authenticated browser/microphone session was available.

AI runtime: **NOT RUN**. No approved provider or credentials.

Microphone runtime: **NOT RUN**. No real browser permission/hardware session.

MongoDB runtime: **NOT RUN**. The execution environment cannot access the user's local MongoDB instance at localhost:27017.

Static validation passed: `npx tsc --noEmit`, `npm run lint`, and production `npm run build`.

## 17. Browser Validation

Actual authenticated browser results:

- Permission: **NOT RUN**.
- Recording: **NOT RUN**.
- Stop: **NOT RUN**.
- Processing: **NOT RUN**.
- Transcript: **NOT RUN**.
- Feedback: **NOT RUN**.
- Retry: **NOT RUN**.
- Continue: **NOT RUN**.

Guest HTTP boundary checks were run for `/en/speaking` and `/fa/speaking`; both returned localized `307` redirects to sign-in. This is not a claim of authenticated browser success.

## 18. Hard Refresh

**NOT RUN** for authenticated Speaking scenario/result pages because no MongoDB-backed authenticated browser state was available. Result pages are server-rendered and ownership-checked by design, but no runtime result is claimed.

## 19. Back / Forward

**NOT RUN** for the authenticated Speaking flow. No claim is made about browser history behavior during recording or after processing.

## 20. Responsive

Required viewport checks:

```text
320: NOT RUN
390: NOT RUN
768: NOT RUN
1024: NOT RUN
1440: NOT RUN
```

The authored layout uses existing responsive SAYVA containers, wrapped controls, bounded text measure, and no intentional fixed-width recording shell, but authenticated browser validation was not available.

## 21. RTL/LTR

The existing locale layout remains authoritative:

- Persian UI: RTL by the existing `dir="rtl"` root.
- English UI: LTR by the existing `dir="ltr"` root.
- Target spoken language: explicit `expectedLanguage` scenario data, independent of UI locale.

Live browser validation of Speaking controls, timer, transcript, feedback, and navigation in both locales: **NOT RUN**.

## 22. Theme

The existing Light/Dark/System `next-themes` provider and semantic tokens are reused for Speaking scenario, recorder, processing, transcript, error, and feedback surfaces.

Live browser validation for Light, Dark, and System: **NOT RUN**.

## 23. Console / Network

Authenticated browser console/network inspection: **NOT RUN**.

The implementation uses one same-origin audio POST boundary and does not make client-side AI requests. An unauthenticated POST to the audio boundary returned `401 {"ok":false,"code":"UNAUTHORIZED"}`. No provider request was made, no API key was exposed, and no successful AI network result is claimed.

## 24. Dependency Changes

```text
Added: NONE
Removed: NONE
Updated: NONE
Downgraded: NONE
```

Native `getUserMedia` and `MediaRecorder` are used. No recording library, AI SDK, agent framework, vector database, or additional provider package was added.

## 25. Files Changed

Primary Phase 7 additions/updates:

- `src/models/speaking/types.ts`
- `src/models/speaking/scenario.ts`
- `src/models/speaking/attempt.ts`
- `src/lib/speaking/types.ts`
- `src/lib/speaking/rules.ts`
- `src/lib/ai/types.ts`
- `src/lib/ai/speaking.ts`
- `src/lib/db/speaking.ts`
- `src/actions/speaking.ts`
- `src/validation/speaking/scenario.ts`
- `src/validation/speaking/audio.ts`
- `src/validation/speaking/attempt.ts`
- `src/validation/speaking/feedback.ts`
- `src/app/[locale]/(protected)/speaking/page.tsx`
- `src/app/[locale]/(protected)/speaking/[scenarioId]/page.tsx`
- `src/app/[locale]/(protected)/speaking/[scenarioId]/results/[attemptId]/page.tsx`
- `src/app/api/speaking/[scenarioId]/[attemptId]/audio/route.ts`
- `src/components/speaking/speaking-navigation.tsx`
- `src/components/speaking/speaking-home.tsx`
- `src/components/speaking/speaking-detail.tsx`
- `src/components/speaking/speaking-flow.tsx`
- `src/components/speaking/speaking-result.tsx`
- `src/components/public/authenticated-nav.tsx`
- `src/proxy.ts`
- `messages/en.json`
- `messages/fa.json`
- `tests/speaking/rules.test.mjs`
- `package.json`
- `docs/architecture.md`
- `docs/project-state.md`
- `docs/phase-7-report.md`

## 26. Known Limitations

1. No AI provider was selected or approved in the prior project records, so live transcription and feedback are intentionally unavailable rather than fabricated.
2. No real browser microphone/hardware permission session was available.
3. MongoDB runtime is unavailable.
4. No fake SpeakingScenario seed data was added; scenario pages show honest empty states until published records exist.
5. Exact encoded audio duration is not independently parsed server-side; the server validates declared duration, file size, type, scenario limit, and attempt lifecycle.
6. Raw audio is not retained, so post-upload audio replay is not available.
7. Persisted transcript/feedback deletion is not implemented because the provider and retention policy require an explicit future product decision.

## 27. Next Phase

```text
PHASE 8 — Progress + Personalization + Analytics
```

Phase 8 was not started. AI Practice, personalization, adaptive learning, analytics, gamification, recommendations, and admin remain outside this phase.
