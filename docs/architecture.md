# SAYVA Architecture

**Status:** Greenfield Phase 0 blueprint, implemented through the final planned Phase 9; production runtime controls are documented with environment limitations  
**Product:** Bilingual English-learning platform (Persian RTL / English LTR)  
**Current framework baseline:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4

## Architectural decisions

- **Server-first App Router:** Server Components by default. Client Components are limited to interactive UI, browser APIs, theme switching, Motion, and form interaction.
- **Routing and i18n:** `next-intl` with locale-prefixed routes (`/fa`, `/en`), Persian as the default locale. The locale layout owns `lang`, `dir`, metadata, messages, and static locale generation.
- **Styling:** Tailwind CSS v4 plus shadcn/ui source components in `src/components/ui/`. Semantic CSS variables are the only product color API. Raw brand colors are represented in the token layer, not scattered through components.
- **Typography:** Self-hosted `Vazirmatn` Arabic/Persian subset and `Inter` Latin subset via `next/font/local`. No Google Fonts, CDN fonts, or external font stylesheet.
- **Themes:** `next-themes`, mounted once in the locale layout with Light/Dark/System, `class` strategy, `suppressHydrationWarning`, and transition suppression during changes.
- **Icons:** Lucide React only. Decorative icons are `aria-hidden`; icon-only buttons have accessible labels.
- **Motion:** `motion` (`motion.dev`) only for meaningful interaction. Shared variants live in `src/lib/motion.ts`; interactive usages use `useReducedMotion()`.
- **Forms:** React Hook Form + Zod. Domain schemas live in `src/validation/`. Client validation is UX; every Server Action validates again on the server.
- **Authentication authority:** Better Auth is the only authentication authority. It owns account identity, password hashing, authentication cookies, sessions, and token lifecycle. No custom auth/session store exists.
- **Auth integration:** `src/lib/auth/auth.ts` is the server configuration, `src/lib/auth/client.ts` is the browser-only helper, and `/api/auth/[...all]` is mounted with `toNextJsHandler`. `nextCookies()` is the final Better Auth plugin so Server Actions can carry auth cookies when needed.
- **Server sessions:** `src/lib/auth/session.ts` is the single server session access point. It resolves Better Auth sessions through `auth.api.getSession({ headers: await headers() })`. Initial authenticated navigation and protected pages use this server result; there is no client-side session correction or auth flash workaround.
- **Database boundary:** `src/lib/db/mongodb.ts` is server-only. Better Auth uses the official MongoDB adapter with the native driver; SAYVA-owned onboarding and learning data use Mongoose. All database access uses the approved `MONGODB_URI=mongodb://localhost:27017/` baseline. The local Better Auth adapter is configured without transactions because the approved local instance is expected to be standalone.
- **Application ownership:** Better Auth owns account identity. `OnboardingProfile` owns onboarding fields. Learning models own curriculum structure and learner lesson progress, with progress keyed by the authenticated Better Auth user id.
- **Mutations:** `src/actions/onboarding.ts` persists onboarding, `src/actions/learning.ts` persists lesson completion, `src/actions/practice.ts` starts sessions and submits answers, and the domain actions update Vocabulary, Grammar, Listening, and Reading learner state. Each action authenticates, authorizes, validates, enforces domain rules, persists, and revalidates affected server-rendered paths. The browser never supplies the owner id, correctness, score, or answer key.
- **Authentication protection:** `src/proxy.ts` composes next-intl locale routing with an optimistic Better Auth cookie check for `/[locale]/app`, `/[locale]/onboarding`, `/[locale]/learn/**`, `/[locale]/practice/**`, `/[locale]/progress`, the four Phase 6 domain surfaces, and `/[locale]/speaking/**`. The proxy is not a security boundary. Each protected page resolves the server session and onboarding ownership independently; each protected Server Action checks its own authorization.
- **AI:** AI Speaking is isolated behind the server-only provider-neutral boundary in `src/lib/ai/`. Phase 0–6 did not approve a provider, so no provider SDK, key, prompt, or fake fallback is included. AI output cannot authoritatively change curriculum, progress, account, history, or achievements.
- **State:** Server state first; URL state for shareable/filterable state; React Hook Form state for forms; local component state for ephemeral UI. No global state library.

