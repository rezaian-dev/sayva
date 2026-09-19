# SAYVA — CEFR Curriculum Content Map

**Document:** `docs/content-curriculum-map.md`
**Created:** 2026-09-19
**Content version:** `2026.09.1`
**Canonical content source:** `scripts/seed/sayva-content.seed.js`
**Source register:** `docs/content-sources.md`
**Database target:** `mongodb://localhost:27017/sayva` (database `sayva`)

All learner-facing content is original SAYVA content. Official sources are
curriculum/pedagogical references only (see `docs/content-sources.md`).

---

## 1. Global Totals (deterministic)

| Domain | Total | Per level |
|---|---|---|
| Levels | 6 | A1 A2 B1 B2 C1 C2 |
| Courses | 6 | 1 per level |
| Units | 24 | 4 per level |
| Lessons | 96 | 16 per level |
| Vocabulary items | 180 | 30 per level |
| Grammar topics | 48 | 8 per level |
| Reading items | 24 | 4 per level (10 graded stories: A2×2, B1×2, B2×2, C1×2, C2×2) |
| Listening items | 24 | 4 per level (status `draft`: audio assets not yet generated) |
| Speaking scenarios | 24 | 4 per level |
| Writing tasks | 18 | 3 per level |
| Practice sets | 96 | 1 per lesson |
| Practice exercises | 192 | 2 per set (multiple-choice / fill-blank / matching / ordering) |

Lesson rhythm inside every unit: `L1 vocabulary+reading → L2 grammar+listening →
L3 speaking+functions → L4 integrated review`. L4 lessons consolidate; they do
not introduce new grammar.

---

## 2. A1 — Elementary

**Course:** `a1-core` — A1 Core English / انگلیسی پایه A1

```text
A1
├── U1 a1-u1-meet — Meeting People / آشنایی با دیگران
│   ├── L1 a1-u1-meet-l1 — Saying Hello / سلام کردن
│   ├── L2 a1-u1-meet-l2 — Introducing Yourself / معرفی خود
│   ├── L3 a1-u1-meet-l3 — Asking Simple Questions / پرسیدن سؤال‌های ساده
│   └── L4 a1-u1-meet-l4 — Review: First Meetings / مرور: آشنایی اول
├── U2 a1-u2-daily — Daily Life / زندگی روزمره
│   ├── L1 a1-u2-daily-l1 — Morning Routines / کارهای صبحگاهی
│   ├── L2 a1-u2-daily-l2 — Days and Time / روزها و ساعت
│   ├── L3 a1-u2-daily-l3 — Talking About Work and School / صحبت درباره کار و مدرسه
│   └── L4 a1-u2-daily-l4 — Review: My Day / مرور: روز من
├── U3 a1-u3-home — Home and Family / خانه و خانواده
│   ├── L1 a1-u3-home-l1 — My Family / خانواده من
│   ├── L2 a1-u3-home-l2 — Rooms and Furniture / اتاق‌ها و وسایل خانه
│   ├── L3 a1-u3-home-l3 — Food and Drink / غذا و نوشیدنی
│   └── L4 a1-u3-home-l4 — Review: Home Life / مرور: زندگی در خانه
├── U4 a1-u4-town — Around Town / در شهر
│   ├── L1 a1-u4-town-l1 — Shopping for Food / خرید غذا
│   ├── L2 a1-u4-town-l2 — Numbers, Prices and Money / اعداد، قیمت و پول
│   ├── L3 a1-u4-town-l3 — Asking for Directions / آدرس پرسیدن
│   └── L4 a1-u4-town-l4 — Review: Town Tasks / مرور: کارهای شهری
├── Vocabulary (30): people, family, home, food, town, time, school/work, descriptions
├── Grammar (8): be-present, pronouns-subject, articles, plurals, demonstratives,
│                there-is-are, present-simple, can-ability
├── Reading (4): community notice, new-student profile, lunch-plan message, street description
├── Listening (4, draft): meeting Sara, corner shop, office introductions, bus time
├── Speaking (4): introduce yourself, describe family, my routine, at the market
├── Writing (3): personal-details form, meet-friend message, describe room
└── Practice: 16 sets / 32 exercises
```

---

## 3. A2 — Pre-intermediate

