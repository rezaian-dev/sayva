# SAYVA Phase 8 Report

## 1. Progress Architecture

Phase 8 adds a protected, server-rendered progress experience at `/[locale]/progress`.

The route obtains the Better Auth session through the existing `requireLearner` boundary, verifies the completed onboarding profile, and passes the server-derived `session.user.id` plus learner level to `getProgressDashboardData`. The browser cannot supply a user id, progress value, score, or recommendation input.

The dashboard is a read model, not a second progress engine. It composes the existing authoritative records:

- Learning Core published curriculum and `LessonProgress` for the current level and next lesson.
- Practice Engine completed `PracticeSession` results and embedded attempts.
- Published Vocabulary, Grammar, Listening, and Reading content plus `LearnerDomainProgress`.
- Speaking attempts, counting only valid completed transcript-and-feedback results.

Each domain remains separate. Learning lesson progress is not rewritten from domain progress, Practice Engine submissions do not complete lessons, Speaking attempts do not become mastery, and no duplicate progress collection was introduced.

## 2. Progress Metrics

All metrics have an explicit source, formula, time window, and evidence rule.

| Metric | Source | Formula / boundary |
|---|---|---|
| Current-level lesson completion | Published Learning Core lessons and `LessonProgress` | `completed published lessons / total published lessons`, rounded to a whole percent; the learner’s onboarding level is the level boundary |
| Current lesson | Existing Learning Core ordering | First published current-level lesson without completed lesson progress |
| Domain availability | `vocabulary_items`, `grammar_topics`, `listening_items`, `reading_items` | Count of `status: "published"` documents |
| Grammar, Listening, Reading completion | Published domain content plus `LearnerDomainProgress` | Explicit `completed` records divided by published content count |
| Vocabulary state | Published vocabulary plus `LearnerDomainProgress` | `known` and `learning` records remain separate; no mastery score is created |
| Practice accuracy | Completed Practice Engine sessions and embedded result totals | `correctCount / totalCount`; displayed only when at least five total answers exist |
| Recent practice evidence | Embedded attempts in the latest 50 completed sessions | Submitted attempts in the last 14 UTC days; fewer than five is insufficient, five through nine is developing, ten or more is reliable |
| Active days | Successful source records in the last 30 UTC calendar days | Distinct UTC calendar dates across bounded lesson, practice, domain, and valid Speaking records |
| Speaking activity | `ai_speaking_attempts` | Count only `status: completed` attempts with transcript and feedback; no score is derived |

No response-time, topic, difficulty, skill taxonomy, improvement, or unsupported Speaking metric is displayed because the authoritative records do not provide those semantics.

## 3. Personalization Architecture

Pure deterministic calculations live in `src/lib/progress/rules.ts`. Database access and DTO assembly live in `src/lib/db/progress-dashboard.ts`. The UI only renders the server-derived result.

The recommendation function receives current learning position, domain summaries, practice evidence, and completed practice history. It does not call an AI provider, use randomness, create a persisted recommendation, or assign an arbitrary weighted domain score.

A recommendation is a small explainable object containing a fixed type, priority, reason code, target path, and optionally the current lesson title or target domain. The UI maps reason codes to bilingual messages.

## 4. Recommendation Rules

Rules are evaluated in this fixed order:

1. **Priority 100 — Continue current Learning Core lesson.** If a next published current-level lesson exists, it always wins.
2. **Priority 80 — Return to Practice.** Requires at least five recent submitted attempts in the 14-day UTC window and recent accuracy below 60%. Practice evidence is overall only; no topic weakness is claimed.
3. **Priority 60 — Continue an unfinished domain.** Requires an existing in-progress state, published content, and unfinished explicit content. Stable order is Grammar, Listening, then Reading.
4. **Priority 50 — Review Vocabulary.** Requires at least one Vocabulary item in the authoritative `learning` state.
5. **Priority 40 — Return to Practice.** Applies when there is completed practice history but no stronger attention signal.
6. **No recommendation.** Returned when there is not enough supported evidence.

Thresholds are inclusive at the evidence boundary: five attempts is enough for developing evidence and ten is enough for reliable evidence. Ties are stable because the rule order is fixed. User-facing reasons avoid unsupported claims and do not mention hidden implementation details.

## 5. Analytics Architecture