## Workspace responsibilities

```text
src/
├── actions/
│   ├── onboarding.ts     Authenticated onboarding persistence
│   ├── learning.ts       Idempotent lesson completion
│   ├── practice.ts       Authenticated practice session and answer mutations
│   ├── vocabulary.ts     Vocabulary learner-state mutation
│   ├── grammar.ts        Grammar learner-state mutation
│   ├── listening.ts      Listening learner-state mutation
│   ├── reading.ts        Reading learner-state mutation
│   └── speaking.ts       Speaking attempt start/cancel mutations
├── app/[locale]/         Public, auth, and protected locale routes
│   ├── (auth)/           Sign-in and sign-up screens
│   ├── (protected)/      App redirect, onboarding, and learning routes
│   ├── (admin)/          Authenticated, server-authorized Admin routes
│   └── layout.tsx        Locale, direction, providers, public shell, session-aware nav
├── app/api/auth/         Better Auth catch-all route handler
├── components/ui/        shadcn/ui primitives
├── components/          SAYVA-wide shared components and providers
│   ├── auth/             Auth shell, forms, and Better Auth logout control
│   ├── learning/         Curriculum, lesson, navigation, and completion UI
│   ├── practice/         Practice set, session, question, result, and input UI
│   ├── domains/          Shared domain navigation, progress, and practice entry UI
│   ├── vocabulary/       Vocabulary list/detail and learner-state UI
│   ├── grammar/          Grammar topic list/detail and progress UI
│   ├── listening/        Listening list/detail and native audio UI
│   ├── reading/          Reading list/detail and semantic content UI
│   ├── speaking/         Speaking scenario, recording, transcript, and feedback UI
│   ├── onboarding/       Onboarding form interaction
│   └── admin/            Admin shell, bounded tables, and explicit editors
│   └── public/           Public shell and server-rendered session-aware navigation
├── fonts/                Vendored woff2 files and licenses
├── i18n/                 next-intl routing, request configuration, navigation
├── lib/
│   ├── auth/             Better Auth server config, browser helper, session helper
│   ├── db/               Native Better Auth Mongo boundary and server-side data access
│   ├── ai/               Server-only provider-neutral Speaking AI contract
│   ├── domains/          Shared learner-state access, rules, and DTO types
│   ├── learning/         Learning paths, access, localization, constants, and DTO types
│   ├── vocabulary/       Vocabulary normalization and domain rules
│   ├── grammar/          Grammar completion rules
│   ├── listening/        Listening completion rules
│   ├── reading/          Reading completion rules
│   └── onboarding/       Shared onboarding option constants with no server-only imports
│   └── admin/             Admin role checks and bounded management reads
├── models/
│   ├── learning/         Level, course, unit, lesson, and lesson-progress models
│   ├── practice/         Practice set, discriminated exercises, and embedded sessions
│   ├── domain/           Shared learner-domain progress model
│   ├── vocabulary/       Vocabulary content model
│   ├── grammar/          Grammar topic content model
│   ├── listening/        Listening content model
│   ├── reading/          Reading content model
│   └── speaking/         Speaking scenario and attempt models
├── validation/
│   ├── auth.ts           Auth schemas
│   ├── onboarding.ts     Onboarding schema
│   ├── learning/         Learning mutation schemas
│   ├── vocabulary/       Vocabulary state schema
│   ├── grammar/          Grammar progress schema
│   ├── listening/        Listening progress schema
│   ├── reading/          Reading progress schema
│   └── speaking/         Speaking scenario, audio, attempt, and feedback schemas
├── proxy.ts              Locale negotiation and optimistic protected-route gate
└── types/                Cross-cutting TypeScript augmentation
messages/                 fa/en message catalogs
docs/                     Architecture and project-state records
```

## Route map