**Course:** `a2-core` — A2 Pre-intermediate English / انگلیسی پیش‌متوسط A2

```text
A2
├── U1 a2-u1-past — Past Experiences / تجربه‌های گذشته
│   ├── L1 a2-u1-past-l1 — My Last Weekend / آخر هفته گذشته من
│   ├── L2 a2-u1-past-l2 — A Trip I Remember / سفری که به یاد دارم
│   ├── L3 a2-u1-past-l3 — Telling a Short Story / تعریف یک داستان کوتاه
│   └── L4 a2-u1-past-l4 — Review: Talking About the Past / مرور: صحبت درباره گذشته
├── U2 a2-u2-plans — Plans and Future / برنامه‌ها و آینده
│   ├── L1 a2-u2-plans-l1 — Weekend Plans / برنامه‌های آخر هفته
│   ├── L2 a2-u2-plans-l2 — Travel Plans / برنامه‌های سفر
│   ├── L3 a2-u2-plans-l3 — Making Promises and Offers / قول دادن و پیشنهاد کردن
│   └── L4 a2-u2-plans-l4 — Review: Future Talk / مرور: صحبت درباره آینده
├── U3 a2-u3-people — People and Relationships / آدم‌ها و روابط
│   ├── L1 a2-u3-people-l1 — Describing People / توصیف آدم‌ها
│   ├── L2 a2-u3-people-l2 — Friends and Neighbours / دوستان و همسایه‌ها
│   ├── L3 a2-u3-people-l3 — Invitations and Apologies / دعوت‌ها و عذرخواهی‌ها
│   └── L4 a2-u3-people-l4 — Review: People Skills / مرور: مهارت‌های ارتباطی
├── U4 a2-u4-travel — Travel and Services / سفر و خدمات
│   ├── L1 a2-u4-travel-l1 — At the Hotel / در هتل
│   ├── L2 a2-u4-travel-l2 — At the Restaurant / در رستوران
│   ├── L3 a2-u4-travel-l3 — Using Transport / استفاده از وسایل نقلیه
│   └── L4 a2-u4-travel-l4 — Review: Traveller's Toolkit / مرور: ابزارهای مسافر
├── Vocabulary (30): travel, weather, hospitality, relationships, time, communication, feelings
├── Grammar (8): past-simple, going-to, will-future, comparatives, superlatives,
│                countable-uncountable, present-continuous, first-conditional
├── Reading (4): STORY the-missing-keys, STORY the-night-train, thank-you email, weekend guide
├── Listening (4, draft): dentist phone message, airport announcement, ordering dinner, weekend call
├── Speaking (4): past trip, weekend plan, ask for help, order and pay
├── Writing (3): thank-you email, apology note, describe person
└── Practice: 16 sets / 32 exercises
```

---

## 4. B1 — Intermediate

**Course:** `b1-core` — B1 Intermediate English / انگلیسی متوسط B1

