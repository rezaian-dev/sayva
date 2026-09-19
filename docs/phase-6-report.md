# SAYVA Phase 6 Report

## 1. Phase Summary

Phase 6 implements Vocabulary, Grammar, Listening, and Reading as four separate domain modules over the existing SAYVA Learning Core, Practice Engine, Better Auth, MongoDB/Mongoose, Server Actions, Zod, next-intl, theme, UI primitives, and RTL/LTR architecture. The work stops before Phase 7 — AI Speaking.

Each domain has strict content types/models, published-only bounded reads, localized structured data, minimal learner state, an independently authenticated Server Action, focused validation, pure deterministic rules, and server-rendered home/detail UI. No fake content, fake database success, or fabricated authenticated runtime result was added.

## 2. Vocabulary

Vocabulary content supports localized presentation, definitions, translations, examples, part of speech, level association, optional pronunciation metadata, and an optional published PracticeSet relationship. Learner state is intentionally minimal: `new`, `learning`, or `known`.

Vocabulary state is separate from Learning Core lesson progress. The pure rule module performs meaningful deterministic normalization and keeps `known` as a learner-selected state, not a mastery or adaptive-learning claim. The detail UI renders the word, localized fields, examples, optional pronunciation information, practice entry, and a narrow client form for state mutation.

## 3. Grammar

Grammar topics support localized explanations, examples, optional common mistakes, level association, and an optional published PracticeSet relationship. Learner state is `in_progress` or `completed`.

The completion rule is explicit and deterministic. `completed` means the learner marked the topic reviewed; it does not claim mastery, prediction, adaptive scheduling, or permanent knowledge. Grammar practice links enter the existing Practice Engine only.

## 4. Listening

Listening content supports localized metadata, a repository-local audio source, optional duration, transcript content, transcript visibility control, and an optional published PracticeSet relationship.

The detail view uses a narrow Client Component around native browser audio with `controls` and `preload="metadata"`. It does not autoplay, record, use speech recognition, analyze pronunciation, or persist play/pause/seek analytics. The UI includes a missing-source fallback, an error message, keyboard-accessible native controls, transcript reveal, and an explicit completion form. A few seconds of playback never completes the activity.

## 5. Reading

Reading content supports localized metadata and semantic ordered sections rather than arbitrary HTML or JSX. Sections render as headings, paragraphs, lists, or quotes with readable typography and an optional published comprehension PracticeSet relationship.

Reading progress is `in_progress` or `completed`. Completion is an explicit server action. Scroll position, viewport position, and time-on-page are not used as completion signals. The detail view includes structured content, practice entry when available, and explicit progress controls.

## 6. Shared Architecture

The implementation reuses the existing architecture rather than adding a parallel system:

- Server Components perform initial domain reads.
- Narrow Client Components handle form/action feedback and browser audio state only.
- Better Auth is the only authentication authority.
- Mongoose is used for SAYVA-owned content and domain-progress records.
- Server Actions are the only learner mutation boundary.
- Zod validates untrusted mutation input again on the server.
- The existing Practice Engine remains the only session, submission, evaluation, attempt, and result engine.
- Domain modules provide content/context and optional published practice relationships; they do not duplicate practice execution.

## 7. Database

Added strict collections/models for:

- `vocabulary_items`
- `grammar_topics`
- `listening_items`
- `reading_items`
- `learner_domain_progress`

`learner_domain_progress` uses a domain discriminator and a unique `(userId, domain, contentId)` index. It stores only the authenticated owner, domain, content reference, minimal state, timestamps, and no score, correctness, adaptive interval, streak, XP, or mastery prediction.

Content queries require `status: "published"` and are bounded to 24 list records. Practice relationships are resolved only when the related PracticeSet is published. Listening source validation accepts only repository-local `/audio/...` paths; no remote CDN or external storage was added.

## 8. Server Actions

Four independently protected actions were added:

- `updateVocabularyState`
- `updateGrammarProgress`
- `updateListeningProgress`
- `updateReadingProgress`

Each action independently authenticates through the existing Better Auth session/profile boundary, validates its form data with its domain Zod schema, verifies the target content is still published, derives ownership from the session, performs an idempotent atomic progress upsert, and revalidates the affected locale route.

The browser supplies only a content identifier and requested state. It cannot supply the user id, ownership, content publication authority, correctness, score, completion authority, or answer key.

## 9. Validation

Validation is layered:

- Mongoose schemas enforce strict persisted content/progress shapes and indexes.
- Domain Zod schemas validate only the narrow mutation fields.
- Pure rule modules cover vocabulary normalization/state and explicit completion rules.
- Server Actions repeat authentication, publication, and ownership checks regardless of client behavior.
- UI validation and action feedback are convenience layers, not authorization.

No generic repository/service/manager layer or giant cross-domain schema was introduced.

## 10. Client / Server Boundaries

Initial domain reads and content rendering are Server Components. Client Components are limited to:

- Vocabulary state submission and action feedback.
- Grammar, Listening, and Reading progress submission and action feedback.
- Native listening audio media state and error handling.

No initial client-side content fetch, client-authoritative progress, browser-owned user identity, local completion shortcut, or duplicated API layer was added.

## 11. RTL/LTR

The existing locale-prefixed `fa` and `en` routing, locale layout, direction handling, localized messages, and locale-aware navigation are reused. Persian renders RTL and English renders LTR through the established document boundary. Domain labels, states, errors, navigation, metadata, and action feedback have English and Persian message entries.