```text
/[locale]                                      Public homepage
/[locale]/features                             Public product capabilities
/[locale]/experience                           Public learning experience
/[locale]/about                                Public SAYVA point of view
/[locale]/faq                                  Public FAQ
/[locale]/sign-in                              Better Auth email/password sign-in UI
/[locale]/sign-up                              Better Auth email/password sign-up UI
/[locale]/onboarding                            Authenticated, incomplete onboarding
/[locale]/app                                  Stable authenticated entry redirect to /learn
/[locale]/learn                                Authenticated learning home
/[locale]/learn/[level]                        Published level curriculum
/[locale]/learn/[level]/[course]              Published course units
/[locale]/learn/[level]/[course]/[unit]       Published unit lessons
/[locale]/learn/[level]/[course]/[unit]/[lesson]
                                               Published lesson experience
/[locale]/practice                              Authenticated practice home
/[locale]/practice/[practiceSetId]             Practice session
/[locale]/practice/[practiceSetId]/results     Latest completed practice result
/[locale]/progress                              Derived learner progress dashboard
/[locale]/vocabulary                           Authenticated vocabulary home
/[locale]/vocabulary/[vocabularyId]            Vocabulary detail
/[locale]/grammar                              Authenticated grammar home
/[locale]/grammar/[grammarTopicId]             Grammar topic detail
/[locale]/listening                            Authenticated listening home
/[locale]/listening/[listeningId]              Listening detail
/[locale]/reading                              Authenticated reading home
/[locale]/reading/[readingId]                  Reading detail
/[locale]/speaking                              Authenticated speaking library
/[locale]/speaking/[scenarioId]                Speaking scenario and recorder
/[locale]/speaking/[scenarioId]/results/[attemptId]
                                               Persisted speaking transcript/feedback result
/admin                                        Authenticated Admin overview and management surface
/admin/curriculum                              Explicit level/course/unit/lesson management
/admin/practice                                Practice set/exercise management where models support it
/admin/[domain]                                Vocabulary, Grammar, Listening, Reading, Speaking management
/api/auth/[...all]                             Better Auth handler
/robots.txt                                    Crawl policy
/sitemap.xml                                   Localized public sitemap
```

## Route and provider boundary

`src/proxy.ts` first protects `/app`, `/onboarding`, `/learn`, `/practice`, `/progress`, `/vocabulary`, `/grammar`, `/listening`, `/reading`, `/speaking`, and `/admin` route surfaces optimistically with the Better Auth session cookie and then delegates locale negotiation to next-intl. It never treats cookie presence as authoritative authentication. Protected learner pages perform their own server-side session and onboarding checks; Admin pages call `requireAdmin` and Admin mutations call `getAdminAccess` independently. All redirect with the active locale.

`src/app/[locale]/layout.tsx` validates the locale, sets document direction, loads messages, and mounts exactly the existing cross-application providers:

1. `ThemeProvider` — next-themes only.
2. `NextIntlClientProvider` — exposes request messages to Client Components.
3. `DirectionProvider` — shadcn/Radix direction context for direction-aware primitives.

`TooltipProvider` is mounted once because the tooltip primitive requires a shared provider. It is not a general application provider.

The server-rendered `SiteHeader` reads the same server session helper as protected routes. Guests receive sign-in/sign-up links; authenticated users receive the learning, progress, practice, speaking, and Better Auth sign-out controls in the initial HTML. No `useEffect`, mounted flag, timer, opacity trick, reload, or client auth hook repairs the first render.

## Learning Core

The Learning Core is the source of truth for curriculum availability, lesson ordering, lesson content, lesson completion, and the learner's current position. The data hierarchy is:

```text
Level
  ↓
Course / Learning Path
  ↓
Unit
  ↓
Lesson
  ↓
Embedded localized content blocks
```

The curriculum models are data-driven and do not embed lesson trees in React components. Each structural model has explicit `order` and `status` fields. Learner reads query only `published` records and verify every parent relationship, so draft and archived content is not exposed. No arbitrary lock rule is implemented: every published lesson in the authorized curriculum is available.

Levels support CEFR-style `code` values such as `A1` through `C2` without hard-coding the set into the UI. Their `slug` is the data key used to match the Phase 3 onboarding starting-level value. If no published level matches the learner's persisted starting level, the learning home shows an honest empty current path rather than silently selecting a different level.