Phase 8 implements observational analytics as bounded server-derived dashboard metrics. It deliberately does not create an event collection or a client event stream. This avoids duplicating authoritative business data and avoids UI-noise events such as page views, clicks, retries, recording starts, or feedback views.

Activity signals are read after the existing business records have been written:

- completed Learning Core lessons;
- completed Practice Engine sessions;
- saved domain progress updates;
- valid completed Speaking attempts.

The activity window is the last 30 UTC calendar days. Each source query is capped at 500 records. Failed, cancelled, invalid, and provider-unavailable Speaking attempts do not become learner-failure analytics. Because Phase 8 adds no analytics write, there is no analytics-write failure that can roll back a successful mutation. A future persistence requirement would need a separate bounded, validated, idempotent design.

## 6. Database Models

No new database model was added. Existing models remain authoritative:

- `LessonProgress` in `learning_lesson_progress`;
- `PracticeSession` in `practice_sessions`, including embedded attempts and result;
- `LearnerDomainProgress` in `learner_domain_progress`;
- `VocabularyItem` in `vocabulary_items`;
- `GrammarTopic` in `grammar_topics`;
- `ListeningItem` in `listening_items`;
- `ReadingItem` in `reading_items`;
- `SpeakingAttempt` in `ai_speaking_attempts`;
- onboarding profile and Better Auth session records through existing boundaries.

Historical progress remains intact when content is archived. Published content is used for current denominators and current obligations.

## 7. Query Workload

`getProgressDashboardData` connects through the existing Mongoose boundary and performs bounded, learner-scoped reads:

- one existing Learning Core home read for the onboarding level;
- four parallel published-content count queries;
- four learner domain aggregation queries that join only the learner’s states to the named published content collection;
- one Practice Engine result aggregation for completed sessions;
- one Practice Engine query for the latest 50 completed sessions and embedded attempts;
- four activity source queries over the last 30 UTC days, each limited to 500 records and projecting only its timestamp;
- two Speaking count queries for valid completions and provider-unavailable failures.

The queries use projections where history is read, fixed limits for recent samples, date windows for activity, and authenticated user predicates. There is no unbounded history returned to the browser.

## 8. Index Decisions

One justified index was added to `PracticeSession`:

```text
{ userId: 1, status: 1, completedAt: -1 }
```

It supports the Phase 8 completed-session aggregation predicate and the latest-completed-session read. Existing indexes support the other workloads:

- Learning Core progress has user/status/update and unique user/lesson indexes.
- Domain progress has user/domain/content uniqueness and user/domain/update ordering.
- Speaking attempts have user/created and user/scenario/created indexes.
- Published content models already index their publication and ordering paths.

No analytics collection, speculative index, or index for an unsupported workload was added.

## 9. Server Actions

No new Phase 8 Server Action was necessary. The dashboard is observational and has no user mutation of its own.

Existing authoritative Server Actions remain the only mutation boundaries for lesson completion, practice start/submit, Vocabulary, Grammar, Listening, Reading, and Speaking lifecycle operations. They continue to derive identity from the server session, validate their own inputs, enforce published-content and ownership rules, persist authoritative business data, and revalidate their routes.

There is no client-authoritative progress update and no analytics action that could duplicate a business mutation.

## 10. Server Reads / Aggregations

The protected page calls:

```text
requireLearner(locale)
→ getProgressDashboardData(session.user.id, profile.level)
→ getLearningHomeData
→ published domain counts + published learner-state aggregation
→ PracticeSession result aggregation + bounded recent attempts
→ bounded successful activity source reads
→ valid Speaking counts
→ pure practice summary and recommendation rules
→ server-rendered ProgressDashboard
```

The domain aggregation uses the explicit MongoDB collection names `vocabulary_items`, `grammar_topics`, `listening_items`, and `reading_items` and filters looked-up content to `status: "published"`. Speaking validity requires a completed lifecycle result with transcript and feedback. Failed/provider-unavailable records are not used as weakness evidence.

## 11. Validation

Passed:

- TypeScript: `npx tsc --noEmit`.
- ESLint: `npm run lint`.
- Production build: `NODE_OPTIONS=--max-old-space-size=1536 NEXT_TELEMETRY_DISABLED=1 npm run build` (compiled, typechecked, and listed `/[locale]/progress`).
- Pure Phase 8 rules: `npm run test:progress`.
- Existing Practice regression suite: `npm run test:practice`.
- Existing domain regression suite: `npm run test:domains`.
- Existing Speaking regression suite: `npm run test:speaking`.