Directional layout uses logical spacing and flex/grid patterns rather than hard-coded left/right assumptions. No separate per-locale component system was created.

## 12. Theme

The existing Light/Dark/System `next-themes` provider and semantic SAYVA design tokens are reused. Domain components use existing `Container`, `Card`, `Button`, `Badge`, typography, border, foreground, muted, destructive, and success token classes. No page-specific color system or theme fork was introduced.

## 13. Responsive

Domain layouts use the existing responsive container and grid patterns, wrap action controls, readable measure, and flexible cards. The implementation avoids fixed-width media/content shells and horizontal overflow in the authored markup.

The required authenticated browser viewport checks at 320, 390, 768, 1024, and 1440px were not run because the environment could not provide an authenticated MongoDB-backed learner/content state. This is reported as not run, not passed.

## 14. Hard Refresh

Hard-refresh behavior for authenticated domain pages was not run. The pages are designed as server-rendered route reads and progress is persisted server-side, but no authenticated database-backed browser result is claimed.

## 15. Back / Forward

Back/forward behavior for authenticated domain pages was not run. Locale-prefixed route URLs and server-rendered route boundaries are implemented, but the required browser result remains not validated without authenticated runtime data.

## 16. Browser Console

No authenticated Phase 6 browser console run was performed. The guest HTTP boundary was checked with the existing development server, but an HTTP redirect is not a browser-console validation result. No console-clean claim is made for authenticated domain flows.

## 17. Audio Validation

The code path was validated by production typecheck/build, including the native-audio component and local-source constraints. Live playback, missing-file load failure, fallback link behavior, keyboard playback, and browser media error behavior were not run in an authenticated browser.

The repository currently contains no published local audio asset. The implementation accepts only repository-local `/audio/...` paths and documents the missing-source/error behavior honestly. No audio result was fabricated.

## 18. Automated Tests

Passed:

- `npm run test:practice` — 6 existing deterministic Practice Engine tests.
- `npm run test:domains` — 3 Phase 6 tests covering vocabulary Unicode/whitespace/case normalization, vocabulary state recognition, and explicit Grammar/Listening/Reading completion rules.
- `npx tsc --noEmit`.
- `npm run lint`.
- `NODE_OPTIONS=--max-old-space-size=2048 npm run build`.

The production build completed successfully with Next.js 16.3.5, TypeScript completed, and 35 routes were generated/listed. No MongoDB-backed runtime test was run.

## 19. Dependency Changes

No dependencies were added, removed, updated, or downgraded for Phase 6. The existing Better Auth, MongoDB, Mongoose, Zod, React Hook Form, Next.js, React, next-intl, theme, UI primitives, and Practice Engine dependencies were reused.

## 20. Files Changed

Primary Phase 6 additions/updates:

- `src/models/domain/*`
- `src/models/vocabulary/*`
- `src/models/grammar/*`
- `src/models/listening/*`
- `src/models/reading/*`
- `src/lib/domains/*`
- `src/lib/db/domain-common.ts`
- `src/lib/db/vocabulary.ts`
- `src/lib/db/grammar.ts`
- `src/lib/db/listening.ts`
- `src/lib/db/reading.ts`
- `src/lib/vocabulary/rules.ts`
- `src/lib/grammar/rules.ts`
- `src/lib/listening/rules.ts`
- `src/lib/reading/rules.ts`
- `src/actions/vocabulary.ts`
- `src/actions/grammar.ts`
- `src/actions/listening.ts`
- `src/actions/reading.ts`
- `src/validation/vocabulary/*`
- `src/validation/grammar/*`
- `src/validation/listening/*`
- `src/validation/reading/*`
- `src/components/domains/*`
- `src/components/vocabulary/*`
- `src/components/grammar/*`
- `src/components/listening/*`
- `src/components/reading/*`
- `src/app/[locale]/(protected)/vocabulary/**/page.tsx`
- `src/app/[locale]/(protected)/grammar/**/page.tsx`
- `src/app/[locale]/(protected)/listening/**/page.tsx`
- `src/app/[locale]/(protected)/reading/**/page.tsx`
- `src/proxy.ts`
- `messages/en.json`
- `messages/fa.json`
- `tests/domains/rules.test.mjs`
- `package.json`
- `docs/architecture.md`
- `docs/project-state.md`
- `docs/phase-6-report.md`

## 21. Known Limitations

1. The repository has no approved domain content seed or content-authoring UI, so domain home pages honestly render empty states until published MongoDB documents exist.
2. MongoDB runtime validation is unavailable in this environment.
3. Authenticated domain reads, progress persistence, repeated/concurrent mutation behavior, published-only records, hard refresh, back/forward, browser console, keyboard, responsive viewports, and audio playback remain not run.
4. The repository currently has no published local audio asset.
5. Practice relationship links can be rendered only when actual published PracticeSet records exist.

The required MongoDB limitation is:

> The execution environment cannot access the user's local MongoDB instance at localhost:27017.

## 22. Next Phase

Stop here. Phase 7 — AI Speaking — is next but was not started. No Speaking, recording, speech recognition, pronunciation analysis, AI Practice, adaptive learning, personalization, analytics, achievements, streaks, XP, gamification, admin, CMS, subscriptions, payments, search infrastructure, or content-authoring work was included in Phase 6.