Lessons contain only instructional content blocks with the minimal supported kinds: introduction, explanation, example, and summary. Each block has a stable key, explicit order, localized title/body, and kind. No question, answer, choice, attempt, score, or exercise engine exists in Phase 4.

`src/lib/db/learning.ts` performs server-side reads for the learning home, level, course, unit, and lesson pages. It joins published records by Mongoose relationships, loads only the authenticated learner's progress, and maps database documents into server-rendered DTOs. No internal learning API route or client `useEffect` data-fetching loop was added.

## Progress and current position

`LessonProgress` stores the minimum required learner state:

```text
userId
lessonId
status: in_progress | completed
startedAt
completedAt
createdAt
updatedAt
```

A unique MongoDB/Mongoose index on `{ userId, lessonId }` prevents duplicate progress documents. Completion is idempotent: repeated submissions update the same record, and a concurrent duplicate-key race retries as a non-upserting update.

At this phase, current position is deterministic rather than a separate recommendation system. For the learner's published onboarding level, the current lesson is the first ordered lesson that is not completed. If no matching published level exists, no alternate level is selected. If every published lesson is complete, the current lesson is null.

`completeLesson` accepts only a lesson id from the browser. It derives user identity from Better Auth, verifies completed onboarding, verifies that the lesson and every curriculum parent is published, validates the id with Zod, upserts progress, and revalidates the learning route family. It never trusts a browser-supplied user id or completion state.

## Onboarding ownership and validation

Onboarding asks only for the current English level and primary goal needed at this phase. The account name and email remain Better Auth-owned identity data. A successful Server Action upserts one `sayva_onboarding_profiles` record by authenticated user id and sets `completedAt`; protected learning access requires that persisted completion marker.

React Hook Form and the existing shadcn/ui Field and Radio Group primitives provide client UX. Zod schemas remain authoritative on the server. No completion state is inferred from localStorage or client-only state.

## Practice Engine

Phase 5 adds a reusable deterministic Practice Engine without changing Learning Core ownership. Learning Core remains the source of truth for curriculum hierarchy and `LessonProgress`; Practice Engine owns practice sets, exercise content, authenticated sessions, embedded attempts, deterministic evaluation, scoring, and result summaries.

### Content model and extension boundary

A published `PracticeSet` references a published `LearningLesson` but does not copy or own lesson progress. Published `PracticeExercise` documents use Mongoose discriminators with the explicit `exerciseType` key. The first useful deterministic subset is intentionally small:

```text
multiple-choice → known option ids + one server-only correct option id
fill-blank      → server-only accepted answer strings + deterministic normalization
matching        → left/right items + server-only pair map
ordering        → items + server-only correct order
```

Each child discriminator has its own payload fields; there is no generic document with unrelated optional answer fields. The models and evaluator are deliberately closed over these four types. Translation can be represented later through explicit accepted translations and normalization; Listening, Reading, Speaking, contextual, and AI exercise families are extension boundaries, not Phase 5 products.

`toPublicExercise` maps only prompt, instruction, and learner interaction data into the Client Component. Correct option ids, accepted answers, pair maps, and correct order arrays stay in server-side queries and evaluation code. The browser sends only a validated session id, exercise id, and typed response JSON.

### Session, attempt, and result persistence

`PracticeSession` is the authoritative learner session document:

```text
userId
practiceSetId
exerciseOrder[]        server-created deterministic order
currentIndex           persisted progress cursor
status: active | completed
attempts[]             embedded historical attempt records
result                 embedded completed-session summary
startedAt / completedAt
```

An embedded attempt is the actual equivalent of a separate `PracticeAttempt` entity. It records learner id, session id, exercise id, exercise type, normalized response, correctness, evaluation version, and timestamp. Embedding attempts keeps answer persistence, session advancement, completion, and result creation atomic on the approved standalone MongoDB topology. The session document is bounded by the practice set's fixed exercise list; no unbounded event log or analytics stream is introduced.

Starting a session reads published exercises in `{ order: 1, _id: 1 }` order and persists that array. There is no random ordering. A partial unique index permits only one active session per learner and practice set; a duplicate-key race returns the already-active boundary. A retry after completion creates a new active session and never mutates the historical completed session.