```text
B1
├── U1 b1-u1-stories — Experiences and Stories / تجربه‌ها و داستان‌ها
│   ├── L1 b1-u1-stories-l1 — Unforgettable Moments / لحظه‌های فراموش‌نشدنی
│   ├── L2 b1-u1-stories-l2 — Narrating Events / روایت رویدادها
│   ├── L3 b1-u1-stories-l3 — Talking About Achievements / صحبت درباره دستاوردها
│   └── L4 b1-u1-stories-l4 — Review: Storytelling / مرور: داستان‌گویی
├── U2 b1-u2-opinions — Opinions and Preferences / نظرها و سلیقه‌ها
│   ├── L1 b1-u2-opinions-l1 — Likes and Dislikes / علاقه‌ها و بی‌علاقگی‌ها
│   ├── L2 b1-u2-opinions-l2 — Giving Reasons / دلیل آوردن
│   ├── L3 b1-u2-opinions-l3 — Agreeing and Disagreeing / موافقت و مخالفت
│   └── L4 b1-u2-opinions-l4 — Review: Opinion Exchange / مرور: تبادل نظر
├── U3 b1-u3-work — Work and Study / کار و تحصیل
│   ├── L1 b1-u3-work-l1 — Jobs and Responsibilities / شغل‌ها و مسئولیت‌ها
│   ├── L2 b1-u3-work-l2 — Meetings and Messages / جلسه‌ها و پیام‌ها
│   ├── L3 b1-u3-work-l3 — Study Habits / عادت‌های مطالعه
│   └── L4 b1-u3-work-l4 — Review: Professional Basics / مرور: مبانی حرفه‌ای
├── U4 b1-u4-world — Travel, Culture and Media / سفر، فرهنگ و رسانه
│   ├── L1 b1-u4-world-l1 — Planning a Journey / برنامه‌ریزی سفر
│   ├── L2 b1-u4-world-l2 — Culture and Customs / فرهنگ و آداب
│   ├── L3 b1-u4-world-l3 — Media and Reviews / رسانه و نقد
│   └── L4 b1-u4-world-l4 — Review: World Explorer / مرور: کاوشگر جهان
├── Vocabulary (30): experiences, opinions, work, study, travel, culture, media, feelings
├── Grammar (8): present-perfect, past-perfect, passives-intro, reported-speech-intro,
│                relative-clauses, gerunds-infinitives, modals-probability, second-conditional
├── Reading (4): STORY the-small-cafe, STORY the-letter-never-sent, work-from-home article, film review
├── Listening (4, draft): booking appointment, first interview, team standup, missed flight
├── Speaking (4): state preference, tell a story, explain problem, give advice
├── Writing (3): opinion paragraph, advice email, place review
└── Practice: 16 sets / 32 exercises
```

---

## 5. B2 — Upper-intermediate

**Course:** `b2-core` — B2 Upper-intermediate English / انگلیسی فوق‌متوسط B2

```text
B2
├── U1 b2-u1-ideas — Ideas and Arguments / ایده‌ها و استدلال‌ها
│   ├── L1 b2-u1-ideas-l1 — Forming an Argument / ساختن استدلال
│   ├── L2 b2-u1-ideas-l2 — Supporting Evidence / ارائه شواهد
│   ├── L3 b2-u1-ideas-l3 — Handling Counterarguments / پاسخ به استدلال مخالف
│   └── L4 b2-u1-ideas-l4 — Review: Debate Skills / مرور: مهارت مناظره
├── U2 b2-u2-work — Professional Communication / ارتباطات حرفه‌ای
│   ├── L1 b2-u2-work-l1 — Meetings That Work / جلسه‌های مؤثر
│   ├── L2 b2-u2-work-l2 — Presentations / ارائه‌ها
│   ├── L3 b2-u2-work-l3 — Workplace Problems / مشکلات محیط کار
│   └── L4 b2-u2-work-l4 — Review: Office Fluency / مرور: روانی در محیط کار
├── U3 b2-u3-society — Society and Technology / جامعه و فناوری
│   ├── L1 b2-u3-society-l1 — Technology in Life / فناوری در زندگی
│   ├── L2 b2-u3-society-l2 — Social Trends / روندهای اجتماعی
│   ├── L3 b2-u3-society-l3 — Cities and Communities / شهرها و جوامع
│   └── L4 b2-u3-society-l4 — Review: Modern Society / مرور: جامعه مدرن
├── U4 b2-u4-culture — Culture, Arts and Environment / فرهنگ، هنر و محیط زیست
│   ├── L1 b2-u4-culture-l1 — Arts and Entertainment / هنر و سرگرمی
│   ├── L2 b2-u4-culture-l2 — Nature and Environment / طبیعت و محیط زیست
│   ├── L3 b2-u4-culture-l3 — Travel Stories / داستان‌های سفر
│   └── L4 b2-u4-culture-l4 — Review: Cultural Literacy / مرور: سواد فرهنگی
├── Vocabulary (30): argument, evidence, work, society, technology, environment, culture, attitudes
├── Grammar (8): third-conditional, passives-advanced, reported-speech-advanced, modal-perfects,
│                cleft-sentences, participle-clauses, inversion-intro, discourse-markers
├── Reading (4): STORY the-city-of-fog, STORY the-last-interview, social-media opinion, urban-gardens report
├── Listening (4, draft): product-launch talk, campus-opening news, budget discussion, food-cities podcast
├── Speaking (4): defend opinion, solve dispute, social-issue talk, workplace scenario
├── Writing (3): opinion essay, survey report, formal request email
└── Practice: 16 sets / 32 exercises
```

