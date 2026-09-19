# SAYVA Phase 5 — Practice Engine Report

**Snapshot date:** 2026-09-19  
**Phase:** Phase 5 — Practice Engine  
**Status:** Implemented in the repository; MongoDB-backed authenticated runtime not validated in this execution environment.

## 1. Executive summary

Phase 5 adds a small, reusable, deterministic Practice Engine on top of the Phase 0–4 architecture. It supports multiple-choice, fill-blank, matching, and ordering exercises; authenticated sessions; server-authoritative evaluation; embedded attempts; persisted completed results; retry boundaries; localized Persian RTL and English LTR UI; and pure deterministic tests.

No fake curriculum, practice records, session, attempt, result, progress update, or MongoDB success was added.

## 2. Phase boundary

Work stayed within Phase 5. The implementation stops before **PHASE 6 — Vocabulary + Grammar + Listening + Reading**.

The engine does not implement Vocabulary, Grammar, Listening, Reading, Speaking, AI, adaptive learning, analytics, achievements, streaks, XP, gamification, recommendations, admin/CMS, content authoring, payments, subscriptions, or a REST API.

## 3. Repository architecture preserved

The implementation reuses the established Next.js App Router, React Server Components, Server Actions, Better Auth, Mongoose, Zod, `next-intl`, shadcn/ui primitives, semantic design tokens, `next-themes`, Lucide icons, and existing protected route structure.

No competing authentication, session, database, validation, state, i18n, or design system was introduced.

## 4. Implemented file areas

Key Phase 5 areas are:

- `src/models/practice/` — PracticeSet, discriminated exercises, and PracticeSession models.
- `src/lib/practice/` — public DTOs, paths, normalization, evaluation, score/completion rules.
- `src/lib/db/practice.ts` — server-only practice reads and safe public DTO mapping.
- `src/actions/practice.ts` — authenticated start and submit Server Actions.
- `src/validation/practice/answer.ts` — Zod request and typed response validation.
- `src/components/practice/` — focused home, question, exercise, start, and result UI.
- `src/app/[locale]/(protected)/practice/` — localized protected routes.
- `tests/practice/evaluate.test.mjs` — pure logic tests using Node’s built-in test runner.

## 5. Ownership model

Learning Core owns curriculum hierarchy and `LessonProgress`.

Practice Engine owns practice-set references, exercise content, session lifecycle, attempts, deterministic evaluation, scoring, and result summaries.

Practice sets reference published lessons for discovery and parent authorization. Submitting practice never completes or modifies lesson progress.

## 6. Practice content model

`PracticeSet` stores a published practice unit linked to a published `LearningLesson`, with localized title/description, slug, explicit order, and content status.

Exercises reference their practice set, contain localized prompt/instruction data, have explicit order and status, and use a Mongoose discriminator key named `exerciseType`.

## 7. Discriminated exercise types

The initial type-safe subset is intentionally limited:

- `multiple-choice` — localized options and one server-only correct option id.
- `fill-blank` — server-only accepted answer strings and explicit case-sensitivity.
- `matching` — localized left/right items and server-only pair mappings.
- `ordering` — localized items and server-only correct order.

Each discriminator owns its payload fields. There is no giant generic exercise document with unrelated optional fields.

## 8. Extension boundary

Translation can be added later using explicit accepted translations and deterministic normalization only. Listening, Reading, Speaking, contextual practice, and AI exercise families remain extension boundaries and are not built as Phase 5 products.

The evaluator is closed over the four implemented types, so adding a future type requires an explicit payload schema, response schema, evaluator branch, public DTO mapping, UI interaction, and pure tests.

## 9. Session data model

`PracticeSession` is the authoritative server/database record for a learner’s practice session. It contains:

- authenticated `userId`
- `practiceSetId`
- server-created `exerciseOrder[]`
- persisted `currentIndex`
- `status: active | completed`
- embedded attempts
- embedded result after completion
- `startedAt`, `completedAt`, and timestamps

A newly started session is `active`. It becomes `completed` only after all ordered exercises have accepted a persisted attempt, regardless of correctness.

## 10. Attempt persistence

Attempts are embedded in the owning session, which is the actual equivalent of a separate `PracticeAttempt` record for this phase. Every attempt records learner id, session id, exercise id, exercise type, normalized response, server-derived correctness, evaluation version, and submission timestamp.

Embedding keeps append, cursor advancement, lifecycle transition, and completed result derivation in one MongoDB document update. The practice set’s fixed exercise list bounds the session document; no analytics event log is introduced.

## 11. Deterministic question ordering

Starting a session queries only published exercises and sorts by `{ order: 1, _id: 1 }`. The resulting ids are persisted in `exerciseOrder[]`.

There is no random ordering. Refreshes and retries do not reconstruct a new order inside the same session. A retry after completion creates a new session, preserving the completed historical session.

## 12. Session lifecycle and retry boundary

The lifecycle is explicit:

```text
not_started → active → completed
```

`not_started` is represented by the absence of an active session for the learner and practice set. Starting is idempotent toward an existing active session. Completion persists a result. Retry is a new-session operation and never rewrites the completed session.

## 13. Server-authoritative evaluation

The browser sends only a validated session id, exercise id, and typed response JSON. It does not send user id, ownership, correctness, score, percentage, official answer, accepted answers, or answer-key fields.