Submitting an answer is a server-only conditional update. The action authenticates Better Auth, verifies completed onboarding, validates ids and typed response with Zod, checks session ownership/status, requires the next unanswered exercise, loads the published exercise, evaluates it on the server, and appends one normalized attempt only when that exercise is still unanswered. The update pipeline derives `status`, `currentIndex`, `result`, and `scorePercent` from the post-append attempt array. A repeated or concurrent submission returns the existing attempt result or an explicit safe boundary; it cannot replace a historical attempt or supply correctness/score from the client.

### Evaluation and score rules

`src/lib/practice/evaluate.ts` is pure and deterministic. Fill-blank normalization applies Unicode NFC normalization, trimming, whitespace collapsing, and optional case folding. Matching compares complete left/right pair sets independent of response order. Ordering requires the complete known item set in the exact correct order. Invalid or unknown ids are incorrect/invalid and never reveal answer keys. The score is `round(correct / total * 100)` and completion requires `answered >= total` for a non-empty session.

### Read/mutation and UI boundaries

Normal practice reads are Server Component reads through `src/lib/db/practice.ts`. Only the question interaction is a Client Component, using local temporary response state and `useActionState` for the Server Action result. It never renders optimistic correctness, score, completion, or answer keys. The localized protected routes are `/practice`, `/practice/[practiceSetId]`, and `/practice/[practiceSetId]/results`. The interaction supports keyboard-native radio/input/select controls and ordering up/down buttons rather than drag-only interaction. Feedback is announced with `role="status"` and `aria-live`, and the next/result control receives focus on result.

### Learning integration boundary

Practice sets link to published lessons for discovery and parent authorization, but practice submissions never update `LessonProgress`. A learner can complete a practice session without silently completing a lesson. Future lesson-entry affordances can link to a PracticeSet without duplicating progress ownership.

## Domain layer: Phase 6

Phase 6 adds four separate published-content domains without replacing Learning Core ownership. Vocabulary, Grammar, Listening, and Reading each have their own strict Mongoose content model, bounded published-only DB read module, DTOs, validation, server action, and focused UI. Shared learner state is stored in `learner_domain_progress` with a unique `(userId, domain, contentId)` boundary; it is not lesson progress.

Vocabulary state is intentionally minimal: `new`, `learning`, or `known`. Grammar, Listening, and Reading use `in_progress` or `completed`. A missing record means not started for the latter three. Completion is explicit: reading does not infer completion from scroll and listening does not infer completion from playback time.

All domain actions independently resolve the Better Auth learner, validate with Zod, verify the content is still published, write an idempotent atomic upsert, and revalidate the active locale route. Practice links are optional and only resolve to published PracticeSets; the Practice Engine remains the only execution and evaluation engine.

Listening uses only repository-local `/audio/...` source paths and native browser `<audio controls preload="metadata">`. No autoplay, recording, speech recognition, external audio CDN, or playback analytics is implemented.

## AI Speaking: Phase 7

Phase 7 adds an isolated Speaking domain. Scenario content is separate from Learning Core, Phase 6 domain ownership, and Practice Engine ownership. Speaking attempts use `ai_speaking_attempts`, keyed by the authenticated Better Auth user id and scenario id. They do not write lesson progress, domain progress, practice sessions, analytics, recommendations, or mastery.

The browser-side recorder is the only broad interactive boundary: it requests microphone permission on an explicit click, detects a supported `MediaRecorder` MIME type, records in memory, stops tracks and timers, and sends a bounded `Blob` through the authenticated audio Route Handler. Raw audio is not persisted.

The server validates ownership, scenario publication, content type, body size, declared duration, and attempt state before processing. It passes the temporary buffer to the provider-neutral `SpeakingAiProvider` contract in `src/lib/ai/`. Phase 0–6 did not select an AI provider, so `getSpeakingAiProvider()` fails closed with an explicit unavailable result instead of silently choosing OpenAI or fabricating transcript/feedback.