---

## 6. C1 — Advanced

**Course:** `c1-core` — C1 Advanced English / انگلیسی پیشرفته C1

```text
C1
├── U1 c1-u1-discourse — Advanced Discourse / گفتمان پیشرفته
│   ├── L1 c1-u1-discourse-l1 — Structuring Arguments / ساختاردهی به استدلال
│   ├── L2 c1-u1-discourse-l2 — Concession and Refutation / پذیرش و رد
│   ├── L3 c1-u1-discourse-l3 — Register and Tone / سبک و لحن
│   └── L4 c1-u1-discourse-l4 — Review: Persuasive Discourse / مرور: گفتمان اقناعی
├── U2 c1-u2-academic — Academic English / انگلیسی آکادمیک
│   ├── L1 c1-u2-academic-l1 — Reading Research / خواندن پژوهش
│   ├── L2 c1-u2-academic-l2 — Academic Writing Moves / تکنیک‌های نگارش آکادمیک
│   ├── L3 c1-u2-academic-l3 — Seminars and Discussions / سمینارها و بحث‌ها
│   └── L4 c1-u2-academic-l4 — Review: Scholarly Voice / مرور: لحن دانشگاهی
├── U3 c1-u3-professional — Professional Mastery / تسلط حرفه‌ای
│   ├── L1 c1-u3-professional-l1 — Negotiation / مذاکره
│   ├── L2 c1-u3-professional-l2 — Leadership Communication / ارتباطات رهبری
│   ├── L3 c1-u3-professional-l3 — Reports and Proposals / گزارش‌ها و پیشنهادها
│   └── L4 c1-u3-professional-l4 — Review: Executive Presence / مرور: حضور مدیریتی
├── U4 c1-u4-global — Global Issues / مسائل جهانی
│   ├── L1 c1-u4-global-l1 — Environment and Policy / محیط زیست و سیاست‌گذاری
│   ├── L2 c1-u4-global-l2 — Media and Truth / رسانه و حقیقت
│   ├── L3 c1-u4-global-l3 — Ethics and Technology / اخلاق و فناوری
│   └── L4 c1-u4-global-l4 — Review: Global Citizen / مرور: شهروند جهانی
├── Vocabulary (30): abstraction, argumentation, academia, profession, policy, media, ethics
├── Grammar (8): inversion-advanced, ellipsis-substitution, nominalisation, fronting-emphasis,
│                advanced-modality, complex-clauses, register-control, reporting-advanced
├── Reading (4): STORY the-translator, STORY the-winter-archive, attention-economy analysis,
│                biography of Dr. Rostami (original fictional portrait)
├── Listening (4, draft): sleep-memory lecture, salary negotiation, future-of-work panel, novelist interview
├── Speaking (4): lead discussion, argue case, negotiate deal, abstract topic
├── Writing (3): argumentative essay, analytical report, project proposal
└── Practice: 16 sets / 32 exercises
```

---

## 7. C2 — Proficiency

**Course:** `c2-core` — C2 Proficiency English / انگلیسی تخصصی C2