The submit action reloads the owned active session and published exercise on the server, verifies the next unanswered exercise, evaluates the response using server-only answer data, and returns only safe feedback and progress metadata.

## 14. Normalization and evaluation rules

Pure rules in `src/lib/practice/` provide deterministic behavior:

- Text uses Unicode NFC normalization, trimming, whitespace collapsing, and optional case folding.
- Multiple-choice requires a known option id and compares it with the server answer key.
- Fill-blank accepts only configured deterministic answer strings.
- Matching requires the complete valid pair set; response pair order is irrelevant.
- Ordering requires the complete known item set in the exact server-defined order.
- Unknown or malformed ids cannot be correct and do not reveal answer keys.

## 15. Scoring and completion

The score is deliberately simple:

```text
scorePercent = round(correctCount / totalCount * 100)
```

A non-empty session is complete when the number of persisted attempts reaches the persisted exercise count. Incorrect answers still count as meaningful attempts and advance the session; no second attempt semantics are silently invented for the same exercise.

## 16. Duplicate-submission and concurrency protection

A partial unique index allows only one active session per learner and practice set. Concurrent starts converge on the active session through duplicate-key handling.

Submission uses a conditional update that requires the session to remain active and the target exercise to be absent from the embedded attempts. The update pipeline appends the attempt and derives status, cursor, result, and score from the post-append array. A repeated submission returns the existing attempt result; a conflicting request cannot overwrite it.

The action also requires the submitted exercise to be the next unanswered ordered exercise, preventing out-of-order client mutation.

## 17. Authentication and authorization

Every Practice Server Action independently obtains the Better Auth server session, requires an authenticated user, verifies the completed onboarding learner boundary, validates request data with Zod, checks published practice content, checks session ownership, enforces active lifecycle and ordering rules, and persists through Mongoose.

Protected pages separately use the existing `requireLearner` helper. The proxy is only an optimistic redirect layer and is not treated as a security boundary.

## 18. Learning Core integration

Practice sets verify their referenced lesson is published before learner visibility or session start. Practice does not duplicate or replace `LessonProgress`, does not infer lesson completion from practice score, and does not introduce recommendation or adaptive progression logic.

This preserves the Phase 4 ownership boundary exactly.

## 19. Server/client boundary

Normal practice reads are Server Component reads. The client boundary is limited to temporary answer selection, matching selects, ordering up/down controls, form submission, pending state, and safe action feedback.

`useActionState` is used because the interaction genuinely benefits from pending and returned Server Action state. Correctness, score, completion, answer keys, user id, and ownership never exist as client-authoritative state.

## 20. Routes and navigation

Implemented protected localized routes:

- `/[locale]/practice` — published practice home.
- `/[locale]/practice/[practiceSetId]` — start/resume one-question session.
- `/[locale]/practice/[practiceSetId]/results` — latest completed result.

Authenticated navigation now includes Learning and Practice. Session pages provide a return-to-practice link, and result pages provide retry and all-practice navigation.

## 21. Localization, RTL/LTR, accessibility, and responsive design

English and Persian message catalogs include practice labels, exercise types, actions, lifecycle states, errors, feedback, and result copy. The existing locale layout controls `lang` and `dir`, so Persian remains RTL and English remains LTR.

Radio controls, text input, native selects, semantic labels, live feedback regions, and focusable next/result controls support keyboard interaction. Ordering uses explicit up/down buttons rather than a drag-only interaction. Light, Dark, and System themes continue to use the shared theme provider and semantic tokens.

Authenticated viewport validation at 320, 390, 768, 1024, and 1440px was not possible without database-backed learner state; it is recorded as not run rather than fabricated.

## 22. Validation and test results

Validated in the repository:

- `npx tsc --noEmit` — passed.
- `npm run lint` — passed with no warnings/errors in the final run.
- `npm run test:practice` — 6 pure deterministic tests passed.
- `NODE_OPTIONS=--max-old-space-size=2048 npm run build` — passed.
- Production build reported 27 routes, including all three practice routes.
- Guest `/en/practice` and `/fa/practice` requests returned localized `307` redirects to the matching sign-in routes.

The pure tests cover normalization, multiple-choice, fill-blank, matching, ordering, score, and completion rules.

## 23. Runtime limitation and official guidance consulted

MongoDB-backed runtime validation was not run. The exact environment limitation is:

> The execution environment cannot access the user's local MongoDB instance at localhost:27017.

Therefore, no authenticated practice home, session creation, answer persistence, refresh persistence, completed result, retry history, or concurrency runtime success is claimed.

Implementation choices were checked against the official guidance for Next.js Server Actions, React `useActionState`, Mongoose schemas/validation/transactions and index behavior, MongoDB indexes, and Zod schemas:

- https://nextjs.org/learn/dashboard-app/mutating-data
- https://react.dev/reference/react/useActionState
- https://mongoosejs.com/docs/guide.html
- https://mongoosejs.com/docs/validation.html
- https://mongoosejs.com/docs/transactions.html
- https://www.mongodb.com/docs/manual/indexes/
- https://zod.dev/api

## 24. Final status and stop point

Phase 5 is implemented and documented in `docs/architecture.md`, `docs/project-state.md`, and this report. No Phase 6 work was started.

The repository is ready for a future environment with accessible MongoDB to run authenticated integration, browser, responsive, refresh, navigation, and concurrency validation. Work stops here at the Phase 5 boundary.