The flow state is explicit: `scenario`, `preparation`, `requesting_permission`, `ready`, `recording`, `processing`, `transcript`, `feedback`, and `error`. Structured feedback is bounded and Zod-validated before persistence. There are no pronunciation scores, fake precision, browser speech-recognition transcripts, provider keys in the client, polling jobs, vector search, memory, or AI prompt management UI.

## Progress, personalization, and analytics: Phase 8

Phase 8 adds a derived learner-facing progress dashboard without creating a second progress authority. The protected `/[locale]/progress` Server Component resolves the Better Auth session and completed onboarding profile, then calls `src/lib/db/progress-dashboard.ts` with the server-derived user id and onboarding level.

### Authoritative sources and query boundary

- Learning Core remains authoritative for published current-level lessons, lesson completion, and current lesson selection through `getLearningHomeData` and `LessonProgress`.
- Practice Engine remains authoritative for completed sessions, embedded attempts, correctness, and result totals. Phase 8 uses correctness and attempt counts only; it does not infer skill/topic, difficulty, speed, or improvement.
- Vocabulary, Grammar, Listening, and Reading remain separate. Published collection counts and `LearnerDomainProgress` state counts are joined only for a read summary. Vocabulary remains `new | learning | known`; the other three domains remain `in_progress | completed`.
- Speaking remains informational. Only attempts with `completed`, transcript, and feedback are counted as valid completed attempts. Failed, cancelled, invalid, and provider-unavailable attempts do not become learner weakness evidence.
- There is no recommendation collection, duplicate progress collection, or analytics event stream. Activity analytics are bounded server-derived signals from successful authoritative records: completed lessons, completed practice sessions, domain progress updates, and valid completed Speaking attempts.

### Deterministic rules

Pure rules live in `src/lib/progress/rules.ts`. Current-level completion is `completed published lessons / total published lessons`, rounded to the nearest whole percent. Practice accuracy is `correct result answers / total result answers`, shown only after at least five answers. Recent attention evidence uses submitted practice attempts from the last 14 UTC days: fewer than five is insufficient, five through nine is developing, and ten or more is reliable. Accuracy below 60% with sufficient recent evidence is the practice attention rule.

Recommendation priority is explicit and stable: current next lesson `100`; recent practice attention `80`; started unfinished domains in the fixed order Grammar, Listening, Reading `60`; vocabulary items in `learning` `50`; prior completed practice history `40`. Ties resolve by that fixed order. No random, AI, weighted domain score, unsupported taxonomy, or fabricated Speaking score is used. User-facing reasons are fixed bilingual messages and state only supported evidence.

### Bounded activity analytics

The dashboard uses UTC calendar boundaries for the last 30 days and caps each source read at 500 records. It shows active days and the latest successful activity signal, not a client event stream. No browser event is authoritative, and no analytics failure can roll back a learning mutation because Phase 8 adds no analytics write after mutation. A future event requirement would need a separate bounded, validated, idempotent model and mutation-specific justification.

### Phase 8 model and index decision

No new MongoDB model was necessary. The existing PracticeSession model receives `{ userId: 1, status: 1, completedAt: -1 }` because the dashboard aggregates completed sessions and reads recent completed sessions by learner. Existing Learning, domain, and Speaking indexes support their Phase 8 predicates; no speculative indexes were added.

### Phase 8 route and UI

The dashboard reuses existing Card, Container, Lucide, theme, next-intl, and RTL/LTR architecture. It presents current position, current-level completion, practice evidence, active days, domain summaries, valid Speaking availability, and one explainable next step. It is server-rendered and contains no new client-authoritative state or mutation. The authenticated nav links to Progress, and the proxy includes `/progress` in the optimistic protected-route matcher.

## Admin architecture: final Phase 9

Admin is a server-authorized application surface under `src/app/[locale]/(admin)/admin/`. The Admin layout calls `requireAdmin` before rendering its navigation or children. The source of truth for authorization is the Better Auth Admin plugin role persisted on the Better Auth user record; the application keeps only the existing minimal `learner` and `admin` roles. The server session is read from Better Auth, not from browser state, hidden links, local storage, or a submitted role.