```text
C2
├── U1 c2-u1-precision — Precision and Nuance / دقت و ظرافت
│   ├── L1 c2-u1-precision-l1 — Shades of Meaning / سایه‌های معنا
│   ├── L2 c2-u1-precision-l2 — Hedging and Emphasis / احتیاط و تأکید در بیان
│   ├── L3 c2-u1-precision-l3 — Implied Meaning / معنای ضمنی
│   └── L4 c2-u1-precision-l4 — Review: Precise Expression / مرور: بیان دقیق
├── U2 c2-u2-rhetoric — Rhetoric and Persuasion / بلاغت و اقناع
│   ├── L1 c2-u2-rhetoric-l1 — Rhetorical Devices / ابزارهای بلاغی
│   ├── L2 c2-u2-rhetoric-l2 — Speechwriting / سخنرانی‌نویسی
│   ├── L3 c2-u2-rhetoric-l3 — Debate at Depth / مناظره عمیق
│   └── L4 c2-u2-rhetoric-l4 — Review: Persuasive Voice / مرور: صدای اقناعی
├── U3 c2-u3-scholarly — Scholarly Discourse / گفتمان دانشگاهی
│   ├── L1 c2-u3-scholarly-l1 — Critical Reading / خواندن انتقادی
│   ├── L2 c2-u3-scholarly-l2 — Research Argumentation / استدلال پژوهشی
│   ├── L3 c2-u3-scholarly-l3 — Publication and Presentation / انتشار و ارائه
│   └── L4 c2-u3-scholarly-l4 — Review: Academic Authority / مرور: اعتبار آکادمیک
├── U4 c2-u4-mastery — Mastery and Voice / تسلط و سبک شخصی
│   ├── L1 c2-u4-mastery-l1 — Idiom and Collocation / اصطلاح و هم‌آیی
│   ├── L2 c2-u4-mastery-l2 — Style and Register / سبک و سطح زبان
│   ├── L3 c2-u4-mastery-l3 — Voice in Writing / لحن شخصی در نگارش
│   └── L4 c2-u4-mastery-l4 — Review: Near-native Fluency / مرور: روانی نزدیک به بومی
├── Vocabulary (30): rhetoric, scholarship, nuance, idiom, register, critique, mastery
├── Grammar (8): hedging-boosting, vague-precision, coherence-cohesion, register-shifting,
│                idiomatic-syntax, rhetorical-grammar, ambiguity-control, stylistic-choice
├── Reading (4): STORY the-cartographer, STORY the-silent-auction, essay on certainty,
│                climate-finance briefing
├── Listening (4, draft): AI-research debate, harbor-deal negotiation, translation-art talk,
│                         water-policy briefing
├── Speaking (4): formal debate, high-stakes negotiation, keynote speech, rhetorical defense
├── Writing (3): critical-response essay, briefing paper, persuasive speech
└── Practice: 16 sets / 32 exercises
```

---

## 8. Conventions

### 8.1 Slug scheme (stable, deterministic)

```text
levels:    a1 … c2
courses:   {level}-core
units:     {level}-u{1-4}-{short}        e.g. a1-u1-meet
lessons:   {unit}-l{1-4}                 e.g. a1-u1-meet-l1
vocabulary {level}-vocab-{kebab-word}    e.g. a1-vocab-apple
grammar:   {level}-grammar-{topic}       e.g. b2-grammar-cleft-sentences
reading:   {level}-reading-{topic}       e.g. c1-reading-attention-economy
stories:   {level}-story-{name}          e.g. b1-story-the-small-cafe
listening: {level}-listening-{topic}     e.g. a2-listening-airport-announcement
speaking:  {level}-speaking-{topic}      e.g. c2-speaking-keynote-speech
writing:   {level}-writing-{topic}       e.g. b1-writing-place-review
practice:  {lessonSlug}-practice         e.g. a1-u1-meet-l1-practice
```

### 8.2 Publication states

| Content | Status | Reason |
|---|---|---|
| Levels / courses / units / lessons | `published` | Complete: titles, descriptions, objectives, content blocks. |
| Vocabulary / grammar / reading / speaking / writing | `published` | Complete: all required fields present, original content. |
| Practice sets / exercises | `published` | Complete: valid payloads, server-authoritative answers. |
| Listening items | `draft` | Transcripts complete, but `/audio/…` assets are NOT generated. `audioSrc` values are reserved stable keys only. Listening becomes `published` only after real audio files land in `public/audio/`. |

### 8.3 Cross-domain references

Every vocabulary, grammar, reading, listening, speaking (by level/topic), and
writing item is linked to a deterministic lesson (`lessonId`) and that lesson's
practice set (`practiceSetId`). Practice sets belong to exactly one lesson.
No dangling references: the seed validates every reference in memory before
any write, and the write order is levels → courses → units → lessons →
vocabulary → grammar → reading → listening → speaking → writing →
practice sets → exercises → cross-reference reconciliation.

### 8.4 What is intentionally NOT in this map

- No learner data (progress, sessions, attempts, auth) — never touched by seeding.
- No audio binaries — placeholder `audioSrc` keys only, listening stays `draft`.
- No pronunciation scoring claims — IPA/word-stress data is instructional reference.
- No writing auto-grading — evaluation criteria are human/tutor guidance.