The unit tests compile and exercise pure calculation code without requiring MongoDB. No authenticated database integration test was claimed.

The execution environment cannot access the user's local MongoDB instance at localhost:27017.

## 12. Tests

`tests/progress/rules.test.mjs` covers:

- deterministic percentage rounding and zero-denominator behavior;
- the five-answer accuracy display threshold;
- insufficient, developing, and reliable recent evidence thresholds;
- the 14-day recent window;
- current-lesson recommendation priority;
- stable Grammar → Listening → Reading tie-breaking;
- in-progress evidence requirements;
- Vocabulary review and practice-history fallback behavior.

Analytics validation, idempotency, and failure-isolation tests are not applicable to a persisted analytics writer because Phase 8 intentionally adds no analytics mutation or event collection. The source records already retain business history through their existing authoritative mutations.

## 13. Browser Validation

NOT RUN. No authenticated browser session with MongoDB-backed learner data was available. Guest/protected redirect behavior was not re-run as a Phase 8 browser claim.

## 14. Hard Refresh

NOT RUN for the authenticated Progress route. The page is implemented as a Server Component, but a real hard-refresh runtime result is not claimed.

## 15. Back / Forward

NOT RUN for an authenticated Progress session. No browser history behavior is claimed.

## 16. Responsive

NOT RUN in a real browser at 320, 390, 768, 1024, or 1440 pixel viewports. The UI uses the existing responsive grid and spacing classes, but no runtime responsive result is claimed.

## 17. RTL/LTR

NOT RUN in a real browser for Persian and English. The route uses existing `next-intl` locale routing, localized messages, and direction-aware classes, but no browser-level RTL/LTR result is claimed.

## 18. Theme

NOT RUN in a real browser for Light, Dark, or System themes. The dashboard reuses existing semantic theme tokens, but no runtime theme result is claimed.

## 19. Console / Network

NOT RUN in an authenticated browser. No browser console, network waterfall, hydration, or MongoDB request result is claimed.

## 20. Dependency Changes

No dependency was added, removed, upgraded, or downgraded.

`package.json` gained only the `test:progress` script. Existing Next.js, React, Mongoose, MongoDB, Better Auth, Zod, next-intl, UI primitives, and theme systems were reused.

## 21. Files Changed

Added:

- `src/lib/progress/types.ts`
- `src/lib/progress/rules.ts`
- `src/lib/db/progress-dashboard.ts`
- `src/components/progress/progress-dashboard.tsx`
- `src/app/[locale]/(protected)/progress/page.tsx`
- `tests/progress/rules.test.mjs`
- `docs/phase-8-report.md`

Updated:

- `src/models/practice/session.ts` — justified completed-session index.
- `src/proxy.ts` — protected `/progress` matcher.
- `src/components/public/authenticated-nav.tsx` — Progress navigation link.
- `messages/en.json`, `messages/fa.json` — bilingual Progress messages.
- `package.json` — `test:progress` script.
- `docs/architecture.md`, `docs/project-state.md` — Phase 8 architecture and state records.

## 22. Known Limitations

- MongoDB-backed authenticated runtime validation was not possible in this environment.
- No live learner data was available, so no populated dashboard, authenticated route, mutation, or aggregate output was claimed.
- Activity signals are observational and capped at 500 records per source in the 30-day UTC window. The dashboard does not claim an unlimited historical activity total.
- Practice history does not contain supported topic, skill, difficulty, response-time, or improvement fields; recommendations remain overall and evidence-threshold based.
- Speaking remains informational and provider-neutral. No valid AI output is assumed, no provider is configured, and no Speaking score is fabricated.
- The current-level lesson completion summary intentionally follows the existing Learning Core home boundary rather than introducing a cross-level curriculum score.
- No persisted recommendation or analytics event history exists; this is intentional for the current Phase 8 requirements and access patterns.

## 23. Next Phase

Phase 8 stops here. Phase 9 — Admin + Production Audit — is not started. No Phase 9 implementation, admin UI, CMS, production audit, billing, subscription, or external analytics work was performed.