Management uses the authoritative Learning Core, Practice Engine, Vocabulary, Grammar, Listening, Reading, and SpeakingScenario models. It does not add Admin copies or a generic CRUD layer. `src/lib/db/admin.ts` applies explicit sort orders and bounded reads. Content list pages use a 20-record page size with URL status/level filters; curriculum and practice reads are bounded at 40 records. Stable model ids, slugs, parent references, unique indexes, and publication statuses remain authoritative.

Mutations follow `authenticate → authorize → validate → business rules → persist → revalidate`. `src/actions/admin/content.ts` handles the five supported content domains. `src/actions/admin-curriculum.ts` handles levels, courses, units, and lessons. `src/actions/admin-practice.ts` handles practice sets and the four existing exercise discriminator families. Every mutation rechecks Admin authorization on the server and returns bounded non-sensitive result codes.

New records default to `draft`. Drafts may be incomplete within model/schema limits and may reference existing draft content. Publication requires localized required fields, valid structured payloads, existing references, published parents, and the relevant domain-specific reference checks. Published learner reads continue to query only published content; `archived` records remain historical and are not current learner content. Status transitions prefer archive and no Admin delete operation was added.

The Better Auth Admin plugin is configured in `src/lib/auth/auth.ts` with `defaultRole: "learner"` and `adminRoles: ["admin"]`. Production first-admin bootstrap remains an operational step using the official Better Auth bootstrap mechanism; no browser-visible role assignment or custom user-role collection was introduced.

## Production audit boundary

The repository includes `poweredByHeader: false` and conservative response headers for content-type sniffing, referrer policy, and microphone/camera/geolocation permissions. No CSP or HSTS is claimed as configured because both require deployment-specific verification. Production startup now fails closed when `BETTER_AUTH_SECRET`, a public/auth origin, or `MONGODB_URI` is absent at runtime; local development retains explicit development fallbacks. AI remains provider-neutral and `NOT CONFIGURED`. Audio is bounded and temporary, with ownership/content/state checks at its authenticated Route Handler; raw audio is not persisted.

Database hardening, TLS, reverse proxy behavior, rate limiting, backups, operational monitoring, browser interaction, Lighthouse/Core Web Vitals, microphone hardware, an approved AI provider, and authenticated MongoDB behavior require a real deployment or database and are reported as not validated rather than inferred.

## Phase dependency map

| Phase | Scope | Status |
|---|---|---|
| 0 | Architecture, workspace, technical blueprint | Completed as greenfield blueprint |
| 1 | Foundation and design system | Completed |
| 2 | Complete public website | Completed |
| 3 | Auth and onboarding | Completed in repository; live MongoDB flow blocked by environment access |
| 4 | Learning core | Implemented in repository; MongoDB-backed runtime not validated in this environment |
| 5 | Practice engine | Implemented in repository; MongoDB-backed runtime not validated in this environment |
| 6 | Vocabulary, grammar, listening, reading | Implemented in repository; MongoDB-backed authenticated runtime not validated in this environment |
| 7 | AI speaking | Implemented in repository; provider/microphone/MongoDB runtime not validated in this environment |
| 8 | Progress, personalization, analytics | Implemented in repository; MongoDB-backed authenticated runtime not validated in this environment |
| 9 | Admin and production audit | Completed; final implementation and audit documentation recorded |

Phase boundaries are hard. Phase 5 contains only deterministic practice content, sessions, embedded attempts, evaluation, scoring, result summaries, and focused authenticated practice UI. Phase 6 contains only Vocabulary, Grammar, Listening, Reading, their published content reads, minimal learner state, and Practice Engine entry relationships. Phase 7 contains only Speaking scenarios, temporary audio submission, the provider-neutral AI boundary, transcript/feedback attempt persistence, and focused authenticated Speaking UI. Phase 8 contains only derived progress summaries, deterministic explanations/recommendations, bounded activity analytics, and the protected progress dashboard; it does not contain AI Practice, generative personalization, topic/difficulty/speed inference, pronunciation scoring, fabricated Speaking results, analytics SaaS, achievements, adaptive engines, CMS, payments, subscriptions, search infrastructure, or content-authoring UI. Phase 9 is the final planned implementation phase. Further work is maintenance or product evolution, not another numbered implementation phase.
