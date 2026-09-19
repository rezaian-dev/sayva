#!/usr/bin/env node
"use strict";

/* ============================================================================
 * SAYVA — Official English Curriculum Seed (A1–C2)
 * ----------------------------------------------------------------------------
 * Single executable seed file. Populates the MongoDB database `sayva`
 * (mongodb://localhost:27017/sayva) with the original SAYVA curriculum.
 *
 *   Validate + dry run (no writes, no DB connection needed):
 *     node scripts/seed/sayva-content.seed.js --dry-run
 *
 *   Validate + seed:
 *     node --env-file=.env scripts/seed/sayva-content.seed.js
 *
 * Guarantees:
 * - Deterministic: no randomness anywhere (no Math.random, no Date-based ids).
 * - Idempotent: stable slugs/keys + updateOne upserts; safe to re-run.
 * - No destructive ops: never deleteMany/dropDatabase/dropCollection.
 * - Never touches learner data (progress, sessions, attempts, auth).
 * - Env safety: refuses to write unless the URI resolves to database `sayva`
 *   on a local MongoDB host. Never Atlas, never another database.
 * - In-memory validation runs BEFORE any write; failures abort with exit 1.
 *
 * Originality: every definition, example, passage, story, dialogue,
 * transcript, scenario, prompt, explanation, and exercise below is original
 * SAYVA content. Official sources (CEFR, British Council, Cambridge,
 * Oxford) are curriculum/pedagogical REFERENCES only — see CONTENT_SOURCES
 * and docs/content-sources.md. Nothing verbatim is reproduced.
 * ========================================================================== */

const CONTENT_VERSION = "2026.09.1";

const CONTENT_SOURCES = Object.freeze([
  {
    name: "Council of Europe CEFR",
    role: "Framework",
    urls: [
      "https://www.coe.int/en/web/common-european-framework-reference-languages",
      "https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors",
      "https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions",
    ],
    usedFor: "Level framework (A1-C2), can-do outcomes, skill progression, assessment alignment.",
  },
  {
    name: "British Council LearnEnglish",
    role: "Pedagogical reference / Activity reference / Story-format reference",
    urls: [
      "https://learnenglish.britishcouncil.org/",
      "https://learnenglish.britishcouncil.org/level/understand-your-english-level",
      "https://learnenglish.britishcouncil.org/free-resources/listening",
      "https://learnenglish.britishcouncil.org/free-resources/reading",
      "https://learnenglish.britishcouncil.org/free-resources/grammar",
      "https://learnenglish.britishcouncil.org/free-resources/vocabulary",
      "https://learnenglish.britishcouncil.org/free-resources/general/story-zone",
    ],
    usedFor: "Topic structure, grammar/vocabulary progression shape, listening & reading text-type inventories, graded-story level bands (A2-B1 / B2-C1).",
  },
  {
    name: "Cambridge English",
    role: "Pedagogical reference / Activity reference",
    urls: ["https://www.cambridgeenglish.org/learning-english/activities-for-learners/"],
    usedFor: "Activity-design cross-check across Basic/Independent/Proficient bands (page moved as of 2026-09-19; minor corroborating reference).",
  },
  {
    name: "Oxford Learner's Dictionaries",
    role: "Vocabulary reference",
    urls: [
      "https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000",
      "https://www.oxfordlearnersdictionaries.com/about/wordlists/",
    ],
    usedFor: "Vocabulary prioritization & CEFR-aware sequencing (core A1-B2, advanced B2-C1, phrases/collocations, academic lexis).",
  },
]);

const SOURCE_META = Object.freeze({
  framework: "CEFR",
  referenceSources: CONTENT_SOURCES.map((s) => s.name),
  originality: "original-sayva-content",
  levelBasis: "CEFR-aligned curriculum design",
  contentVersion: CONTENT_VERSION,
});

const LEVELS_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const STATUSES = ["draft", "published", "archived"];
const LESSON_BLOCK_KINDS = ["introduction", "explanation", "example", "summary"];
const EXERCISE_TYPES = ["multiple-choice", "fill-blank", "matching", "ordering"];
const TRANSCRIPT_VISIBILITY = ["hidden", "on-request", "always"];
const EXPECTED_DB_NAME = "sayva";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/* ------------------------------- helpers -------------------------------- */

function L(fa, en) {
  return { fa: String(fa), en: String(en) };
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isLocalized(v) {
  return (
    !!v &&
    typeof v === "object" &&
    isNonEmptyString(v.fa) &&
    isNonEmptyString(v.en)
  );
}

function fail(errors, msg) {
  errors.push(msg);
}

/* ============================ LEVELS (6) ================================ */

const LEVELS = [
  {
    code: "A1", slug: "a1", order: 0, status: "published",
    title: L("سطح A1 — مقدماتی", "A1 Elementary"),
    description: L(
      "انگلیسی مقدماتی برای نیازهای فوری روزمره: معرفی خود، خانواده، کارهای روزمره و توصیف‌های ساده.",
      "Elementary English for immediate everyday needs: introductions, family, routines, and simple descriptions.",
    ),
  },
  {
    code: "A2", slug: "a2", order: 1, status: "published",
    title: L("سطح A2 — پیش‌متوسط", "A2 Pre-intermediate"),
    description: L(
      "ارتباط روزمره درباره موضوعات آشنا: رویدادهای گذشته و آینده، تعامل‌های معمول و متن‌های کوتاه پیوسته.",
      "Everyday communication about familiar topics: past and future events, routine interactions, and short connected texts.",
    ),
  },
  {
    code: "B1", slug: "b1", order: 2, status: "published",
    title: L("سطح B1 — متوسط", "B1 Intermediate"),
    description: L(
      "ارتباط مستقل روزمره: تجربه‌ها، نظرها، سفر، کار و گفتار پیوسته با استدلال‌های کوتاه.",
      "Independent everyday communication: experiences, opinions, travel, work, connected speech, and short arguments.",
    ),
  },
  {
    code: "B2", slug: "b2", order: 3, status: "published",
    title: L("سطح B2 — فوق‌متوسط", "B2 Upper-intermediate"),
    description: L(
      "ارتباط پیچیده روزمره و حرفه‌ای: نظرهای ظریف، متن‌های بلند، ارائه و بحث با استدلال.",
      "Complex everyday and professional communication: nuanced opinions, extended texts, presentations, and reasoned discussion.",
    ),
  },
  {
    code: "C1", slug: "c1", order: 4, status: "published",
    title: L("سطح C1 — پیشرفته", "C1 Advanced"),
    description: L(
      "ارتباط آکادمیک و حرفه‌ای درباره موضوعات انتزاعی: معنای ضمنی، استدلال پیچیده و کنترل سبک.",
      "Academic and professional communication on abstract topics: implicit meaning, complex argumentation, and register control.",
    ),
  },
  {
    code: "C2", slug: "c2", order: 5, status: "published",
    title: L("سطح C2 — تخصصی", "C2 Proficiency"),
    description: L(
      "تسلط دقیق و ظریف: متن‌های بسیار پیچیده، گفتمان پیشرفته، انعطاف اصطلاحی و تمایزهای سبکی.",
      "Precise, nuanced mastery: highly complex texts, sophisticated discourse, idiomatic flexibility, and fine register distinctions.",
    ),
  },
];

/* ============================ COURSES (6) =============================== */
/* Row: [levelCode, slug, titleEn, titleFa, descEn, descFa] */

const COURSE_ROWS = [
  ["A1", "a1-core", "A1 Core English", "انگلیسی پایه A1",
    "The complete A1 path: people, daily life, home, and town.",
    "مسیر کامل A1: آدم‌ها، زندگی روزمره، خانه و شهر."],
  ["A2", "a2-core", "A2 Pre-intermediate English", "انگلیسی پیش‌متوسط A2",
    "The complete A2 path: past, future, people, and travel.",
    "مسیر کامل A2: گذشته، آینده، آدم‌ها و سفر."],
  ["B1", "b1-core", "B1 Intermediate English", "انگلیسی متوسط B1",
    "The complete B1 path: stories, opinions, work, and the wider world.",
    "مسیر کامل B1: داستان‌ها، نظرها، کار و دنیای پیرامون."],
  ["B2", "b2-core", "B2 Upper-intermediate English", "انگلیسی فوق‌متوسط B2",
    "The complete B2 path: arguments, professional life, society, and culture.",
    "مسیر کامل B2: استدلال، زندگی حرفه‌ای، جامعه و فرهنگ."],
  ["C1", "c1-core", "C1 Advanced English", "انگلیسی پیشرفته C1",
    "The complete C1 path: discourse, academia, profession, and global issues.",
    "مسیر کامل C1: گفتمان، دانشگاه، حرفه و مسائل جهانی."],
  ["C2", "c2-core", "C2 Proficiency English", "انگلیسی تخصصی C2",
    "The complete C2 path: precision, rhetoric, scholarship, and voice.",
    "مسیر کامل C2: دقت، بلاغت، پژوهش و سبک شخصی."],
];

function buildCourses() {
  return COURSE_ROWS.map(([levelCode, slug, titleEn, titleFa, descEn, descFa], i) => ({
    _key: slug,
    _levelKey: levelCode.toLowerCase(),
    slug,
    title: L(titleFa, titleEn),
    description: L(descFa, descEn),
    order: 0,
    status: "published",
    _rowIndex: i,
  }));
}

/* ============================= UNITS (24) =============================== */
/* Row: [courseSlug, slug, titleEn, titleFa, descEn, descFa] */

const UNIT_ROWS = [
  ["a1-core", "a1-u1-meet", "Meeting People", "آشنایی با دیگران",
    "Greetings, introductions, and first questions.",
    "سلام و احوال‌پرسی، معرفی خود و نخستین سؤال‌ها."],
  ["a1-core", "a1-u2-daily", "Daily Life", "زندگی روزمره",
    "Routines, days, time, work, and school.",
    "کارهای روزمره، روزها، ساعت، کار و مدرسه."],
  ["a1-core", "a1-u3-home", "Home and Family", "خانه و خانواده",
    "Family, rooms, furniture, food, and drink.",
    "خانواده، اتاق‌ها، وسایل خانه، غذا و نوشیدنی."],
  ["a1-core", "a1-u4-town", "Around Town", "در شهر",
    "Shopping, money, numbers, and directions.",
    "خرید، پول، اعداد و آدرس پرسیدن."],
  ["a2-core", "a2-u1-past", "Past Experiences", "تجربه‌های گذشته",
    "Weekends, trips, and short stories about the past.",
    "آخر هفته‌ها، سفرها و داستان‌های کوتاه درباره گذشته."],
  ["a2-core", "a2-u2-plans", "Plans and Future", "برنامه‌ها و آینده",
    "Weekend plans, travel plans, promises, and offers.",
    "برنامه‌های آخر هفته و سفر، قول‌ها و پیشنهادها."],
  ["a2-core", "a2-u3-people", "People and Relationships", "آدم‌ها و روابط",
    "Describing people, friends, invitations, and apologies.",
    "توصیف آدم‌ها، دوستان، دعوت‌ها و عذرخواهی‌ها."],
  ["a2-core", "a2-u4-travel", "Travel and Services", "سفر و خدمات",
    "Hotels, restaurants, and transport.",
    "هتل، رستوران و وسایل نقلیه."],
  ["b1-core", "b1-u1-stories", "Experiences and Stories", "تجربه‌ها و داستان‌ها",
    "Memorable moments, narration, and achievements.",
    "لحظه‌های به‌یادماندنی، روایت و دستاوردها."],
  ["b1-core", "b1-u2-opinions", "Opinions and Preferences", "نظرها و سلیقه‌ها",
    "Likes, reasons, agreement, and disagreement.",
    "علاقه‌ها، دلیل‌ها، موافقت و مخالفت."],
  ["b1-core", "b1-u3-work", "Work and Study", "کار و تحصیل",
    "Jobs, meetings, messages, and study habits.",
    "شغل‌ها، جلسه‌ها، پیام‌ها و عادت‌های مطالعه."],
  ["b1-core", "b1-u4-world", "Travel, Culture and Media", "سفر، فرهنگ و رسانه",
    "Journeys, customs, media, and reviews.",
    "سفرها، آداب، رسانه و نقدها."],
  ["b2-core", "b2-u1-ideas", "Ideas and Arguments", "ایده‌ها و استدلال‌ها",
    "Arguments, evidence, and counterarguments.",
    "استدلال، شواهد و پاسخ به نظر مخالف."],
  ["b2-core", "b2-u2-work", "Professional Communication", "ارتباطات حرفه‌ای",
    "Meetings, presentations, and workplace problems.",
    "جلسه‌ها، ارائه‌ها و مشکلات محیط کار."],
  ["b2-core", "b2-u3-society", "Society and Technology", "جامعه و فناوری",
    "Technology, trends, cities, and communities.",
    "فناوری، روندها، شهرها و جوامع."],
  ["b2-core", "b2-u4-culture", "Culture, Arts and Environment", "فرهنگ، هنر و محیط زیست",
    "Arts, entertainment, nature, and travel writing.",
    "هنر، سرگرمی، طبیعت و سفرنامه‌نویسی."],
  ["c1-core", "c1-u1-discourse", "Advanced Discourse", "گفتمان پیشرفته",
    "Argument structure, concession, and register.",
    "ساختار استدلال، پذیرش نظر مخالف و سبک زبان."],
  ["c1-core", "c1-u2-academic", "Academic English", "انگلیسی آکادمیک",
    "Research reading, academic writing, and seminars.",
    "خواندن پژوهش، نگارش آکادمیک و سمینارها."],
  ["c1-core", "c1-u3-professional", "Professional Mastery", "تسلط حرفه‌ای",
    "Negotiation, leadership, reports, and proposals.",
    "مذاکره، رهبری، گزارش‌ها و پیشنهادها."],
  ["c1-core", "c1-u4-global", "Global Issues", "مسائل جهانی",
    "Environment, media, ethics, and technology.",
    "محیط زیست، رسانه، اخلاق و فناوری."],
  ["c2-core", "c2-u1-precision", "Precision and Nuance", "دقت و ظرافت",
    "Shades of meaning, hedging, and implication.",
    "سایه‌های معنا، بیان محتاطانه و معنای ضمنی."],
  ["c2-core", "c2-u2-rhetoric", "Rhetoric and Persuasion", "بلاغت و اقناع",
    "Rhetorical devices, speechwriting, and deep debate.",
    "ابزارهای بلاغی، سخنرانی‌نویسی و مناظره عمیق."],
  ["c2-core", "c2-u3-scholarly", "Scholarly Discourse", "گفتمان دانشگاهی",
    "Critical reading, research argument, and publication.",
    "خواندن انتقادی، استدلال پژوهشی و انتشار."],
  ["c2-core", "c2-u4-mastery", "Mastery and Voice", "تسلط و سبک شخصی",
    "Idiom, style, register, and personal voice.",
    "اصطلاح، سبک، سطح زبان و لحن شخصی."],
];

function buildUnits(courseByKey) {
  const orderPerCourse = new Map();
  return UNIT_ROWS.map(([courseSlug, slug, titleEn, titleFa, descEn, descFa]) => {
    const order = orderPerCourse.get(courseSlug) ?? 0;
    orderPerCourse.set(courseSlug, order + 1);
    return {
      _key: slug,
      _courseKey: courseSlug,
      _courseId: courseByKey.get(courseSlug) || null,
      slug,
      title: L(titleFa, titleEn),
      description: L(descFa, descEn),
      order,
      status: "published",
    };
  });
}

/* ============================ LESSONS (96) ============================== */
/* Row: [unitSlug, slug, titleEn, titleFa, descEn, descFa, minutes,
 *       [o1en, o1fa, o2en, o2fa],
 *       [[kind, key, bTitleEn, bTitleFa, bodyEn, bodyFa] x3]] */

function buildLessons(rows, unitByKey) {
  const orderPerUnit = new Map();
  return rows.map(([unitSlug, slug, titleEn, titleFa, descEn, descFa, minutes, objectives, blocks]) => {
    const order = orderPerUnit.get(unitSlug) ?? 0;
    orderPerUnit.set(unitSlug, order + 1);
    return {
      _key: slug,
      _unitKey: unitSlug,
      _unitId: unitByKey.get(unitSlug) || null,
      slug,
      title: L(titleFa, titleEn),
      description: L(descFa, descEn),
      order,
      status: "published",
      estimatedDuration: minutes,
      objectives: [
        L(objectives[1], objectives[0]),
        L(objectives[3], objectives[2]),
      ],
      content: blocks.map(([kind, key, bTitleEn, bTitleFa, bodyEn, bodyFa], i) => ({
        key, kind,
        title: L(bTitleFa, bTitleEn),
        body: L(bodyFa, bodyEn),
        order: i,
      })),
    };
  });
}

/* ------------------------- A1 lessons (16) ------------------------------ */

const LESSON_ROWS_A1 = [
["a1-u1-meet","a1-u1-meet-l1","Saying Hello","سلام کردن",
"Greet people at different times of day.","سلام کردن به آدم‌ها در ساعت‌های مختلف روز.",15,
["Greet people politely.","مؤدبانه سلام کنید.","Choose the right greeting for the time of day.","سلام مناسب هر ساعت از روز را انتخاب کنید."],
[["introduction","a1-u1-meet-l1-intro","First Words","نخستین واژه‌ها",
"Hello! Good morning! Good afternoon! Good evening! We use different greetings at different times.",
"سلام! صبح بخیر! ظهر بخیر! عصر بخیر! در ساعت‌های مختلف از سلام‌های متفاوت استفاده می‌کنیم."],
["example","a1-u1-meet-l1-ex","Mini Dialogues","گفت‌وگوهای کوتاه",
"— Good morning, Sara. — Good morning! How are you? — I am fine, thank you. Practice with a friend: say hello, ask, and answer.",
"— صبح بخیر سارا. — صبح بخیر! چطوری؟ — خوبم، ممنون. با یک دوست تمرین کنید: سلام کنید، بپرسید و جواب بدهید."],
["summary","a1-u1-meet-l1-sum","Remember","به خاطر بسپارید",
"Morning: Good morning. Afternoon: Good afternoon. Evening and night: Good evening. Goodbye: Bye! See you!",
"صبح: Good morning. ظهر: Good afternoon. عصر و شب: Good evening. خداحافظی: Bye! See you!"]]],
["a1-u1-meet","a1-u1-meet-l2","Introducing Yourself","معرفی خود",
"Say your name, city, and job with the verb be.","نام، شهر و شغل خود را با فعل be بگویید.",18,
["Introduce yourself with be.","خود را با فعل be معرفی کنید.","Give your name, city, and job.","نام، شهر و شغل خود را بگویید."],
[["introduction","a1-u1-meet-l2-intro","I Am …","من … هستم",
"My name is Dara. I am a student. I am from Tehran. The verb be (am, is, are) introduces people.",
"نام من داراست. من دانش‌آموزم. من اهل تهرانم. فعل be (به شکل am و is و are) برای معرفی آدم‌ها به کار می‌رود."],
["explanation","a1-u1-meet-l2-ex","Patterns","الگوها",
"I am / He is / She is / We are / They are. Examples: She is a teacher. They are friends. I am happy to meet you.",
"الگوها: I am و He is و She is و We are و They are. مثال‌ها: او معلم است. آن‌ها دوست هستند. از آشنایی با شما خوشحالم."],
["summary","a1-u1-meet-l2-sum","Your Turn","نوبت شماست",
"Say three sentences: your name, your city, your job. Example: I am Mina. I am from Isfahan. I am a nurse.",
"سه جمله بگویید: نام، شهر و شغل خود. مثال: من مینا هستم. اهل اصفهانم. پرستارم."]]],
["a1-u1-meet","a1-u1-meet-l3","Asking Simple Questions","پرسیدن سؤال‌های ساده",
"Ask and answer questions about personal details.","درباره مشخصات فردی سؤال بپرسید و جواب بدهید.",18,
["Ask questions with be and do.","با be و do سؤال بپرسید.","Answer questions about yourself.","به سؤال‌ها درباره خودتان جواب بدهید."],
[["introduction","a1-u1-meet-l3-intro","Questions Open Doors","سؤال‌ها درها را باز می‌کنند",
"What is your name? Where are you from? Where do you live? Questions help you know new people.",
"نام شما چیست؟ اهل کجا هستید؟ کجا زندگی می‌کنید؟ سؤال‌ها کمک می‌کنند آدم‌های جدید را بشناسید."],
["explanation","a1-u1-meet-l3-ex","Word Order","ترتیب واژه‌ها",
"What do you do? — I am a driver. Where do you work? — I work in a shop. The verb comes before the subject in questions.",
"چه کار می‌کنید؟ — راننده‌ام. کجا کار می‌کنید؟ — در یک مغازه کار می‌کنم. در سؤال، فعل پیش از فاعل می‌آید."],
["summary","a1-u1-meet-l3-sum","Practice Pair","تمرین دو نفره",
"Ask a partner five questions. Write the answers. Then introduce your partner to the class.",
"از هم‌کلاسی خود پنج سؤال بپرسید. جواب‌ها را بنویسید. سپس او را به کلاس معرفی کنید."]]],
["a1-u1-meet","a1-u1-meet-l4","Review: First Meetings","مرور: آشنایی اول",
"Consolidate greetings, introductions, and questions.","سلام‌ها، معرفی‌ها و سؤال‌ها را مرور و تثبیت کنید.",15,
["Use unit 1 language fluently.","زبان درس اول را روان به کار ببرید.","Hold a first meeting in English.","یک آشنایی اول را به انگلیسی انجام دهید."],
[["introduction","a1-u1-meet-l4-intro","Put It Together","همه را کنار هم بگذارید",
"You can greet, introduce, and ask. Now combine them: Hello! My name is … What is your name?",
"می‌توانید سلام کنید، معرفی کنید و بپرسید. حالا آن‌ها را ترکیب کنید: سلام! نام من … است. نام شما چیست؟"],
["example","a1-u1-meet-l4-ex","Role Play","ایفای نقش",
"Student A is new in class. Student B welcomes A, asks three questions, and introduces A to the teacher.",
"دانش‌آموز الف در کلاس جدید است. دانش‌آموز ب به او خوشامد می‌گوید، سه سؤال می‌پرسد و او را به معلم معرفی می‌کند."],
["summary","a1-u1-meet-l4-sum","Checklist","فهرست بررسی",
"Can you say hello, introduce yourself, and ask two questions? If yes, unit 1 is complete!",
"آیا می‌توانید سلام کنید، خود را معرفی کنید و دو سؤال بپرسید؟ اگر بله، واحد اول کامل شد!"]]],
["a1-u2-daily","a1-u2-daily-l1","Morning Routines","کارهای صبحگاهی",
"Describe morning actions with the present simple.","کارهای صبح را با زمان حال ساده توصیف کنید.",18,
["Use present simple for routines.","حال ساده را برای کارهای روزمره به کار ببرید.","Describe your morning in order.","صبح خود را به ترتیب توصیف کنید."],
[["introduction","a1-u2-daily-l1-intro","Every Morning","هر صبح",
"I wake up at six. I brush my teeth. I eat breakfast. We use the present simple for routines.",
"ساعت شش بیدار می‌شوم. مسواک می‌زنم. صبحانه می‌خورم. برای کارهای روزمره از حال ساده استفاده می‌کنیم."],
["explanation","a1-u2-daily-l1-ex","He / She + s","او + s",
"I work. She works. They eat. He eats. Add -s for he, she, and it: She drinks tea every morning.",
"الگو: I work ولی She works. برای سوم‌شخص مفرد s- اضافه می‌شود: او هر صبح چای می‌نوشد."],
["summary","a1-u2-daily-l1-sum","Your Morning","صبح شما",
"Write four sentences about your morning. Use first, then, after that: First I wake up. Then I …",
"چهار جمله درباره صبح خود بنویسید. از first و then و after that استفاده کنید."]]],
["a1-u2-daily","a1-u2-daily-l2","Days and Time","روزها و ساعت",
"Say days, tell the time, and use basic prepositions.","روزها را بگویید، ساعت بگویید و از حروف اضافه ساده استفاده کنید.",18,
["Name the days and tell the time.","روزها را نام ببرید و ساعت بگویید.","Use in, on, and at correctly.","از in و on و at درست استفاده کنید."],
[["introduction","a1-u2-daily-l2-intro","When?","چه زمانی؟",
"Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday. The class is at nine on Monday.",
"دوشنبه تا یکشنبه. کلاس ساعت نه روز دوشنبه است. روزها با حرف بزرگ نوشته می‌شوند."],
["explanation","a1-u2-daily-l2-ex","In, On, At","حروف اضافه زمان",
"At seven o'clock. On Monday. In the morning. Time of clock: at. Days: on. Parts of day: in.",
"ساعت هفت: at. روزها: on. بخش‌های روز: in. مثال: at seven on Monday in the morning."],
["summary","a1-u2-daily-l2-sum","My Week","هفته من",
"Say one activity for three days: On Saturday I visit my family. On Sunday I …",
"برای سه روز یک فعالیت بگویید: شنبه به خانواده‌ام سر می‌زنم. یکشنبه …"]]],
["a1-u2-daily","a1-u2-daily-l3","Talking About Work and School","صحبت درباره کار و مدرسه",
"Exchange basic information about jobs and classes.","اطلاعات ساده درباره شغل و کلاس رد و بدل کنید.",18,
["Talk about jobs and school subjects.","درباره شغل‌ها و درس‌های مدرسه صحبت کنید.","Ask what people do.","بپرسید آدم‌ها چه کار می‌کنند."],
[["introduction","a1-u2-daily-l3-intro","Jobs Around Us","شغل‌های دور و بر ما",
"Teacher, doctor, driver, cook, farmer, engineer. What do you do? Where do you study?",
"معلم، پزشک، راننده، آشپز، کشاورز، مهندس. چه کار می‌کنید؟ کجا درس می‌خوانید؟"],
["example","a1-u2-daily-l3-ex","A School Chat","گفت‌وگو در مدرسه",
"— What is your favourite subject? — Maths. I like numbers. — When is your English class? — On Mondays and Wednesdays.",
"— درس موردعلاقه‌ات چیست؟ — ریاضی. اعداد را دوست دارم. — کلاس انگلیسی‌ات کی است؟ — دوشنبه‌ها و چهارشنبه‌ها."],
["summary","a1-u2-daily-l3-sum","Mini Survey","نظرسنجی کوچک",
"Ask three classmates about their jobs or studies. Report one sentence each to the class.",
"از سه هم‌کلاسی درباره کار یا تحصیلشان بپرسید. برای هر کدام یک جمله به کلاس گزارش دهید."]]],
["a1-u2-daily","a1-u2-daily-l4","Review: My Day","مرور: روز من",
"Consolidate routines, time, and work/school talk.","کارهای روزمره، زمان و صحبت درباره کار و مدرسه را تثبیت کنید.",15,
["Narrate a full day in order.","یک روز کامل را به ترتیب تعریف کنید.","Review present simple and time phrases.","حال ساده و عبارت‌های زمانی را مرور کنید."],
[["introduction","a1-u2-daily-l4-intro","From Morning to Night","از صبح تا شب",
"Tell your whole day: In the morning I … At noon I … In the evening I … At night I …",
"کل روز خود را بگویید: صبح … ظهر … عصر … شب …"],
["example","a1-u2-daily-l4-ex","A Day in Order","یک روز به ترتیب",
"First, I wake up at six. Then I go to work at seven. After that, I eat lunch at noon. Finally, I read at night.",
"اول ساعت شش بیدار می‌شوم. بعد ساعت هفت سر کار می‌روم. سپس ظهر ناهار می‌خورم. در پایان شب کتاب می‌خوانم."],
["summary","a1-u2-daily-l4-sum","Checklist","فهرست بررسی",
"Can you say your routine, the days, and the time? Can you ask about jobs? Unit 2 complete!",
"آیا می‌توانید برنامه روزانه، روزها و ساعت را بگویید؟ درباره شغل بپرسید؟ واحد دوم کامل شد!"]]],
["a1-u3-home","a1-u3-home-l1","My Family","خانواده من",
"Name family members and use possessives.","اعضای خانواده را نام ببرید و از مالکیت استفاده کنید.",18,
["Name family members.","اعضای خانواده را نام ببرید.","Use my, your, his, her, and 's.","از صفت‌های ملکی و s' استفاده کنید."],
[["introduction","a1-u3-home-l1-intro","Who Is Who?","چه کسی کیست؟",
"Mother, father, sister, brother, grandmother, grandfather. This is my sister. Her name is Laleh.",
"مادر، پدر، خواهر، برادر، مادربزرگ، پدربزرگ. این خواهر من است. نامش لاله است."],
["explanation","a1-u3-home-l1-ex","Possessives","مالکیت",
"My book, your pen, his car, her bag, our house, their dog. Sara's brother = the brother of Sara.",
"کتاب من، خودکار تو، ماشین او (مذکر)، کیف او (مؤنث)، خانه ما، سگ آن‌ها. s' یعنی «ِ»: برادر سارا."],
["summary","a1-u3-home-l1-sum","Family Tree","شجره‌نامه",
"Draw your family tree. Write one sentence under each person: This is my father. His name is …",
"شجره‌نامه خانواده‌تان را بکشید. زیر هر نفر یک جمله بنویسید."]]],
["a1-u3-home","a1-u3-home-l2","Rooms and Furniture","اتاق‌ها و وسایل خانه",
"Describe rooms with there is / there are.","اتاق‌ها را با there is و there are توصیف کنید.",18,
["Name rooms and furniture.","اتاق‌ها و وسایل را نام ببرید.","Use there is / there are.","از there is و there are استفاده کنید."],
[["introduction","a1-u3-home-l2-intro","At Home","در خانه",
"Kitchen, bedroom, bathroom, living room. In my bedroom there is a bed and there are two chairs.",
"آشپزخانه، اتاق خواب، حمام، اتاق نشیمن. در اتاق خوابم یک تخت هست و دو صندلی هست."],
["explanation","a1-u3-home-l2-ex","There Is / There Are","وجود داشتن",
"There is a lamp (one). There are four plates (many). Is there a garden? — Yes, there is. / No, there isn't.",
"برای مفرد there is و برای جمع there are. سؤال: Is there …? جواب کوتاه: Yes, there is."],
["summary","a1-u3-home-l2-sum","My Room","اتاق من",
"Describe your room in five sentences. Use there is, there are, and prepositions: on, in, under, next to.",
"اتاق خود را در پنج جمله توصیف کنید. از there is و there are و حروف اضافه مکان استفاده کنید."]]],
["a1-u3-home","a1-u3-home-l3","Food and Drink","غذا و نوشیدنی",
"Talk about meals, likes, and quantities.","درباره وعده‌ها، علاقه‌ها و مقدارها صحبت کنید.",18,
["Name foods and meals.","غذاها و وعده‌ها را نام ببرید.","Express likes and ask politely.","علاقه را بیان کنید و مؤدبانه بخواهید."],
[["introduction","a1-u3-home-l3-intro","Meals","وعده‌های غذایی",
"Breakfast, lunch, dinner. Bread, rice, meat, fruit, water, tea. I like rice. I don't like very hot food.",
"صبحانه، ناهار، شام. نان، برنج، گوشت، میوه، آب، چای. برنج دوست دارم. غذای خیلی تند دوست ندارم."],
["example","a1-u3-home-l3-ex","At the Table","سر سفره",
"— Would you like some tea? — Yes, please. / No, thank you. — Is there any bread? — Yes, here you are.",
"— چای می‌خواهی؟ — بله، لطفاً. / نه، ممنون. — نان هست؟ — بله، بفرما."],
["summary","a1-u3-home-l3-sum","My Favourite Meal","وعده موردعلاقه من",
"Describe your favourite meal: what it is, when you eat it, and who cooks it. Write four sentences.",
"وعده موردعلاقه خود را توصیف کنید: چیست، کی می‌خورید و چه کسی می‌پزد. چهار جمله بنویسید."]]],
["a1-u3-home","a1-u3-home-l4","Review: Home Life","مرور: زندگی در خانه",
"Consolidate family, home, and food language.","زبان خانواده، خانه و غذا را تثبیت کنید.",15,
["Describe your home and family.","خانه و خانواده خود را توصیف کنید.","Hold a dinner-table conversation.","یک گفت‌وگوی سر سفره انجام دهید."],
[["introduction","a1-u3-home-l4-intro","Welcome Home","به خانه خوش آمدید",
"Show a guest your home: This is our living room. There are two sofas. My mother cooks very well!",
"خانه‌تان را به یک مهمان نشان دهید: این اتاق نشیمن ماست. دو مبل هست. مادرم خیلی خوب آشپزی می‌کند!"],
["example","a1-u3-home-l4-ex","Guest Role Play","بازی مهمان",
"Guest: What is this food? Host: It is rice with chicken. Guest: It is very good! Host: Thank you!",
"مهمان: این غذا چیست؟ میزبان: برنج با مرغ است. مهمان: خیلی خوشمزه است! میزبان: ممنون!"],
["summary","a1-u3-home-l4-sum","Checklist","فهرست بررسی",
"Family words? there is/are? food words? polite requests? Unit 3 complete!",
"واژه‌های خانواده؟ there is/are؟ واژه‌های غذا؟ درخواست مؤدبانه؟ واحد سوم کامل شد!"]]],
["a1-u4-town","a1-u4-town-l1","Shopping for Food","خرید غذا",
"Shop for groceries with polite phrases.","با عبارت‌های مؤدبانه خواربار بخرید.",18,
["Ask for items in a shop.","در مغازه جنس بخواهید.","Use some, any, and how much.","از some و any و how much استفاده کنید."],
[["introduction","a1-u4-town-l1-intro","At the Shop","در مغازه",
"Shopkeeper, customer, bag, basket. — Can I help you? — Yes, I need some apples, please.",
"مغازه‌دار، مشتری، کیسه، سبد. — کمکتان کنم؟ — بله، چند سیب می‌خواهم لطفاً."],
["explanation","a1-u4-town-l1-ex","Some and Any","some و any",
"I need some eggs (positive). Is there any milk? (question). There aren't any onions (negative).",
"در جمله مثبت some، در سؤال و منفی any. مثال: چند تخم‌مرغ می‌خواهم. شیر هست؟ پیاز نداریم."],
["summary","a1-u4-town-l1-sum","Shopping List","فهرست خرید",
"Write a list of six items. Then role-play buying them. Ask: How much is it? / How much are they?",
"فهرستی از شش قلم بنویسید. سپس خرید آن‌ها را بازی کنید. بپرسید: قیمتش چند است؟"]]],
["a1-u4-town","a1-u4-town-l2","Numbers, Prices and Money","اعداد، قیمت و پول",
"Count, pay, and understand prices.","بشمارید، پول بدهید و قیمت‌ها را بفهمید.",18,
["Say numbers 1-100.","اعداد ۱ تا ۱۰۰ را بگویید.","Ask prices and pay.","قیمت بپرسید و پول بدهید."],
[["introduction","a1-u4-town-l2-intro","Numbers Matter","اعداد مهم‌اند",
"Twenty, thirty, forty … one hundred. The apples are thirty thousand tomans. Here you are. Thank you!",
"بیست، سی، چهل … صد. سیب‌ها سی هزار تومان است. بفرما. ممنون!"],
["explanation","a1-u4-town-l2-ex","How Much?","چقدر؟",
"How much is this bread? — It is five thousand. How much are these eggs? — They are twenty thousand.",
"این نان چند است؟ — پنج هزار. این تخم‌مرغ‌ها چند است؟ — بیست هزار. برای مفرد is و جمع are."],
["summary","a1-u4-town-l2-sum","Market Maths","حساب بازار",
"Your partner names three items with prices. Add the total and say it in English.",
"هم‌کلاسی سه جنس با قیمت می‌گوید. جمع بزنید و به انگلیسی بگویید."]]],
["a1-u4-town","a1-u4-town-l3","Asking for Directions","آدرس پرسیدن",
"Find places with imperatives and prepositions.","با جمله‌های امری و حروف اضافه، جاها را پیدا کنید.",18,
["Ask for and give directions.","آدرس بپرسید و آدرس بدهید.","Use go, turn, and prepositions.","از go و turn و حروف اضافه استفاده کنید."],
[["introduction","a1-u4-town-l3-intro","Where Is …?","کجاست؟",
"Excuse me, where is the bank? Go straight. Turn left. It is next to the bakery, on the right.",
"ببخشید، بانک کجاست؟ مستقیم برو. بپیچ چپ. کنار نانوایی است، سمت راست."],
["explanation","a1-u4-town-l3-ex","Imperatives","جمله امری",
"Go straight. Don't turn here. Take the first right. Imperatives give directions: verb first, no subject.",
"مستقیم برو. اینجا نپیچ. اولین کوچه سمت راست. جمله امری با فعل شروع می‌شود و فاعل ندارد."],
["summary","a1-u4-town-l3-sum","Town Map","نقشه شهر",
"Draw a small map with a bank, school, and shop. Guide your partner from the school to the bank.",
"نقشه کوچکی با بانک، مدرسه و مغازه بکشید. هم‌کلاسی را از مدرسه تا بانک راهنمایی کنید."]]],
["a1-u4-town","a1-u4-town-l4","Review: Town Tasks","مرور: کارهای شهری",
"Consolidate shopping, money, and directions.","خرید، پول و آدرس را تثبیت کنید.",15,
["Complete town errands in English.","کارهای شهری را به انگلیسی انجام دهید.","Review A1 survival language.","زبان بقای A1 را مرور کنید."],
[["introduction","a1-u4-town-l4-intro","A Day in Town","یک روز در شهر",
"Buy bread, ask the price, pay, and find the bus stop. You can do a whole town trip in English now!",
"نان بخر، قیمت بپرس، پول بده و ایستگاه اتوبوس را پیدا کن. حالا یک سفر شهری کامل را به انگلیسی بلدی!"],
["example","a1-u4-town-l4-ex","Town Mission","مأموریت شهری",
"Mission card: 1) Buy two things. 2) Ask two prices. 3) Ask for one place. Complete all three with a partner.",
"کارت مأموریت: ۱) دو چیز بخر. ۲) دو قیمت بپرس. ۳) آدرس یک جا را بپرس. هر سه را با هم‌کلاسی انجام بده."],
["summary","a1-u4-town-l4-sum","A1 Complete!","A1 کامل شد!",
"You finished A1: meetings, days, home, and town. Celebrate — then step up to A2!",
"A1 را تمام کردی: آشنایی، روزها، خانه و شهر. جشن بگیر — بعد برو سراغ A2!"]]],
];

/* ------------------------- A2 lessons (16) ------------------------------ */

const LESSON_ROWS_A2 = [
["a2-u1-past","a2-u1-past-l1","My Last Weekend","آخر هفته گذشته من",
"Talk about recent weekends with the past simple.","درباره آخر هفته‌های اخیر با گذشته ساده صحبت کنید.",20,
["Use past simple for finished actions.","گذشته ساده را برای کارهای تمام‌شده به کار ببرید.","Describe your weekend in order.","آخر هفته خود را به ترتیب توصیف کنید."],
[["introduction","a2-u1-past-l1-intro","Last Weekend","آخر هفته گذشته",
"Last Saturday I visited my uncle. We drank tea and watched football. It was a happy day.",
"شنبه گذشته به عمویم سر زدم. چای خوردیم و فوتبال دیدیم. روز خوشی بود."],
["explanation","a2-u1-past-l1-ex","Regular and Irregular","باقاعده و بی‌قاعده",
"Regular: visit → visited, watch → watched. Irregular: go → went, eat → ate, drink → drank. Learn common irregular verbs by heart.",
"باقاعده: visited و watched. بی‌قاعده: went و ate و drank. فعل‌های بی‌قاعده رایج را حفظ کنید."],
["summary","a2-u1-past-l1-sum","Weekend Report","گزارش آخر هفته",
"Write six sentences about last weekend. Use time words: on Saturday morning, in the afternoon, in the evening.",
"شش جمله درباره آخر هفته گذشته بنویسید. از قیدهای زمان استفاده کنید."]]],
["a2-u1-past","a2-u1-past-l2","A Trip I Remember","سفری که به یاد دارم",
"Narrate a past trip with sequence words.","یک سفر گذشته را با واژه‌های توالی روایت کنید.",20,
["Narrate past events in sequence.","رویدادهای گذشته را به ترتیب روایت کنید.","Use first, then, after that, finally.","از first و then و after that و finally استفاده کنید."],
[["introduction","a2-u1-past-l2-intro","Travel Memories","خاطره‌های سفر",
"Two years ago we travelled to the sea. First we took the bus. Then we swam. It was wonderful!",
"دو سال پیش به دریا سفر کردیم. اول سوار اتوبوس شدیم. بعد شنا کردیم. فوق‌العاده بود!"],
["example","a2-u1-past-l2-ex","A Short Travel Tale","داستان کوتاه سفر",
"Last spring I went to Kashan with my family. We saw old houses. My sister took many photos. We bought roses. Finally we came home tired and happy.",
"بهار گذشته با خانواده به کاشان رفتم. خانه‌های قدیمی دیدیم. خواهرم عکس‌های زیادی گرفت. گل خریدیم. سرانجام خسته و خوشحال به خانه برگشتیم."],
["summary","a2-u1-past-l2-sum","Your Trip","سفر شما",
"Tell a partner about a trip. Use five past verbs and three sequence words.",
"درباره یک سفر به هم‌کلاسی بگویید. پنج فعل گذشته و سه واژه توالی به کار ببرید."]]],
["a2-u1-past","a2-u1-past-l3","Telling a Short Story","تعریف یک داستان کوتاه",
"Tell simple stories with a beginning, middle, and end.","داستان‌های ساده با آغاز، میانه و پایان تعریف کنید.",20,
["Structure a simple story.","یک داستان ساده را ساختاردهی کنید.","Use past continuous for background.","از گذشته استمراری برای زمینه استفاده کنید."],
[["introduction","a2-u1-past-l3-intro","Story Shape","شکل داستان",
"Every story has three parts: start (who, where, when), middle (what happened), end (how it finished).",
"هر داستان سه بخش دارد: آغاز (کی، کجا، کی)، میانه (چه اتفاقی افتاد) و پایان (چطور تمام شد)."],
["explanation","a2-u1-past-l3-ex","Background + Action","زمینه + کنش",
"I was walking home when I saw a small dog. Past continuous (was walking) paints the background; past simple (saw) gives the action.",
"داشتم به خانه می‌رفتم که سگ کوچکی دیدم. گذشته استمراری زمینه می‌سازد؛ گذشته ساده کنش را می‌گوید."],
["summary","a2-u1-past-l3-sum","Sixty Seconds","شصت ثانیه",
"Tell a one-minute story: something surprising that happened to you. Record yourself and listen.",
"یک داستان یک‌دقیقه‌ای بگویید: اتفاق شگفت‌انگیزی که برایتان افتاد. صدایتان را ضبط کنید و گوش دهید."]]],
["a2-u1-past","a2-u1-past-l4","Review: Talking About the Past","مرور: صحبت درباره گذشته",
"Consolidate past narration and irregular verbs.","روایت گذشته و فعل‌های بی‌قاعده را تثبیت کنید.",15,
["Narrate past events confidently.","رویدادهای گذشته را با اعتمادبه‌نفس روایت کنید.","Recall 15 irregular verbs.","۱۵ فعل بی‌قاعده را به خاطر بیاورید."],
[["introduction","a2-u1-past-l4-intro","Past Masters","استادان گذشته",
"Quiz a partner: say the base verb; they say the past. Go — went. Eat — ate. See — saw.",
"هم‌کلاسی را امتحان کنید: مصدر را بگویید؛ او گذشته را بگوید. Go و went. Eat و ate."],
["example","a2-u1-past-l4-ex","Story Chain","زنجیره داستان",
"Build a group story sentence by sentence. Each person adds one past-simple sentence. Keep verbs correct!",
"گروهی جمله‌به‌جمله داستان بسازید. هر نفر یک جمله گذشته ساده اضافه کند. فعل‌ها درست باشند!"],
["summary","a2-u1-past-l4-sum","Checklist","فهرست بررسی",
"Past simple? Irregular verbs? Sequence words? Story shape? Unit 1 complete!",
"گذشته ساده؟ فعل‌های بی‌قاعده؟ واژه‌های توالی؟ شکل داستان؟ واحد اول کامل شد!"]]],
["a2-u2-plans","a2-u2-plans-l1","Weekend Plans","برنامه‌های آخر هفته",
"Talk about fixed plans with going to.","درباره برنامه‌های قطعی با going to صحبت کنید.",20,
["Use going to for plans.","از going to برای برنامه‌ها استفاده کنید.","Arrange weekend activities.","فعالیت‌های آخر هفته را هماهنگ کنید."],
[["introduction","a2-u2-plans-l1-intro","Plans Are Made","برنامه‌ها ساخته می‌شوند",
"I am going to visit my grandmother on Friday. She is going to cook lunch. What are you going to do?",
"جمعه می‌خواهم به مادربزرگم سر بزنم. او می‌خواهد ناهار بپزد. تو می‌خواهی چه کار کنی؟"],
["explanation","a2-u2-plans-l2-ex","Going To","ساختار going to",
"be + going to + verb: I am going to study. Negative: I am not going to stay home. Question: Are you going to come?",
"الگو: be و going to و فعل. منفی و سؤالی با همان be ساخته می‌شود."],
["summary","a2-u2-plans-l1-sum","Plan Together","با هم برنامه بریزید",
"Make a joint weekend plan with a partner. Agree on two activities and say when you will do them.",
"با هم‌کلاسی یک برنامه مشترک آخر هفته بچینید. روی دو فعالیت توافق کنید و زمانش را بگویید."]]],
["a2-u2-plans","a2-u2-plans-l2","Travel Plans","برنامه‌های سفر",
"Plan a trip: transport, hotel, and activities.","یک سفر را برنامه‌ریزی کنید: وسیله نقلیه، هتل و فعالیت‌ها.",20,
["Plan the parts of a trip.","بخش‌های یک سفر را برنامه‌ریزی کنید.","Compare options with comparatives.","گزینه‌ها را با صفت تفضیلی مقایسه کنید."],
[["introduction","a2-u2-plans-l2-intro","Where To?","کجا برویم؟",
"We are going to travel in spring. The train is cheaper than the plane, but the plane is faster.",
"بهار می‌خواهیم سفر کنیم. قطار از هواپیما ارزان‌تر است، ولی هواپیما سریع‌تر است."],
["explanation","a2-u2-plans-l2-ex","Comparatives","صفت تفضیلی",
"Cheap → cheaper than. Big → bigger than. Good → better than. Use than after the comparative.",
"ارزان‌تر از، بزرگ‌تر از، بهتر از. پس از صفت تفضیلی than می‌آید."],
["summary","a2-u2-plans-l2-sum","Trip Poster","پوستر سفر",
"Design a weekend trip: city, transport, hotel, two activities. Present it in one minute.",
"یک سفر آخر هفته طراحی کنید: شهر، وسیله، هتل و دو فعالیت. در یک دقیقه ارائه دهید."]]],
["a2-u2-plans","a2-u2-plans-l3","Making Promises and Offers","قول دادن و پیشنهاد کردن",
"Use will for promises, offers, and quick decisions.","از will برای قول، پیشنهاد و تصمیم فوری استفاده کنید.",20,
["Use will for promises and offers.","از will برای قول و پیشنهاد استفاده کنید.","Distinguish will from going to.","will و going to را از هم جدا کنید."],
[["introduction","a2-u2-plans-l3-intro","I Will Help","کمک می‌کنم",
"— I am tired. — I will cook dinner. A: decisions now → will. B: plans before → going to.",
"— خسته‌ام. — شام را من می‌پزم. تصمیم لحظه‌ای: will. برنامه قبلی: going to."],
["example","a2-u2-plans-l3-ex","Promises","قول‌ها",
"I will call you tonight. I promise I will not be late. — The bag is heavy. — I will carry it.",
"امشب زنگ می‌زنم. قول می‌دهم دیر نکنم. — کیف سنگین است. — من حملش می‌کنم."],
["summary","a2-u2-plans-l3-sum","Promise Cards","کارت‌های قول",
"Write three promises to a friend. Read them aloud. Your partner accepts or refuses each one.",
"سه قول به یک دوست بنویسید. بلند بخوانید. هم‌کلاسی هر کدام را قبول یا رد کند."]]],
["a2-u2-plans","a2-u2-plans-l4","Review: Future Talk","مرور: صحبت درباره آینده",
"Consolidate going to, will, and comparatives.","going to و will و صفت تفضیلی را تثبیت کنید.",15,
["Choose will or going to correctly.","will یا going to را درست انتخاب کنید.","Present a full future plan.","یک برنامه کامل آینده را ارائه دهید."],
[["introduction","a2-u2-plans-l4-intro","Future Fair","نمایشگاه آینده",
"Walk around: ask five classmates about next week. Note one plan from each person.",
"بچرخید: از پنج هم‌کلاسی درباره هفته آینده بپرسید. از هر نفر یک برنامه یادداشت کنید."],
["example","a2-u2-plans-l4-ex","My Next Month","ماه آینده من",
"Next month I am going to start a course. I will study every evening. It will be hard but good!",
"ماه آینده می‌خواهم یک دوره شروع کنم. هر شب درس می‌خوانم. سخت ولی خوب خواهد بود!"],
["summary","a2-u2-plans-l4-sum","Checklist","فهرست بررسی",
"going to for plans? will for promises? comparatives? Unit 2 complete!",
"going to برای برنامه؟ will برای قول؟ تفضیلی؟ واحد دوم کامل شد!"]]],
["a2-u3-people","a2-u3-people-l1","Describing People","توصیف آدم‌ها",
"Describe appearance and character.","ظاهر و شخصیت آدم‌ها را توصیف کنید.",20,
["Describe looks and personality.","ظاهر و شخصیت را توصیف کنید.","Use have/has and be for description.","از have و be برای توصیف استفاده کنید."],
[["introduction","a2-u3-people-l1-intro","Faces and Hearts","چهره‌ها و دل‌ها",
"She has long hair and brown eyes. She is tall and kind. He is short with a big smile.",
"موهای بلند و چشم‌های قهوه‌ای دارد. قدبلند و مهربان است. او کوتاه‌قد است با لبخند بزرگی."],
["explanation","a2-u3-people-l1-ex","Have vs Be","have در برابر be",
"She is tall (be + adjective). She has glasses (have + noun). He is friendly. He has a beard.",
"قدبلند است (be + صفت). عینک دارد (have + اسم). خنده‌روست. ریش دارد."],
["summary","a2-u3-people-l1-sum","Guess Who","حدس بزن کیست",
"Describe a classmate without the name. Others guess who it is. Use three appearance and two character words.",
"یک هم‌کلاسی را بدون نام توصیف کنید. بقیه حدس بزنند کیست. سه واژه ظاهر و دو واژه شخصیت به کار ببرید."]]],
["a2-u3-people","a2-u3-people-l2","Friends and Neighbours","دوستان و همسایه‌ها",
"Talk about relationships and frequency.","درباره روابط و تکرار صحبت کنید.",20,
["Talk about relationships.","درباره روابط صحبت کنید.","Use adverbs of frequency.","از قیدهای تکرار استفاده کنید."],
[["introduction","a2-u3-people-l2-intro","Good Neighbours","همسایه‌های خوب",
"My neighbour often helps me. We usually drink tea together on Fridays. She never forgets my birthday!",
"همسایه‌ام اغلب به من کمک می‌کند. معمولاً جمعه‌ها با هم چای می‌خوریم. هیچ‌وقت تولدم را فراموش نمی‌کند!"],
["explanation","a2-u3-people-l2-ex","Frequency","تکرار",
"Always 100%, usually, often, sometimes, rarely, never 0%. Position: before the verb — She always smiles. After be — He is never late.",
"همیشه تا هرگز. جایگاه: پیش از فعل اصلی، پس از be."],
["summary","a2-u3-people-l2-sum","Friendship Map","نقشه دوستی",
"Write about two friends: how you met, what you often do, and why you like them.",
"درباره دو دوست بنویسید: چطور آشنا شدید، معمولاً چه می‌کنید و چرا دوستشان دارید."]]],
["a2-u3-people","a2-u3-people-l3","Invitations and Apologies","دعوت‌ها و عذرخواهی‌ها",
"Invite, accept, refuse, and apologise politely.","مؤدبانه دعوت کنید، قبول یا رد کنید و عذرخواهی کنید.",20,
["Invite and respond politely.","مؤدبانه دعوت کنید و جواب دهید.","Apologise and explain simply.","عذرخواهی کنید و ساده توضیح دهید."],
[["introduction","a2-u3-people-l3-intro","Come and Join!","بیا و همراه شو!",
"Would you like to come to dinner on Friday? — I would love to! / I am sorry, I can't. I am busy.",
"جمعه برای شام می‌آیی؟ — خیلی دوست دارم! / متأسفم، نمی‌توانم. سرم شلوغ است."],
["example","a2-u3-people-l3-ex","Sorry!","ببخشید!",
"I am sorry I am late. The bus was full. I am sorry about yesterday. I was tired and angry.",
"ببخشید دیر کردم. اتوبوس پر بود. بابت دیروز متأسفم. خسته و عصبانی بودم."],
["summary","a2-u3-people-l3-sum","Party Plan","برنامه مهمانی",
"Invite your partner to an event. They accept or refuse with a reason. Then swap roles.",
"هم‌کلاسی را به مراسمی دعوت کنید. او با دلیل قبول یا رد کند. سپس نقش‌ها را عوض کنید."]]],
["a2-u3-people","a2-u3-people-l4","Review: People Skills","مرور: مهارت‌های ارتباطی",
"Consolidate describing people and social phrases.","توصیف آدم‌ها و عبارت‌های اجتماعی را تثبیت کنید.",15,
["Describe and compare two people.","دو نفر را توصیف و مقایسه کنید.","Manage invitations and apologies.","دعوت‌ها و عذرخواهی‌ها را مدیریت کنید."],
[["introduction","a2-u3-people-l4-intro","People Party","مهمانی آدم‌ها",
"Introduce two classmates to each other with descriptions. Then invite both to your imaginary party.",
"دو هم‌کلاسی را با توصیف به هم معرفی کنید. سپس هر دو را به مهمانی خیالی خود دعوت کنید."],
["example","a2-u3-people-l4-ex","Compare","مقایسه",
"My brother is taller than me, but I am funnier. My best friend is kinder than anyone I know!",
"برادرم از من قدبلندتر است، ولی من بامزه‌ترم. بهترین دوستم از هر کسی که می‌شناسم مهربان‌تر است!"],
["summary","a2-u3-people-l4-sum","Checklist","فهرست بررسی",
"Descriptions? Frequency adverbs? Invitations? Apologies? Unit 3 complete!",
"توصیف‌ها؟ قیدهای تکرار؟ دعوت‌ها؟ عذرخواهی‌ها؟ واحد سوم کامل شد!"]]],
["a2-u4-travel","a2-u4-travel-l1","At the Hotel","در هتل",
"Check in, ask for things, and solve small problems.","پذیرش شوید، چیز بخواهید و مشکل‌های کوچک را حل کنید.",20,
["Check in to a hotel.","در هتل پذیرش شوید.","Request and complain politely.","مؤدبانه بخواهید و شکایت کنید."],
[["introduction","a2-u4-travel-l1-intro","Welcome!","خوش آمدید!",
"— Good evening. I have a reservation. My name is Karimi. — Welcome, Mr Karimi. Your room is 204.",
"— عصر بخیر. رزرو دارم. نامم کریمی است. — خوش آمدید آقای کریمی. اتاق شما ۲۰۴ است."],
["example","a2-u4-travel-l1-ex","Small Problems","مشکل‌های کوچک",
"The key doesn't work. There is no hot water. Could you help me, please? Could you change the room?",
"کلید کار نمی‌کند. آب گرم نیست. می‌توانید کمکم کنید لطفاً؟ می‌توانید اتاق را عوض کنید؟"],
["summary","a2-u4-travel-l1-sum","Reception Role Play","بازی پذیرش",
"One student is the receptionist, one is the guest. Check in, then report one problem politely.",
"یک نفر پذیرش‌گر و یک نفر مهمان. پذیرش شوید، سپس یک مشکل را مؤدبانه گزارش دهید."]]],
["a2-u4-travel","a2-u4-travel-l2","At the Restaurant","در رستوران",
"Order food, ask about the menu, and pay.","غذا سفارش دهید، درباره منو بپرسید و پول بدهید.",20,
["Order a full meal.","یک وعده کامل سفارش دهید.","Ask about food politely.","مؤدبانه درباره غذا بپرسید."],
[["introduction","a2-u4-travel-l2-intro","A Table for Two","میز دو نفره",
"— A table for two, please. — This way, please. Here is the menu. — What do you recommend?",
"— یک میز دو نفره لطفاً. — از این طرف لطفاً. این هم منو. — چه پیشنهادی دارید؟"],
["example","a2-u4-travel-l2-ex","Ordering","سفارش دادن",
"I would like the chicken, please. Is it spicy? — A little. Could we have the bill, please?",
"مرغ می‌خواهم لطفاً. تند است؟ — کمی. صورت‌حساب را می‌آورید لطفاً؟"],
["summary","a2-u4-travel-l2-sum","Menu Makers","سازندگان منو",
"Create a small menu with four dishes and prices. Then take your partner's order.",
"یک منوی کوچک با چهار غذا و قیمت بسازید. سپس سفارش هم‌کلاسی را بگیرید."]]],
["a2-u4-travel","a2-u4-travel-l3","Using Transport","استفاده از وسایل نقلیه",
"Buy tickets and navigate stations.","بلیت بخرید و در ایستگاه‌ها راه خود را پیدا کنید.",20,
["Buy tickets and ask about routes.","بلیت بخرید و درباره مسیر بپرسید.","Understand announcements.","اطلاعیه‌ها را بفهمید."],
[["introduction","a2-u4-travel-l3-intro","Tickets, Please","بلیت‌ها لطفاً",
"— Two tickets to Shiraz, please. — Single or return? — Return, please. Which platform? — Platform three.",
"— دو بلیت شیراز لطفاً. — یک‌طرفه یا رفت‌وبرگشت؟ — رفت‌وبرگشت لطفاً. کدام سکو؟ — سکوی سه."],
["explanation","a2-u4-travel-l3-ex","Superlatives","صفت عالی",
"The fastest way is the plane. The cheapest seats sell first. Which is the best bus to the centre?",
"سریع‌ترین راه هواپیماست. ارزان‌ترین صندلی‌ها زودتر فروش می‌روند. بهترین اتوبوس به مرکز کدام است؟"],
["summary","a2-u4-travel-l3-sum","Journey Plan","برنامه سفر",
"Plan a real journey: from where, to where, which transport, what time, how much. Present it.",
"یک سفر واقعی برنامه‌ریزی کنید: از کجا، به کجا، با چه وسیله‌ای، چه ساعتی، چقدر. ارائه دهید."]]],
["a2-u4-travel","a2-u4-travel-l4","Review: Traveller's Toolkit","مرور: ابزارهای مسافر",
"Consolidate hotel, restaurant, and transport English.","انگلیسی هتل، رستوران و حمل‌ونقل را تثبیت کنید.",15,
["Survive a full trip in English.","یک سفر کامل را به انگلیسی پشت سر بگذارید.","Review A2 travel language.","زبان سفر A2 را مرور کنید."],
[["introduction","a2-u4-travel-l4-intro","Bon Voyage!","سفر بخیر!",
"From station to hotel to restaurant and back — run the whole trip as a role play chain.",
"از ایستگاه تا هتل تا رستوران و برگشت — کل سفر را به‌صورت زنجیره بازی اجرا کنید."],
["example","a2-u4-travel-l4-ex","Trip Chain","زنجیره سفر",
"Station → taxi → hotel → restaurant → museum → station. Each stop: one correct exchange. No Persian allowed!",
"ایستگاه، تاکسی، هتل، رستوران، موزه، ایستگاه. هر ایستگاه یک تبادل درست. فارسی ممنوع!"],
["summary","a2-u4-travel-l4-sum","A2 Complete!","A2 کامل شد!",
"You finished A2: past, future, people, and travel. Onward to independent B1!",
"A2 را تمام کردی: گذشته، آینده، آدم‌ها و سفر. به‌سوی B1 مستقل!"]]],
];

/* ------------------------- B1 lessons (16) ------------------------------ */

const LESSON_ROWS_B1 = [
["b1-u1-stories","b1-u1-stories-l1","Unforgettable Moments","لحظه‌های فراموش‌نشدنی",
"Share life experiences with the present perfect.","تجربه‌های زندگی را با حال کامل به اشتراک بگذارید.",22,
["Use present perfect for experiences.","حال کامل را برای تجربه‌ها به کار ببرید.","Tell a memorable moment vividly.","یک لحظه به‌یادماندنی را زنده تعریف کنید."],
[["introduction","b1-u1-stories-l1-intro","Have You Ever …?","تا حالا …؟",
"Have you ever seen the desert at sunrise? I have visited three countries, but I have never flown in a balloon.",
"تا حالا طلوع آفتاب در کویر را دیده‌ای؟ سه کشور دیده‌ام ولی هیچ‌وقت با بالن پرواز نکرده‌ام."],
["explanation","b1-u1-stories-l1-ex","Present Perfect","حال کامل",
"have/has + past participle: I have finished. She has gone. Use it when the time is not finished or not important.",
"الگو: have/has + اسم مفعول. وقتی زمان مشخص نیست یا مهم نیست از حال کامل استفاده می‌شود."],
["summary","b1-u1-stories-l1-sum","Experience Bingo","بینگوی تجربه",
"Find classmates who have done five unusual things. Ask: Have you ever …? Report the best answer.",
"هم‌کلاسی‌هایی پیدا کنید که پنج کار غیرمعمول کرده‌اند. بپرسید: Have you ever …؟ بهترین جواب را گزارش دهید."]]],
["b1-u1-stories","b1-u1-stories-l2","Narrating Events","روایت رویدادها",
"Order past events with past perfect and linkers.","رویدادهای گذشته را با گذشته کامل و پیونددهنده‌ها مرتب کنید.",22,
["Sequence events with past perfect.","رویدادها را با گذشته کامل مرتب کنید.","Use narrative linkers naturally.","از پیونددهنده‌های روایی طبیعی استفاده کنید."],
[["introduction","b1-u1-stories-l2-intro","Before That …","پیش از آن …",
"When I arrived, the train had already left. The past perfect shows the earlier of two past events.",
"وقتی رسیدم، قطار قبلاً رفته بود. گذشته کامل نشان می‌دهد کدام رویداد گذشته زودتر بوده است."],
["explanation","b1-u1-stories-l2-ex","Linkers","پیونددهنده‌ها",
"Suddenly, unfortunately, luckily, in the end. Suddenly the lights went out. Luckily, I had my phone.",
"ناگهان، متأسفانه، خوشبختانه، در پایان. ناگهان چراغ‌ها خاموش شد. خوشبختانه گوشیم را داشتم."],
["summary","b1-u1-stories-l2-sum","News Flash","خبر فوری",
"Turn a boring day into dramatic news. Use two past-perfect sentences and three linkers.",
"یک روز کسل‌کننده را به خبر دراماتیک تبدیل کنید. دو جمله گذشته کامل و سه پیونددهنده به کار ببرید."]]],
["b1-u1-stories","b1-u1-stories-l3","Talking About Achievements","صحبت درباره دستاوردها",
"Present achievements modestly and clearly.","دستاوردها را فروتنانه و روشن ارائه دهید.",22,
["Describe achievements with results.","دستاوردها را با نتیجه توصیف کنید.","Use yet, already, just, and since/for.","از yet و already و just و since/for استفاده کنید."],
[["introduction","b1-u1-stories-l3-intro","What I Have Done","کارهایی که کرده‌ام",
"I have just passed my driving test. I have worked here since 2022. I haven't finished my course yet.",
"تازه در آزمون رانندگی قبول شدم. از ۲۰۲۲ اینجا کار می‌کنم. هنوز دوره‌ام را تمام نکرده‌ام."],
["explanation","b1-u1-stories-l3-ex","Since and For","since و for",
"Since + point: since Monday, since 2020. For + length: for two days, for a year. I have lived here for five years.",
"since + نقطه شروع، for + مدت. پنج سال است که اینجا زندگی می‌کنم."],
["summary","b1-u1-stories-l3-sum","Achievement Wall","دیوار دستاورد",
"Write three achievements on the wall: one with just, one with since/for, one with yet. Read and celebrate.",
"سه دستاورد روی دیوار بنویسید: یکی با just، یکی با since/for و یکی با yet. بخوانید و جشن بگیرید."]]],
["b1-u1-stories","b1-u1-stories-l4","Review: Storytelling","مرور: داستان‌گویی",
"Consolidate narration across past tenses.","روایت در زمان‌های گذشته را تثبیت کنید.",18,
["Combine past simple, continuous, and perfect.","گذشته ساده، استمراری و کامل را ترکیب کنید.","Tell a polished two-minute story.","یک داستان دو‌دقیقه‌ای پرداخت‌شده بگویید."],
[["introduction","b1-u1-stories-l4-intro","Storyteller's Tools","ابزارهای داستان‌گو",
"Background (was raining), main events (arrived, saw), earlier events (had forgotten), feelings (was nervous).",
"زمینه، رویدادهای اصلی، رویدادهای قبلی‌تر و احساس‌ها. هر چهار ابزار را در داستان بعدی به کار ببرید."],
["example","b1-u1-stories-l4-ex","Two Minutes","دو دقیقه",
"Tell your best story in two minutes. Your partner notes one strength and one tense to fix.",
"بهترین داستانتان را در دو دقیقه بگویید. هم‌کلاسی یک نقطه قوت و یک زمان فعل برای اصلاح یادداشت کند."],
["summary","b1-u1-stories-l4-sum","Checklist","فهرست بررسی",
"Present perfect? Past perfect? Linkers? Story arc? Unit 1 complete!",
"حال کامل؟ گذشته کامل؟ پیونددهنده‌ها؟ قوس داستان؟ واحد اول کامل شد!"]]],
["b1-u2-opinions","b1-u2-opinions-l1","Likes and Dislikes","علاقه‌ها و بی‌علاقگی‌ها",
"Express preferences with gerunds and infinitives.","سلیقه‌ها را با اسم مصدر و مصدر بیان کنید.",22,
["Use verb patterns after like/love/hate.","الگوهای فعلی پس از like و love و hate را به کار ببرید.","State preferences with reasons.","سلیقه‌ها را با دلیل بیان کنید."],
[["introduction","b1-u2-opinions-l1-intro","What I Love","چه چیزی را دوست دارم",
"I love swimming but I hate running. I like to cook on Fridays. After love/like/hate, use verb + -ing.",
"شنا را دوست دارم ولی از دویدن متنفرم. دوست دارم جمعه‌ها آشپزی کنم. پس از این فعل‌ها معمولاً فعل با ing- می‌آید."],
["explanation","b1-u2-opinions-l1-ex","Gerund or Infinitive?","اسم مصدر یا مصدر؟",
"Enjoy, finish, mind → -ing: I enjoy reading. Want, decide, plan → to: I want to travel. Like/love/hate → both!",
"enjoy و finish و mind با ing-؛ want و decide و plan با to. like و love و hate هر دو را می‌پذیرند!"],
["summary","b1-u2-opinions-l1-sum","Preference Pairs","جفت‌های سلیقه",
"Compare tastes with a partner: books or films? city or village? mountains or sea? Give one reason each.",
"سلیقه‌ها را با هم‌کلاسی مقایسه کنید: کتاب یا فیلم؟ شهر یا روستا؟ کوه یا دریا؟ برای هر کدام یک دلیل بگویید."]]],
["b1-u2-opinions","b1-u2-opinions-l2","Giving Reasons","دلیل آوردن",
"Support opinions with because, so, and relative clauses.","نظرها را با because و so و موصولی پشتیبانی کنید.",22,
["Give reasons with linkers.","با پیونددهنده‌ها دلیل بیاورید.","Define things with who/which/that.","چیزها را با who و which و that تعریف کنید."],
[["introduction","b1-u2-opinions-l2-intro","Why?","چرا؟",
"I prefer trains because they are calm. I like colleagues who are honest. Reasons make opinions strong.",
"قطار را ترجیح می‌دهم چون آرام است. همکارهای صادق را دوست دارم. دلیل‌ها نظرها را قوی می‌کنند."],
["explanation","b1-u2-opinions-l2-ex","Relative Clauses","جمله‌های موصولی",
"A teacher is someone who explains well. A hostel is a place where travellers sleep cheaply. That works for people and things.",
"معلم کسی است که خوب توضیح می‌دهد. هاستل جایی است که مسافران ارزان می‌خوابند."],
["summary","b1-u2-opinions-l2-sum","Defend It","دفاع کن",
"State an opinion, give two reasons, and define one key word with a relative clause.",
"یک نظر بگویید، دو دلیل بیاورید و یک واژه کلیدی را با جمله موصولی تعریف کنید."]]],
["b1-u2-opinions","b1-u2-opinions-l3","Agreeing and Disagreeing","موافقت و مخالفت",
"Exchange views politely in discussion.","در بحث مؤدبانه نظر رد و بدل کنید.",22,
["Agree and disagree politely.","مؤدبانه موافقت و مخالفت کنید.","Soften disagreement with phrases.","مخالفت را با عبارت‌ها ملایم کنید."],
[["introduction","b1-u2-opinions-l3-intro","I See Your Point","حرفت را می‌فهمم",
"I agree with you. Good point, but … I see it differently. I am afraid I disagree. Politeness keeps discussions open.",
"با تو موافقم. نکته خوبی است، ولی … من جور دیگری می‌بینم. متأسفم مخالفم. ادب بحث را باز نگه می‌دارد."],
["example","b1-u2-opinions-l3-ex","Soft Disagreement","مخالفت نرم",
"Strong: You are wrong. Soft: I understand, but have you thought about …? Always answer the idea, not the person.",
"تند: اشتباه می‌کنی. نرم: می‌فهمم، ولی به … فکر کرده‌ای؟ همیشه به ایده جواب بده، نه به شخص."],
["summary","b1-u2-opinions-l3-sum","Mini Debate","مناظره کوچک",
"Topic: City life is better than village life. Speak for one minute each side. Use two soft-disagreement phrases.",
"موضوع: زندگی شهری از روستایی بهتر است. هر طرف یک دقیقه صحبت کند. دو عبارت مخالفت نرم به کار ببرید."]]],
["b1-u2-opinions","b1-u2-opinions-l4","Review: Opinion Exchange","مرور: تبادل نظر",
"Consolidate opinions, reasons, and polite debate.","نظرها، دلیل‌ها و بحث مؤدبانه را تثبیت کنید.",18,
["Run a balanced discussion.","یک بحث متعادل اجرا کنید.","Review verb patterns and linkers.","الگوهای فعلی و پیونددهنده‌ها را مرور کنید."],
[["introduction","b1-u2-opinions-l4-intro","Discussion Club","باشگاه بحث",
"Choose: homework, phones at dinner, or working from home. Everyone speaks twice: once to state, once to respond.",
"انتخاب کنید: تکلیف، گوشی سر سفره یا دورکاری. هر نفر دو بار صحبت کند: یک بار اعلام نظر، یک بار پاسخ."],
["example","b1-u2-opinions-l4-ex","Good Habits","عادت‌های خوب",
"Listen fully. Note the reason. Respond to the reason. Ask one follow-up question. Summarise at the end.",
"کامل گوش بده. دلیل را یادداشت کن. به دلیل جواب بده. یک سؤال پیگیر بپرس. در پایان جمع‌بندی کن."],
["summary","b1-u2-opinions-l4-sum","Checklist","فهرست بررسی",
"Preferences? Reasons? Relative clauses? Polite disagreement? Unit 2 complete!",
"سلیقه‌ها؟ دلیل‌ها؟ جمله موصولی؟ مخالفت مؤدبانه؟ واحد دوم کامل شد!"]]],
["b1-u3-work","b1-u3-work-l1","Jobs and Responsibilities","شغل‌ها و مسئولیت‌ها",
"Describe roles with passives and have to.","نقش‌ها را با مجهول و have to توصیف کنید.",22,
["Describe jobs and duties.","شغل‌ها و وظایف را توصیف کنید.","Use present passive and have to.","از مجهول حال و have to استفاده کنید."],
[["introduction","b1-u3-work-l1-intro","Who Does What?","چه کسی چه کار می‌کند؟",
"The reports are written every Friday. I have to answer emails. Passives describe processes; have to describes duties.",
"گزارش‌ها هر جمعه نوشته می‌شوند. باید به ایمیل‌ها جواب دهم. مجهول فرایند را می‌گوید؛ have to وظیفه را."],
["explanation","b1-u3-work-l1-ex","Present Passive","مجهول حال",
"be + past participle: The shop is opened at eight. The rooms are cleaned daily. The agent is unknown or unimportant.",
"الگو: be + اسم مفعول. مغازه ساعت هشت باز می‌شود. اتاق‌ها روزانه تمیز می‌شوند."],
["summary","b1-u3-work-l1-sum","Job Card","کارت شغلی",
"Describe a job in five sentences: duties with have to, processes with passives. Others guess the job.",
"یک شغل را در پنج جمله توصیف کنید: وظایف با have to و فرایندها با مجهول. بقیه شغل را حدس بزنند."]]],
["b1-u3-work","b1-u3-work-l2","Meetings and Messages","جلسه‌ها و پیام‌ها",
"Handle workplace messages and short meetings.","پیام‌های کاری و جلسه‌های کوتاه را مدیریت کنید.",22,
["Write clear workplace messages.","پیام‌های کاری روشن بنویسید.","Report speech with said/told.","گفتار را با said و told نقل کنید."],
[["introduction","b1-u3-work-l2-intro","Short and Clear","کوتاه و روشن",
"Morning all — the meeting is moved to 11. Please bring the sales list. Thanks! Good messages: news first, action clear.",
"صبح بخیر همگی — جلسه به ۱۱ منتقل شد. لطفاً فهرست فروش را بیاورید. ممنون! پیام خوب: اول خبر، بعد اقدام روشن."],
["explanation","b1-u3-work-l2-ex","Reported Speech","نقل قول غیرمستقیم",
"She said the meeting was at ten. He told me to send the file. Backshift: present → past in reported speech.",
"او گفت جلسه ساعت ده است. او به من گفت فایل را بفرستم. در نقل غیرمستقیم زمان یک پله به عقب می‌رود."],
["summary","b1-u3-work-l2-sum","Message Chain","زنجیره پیام",
"Read a message, report it to a partner, who writes it down. Compare with the original. Fix differences.",
"پیامی بخوانید، به هم‌کلاسی گزارش دهید و او بنویسد. با اصل مقایسه کنید. تفاوت‌ها را اصلاح کنید."]]],
["b1-u3-work","b1-u3-work-l3","Study Habits","عادت‌های مطالعه",
"Discuss learning with modals of probability.","درباره یادگیری با وجهی‌های احتمال صحبت کنید.",22,
["Talk about study routines.","درباره برنامه مطالعه صحبت کنید.","Use must, might, can't for deduction.","از must و might و can't برای حدس استفاده کنید."],
[["introduction","b1-u3-work-l3-intro","How Do You Learn?","چطور یاد می‌گیری؟",
"I learn best in the morning. Flashcards might help you. That app can't be free — check the price!",
"صبح‌ها بهتر یاد می‌گیرم. فلش‌کارت شاید به تو کمک کند. آن برنامه نمی‌تواند رایگان باشد — قیمت را ببین!"],
["explanation","b1-u3-work-l3-ex","Deduction","نتیجه‌گیری",
"Must = sure it is true: She must be tired. Might = possible: It might rain. Can't = sure it is false: He can't be ill.",
"must یعنی حتماً درست است؛ might یعنی ممکن است؛ can't یعنی حتماً غلط است."],
["summary","b1-u3-work-l3-sum","Study Plan","برنامه مطالعه",
"Write a one-week English plan: four actions, two modals of advice (should), one deduction about yourself.",
"یک برنامه یک‌هفته‌ای انگلیسی بنویسید: چهار اقدام، دو توصیه با should و یک حدس درباره خودتان."]]],
["b1-u3-work","b1-u3-work-l4","Review: Professional Basics","مرور: مبانی حرفه‌ای",
"Consolidate work English: passives, messages, modals.","انگلیسی کاری را تثبیت کنید: مجهول، پیام‌ها، وجهی‌ها.",18,
["Simulate a workday in English.","یک روز کاری را به انگلیسی شبیه‌سازی کنید.","Review passives and reported speech.","مجهول و نقل غیرمستقیم را مرور کنید."],
[["introduction","b1-u3-work-l4-intro","Office Day","روز اداره",
"Morning meeting → task messages → problem call → end-of-day report. Play all four scenes.",
"جلسه صبح، پیام‌های وظیفه، تماس مشکل و گزارش پایان روز. هر چهار صحنه را بازی کنید."],
["example","b1-u3-work-l4-ex","End-of-Day Report","گزارش پایان روز",
"Today the files were checked, two clients were called, and the report was sent. Tomorrow I have to finish the budget.",
"امروز فایل‌ها بررسی، با دو مشتری تماس و گزارش ارسال شد. فردا باید بودجه را تمام کنم."],
["summary","b1-u3-work-l4-sum","Checklist","فهرست بررسی",
"Passives? have to? Reported speech? Deduction modals? Unit 3 complete!",
"مجهول؟ have to؟ نقل غیرمستقیم؟ وجهی‌های حدس؟ واحد سوم کامل شد!"]]],
["b1-u4-world","b1-u4-world-l1","Planning a Journey","برنامه‌ریزی سفر",
"Plan travel with second conditionals and research.","سفر را با شرطی نوع دوم و تحقیق برنامه‌ریزی کنید.",22,
["Discuss hypothetical travel.","درباره سفرهای فرضی صحبت کنید.","Use second conditional.","از شرطی نوع دوم استفاده کنید."],
[["introduction","b1-u4-world-l1-intro","Dream Trips","سفرهای رؤیایی",
"If I had more time, I would travel by train across the country. If we went in autumn, tickets would be cheaper.",
"اگر وقت بیشتری داشتم، با قطار در کشور سفر می‌کردم. اگر پاییز می‌رفتیم، بلیت‌ها ارزان‌تر بود."],
["explanation","b1-u4-world-l1-ex","Second Conditional","شرطی نوع دوم",
"If + past simple, would + verb: If I knew the answer, I would tell you. Use it for unreal present/future dreams.",
"الگو: If + گذشته ساده، would + فعل. برای آرزوهای غیرواقعی حال و آینده."],
["summary","b1-u4-world-l1-sum","Dream Itinerary","برنامه سفر رؤیایی",
"Plan a dream trip for 1 million tomans: where, how, what. Present with two second-conditional sentences.",
"یک سفر رؤیایی با بودجه مشخص برنامه‌ریزی کنید: کجا، چطور، چه. با دو جمله شرطی نوع دوم ارائه دهید."]]],
["b1-u4-world","b1-u4-world-l2","Culture and Customs","فرهنگ و آداب",
"Compare customs across cultures.","آداب فرهنگ‌های مختلف را مقایسه کنید.",22,
["Describe customs and etiquette.","آداب و رسوم را توصیف کنید.","Compare cultures respectfully.","فرهنگ‌ها را محترمانه مقایسه کنید."],
[["introduction","b1-u4-world-l2-intro","When in …","هر جا که …",
"In Japan, people bow when they meet. In Iran, guests are offered tea first. Customs show respect differently.",
"در ژاپن مردم هنگام دیدار تعظیم می‌کنند. در ایران اول به مهمان چای تعارف می‌شود. آداب احترام را متفاوت نشان می‌دهند."],
["explanation","b1-u4-world-l2-ex","Used To","عادت گذشته",
"People used to write letters; now they send messages. My grandmother used to tell stories every night.",
"مردم قبلاً نامه می‌نوشتند؛ حالا پیام می‌فرستند. مادربزرگم قبلاً هر شب داستان می‌گفت."],
["summary","b1-u4-world-l2-sum","Culture Guide","راهنمای فرهنگ",
"Write a mini-guide for a visitor to your city: three customs, two taboos, one useful phrase.",
"یک راهنمای کوچک برای بازدیدکننده شهرتان بنویسید: سه رسم، دو پرهیز و یک عبارت کاربردی."]]],
["b1-u4-world","b1-u4-world-l3","Media and Reviews","رسانه و نقد",
"Review films, books, and places with balance.","فیلم، کتاب و مکان‌ها را متوازن نقد کنید.",22,
["Write a structured review.","یک نقد ساخت‌یافته بنویسید.","Balance praise and criticism.","تحسین و انتقاد را متعادل کنید."],
[["introduction","b1-u4-world-l3-intro","Worth Watching?","ارزش دیدن دارد؟",
"The story was slow at first, but the ending was brilliant. The acting was excellent, although the music was loud.",
"داستان اول کند بود ولی پایانش عالی بود. بازی عالی بود، هرچند موسیقی بلند بود."],
["explanation","b1-u4-world-l3-ex","Contrast Linkers","پیونددهنده‌های تضاد",
"But, although, however, despite. Despite the rain, we stayed. The hotel was small; however, it was clean.",
"but و although و however و despite. با وجود باران ماندیم. هتل کوچک بود؛ اما تمیز بود."],
["summary","b1-u4-world-l3-sum","Three-Star Review","نقد سه‌ستاره",
"Review something honestly: one strength, one weakness, one recommendation. End with stars out of five.",
"چیزی را صادانه نقد کنید: یک قوت، یک ضعف و یک توصیه. پایان با امتیاز از پنج."]]],
["b1-u4-world","b1-u4-world-l4","Review: World Explorer","مرور: کاوشگر جهان",
"Consolidate travel, culture, and review language.","زبان سفر، فرهنگ و نقد را تثبیت کنید.",18,
["Present a culture-travel project.","یک پروژه سفر-فرهنگ ارائه دهید.","Review conditionals and contrast.","شرطی و تضاد را مرور کنید."],
[["introduction","b1-u4-world-l4-intro","Around the World","دور دنیا",
"Pick a country. Present: one custom, one dish, one place to visit, and one film from there.",
"کشوری انتخاب کنید. ارائه دهید: یک رسم، یک غذا، یک مکان دیدنی و یک فیلم از آنجا."],
["example","b1-u4-world-l4-ex","If I Went …","اگر می‌رفتم …",
"If I went to Brazil, I would learn samba. Although the flight is long, the beaches are worth it!",
"اگر به برزیل می‌رفتم، سامبا یاد می‌گرفتم. هرچند پرواز طولانی است، ساحل‌ها ارزشش را دارند!"],
["summary","b1-u4-world-l4-sum","B1 Complete!","B1 کامل شد!",
"You finished B1: stories, opinions, work, and world. You are an independent user now!",
"B1 را تمام کردی: داستان‌ها، نظرها، کار و جهان. حالا کاربر مستقلی هستی!"]]],
];

/* ------------------------- B2 lessons (16) ------------------------------ */

const LESSON_ROWS_B2 = [
["b2-u1-ideas","b2-u1-ideas-l1","Forming an Argument","ساختن استدلال",
"Build clear claims with supporting reasons.","ادعاهای روشن با دلیل‌های پشتیبان بسازید.",25,
["State claims precisely.","ادعاها را دقیق بیان کنید.","Organise reasons logically.","دلیل‌ها را منطقی مرتب کنید."],
[["introduction","b2-u1-ideas-l1-intro","Claim + Reason","ادعا + دلیل",
"Cities should ban cars from centres. First, air would be cleaner. Second, streets would be safer for children.",
"شهرها باید مرکز را به روی خودرو ببندند. اول، هوا پاک‌تر می‌شود. دوم، خیابان‌ها برای بچه‌ها امن‌تر می‌شود."],
["explanation","b2-u1-ideas-l1-ex","Discourse Markers","نشانگرهای گفتمان",
"Firstly, moreover, furthermore, in addition. Order your reasons: Firstly … Moreover … Most importantly …",
"نخست، علاوه بر این، افزون بر آن. دلیل‌ها را مرتب کنید: اول … علاوه بر این … مهم‌تر از همه …"],
["summary","b2-u1-ideas-l1-sum","Sixty-Second Case","پرونده شصت‌ثانیه‌ای",
"Argue for or against school uniforms in one minute: claim, three reasons, conclusion.",
"موافق یا مخالف لباس فرم مدرسه در یک دقیقه استدلال کنید: ادعا، سه دلیل، نتیجه."]]],
["b2-u1-ideas","b2-u1-ideas-l2","Supporting Evidence","ارائه شواهد",
"Strengthen arguments with examples and data.","استدلال‌ها را با مثال و داده قوی کنید.",25,
["Use evidence effectively.","از شواهد مؤثر استفاده کنید.","Cite examples and sources.","مثال‌ها و منابع را ذکر کنید."],
[["introduction","b2-u1-ideas-l2-intro","Show, Don't Just Say","نشان بده، فقط نگو",
"For example, Oslo cut city-centre traffic and cycling doubled. According to the report, accidents fell by 30%.",
"مثلاً اسلو ترافیک مرکز را کم کرد و دوچرخه‌سواری دو برابر شد. طبق گزارش، تصادف‌ها ۳۰ درصد کم شد."],
["explanation","b2-u1-ideas-l2-ex","Cleft Sentences","جمله‌های شکافته",
"It is the evidence that convinces people. What matters most is safety. Clefts stress the key point.",
"این شواهد است که مردم را قانع می‌کند. مهم‌ترین چیز امنیت است. جمله شکافته نکته کلیدی را برجسته می‌کند."],
["summary","b2-u1-ideas-l2-sum","Evidence Hunt","شکار شواهد",
"Take yesterday's claim. Find one example, one number, and one expert voice. Rebuild the argument.",
"ادعای دیروز را بردارید. یک مثال، یک عدد و یک نظر کارشناسی پیدا کنید. استدلال را بازسازی کنید."]]],
["b2-u1-ideas","b2-u1-ideas-l3","Handling Counterarguments","پاسخ به استدلال مخالف",
"Concede, refute, and qualify positions.","بپذیرید، رد کنید و موضع را مشروط کنید.",25,
["Concede points gracefully.","نکته‌ها را با وقار بپذیرید.","Refute with stronger reasons.","با دلیل‌های قوی‌تر رد کنید."],
[["introduction","b2-u1-ideas-l3-intro","Yes, But …","بله، ولی …",
"Critics argue that bans hurt shops. It is true that change is hard; however, evidence shows trade recovers within a year.",
"منتقدان می‌گویند ممنوعیت به مغازه‌ها ضرر می‌زند. درست است که تغییر سخت است؛ اما شواهد نشان می‌دهد تجارت در یک سال برمی‌گردد."],
["explanation","b2-u1-ideas-l3-ex","Concession Language","زبان پذیرش",
"Admittedly, while it is true that, despite concerns. Admittedly, costs rise first; nevertheless, benefits last longer.",
"بی‌تردید، هرچند درست است که، با وجود نگرانی‌ها. بی‌تردید اول هزینه‌ها بالا می‌رود؛ با این حال سودها ماندگارترند."],
["summary","b2-u1-ideas-l3-sum","Steelperson","تقویت نظر مخالف",
"State the opponent's best point better than they did — then refute it. Strong thinkers steelperson first.",
"بهترین نکته مخالف را بهتر از خودش بگویید — بعد ردش کنید. متفکران قوی اول نظر مخالف را تقویت می‌کنند."]]],
["b2-u1-ideas","b2-u1-ideas-l4","Review: Debate Skills","مرور: مهارت مناظره",
"Consolidate full argumentative exchanges.","تبادل‌های استدلالی کامل را تثبیت کنید.",20,
["Debate with structure and respect.","با ساختار و احترام مناظره کنید.","Review clefts and discourse markers.","شکافته و نشانگرهای گفتمان را مرور کنید."],
[["introduction","b2-u1-ideas-l4-intro","Formal Mini-Debate","مناظره رسمی کوچک",
"Motion: Homework should be abolished. Two speakers each side, two minutes each, one summary each.",
"موضوع: تکلیف باید حذف شود. هر طرف دو سخنران، هر نفر دو دقیقه و یک جمع‌بندی."],
["example","b2-u1-ideas-l4-ex","Judging","داوری",
"Judges score: clear claim (2), evidence (2), rebuttal (2), language (2). Announce and justify the winner.",
"داوران امتیاز می‌دهند: ادعای روشن، شواهد، پاسخ به مخالف و زبان. برنده را اعلام و توجیه کنید."],
["summary","b2-u1-ideas-l4-sum","Checklist","فهرست بررسی",
"Claims? Evidence? Concession? Rebuttal? Unit 1 complete!",
"ادعاها؟ شواهد؟ پذیرش؟ رد؟ واحد اول کامل شد!"]]],
["b2-u2-work","b2-u2-work-l1","Meetings That Work","جلسه‌های مؤثر",
"Run and join efficient meetings.","جلسه‌های کارآمد را اجرا کنید و در آن شرکت کنید.",25,
["Chair a short meeting.","یک جلسه کوتاه را اداره کنید.","Interrupt and clarify politely.","مؤدبانه وارد صحبت شوید و روشن‌سازی کنید."],
[["introduction","b2-u2-work-l1-intro","Agenda First","اول دستور جلسه",
"Let's start with sales, then move to hiring. Could we come back to that later? Sorry to interrupt, but what do you mean by …?",
"با فروش شروع کنیم، بعد برویم سراغ استخدام. می‌شود بعداً به آن برگردیم؟ ببخشید وسط حرفتان، منظورتان از … چیست؟"],
["explanation","b2-u2-work-l1-ex","Reported Decisions","گزارش تصمیم‌ها",
"He suggested postponing the launch. She insisted that the budget was fixed. Reporting verbs: suggest, insist, admit, deny.",
"او پیشنهاد داد رونمایی عقب بیفتد. او اصرار داشت بودجه ثابت است. افعال گزارش: پیشنهاد، اصرار، اعتراف، انکار."],
["summary","b2-u2-work-l1-sum","Ten-Minute Meeting","جلسه ده‌دقیقه‌ای",
"Hold a meeting with an agenda of three items. End with decisions: who does what by when.",
"جلسه‌ای با دستور سه‌بندی برگزار کنید. پایان با تصمیم‌ها: چه کسی چه کاری تا کی."]]],
["b2-u2-work","b2-u2-work-l2","Presentations","ارائه‌ها",
"Deliver structured, persuasive presentations.","ارائه‌های ساخت‌یافته و اقناعی انجام دهید.",25,
["Structure a presentation.","یک ارائه را ساختاردهی کنید.","Handle questions confidently.","به سؤال‌ها با اعتمادبه‌نفس جواب دهید."],
[["introduction","b2-u2-work-l2-intro","Open Strong","قوی شروع کنید",
"Good morning. Today I will show why our delivery times fell. I will cover three points and end with a proposal.",
"صبح بخیر. امروز نشان می‌دهم چرا زمان تحویل ما کم شد. سه نکته را می‌گویم و با یک پیشنهاد تمام می‌کنم."],
["explanation","b2-u2-work-l2-ex","Signposting","علامت‌گذاری مسیر",
"Moving on to …, To sum up …, If I may, I'll come back to that. Signposts guide tired listeners.",
"بریم سراغ …، خلاصه اینکه …، اگر اجازه بدهید بعداً به آن برمی‌گردم. این عبارت‌ها شنونده خسته را راهنمایی می‌کنند."],
["summary","b2-u2-work-l2-sum","Three Slides","سه اسلاید",
"Present any topic in three slides: problem, evidence, proposal. Three minutes, then two questions.",
"هر موضوعی را در سه اسلاید ارائه دهید: مشکل، شواهد، پیشنهاد. سه دقیقه، بعد دو سؤال."]]],
["b2-u2-work","b2-u2-work-l3","Workplace Problems","مشکلات محیط کار",
"Solve conflicts with tact and modal perfects.","تعارض‌ها را با درایت و ماضی وجهی حل کنید.",25,
["Discuss past mistakes tactfully.","درباره اشتباه‌های گذشته با درایت صحبت کنید.","Use modal perfects for critique.","از ماضی وجهی برای نقد استفاده کنید."],
[["introduction","b2-u2-work-l3-intro","What Went Wrong?","چه اشتباهی شد؟",
"The client was angry because the file arrived late. We should have checked the address. He must have missed the email.",
"مشتری عصبانی بود چون فایل دیر رسید. باید آدرس را بررسی می‌کردیم. حتماً ایمیل را ندیده است."],
["explanation","b2-u2-work-l3-ex","Modal Perfects","ماضی وجهی",
"Should have + participle (regret): We should have called. Must have (sure): He must have forgotten. Might have (possible).",
"should have یعنی ای کاش؛ must have یعنی حتماً؛ might have یعنی شاید. همه با اسم مفعول."],
["summary","b2-u2-work-l3-sum","Fix-It Meeting","جلسه حل مشکل",
"Role-play: a missed deadline. Explain with modal perfects, propose two fixes, agree on one.",
"بازی: ددلاین از دست رفته. با ماضی وجهی توضیح دهید، دو راه‌حل پیشنهاد دهید و روی یکی توافق کنید."]]],
["b2-u2-work","b2-u2-work-l4","Review: Office Fluency","مرور: روانی در محیط کار",
"Consolidate professional spoken English.","انگلیسی گفتاری حرفه‌ای را تثبیت کنید.",20,
["Handle meetings, talks, and problems.","جلسه‌ها، ارائه‌ها و مشکل‌ها را مدیریت کنید.","Review reporting verbs and modals.","افعال گزارش و وجهی‌ها را مرور کنید."],
[["introduction","b2-u2-work-l4-intro","Assessment Centre","مرکز ارزیابی",
"Rotate roles: chair, presenter, client, observer. Each person plays each role once across four rounds.",
"نقش‌ها را بچرخانید: رئیس جلسه، ارائه‌دهنده، مشتری و ناظر. هر نفر هر نقش را یک بار بازی کند."],
["example","b2-u2-work-l4-ex","Observer Notes","یادداشت ناظر",
"Observers note: one strong phrase, one unclear moment, one suggestion. Feedback is specific and kind.",
"ناظران یادداشت می‌کنند: یک عبارت قوی، یک لحظه نامشخص و یک پیشنهاد. بازخورد مشخص و مهربانانه است."],
["summary","b2-u2-work-l4-sum","Checklist","فهرست بررسی",
"Meetings? Presentations? Modal perfects? Reporting? Unit 2 complete!",
"جلسه‌ها؟ ارائه‌ها؟ ماضی وجهی؟ گزارش؟ واحد دوم کامل شد!"]]],
["b2-u3-society","b2-u3-society-l1","Technology in Life","فناوری در زندگی",
"Discuss tech impacts with passives and nominalisation.","درباره اثرهای فناوری با مجهول و اسم‌سازی صحبت کنید.",25,
["Discuss technology critically.","درباره فناوری نقادانه بحث کنید.","Use advanced passives.","از مجهول پیشرفته استفاده کنید."],
[["introduction","b2-u3-society-l1-intro","Connected?","متصل؟",
"Our data is collected daily. Attention is sold to advertisers. The passive fits systems where the agent hides.",
"داده‌های ما روزانه جمع می‌شود. توجه ما به تبلیغ‌کننده‌ها فروخته می‌شود. مجهول برای سامانه‌هایی است که عامل پنهان است."],
["explanation","b2-u3-society-l3-ex","Passive Range","گستره مجهول",
"Is being tracked, has been leaked, will be regulated, should be protected. Match the passive tense to the meaning.",
"در حال ردیابی است، لو رفته است، قانونمند خواهد شد، باید محافظت شود. زمان مجهول را با معنا هماهنگ کنید."],
["summary","b2-u3-society-l1-sum","Tech Audit","ممیزی فناوری",
"Audit your own tech: what is collected, what should be limited, what must be protected. Present findings.",
"فناوری خودتان را ممیزی کنید: چه چیزی جمع می‌شود، چه چیزی باید محدود شود، چه چیزی باید محافظت شود."]]],
["b2-u3-society","b2-u3-society-l2","Social Trends","روندهای اجتماعی",
"Describe change with trends language.","تغییر را با زبان روندها توصیف کنید.",25,
["Describe trends and change.","روندها و تغییر را توصیف کنید.","Use participle clauses concisely.","از بندهای وصفی فشرده استفاده کنید."],
[["introduction","b2-u3-society-l2-intro","Rising and Falling","صعود و سقوط",
"Remote work is rising sharply, while office rents are falling. Marriage rates have declined steadily for a decade.",
"دورکاری به‌سرعت رو به افزایش است، در حالی که اجاره اداره‌ها رو به کاهش است. نرخ ازدواج یک دهه است پیوسته کم شده است."],
["explanation","b2-u3-society-l2-ex","Participle Clauses","بندهای وصفی",
"Having finished the survey, we saw the trend. Compared to 2010, costs have doubled. Concise and formal.",
"پس از اتمام نظرسنجی، روند را دیدیم. در مقایسه با ۲۰۱۰، هزینه‌ها دو برابر شده است. فشرده و رسمی."],
["summary","b2-u3-society-l2-sum","Trend Talk","گفت‌وگوی روند",
"Present one trend in your city: what is changing, how fast, and why it matters. Use three trend verbs.",
"یک روند در شهرتان ارائه دهید: چه چیزی در حال تغییر است، با چه سرعتی و چرا مهم است. سه فعل روند به کار ببرید."]]],
["b2-u3-society","b2-u3-society-l3","Cities and Communities","شهرها و جوامع",
"Debate urban life with conditionals and inversion.","درباره زندگی شهری با شرطی و وارونگی بحث کنید.",25,
["Debate city policies.","درباره سیاست‌های شهری بحث کنید.","Use third and mixed conditionals.","از شرطی نوع سوم و ترکیبی استفاده کنید."],
[["introduction","b2-u3-society-l3-intro","If Cities Could …","اگر شهرها می‌توانستند …",
"If the metro had reached our district, traffic would be lighter now. Mixed conditional: past cause, present result.",
"اگر مترو به محله ما رسیده بود، حالا ترافیک سبک‌تر بود. شرطی ترکیبی: علت گذشته، نتیجه حال."],
["explanation","b2-u3-society-l3-ex","Inversion After Negatives","وارونگی پس از منفی",
"Rarely have rents fallen so fast. Not only is housing dear, but transport is too. Inversion adds drama and formality.",
"به‌ندرت اجاره‌ها چنین سریع افتاده است. نه‌تنها مسکن گران است، بلکه حمل‌ونقل هم. وارونگی رسمیت و تأکید می‌دهد."],
["summary","b2-u3-society-l3-sum","Mayor for a Day","شهردار یک‌روزه",
"Propose three city changes. For each: what, why, and what would happen if it failed (third conditional).",
"سه تغییر شهری پیشنهاد دهید. برای هر کدام: چه، چرا و اگر شکست بخورد چه می‌شد (شرطی نوع سوم)."]]],
["b2-u3-society","b2-u3-society-l4","Review: Modern Society","مرور: جامعه مدرن",
"Consolidate society topics and advanced grammar.","موضوع‌های جامعه و گرامر پیشرفته را تثبیت کنید.",20,
["Discuss society with range.","با گستره زبانی درباره جامعه بحث کنید.","Review passives, participles, inversion.","مجهول، وصفی و وارونگی را مرور کنید."],
[["introduction","b2-u3-society-l4-intro","Society Summit","اجلاس جامعه",
"Groups represent youth, workers, business, and elders. Each presents one demand with evidence.",
"گروه‌ها نماینده جوانان، کارگران، کسب‌وکار و سالمندان‌اند. هر کدام یک مطالبه با شواهد ارائه می‌دهد."],
["example","b2-u3-society-l4-ex","Joint Statement","بیانیه مشترک",
"Draft one paragraph all groups sign. Every sentence must survive a challenge from another group.",
"یک پاراگراف بنویسید که همه گروه‌ها امضا کنند. هر جمله باید در برابر چالش گروه دیگر بماند."],
["summary","b2-u3-society-l4-sum","Checklist","فهرست بررسی",
"Tech critique? Trends? City debate? Advanced grammar? Unit 3 complete!",
"نقد فناوری؟ روندها؟ بحث شهری؟ گرامر پیشرفته؟ واحد سوم کامل شد!"]]],
["b2-u4-culture","b2-u4-culture-l1","Arts and Entertainment","هنر و سرگرمی",
"Review arts with rich descriptive language.","هنر را با زبان توصیفی غنی نقد کنید.",25,
["Review performances and exhibitions.","اجراها و نمایشگاه‌ها را نقد کنید.","Use sensory descriptive language.","از زبان توصیفی حسی استفاده کنید."],
[["introduction","b2-u4-culture-l1-intro","On Stage","روی صحنه",
"The play opens quietly, then grips you. The lighting was breathtaking; the second act dragged slightly.",
"نمایش آرام شروع می‌شود، بعد تو را می‌گیرد. نورپردازی خیره‌کننده بود؛ پرده دوم کمی کش آمد."],
["explanation","b2-u4-culture-l1-ex","Review Structure","ساختار نقد",
"Context (what/where), highlights (best moments), reservations (weaknesses), verdict (who should go).",
"زمینه (چه/کجا)، نقاط برجسته، ملاحظات (ضعف‌ها) و رأی نهایی (چه کسی برود)."],
["summary","b2-u4-culture-l1-sum","Critic's Corner","گوشه منتقد",
"Review a concert, film, or match you attended. 150 words. End with a clear recommendation.",
"کنسرت، فیلم یا مسابقه‌ای که رفته‌اید نقد کنید. ۱۵۰ واژه. پایان با توصیه روشن."]]],
["b2-u4-culture","b2-u4-culture-l2","Nature and Environment","طبیعت و محیط زیست",
"Argue environmental cases with data.","درباره محیط زیست با داده استدلال کنید.",25,
["Argue for environmental action.","برای اقدام زیست‌محیطی استدلال کنید.","Use cause-effect language.","از زبان علت و معلول استفاده کنید."],
[["introduction","b2-u4-culture-l2-intro","One River","یک رودخانه",
"Our river is polluted because factories dump waste. As a result, fish have vanished. Unless rules change, it will die.",
"رودخانه ما آلوده است چون کارخانه‌ها پسماند می‌ریزند. در نتیجه ماهی‌ها ناپدید شده‌اند. مگر اینکه قوانین عوض شود، می‌میرد."],
["explanation","b2-u4-culture-l2-ex","Cause and Effect","علت و معلول",
"Because, since, as a result, consequently, due to, lead to. Due to drought, supplies fell, leading to higher prices.",
"because و since و as a result و consequently و due to و lead to. به‌علت خشکسالی عرضه افتاد و قیمت‌ها بالا رفت."],
["summary","b2-u4-culture-l2-sum","Green Proposal","پیشنهاد سبز",
"Propose one local green action: problem, cause, solution, cost, benefit. One page, ready for the mayor.",
"یک اقدام سبز محلی پیشنهاد دهید: مشکل، علت، راه‌حل، هزینه و سود. یک صفحه، آماده برای شهردار."]]],
["b2-u4-culture","b2-u4-culture-l3","Travel Stories","داستان‌های سفر",
"Write vivid travel narratives.","سفرنامه‌های زنده بنویسید.",25,
["Narrate travel vividly.","سفر را زنده روایت کنید.","Blend description and reflection.","توصیف و تأمل را ترکیب کنید."],
[["introduction","b2-u4-culture-l3-intro","Postcards to Prose","از کارت‌پستال تا نثر",
"Beyond 'it was nice': the bazaar smelled of saffron; the alley echoed with hammering; time slowed down.",
"فراتر از «خوب بود»: بازار بوی زعفران می‌داد؛ کوچه از صدای چکش می‌پیچید؛ زمان کند شد."],
["example","b2-u4-culture-l3-ex","Show the Senses","حس‌ها را نشان بده",
"Sight, sound, smell, taste, touch — use three in every travel paragraph. Compare: nice food → crisp bread, sour cheese.",
"بینایی، شنوایی، بویایی، چشایی، لامسه — در هر پاراگراف سفر سه حس. مقایسه: غذای خوب در برابر نان برشته و پنیر ترش."],
["summary","b2-u4-culture-l3-sum","Travel Feature","گزارش سفر",
"Write 200 words on a place you know: arrive, notice three senses, meet someone, reflect. Publish on the wall.",
"درباره جایی که می‌شناسید ۲۰۰ واژه بنویسید: رسیدن، سه حس، دیدار با کسی و تأمل. روی دیوار منتشر کنید."]]],
["b2-u4-culture","b2-u4-culture-l4","Review: Cultural Literacy","مرور: سواد فرهنگی",
"Consolidate culture, environment, and narrative writing.","فرهنگ، محیط زیست و نگارش روایی را تثبیت کنید.",20,
["Produce polished cultural writing.","نگارش فرهنگی پرداخت‌شده تولید کنید.","Review the B2 toolkit.","جعبه‌ابزار B2 را مرور کنید."],
[["introduction","b2-u4-culture-l4-intro","Magazine Day","روز مجله",
"Compile the unit's reviews, proposals, and travel pieces into a class magazine. Edit each other's work.",
"نقدها، پیشنهادها و سفرنامه‌های واحد را در مجله کلاس گرد کنید. کار هم را ویرایش کنید."],
["example","b2-u4-culture-l4-ex","Editing Pass","ویرایش",
"Check: strong verbs? varied markers? one cleft? correct passives? Cut ten weak words from every piece.",
"بررسی: فعل‌های قوی؟ نشانگرهای متنوع؟ یک شکافته؟ مجهول درست؟ از هر متن ده واژه ضعیف حذف کنید."],
["summary","b2-u4-culture-l4-sum","B2 Complete!","B2 کامل شد!",
"You finished B2: arguments, profession, society, culture. You handle complexity with confidence!",
"B2 را تمام کردی: استدلال، حرفه، جامعه و فرهنگ. پیچیدگی را با اعتمادبه‌نفس مدیریت می‌کنی!"]]],
];

/* ------------------------- C1 lessons (16) ------------------------------ */

const LESSON_ROWS_C1 = [
["c1-u1-discourse","c1-u1-discourse-l1","Structuring Arguments","ساختاردهی به استدلال",
"Architect extended arguments with clear hierarchy.","استدلال‌های بلند را با سلسله‌مراتب روشن معماری کنید.",28,
["Build multi-level arguments.","استدلال‌های چندلایه بسازید.","Signal hierarchy explicitly.","سلسله‌مراتب را صریح علامت بزنید."],
[["introduction","c1-u1-discourse-l1-intro","Architecture of Persuasion","معماری اقناع",
"Thesis → pillars → evidence → implications. Readers follow arguments they can map; signpost every level.",
"تز، ستون‌ها، شواهد و پیامدها. خواننده استدلالی را دنبال می‌کند که بتواند نقشه‌اش را بکشد؛ هر سطح را علامت بزنید."],
["explanation","c1-u1-discourse-l1-ex","Nominalisation","اسم‌سازی",
"Nominalisation condenses claims: people move → migration; prices rise → inflation. Dense nouns carry academic weight.",
"اسم‌سازی ادعاها را فشرده می‌کند: مهاجرت مردم می‌شود migration. اسم‌های فشرده وزن آکادمیک دارند."],
["summary","c1-u1-discourse-l1-sum","Blueprint","نقشه راه",
"Outline a 500-word argument: thesis, three pillars, one concession, implications. Swap outlines and stress-test.",
"طرح یک استدلال ۵۰۰واژه‌ای: تز، سه ستون، یک پذیرش و پیامدها. طرح‌ها را عوض کنید و محک بزنید."]]],
["c1-u1-discourse","c1-u1-discourse-l2","Concession and Refutation","پذیرش و رد",
"Handle objections with concession-refutation moves.","با حرکت پذیرش-رد به اعتراض‌ها پاسخ دهید.",28,
["Concede strategically.","راهبردی بپذیرید.","Refute without strawmanning.","بدون مغالطه پهلوان‌پنبه رد کنید."],
[["introduction","c1-u1-discourse-l2-intro","Stronger by Conceding","قوی‌تر با پذیرش",
"While opponents rightly note the cost, they overlook the savings. Conceding the small point wins the large one.",
"هرچند مخالفان به‌درستی به هزینه اشاره می‌کنند، صرفه‌جویی را نادیده می‌گیرند. پذیرش نکته کوچک، نکته بزرگ را می‌برد."],
["explanation","c1-u1-discourse-l2-ex","Fronting for Emphasis","پیش‌گذاری برای تأکید",
"Equally important is the timeline. Of greater concern is safety. Fronting (complement first) spotlights key ideas.",
"به‌همان‌اندازه مهم، زمان‌بندی است. نگران‌کننده‌تر، امنیت است. پیش‌گذاری ایده کلیدی را در کانون می‌گذارد."],
["summary","c1-u1-discourse-l2-sum","Refutation Drill","تمرین رد",
"Take three hostile objections. For each: concede one grain, refute the core, restate your thesis sharper.",
"سه اعتراض خصمانه را بردارید. برای هر کدام: یک ذره بپذیرید، هسته را رد کنید و تز را تیزتر بازگو کنید."]]],
["c1-u1-discourse","c1-u1-discourse-l3","Register and Tone","سبک و لحن",
"Shift register deliberately for audience and purpose.","سبک را آگاهانه برای مخاطب و هدف تغییر دهید.",28,
["Distinguish formal, neutral, informal.","رسمی، خنثی و غیررسمی را تشخیص دهید.","Rewrite across registers.","در سبک‌های مختلف بازنویسی کنید."],
[["introduction","c1-u1-discourse-l3-intro","Same News, Three Voices","یک خبر، سه صدا",
"Chat: The boss canned the trip. Neutral: The trip was cancelled. Formal: Management has regrettably cancelled the visit.",
"خودمانی، خنثی و رسمی برای یک خبر. سبک، رابطه شما با مخاطب را نشان می‌دهد."],
["explanation","c1-u1-discourse-l3-ex","Register Markers","نشانگرهای سبک",
"Vocabulary (get vs obtain), grammar (contractions vs full forms), address (Hi vs Dear). Control all three together.",
"واژگان، گرامر (مخفف یا کامل) و خطاب. هر سه را هم‌زمان کنترل کنید تا سبک یکدست بماند."],
["summary","c1-u1-discourse-l3-sum","Register Shift","تغییر سبک",
"Rewrite a complaint as: angry chat message, polite email, formal letter. Compare what changed and why.",
"یک شکایت را به سه شکل بازنویسی کنید: پیام عصبانی، ایمیل مؤدبانه و نامه رسمی. مقایسه کنید چه چیزی و چرا عوض شد."]]],
["c1-u1-discourse","c1-u1-discourse-l4","Review: Persuasive Discourse","مرور: گفتمان اقناعی",
"Consolidate advanced argumentative writing.","نگارش استدلالی پیشرفته را تثبیت کنید.",22,
["Write a complete persuasive essay.","یک مقاله اقناعی کامل بنویسید.","Review nominalisation and fronting.","اسم‌سازی و پیش‌گذاری را مرور کنید."],
[["introduction","c1-u1-discourse-l4-intro","The Full Case","پرونده کامل",
"Write 400 words: thesis, pillars, concession-refutation, implications. Every paragraph earns its place.",
"۴۰۰ واژه بنویسید: تز، ستون‌ها، پذیرش-رد و پیامدها. هر پاراگراف باید جای خود را به دست آورد."],
["example","c1-u1-discourse-l4-ex","Peer Tribunal","دادگاه همتایان",
"Trios judge essays: Is the thesis sharp? Is the concession honest? Is the refutation fair? Verdict with reasons.",
"سه‌نفره مقاله‌ها را داوری کنید: تز تیز است؟ پذیرش صادانه است؟ رد منصفانه است؟ رأی با دلیل."],
["summary","c1-u1-discourse-l4-sum","Checklist","فهرست بررسی",
"Hierarchy? Nominalisation? Concession? Register? Unit 1 complete!",
"سلسله‌مراتب؟ اسم‌سازی؟ پذیرش؟ سبک؟ واحد اول کامل شد!"]]],
["c1-u2-academic","c1-u2-academic-l1","Reading Research","خواندن پژوهش",
"Navigate papers: abstracts, methods, claims.","در مقاله‌ها راه بروید: چکیده، روش و ادعاها.",28,
["Read abstracts critically.","چکیده‌ها را نقادانه بخوانید.","Separate claims from evidence.","ادعاها را از شواهد جدا کنید."],
[["introduction","c1-u2-academic-l1-intro","Anatomy of a Paper","کالبدشکافی مقاله",
"Abstract (map), introduction (gap), method (how), results (what), discussion (so what). Read in that order — twice.",
"چکیده (نقشه)، مقدمه (شکاف)، روش، نتایج و بحث. همین ترتیب را دو بار بخوانید."],
["explanation","c1-u2-academic-l1-ex","Hedging in Claims","احتیاط در ادعا",
"Suggests, appears to, may indicate, is consistent with. Science hedges; notice which claims are bold and which are shy.",
"suggests و appears و may indicate. علم محتاط حرف می‌زند؛ ببینید کدام ادعا جسور و کدام کم‌روست."],
["summary","c1-u2-academic-l1-sum","Abstract Autopsy","کالبدشکافی چکیده",
"Dissect an abstract: gap? method? finding? hedge words? Present the anatomy in five sentences.",
"یک چکیده را بشکافید: شکاف؟ روش؟ یافته؟ واژه‌های احتیاط؟ کالبد را در پنج جمله ارائه دهید."]]],
["c1-u2-academic","c1-u2-academic-l2","Academic Writing Moves","تکنیک‌های نگارش آکادمیک",
"Master citation, paraphrase, and synthesis.","استناد، بازنویسی و ترکیب را مسلط شوید.",28,
["Paraphrase without patchwriting.","بدون کپی‌کاری بازنویسی کنید.","Synthesise two sources.","دو منبع را ترکیب کنید."],
[["introduction","c1-u2-academic-l2-intro","Join the Conversation","به گفت‌وگو بپیوندید",
"They say / I say: Karimi (2023) argues X; however, classroom data suggests Y. Position yourself against sources.",
"آن‌ها می‌گویند / من می‌گویم: کریمی چنین استدلال می‌کند؛ اما داده کلاس چیز دیگری نشان می‌دهد."],
["explanation","c1-u2-academic-l2-ex","Ellipsis and Substitution","حذف و جایگزینی",
"Some studies confirm this; others do not. One replaces nouns; do replaces verbs. Cohesion without repetition.",
"بعضی پژوهش‌ها تأیید می‌کنند؛ بعضی نه. one جای اسم و do جای فعل. انسجام بدون تکرار."],
["summary","c1-u2-academic-l2-sum","Synthesis Paragraph","پاراگراف ترکیبی",
"Combine two short sources into one paragraph: agree/disagree, add your stance, cite both. 150 words.",
"دو منبع کوتاه را در یک پاراگراف ترکیب کنید: موافقت/مخالفت، موضع خودتان و استناد به هر دو. ۱۵۰ واژه."]]],
["c1-u2-academic","c1-u2-academic-l3","Seminars and Discussions","سمینارها و بحث‌ها",
"Perform in seminars: questions, challenges, summaries.","در سمینار بدرخشید: سؤال، چالش و جمع‌بندی.",28,
["Ask probing seminar questions.","سؤال‌های عمیق سمیناری بپرسید.","Challenge ideas collegially.","ایده‌ها را همکارانه به چالش بکشید."],
[["introduction","c1-u2-academic-l3-intro","Seminar Moves","حرکت‌های سمینار",
"Could you say more about …? What evidence supports …? Building on Sara's point … To synthesise so far …",
"درباره … بیشتر می‌گویید؟ چه شواهدی … را پشتیبانی می‌کند؟ بر اساس نکته سارا … تا اینجا جمع‌بندی کنم …"],
["example","c1-u2-academic-l3-ex","Collegial Challenge","چالش همکارانه",
"Harsh: That's wrong. Collegial: I wonder whether the data fully supports that — the second sample seems small.",
"تند: غلط است. همکارانه: نمی‌دانم داده کاملاً آن را پشتیبانی می‌کند یا نه — نمونه دوم کوچک به نظر می‌رسد."],
["summary","c1-u2-academic-l3-sum","Mock Seminar","سمینار تمرینی",
"Run a 20-minute seminar on one article. Everyone: one question, one challenge, one synthesis. Record it.",
"سمینار ۲۰دقیقه‌ای روی یک مقاله اجرا کنید. هر نفر: یک سؤال، یک چالش و یک جمع‌بندی. ضبط کنید."]]],
["c1-u2-academic","c1-u2-academic-l4","Review: Scholarly Voice","مرور: لحن دانشگاهی",
"Consolidate academic reading, writing, speaking.","خواندن، نوشتن و صحبت آکادمیک را تثبیت کنید.",22,
["Produce a mini literature review.","یک مرور ادبیات کوچک تولید کنید.","Review hedging and cohesion.","احتیاط و انسجام را مرور کنید."],
[["introduction","c1-u2-academic-l4-intro","Mini Review","مرور کوچک",
"Write 300 words reviewing two sources on one question: what is known, what is contested, what remains.",
"درباره یک سؤال با دو منبع ۳۰۰ واژه بنویسید: چه چیزی معلوم است، چه چیزی مورد مناقشه است و چه چیزی مانده است."],
["example","c1-u2-academic-l4-ex","Citation Clinic","درمانگاه استناد",
"Check every citation: accurate? integrated? synthesised, not stacked? Fix two weak integrations.",
"هر استناد را بررسی کنید: دقیق؟ یکپارچه؟ ترکیبی، نه انباشته؟ دو ادغام ضعیف را اصلاح کنید."],
["summary","c1-u2-academic-l4-sum","Checklist","فهرست بررسی",
"Abstract reading? Paraphrase? Synthesis? Seminar moves? Unit 2 complete!",
"خواندن چکیده؟ بازنویسی؟ ترکیب؟ حرکت سمینار؟ واحد دوم کامل شد!"]]],
["c1-u3-professional","c1-u3-professional-l1","Negotiation","مذاکره",
"Negotiate interests, not positions.","بر سر منافع مذاکره کنید، نه مواضع.",28,
["Prepare negotiation positions.","مواضع مذاکره را آماده کنید.","Bargain with conditional language.","با زبان شرطی چانه بزنید."],
[["introduction","c1-u3-professional-l1-intro","Interests First","اول منافع",
"Positions clash; interests overlap. Ask why five times before you bargain. Then trade concessions conditionally.",
"مواضع می‌جنگند؛ منافع هم‌پوشانی دارند. پیش از چانه، پنج بار چرا بپرسید. بعد امتیازها را مشروط مبادله کنید."],
["explanation","c1-u3-professional-l1-ex","Conditional Bargaining","چانه مشروط",
"If you could deliver by Friday, we could sign today. Unless the price drops, we will have to walk away.",
"اگر تا جمعه تحویل دهید، امروز امضا می‌کنیم. مگر اینکه قیمت بیفتد، ناچاریم برویم."],
["summary","c1-u3-professional-l1-sum","Deal Table","میز معامله",
"Negotiate a freelance contract: price, deadline, revisions. Reach a conditional agreement in 15 minutes.",
"یک قرارداد فریلنسری مذاکره کنید: قیمت، ددلاین و اصلاحات. در ۱۵ دقیقه به توافق مشروط برسید."]]],
["c1-u3-professional","c1-u3-professional-l2","Leadership Communication","ارتباطات رهبری",
"Lead with clarity: feedback, vision, difficult news.","با شفافیت رهبری کنید: بازخورد، چشم‌انداز و خبر سخت.",28,
["Give constructive feedback.","بازخورد سازنده بدهید.","Deliver difficult news well.","خبر سخت را خوب برسانید."],
[["introduction","c1-u3-professional-l2-intro","Candour with Care","صراحت با مراقبت",
"Clear is kind. Unclear is unkind. Say the hard thing plainly, then support the person fully.",
"شفافیت مهربانی است. حرف سخت را ساده بگو، بعد کامل از آدم حمایت کن."],
["example","c1-u3-professional-l2-ex","Feedback Frame","قاب بازخورد",
"Situation, behaviour, impact, invitation: In yesterday's review, the slides lacked data, so the client doubted us. How can we fix it?",
"موقعیت، رفتار، اثر و دعوت: در جلسه دیروز اسلایدها داده نداشت، پس مشتری به ما شک کرد. چطور اصلاحش کنیم؟"],
["summary","c1-u3-professional-l2-sum","Hard Conversation","گفت‌وگوی سخت",
"Role-play: missed targets, a resignation, a budget cut. Each: plain news, empathy, next step.",
"بازی: اهداف از دست رفته، استعفا و کاهش بودجه. هر کدام: خبر ساده، همدلی و گام بعد."]]],
["c1-u3-professional","c1-u3-professional-l3","Reports and Proposals","گزارش‌ها و پیشنهادها",
"Write reports and proposals that get approved.","گزارش و پیشنهاد بنویسید که تأیید شود.",28,
["Structure executive reports.","گزارش مدیریتی را ساختاردهی کنید.","Cost and justify proposals.","پیشنهادها را قیمت‌گذاری و توجیه کنید."],
[["introduction","c1-u3-professional-l3-intro","BLUF","اول نتیجه",
"Bottom Line Up Front: put the recommendation first, then the reasoning. Executives read conclusions first.",
"اول نتیجه: پیشنهاد را اول بگو، بعد استدلال. مدیران اول نتیجه را می‌خوانند."],
["explanation","c1-u3-professional-l3-ex","Advanced Reporting","گزارش‌دهی پیشرفته",
"Passive reporting: It is expected that costs will fall. The project is said to be delayed. Distance the claim from yourself.",
"گزارش مجهول: انتظار می‌رود هزینه‌ها بیفتد. گفته می‌شود پروژه عقب است. ادعا را از خودتان دور کنید."],
["summary","c1-u3-professional-l3-sum","One-Page Proposal","پیشنهاد یک‌صفحه‌ای",
"Propose anything in one page: recommendation, rationale, cost, risk, next step. Decision-makers vote yes/no.",
"هر چیزی را در یک صفحه پیشنهاد دهید: توصیه، دلیل، هزینه، ریسک و گام بعد. تصمیم‌گیران بله/نه می‌گویند."]]],
["c1-u3-professional","c1-u3-professional-l4","Review: Executive Presence","مرور: حضور مدیریتی",
"Consolidate negotiation, leadership, and reports.","مذاکره، رهبری و گزارش را تثبیت کنید.",22,
["Perform under executive pressure.","زیر فشار مدیریتی اجرا کنید.","Review advanced modality.","وجهیت پیشرفته را مرور کنید."],
[["introduction","c1-u3-professional-l4-intro","Board Simulation","شبیه‌سازی هیئت‌مدیره",
"Present your proposal to a hostile board. They interrupt, doubt numbers, and demand cuts. Hold your line politely.",
"پیشنهادتان را به هیئت‌مدیره خصمانه ارائه دهید. وسط حرف می‌پرند، به اعداد شک می‌کنند و کاهش می‌خواهند. مؤدبانه بایستید."],
["example","c1-u3-professional-l4-ex","Pressure Phrases","عبارت‌های فشار",
"That's a fair challenge; the data shows … If we cut that, we risk … I can commit to … by Friday.",
"چالش منصفانه‌ای است؛ داده نشان می‌دهد … اگر آن را بزنیم، ریسک می‌کنیم … تا جمعه متعهد می‌شوم …"],
["summary","c1-u3-professional-l4-sum","Checklist","فهرست بررسی",
"Negotiation? Feedback? BLUF reports? Presence? Unit 3 complete!",
"مذاکره؟ بازخورد؟ گزارش BLUF؟ حضور؟ واحد سوم کامل شد!"]]],
["c1-u4-global","c1-u4-global-l1","Environment and Policy","محیط زیست و سیاست‌گذاری",
"Debate policy trade-offs with precision.","درباره بده‌بستان‌های سیاستی با دقت بحث کنید.",28,
["Analyse policy trade-offs.","بده‌بستان‌های سیاستی را تحلیل کنید.","Use complex clause structures.","از ساختارهای بند پیچیده استفاده کنید."],
[["introduction","c1-u4-global-l1-intro","No Free Lunch","ناهار مجانی نیست",
"Every green policy costs someone: carbon taxes hit the poor first; bans kill jobs before alternatives exist.",
"هر سیاست سبزی به کسی هزینه می‌دهد: مالیات کربن اول به فقرا می‌خورد؛ ممنوعیت پیش از جایگزین، شغل می‌کشد."],
["explanation","c1-u4-global-l1-ex","Complex Clauses","بندهای پیچیده",
"Although taxes work, which economists confirm, they hurt unless revenues are returned, as several trials show.",
"هرچند مالیات جواب می‌دهد — که اقتصاددانان تأیید می‌کنند — مگر درآمدش برگردد، آسیب می‌زند، چنان‌که چند آزمایش نشان داد."],
["summary","c1-u4-global-l1-sum","Policy Memo","یادداشت سیاستی",
"Recommend one policy in 250 words: problem, options, trade-offs, recommendation. No slogans allowed.",
"یک سیاست را در ۲۵۰ واژه توصیه کنید: مشکل، گزینه‌ها، بده‌بستان‌ها و توصیه. شعار ممنوع."]]],
["c1-u4-global","c1-u4-global-l2","Media and Truth","رسانه و حقیقت",
"Read media sceptically and write fairly.","رسانه را شکاکانه بخوانید و منصفانه بنویسید.",28,
["Detect framing and bias.","قاب‌بندی و سوگیری را تشخیص دهید.","Attribute claims carefully.","ادعاها را با دقت نسبت دهید."],
[["introduction","c1-u4-global-l2-intro","Same Facts, Two Stories","یک واقعیت، دو روایت",
"Compare two headlines on one event. List: chosen verbs, quoted voices, missing voices. Framing is the story.",
"دو تیتر درباره یک رویداد را مقایسه کنید. فهرست: فعل‌های انتخابی، صداهای نقل‌شده و صداهای غایب."],
["explanation","c1-u4-global-l2-ex","Attribution","نسبت‌دهی",
"Allege, claim, argue, point out, admit. Officials claim success; residents allege neglect. Verbs judge silently.",
"ادعا، استدلال و اشاره. مقام‌ها از موفقیت می‌گویند؛ ساکنان از غفلت شکایت دارند. فعل‌ها پنهانی داوری می‌کنند."],
["summary","c1-u4-global-l2-sum","Fair Report","گزارش منصفانه",
"Rewrite a biased paragraph fairly: two sides, verbatim quote each, no loaded verbs. Compare versions.",
"یک پاراگراف مغرضانه را منصفانه بازنویسی کنید: دو طرف، نقل مستقیم از هر کدام و بدون فعل بارگذاری‌شده."]]],
["c1-u4-global","c1-u4-global-l3","Ethics and Technology","اخلاق و فناوری",
"Argue tech ethics beyond slogans.","درباره اخلاق فناوری فراتر از شعار استدلال کنید.",28,
["Apply ethical frameworks.","چارچوب‌های اخلاقی را به کار ببرید.","Qualify bold claims.","ادعاهای جسورانه را مشروط کنید."],
[["introduction","c1-u4-global-l3-intro","Trolley Problems at Scale","معمای تراموا در مقیاس بزرگ",
"Who does your algorithm sacrifice? Apply three lenses: outcomes, duties, character. Notice how the answer shifts.",
"الگوریتم شما چه کسی را قربانی می‌کند؟ سه لنز: پیامدها، وظایف و شخصیت. ببینید جواب چطور عوض می‌شود."],
["explanation","c1-u4-global-l3-ex","Advanced Modality","وجهیت پیشرفته",
"Bound to, liable to, apt to, sure to. Systems handling faces are bound to err; errors are liable to harm minorities first.",
"bound to و liable to و apt to. سامانه‌های تشخیص چهره حتماً خطا می‌کنند و خطا اول به اقلیت‌ها آسیب می‌زند."],
["summary","c1-u4-global-l3-sum","Ethics Charter","منشور اخلاقی",
"Draft a five-rule charter for AI at your school or firm. Each rule: duty, reason, enforcement.",
"یک منشور پنج‌قاعده‌ای برای هوش مصنوعی در مدرسه یا شرکت بنویسید. هر قاعده: وظیفه، دلیل و ضمانت اجرا."]]],
["c1-u4-global","c1-u4-global-l4","Review: Global Citizen","مرور: شهروند جهانی",
"Consolidate global-issue discourse.","گفتمان مسائل جهانی را تثبیت کنید.",22,
["Argue global issues rigorously.","درباره مسائل جهانی دقیق استدلال کنید.","Review C1 grammar systems.","دستگاه‌های گرامری C1 را مرور کنید."],
[["introduction","c1-u4-global-l4-intro","Citizens' Assembly","مجمع شهروندان",
"Deliberate one question: Should our city ban short flights? Evidence rounds, then a vote with reasons.",
"درباره یک سؤال مشورت کنید: آیا شهر ما باید پروازهای کوتاه را ممنوع کند؟ دورهای شواهد، بعد رأی با دلیل."],
["example","c1-u4-global-l4-ex","Deliberation Rules","قواعد مشورت",
"Evidence before opinion. Steelperson before rebuttal. Reasons recorded for every vote. Minority report honoured.",
"اول شواهد، بعد نظر. اول تقویت مخالف، بعد رد. دلیل هر رأی ثبت شود. گزارش اقلیت محترم است."],
["summary","c1-u4-global-l4-sum","C1 Complete!","C1 کامل شد!",
"You finished C1: discourse, academia, profession, globe. You argue anything, anywhere!",
"C1 را تمام کردی: گفتمان، دانشگاه، حرفه و جهان. درباره هر چیزی، هر جا استدلال می‌کنی!"]]],
];

/* ------------------------- C2 lessons (16) ------------------------------ */

const LESSON_ROWS_C2 = [
["c2-u1-precision","c2-u1-precision-l1","Shades of Meaning","سایه‌های معنا",
"Distinguish near-synonyms with precision.","مترادف‌های نزدیک را با دقت تمایز دهید.",30,
["Separate near-synonyms.","مترادف‌های نزدیک را جدا کنید.","Choose words for exact effect.","واژه را برای اثر دقیق انتخاب کنید."],
[["introduction","c2-u1-precision-l1-intro","Almost the Same","تقریباً یکی",
"Slender, skinny, lean, svelte — all thin, none identical. Precision lives in connotation, register, and collocation.",
"لاغر به چهار شکل — همه لاغر، هیچ‌کدام یکسان. دقت در بار معنایی، سبک و هم‌آیی است."],
["explanation","c2-u1-precision-l1-ex","Connotation Maps","نقشه بار معنایی",
"Cheap (bad) vs economical (good); stubborn (bad) vs resolute (good). Map five word families by feeling.",
"ارزانِ بد در برابر مقرون‌به‌صرفه خوب؛ لجوجِ بد در برابر مصمم خوب. پنج خانواده واژه را بر اساس حس نقشه کنید."],
["summary","c2-u1-precision-l1-sum","Word Surgeon","جراح واژه",
"Take a bland paragraph. Replace ten words with precise near-synonyms. Justify each cut.",
"یک پاراگراف بی‌مزه را بردارید. ده واژه را با مترادف دقیق جایگزین کنید. هر برش را توجیه کنید."]]],
["c2-u1-precision","c2-u1-precision-l2","Hedging and Emphasis","احتیاط و تأکید در بیان",
"Calibrate certainty: hedge, boost, and qualify.","قطعیت را تنظیم کنید: احتیاط، تقویت و مشروط‌سازی.",30,
["Hedge claims gracefully.","ادعاها را با وقار محتاط کنید.","Boost key points powerfully.","نکته‌های کلیدی را قدرتمند تقویت کنید."],
[["introduction","c2-u1-precision-l2-intro","How Sure Are You?","چقدر مطمئنی؟",
"It seems → It appears → Evidence suggests → It is clear → Undeniably. Each step raises the stakes; earn each one.",
"به نظر می‌رسد تا بی‌تردید. هر پله ریسک را بالا می‌برد؛ هر کدام را به دست بیاورید."],
["explanation","c2-u1-precision-l2-ex","Boosters","تقویت‌کننده‌ها",
"Crucially, fundamentally, above all, it is precisely … Boost sparingly: one booster per argument keeps its power.",
"حیاتی، بنیادین، مهم‌تر از همه. تقویت را کم به کار ببرید: یک تقویت در هر استدلال قدرتش را نگه می‌دارد."],
["summary","c2-u1-precision-l2-sum","Certainty Dial","پیچ قطعیت",
"Take five claims. Write each at three certainty levels. Discuss which level each deserves — and why.",
"پنج ادعا را بردارید. هر کدام را در سه سطح قطعیت بنویسید. بحث کنید هر کدام کدام سطح را سزاست — و چرا."]]],
["c2-u1-precision","c2-u1-precision-l3","Implied Meaning","معنای ضمنی",
"Read between lines: implicature and tone.","بین خطوط بخوانید: معنای ضمنی و لحن.",30,
["Detect implicature.","معنای ضمنی را تشخیص دهید.","Interpret tone reliably.","لحن را قابل‌اعتماد تفسیر کنید."],
[["introduction","c2-u1-precision-l3-intro","What Wasn't Said","آنچه گفته نشد",
"Interesting idea — said flatly, after silence, means no. Context, prosody, and relationship decode the unsaid.",
"ایده جالبی است — که خشک و پس از سکوت گفته شود یعنی نه. بافت، آهنگ و رابطه، ناگفته را رمزگشایی می‌کند."],
["explanation","c2-u1-precision-l3-ex","Vague Precision","دقتِ مبهم",
"Sort of, kind of, -ish, or so. Vagueness is precision about uncertainty: I'll be thirtyish minutes late.",
"تقریباً و حدوداً. ابهام، دقتی درباره عدم‌قطعیت است: حدود سی دقیقه دیر می‌رسم."],
["summary","c2-u1-precision-l3-sum","Subtext Lab","آزمایشگاه زیرمتن",
"Read three dialogues. For each line write: literal meaning, likely intent, evidence. Compare readings.",
"سه گفت‌وگو بخوانید. برای هر خط بنویسید: معنای ظاهری، قصد احتمالی و شواهد. خوانش‌ها را مقایسه کنید."]]],
["c2-u1-precision","c2-u1-precision-l4","Review: Precise Expression","مرور: بیان دقیق",
"Consolidate precision: lexis, certainty, subtext.","دقت را تثبیت کنید: واژگان، قطعیت و زیرمتن.",22,
["Edit for exactness.","برای دقت ویرایش کنید.","Review hedging and connotation.","احتیاط و بار معنایی را مرور کنید."],
[["introduction","c2-u1-precision-l4-intro","Exactness Audit","ممیزی دقت",
"Trade a recent text. Mark: vague words, unearned boosters, missed hedges, tone slips. Rewrite the worst paragraph.",
"یک متن اخیر را عوض کنید. علامت بزنید: واژه‌های مبهم، تقویت‌های نابه‌جا، احتیاط‌های ازدست‌رفته و لغزش لحن."],
["example","c2-u1-precision-l4-ex","Before and After","قبل و بعد",
"Display original vs edited paragraphs. The class votes: which edit most improved precision — and names the device.",
"پاراگراف اصل و ویراسته را نمایش دهید. کلاس رأی می‌دهد: کدام ویرایش دقت را بیشتر برد — و ابزار را نام می‌برد."],
["summary","c2-u1-precision-l4-sum","Checklist","فهرست بررسی",
"Near-synonyms? Hedges/boosters? Implicature? Unit 1 complete!",
"مترادف‌های نزدیک؟ احتیاط/تقویت؟ معنای ضمنی؟ واحد اول کامل شد!"]]],
["c2-u2-rhetoric","c2-u2-rhetoric-l1","Rhetorical Devices","ابزارهای بلاغی",
"Deploy parallelism, antithesis, and tricolon.","توازی، تضاد و سه‌گانه را به کار ببرید.",30,
["Identify rhetorical devices.","ابزارهای بلاغی را تشخیص دهید.","Use devices without purple prose.","ابزار را بدون نثر متکلف به کار ببرید."],
[["introduction","c2-u2-rhetoric-l1-intro","Music of Persuasion","موسیقی اقناع",
"We teach, we heal, we build. Not because it is easy, but because it matters. Rhythm makes ideas memorable.",
"می‌آموزیم، درمان می‌کنیم، می‌سازیم. نه چون آسان است، بلکه چون مهم است. ریتم ایده‌ها را ماندگار می‌کند."],
["explanation","c2-u2-rhetoric-l1-ex","The Big Three","سه بزرگ",
"Parallelism (same shape), antithesis (opposites), tricolon (threes). One device per paragraph; never decorate weak logic.",
"توازی، تضاد و سه‌گانه. هر پاراگراف یک ابزار؛ هرگز منطق ضعیف را تزیین نکنید."],
["summary","c2-u2-rhetoric-l1-sum","Device Hunt","شکار ابزار",
"Find each device in real speeches. Then write three original lines, one per device, on one cause.",
"هر ابزار را در سخنرانی‌های واقعی پیدا کنید. بعد سه خط اصیل، هر کدام با یک ابزار، درباره یک آرمان بنویسید."]]],
["c2-u2-rhetoric","c2-u2-rhetoric-l2","Speechwriting","سخنرانی‌نویسی",
"Write speeches for the ear, not the eye.","برای گوش سخنرانی بنویسید، نه چشم.",30,
["Write for spoken delivery.","برای اجرای شفاهی بنویسید.","Pace with breath and pause.","با نفس و مکث ریتم بدهید."],
[["introduction","c2-u2-rhetoric-l2-intro","Ear First","اول گوش",
"Short sentences. Spoken words. Pauses marked. A speech is a score: write the pauses, stress the verbs, land the end.",
"جمله‌های کوتاه. واژه‌های گفتاری. مکث‌های مشخص. سخنرانی مثل پارتیتور موسیقی است: مکث‌ها را بنویسید و پایان را بنشانید."],
["explanation","c2-u2-rhetoric-l2-ex","Stylistic Inversion","وارونگی سبکی",
"Never have we faced such a choice. Only then did they listen. Inversion conducts attention like a baton.",
"هرگز با چنین انتخابی روبه‌رو نبوده‌ایم. فقط آنگاه گوش دادند. وارونگی توجه را مثل چوب رهبری هدایت می‌کند."],
["summary","c2-u2-rhetoric-l2-sum","Three Minutes","سه دقیقه",
"Write and deliver a three-minute speech: story opening, three pillars, memorable close. Film it.",
"یک سخنرانی سه‌دقیقه‌ای بنویسید و اجرا کنید: شروع داستانی، سه ستون و پایان ماندگار. فیلم بگیرید."]]],
["c2-u2-rhetoric","c2-u2-rhetoric-l3","Debate at Depth","مناظره عمیق",
"Debate with models, mechanisms, and weighing.","با مدل، سازوکار و سنجش مناظره کنید.",30,
["Build debate models.","مدل مناظره بسازید.","Weigh clashes explicitly.","برخوردها را صریح بسنجید."],
[["introduction","c2-u2-rhetoric-l3-intro","Beyond Opinions","فراتر از نظرها",
"Model (what exactly), mechanism (how it works), weighing (why it matters most). Depth beats heat.",
"مدل (دقیقاً چه)، سازوکار (چطور کار می‌کند) و سنجش (چرا مهم‌تر است). عمق بر حرارت می‌چربد."],
["explanation","c2-u2-rhetoric-l3-ex","Weighing Language","زبان سنجش",
"Even if …, our case still wins on scale. The strongest reason to prefer us is irreversibility.",
"حتی اگر …، باز ما در مقیاس می‌بریم. قوی‌ترین دلیل ترجیح ما برگشت‌ناپذیری است."],
["summary","c2-u2-rhetoric-l3-sum","Championship Round","دور نهایی",
"Full debate, judged on depth: models, mechanisms, weighing. Losers write the winners' victory speech.",
"مناظره کامل با داوری عمق: مدل، سازوکار و سنجش. بازنده‌ها سخنرانی پیروزی برنده‌ها را می‌نویسند."]]],
["c2-u2-rhetoric","c2-u2-rhetoric-l4","Review: Persuasive Voice","مرور: صدای اقناعی",
"Consolidate rhetoric across speech and debate.","بلاغت را در سخنرانی و مناظره تثبیت کنید.",22,
["Fuse devices with argument.","ابزار را با استدلال ترکیب کنید.","Review inversion and rhythm.","وارونگی و ریتم را مرور کنید."],
[["introduction","c2-u2-rhetoric-l4-intro","Voice Gala","جشن صدا",
"Perform best speeches for another class. Collect one-line reviews: which line will they remember in a year?",
"بهترین سخنرانی‌ها را برای کلاس دیگر اجرا کنید. نقدهای یک‌خطی جمع کنید: کدام خط را یک سال بعد به یاد می‌آورند؟"],
["example","c2-u2-rhetoric-l4-ex","Rhetoric, Ethically","بلاغت اخلاقی",
"Powerful tools, honest use: never manipulate with devices what evidence cannot support. Sign the speaker's oath.",
"ابزار قدرتمند، کاربرد صادانه: هرگز با ابزار چیزی را که شواهد پشتیبانی نمی‌کند القا نکنید. سوگند سخنران را امضا کنید."],
["summary","c2-u2-rhetoric-l4-sum","Checklist","فهرست بررسی",
"Devices? Speechwriting? Deep debate? Ethics? Unit 2 complete!",
"ابزارها؟ سخنرانی‌نویسی؟ مناظره عمیق؟ اخلاق؟ واحد دوم کامل شد!"]]],
["c2-u3-scholarly","c2-u3-scholarly-l1","Critical Reading","خواندن انتقادی",
"Interrogate texts: assumptions, gaps, stakes.","متن‌ها را بازجویی کنید: پیش‌فرض‌ها، شکاف‌ها و سهام. ",30,
["Surface hidden assumptions.","پیش‌فرض‌های پنهان را آشکار کنید.","Evaluate scholarly stakes.","سهام دانشگاهی را ارزیابی کنید."],
[["introduction","c2-u3-scholarly-l1-intro","Reading Against","خواندن در برابر",
"Read with the text, then against it: what must be true for this to hold? Who benefits if we believe it?",
"اول با متن بخوانید، بعد در برابرش: چه چیزی باید درست باشد تا این درست بماند؟ اگر باور کنیم چه کسی سود می‌برد؟"],
["explanation","c2-u3-scholarly-l1-ex","Ambiguity Control","کنترل ابهام",
"Precise writers disambiguate: by X I mean …; in the narrow sense …. Name the sense you intend, every time.",
"نویسنده دقیق ابهام را رفع می‌کند: منظورم از X … است؛ به معنای مضیق … هر بار معنای موردنظرت را نام ببر."],
["summary","c2-u3-scholarly-l1-sum","Critical Memo","یادداشت انتقادی",
"Write 250 words on an article: strongest claim, weakest link, hidden assumption, verdict. No fence-sitting.",
"درباره یک مقاله ۲۵۰ واژه بنویسید: قوی‌ترین ادعا، ضعیف‌ترین حلقه، پیش‌فرض پنهان و رأی. بی‌طرفی ممنوع."]]],
["c2-u3-scholarly","c2-u3-scholarly-l2","Research Argumentation","استدلال پژوهشی",
"Argue from evidence with scholarly caution.","از روی شواهد با احتیاط دانشگاهی استدلال کنید.",30,
["Argue cautiously from data.","از روی داده محتاطانه استدلال کنید.","Concede limits honestly.","محدودیت‌ها را صادانه بپذیرید."],
[["introduction","c2-u3-scholarly-l2-intro","Evidence Speaks Softly","شواهد آرام حرف می‌زنند",
"The data are consistent with — not proof of. Correlation invites; only design concludes. Respect the gap.",
"داده با … سازگار است — نه اثبات آن. همبستگی دعوت می‌کند؛ فقط طرح پژوهش نتیجه می‌گیرد. به شکاف احترام بگذار."],
["explanation","c2-u3-scholarly-l2-ex","Coherence Architecture","معماری انسجام",
"Old-to-new flow, thematic chains, metadiscourse signposts. Each sentence hands the baton to the next.",
"جریان کهنه‌به‌نو، زنجیره‌های موضوعی و علامت‌های فراگفتمان. هر جمله چوب امداد را به بعدی می‌دهد."],
["summary","c2-u3-scholarly-l2-sum","Argument Clinic","درمانگاه استدلال",
"Bring a draft. Partners attack: Is the claim earned? Are limits stated? Does each paragraph advance one idea?",
"پیش‌نویسی بیاورید. همتایان حمله می‌کنند: ادعا به دست آمده؟ محدودیت‌ها گفته شده؟ هر پاراگراف یک ایده را پیش می‌برد؟"]]],
["c2-u3-scholarly","c2-u3-scholarly-l3","Publication and Presentation","انتشار و ارائه",
"Prepare work for journals and conferences.","کار را برای نشریه و کنفرانس آماده کنید.",30,
["Write abstracts that survive review.","چکیده‌ای بنویسید که از داوری بگذرد.","Present research in 10 minutes.","پژوهش را در ۱۰ دقیقه ارائه دهید."],
[["introduction","c2-u3-scholarly-l3-intro","Reviewer Two","داور دوم",
"Write for the sceptic: anticipate the harshest reader, answer them in the text, thank them in advance.",
"برای شکاک بنویسید: سخت‌گیرترین خواننده را پیش‌بینی کنید، در متن جوابش دهید و پیشاپیش تشکر کنید."],
["explanation","c2-u3-scholarly-l3-ex","Idiomatic Syntax","نحو اصطلاحی",
"Far from proving X, the results complicate it. Little did we expect … Master the idioms of academic moves.",
"نتایج نه‌تنها X را اثبات نمی‌کند، بلکه پیچیده‌اش می‌کند. اصطلاح‌های حرکت آکادمیک را مسلط شوید."],
["summary","c2-u3-scholarly-l3-sum","Conference Dry Run","تمرین کنفرانس",
"Present in 10 minutes, questions 5. Rule: every answer begins by steelmanning the question.",
"۱۰ دقیقه ارائه و ۵ دقیقه سؤال. قاعده: هر جواب با تقویت سؤال شروع شود."]]],
["c2-u3-scholarly","c2-u3-scholarly-l4","Review: Academic Authority","مرور: اعتبار آکادمیک",
"Consolidate scholarly critique and craft.","نقد و صنعت دانشگاهی را تثبیت کنید.",22,
["Critique like a reviewer.","مثل داور نقد کنید.","Review coherence and idiom.","انسجام و اصطلاح را مرور کنید."],
[["introduction","c2-u3-scholarly-l4-intro","Peer Review Live","داوری زنده",
"Exchange full drafts. Write real referee reports: summary, strengths, required revisions, verdict.",
"پیش‌نویس‌های کامل را عوض کنید. گزارش داوری واقعی بنویسید: خلاصه، قوت‌ها، اصلاحات لازم و رأی."],
["example","c2-u3-scholarly-l4-ex","Revise and Resubmit","اصلاح و ارسال مجدد",
"Respond to your report point by point: what you changed, where, and why — or why not, with reasons.",
"به گزارشتان بندبه‌بند جواب دهید: چه چیزی را کجا و چرا عوض کردید — یا چرا نه، با دلیل."],
["summary","c2-u3-scholarly-l4-sum","Checklist","فهرست بررسی",
"Critical reading? Cautious claims? Review craft? Unit 3 complete!",
"خواندن انتقادی؟ ادعای محتاط؟ صنعت داوری؟ واحد سوم کامل شد!"]]],
["c2-u4-mastery","c2-u4-mastery-l1","Idiom and Collocation","اصطلاح و هم‌آیی",
"Use idioms natively — and know when not to.","اصطلاح را بومی‌وار به کار ببرید — و بدانید کی نه.",30,
["Use idioms appropriately.","اصطلاح را به‌جا به کار ببرید.","Master academic collocations.","هم‌آیی‌های آکادمیک را مسلط شوید."],
[["introduction","c2-u4-mastery-l1-intro","Idiom with Judgment","اصطلاح با تشخیص",
"Break the ice fits a mixer, not a memo. Idioms signal belonging; misused, they signal the opposite.",
"break the ice برای مهمانی است نه یادداشت اداری. اصطلاح تعلق را نشان می‌دهد؛ اگر اشتباه، عکسش را."],
["explanation","c2-u4-mastery-l1-ex","Collocation Grids","شبکه هم‌آیی",
"Raise awareness, draw conclusions, pose questions, bear resemblance. Verbs choose nouns; learn them married.",
"raise awareness و draw conclusions و pose questions. فعل‌ها اسم‌ها را انتخاب می‌کنند؛ آن‌ها را متأهل یاد بگیرید."],
["summary","c2-u4-mastery-l1-sum","Register Roulette","رولت سبک",
"Same idea, four registers: text to a friend, email to a boss, essay, speech. Idioms only where they belong.",
"یک ایده، چهار سبک: پیام به دوست، ایمیل به رئیس، مقاله و سخنرانی. اصطلاح فقط سر جایش."]]],
["c2-u4-mastery","c2-u4-mastery-l2","Style and Register","سبک و سطح زبان",
"Shift register mid-text with control.","سبک را وسط متن با کنترل عوض کنید.",30,
["Code-shift deliberately.","آگاهانه سبک را عوض کنید.","Sustain voice across genres.","صدا را در ژانرها حفظ کنید."],
[["introduction","c2-u4-mastery-l2-intro","Controlled Shifts","تغییرهای کنترل‌شده",
"Masters shift: formal analysis, then a plain punchline. The shift is the style — if you signal and earn it.",
"استادان عوض می‌کنند: تحلیل رسمی، بعد یک جمله ساده کوبنده. تغییر همان سبک است — اگر علامت بزنید و به دستش آورید."],
["explanation","c2-u4-mastery-l2-ex","Register Shifting","جابه‌جایی سبک",
"Frame shifts explicitly: technically …, in plain terms …, to put it bluntly …. Never drift; always steer.",
"تغییر را صریح قاب کنید: از نظر فنی …، به زبان ساده …، رک بگویم … هرگز سر نخورید؛ همیشه فرمان بدهید."],
["summary","c2-u4-mastery-l2-sum","Two Audiences","دو مخاطب",
"Explain one complex idea twice: to a child, to an expert. Then fuse both into one piece that serves each.",
"یک ایده پیچیده را دوبار توضیح دهید: به کودک و به متخصص. بعد هر دو را در متنی که به هر دو خدمت کند ترکیب کنید."]]],
["c2-u4-mastery","c2-u4-mastery-l3","Voice in Writing","لحن شخصی در نگارش",
"Find and refine your written voice.","صدای نوشتاری خود را پیدا و پالایش کنید.",30,
["Distinguish voice from error.","صدا را از خطا تشخیص دهید.","Revise toward a voice.","به‌سوی یک صدا ویرایش کنید."],
[["introduction","c2-u4-mastery-l3-intro","Yours Alone","فقط مال شما",
"Voice is choice repeated: your verbs, your rhythms, your risks. Study three writers; steal like an artist, not a thief.",
"صدا انتخابِ تکرارشده است: فعل‌های شما، ریتم شما و ریسک شما. سه نویسنده را مطالعه کنید؛ هنرمندانه الهام بگیرید."],
["explanation","c2-u4-mastery-l3-ex","Stylistic Choice","انتخاب سبکی",
"Every sentence could be otherwise: long or short, plain or rich, calm or urgent. Choose — and know you chose.",
"هر جمله می‌توانست جور دیگری باشد: بلند یا کوتاه، ساده یا غنی، آرام یا فوری. انتخاب کنید — و بدانید انتخاب کردید."],
["summary","c2-u4-mastery-l3-sum","Voice Portfolio","نمونه‌کار صدا",
"Revise three old pieces into one voice. Write a 100-word artist statement: what your sentences believe.",
"سه متن قدیمی را به یک صدا ویرایش کنید. یک بیانیه هنری ۱۰۰واژه‌ای بنویسید: جمله‌های شما به چه باور دارند."]]],
["c2-u4-mastery","c2-u4-mastery-l4","Review: Near-native Fluency","مرور: روانی نزدیک به بومی",
"Celebrate C2: perform mastery publicly.","C2 را جشن بگیرید: تسلط را علنی اجرا کنید.",22,
["Perform C2 mastery live.","تسلط C2 را زنده اجرا کنید.","Plan beyond SAYVA.","فراتر از سیوا برنامه بریزید."],
[["introduction","c2-u4-mastery-l4-intro","Mastery Showcase","نمایش تسلط",
"Each learner presents: a speech, a critique, a story. The cohort witnesses. Mastery loves an audience.",
"هر زبان‌آموز ارائه می‌دهد: سخنرانی، نقد و داستان. گروه شاهد است. تسلط عاشق مخاطب است."],
["example","c2-u4-mastery-l4-ex","Beyond SAYVA","فراتر از سیوا",
"Read widely, write daily, speak bravely. The course ends; the language never does. Keep your portfolio alive.",
"گسترده بخوانید، روزانه بنویسید و شجاعانه صحبت کنید. دوره تمام می‌شود؛ زبان هرگز. نمونه‌کارتان را زنده نگه دارید."],
["summary","c2-u4-mastery-l4-sum","C2 Complete!","C2 کامل شد!",
"You finished C2: precision, rhetoric, scholarship, voice. You are a master user of English!",
"C2 را تمام کردی: دقت، بلاغت، پژوهش و صدا. کاربر مسلط انگلیسی هستی!"]]],
];

/* ========================== VOCABULARY (180) ============================ */
/* Row: [level, word, pos, topic, defEn, defFa, transFa,
 *       ex1en, ex1fa, ex2en|null, ex2fa|null, ipa|null]
 * NOTE: `topic` is seed-side reporting metadata only; the persisted
 * vocabulary_items documents contain exactly the schema fields. */

function kebab(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildVocabulary(rows, lessonKeysByLevel) {
  return rows.map(([level, word, pos, topic, defEn, defFa, transFa, ex1en, ex1fa, ex2en, ex2fa, ipa], i) => {
    const lvl = String(level).toUpperCase();
    const slug = `${lvl.toLowerCase()}-vocab-${kebab(word)}`;
    const lessonKeys = lessonKeysByLevel.get(lvl) || [];
    const examples = [{ sentence: ex1en, translation: ex1fa }];
    if (ex2en) examples.push({ sentence: ex2en, translation: ex2fa || undefined });
    const doc = {
      _key: slug,
      _level: lvl,
      _topic: topic,
      _lessonKey: lessonKeys.length ? lessonKeys[i % lessonKeys.length] : null,
      slug,
      word,
      normalizedWord: word.toLowerCase(),
      partOfSpeech: pos,
      definition: L(defFa, defEn),
      translation: L(transFa, word),
      examples,
      level: lvl,
      order: i,
      status: "published",
    };
    if (ipa) doc.pronunciation = { ipa };
    return doc;
  });
}

const VOCAB_ROWS = [
["A1","family","noun","Family","the people you are related to, like your parents and children","افرادی که با آن‌ها نسبت خانوادگی داری، مثل پدر و مادر و فرزندان","خانواده","My family lives in Tehran.","خانواده من در تهران زندگی می‌کند.","She has a big family.","او خانواده بزرگی دارد.","/ˈfæməli/"],
["A1","mother","noun","Family","a woman who has a child","زنی که فرزند دارد","مادر","My mother is a teacher.","مادرم معلم است.","Her mother cooks very well.","مادرش خیلی خوب آشپزی می‌کند.","/ˈmʌðər/"],
["A1","father","noun","Family","a man who has a child","مردی که فرزند دارد","پدر","His father works in a bank.","پدرش در بانک کار می‌کند.","My father drives a bus.","پدرم اتوبوس می‌راند.","/ˈfɑːðər/"],
["A1","friend","noun","Family","a person you know and like","کسی که می‌شناسی و دوستش داری","دوست","Sara is my best friend.","سارا بهترین دوست من است.","We play with our friends.","با دوستانمان بازی می‌کنیم.","/frend/"],
["A1","home","noun","Home","the place where you live","جایی که در آن زندگی می‌کنی","خانه","I go home at five.","ساعت پنج به خانه می‌روم.","Welcome home!","به خانه خوش آمدی!",null,null],
["A1","house","noun","Home","a building where people live","ساختمانی که مردم در آن زندگی می‌کنند","خانه","Their house is big.","خانه آن‌ها بزرگ است.","We live in a small house.","ما در خانه کوچکی زندگی می‌کنیم.","/haʊs/"],
["A1","room","noun","Home","one part inside a house, like a bedroom","یک بخش داخل خانه، مثل اتاق خواب","اتاق","My room is clean.","اتاقم تمیز است.","There are four rooms in our house.","خانه ما چهار اتاق دارد.","/ruːm/"],
["A1","kitchen","noun","Home","the room where you cook food","اتاقی که در آن غذا می‌پزی","آشپزخانه","Mother is in the kitchen.","مامان در آشپزخانه است.","Our kitchen is small but clean.","آشپزخانه ما کوچک ولی تمیز است.","/ˈkɪtʃɪn/"],
["A1","food","noun","Food","things that people eat","چیزهایی که مردم می‌خورند","غذا","The food is very good.","غذا خیلی خوب است.","We buy food every week.","هر هفته غذا می‌خریم.","/fuːd/"],
["A1","water","noun","Food","the clear liquid we drink","مایع بی‌رنگی که می‌نوشیم","آب","I drink water every day.","هر روز آب می‌نوشم.","There is no water in the glass.","در لیوان آب نیست.","/ˈwɔːtər/"],
["A1","bread","noun","Food","soft food made from flour, baked in an oven","غذای نرمی که از آرد درست می‌شود و در فر می‌پزد","نان","I eat bread for breakfast.","صبحانه نان می‌خورم.","The bread is fresh.","نان تازه است.","/bred/"],
["A1","apple","noun","Food","a round red or green fruit","میوه گرد قرمز یا سبز","سیب","She eats an apple every day.","او هر روز یک سیب می‌خورد.","These apples are sweet.","این سیب‌ها شیرین‌اند.","/ˈæpl/"],
["A1","milk","noun","Food","the white liquid from cows that we drink","مایع سفیدی از گاو که می‌نوشیم","شیر","Children drink milk.","بچه‌ها شیر می‌نوشند.","There is milk in the fridge.","در یخچال شیر هست.","/mɪlk/"],
["A1","morning","noun","Time","the early part of the day, before noon","بخش اول روز، پیش از ظهر","صبح","Good morning!","صبح بخیر!","I run every morning.","هر صبح می‌دوم.","/ˈmɔːrnɪŋ/"],
["A1","night","noun","Time","the dark part of the day when we sleep","بخش تاریک روز که می‌خوابیم","شب","Good night!","شب بخیر!","The stars are in the sky at night.","شب ستاره‌ها در آسمان‌اند.","/naɪt/"],
["A1","day","noun","Time","24 hours; also the light part of the day","۲۴ ساعت؛ همچنین بخش روشن روز","روز","Today is a good day.","امروز روز خوبی است.","There are seven days in a week.","هفته هفت روز دارد.","/deɪ/"],
["A1","time","noun","Time","what we measure in hours and minutes","چیزی که با ساعت و دقیقه اندازه می‌گیریم","وقت؛ ساعت","What time is it?","ساعت چند است؟","I have no time today.","امروز وقت ندارم.","/taɪm/"],
["A1","school","noun","School","a place where children learn","جایی که بچه‌ها در آن یاد می‌گیرند","مدرسه","The school is near our house.","مدرسه نزدیک خانه ماست.","She goes to school by bus.","او با اتوبوس به مدرسه می‌رود.","/skuːl/"],
["A1","teacher","noun","School","a person who teaches students","کسی که به دانش‌آموزان درس می‌دهد","معلم","Our teacher is kind.","معلم ما مهربان است.","He is an English teacher.","او معلم انگلیسی است.","/ˈtiːtʃər/"],
["A1","student","noun","School","a person who learns at a school","کسی که در مدرسه یاد می‌گیرد","دانش‌آموز","I am a student.","من دانش‌آموزم.","There are twenty students in the class.","در کلاس بیست دانش‌آموز هست.","/ˈstuːdənt/"],
["A1","book","noun","School","pages with words that you read","صفحه‌هایی با واژه که می‌خوانی","کتاب","This book is easy.","این کتاب آسان است.","I read a book every month.","هر ماه یک کتاب می‌خوانم.","/bʊk/"],
["A1","car","noun","Town","a small vehicle with four wheels","وسیله نقلیه کوچک چهارچرخ","ماشین","My father has a car.","پدرم ماشین دارد.","The car is red.","ماشین قرمز است.","/kɑːr/"],
["A1","bus","noun","Town","a big vehicle that carries many people","وسیله بزرگ که آدم‌های زیادی را می‌برد","اتوبوس","The bus is late.","اتوبوس دیر کرده است.","We go to school by bus.","با اتوبوس به مدرسه می‌رویم.","/bʌs/"],
["A1","shop","noun","Town","a small place where you buy things","جای کوچکی که در آن چیز می‌خری","مغازه","The shop is open.","مغازه باز است.","I work in a small shop.","در مغازه کوچکی کار می‌کنم.","/ʃɑp/"],
["A1","money","noun","Town","coins and paper we use to buy things","سکه و اسکناس که با آن چیز می‌خریم","پول","I have no money.","پول ندارم.","How much money do you need?","چقدر پول لازم داری؟","/ˈmʌni/"],
["A1","happy","adjective","Describing","feeling good and smiling","احساس خوب داشتن و لبخند زدن","خوشحال","I am happy today.","امروز خوشحالم.","The children look happy.","بچه‌ها خوشحال به نظر می‌رسند.","/ˈhæpi/"],
["A1","big","adjective","Describing","large in size","بزرگ در اندازه","بزرگ","They live in a big city.","در شهر بزرگی زندگی می‌کنند.","This bag is too big.","این کیف خیلی بزرگ است.","/bɪɡ/"],
["A1","small","adjective","Describing","little in size","کوچک در اندازه","کوچک","We have a small garden.","باغچه کوچکی داریم.","The room is very small.","اتاق خیلی کوچک است.","/smɔːl/"],
["A1","new","adjective","Describing","not old; made or bought short time ago","قدیمی نبودن؛ تازه ساخته یا خریده‌شده","جدید؛ نو","I have a new phone.","گوشی جدیدی دارم.","She is new in our class.","او در کلاس ما جدید است.","/nuː/"],
["A1","good","adjective","Describing","nice; of high quality","خوب؛ با کیفیت","خوب","This is a good book.","این کتاب خوبی است.","The food tastes good.","غذا مزه خوبی دارد.","/ɡʊd/"],
["A2","trip","noun","Travel","a short journey to a place and back","سفر کوتاه به جایی و برگشت","سفر","We went on a trip to the sea.","به سفر دریا رفتیم.","Did you enjoy the school trip?","از اردوی مدرسه لذت بردی؟","/trɪp/"],
["A2","holiday","noun","Travel","days when you rest and do not work","روزهایی که استراحت می‌کنی و کار نمی‌کنی","تعطیلات","We travel on holidays.","در تعطیلات سفر می‌کنیم.","Happy holidays!","تعطیلات خوش!",null,null],
["A2","ticket","noun","Travel","a paper that lets you travel or enter a place","کاغذی که با آن سفر می‌کنی یا وارد جایی می‌شوی","بلیت","Two tickets to Shiraz, please.","دو بلیت شیراز لطفاً.","The tickets are expensive.","بلیت‌ها گران‌اند.","/ˈtɪkɪt/"],
["A2","hotel","noun","Travel","a building where travellers sleep and eat","ساختمانی که مسافران در آن می‌خوابند و غذا می‌خورند","هتل","The hotel is near the sea.","هتل نزدیک دریاست.","We booked a cheap hotel.","هتل ارزانی رزرو کردیم.","/həʊˈtel/"],
["A2","weekend","noun","Travel","Saturday and Sunday, or days you rest each week","شنبه و یکشنبه یا روزهای استراحت هر هفته","آخر هفته","What are you doing this weekend?","این آخر هفته چه می‌کنی؟","We visited our uncle last weekend.","آخر هفته گذشته به عمویمان سر زدیم.",null,null],
["A2","month","noun","Travel","one of the twelve parts of a year","یکی از دوازده بخش سال","ماه","My birthday is next month.","تولدم ماه آینده است.","We stayed there for a month.","یک ماه آنجا ماندیم.","/mʌnθ/"],
["A2","photo","noun","Travel","a picture made with a camera","عکسی که با دوربین گرفته می‌شود","عکس","She took many photos.","او عکس‌های زیادی گرفت.","Can I take a photo here?","می‌توانم اینجا عکس بگیرم؟","/ˈfəʊtəʊ/"],
["A2","weather","noun","Weather","sun, rain, or wind outside","آفتاب، باران یا باد بیرون","هوا","The weather is cold today.","امروز هوا سرد است.","What is the weather like?","هوا چطور است؟","/ˈweðər/"],
["A2","rain","noun","Weather","water that falls from clouds","آبی که از ابرها می‌بارد","باران","The rain stopped at noon.","باران ظهر بند آمد.","We stayed home because of the rain.","به‌خاطر باران در خانه ماندیم.","/reɪn/"],
["A2","sunny","adjective","Weather","with bright sun and no clouds","با آفتاب درخشان و بدون ابر","آفتابی","It is sunny today.","امروز آفتابی است.","We love sunny weekends.","آخر هفته‌های آفتابی را دوست داریم.","/ˈsʌni/"],
["A2","restaurant","noun","Food","a place where you buy and eat meals","جایی که در آن غذا می‌خری و می‌خوری","رستوران","This restaurant is famous.","این رستوران معروف است.","We ate dinner at a small restaurant.","در رستوران کوچکی شام خوردیم.","/ˈrestərɑːnt/"],
["A2","menu","noun","Food","the list of food in a restaurant","فهرست غذاهای رستوران","منو","Can I see the menu, please?","منو را می‌بینم لطفاً؟","The menu has many dishes.","منو غذاهای زیادی دارد.","/ˈmenjuː/"],
["A2","cook","verb","Food","to make food ready to eat with heat","غذا را با حرارت برای خوردن آماده کردن","پختن","My father cooks on Fridays.","پدرم جمعه‌ها آشپزی می‌کند.","She is cooking dinner now.","الان دارد شام می‌پزد.","/kʊk/"],
["A2","gift","noun","People","something you give to make someone happy","چیزی که می‌دهی تا کسی خوشحال شود","هدیه","Thank you for the gift!","ممنون بابت هدیه!","He bought a gift for his mother.","برای مادرش هدیه‌ای خرید.","/ɡɪft/"],
["A2","neighbour","noun","People","a person who lives near you","کسی که نزدیک تو زندگی می‌کند","همسایه","Our neighbours are very kind.","همسایه‌های ما خیلی مهربان‌اند.","She invited the neighbours for tea.","همسایه‌ها را به چای دعوت کرد.",null,null],
["A2","son","noun","People","a male child of a mother or father","فرزند پسر پدر یا مادر","پسر","They have one son.","آن‌ها یک پسر دارند.","His son is five years old.","پسرش پنج ساله است.","/sʌn/"],
["A2","daughter","noun","People","a female child of a mother or father","فرزند دختر پدر یا مادر","دختر","Their daughter is a doctor.","دخترشان پزشک است.","My daughter loves books.","دخترم کتاب دوست دارد.","/ˈdɔːtər/"],
["A2","invite","verb","People","to ask someone to come to an event","از کسی خواستن که به مراسمی بیاید","دعوت کردن","We invited them to dinner.","آن‌ها را به شام دعوت کردیم.","She invited me to her party.","مرا به مهمانی‌اش دعوت کرد.","/ɪnˈvaɪt/"],
["A2","evening","noun","Time","the part of the day before night","بخش روز پیش از شب","عصر","Good evening!","عصر بخیر!","We walk every evening.","هر عصر پیاده‌روی می‌کنیم.","/ˈiːvnɪŋ/"],
["A2","early","adjective","Time","before the usual time","پیش از زمان معمول","زود","The train arrived early.","قطار زود رسید.","I wake up early.","زود بیدار می‌شوم.","/ˈɜːrli/"],
["A2","late","adjective","Time","after the right time","پس از زمان درست","دیر","Sorry I am late!","ببخشید دیر کردم!","The bus is always late.","اتوبوس همیشه دیر می‌کند.","/leɪt/"],
["A2","phone","noun","Communication","a machine you use to call people","وسیله‌ای که با آن به مردم زنگ می‌زنی","تلفن","My phone is old.","گوشیم قدیمی است.","Call me on my phone.","به گوشیم زنگ بزن.","/fəʊn/"],
["A2","message","noun","Communication","short words you send to someone","واژه‌های کوتاهی که برای کسی می‌فرستی","پیام","I sent her a message.","برای او پیامی فرستادم.","Did you get my message?","پیامم را گرفتی؟","/ˈmesɪdʒ/"],
["A2","email","noun","Communication","a message you send by computer","پیامی که با کامپیوتر می‌فرستی","ایمیل","I will send you an email.","برایت ایمیل می‌فرستم.","Check your email every day.","هر روز ایمیلت را چک کن.","/ˈiːmeɪl/"],
["A2","tired","adjective","Feelings","needing rest or sleep","نیازمند استراحت یا خواب","خسته","I am tired after work.","بعد از کار خسته‌ام.","The children look tired.","بچه‌ها خسته به نظر می‌رسند.","/ˈtaɪərd/"],
["A2","busy","adjective","Feelings","having a lot to do","کار زیاد داشتن","شلوغ؛ پرمشغله","She is busy today.","او امروز سرش شلوغ است.","The streets are busy at noon.","خیابان‌ها ظهر شلوغ‌اند.","/ˈbɪzi/"],
["A2","famous","adjective","Feelings","known by many people","شناخته‌شده برای آدم‌های زیاد","معروف","This city is famous for roses.","این شهر به گل‌هایش معروف است.","He is a famous singer.","او خواننده معروفی است.","/ˈfeɪməs/"],
["A2","quiet","adjective","Feelings","with little noise; calm","با صدای کم؛ آرام","ساکت؛ آرام","The library is quiet.","کتابخانه ساکت است.","We live on a quiet street.","در خیابان آرامی زندگی می‌کنیم.","/ˈkwaɪət/"],
["A2","decide","verb","Feelings","to choose what to do after thinking","پس از فکر کردن انتخاب کردن چه باید کرد","تصمیم گرفتن","We decided to travel by train.","تصمیم گرفتیم با قطار سفر کنیم.","Have you decided yet?","هنوز تصمیم گرفته‌ای؟","/dɪˈsaɪd/"],
["A2","borrow","verb","Feelings","to take and use something, then give it back","چیزی را گرفتن و استفاده کردن و پس دادن","قرض گرفتن","Can I borrow your pen?","خودکارت را قرض می‌گیری؟","She borrowed a book from me.","کتابی از من قرض گرفت.",null,null],
["B1","experience","noun","Experience","something that happens to you and teaches you","چیزی که برایت رخ می‌دهد و به تو می‌آموزد","تجربه","Travel is a great experience.","سفر تجربه بزرگی است.","She has ten years of work experience.","او ده سال سابقه کار دارد.",null,null],
["B1","opinion","noun","Experience","what you think about something","آنچه درباره چیزی فکر می‌کنی","نظر","In my opinion, the film was too long.","به نظر من فیلم خیلی طولانی بود.","Everyone has a different opinion.","هر کسی نظر متفاوتی دارد.",null,null],
["B1","reason","noun","Experience","why something happens or why you do it","چرا چیزی رخ می‌دهد یا چرا کاری می‌کنی","دلیل","The reason was simple: no money.","دلیل ساده بود: پول نبود.","Give me one good reason to stay.","یک دلیل خوب برای ماندن بگو.",null,null],
["B1","choice","noun","Experience","something you choose from two or more things","چیزی که از میان دو یا چند چیز انتخاب می‌کنی","انتخاب","It was a hard choice.","انتخاب سختی بود.","You have two choices: bus or train.","دو انتخاب داری: اتوبوس یا قطار.",null,null],
["B1","effect","noun","Experience","a change that something causes","تغییری که چیزی ایجاد می‌کند","اثر","Sport has a good effect on health.","ورزش اثر خوبی بر سلامت دارد.","What was the effect of the rain?","اثر باران چه بود؟",null,null],
["B1","purpose","noun","Experience","the reason you do something","دلیلی که برای آن کاری می‌کنی","هدف","The purpose of the meeting is clear.","هدف جلسه روشن است.","What is the purpose of this rule?","هدف این قانون چیست؟","/ˈpɜːrpəs/"],
["B1","career","noun","Work","the jobs you do in your life, with progress","شغل‌هایی که در زندگی می‌کنی با پیشرفت","حرفه","She wants a career in medicine.","می‌خواهد در پزشکی حرفه‌ای شود.","Teaching is a good career.","معلمی حرفه خوبی است.",null,null],
["B1","meeting","noun","Work","when people come together to talk and decide","وقتی مردم گرد هم می‌آیند تا حرف بزنند و تصمیم بگیرند","جلسه","The meeting starts at ten.","جلسه ساعت ده شروع می‌شود.","We had a short meeting yesterday.","دیروز جلسه کوتاهی داشتیم.","/ˈmiːtɪŋ/"],
["B1","project","noun","Work","planned work with a clear goal","کار برنامه‌ریزی‌شده با هدف روشن","پروژه","Our project finished on time.","پروژه ما سر وقت تمام شد.","She leads a school project.","او پروژه مدرسه‌ای را رهبری می‌کند.",null,null],
["B1","customer","noun","Work","a person who buys from a shop or firm","کسی که از مغازه یا شرکت می‌خرد","مشتری","The customers are waiting.","مشتری‌ها منتظرند.","A happy customer comes back.","مشتری خوشحال برمی‌گردد.","/ˈkʌstəmər/"],
["B1","salary","noun","Work","money you get each month for your job","پولی که هر ماه برای کارت می‌گیری","حقوق","Her salary is good.","حقوقش خوب است.","They raised our salaries.","حقوق ما را بالا بردند.",null,null],
["B1","careful","adjective","Character","giving attention to avoid mistakes","توجه کردن برای پرهیز از اشتباه","مراقب","Be careful on the road!","در جاده مراقب باش!","She is careful with money.","او در خرج پول مراقب است.",null,null],
["B1","honest","adjective","Character","always telling the truth","همیشه راست گفتن","صادق","Be honest with me.","با من صادق باش.","He is an honest worker.","او کارگر صادقی است.","/ˈɑːnɪst/"],
["B1","polite","adjective","Character","behaving well and showing respect","خوب رفتار کردن و احترام نشان دادن","مؤدب","The students are very polite.","دانش‌آموزان خیلی مؤدب‌اند.","It is polite to say thank you.","گفتن ممنون ادب است.",null,null],
["B1","brave","adjective","Character","not afraid of danger","از خطر نترسیدن","شجاع","The brave boy saved the dog.","پسر شجاع سگ را نجات داد.","It was brave to speak first.","اول حرف زدن شجاعت می‌خواست.","/breɪv/"],
["B1","advice","noun","Communication","ideas you give to help someone decide","ایده‌هایی که می‌دهی تا به تصمیم کسی کمک شود","نصیحت","Can you give me some advice?","می‌توانی نصیحتم کنی؟","Her advice was very useful.","نصیحتش خیلی مفید بود.",null,null],
["B1","discuss","verb","Communication","to talk about something to understand or decide","درباره چیزی حرف زدن برای فهمیدن یا تصمیم گرفتن","بحث کردن","We discussed the plan for an hour.","یک ساعت درباره برنامه بحث کردیم.","Let us discuss it tomorrow.","فردا درباره‌اش بحث کنیم.",null,null],
["B1","agree","verb","Communication","to have the same opinion","نظر یکسان داشتن","موافق بودن","I agree with you.","با تو موافقم.","They agreed to meet again.","توافق کردند دوباره دیدار کنند.",null,null],
["B1","disagree","verb","Communication","to have a different opinion","نظر متفاوت داشتن","مخالف بودن","I disagree with that idea.","با آن ایده مخالفم.","We disagreed but stayed friends.","مخالف بودیم ولی دوست ماندیم.",null,null],
["B1","prefer","verb","Communication","to like one thing more than another","یک چیز را از دیگری بیشتر دوست داشتن","ترجیح دادن","I prefer tea to coffee.","چای را به قهوه ترجیح می‌دهم.","Which do you prefer?","کدام را ترجیح می‌دهی؟",null,null],
["B1","believe","verb","Communication","to think something is true","فکر کردن چیزی درست است","باور داشتن","I believe you.","باورت دارم.","Do you believe in luck?","به شانس باور داری؟",null,null],
["B1","journey","noun","Travel","travelling from one place to another","سفر از جایی به جای دیگر","سفر","The journey took five hours.","سفر پنج ساعت طول کشید.","Have a safe journey!","سفر بی‌خطری داشته باشی!",null,null],
["B1","luggage","noun","Travel","the bags you carry when you travel","کیف‌هایی که هنگام سفر می‌بری","چمدان؛ بار","My luggage is heavy.","چمدانم سنگین است.","We lost our luggage at the airport.","چمدانمان را در فرودگاه گم کردیم.",null,null],
["B1","delay","noun","Travel","when something happens later than planned","وقتی چیزی دیرتر از برنامه رخ می‌دهد","تأخیر","The flight has a two-hour delay.","پرواز دو ساعت تأخیر دارد.","Sorry for the delay.","بابت تأخیر متأسفم.",null,null],
["B1","cancel","verb","Travel","to stop something that was planned","متوقف کردن چیزی که برنامه‌ریزی شده بود","لغو کردن","They cancelled the flight.","پرواز را لغو کردند.","She cancelled our meeting.","جلسه ما را لغو کرد.",null,null],
["B1","recommend","verb","Travel","to say something is good for someone","گفتن چیزی برای کسی خوب است","توصیه کردن","I recommend this hotel.","این هتل را توصیه می‌کنم.","What do you recommend?","چه توصیه می‌کنی؟",null,null],
["B1","habit","noun","Growth","something you do often without thinking","کاری که اغلب بدون فکر می‌کنی","عادت","Reading is a good habit.","کتاب خواندن عادت خوبی است.","He wants to break a bad habit.","می‌خواهد عادت بدی را ترک کند.",null,null],
["B1","skill","noun","Growth","the ability to do something well","توانایی خوب انجام دادن کاری","مهارت","Speaking is an important skill.","سخن گفتن مهارت مهمی است.","She learned new skills at work.","او در کار مهارت‌های جدیدی یاد گرفت.","/skɪl/"],
["B1","improve","verb","Growth","to make something better","چیزی را بهتر کردن","بهبود دادن","I want to improve my English.","می‌خواهم انگلیسی‌ام را بهتر کنم.","Sport improved his health.","ورزش سلامتی‌اش را بهتر کرد.",null,null],
["B1","modern","adjective","Growth","new and of the present time","جدید و مال زمان حال","مدرن","They live in a modern house.","در خانه مدرنی زندگی می‌کنند.","Modern life is very fast.","زندگی مدرن خیلی سریع است.",null,null],
["B2","argument","noun","Argument","a reason you give to show you are right","دلیلی که می‌آوری تا نشان دهی درست می‌گویی","استدلال","His argument was strong.","استدلالش قوی بود.","She won the argument with facts.","با واقعیت‌ها بحث را برد.",null,null],
["B2","evidence","noun","Argument","facts that show something is true","واقعیت‌هایی که نشان می‌دهد چیزی درست است","شواهد","There is no evidence for that claim.","برای آن ادعا شواهدی نیست.","The evidence supports her idea.","شواهد ایده او را پشتیبانی می‌کند.",null,null],
["B2","issue","noun","Argument","an important problem people discuss","مشکل مهمی که مردم درباره‌اش بحث می‌کنند","مسئله","Water is a serious issue here.","آب اینجا مسئله جدی است.","They discussed the main issues.","درباره مسئله‌های اصلی بحث کردند.",null,null],
["B2","benefit","noun","Argument","a good effect something gives","اثر خوبی که چیزی می‌دهد","سود؛ فایده","The benefits are clear: health and money.","فایده‌ها روشن‌اند: سلامت و پول.","Everyone gets some benefit.","همه کمی سود می‌برند.",null,null],
["B2","risk","noun","Argument","the chance that something bad happens","احتمال اینکه چیز بدی رخ دهد","ریسک","There is a risk of rain.","احتمال باران هست.","He took a big risk and won.","ریسک بزرگی کرد و برد.",null,null],
["B2","doubt","noun","Argument","not being sure something is true","مطمئن نبودن از درستی چیزی","تردید","I have doubts about this plan.","درباره این برنامه تردید دارم.","There is no doubt she is right.","تردیدی نیست که او درست می‌گوید.",null,null],
["B2","trend","noun","Change","the way something is changing","طریقی که چیزی در حال تغییر است","روند","Online shopping is a growing trend.","خرید اینترنتی روند رو به رشدی است.","The trend is moving up.","روند رو به بالاست.",null,null],
["B2","impact","noun","Change","a strong effect on something","اثر قوی بر چیزی","اثر","The rain had a big impact on crops.","باران اثر بزرگی بر محصول داشت.","What is the impact of phones on sleep?","اثر گوشی بر خواب چیست؟",null,null],
["B2","opportunity","noun","Change","a good chance to do something","فرصت خوب برای انجام کاری","فرصت","This job is a great opportunity.","این شغل فرصت بزرگی است.","Give everyone an equal opportunity.","به همه فرصت برابر بده.",null,null],
["B2","challenge","noun","Change","a hard task that tests you","وظیفه سختی که تو را می‌آزماید","چالش","Learning Chinese is a real challenge.","یادگیری چینی چالش واقعی است.","She enjoys new challenges.","او از چالش‌های جدید لذت می‌برد.",null,null],
["B2","solution","noun","Change","a way to fix a problem","راهی برای حل مشکل","راه‌حل","We need a better solution.","راه‌حل بهتری لازم داریم.","There is no easy solution.","راه‌حل آسانی نیست.",null,null],
["B2","overcome","verb","Change","to win against a problem or fear","غلبه بر مشکل یا ترس","غلبه کردن","She overcame her fear of flying.","بر ترس پروازش غلبه کرد.","We can overcome this problem together.","می‌توانیم با هم بر این مشکل غلبه کنیم.",null,null],
["B2","persist","verb","Change","to continue even when it is hard","ادامه دادن حتی وقتی سخت است","پافشاری کردن","If you persist, you will win.","اگر پافشاری کنی می‌بری.","The rain persisted all day.","باران تمام روز ادامه داشت.",null,null],
["B2","responsibility","noun","Work","a duty you must do","وظیفه‌ای که باید انجام دهی","مسئولیت","It is my responsibility to lock the door.","قفل کردن در مسئولیت من است.","Take responsibility for your work.","مسئولیت کارت را بپذیر.",null,null],
["B2","decision","noun","Work","a choice you make after thinking","انتخابی که پس از فکر کردن می‌کنی","تصمیم","It was a hard decision.","تصمیم سختی بود.","Make a decision and stick to it.","تصمیم بگیر و پایش بایست.",null,null],
["B2","knowledge","noun","Work","what you know from learning","آنچه از یادگیری می‌دانی","دانش","Her knowledge of history is deep.","دانش تاریخی‌اش عمیق است.","Share your knowledge with others.","دانشت را با دیگران تقسیم کن.",null,null],
["B2","effort","noun","Work","hard work you put into something","تلاش سختی که در کاری می‌گذاری","تلاش","Thank you for your effort.","ممنون بابت تلاشت.","With a little effort, you can pass.","با کمی تلاش می‌توانی قبول شوی.",null,null],
["B2","manage","verb","Work","to control and organise work or people","کنترل و سازماندهی کار یا آدم‌ها","مدیریت کردن","She manages a team of ten.","تیمی ده‌نفره را مدیریت می‌کند.","Can you manage without help?","بدون کمک می‌توانی پیش بروی؟",null,null],
["B2","organise","verb","Work","to plan and arrange things well","خوب برنامه‌ریزی و مرتب کردن چیزها","سازماندهی کردن","We organised a clean-up day.","روز پاکسازی را سازماندهی کردیم.","She organises her desk every morning.","هر صبح میزش را مرتب می‌کند.",null,null],
["B2","efficient","adjective","Work","working well without wasting time","خوب کار کردن بدون هدر دادن وقت","کارآمد","This method is fast and efficient.","این روش سریع و کارآمد است.","She is a very efficient manager.","او مدیر بسیار کارآمدی است.",null,null],
["B2","suggest","verb","Communication","to give an idea for someone to think about","ایده‌ای دادن تا کسی درباره‌اش فکر کند","پیشنهاد دادن","I suggest leaving early.","پیشنهاد می‌کنم زود برویم.","She suggested a good hotel.","هتل خوبی پیشنهاد داد.",null,null],
["B2","insist","verb","Communication","to say firmly that something must happen","محکم گفتن که چیزی باید رخ دهد","اصرار کردن","He insisted on paying.","اصرار داشت پول بدهد.","She insisted that it was true.","اصرار داشت که درست است.",null,null],
["B2","admit","verb","Communication","to say that something bad is true","گفتن اینکه چیز بدی درست است","اعتراف کردن","He admitted his mistake.","به اشتباهش اعتراف کرد.","She admitted that she was late.","اعتراف کرد که دیر کرده است.",null,null],
["B2","attitude","noun","Communication","how you think and feel about something","طوری که درباره چیزی فکر و احساس می‌کنی","نگرش","She has a positive attitude.","نگرش مثبتی دارد.","Your attitude decides your day.","نگرشت روزت را می‌سازد.",null,null],
["B2","behaviour","noun","Communication","how a person acts","طوری که آدم رفتار می‌کند","رفتار","Good behaviour brings respect.","رفتار خوب احترام می‌آورد.","His behaviour surprised us.","رفتارش ما را شگفت‌زده کرد.",null,null],
["B2","aware","adjective","Character","knowing that something exists","دانستن اینکه چیزی وجود دارد","آگاه","Are you aware of the risk?","از ریسک آگاهی؟","We must be aware of the rules.","باید از قوانین آگاه باشیم.",null,null],
["B2","ambitious","adjective","Character","wanting strongly to succeed","قوی خواستن برای موفق شدن","جاه‌طلب","She is young and ambitious.","جوان و جاه‌طلب است.","It is an ambitious plan, but good.","برنامه جاه‌طلبانه‌ای است ولی خوب است.",null,null],
["B2","curious","adjective","Character","wanting to know and learn","خواستن برای دانستن و یاد گرفتن","کنجکاو","Children are naturally curious.","بچه‌ها ذاتاً کنجکاوند.","I am curious about your trip.","درباره سفرت کنجکاوم.",null,null],
["B2","grateful","adjective","Character","feeling thanks for something","احساس سپاس برای چیزی","سپاسگزار","I am grateful for your help.","بابت کمکت سپاسگزارم.","We are grateful to our teachers.","از معلمانمان سپاسگزاریم.",null,null],
["B2","confident","adjective","Character","sure you can do something well","مطمئن بودن که کاری را خوب می‌توانی کرد","مطمئن","She feels confident about the test.","درباره آزمون احساس اطمینان می‌کند.","Speak slowly and stay confident.","آرام حرف بزن و مطمئن بمان.",null,null],
["C1","notion","noun","Ideas","an idea or belief about something","ایده یا باوری درباره چیزی","تصور","He rejects the notion that money buys happiness.","این تصور را رد می‌کند که پول خوشبختی می‌خرد.","Where did you get that strange notion?","این تصور عجیب را از کجا آوردی؟",null,null],
["C1","perspective","noun","Ideas","a way of seeing and judging things","طریقه دیدن و داوری چیزها","دیدگاه","From my perspective, the plan works.","از دیدگاه من برنامه جواب می‌دهد.","Travel gives you a new perspective.","سفر به تو دیدگاه جدیدی می‌دهد.",null,null],
["C1","implication","noun","Ideas","what something suggests without saying directly","آنچه چیزی بدون گفتن مستقیم نشان می‌دهد","پیامد ضمنی","The implication is clear: costs will rise.","پیامد روشن است: هزینه‌ها بالا می‌رود.","What are the implications of this law?","پیامدهای این قانون چیست؟",null,null],
["C1","phenomenon","noun","Ideas","something that happens and can be seen or studied","چیزی که رخ می‌دهد و می‌توان دید یا مطالعه کرد","پدیده","Migration is a global phenomenon.","مهاجرت پدیده جهانی است.","Scientists study this strange phenomenon.","دانشمندان این پدیده عجیب را مطالعه می‌کنند.",null,null],
["C1","paradox","noun","Ideas","a statement that seems false but may be true","گفته‌ای که غلط به نظر می‌رسد ولی شاید درست باشد","تناقض‌نما","It is a paradox: more choice, less happiness.","تناقض‌نماست: انتخاب بیشتر، خوشبختی کمتر.","The paradox puzzled the students.","تناقض‌نما دانشجویان را متحیر کرد.",null,null],
["C1","dilemma","noun","Ideas","a hard choice between two bad options","انتخاب سخت میان دو گزینه بد","دوراهی","She faces a real dilemma: job or family.","دوراهی واقعی دارد: شغل یا خانواده.","There is no easy answer to this dilemma.","پاسخ آسانی برای این دوراهی نیست.",null,null],
["C1","controversy","noun","Discourse","long public disagreement about something","مخالفت عمومی طولانی درباره چیزی","مناقشه","The new dam caused controversy.","سد جدید مناقشه ایجاد کرد.","The book ended years of controversy.","کتاب به سال‌ها مناقشه پایان داد.",null,null],
["C1","consensus","noun","Discourse","agreement among most people in a group","توافق بیشتر اعضای گروه","اجماع","There is consensus on the main points.","درباره نکته‌های اصلی اجماع هست.","We reached a consensus after hours.","پس از ساعت‌ها به اجماع رسیدیم.",null,null],
["C1","nuance","noun","Discourse","a very small difference in meaning or feeling","تفاوت بسیار کوچک در معنا یا حس","ظرافت","She explained the nuances of the poem.","ظرافت‌های شعر را توضیح داد.","Translation loses some nuance.","ترجمه کمی از ظرافت را از دست می‌دهد.",null,null],
["C1","ambiguity","noun","Discourse","when something has more than one meaning","وقتی چیزی بیش از یک معنا دارد","ابهام","Good contracts avoid ambiguity.","قراردادهای خوب از ابهام پرهیز می‌کنند.","The ambiguity confused the readers.","ابهام خوانندگان را گیج کرد.",null,null],
["C1","scrutiny","noun","Discourse","very careful and critical examination","بررسی بسیار دقیق و نقادانه","موشکافی","The budget is under public scrutiny.","بودجه زیر موشکافی عمومی است.","Her work survived close scrutiny.","کارش از موشکافی دقیق جان سالم به در برد.",null,null],
["C1","integrity","noun","Character","honesty and strong moral behaviour","صداقت و رفتار اخلاقی قوی","درستکاری","Voters respect his integrity.","رأی‌دهندگان به درستکاری‌اش احترام می‌گذارند.","Never risk your integrity for money.","هرگز درستکاری‌ات را برای پول به خطر نینداز.",null,null],
["C1","resilience","noun","Character","the power to recover after hard times","توان برگشتن پس از روزهای سخت","تاب‌آوری","The city showed great resilience.","شهر تاب‌آوری بزرگی نشان داد.","Sport builds mental resilience.","ورزش تاب‌آوری ذهنی می‌سازد.",null,null],
["C1","meticulous","adjective","Character","very careful about small details","بسیار مراقب در جزئیات کوچک","موشکاف","She keeps meticulous notes.","یادداشت‌های موشکافانه‌ای نگه می‌دارد.","Good surgeons are meticulous.","جراحان خوب موشکاف‌اند.",null,null],
["C1","profound","adjective","Character","very deep in meaning or feeling","بسیار عمیق در معنا یا حس","عمیق","The film had a profound effect on me.","فیلم اثر عمیقی بر من گذاشت.","She spoke with profound sadness.","با اندوه عمیقی حرف زد.",null,null],
["C1","subtle","adjective","Character","small and hard to notice","کوچک و سخت برای توجه","لطیف","There is a subtle difference here.","اینجا تفاوت لطیفی هست.","Her smile was subtle but warm.","لبخندش لطیف ولی گرم بود.",null,null],
["C1","prevail","verb","Action","to win after a hard fight","بردن پس از نبرد سخت","پیروز شدن","In the end, reason prevailed.","در پایان عقل پیروز شد.","Good must prevail over evil.","خوبی باید بر بدی پیروز شود.",null,null],
["C1","undermine","verb","Action","to slowly weaken someone or something","آرام ضعیف کردن کسی یا چیزی","تضعیف کردن","Lies undermine trust.","دروغ‌ها اعتماد را تضعیف می‌کنند.","Delays undermined the whole project.","تأخیرها کل پروژه را تضعیف کرد.",null,null],
["C1","encompass","verb","Action","to include many things together","دربرگرفتن چیزهای زیاد با هم","دربرگرفتن","The course encompasses grammar and skills.","دوره گرامر و مهارت‌ها را دربرمی‌گیرد.","Her work encompasses three decades.","کارش سه دهه را دربرمی‌گیرد.",null,null],
["C1","facilitate","verb","Action","to make a process easier","فرایندی را آسان‌تر کردن","تسهیل کردن","Good roads facilitate trade.","جاده‌های خوب تجارت را تسهیل می‌کنند.","She facilitates group discussions.","او بحث‌های گروهی را تسهیل می‌کند.",null,null],
["C1","provoke","verb","Action","to cause a strong feeling or reaction","ایجاد حس یا واکنش قوی","برانگیختن","The speech provoked anger.","سخنرانی خشم برانگیخت.","His question provoked a long debate.","سؤالش بحث طولانی برانگیخت.",null,null],
["C1","contemplate","verb","Action","to think about something deeply","عمیق درباره چیزی فکر کردن","تأمل کردن","She sat and contemplated the sea.","نشست و به دریا تأمل کرد.","He contemplated leaving the job.","به ترک شغل می‌اندیشید.",null,null],
["C1","discern","verb","Action","to see or understand something unclear","دیدن یا فهمیدن چیز نامشخص","تشخیص دادن","I could discern two voices in the dark.","در تاریکی دو صدا را تشخیص دادم.","It is hard to discern the truth here.","اینجا تشخیص حقیقت سخت است.",null,null],
["C1","coherent","adjective","Quality","clear, logical, and well organised","روشن، منطقی و خوب سازمان‌یافته","منسجم","Write a coherent paragraph.","پاراگراف منسجمی بنویس.","Her argument is clear and coherent.","استدلالش روشن و منسجم است.",null,null],
["C1","compelling","adjective","Quality","so strong you must agree or act","آن‌قدر قوی که باید موافق شوی یا اقدام کنی","قانع‌کننده","She gave a compelling speech.","سخنرانی قانع‌کننده‌ای کرد.","The evidence is compelling.","شواهد قانع‌کننده است.",null,null],
["C1","inevitable","adjective","Quality","sure to happen; cannot be avoided","حتمی برای رخ دادن؛ اجتناب‌ناپذیر","اجتناب‌ناپذیر","Change is inevitable.","تغییر اجتناب‌ناپذیر است.","Delays were inevitable in winter.","تأخیرها در زمستان اجتناب‌ناپذیر بود.",null,null],
["C1","unprecedented","adjective","Quality","never happened before","پیش از این هرگز رخ نداده","بی‌سابقه","We face unprecedented heat.","با گرمای بی‌سابقه‌ای روبه‌رو هستیم.","The response was unprecedented.","پاسخ بی‌سابقه بود.",null,null],
["C1","sustainable","adjective","Quality","able to continue without harm","قادر به ادامه بدون آسیب","پایدار","We need sustainable energy.","انرژی پایدار لازم داریم.","This growth is not sustainable.","این رشد پایدار نیست.",null,null],
["C1","ethical","adjective","Quality","morally right and fair","اخلاقاً درست و منصفانه","اخلاقی","Is this test ethical?","آیا این آزمون اخلاقی است؟","We follow strict ethical rules.","از قوانین اخلاقی سخت پیروی می‌کنیم.",null,null],
["C1","diverse","adjective","Quality","showing many different kinds","نشان‌دهنده گونه‌های متفاوت زیاد","متنوع","Our class is rich and diverse.","کلاس ما غنی و متنوع است.","The city has diverse food.","شهر غذای متنوعی دارد.",null,null],
["C2","eloquence","noun","Rhetoric","beautiful and powerful speaking","سخن گفتن زیبا و قدرتمند","فصاحت","The crowd loved her eloquence.","جمعیت فصاحتش را دوست داشت.","He spoke with rare eloquence.","با فصاحت کم‌نظیری حرف زد.",null,null],
["C2","rhetoric","noun","Rhetoric","the art of speaking to persuade","هنر سخن گفتن برای اقناع","بلاغت","His rhetoric moved the nation.","بلاغتش ملت را تکان داد.","Empty rhetoric changes nothing.","بلاغت توخالی چیزی را عوض نمی‌کند.",null,null],
["C2","connotation","noun","Rhetoric","the feelings a word carries beyond its meaning","حس‌هایی که واژه فراتر از معنایش دارد","بار معنایی","Home has warm connotations.","خانه بار معنایی گرمی دارد.","Cheap has a bad connotation.","ارزان بار معنایی بدی دارد.",null,null],
["C2","candour","noun","Rhetoric","honest and open speaking","سخن صادانه و بی‌پرده","صراحت","She answered with surprising candour.","با صراحت شگفت‌انگیزی جواب داد.","We value candour in this team.","در این تیم برای صراحت ارزش قائلیم.",null,null],
["C2","articulate","adjective","Rhetoric","able to express ideas clearly in words","توانا در بیان روشن ایده‌ها با واژه","خوش‌بیان","She is an articulate speaker.","سخنران خوش‌بیانی است.","He gave an articulate answer.","جواب خوش‌بیانی داد.",null,null],
["C2","dichotomy","noun","Thought","a deep split between two opposite things","شکاف عمیق میان دو چیز متضاد","دوگانگی","There is a false dichotomy here: jobs or nature.","اینجا دوگانگی کاذبی هست: شغل یا طبیعت.","The book explores this old dichotomy.","کتاب این دوگانگی قدیمی را می‌کاود.",null,null],
["C2","paradigm","noun","Thought","a full model for thinking about something","مدل کامل برای فکر کردن درباره چیزی","پارادایم","The internet created a new paradigm.","اینترنت پارادایم جدیدی ساخت.","We need a paradigm shift in teaching.","در آموزش به تغییر پارادایم نیاز داریم.",null,null],
["C2","tenet","noun","Thought","a basic belief held by a group","باور پایه‌ای که گروهی به آن معتقد است","اصل اعتقادی","Honesty is a central tenet here.","صداقت اصل مرکزی اینجاست.","He rejects the tenets of that school.","اصول آن مکتب را رد می‌کند.",null,null],
["C2","dogma","noun","Thought","beliefs forced without questioning","باورهایی که بدون پرسش تحمیل می‌شوند","جزمیات","Blind dogma kills curiosity.","جزمیات کور کنجکاوی را می‌کشد.","She challenged the old dogma.","جزمیات قدیمی را به چالش کشید.",null,null],
["C2","scepticism","noun","Thought","doubting that claims are true","تردید در درستی ادعاها","شکاکیت","Healthy scepticism protects science.","شکاکیت سالم از علم محافظت می‌کند.","He faced the news with scepticism.","با شکاکیت به خبر نگاه کرد.",null,null],
["C2","pragmatism","noun","Thought","judging ideas by their real results","داوری ایده‌ها بر اساس نتایج واقعی‌شان","عمل‌گرایی","Her pragmatism solved the crisis.","عمل‌گرایی‌اش بحران را حل کرد.","We need less slogans, more pragmatism.","شعار کمتر و عمل‌گرایی بیشتر لازم داریم.",null,null],
["C2","juxtaposition","noun","Analysis","placing two things side by side to compare","کنار هم گذاشتن دو چیز برای مقایسه","هم‌نشینی","The film uses rich juxtaposition: war and wedding.","فیلم از هم‌نشینی غنی استفاده می‌کند: جنگ و عروسی.","Notice the juxtaposition of light and dark.","به هم‌نشینی روشن و تاریک توجه کن.",null,null],
["C2","elicit","verb","Analysis","to draw out an answer or reaction","بیرون کشیدن جواب یا واکنش","برآوردن","Good questions elicit honest answers.","سؤال‌های خوب جواب‌های صادانه برمی‌آورند.","The speech elicited loud applause.","سخنرانی تشویق بلندی برآورد.",null,null],
["C2","corroborate","verb","Analysis","to support a claim with new evidence","پشتیبانی ادعا با شواهد جدید","تأیید کردن","Two witnesses corroborate her story.","دو شاهد داستانش را تأیید می‌کنند.","Data corroborates the theory.","داده نظریه را تأیید می‌کند.",null,null],
["C2","refute","verb","Analysis","to prove a claim is wrong","اثبات نادرستی ادعا","رد کردن","She refuted the rumour with facts.","شایعه را با واقعیت‌ها رد کرد.","Can you refute this argument?","می‌توانی این استدلال را رد کنی؟",null,null],
["C2","allude","verb","Analysis","to mention something indirectly","غیرمستقیم به چیزی اشاره کردن","اشاره کردن","He alluded to past failures.","به شکست‌های گذشته اشاره کرد.","She alluded to a secret deal.","به معامله پنهانی اشاره کرد.",null,null],
["C2","encapsulate","verb","Analysis","to express much in few words","بیان مطلب زیاد در واژه کم","خلاصه کردن","One sentence encapsulates her life: serve others.","یک جمله زندگی‌اش را خلاصه می‌کند: به دیگران خدمت کن.","The poem encapsulates our grief.","شعر اندوه ما را خلاصه می‌کند.",null,null],
["C2","scrutinise","verb","Analysis","to examine very carefully","بسیار دقیق بررسی کردن","موشکافی کردن","Auditors scrutinise every bill.","حسابرسان هر صورت‌حساب را موشکافی می‌کنند.","Scrutinise the contract before you sign.","پیش از امضا قرارداد را موشکافی کن.",null,null],
["C2","subtlety","noun","Quality","a fine small detail or distinction","جزئیات یا تمایز ظریف کوچک","ظرافت","She appreciates the subtleties of tea.","ظرافت‌های چای را درک می‌کند.","The plan lacks subtlety.","برنامه ظرافت ندارد.",null,null],
["C2","esoteric","adjective","Quality","understood only by few experts","فهمیده‌شده فقط توسط چند متخصص","خاص‌فهم","The paper is brilliant but esoteric.","مقاله درخشان ولی خاص‌فهم است.","They debated esoteric rules.","درباره قوانین خاص‌فهم بحث کردند.",null,null],
["C2","quintessential","adjective","Quality","the perfect example of something","نمونه کامل چیزی","نمونه اعلا","She is the quintessential teacher.","او نمونه اعلای معلم است.","This is quintessential Isfahan art.","این نمونه اعلای هنر اصفهان است.",null,null],
["C2","impeccable","adjective","Quality","perfect, with no mistakes","کامل، بدون هیچ اشتباهی","بی‌نقص","His manners are impeccable.","ادبش بی‌نقص است.","She speaks impeccable French.","فرانسه بی‌نقصی حرف می‌زند.",null,null],
["C2","astute","adjective","Quality","clever at understanding people and situations","باهوش در فهم آدم‌ها و موقعیت‌ها","تیزهوش","She is an astute judge of character.","داور تیزهوش شخصیت است.","That was an astute question.","سؤال تیزهوشانه‌ای بود.",null,null],
["C2","understated","adjective","Quality","quiet and simple, without showing off","آرام و ساده، بدون خودنمایی","فروتنانه","He gave an understated speech.","سخنرانی فروتنانه‌ای کرد.","Her style is elegant and understated.","سبکش شیک و فروتنانه است.",null,null],
["C2","poignant","adjective","Quality","causing deep sadness or pity","ایجاد اندوه یا ترحم عمیق","سوزناک","The film's ending is poignant.","پایان فیلم سوزناک است.","She told a poignant story.","داستان سوزناکی گفت.",null,null],
["C2","formidable","adjective","Quality","strong and powerful, worthy of respect","قوی و قدرتمند، شایسته احترام","مهیب","She is a formidable debater.","مناظره‌کننده مهیبی است.","They face a formidable task.","با وظیفه مهیبی روبه‌رو هستند.",null,null],
["C2","scrupulous","adjective","Quality","very honest and careful about right and wrong","بسیار صادق و مراقب درست و غلط","وسواسی در درستی","He is scrupulous with money.","در پول وسواس درستی دارد.","Scrupulous work builds trust.","کار دقیق و درست اعتماد می‌سازد.",null,null],
["C2","ubiquitous","adjective","Quality","found everywhere","یافت‌شده در همه‌جا","همه‌جاحاضر","Phones are now ubiquitous.","گوشی‌ها حالا همه‌جاحاضرند.","Tea is ubiquitous in our culture.","چای در فرهنگ ما همه‌جاحاضر است.",null,null],
["C2","disparate","adjective","Quality","very different from each other","بسیار متفاوت از هم","ناهمگون","She united disparate groups.","گروه‌های ناهمگون را متحد کرد.","They come from disparate lands.","از سرزمین‌های ناهمگونی می‌آیند.",null,null],
["C2","salient","adjective","Quality","most important and easy to notice","مهم‌ترین و آسان برای توجه","برجسته","The salient point is cost.","نکته برجسته هزینه است.","List the salient facts first.","اول واقعیت‌های برجسته را فهرست کن.",null,null],
];

/* =========================== GRAMMAR (48) =============================== */
/* Row: [level, slugSuffix, titleEn, titleFa, summaryEn, summaryFa, explEn, explFa,
 *       [[sentence, translation|null, noteEn|null, noteFa|null] x3],
 *       [[mistakeEn, mistakeFa, correctionEn, correctionFa] x1-2]] */

function buildGrammar(rows, lessonKeysByLevel) {
  const seenPerLevel = new Map();
  return rows.map(([level, suffix, titleEn, titleFa, sumEn, sumFa, exEn, exFa, examples, mistakes], i) => {
    const lvl = String(level).toUpperCase();
    const slug = `${lvl.toLowerCase()}-grammar-${suffix}`;
    const n = seenPerLevel.get(lvl) ?? 0;
    seenPerLevel.set(lvl, n + 1);
    const lessonKeys = lessonKeysByLevel.get(lvl) || [];
    return {
      _key: slug,
      _level: lvl,
      _lessonKey: lessonKeys.length ? lessonKeys[n % lessonKeys.length] : null,
      slug,
      title: L(titleFa, titleEn),
      level: lvl,
      summary: L(sumFa, sumEn),
      explanation: L(exFa, exEn),
      examples: examples.map(([sentence, translation, noteEn, noteFa]) => {
        const ex = { sentence };
        if (translation) ex.translation = translation;
        if (noteEn) ex.note = L(noteFa || "", noteEn);
        return ex;
      }),
      commonMistakes: mistakes.map(([mEn, mFa, cEn, cFa]) => ({
        mistake: L(mFa, mEn),
        correction: L(cFa, cEn),
      })),
      order: i,
      status: "published",
    };
  });
}

const GRAMMAR_ROWS = [
["A1","be-present","The verb be","فعل be",
"Use am, is, are to introduce and describe.","از am و is و are برای معرفی و توصیف استفاده کنید.",
"I am a student. She is kind. They are friends. Use am with I, is with he/she/it, and are with we/you/they. Negatives add not: He is not tired.",
"من دانش‌آموزم. او مهربان است. آن‌ها دوست‌اند. با I از am، با he و she و it از is و با we و you و they از are استفاده می‌شود. منفی با not ساخته می‌شود.",
[["I am from Tabriz.","من اهل تبریزم.",null,null],["She is a nurse.","او پرستار است.",null,null],["They are not ready.","آن‌ها آماده نیستند.",null,null]],
[["I is happy.","من خوشحالم.","I am happy.","من خوشحالم."],["She are my sister.","او خواهر من است.","She is my sister.","او خواهر من است."]]],
["A1","pronouns-subject","Subject pronouns","ضمیرهای فاعلی",
"I, you, he, she, it, we, they replace names.","I و you و he و she و it و we و they جای نام می‌نشینند.",
"Replace names with pronouns: Sara → she, Ali and I → we. Use it for things and animals. Always keep the verb matched: He works, They work.",
"نام‌ها را با ضمیر جایگزین کنید: سارا می‌شود she. برای اشیا و حیوانات از it استفاده کنید. فعل را با ضمیر هماهنگ نگه دارید.",
[["He is my brother.","او برادر من است.",null,null],["It is a small cat.","آن گربه کوچکی است.",null,null],["We live near the park.","ما نزدیک پارک زندگی می‌کنیم.",null,null]],
[["Her is kind.","او مهربان است.","She is kind.","او مهربان است."]]],
["A1","articles","a, an, the","حروف تعریف",
"Use a/an for one new thing, the for a known thing.","برای یک چیز جدید از a و an و برای چیز شناخته‌شده از the استفاده کنید.",
"A book = any book. The book = the one we know. Use an before vowel sounds: an apple, an hour. No article for general plurals: Dogs are friendly.",
"a یعنی یکِ نامشخص؛ the یعنی همانِ مشخص. پیش از صدای واکه an می‌آید. برای جمع‌های کلی حرف تعریف نمی‌آید.",
[["I see a bird.","پرنده‌ای می‌بینم.",null,null],["The bird is red.","پرنده قرمز است.","known now","حالا مشخص است."],["She is an engineer.","او مهندس است.",null,null]],
[["I need a apple.","یک سیب لازم دارم.","I need an apple.","یک سیب لازم دارم."]]],
["A1","plurals","Plural nouns","اسم‌های جمع",
"Make most nouns plural with -s or -es.","بیشتر اسم‌ها را با s- یا es- جمع ببندید.",
"Book → books, bus → buses, baby → babies, man → men. Some plurals are irregular: child → children, foot → feet. Learn the common ones by heart.",
"کتاب‌ها، اتوبوس‌ها، بچه‌ها، مردها. بعضی جمع‌ها بی‌قاعده‌اند: children و feet و men. رایج‌ها را حفظ کنید.",
[["Two cats sit there.","دو گربه آنجا نشسته‌اند.",null,null],["The buses are red.","اتوبوس‌ها قرمزند.",null,null],["Three men work here.","سه مرد اینجا کار می‌کنند.","irregular","بی‌قاعده."]],
[["Two childs play here.","دو بچه اینجا بازی می‌کنند.","Two children play here.","دو بچه اینجا بازی می‌کنند."]]],
["A1","demonstratives","this, that, these, those","اشاره‌ها",
"Point at near and far things.","به چیزهای نزدیک و دور اشاره کنید.",
"This (near, one), that (far, one), these (near, many), those (far, many). This is my pen. Those are my books over there.",
"this نزدیک مفرد، that دور مفرد، these نزدیک جمع و those دور جمع. این خودکار من است. آن‌ها آنجا کتاب‌های من‌اند.",
[["This is my bag.","این کیف من است.",null,null],["That house is old.","آن خانه قدیمی است.",null,null],["These apples are sweet.","این سیب‌ها شیرین‌اند.",null,null]],
[["This books are mine.","این کتاب‌ها مال من است.","These books are mine.","این کتاب‌ها مال من است."]]],
["A1","there-is-are","there is / there are","there is و there are",
"Say what exists in a place.","بگویید در جایی چه چیزی وجود دارد.",
"There is a lamp (one). There are two chairs (many). Questions: Is there a bank near here? Negatives: There isn't any milk.",
"برای مفرد there is و برای جمع there are. سؤال با Is there و منفی با There isn't ساخته می‌شود.",
[["There is a park near us.","نزدیک ما پارکی هست.",null,null],["There are three rooms.","سه اتاق هست.",null,null],["There isn't any sugar.","شکری نیست.",null,null]],
[["There is two beds.","دو تخت هست.","There are two beds.","دو تخت هست."]]],
["A1","present-simple","Present simple","حال ساده",
"Describe routines, facts, and habits.","کارهای روزمره، واقعیت‌ها و عادت‌ها را توصیف کنید.",
"I work, you work, he works. Add -s for he/she/it. Negatives use don't/doesn't: She doesn't like tea. Questions use do/does: Do you work here?",
"برای سوم‌شخص مفرد s- اضافه می‌شود. منفی با don't و doesn't و سؤال با do و does ساخته می‌شود.",
[["She works in a shop.","او در مغازه‌ای کار می‌کند.",null,null],["They don't eat meat.","آن‌ها گوشت نمی‌خورند.",null,null],["Does he study English?","آیا او انگلیسی می‌خواند؟",null,null]],
[["He go to school.","او به مدرسه می‌رود.","He goes to school.","او به مدرسه می‌رود."]]],
["A1","can-ability","can for ability","can برای توانایی",
"Say what you can and can't do.","بگویید چه کاری می‌توانید و نمی‌توانید بکنید.",
"I can swim. She can't drive. Can you help me? After can, use the base verb with no to and no -s.",
"من می‌توانم شنا کنم. او نمی‌تواند رانندگی کند. پس از can فعل ساده بدون to و بدون s- می‌آید.",
[["I can cook rice.","می‌توانم برنج بپزم.",null,null],["They can't come today.","امروز نمی‌توانند بیایند.",null,null],["Can you swim?","می‌توانی شنا کنی؟",null,null]],
[["She can to read.","او می‌تواند بخواند.","She can read.","او می‌تواند بخواند."]]],
["A2","past-simple","Past simple","گذشته ساده",
"Talk about finished past actions.","درباره کارهای تمام‌شده گذشته حرف بزنید.",
"Regular verbs add -ed: visited, watched. Irregular verbs change: went, ate, saw. Time words: yesterday, last night, two days ago.",
"فعل‌های باقاعده ed- می‌گیرند. فعل‌های بی‌قاعده عوض می‌شوند: went و ate و saw. قیدهای زمان: دیروز، دیشب و دو روز پیش.",
[["We visited our uncle yesterday.","دیروز به عمویمان سر زدیم.",null,null],["She ate lunch at noon.","ظهر ناهار خورد.",null,null],["They didn't watch TV.","تلویزیون تماشا نکردند.",null,null]],
[["I goed home.","به خانه رفتم.","I went home.","به خانه رفتم."]]],
["A2","going-to","going to for plans","going to برای برنامه",
"Talk about decided future plans.","درباره برنامه‌های قطعی آینده حرف بزنید.",
"be + going to + verb: I am going to travel. Use it for plans you already decided. Negative: We aren't going to stay.",
"الگو: be و going to و فعل. برای برنامه‌ای که قبلاً تصمیمش گرفته شده است. منفی: We aren't going to stay.",
[["I am going to study tonight.","امشب می‌خواهم درس بخوانم.",null,null],["It is going to rain.","می‌خواهد باران ببارد.","prediction","پیش‌بینی."],["Are you going to come?","می‌آیی؟",null,null]],
[["I going to travel.","می‌خواهم سفر کنم.","I am going to travel.","می‌خواهم سفر کنم."]]],
["A2","will-future","will for promises","will برای قول",
"Promise, offer, and decide quickly with will.","با will قول بدهید، پیشنهاد کنید و سریع تصمیم بگیرید.",
"I will help you. I promise I will call. Use will for decisions made now, not old plans. Short form: I'll, she'll.",
"قول می‌دهم کمکت کنم. برای تصمیم‌های لحظه‌ای از will استفاده می‌شود، نه برنامه‌های قدیمی. شکل کوتاه: I'll.",
[["I will carry your bag.","کیفت را حمل می‌کنم.","offer","پیشنهاد."],["We will be late!","دیر می‌کنیم!",null,null],["She won't forget.","فراموش نمی‌کند.",null,null]],
[["I will to help.","کمک می‌کنم.","I will help.","کمک می‌کنم."]]],
["A2","comparatives","Comparatives","صفت تفضیلی",
"Compare two things with -er and more.","دو چیز را با er- و more مقایسه کنید.",
"Cheap → cheaper than, expensive → more expensive than, good → better than. Always use than after the comparative.",
"ارزان‌تر از، گران‌تر از و بهتر از. پس از صفت تفضیلی همیشه than می‌آید.",
[["Trains are faster than buses.","قطارها از اتوبوس‌ها سریع‌ترند.",null,null],["This book is more interesting.","این کتاب جذاب‌تر است.",null,null],["Today is better than yesterday.","امروز از دیروز بهتر است.",null,null]],
[["She is taller that me.","او از من قدبلندتر است.","She is taller than me.","او از من قدبلندتر است."]]],
["A2","superlatives","Superlatives","صفت عالی",
"Pick the extreme with the -est and most.","با the و est- و most برترین را انتخاب کنید.",
"The tallest, the most beautiful, the best. Superlatives almost always need the. In groups: the tallest student in class.",
"قدبلندترین، زیباترین و بهترین. صفت عالی تقریباً همیشه the می‌خواهد.",
[["This is the best cafe here.","این بهترین کافه اینجاست.",null,null],["February is the shortest month.","فوریه کوتاه‌ترین ماه است.",null,null],["She is the most careful driver.","او مراقب‌ترین راننده است.",null,null]],
[["He is tallest boy.","او قدبلندترین پسر است.","He is the tallest boy.","او قدبلندترین پسر است."]]],
["A2","countable-uncountable","Countable and uncountable","قابل‌شمارش و غیرقابل‌شمارش",
"Use much/many, some/any, and a few/a little correctly.","much و many و some و any و a few و a little را درست به کار ببرید.",
"Countable: apples → many apples, a few apples. Uncountable: milk → much milk, a little milk. Advice, money, and news are uncountable.",
"قابل‌شمارش: many و a few. غیرقابل‌شمارش: much و a little. advice و money و news غیرقابل‌شمارش‌اند.",
[["How many eggs do we need?","چند تخم‌مرغ لازم داریم؟",null,null],["There is a little sugar left.","کمی شکر مانده است.",null,null],["She gave me good advice.","نصیحت خوبی به من کرد.","uncountable","غیرقابل‌شمارش."]],
[["I have many luggages.","چمدان‌های زیادی دارم.","I have a lot of luggage.","بار زیادی دارم."]]],
["A2","present-continuous","Present continuous","حال استمراری",
"Describe actions happening now.","کنش‌های در حال وقوع را توصیف کنید.",
"be + verb-ing: She is cooking now. Use it for now and for fixed plans: We are meeting at six. Time words: now, at the moment.",
"الگو: be + فعل با ing-. برای «الان» و برنامه‌های قطعی نزدیک. قیدها: now و at the moment.",
[["I am studying English now.","الان دارم انگلیسی می‌خوانم.",null,null],["They are playing football.","دارند فوتبال بازی می‌کنند.",null,null],["We are meeting them tonight.","امشب آن‌ها را می‌بینیم.","fixed plan","برنامه قطعی."]],
[["She cooking now.","الان آشپزی می‌کند.","She is cooking now.","الان آشپزی می‌کند."]]],
["A2","first-conditional","First conditional","شرطی نوع اول",
"Talk about real future results.","درباره نتایج واقعی آینده حرف بزنید.",
"If + present, will + verb: If it rains, we will stay home. The if-part uses present, never will. Use it for real possibilities.",
"الگو: If + حال، will + فعل. در بند if از will استفاده نمی‌شود. برای احتمال‌های واقعی.",
[["If you study, you will pass.","اگر درس بخوانی قبول می‌شوی.",null,null],["We will swim if it is sunny.","اگر آفتابی باشد شنا می‌کنیم.",null,null],["If she calls, tell her I am busy.","اگر زنگ زد بگو سرم شلوغ است.",null,null]],
[["If it will rain, we stay.","اگر باران ببارد می‌مانیم.","If it rains, we will stay.","اگر باران ببارد می‌مانیم."]]],
["B1","present-perfect","Present perfect","حال کامل",
"Connect past actions to the present.","کنش‌های گذشته را به حال وصل کنید.",
"have/has + participle: I have finished. Use it for experiences (Have you ever …?), recent news (She has just left), and unfinished time (I have lived here for years).",
"الگو: have/has + اسم مفعول. برای تجربه‌ها، خبرهای تازه و زمان‌های ناتمام. با قیدهای گذشته مشخص (yesterday) نمی‌آید.",
[["I have visited three countries.","سه کشور دیده‌ام.",null,null],["She has just arrived.","تازه رسیده است.",null,null],["We have known them since 2020.","از ۲۰۲۰ آن‌ها را می‌شناسیم.",null,null]],
[["I have seen him yesterday.","دیروز او را دیدم.","I saw him yesterday.","دیروز او را دیدم."]]],
["B1","past-perfect","Past perfect","گذشته کامل",
"Show which past event happened first.","نشان دهید کدام رویداد گذشته زودتر بوده است.",
"had + participle: When I arrived, they had left. The past perfect marks the earlier event. Common with already, just, never.",
"الگو: had + اسم مفعول. رویداد زودتر را مشخص می‌کند. رایج با already و just و never.",
[["The train had left before we came.","قطار پیش از آمدن ما رفته بود.",null,null],["She had never seen snow.","هیچ‌وقت برف ندیده بود.",null,null],["I was hungry because I had skipped lunch.","گرسنه بودم چون ناهار را رد کرده بودم.",null,null]],
[["After I had ate, I left.","پس از خوردن رفتم.","After I had eaten, I left.","پس از خوردن رفتم."]]],
["B1","passives-intro","Passive voice","جمله مجهول",
"Focus on the action, not the actor.","بر کنش تمرکز کنید، نه کننده.",
"be + participle: The room is cleaned daily. Use passives when the actor is unknown, obvious, or unimportant. Keep the tense in be.",
"الگو: be + اسم مفعول. وقتی کننده نامشخص یا بی‌اهمیت است. زمان در be می‌ماند.",
[["The bridge was built in 1990.","پل در ۱۹۹۰ ساخته شد.",null,null],["The files are checked weekly.","فایل‌ها هفتگی بررسی می‌شوند.",null,null],["He was invited to speak.","برای سخنرانی دعوت شد.",null,null]],
[["The cake baked yesterday.","کیک دیروز پخته شد.","The cake was baked yesterday.","کیک دیروز پخته شد."]]],
["B1","reported-speech-intro","Reported speech","نقل غیرمستقیم",
"Report what people said.","بگویید مردم چه گفتند.",
"She said she was tired. He told me to wait. Backshift tenses: present → past, will → would. Said needs no object; told needs one.",
"او گفت خسته است. او به من گفت صبر کنم. زمان‌ها یک پله عقب می‌روند. said مفعول نمی‌خواهد؛ told می‌خواهد.",
[["He said the shop was closed.","او گفت مغازه بسته است.",null,null],["She told us to sit down.","به ما گفت بنشینیم.",null,null],["They said they would help.","گفتند کمک می‌کنند.",null,null]],
[["She said me she was ill.","او به من گفت مریض است.","She told me she was ill.","او به من گفت مریض است."]]],
["B1","relative-clauses","Relative clauses","جمله‌های موصولی",
"Define people and things with who/which/that.","آدم‌ها و چیزها را با who و which و that تعریف کنید.",
"A nurse is someone who cares for patients. Use who for people, which for things, that for both. Where defines places.",
"پرستار کسی است که از بیماران مراقبت می‌کند. who برای آدم، which برای چیز و that برای هر دو. where برای مکان.",
[["The man who called is my uncle.","مردی که زنگ زد عموی من است.",null,null],["This is the book that I love.","این کتابی است که دوست دارم.",null,null],["Isfahan is where I was born.","اصفهان جایی است که در آن به دنیا آمدم.",null,null]],
[["The girl which sings is Sara.","دختری که می‌خواند ساراست.","The girl who sings is Sara.","دختری که می‌خواند ساراست."]]],
["B1","gerunds-infinitives","Gerunds and infinitives","اسم مصدر و مصدر",
"Choose verb + -ing or verb + to correctly.","فعل با ing- یا با to را درست انتخاب کنید.",
"Enjoy, finish, mind → -ing. Want, decide, plan → to. Like/love/hate take both with little change. Stop to (purpose) vs stop -ing (quit).",
"enjoy و finish با ing-؛ want و decide با to. stop to یعنی ایستادن برای کاری؛ stop doing یعنی ترک کاری.",
[["I enjoy reading at night.","از خواندن در شب لذت می‌برم.",null,null],["We decided to leave early.","تصمیم گرفتیم زود برویم.",null,null],["He stopped to drink water.","ایستاد تا آب بنوشد.","purpose","هدف."]],
[["I want going home.","می‌خواهم به خانه بروم.","I want to go home.","می‌خواهم به خانه بروم."]]],
["B1","modals-probability","Modals of probability","وجهی‌های احتمال",
"Deduce with must, might, and can't.","با must و might و can't حدس بزنید.",
"Must = sure true. Might = possible. Can't = sure false. Add have + participle for the past: She must have forgotten.",
"must یعنی حتماً درست؛ might یعنی شاید؛ can't یعنی حتماً غلط. برای گذشته: must have + اسم مفعول.",
[["She must be tired after that trip.","پس از آن سفر حتماً خسته است.",null,null],["It might rain tonight.","امشب شاید باران ببارد.",null,null],["He can't have said that!","محال چنین چیزی گفته باشد!",null,null]],
[["She must to be ill.","حتماً مریض است.","She must be ill.","حتماً مریض است."]]],
["B1","second-conditional","Second conditional","شرطی نوع دوم",
"Dream about unreal present and future.","درباره حال و آینده غیرواقعی رؤیا ببافید.",
"If + past, would + verb: If I had time, I would travel. Use were for all persons in dreams: If I were rich … Polite wishes live here too.",
"الگو: If + گذشته، would + فعل. در آرزوها برای همه was همان were است.",
[["If I knew the answer, I would tell you.","اگر جواب را می‌دانستم می‌گفتم.",null,null],["We would buy it if it were cheaper.","اگر ارزان‌تر بود می‌خریدیم.",null,null],["If she studied, she would pass.","اگر درس می‌خواند قبول می‌شد.",null,null]],
[["If I would have money, I travel.","اگر پول داشتم سفر می‌کنم.","If I had money, I would travel.","اگر پول داشتم سفر می‌کردم."]]],
["B2","third-conditional","Third conditional","شرطی نوع سوم",
"Regret and replay the past.","درباره گذشته افسوس بخورید و بازبینی کنید.",
"If + past perfect, would have + participle: If we had left earlier, we would have caught the train. Mixed: past cause, present result.",
"الگو: If + گذشته کامل، would have + اسم مفعول. ترکیبی: علت گذشته و نتیجه حال.",
[["If you had called, I would have helped.","اگر زنگ زده بودی کمک می‌کردم.",null,null],["We would have won if he had played.","اگر او بازی کرده بود می‌بردیم.",null,null],["If I had slept, I would be fresh now.","اگر خوابیده بودم حالا سرحال بودم.","mixed","ترکیبی."]],
[["If I had known, I would helped.","اگر می‌دانستم کمک می‌کردم.","If I had known, I would have helped.","اگر می‌دانستم کمک می‌کردم."]]],
["B2","passives-advanced","Advanced passives","مجهول پیشرفته",
"Control passives across tenses and modals.","مجهول را در زمان‌ها و وجهی‌ها کنترل کنید.",
"Is being built, has been sold, will be opened, should be checked, is said to be rich. Passive infinitives and gerunds: to be invited, being watched.",
"در حال ساخته شدن، فروخته شده، باز خواهد شد و باید بررسی شود. مصدر و اسم مصدر مجهول هم همین الگو را دارند.",
[["The road is being repaired.","جاده در حال تعمیر است.",null,null],["The prize has been won twice.","جایزه دوبار برده شده است.",null,null],["He is said to be abroad.","گفته می‌شود خارج است.",null,null]],
[["The work has finished.","کار تمام شده است.","The work has been finished.","کار تمام شده است."]]],
["B2","reported-speech-advanced","Advanced reporting","گزارش پیشرفته",
"Report with precise verbs and patterns.","با افعال و الگوهای دقیق گزارش دهید.",
"Suggest + -ing/that, insist on + -ing, deny + -ing, promise + to. She denied taking it. He insisted on paying. Verbs carry judgment: admit vs confess.",
"suggest و deny با ing-؛ promise با to. insist on با ing-. فعل گزارش بار داوری دارد.",
[["She suggested meeting at noon.","پیشنهاد داد ظهر دیدار کنیم.",null,null],["He denied breaking the glass.","شکستن لیوان را انکار کرد.",null,null],["They promised to finish today.","قول دادند امروز تمام کنند.",null,null]],
[["He suggested to go.","پیشنهاد رفتن داد.","He suggested going.","پیشنهاد رفتن داد."]]],
["B2","modal-perfects","Modal perfects","ماضی وجهی",
"Critique the past with should/must/might have.","گذشته را با should و must و might have نقد کنید.",
"Should have called (regret). Must have forgotten (sure). Might have missed (possible). Form: modal + have + participle, never *have went.",
"باید زنگ می‌زدی (افسوس). حتماً فراموش کرده (اطمینان). شاید از دست داده (احتمال). شکل: وجهی + have + اسم مفعول.",
[["You should have told me!","باید به من می‌گفتی!",null,null],["The delay must have annoyed them.","تأخیر حتماً اذیتشان کرده است.",null,null],["She might have taken the wrong bus.","شاید سوار اتوبوس اشتباه شده است.",null,null]],
[["You should had studied.","باید درس می‌خواندی.","You should have studied.","باید درس می‌خواندی."]]],
["B2","cleft-sentences","Cleft sentences","جمله‌های شکافته",
"Stress key information with clefts.","اطلاعات کلیدی را با شکافته برجسته کنید.",
"It is the driver who decides. What we need is time. All I want is honesty. Clefts front-focus the crucial noun or clause.",
"این راننده است که تصمیم می‌گیرد. آنچه لازم داریم وقت است. شکافته اسم یا بند حیاتی را جلو می‌آورد.",
[["It was Sara who found the keys.","سارا بود که کلیدها را پیدا کرد.",null,null],["What matters most is trust.","مهم‌ترین چیز اعتماد است.",null,null],["All they need is water.","تنها چیزی که لازم دارند آب است.",null,null]],
[["It is me who did it.","من بودم که کردم.","It was I who did it / It was me who did it.","من بودم که کردم."]]],
["B2","participle-clauses","Participle clauses","بندهای وصفی",
"Write concisely with -ing and -ed clauses.","با بندهای ing- و ed- فشرده بنویسید.",
"Having finished, we left. Built in 1900, the school still stands. The subject of both clauses must match — avoid dangling participles.",
"پس از اتمام رفتیم. فاعل هر دو بند باید یکی باشد — از وصفی آویزان پرهیز کنید.",
[["Walking home, I met an old friend.","در راه خانه دوست قدیمی دیدم.",null,null],["Compared to last year, sales doubled.","نسبت به پارسال فروش دو برابر شد.",null,null],["Having lost the map, they asked a farmer.","چون نقشه را گم کرده بودند از کشاورزی پرسیدند.",null,null]],
[["Walking home, the rain started.","در راه خانه باران شروع شد.","While I was walking home, the rain started.","وقتی به خانه می‌رفتم باران شروع شد."]]],
["B2","inversion-intro","Inversion","وارونگی",
"Add drama with inverted word order.","با ترتیب وارونه به جمله درام بدهید.",
"After negatives: Rarely have I seen this. Not only is it cheap, but it's good. Questions already invert; statements invert for effect.",
"پس از قیدهای منفی: به‌ندرت چنین دیده‌ام. نه‌تنها ارزان است بلکه خوب است. در جمله خبری، وارونگی برای تأکید است.",
[["Never have I heard such a story.","هرگز چنین داستانی نشنیده‌ام.",null,null],["Not only did he win, he broke the record.","نه‌تنها برد بلکه رکورد را شکست.",null,null],["Only then did she smile.","فقط آنگاه لبخند زد.",null,null]],
[["Never I have seen it.","هرگز آن را ندیده‌ام.","Never have I seen it.","هرگز آن را ندیده‌ام."]]],
["B2","discourse-markers","Discourse markers","نشانگرهای گفتمان",
"Guide readers through your argument.","خواننده را در استدلال راهنمایی کنید.",
"Firstly, moreover, however, consequently, in contrast, to sum up. Position: sentence start or after the subject. Never stack three together.",
"نخست، علاوه بر این، اما، در نتیجه و خلاصه. جایگاه: اول جمله یا پس از فاعل. سه‌تایی روی هم نچینید.",
[["Firstly, costs would fall.","نخست، هزینه‌ها می‌افتد.",null,null],["The plan is risky; however, it may work.","برنامه پرریسک است؛ اما شاید جواب دهد.",null,null],["Consequently, we changed the date.","در نتیجه تاریخ را عوض کردیم.",null,null]],
[["However, the plan, moreover, failed.","اما، برنامه، علاوه بر این شکست خورد.","However, the plan failed.","اما برنامه شکست خورد."]]],
["C1","inversion-advanced","Advanced inversion","وارونگی پیشرفته",
"Master full and partial inversion.","وارونگی کامل و جزئی را مسلط شوید.",
"Full: Here comes the bus. Partial: Seldom does he complain. Conditionals: Had I known, I would have acted. Were she here, she'd agree.",
"کامل: اتوبوس می‌آید. جزئی: به‌ندرت شکایت می‌کند. شرطی: اگر می‌دانستم اقدام می‌کردم.",
[["Had we known, we would have stayed.","اگر می‌دانستیم می‌ماندیم.",null,null],["Seldom has a film moved me so.","به‌ندرت فیلمی چنین تکانم داده است.",null,null],["Here comes the winner!","برنده می‌آید!",null,null]],
[["Had I knew, I acted.","اگر می‌دانستم اقدام می‌کردم.","Had I known, I would have acted.","اگر می‌دانستم اقدام می‌کردم."]]],
["C1","ellipsis-substitution","Ellipsis and substitution","حذف و جایگزینی",
"Cohere without repeating: one, do, so.","بدون تکرار انسجام بسازید: one و do و so.",
"Take the red pen; the blue one leaks. She sings better than he does. Some agree; others don't. So replaces whole clauses: I think so.",
"خودکار قرمز را بردار؛ آبیِه نشت می‌کند. او بهتر از او می‌خواند. بعضی موافق‌اند؛ بعضی نه.",
[["I want the small box, not the big one.","جعبه کوچک را می‌خواهم نه بزرگه را.",null,null],["He works harder than I do.","سخت‌تر از من کار می‌کند.",null,null],["Will it rain? I hope not.","باران می‌بارد؟ امیدوارم نه.",null,null]],
[["I like the red, not the blue pen one.","قرمز را دوست دارم نه آبی را.","I like the red pen, not the blue one.","خودکار قرمز را دوست دارم نه آبی را."]]],
["C1","nominalisation","Nominalisation","اسم‌سازی",
"Condense actions into academic nouns.","کنش‌ها را به اسم‌های آکادمیک فشرده کنید.",
"Decide → decision, develop → development, fail → failure. Nominal style packs clauses: The decision to expand followed rapid development.",
"تصمیم، توسعه و شکست. سبک اسمی بندها را فشرده می‌کند. در نگارش آکادمیک پرکاربرد است.",
[["The construction lasted two years.","ساخت دو سال طول کشید.",null,null],["Her resignation surprised all.","استعفایش همه را شگفت‌زده کرد.",null,null],["Pollution threatens irreversible damage.","آلودگی آسیب برگشت‌ناپذیر می‌زند.",null,null]],
[["The fail of the plan was sad.","شکست برنامه ناراحت‌کننده بود.","The failure of the plan was sad.","شکست برنامه ناراحت‌کننده بود."]]],
["C1","fronting-emphasis","Fronting and emphasis","پیش‌گذاری و تأکید",
"Spotlight ideas by fronting them.","با جلو آوردن، ایده‌ها را در کانون بگذارید.",
"Most urgent is the water crisis. This point I cannot accept. Gone are the days of cheap oil. Fronted objects and complements need no inversion.",
"فوری‌ترین، بحران آب است. این نکته را نمی‌توانم بپذیرم. پیش‌گذاری مفعول و مسند وارونگی نمی‌خواهد.",
[["Equally vital is trust.","به‌همان‌اندازه حیاتی، اعتماد است.",null,null],["That excuse I have heard before.","آن بهانه را قبلاً شنیده‌ام.",null,null],["Happy they were, despite the loss.","با وجود باخت خوشحال بودند.",null,null]],
[["Most important is, the cost the issue.","مهم‌ترین، مسئله هزینه است.","Most important is the cost.","مهم‌ترین، هزینه است."]]],
["C1","advanced-modality","Advanced modality","وجهیت پیشرفته",
"Fine-tune certainty with semi-modals.","قطعیت را با شبه‌وجهی‌ها تنظیم کنید.",
"Bound to, liable to, apt to, sure to. Drivers are liable to speed here. The talks are bound to continue. Shades between will and might.",
"حتماً، مستعد و مایل. راننده‌ها اینجا مستعد سرعت‌اند. مذاکرات حتماً ادامه می‌یابد. سایه‌های میان will و might.",
[["Glass is apt to break in frost.","شیشه در یخبندان مستعد شکستن است.",null,null],["She is sure to win.","حتماً می‌برد.",null,null],["Costs are bound to rise.","هزینه‌ها حتماً بالا می‌روند.",null,null]],
[["It bound to rain.","حتماً باران می‌بارد.","It is bound to rain.","حتماً باران می‌بارد."]]],
["C1","complex-clauses","Complex clauses","بندهای پیچیده",
"Layer subordinate clauses with control.","بندهای پیرو را با کنترل لایه‌لایه کنید.",
"Although, whereas, insofar as, lest, albeit. Although rich, which few deny, he lives simply. One main idea per sentence still rules.",
"هرچند، در حالی که و تا حدی که. هرچند ثروتمند است — که کمتر کسی انکار می‌کند — ساده زندگی می‌کند.",
[["Whereas cities grow, villages shrink.","در حالی که شهرها رشد می‌کنند، روستاها کوچک می‌شوند.",null,null],["He saved, lest prices rise.","پس‌انداز کرد، مبادا قیمت‌ها بالا برود.",null,null],["Tired albeit happy, they marched on.","خسته اما خوشحال، پیش رفتند.",null,null]],
[["Although it was late, but we stayed.","هرچند دیر بود ولی ماندیم.","Although it was late, we stayed.","هرچند دیر بود ماندیم."]]],
["C1","register-control","Register control","کنترل سبک",
"Hold formal, neutral, informal steady.","رسمی، خنثی و غیررسمی را ثابت نگه دارید.",
"Get → obtain → grab. Buy → purchase → pick up. Contractions, address forms, and lexis must agree: Dear Sir never meets gonna.",
"گرفتن در سه سبک. مخفف‌ها، خطاب و واژگان باید هماهنگ باشند.",
[["Kindly confirm receipt of this letter.","لطفاً دریافت این نامه را تأیید کنید.","formal","رسمی."],["Thanks for getting back to me!","ممنون که جواب دادی!","neutral","خنثی."],["Wanna grab lunch?","ناهار می‌خوری؟","informal","غیررسمی."]],
[["Dear Sir, gonna send the docs.","جناب، مدارک را می‌فرستم.","Dear Sir, I will send the documents.","جناب، مدارک را ارسال می‌کنم."]]],
["C1","reporting-advanced","Advanced reporting structures","ساختارهای گزارش پیشرفته",
"Distance claims with passive reporting.","ادعاها را با گزارش مجهول دور کنید.",
"It is said that …, He is believed to be …, There are reported to be …. Choose distance for rumours, closeness for facts you own.",
"گفته می‌شود که …، باور می‌رود که … برای شایعه فاصله بگیرید و برای واقعیتِ خودتان نزدیک شوید.",
[["It is expected that prices will fall.","انتظار می‌رود قیمت‌ها بیفتد.",null,null],["She is thought to have left.","باور می‌رود رفته باشد.",null,null],["There are said to be delays.","گفته می‌شود تأخیرهایی هست.",null,null]],
[["It is said that he is go.","گفته می‌شود می‌رود.","It is said that he is going.","گفته می‌شود می‌رود."]]],
["C2","hedging-boosting","Hedging and boosting","احتیاط و تقویت",
"Calibrate every claim's certainty.","قطعیت هر ادعا را تنظیم کنید.",
"Tends to, suggests, arguably (hedges). Clearly, undeniably, crucially (boosters). Mismatched certainty destroys credibility fastest.",
"تمایل دارد و نشان می‌دهد (احتیاط). آشکارا و بی‌تردید (تقویت). قطعیت نابه‌جا سریع‌ترین قاتل اعتبار است.",
[["The data tentatively suggests a link.","داده به‌طور آزمایشی پیوندی نشان می‌دهد.",null,null],["Arguably, the policy backfired.","می‌توان گفت سیاست نتیجه معکوس داد.",null,null],["Undeniably, costs shape choices.","بی‌تردید هزینه‌ها انتخاب‌ها را می‌سازند.",null,null]],
[["It is proved that tea cures all.","ثابت شده چای همه‌چیز را درمان می‌کند.","Some evidence suggests tea may help.","شواهدی نشان می‌دهد چای شاید کمک کند."]]],
["C2","vague-precision","Vague language, precisely","زبان مبهم، دقیق",
"Be precisely vague about uncertainty.","درباره عدم‌قطعیت، دقیقاً مبهم باشید.",
"Sort of, kind of, -ish, or so, roughly. I'll be twentyish minutes. Vagueness signals honesty about estimates — master it, don't fear it.",
"تقریباً و حدوداً. بیست دقیقه‌ای دیر می‌رسم. ابهام صداقت درباره تخمین را نشان می‌دهد.",
[["It costs fifty or so dollars.","حدود پنجاه دلار می‌شود.",null,null],["She seemed sort of upset.","یک‌جورهایی ناراحت به نظر می‌رسید.",null,null],["We need roughly two weeks.","حدود دو هفته لازم داریم.",null,null]],
[["It costs exactly about fifty.","دقیقاً حدود پنجاه می‌شود.","It costs about fifty.","حدود پنجاه می‌شود."]]],
["C2","coherence-cohesion","Coherence and cohesion","انسجام معنایی و لفظی",
"Architect paragraph flow.","جریان پاراگراف را معماری کنید.",
"Old-to-new information, thematic chains, metadiscourse. This decision, such failures, the former. Cohesion devices must point clearly.",
"جریان کهنه‌به‌نو، زنجیره موضوعی و فراگفتمان. ابزارهای انسجام باید روشن اشاره کنند.",
[["This decision, though costly, proved wise.","این تصمیم، هرچند پرهزینه، خردمندانه از آب درآمد.",null,null],["Such failures demand honest review.","چنین شکست‌هایی بازبینی صادانه می‌طلبد.",null,null],["The former rose; the latter fell.","اولی بالا رفت؛ دومی افتاد.",null,null]],
[["This is bad. This shows this.","این بد است. این این را نشان می‌دهد.","This delay is costly. It shows poor planning.","این تأخیر پرهزینه است و برنامه‌ریزی ضعیف را نشان می‌دهد."]]],
["C2","register-shifting","Register shifting","جابه‌جایی سبک",
"Shift register mid-text deliberately.","وسط متن آگاهانه سبک را عوض کنید.",
"Technically …, in plain terms …, to put it bluntly …. Masters shift for punch; amateurs drift by accident. Always frame the shift.",
"از نظر فنی …، به زبان ساده …، رک بگویم … استاد برای اثر عوض می‌کند؛ آماتور تصادفی سر می‌خورد.",
[["Revenue fell 8%; in plain terms, we bled.","درآمد ۸ درصد افتاد؛ به زبان ساده، خونریزی کردیم.",null,null],["Technically, it compiled; bluntly, it limps.","فنی که بگویی اجرا شد؛ رک بگویم می‌لنگد.",null,null],["Formally, the motion passed; frankly, few cared.","رسمی که بگویی تصویب شد؛ راستش کمتر کسی اهمیت داد.",null,null]],
[["The data kinda suggests stuff. Moreover furthermore thus.","داده یه‌جورایی چیزایی نشون میده. علاوه بر این افزون بر آن پس.","The data hints at a pattern; moreover, it persists.","داده الگویی را نشان می‌دهد؛ علاوه بر این، ماندگار است."]]],
["C2","idiomatic-syntax","Idiomatic syntax","نحو اصطلاحی",
"Command the idioms of advanced moves.","اصطلاح‌های حرکت پیشرفته را فرمان دهید.",
"Far from + -ing, Little did + inversion, Not so much X as Y. Far from helping, it hindered. Little did we know the cost.",
"نه‌تنها کمک نکرد بلکه مانع شد. کمتر می‌دانستیم هزینه چقدر است. نه آن‌قدر X که Y.",
[["Far from solving it, they hid it.","نه‌تنها حلش نکردند بلکه پنهانش کردند.",null,null],["Not so much rude as rushed.","نه آن‌قدر بی‌ادب که عجول.",null,null],["Little did she suspect the truth.","کمتر حقیقت را حدس می‌زد.",null,null]],
[["Far from he helped, it worsened.","نه‌تنها کمک نکرد بدتر شد.","Far from helping, things worsened.","نه‌تنها کمک نکرد، اوضاع بدتر شد."]]],
["C2","rhetorical-grammar","Rhetorical grammar","گرامر بلاغی",
"Shape sentences for persuasive rhythm.","جمله‌ها را برای ریتم اقناعی شکل دهید.",
"Parallelism, tricolon, antithesis, anaphora. We plan, we build, we deliver. Not louder arguments — better-shaped ones.",
"توازی، سه‌گانه، تضاد و تکرار آغازین. برنامه می‌ریزیم، می‌سازیم و تحویل می‌دهیم.",
[["We teach, we heal, we endure.","می‌آموزیم، درمان می‌کنیم و می‌مانیم.",null,null],["Not because it is easy, but because it matters.","نه چون آسان است، بلکه چون مهم است.",null,null],["Ask what it costs; ask what it saves; ask what it means.","بپرس چه هزینه‌ای دارد؛ بپرس چه چیزی نجات می‌دهد؛ بپرس چه معنایی دارد.",null,null]],
[["We plan, building, and to deliver fastly quick.","برنامه می‌ریزیم، ساختن و تحویل سریع.","We plan, we build, we deliver.","برنامه می‌ریزیم، می‌سازیم و تحویل می‌دهیم."]]],
["C2","ambiguity-control","Ambiguity control","کنترل ابهام",
"Disambiguate like a professional.","مثل حرفه‌ای ابهام را رفع کنید.",
"By X I mean …, in the narrow/broad sense …, X, that is, …. Name your sense before readers guess wrong.",
"منظورم از X … است؛ به معنای مضیق/موسع … پیش از اینکه خواننده غلط حدس بزند، معنایت را نام ببر.",
[["By freedom I mean choice, not chaos.","منظورم از آزادی انتخاب است نه هرج‌ومرج.",null,null],["He supports reform, in the broad sense.","او از اصلاح به معنای موسع حمایت می‌کند.",null,null],["The model, that is, the small one, failed.","مدل — یعنی کوچک‌ه — شکست خورد.",null,null]],
[["Freedom is good and stuff generally.","آزادی کلاً خوب است و این‌ها.","Freedom, in the sense of free choice, matters.","آزادی، به معنای انتخاب آزاد، مهم است."]]],
["C2","stylistic-choice","Stylistic choice","انتخاب سبکی",
"Choose every sentence shape on purpose.","شکل هر جمله را عمداً انتخاب کنید.",
"Long or short, plain or rich, calm or urgent. Short sentences punch. Long ones flow. Variety conducts attention; monotony kills it.",
"بلند یا کوتاه، ساده یا غنی، آرام یا فوری. جمله کوتاه می‌کوبد؛ بلند جاری می‌شود. تنوع توجه را هدایت می‌کند.",
[["Rain. Silence. Then the bells.","باران. سکوت. بعد ناقوس‌ها.",null,null],["She spoke for an hour, weaving data, stories, and pleas into one unbroken thread.","یک ساعت حرف زد و داده و داستان و درخواست را در یک نخ ناگسسته بافت.",null,null],["Less, here, is more.","اینجا کمتر، بیشتر است.",null,null]],
[["Very very big important thing happened.","چیز خیلی خیلی بزرگ مهمی رخ داد.","A major event shook the city.","رویداد بزرگی شهر را تکان داد."]]],
];

/* ============================ READING (24) ============================== */
/* Row: [level, slugSuffix, isStory, titleEn, titleFa, summaryEn, summaryFa, minutes,
 *       [[headEn|null, headFa|null, [[paraEn, paraFa], ...]], ...]]
 * All passages and stories are ORIGINAL SAYVA content. */

function buildReading(rows, lessonKeysByLevel) {
  const seenPerLevel = new Map();
  return rows.map(([level, suffix, isStory, titleEn, titleFa, sumEn, sumFa, minutes, sections], i) => {
    const lvl = String(level).toUpperCase();
    const slug = isStory ? `${lvl.toLowerCase()}-story-${suffix}` : `${lvl.toLowerCase()}-reading-${suffix}`;
    const n = seenPerLevel.get(lvl) ?? 0;
    seenPerLevel.set(lvl, n + 1);
    const lessonKeys = lessonKeysByLevel.get(lvl) || [];
    return {
      _key: slug,
      _level: lvl,
      _isStory: !!isStory,
      _lessonKey: lessonKeys.length ? lessonKeys[n % lessonKeys.length] : null,
      slug,
      title: L(titleFa, titleEn),
      summary: L(sumFa, sumEn),
      level: lvl,
      sections: sections.map(([headEn, headFa, paras]) => {
        const s = { paragraphs: paras.map(([pEn, pFa]) => L(pFa, pEn)) };
        if (headEn) s.heading = L(headFa, headEn);
        return s;
      }),
      estimatedDuration: minutes,
      order: i,
      status: "published",
    };
  });
}

const READING_ROWS = [
["A1","notice-community-board",false,"Community Board Notice","اطلاعیه تابلوی محله",
"A short notice about a neighbourhood clean-up day.","اطلاعیه کوتاهی درباره روز پاکسازی محله.",6,
[[null,null,[
["Clean-Up Day! On Saturday morning at 9, we clean our street. Please bring gloves and bags. Water and tea are free for helpers!","روز پاکسازی! شنبه صبح ساعت ۹ خیابانمان را تمیز می‌کنیم. لطفاً دستکش و کیسه بیاورید. آب و چای برای کمک‌کننده‌ها رایگان است!"],
["Where: Green Park gate. Who: everyone is welcome. Come with your family and friends!","کجا: درِ پارک سبز. چه کسی: همه خوش‌آمدند. با خانواده و دوستانتان بیایید!"]]]]],
["A1","profile-new-student",false,"A New Student","یک دانش‌آموز جدید",
"Arman introduces himself to his new class.","آرمان خودش را به کلاس جدید معرفی می‌کند.",6,
[[null,null,[
["Hello! My name is Arman. I am twelve years old. I am from Mashhad, but now I live here with my family.","سلام! نام من آرمان است. دوازده ساله‌ام. اهل مشهدم ولی حالا با خانواده‌ام اینجا زندگی می‌کنم."],
["I like football and books. My favourite subject is English. I am happy to meet you all!","فوتبال و کتاب دوست دارم. درس موردعلاقه‌ام انگلیسی است. از آشنایی با همه شما خوشحالم!"]]]]],
["A1","message-lunch-plan",false,"A Lunch Plan","برنامه ناهار",
"Two friends plan lunch by message.","دو دوست با پیام برای ناهار برنامه می‌چینند.",6,
[[null,null,[
["Hi Sara! Are you free on Friday? Let's eat lunch together. There is a new restaurant near the park.","سلام سارا! جمعه آزادی؟ بیا با هم ناهار بخوریم. نزدیک پارک رستوران جدیدی هست."],
["Hi Mina! Yes, I am free. What time? At one o'clock? Perfect! See you there. Don't be late!","سلام مینا! بله، آزادم. چه ساعتی؟ ساعت یک؟ عالی! آنجا می‌بینمت. دیر نکن!"]]]]],
["A1","description-my-street",false,"My Street","خیابان من",
"A simple description of a quiet street.","توصیف ساده یک خیابان آرام.",6,
[[null,null,[
["My street is small and quiet. There are ten houses and one shop. A big tree stands in the middle.","خیابان ما کوچک و آرام است. ده خانه و یک مغازه هست. درخت بزرگی وسطش ایستاده است."],
["In the morning, children walk to school. In the evening, neighbours drink tea and talk. I love my street!","صبح‌ها بچه‌ها به مدرسه می‌روند. عصرها همسایه‌ها چای می‌نوشند و حرف می‌زنند. خیابانم را دوست دارم!"]]]]],
["A2","missing-keys",true,"The Missing Keys","کلیدهای گم‌شده",
"Mina loses her keys and the whole building helps.","مینا کلیدهایش را گم می‌کند و کل ساختمان کمک می‌کند.",10,
[["A Bad Morning","یک صبح بد",[
["Mina woke up late on Monday. She dressed quickly, drank her tea fast, and ran to the door. But the keys were not there!","مینا دوشنبه دیر بیدار شد. سریع لباس پوشید، چایش را تند نوشید و به‌سوی در دوید. ولی کلیدها آنجا نبود!"],
["She looked in her bag. No keys. She looked under the bed. No keys. Oh no! The bus leaves in ten minutes!","در کیفش نگاه کرد. کلید نبود. زیر تخت را نگاه کرد. کلید نبود. اوه نه! اتوبوس ده دقیقه دیگر می‌رود!"]]],
["Good Neighbours","همسایه‌های خوب",[
["Mrs Ahmadi from upstairs heard Mina and came down. The children from number four came too. Everyone looked everywhere.","خانم احمدی از بالا صدای مینا را شنید و پایین آمد. بچه‌های واحد چهار هم آمدند. همه همه‌جا را گشتند."],
["At last, little Kian shouted: They are in the fridge! Mina laughed and laughed. The keys were cold but safe. She caught the bus just in time.","سرانجام کیان کوچولو فریاد زد: توی یخچال‌اند! مینا خندید و خندید. کلیدها سرد ولی سالم بودند. درست سر وقت به اتوبوس رسید."]]]]],
["A2","night-train",true,"The Night Train","قطار شبانه",
"Kian misses one train and finds a story on the next.","کیان یک قطار را از دست می‌دهد و در قطار بعدی داستانی پیدا می‌کند.",10,
[["The Wrong Platform","سکوی اشتباه",[
["Last winter, Kian travelled to visit his grandmother. He arrived at the station early, but he waited on the wrong platform. His train left without him!","زمستان گذشته کیان برای دیدن مادربزرگش سفر کرد. زود به ایستگاه رسید ولی در سکوی اشتباه منتظر ماند. قطارش بدون او رفت!"],
["The next train was at midnight. Kian bought hot milk and sat near the window. He felt sad and a little angry.","قطار بعدی نیمه‌شب بود. کیان شیر داغ خرید و کنار پنجره نشست. ناراحت و کمی عصبانی بود."]]],
["A Kind Stranger","غریبه مهربان",[
["An old man sat next to him. Where are you going, young man? he asked. To my grandmother, said Kian. The man smiled and told stories all night: of deserts, seas, and old bazaars.","پیرمردی کنارش نشست. کجا می‌روی جوان؟ پرسید. پیش مادربزرگم، گفت کیان. مرد لبخند زد و تمام شب داستان گفت: از کویرها، دریاها و بازارهای قدیمی."],
["At sunrise, Kian thanked him. Missing a train gave me a night of stories, he said. The old man laughed: Sometimes the wrong platform is the right one!","هنگام طلوع، کیان تشکر کرد. از دست دادن قطار شبی از داستان به من داد. پیرمرد خندید: گاهی سکوی اشتباه، همان سکوی درست است!"]]]]],
["A2","email-thank-you",false,"Thank-You Email","ایمیل تشکر",
"Dara thanks his host family after a weekend visit.","دارا پس از دیدار آخر هفته از خانواده میزبان تشکر می‌کند.",8,
[[null,null,[
["Dear Mr and Mrs Karimi, Thank you very much for the wonderful weekend. I enjoyed the food, the garden, and our long talks. Your home is warm and full of love.","آقای کریمی و خانم کریمی عزیز، برای آخر هفته فوق‌العاده خیلی ممنونم. از غذا، باغ و حرف‌های طولانیمان لذت بردم. خانه شما گرم و پر از محبت است."],
["I arrived home safely last night. Please thank Sara for the photos. I hope to see you all again soon. Best wishes, Dara.","دیشب سالم به خانه رسیدم. لطفاً از سارا بابت عکس‌ها تشکر کنید. امیدوارم به‌زودی دوباره همه شما را ببینم. با احترام، دارا."]]]]],
["A2","guide-city-weekend",false,"A Weekend in the City","آخر هفته‌ای در شهر",
"A simple guide: two days, five places, one happy traveller.","راهنمای ساده: دو روز، پنج مکان و یک مسافر خوشحال.",8,
[["Day One","روز اول",[
["Start at the old bazaar. Walk slowly, drink tea, and buy small gifts. For lunch, try the chicken restaurant on Flower Street — it is cheap and clean.","از بازار قدیمی شروع کنید. آرام قدم بزنید، چای بنوشید و هدیه‌های کوچک بخرید. برای ناهار رستوران مرغ خیابان گل را امتحان کنید — ارزان و تمیز است."],
["In the afternoon, visit the museum near the river. It closes at five, so don't be late!","عصر از موزه کنار رودخانه دیدن کنید. ساعت پنج می‌بندد، پس دیر نکنید!"]]],
["Day Two","روز دوم",[
["On Sunday morning, climb the hill park and see the whole city. Bring water and wear good shoes.","صبح یکشنبه به پارک تپه‌ای بروید و کل شهر را ببینید. آب بیاورید و کفش خوب بپوشید."],
["End your trip at the night market. Eat ice cream, listen to music, and take photos. You will leave with a full heart!","سفرتان را در بازار شبانه تمام کنید. بستنی بخورید، موسیقی گوش دهید و عکس بگیرید. با دلی پر می‌روید!"]]]]],
["B1","small-cafe",true,"The Small Cafe","کافه کوچک",
"A closed cafe reopens and changes a whole street.","کافه‌ای بسته دوباره باز می‌شود و کل خیابانی را عوض می‌کند.",14,
[["The Closed Door","درِ بسته",[
["For two years, the small cafe on Rose Street stayed closed. Its windows were dusty, and its sign hung sideways. People walked past without looking.","دو سال کافه کوچک خیابان رز بسته ماند. پنجره‌هایش خاکی بود و تابلو کج آویزان بود. مردم بدون نگاه از کنارش می‌گذشتند."],
["Then one spring morning, a young woman named Mahsa opened the door. She cleaned the windows, painted the sign blue, and put three small tables outside.","بعد یک صبح بهاری، زن جوانی به نام مهسا در را باز کرد. پنجره‌ها را تمیز کرد، تابلو را آبی کرد و سه میز کوچک بیرون گذاشت."]]],
["The Street Wakes Up","خیابان بیدار می‌شود",[
["At first, only curious neighbours came. They drank tea and told Mahsa their stories. She listened to every word and wrote the best stories on the wall.","اول فقط همسایه‌های کنجکاو آمدند. چای نوشیدند و داستانشان را به مهسا گفتند. او به هر واژه گوش داد و بهترین داستان‌ها را روی دیوار نوشت."],
["Soon the wall was full, and so was the cafe. Students came to study, old men came to play chess, and children came for hot milk. The small cafe had reopened — and with it, the whole street.","به‌زودی دیوار پر شد و کافه هم. دانشجوها برای درس آمدند، پیرمردها برای شطرنج و بچه‌ها برای شیر داغ. کافه کوچک دوباره باز شده بود — و با آن، کل خیابان."]]]]],
["B1","letter-never-sent",true,"The Letter Never Sent","نامه‌ای که هرگز فرستاده نشد",
"An old letter teaches a grandson about courage.","نامه‌ای قدیمی به نوه درباره شجاعت می‌آموزد.",14,
[["The Old Box","جعبه قدیمی",[
["When Arash cleaned his grandfather's room, he found a wooden box. Inside were photos, medals, and one yellow letter — written but never sent.","وقتی آرش اتاق پدربزرگش را تمیز می‌کرد، جعبه چوبی پیدا کرد. داخلش عکس، مدال و یک نامه زرد بود — نوشته‌شده ولی هرگز فرستاده‌نشده."],
["The letter was to an old friend. I was wrong, and I am sorry, it said. I have waited forty years to write this. Please forgive me.","نامه به دوست قدیمی بود. اشتباه کردم و متأسفم، نوشته بود. چهل سال صبر کردم تا این را بنویسم. لطفاً مرا ببخش."]]],
["Forty Years Late","چهل سال دیر",[
["Arash found the friend's address and travelled all day to deliver the letter himself. The old man read it slowly, then cried and smiled at once.","آرش آدرس دوست را پیدا کرد و تمام روز سفر کرد تا نامه را خودش برساند. پیرمرد آرام خواند، بعد هم گریه کرد و هم لبخند زد."],
["Your grandfather was always brave, he said. Just slow! Arash laughed, but he learned something: sorry is never too late — but sooner is better.","پدربزرگت همیشه شجاع بود، گفت. فقط کند! آرش خندید ولی چیزی یاد گرفت: ببخشید هیچ‌وقت دیر نیست — ولی زودتر بهتر است."]]]]],
["B1","work-from-home",false,"Working from Home","کار از خانه",
"Is the home office a dream or a trap? A balanced look.","آیا دفتر خانگی رؤیاست یا تله؟ نگاهی متوازن.",12,
[["The Dream","رؤیا",[
["No traffic, no rush, no ironed shirts. Millions now work from kitchen tables and spare rooms. They save time, eat better, and see their families more.","بدون ترافیک، بدون عجله و بدون پیراهن اتوکرده. میلیون‌ها نفر حالا از سر میز آشپزخانه کار می‌کنند. وقت ذخیره می‌کنند، بهتر می‌خورند و خانواده را بیشتر می‌بینند."],
["Companies save money on offices, and small cities grow as workers move back home. For many, this is the best change in decades.","شرکت‌ها در هزینه اداره صرفه‌جویی می‌کنند و شهرهای کوچک با برگشت کارگرها رشد می‌کنند. برای بسیاری این بهترین تغییر دهه‌هاست."]]],
["The Trap","تله",[
["But home has traps: the fridge calls, the sofa invites, and work never ends. Many feel lonely and work longer hours than before.","ولی خانه تله دارد: یخچال صدا می‌زند، مبل دعوت می‌کند و کار هرگز تمام نمی‌شود. بسیاری احساس تنهایی می‌کنند و بیشتر از قبل کار می‌کنند."],
["The answer is balance: fixed hours, a real desk, and walks outside. Home can be an office — but it must stay a home first.","جواب تعادل است: ساعت ثابت، میز واقعی و پیاده‌روی بیرون. خانه می‌تواند اداره باشد — ولی اول باید خانه بماند."]]]]],
["B1","film-review-long-road",false,"Film Review: The Long Road","نقد فیلم: جاده طولانی",
"A warm review of an invented road film.","نقد گرمی از یک فیلم جاده‌ای خیالی.",12,
[[null,null,[
["The Long Road tells a simple story: an old driver takes his granddaughter across the desert to see the sea. Nothing explodes, nobody is rich — and yet you cannot look away.","جاده طولانی داستان ساده‌ای می‌گوید: راننده پیری نوه‌اش را از کویر می‌برد تا دریا را ببیند. چیزی منفجر نمی‌شود و کسی ثروتمند نیست — ولی نمی‌توانی چشم برداری."],
["The acting is natural, the desert photography is stunning, and the music stays with you for days. The middle part is a little slow, but the ending is worth the wait.","بازی طبیعی، فیلم‌برداری کویر خیره‌کننده و موسیقی روزها با تو می‌ماند. بخش میانی کمی کند است ولی پایان ارزش انتظار را دارد."],
["Who should watch it? Anyone who loves quiet stories about family. Rating: four stars out of five. Take your grandfather — he will love it.","چه کسی ببیند؟ هر که داستان‌های آرام خانوادگی دوست دارد. امتیاز: چهار از پنج. پدربزرگت را ببر — عاشقش می‌شود."]]]]],
["B2","city-of-fog",true,"The City of Fog","شهر مه",
"A photographer learns to see her city anew.","عکاسی یاد می‌گیرد شهرش را از نو ببیند.",18,
[["Grey Days","روزهای خاکستری",[
["Narges hated the fog. Every autumn it swallowed her city: the bridges vanished, the mountains disappeared, and her photographs turned grey. She complained to everyone who listened.","نرگس از مه متنفر بود. هر پاییز شهرش را می‌بلعید: پل‌ها ناپدید می‌شدند، کوه‌ها گم می‌شدند و عکس‌هایش خاکستری می‌شد. به هر که گوش می‌داد شکایت می‌کرد."],
["One grey morning, her teacher said: Stop fighting the fog. Photograph it. Narges laughed — then picked up her camera and walked into the white streets.","یک صبح خاکستری معلمش گفت: با مه نجنگ. از آن عکس بگیر. نرگس خندید — بعد دوربینش را برداشت و وارد خیابان‌های سفید شد."]]],
["What Fog Reveals","آنچه مه آشکار می‌کند",[
["In the fog, she noticed what sun had hidden: an old man feeding birds no one saw, lovers whispering on an invisible bridge, a child chasing echoes.","در مه چیزهایی را دید که آفتاب پنهان کرده بود: پیرمردی که به پرنده‌های نادیده دانه می‌داد، عاشقانی که روی پل نامرئی پچ‌پچ می‌کردند و کودکی که دنبال پژواک می‌دوید."],
["Her exhibition, City of Fog, opened in winter. Visitors stood silent before the grey pictures. The fog had not hidden her city, Narges realised — it had revealed its soul.","نمایشگاهش، شهر مه، زمستان افتتاح شد. بازدیدکننده‌ها خاموش پیش عکس‌های خاکستری ایستادند. مه شهرش را پنهان نکرده بود — روحش را آشکار کرده بود."]]]]],
["B2","last-interview",true,"The Last Interview","آخرین مصاحبه",
"A retired journalist asks one final question.","روزنامه‌نگار بازنشسته‌ای یک سؤال آخر می‌پرسد.",18,
[["The Assignment","مأموریت",[
["After forty years, Mr Tavakoli was retiring. His editor gave him one last assignment: interview the famous actress everyone feared — sharp-tongued, private, and allergic to journalists.","پس از چهل سال، آقای توکلی بازنشسته می‌شد. سردبیرش آخرین مأموریت را داد: با بازیگر معروفی که همه از او می‌ترسیدند مصاحبه کند — تندزبان، گوشه‌گیر و حساس به روزنامه‌نگارها."],
["He prepared for a week. He read every interview, watched every film, and wrote thirty questions. Then he threw the list away.","یک هفته آماده شد. هر مصاحبه‌ای را خواند، هر فیلمی را دید و سی سؤال نوشت. بعد فهرست را دور انداخت."]]],
["One Question","یک سؤال",[
["The actress waited, arms crossed. Ask, she said coldly. Tavakoli smiled: After all these years, what still surprises you about people? Silence. Then tears — then the truest interview of his career.","بازیگر با دست‌های گره‌کرده منتظر بود. بپرس، سرد گفت. توکلی لبخند زد: پس از این همه سال، چه چیزی درباره آدم‌ها هنوز شگفت‌زده‌ات می‌کند؟ سکوت. بعد اشک — بعد صادانه‌ترین مصاحبه عمرش."],
["His editor read it twice. This is your best, she said. Tavakoli nodded: Forty years to learn that one honest question beats thirty clever ones.","سردبیرش دوبار خواند. این بهترین کارت است، گفت. توکلی تأیید کرد: چهل سال طول کشید تا یاد بگیرم یک سؤال صادانه سی سؤال زیرکانه را می‌برد."]]]]],
["B2","opinion-social-media",false,"Phones Down, Eyes Up","گوشی‌ها پایین، چشم‌ها بالا",
"An opinion piece on attention and friendship.","یادداشت نظری درباره توجه و دوستی.",15,
[["The Experiment","آزمایش",[
["Last month, our class tried an experiment: one restaurant dinner with all phones in a box. The first ten minutes were painful — hands reached for ghosts. Then something shifted: people looked up, laughed louder, and stayed two hours longer than usual.","ماه گذشته کلاس ما آزمایشی کرد: یک شام رستوران با همه گوشی‌ها در جعبه. ده دقیقه اول دردناک بود — دست‌ها دنبال شبح می‌گشتند. بعد چیزی عوض شد: مردم بالا را نگاه کردند، بلندتر خندیدند و دو ساعت بیشتر از معمول ماندند."],
["Nobody missed anything urgent. The world survived without us for one evening — and we survived without the world. That should worry us a little.","کسی چیز فوری را از دست نداد. دنیا یک شب بدون ما زنده ماند — و ما بدون دنیا. این باید کمی نگرانمان کند."]]],
["A Modest Proposal","پیشنهاد متواضعانه",[
["I am not asking you to delete anything. Just try the box: one meal, one evening, phones away. Notice who tells the best story. Notice who listens.","نمی‌گویم چیزی را حذف کنید. فقط جعبه را امتحان کنید: یک وعده، یک عصر و گوشی‌ها کنار. ببینید چه کسی بهترین داستان را می‌گوید. ببینید چه کسی گوش می‌دهد."],
["Technology should connect us, not collect us. Put the phone down, look up — your friends are more interesting than your feed.","فناوری باید ما را وصل کند، نه جمعمان کند. گوشی را بگذار پایین و بالا را نگاه کن — دوستانت از فیدت جذاب‌ترند."]]]]],
["B2","report-urban-gardens",false,"Urban Gardens Report","گزارش باغ‌های شهری",
"A short report on rooftop gardens in one district.","گزارش کوتاهی درباره باغ‌های پشت‌بام در یک محله.",15,
[["Findings","یافته‌ها",[
["This report covers twelve rooftop gardens in District 9, visited between March and May. Together they grow over 800 kilograms of vegetables per year — enough for forty families.","این گزارش دوازده باغ پشت‌بام در منطقه ۹ را پوشش می‌دهد که میان مارس تا مه بازدید شدند. روی هم بیش از ۸۰۰ کیلو سبزی در سال می‌کارند — کافی برای چهل خانواده."],
["Costs are modest: soil, seeds, and shared tools totalled less than the price of two restaurant dinners per family. Water comes mostly from saved rain.","هزینه‌ها اندک است: خاک، بذر و ابزار مشترک برای هر خانواده کمتر از قیمت دو شام رستوران شد. آب بیشتر از باران ذخیره‌شده است."]]],
["Recommendation","توصیه",[
["Residents report fresher food, cooler top floors, and — unexpectedly — new friendships. Three buildings now share seeds and harvests.","ساکنان از غذای تازه‌تر، طبقه‌های آخر خنک‌تر و — غیرمنتظره — دوستی‌های جدید گزارش می‌دهند. سه ساختمان حالا بذر و محصول را تقسیم می‌کنند."],
["We recommend small grants for ten more buildings and one shared adviser. Green roofs pay back in food, cool air, and community.","توصیه می‌کنیم کمک‌های کوچکی برای ده ساختمان دیگر و یک مشاور مشترک. بام‌های سبز با غذا، هوای خنک و اجتماع جواب می‌دهند."]]]]],
["C1","translator",true,"The Translator","مترجم",
"A translator discovers a sentence that changes her.","مترجمی جمله‌ای کشف می‌کند که او را عوض می‌کند.",22,
[["The Manuscript","دست‌نوشته",[
["Leila had translated eleven novels and prided herself on invisible work: no one ever noticed her sentences. Then came a manuscript with a note from the dead author: The truth is in chapter nine. Translate it carefully — it will change you.","لیلا یازده رمان ترجمه کرده بود و به کار نامرئی‌اش می‌بالید: هیچ‌کس جمله‌هایش را متوجه نمی‌شد. بعد دست‌نوشته‌ای آمد با یادداشتی از نویسنده مرده: حقیقت در فصل نه است. با دقت ترجمه‌اش کن — تو را عوض می‌کند."],
["She laughed at the drama. Translators translate; they do not transform. Yet each evening she closed the file a little later, a little quieter.","به این درام خندید. مترجم‌ها ترجمه می‌کنند؛ متحول نمی‌شوند. ولی هر شب فایل را کمی دیرتر و کمی آرام‌تر می‌بست."]]],
["Chapter Nine","فصل نه",[
["Chapter nine held one impossible sentence, forty words long, about a mother forgiving a son who never apologised. Every version Leila wrote sounded false — until she remembered her own brother, her own silence, her own forty-word sentence never sent.","فصل نه یک جمله محال چهل‌واژه‌ای داشت، درباره مادری که پسری را می‌بخشد که هرگز عذر نخواسته است. هر نسخه‌ای که لیلا نوشت دروغ به نظر می‌رسید — تا اینکه برادر خودش، سکوت خودش و جمله چهل‌واژه‌ای خودش را به یاد آورد که هرگز فرستاده نشده بود."],
["She translated the sentence in tears, then called her brother for the first time in six years. The author had been right. Some books translate us.","جمله را با اشک ترجمه کرد، بعد برای اولین بار در شش سال به برادرش زنگ زد. نویسنده درست گفته بود. بعضی کتاب‌ها ما را ترجمه می‌کنند."]]]]],
["C1","winter-archive",true,"The Winter Archive","بایگانی زمستانی",
"An archivist must choose what survives the flood.","بایگان باید انتخاب کند چه چیزی از سیل جان سالم به در می‌برد.",22,
[["Water Rising","آب بالا می‌آید",[
["The river had never reached the archive in two hundred years. Then came the winter of black rain, and water seeped under the iron door. Dr Naderi had one night, one boat, and forty shelves of history.","رودخانه در دویست سال هرگز به بایگانی نرسیده بود. بعد زمستان باران سیاه آمد و آب از زیر درِ آهنی نفوذ کرد. دکتر نادری یک شب، یک قایق و چهل قفسه تاریخ داشت."],
["Every box screamed to be saved: letters of poets, maps of lost villages, a child's diary from the famine year. Saving everything was impossible; choosing felt like betrayal.","هر جعبه فریاد می‌زد نجاتم بده: نامه‌های شاعران، نقشه‌های روستاهای گم‌شده و خاطرات کودکی از سال قحطی. نجات همه محال بود؛ انتخاب کردن مثل خیانت حس می‌شد."]]],
["What Remains","آنچه می‌ماند",[
["She saved the ordinary things: shopping lists, school notes, wedding songs. Let kings keep their statues, she thought. The future should know how we lived, not only how we ruled.","چیزهای معمولی را نجات داد: فهرست‌های خرید، جزوه‌های مدرسه و آهنگ‌های عروسی. بگذار شاهان مجسمه‌هایشان را نگه دارند، فکر کرد. آینده باید بداند چطور زندگی کردیم، نه فقط چطور حکومت کردیم."],
["Years later, students wept over a grocer's list from 1911: bread, oil, hope. Naderi smiled. She had chosen well. Civilisation is a shopping list that survives.","سال‌ها بعد دانشجوها سر فهرست بقالی از ۱۹۱۱ گریه کردند: نان، روغن و امید. نادری لبخند زد. خوب انتخاب کرده بود. تمدن فهرست خریدی است که می‌ماند."]]]]],
["C1","attention-economy",false,"The Attention Economy","اقتصاد توجه",
"Who profits when you scroll? An analytical explainer.","وقتی اسکرول می‌کنی چه کسی سود می‌برد؟ توضیح تحلیلی.",20,
[["The Product Is You","محصول شمایید",[
["When a service is free, you are not the customer — you are the inventory. Platforms auction your attention to advertisers in milliseconds, thousands of times a day, and you never see the hammer fall.","وقتی خدمتی رایگان است، تو مشتری نیستی — موجودی هستی. سکوها توجه تو را در میلی‌ثانیه به تبلیغ‌کننده‌ها حراج می‌کنند، روزی هزاران بار، و تو هرگز صدای چکش را نمی‌شنوی."],
["This is not an accident of design; it is the design. Outrage keeps eyes longer than joy, so systems optimise for fury. Your anger is inventory too.","این تصادف طراحی نیست؛ خود طراحی است. خشم بیشتر از شادی چشم را نگه می‌دارد، پس سامانه‌ها برای خشم بهینه می‌شوند. خشم تو هم موجودی است."]]],
["Reclaiming Attention","پس گرفتن توجه",[
["Regulation may help, but habits help sooner: charge the phone outside the bedroom, keep one screen-free meal, and ask of every app — what does it cost me to pay nothing?","قانون شاید کمک کند ولی عادت زودتر: گوشی را بیرون اتاق خواب شارژ کن، یک وعده بدون صفحه نگه دار و از هر برنامه بپرس — هیچ نپرداختن چه هزینه‌ای برای من دارد؟"],
["Attention is the rarest thing you own. Spend it like money: deliberately, joyfully, and never all in one shop.","توجه کمیاب‌ترین چیزی است که داری. مثل پول خرجش کن: آگاهانه، شادمانه و هرگز همه در یک مغازه."]]]]],
["C1","biography-rostami",false,"Dr. Rostami: A Life in Medicine","دکتر رستمی: زندگی در پزشکی",
"An original fictional portrait of a village doctor.","پرتره خیالی اصیل از یک پزشک روستا.",20,
[["The Village Doctor","پزشک روستا",[
["Dr. Rostami never owned a car, though she could have bought ten. For thirty years she walked the mountain road to twelve villages, her bag holding everything medicine then allowed: bandages, syrups, patience.","دکتر رستمی هرگز ماشین نداشت، هرچند می‌توانست ده تا بخرد. سی سال جاده کوهستانی تا دوازده روستا را پیاده رفت، کیفش همه آنچه پزشکی آن زمان اجازه می‌داد داشت: باند، شربت و صبر."],
["They say she never lost a mother in childbirth and never charged a poor family. When asked her secret, she pointed at her ears: I listen longer than others examine.","می‌گویند هیچ مادری را در زایمان از دست نداد و از هیچ خانواده فقیری پول نگرفت. وقتی رازش را پرسیدند به گوش‌هایش اشاره کرد: من بیشتر از معاینه دیگران گوش می‌دهم."]]],
["The Lesson","درس",[
["She retired at seventy, but the road did not retire her: villagers still climb to her cottage with pain, news, and grandchildren to bless. Her clinic is now a library — her second prescription for every illness.","در هفتاد سالگی بازنشسته شد ولی جاده بازنشسته‌اش نکرد: روستاییان هنوز با درد و خبر و نوه برای دعا به کلبه‌اش بالا می‌روند. درمانگاهش حالا کتابخانه است — نسخه دومش برای هر بیماری."],
["What remains of a life? Not the bag, not the road — but twelve villages that measure every doctor against her. That is a biography no paper can hold.","از یک زندگی چه می‌ماند؟ نه کیف و نه جاده — بلکه دوازده روستا که هر پزشکی را با او می‌سنجند. این زندگی‌نامه‌ای است که هیچ کاغذی گنجایشش را ندارد."]]]]],
["C2","cartographer",true,"The Cartographer","نقشه‌کش",
"A mapmaker confronts the country that no longer exists.","نقشه‌کشی با کشوری روبه‌رو می‌شود که دیگر وجود ندارد.",26,
[["Blank Spaces","فضاهای خالی",[
["Old Bahrami drew maps for fifty years, and his rule never changed: a map must show what is, not what was. Then his granddaughter asked him to draw the country of his childhood — the one whose name no atlas prints anymore.","بهرامی پیر پنجاه سال نقشه کشید و قاعده‌اش هرگز عوض نشد: نقشه باید آنچه هست را نشان دهد، نه آنچه بود. بعد نوه‌اش خواست کشور کودکی‌اش را بکشد — همان که نامش را دیگر هیچ اطلسی چاپ نمی‌کند."],
["His hand shook over the paper. Borders had moved like rivers; cities had changed names like coats. Every line he remembered was, officially, a lie.","دستش روی کاغذ لرزید. مرزها مثل رودخانه‌ها جابه‌جا شده بودند؛ شهرها مثل پالتو نام عوض کرده بودند. هر خطی که به یاد داشت، رسماً دروغ بود."]]],
["The True Map","نقشه راستین",[
["So he drew two maps. One showed the world as it is — correct, cold, approved. The other showed his country: the bakery that is now a bank, the school that is a parking lot, the tree where he first read a poem.","پس دو نقشه کشید. یکی جهان را چنان‌که هست نشان می‌داد — درست، سرد و تأییدشده. دیگری کشور او را: نانوایی که حالا بانک است، مدرسه‌ای که پارکینگ است و درختی که زیرش اول‌بار شعری خواند."],
["Which is true? his granddaughter asked. Both, he said. One is for travellers. The other — he pressed it into her hands — is for rememberers. Never confuse them; never lose either.","کدام راست است؟ نوه‌اش پرسید. هر دو، گفت. یکی برای مسافران. دیگری را — در دست‌هایش فشرد — برای به‌یادآورندگان. هرگز قاطی‌شان نکن؛ هیچ‌کدام را هم گم نکن."]]]]],
["C2","silent-auction",true,"The Silent Auction","حراج سکوت",
"At an auction of the unsold, the dearest lot is silence.","در حراج فروش‌نرفته‌ها، گران‌بهاترین قلم سکوت است.",26,
[["Lot Zero","قلم صفر",[
["The gallery's strangest evening began with an apology: every painting tonight failed to sell this year. So the auctioneer offered them backwards — starting high, dropping low — and added one final lot: five minutes of shared silence.","عجیب‌ترین شب گالری با عذرخواهی شروع شد: هر تابلوی امشب امسال فروش نرفته بود. پس حراج‌کننده آن‌ها را وارونه عرضه کرد — از بالا شروع و به پایین — و یک قلم آخر اضافه کرد: پنج دقیقه سکوت مشترک."],
["Laughter rippled. Who bids on nothing? A tired nurse bid first, then a student, then an old couple holding hands like survivors. The price of silence climbed past every painting.","خنده موج زد. چه کسی برای هیچ پیشنهاد می‌دهد؟ پرستار خسته‌ای اول پیشنهاد داد، بعد دانشجویی و بعد زوج پیری که مثل بازماندگان دست هم را گرفته بودند. قیمت سکوت از هر تابلویی بالاتر رفت."]]],
["Sold","فروخته شد",[
["For five minutes, two hundred strangers sat in perfect quiet. No phones, no coughs, no commerce. A child fell asleep; a widow smiled; the city outside kept its noise politely distant.","پنج دقیقه دویست غریبه در سکوتی کامل نشستند. بدون گوشی، بدون سرفه و بدون تجارت. کودکی خوابش برد؛ بیوه‌ای لبخند زد؛ شهر بیرون سر و صدایش را مؤدبانه دور نگه داشت."],
["When the bell rang, nobody clapped — applause would have broken it. They simply paid, nodded, and left lighter. The gallery never sold silence again; some lots, the auctioneer said, can only be won once.","وقتی زنگ خورد کسی دست نزد — دست زدن می‌شکستش. فقط پول دادند، سر تکان دادند و سبک‌تر رفتند. گالری هرگز دوباره سکوت نفروخت؛ بعضی قلم‌ها، گفت حراج‌کننده، فقط یک‌بار بُرده می‌شوند."]]]]],
["C2","essay-certainty",false,"In Praise of Uncertainty","در ستایش عدم‌قطعیت",
"An essay: certainty closes minds; doubt opens them.","مقاله‌ای: قطعیت ذهن‌ها را می‌بندد؛ تردید بازشان می‌کند.",24,
[["The Closed Door","درِ بسته",[
["Certainty feels like strength and behaves like a lock. The certain mind files every fact into finished drawers; nothing new fits, because nothing new is admitted. History's cruellest chapters were written by people who felt no doubt.","قطعیت حس قدرت می‌دهد و رفتار قفل را دارد. ذهن مطمئن هر واقعیتی را در کشوهای تمام‌شده می‌چیند؛ چیز جدیدی جا نمی‌شود چون چیز جدیدی پذیرفته نمی‌شود. بی‌رحم‌ترین فصل‌های تاریخ را کسانی نوشتند که تردیدی حس نکردند."],
["Doubt, by contrast, is an open window. It lets the cold in — and the light. Every science began as a doubt polished into a question; every wisdom begins where certainty ends.","تردید اما پنجره باز است. سرما را می‌آورد — و نور را. هر علمی به‌صورت تردیدی شروع شد که به سؤال صیقل خورد؛ هر حکمتی آنجا شروع می‌شود که قطعیت تمام می‌شود."]]],
["Practising Doubt","تمرین تردید",[
["Uncertainty can be trained like a muscle: steelman opponents, keep a doubt journal, and ask of every belief — what would change my mind? If nothing would, gently suspect yourself.","عدم‌قطعیت مثل عضله تمرین‌پذیر است: مخالف را تقویت کن، دفتر تردید نگه دار و از هر باور بپرس — چه چیزی نظرم را عوض می‌کند؟ اگر هیچ‌چیز، آرام به خودت شک کن."],
["This is not relativism; it is rigour. Hold strong views, weakly held: commit fully, update freely. The wise are not those without answers, but those whose answers still breathe.","این نسبی‌گرایی نیست؛ دقت است. نظرهای قویِ سست‌نگه‌داشته باش: کامل متعهد شو و آزاد به‌روز کن. خردمندان کسانی نیستند که جواب ندارند، بلکه کسانی‌اند که جواب‌هایشان هنوز نفس می‌کشد."]]]]],
["C2","briefing-climate-finance",false,"Climate Finance Briefing","توجیه مالی اقلیم",
"A professional briefing: who pays for adaptation?","توجیه حرفه‌ای: هزینه سازگاری را چه کسی می‌پردازد؟",24,
[["The Gap","شکاف",[
["Adaptation needs in developing economies exceed 300 billion dollars yearly; flows cover barely a tenth. The gap is not a rounding error — it is the difference between managed retreat and chaotic loss.","نیازهای سازگاری در اقتصادهای در حال توسعه سالانه از ۳۰۰ میلیارد دلار می‌گذرد؛ جریان‌ها به‌سختی یک‌دهم را پوشش می‌دهند. شکاف خطای گرد کردن نیست — تفاوت عقب‌نشینی مدیریت‌شده و زیان آشوبناک است."],
["Private capital hesitates because returns are public: a seawall protects everyone and bills no one. Markets price risk; they do not price survival — hence the permanent shortfall.","سرمایه خصوصی تردید می‌کند چون بازده عمومی است: دیوار دریایی همه را محافظت می‌کند و به کسی صورت‌حساب نمی‌دهد. بازارها ریسک را قیمت می‌زنند؛ بقا را نه — از این رو کمبود دائمی."]]],
["Instruments","ابزارها",[
["Blended finance, resilience bonds, and debt-for-nature swaps can bridge part of the gap — if designed for speed, not ceremony. Every instrument must answer one question: does money reach the village before the flood?","تأمین مالی ترکیبی، اوراق تاب‌آوری و معاوضه بدهی با طبیعت می‌توانند بخشی از شکاف را پر کنند — اگر برای سرعت طراحی شوند نه تشریفات. هر ابزاری باید به یک سؤال جواب دهد: آیا پول پیش از سیل به روستا می‌رسد؟"],
["Recommendation: fund the proven, pilot the promising, and sunset the performative. Adaptation delayed is adaptation denied — and the invoice, with interest, always arrives.","توصیه: اثبات‌شده را تأمین کنید، امیدوارکننده را آزمایشی و نمایشی را غروب دهید. سازگاریِ به‌تعویق‌افتاده سازگاریِ انکارشده است — و صورت‌حساب، با بهره، همیشه می‌رسد."]]]]],
];

/* ============================ LISTENING (24) ============================ */
/* Row: [level, slugSuffix, titleEn, titleFa, descEn, descFa, durationSec,
 *       transcriptEn, transcriptFa, visibility]
 * AUDIO POLICY: audioSrc values below are RESERVED STABLE KEYS ONLY.
 * No /audio files exist; therefore every listening item seeds as `draft`.
 * Publish only after real audio lands in public/audio/. */

function buildListening(rows, lessonKeysByLevel) {
  const seenPerLevel = new Map();
  return rows.map(([level, suffix, titleEn, titleFa, descEn, descFa, secs, trEn, trFa, vis], i) => {
    const lvl = String(level).toUpperCase();
    const slug = `${lvl.toLowerCase()}-listening-${suffix}`;
    const n = seenPerLevel.get(lvl) ?? 0;
    seenPerLevel.set(lvl, n + 1);
    const lessonKeys = lessonKeysByLevel.get(lvl) || [];
    return {
      _key: slug,
      _level: lvl,
      _lessonKey: lessonKeys.length ? lessonKeys[n % lessonKeys.length] : null,
      slug,
      title: L(titleFa, titleEn),
      description: L(descFa, descEn),
      audioSrc: `/audio/listening/${slug}.mp3`,
      durationSeconds: secs,
      level: lvl,
      transcript: L(trFa, trEn),
      transcriptVisibility: vis,
      order: i,
      status: "draft",
    };
  });
}

const LISTENING_ROWS = [
["A1","meeting-sara","Meeting Sara","آشنایی با سارا",
"A slow, clear first meeting between two classmates.","آشنایی آرام و روشن میان دو هم‌کلاسی.",75,
"Mr Hosseini: Good morning, class! This is Sara. She is new here. — Sara: Hello, everyone! — Class: Hello, Sara! — Mr Hosseini: Sara, where are you from? — Sara: I am from Yazd. — Mr Hosseini: Welcome to our class, Sara!",
"آقای حسینی: صبح بخیر کلاس! این ساراست. او اینجا جدید است. — سارا: سلام همه! — کلاس: سلام سارا! — آقای حسینی: سارا، اهل کجایی؟ — سارا: اهل یزدم. — آقای حسینی: به کلاس ما خوش آمدی سارا!",
"on-request"],
["A1","at-corner-shop","At the Corner Shop","در بقالی سر کوچه",
"Buying bread and milk with polite phrases.","خرید نان و شیر با عبارت‌های مؤدبانه.",80,
"Shopkeeper: Hello! Can I help you? — Mina: Hello! I need some bread and milk, please. — Shopkeeper: Here you are. Anything else? — Mina: No, thank you. How much is it? — Shopkeeper: Fifteen thousand tomans. — Mina: Here you are. Thank you! — Shopkeeper: Thank you! Goodbye!",
"مغازه‌دار: سلام! کمکی می‌خواهید؟ — مینا: سلام! کمی نان و شیر می‌خواهم لطفاً. — مغازه‌دار: بفرما. چیز دیگری؟ — مینا: نه، ممنون. چقدر می‌شود؟ — مغازه‌دار: پانزده هزار تومان. — مینا: بفرما. ممنون! — مغازه‌دار: ممنون! خداحافظ!",
"on-request"],
["A1","office-introductions","Office Introductions","معرفی در اداره",
"A new worker meets two colleagues.","کارمند جدیدی با دو همکار آشنا می‌شود.",85,
"Manager: Good morning! This is Mr Karimi. He is our new driver. — Sara: Hello, Mr Karimi! I am Sara. I work in sales. — Mr Karimi: Hello! Happy to meet you. — Ali: And I am Ali, from the office. Welcome! — Mr Karimi: Thank you very much!",
"مدیر: صبح بخیر! این آقای کریمی است. راننده جدید ماست. — سارا: سلام آقای کریمی! من سارام. در فروش کار می‌کنم. — آقای کریمی: سلام! از آشنایی خوشحالم. — علی: و من علی‌ام، از دفتر. خوش آمدی! — آقای کریمی: خیلی ممنون!",
"on-request"],
["A1","what-time-bus","What Time Is the Bus?","اتوبوس چه ساعتی است؟",
"Asking about bus times at a small station.","پرسیدن ساعت اتوبوس در ایستگاه کوچک.",70,
"Boy: Excuse me! What time is the bus to the city? — Clerk: At ten thirty. — Boy: And the next one? — Clerk: At eleven thirty. — Boy: Thank you! Where is platform two? — Clerk: Over there, on the right. — Boy: Thanks! Goodbye!",
"پسر: ببخشید! اتوبوس شهر چه ساعتی است؟ — کارمند: ده و نیم. — پسر: و بعدی؟ — کارمند: یازده و نیم. — پسر: ممنون! سکوی دو کجاست؟ — کارمند: آنجا، سمت راست. — پسر: ممنون! خداحافظ!",
"on-request"],
["A2","phone-message-dentist","A Dentist Phone Message","پیام تلفنی دندان‌پزشک",
"Listening to and noting a voicemail.","گوش دادن به پیام صوتی و یادداشت آن.",90,
"Hello, this is Dr Amini's office calling for Mrs Hosseini. Your visit on Monday at four is moved to Tuesday at ten. Please call us back at 021-555-0142 to confirm. Thank you, and sorry for the change!",
"سلام، اینجا مطب دکتر امینی است و با خانم حسینی کار داریم. ویزیت دوشنبه ساعت چهار شما به سه‌شنبه ساعت ده منتقل شد. لطفاً برای تأیید به شماره ۰۲۱-۵۵۵-۰۱۴۲ زنگ بزنید. ممنون و بابت تغییر متأسفیم!",
"on-request"],
["A2","airport-announcement","Airport Announcement","اطلاعیه فرودگاه",
"Understanding gate and delay announcements.","فهمیدن اطلاعیه‌های گیت و تأخیر.",95,
"Attention, please! Flight 214 to Isfahan is delayed by one hour. New time: half past three. Passengers, please stay near gate five. Flight 305 to Mashhad is now boarding at gate nine. Thank you!",
"توجه لطفاً! پرواز ۲۱۴ به اصفهان یک ساعت تأخیر دارد. ساعت جدید: سه و نیم. مسافران لطفاً نزدیک گیت پنج بمانند. پرواز ۳۰۵ به مشهد هم‌اکنون از گیت نه سوار می‌کند. ممنون!",
"on-request"],
["A2","ordering-dinner","Ordering Dinner","سفارش شام",
"A couple orders food and asks questions.","زوجی غذا سفارش می‌دهند و سؤال می‌پرسند.",120,
"Waiter: Good evening! A table for two? — Man: Yes, please. — Waiter: Here is the menu. — Woman: What do you recommend? — Waiter: The fish is very fresh today. — Man: Is it spicy? — Waiter: No, it is mild. — Woman: Then one fish and one chicken, please. — Waiter: And to drink? — Man: Two teas, please.",
"گارسون: عصر بخیر! میز دو نفره؟ — مرد: بله لطفاً. — گارسون: این هم منو. — زن: چه پیشنهادی دارید؟ — گارسون: ماهی امروز خیلی تازه است. — مرد: تند است؟ — گارسون: نه، ملایم است. — زن: پس یک ماهی و یک مرغ لطفاً. — گارسون: و نوشیدنی؟ — مرد: دو چای لطفاً.",
"on-request"],
["A2","weekend-plans-call","Weekend Plans Call","تماس برنامه آخر هفته",
"Two friends arrange a Saturday trip.","دو دوست سفر شنبه را هماهنگ می‌کنند.",130,
"Leila: Hi, Maryam! What are you doing on Saturday? — Maryam: Nothing much. Why? — Leila: Let's go to the lake! The weather will be sunny. — Maryam: Great idea! What time? — Leila: The bus leaves at eight. Meet at seven thirty? — Maryam: Perfect. I'll bring food. — Leila: And I'll bring my camera. See you Saturday!",
"لیلا: سلام مریم! شنبه چه می‌کنی؟ — مریم: کار خاصی نه. چرا؟ — لیلا: بریم دریاچه! هوا آفتابی می‌شود. — مریم: ایده عالی! چه ساعتی؟ — لیلا: اتوبوس ساعت هشت می‌رود. هفت و نیم هم را ببینیم؟ — مریم: عالی. من غذا می‌آورم. — لیلا: و من دوربینم را. شنبه می‌بینمت!",
"on-request"],
["B1","booking-appointment","Booking an Appointment","گرفتن نوبت",
"Calling a clinic to book and confirm.","تماس با درمانگاه برای نوبت و تأیید.",140,
"Receptionist: City Clinic, how can I help? — Caller: Hello, I'd like to see Dr Rahimi this week. — Receptionist: She's full on Thursday, but Friday at eleven is free. — Caller: Friday works. My name is Neda Ahmadi. — Receptionist: Phone number, please? — Caller: 0912-555-0188. — Receptionist: Done! Friday eleven, Dr Rahimi. Please arrive ten minutes early.",
"پذیرش: درمانگاه شهر، کمکی می‌خواهید؟ — تماس‌گیرنده: سلام، می‌خواهم این هفته دکتر رحیمی را ببینم. — پذیرش: پنجشنبه پر است ولی جمعه ساعت یازده آزاد است. — تماس‌گیرنده: جمعه خوب است. نامم ندا احمدی است. — پذیرش: شماره تلفن لطفاً؟ — تماس‌گیرنده: ۰۹۱۲-۵۵۵-۰۱۸۸. — پذیرش: انجام شد! جمعه یازده، دکتر رحیمی. لطفاً ده دقیقه زودتر بیایید.",
"on-request"],
["B1","first-interview","A First Job Interview","اولین مصاحبه شغلی",
"A short, friendly entry-level interview.","مصاحبه کوتاه و دوستانه سطح مقدماتی.",180,
"Manager: Thanks for coming, Omid. Tell me about yourself. — Omid: I'm twenty, I study accounting, and I work part-time in a shop. — Manager: Why do you want this job? — Omid: I like working with people, and I want office experience. — Manager: What are your strengths? — Omid: I'm careful and I learn fast. — Manager: Good. Can you start Monday? — Omid: Yes, I can. Thank you!",
"مدیر: ممنون که آمدی امید. درباره خودت بگو. — امید: بیست سالم است، حسابداری می‌خوانم و پاره‌وقت در مغازه کار می‌کنم. — مدیر: چرا این شغل را می‌خواهی؟ — امید: کار با مردم را دوست دارم و تجربه اداری می‌خواهم. — مدیر: نقاط قوتت چیست؟ — امید: مراقبم و سریع یاد می‌گیرم. — مدیر: خوب. می‌توانی دوشنبه شروع کنی؟ — امید: بله. ممنون!",
"on-request"],
["B1","team-standup","Team Standup","جلسه ایستاده تیم",
"A quick work meeting: done, doing, blocked.","جلسه کاری سریع: انجام‌شده، در حال انجام و مانع.",170,
"Lead: Quick standup, everyone! Sara, start. — Sara: Yesterday I finished the report. Today I'll call two clients. No blocks. — Lead: Ali? — Ali: I fixed the website bug. Today I'll test payments. I'm blocked on the bank password. — Lead: I'll send it after this. Omid? — Omid: I cleaned the data. Today I'll write the summary. Done by three. — Lead: Great. Same time tomorrow!",
"سرپرست: جلسه سریع همه! سارا شروع کن. — سارا: دیروز گزارش را تمام کردم. امروز به دو مشتری زنگ می‌زنم. مانعی نیست. — سرپرست: علی؟ — علی: باگ سایت را درست کردم. امروز پرداخت‌ها را تست می‌کنم. سر رمز بانک گیرم. — سرپرست: بعد این جلسه می‌فرستم. امید؟ — امید: داده را تمیز کردم. امروز خلاصه را می‌نویسم. تا سه تمام است. — سرپرست: عالی. فردا همین ساعت!",
"on-request"],
["B1","missed-flight","The Missed Flight","پرواز ازدست‌رفته",
"Solving a travel problem at the help desk.","حل مشکل سفر در میز راهنما.",180,
"Traveller: Excuse me, I missed my flight to Tabriz! — Agent: I'm sorry to hear that. When was it? — Traveller: At nine. Traffic was terrible. — Agent: Let me check… There's a seat at two o'clock, with one stop. — Traveller: How much extra? — Agent: Nothing extra — same ticket! — Traveller: Really? That's wonderful, thank you! — Agent: Gate closes at one thirty. Don't be late twice!",
"مسافر: ببخشید، پرواز تبریزم را از دست دادم! — کارمند: متأسفم. کی بود؟ — مسافر: ساعت نه. ترافیک وحشتناک بود. — کارمند: بگذارید ببینم… ساعت دو یک صندلی هست، با یک توقف. — مسافر: چقدر اضافه؟ — کارمند: هیچ اضافه‌ای — همان بلیت! — مسافر: واقعاً؟ فوق‌العاده، ممنون! — کارمند: گیت یک و نیم بسته می‌شود. دوباره دیر نکنید!",
"on-request"],
["B2","product-launch-talk","Product Launch Talk","سخنرانی رونمایی محصول",
"A manager presents a new app to staff.","مدیر برنامه‌ای جدید را به کارکنان معرفی می‌کند.",240,
"Thank you all for coming. Today I'll show why our delivery times fell by half. Three points: the problem, the fix, the result. The problem: drivers waited twenty minutes per stop. The fix: our new app plans routes live. The result: in two months, complaints dropped sixty percent. Next quarter, we roll out to five more cities. Questions?",
"ممنون که آمدید. امروز نشان می‌دهم چرا زمان تحویل ما نصف شد. سه نکته: مشکل، راه‌حل و نتیجه. مشکل: راننده‌ها هر توقف بیست دقیقه منتظر می‌ماندند. راه‌حل: برنامه جدید ما مسیر را زنده برنامه‌ریزی می‌کند. نتیجه: در دو ماه شکایت‌ها شصت درصد افتاد. فصل بعد در پنج شهر دیگر اجرا می‌کنیم. سؤالی؟",
"on-request"],
["B2","news-campus-opening","Campus Opening News","خبر افتتاح دانشگاه",
"A news-style report on a new campus.","گزارش خبری درباره دانشگاه جدید.",210,
"Good evening. A new university campus opened today in the south of the city, with places for four thousand students. The mayor called it a gift to young people. Students we spoke to praised the library but criticised the bus service. The university promises more buses by winter. In other news, the football team won again last night…",
"عصر بخیر. امروز دانشگاه جدیدی در جنوب شهر با ظرفیت چهار هزار دانشجو افتتاح شد. شهردار آن را هدیه‌ای به جوانان خواند. دانشجوهایی که با آن‌ها حرف زدیم کتابخانه را ستودند ولی از اتوبوس انتقاد کردند. دانشگاه تا زمستان اتوبوس بیشتر قول داد. در خبرهای دیگر، تیم فوتبال دیشب دوباره برد…",
"on-request"],
["B2","budget-discussion","Budget Discussion","بحث بودجه",
"Two colleagues negotiate a tight budget.","دو همکار درباره بودجه تنگ مذاکره می‌کنند.",260,
"A: We need new laptops — ours are five years old. — B: I agree, but the budget is fixed. What if we buy five now, five next quarter? — A: That could work, if IT supports the old ones till then. — B: They said they will, but slowly. — A: Then let's prioritise the design team first. — B: Agreed. I'll write the proposal today. — A: And I'll talk to IT. Deal? — B: Deal!",
"الف: لپ‌تاپ نو لازم داریم — مال ما پنج ساله است. — ب: موافقم ولی بودجه ثابت است. اگر پنج تا حالا و پنج تا فصل بعد بخریم؟ — الف: اگر فناوری اطلاعات تا آن موقع از قدیمی‌ها پشتیبانی کند می‌شود. — ب: گفتند می‌کنند ولی کند. — الف: پس اول تیم طراحی را در اولویت بگذاریم. — ب: موافقم. امروز پیشنهاد را می‌نویسم. — الف: و من با فناوری اطلاعات حرف می‌زنم. توافق؟ — ب: توافق!",
"on-request"],
["B2","podcast-food-cities","Podcast: Food and Cities","پادکست: غذا و شهرها",
"A podcast interview with a street-food researcher.","مصاحبه پادکستی با پژوهشگر غذای خیابانی.",300,
"Host: Today we meet Diba, who studies street food. Diba, why street food? — Diba: Because a street tells its history through taste: migration, trade, poverty, joy — all in one sandwich! — Host: What's changing? — Diba: Two things: health rules, which are good, and rising rents, which push sellers out. — Host: Your hope? — Diba: Cities that protect flavour like they protect buildings.",
"مجری: امروز با دیبا دیدار می‌کنیم که غذای خیابانی مطالعه می‌کند. دیبا، چرا غذای خیابانی؟ — دیبا: چون خیابان تاریخش را از طریق مزه می‌گوید: مهاجرت، تجارت، فقر و شادی — همه در یک ساندویچ! — مجری: چه چیزی در حال تغییر است؟ — دیبا: دو چیز: قوانین سلامت که خوب است و اجاره‌های بالا که فروشنده‌ها را بیرون می‌کند. — مجری: امیدت؟ — دیبا: شهرهایی که از طعم مثل ساختمان‌ها محافظت کنند.",
"on-request"],
["C1","lecture-sleep-memory","Lecture: Sleep and Memory","سخنرانی: خواب و حافظه",
"A university lecture excerpt on sleep science.","بخشی از سخنرانی دانشگاهی درباره علم خواب.",330,
"Good morning. Today's claim: you do not learn while studying — you learn while sleeping. During deep sleep, the brain replays the day and files memories. Evidence: students who slept eight hours recalled forty percent more than those who slept five. Implication: pulling an all-nighter is borrowing from tomorrow's exam. Sleep is not rest from learning; it is learning's second half.",
"صبح بخیر. ادعای امروز: شما هنگام درس خواندن یاد نمی‌گیرید — هنگام خوابیدن یاد می‌گیرید. در خواب عمیق، مغز روز را بازپخش و خاطره‌ها را بایگانی می‌کند. شواهد: دانشجوهایی که هشت ساعت خوابیدند چهل درصد بیشتر از آن‌ها که پنج ساعت خوابیدند به یاد آوردند. پیامد: شب‌بیداری از آزمون فردا قرض گرفتن است. خواب استراحت از یادگیری نیست؛ نیمه دوم یادگیری است.",
"on-request"],
["C1","salary-negotiation","Salary Negotiation","مذاکره حقوق",
"A firm but polite pay negotiation.","مذاکره حقوق محکم ولی مؤدبانه.",300,
"Candidate: Thank you for the offer. Based on my five years and the market rate, I hoped for fifteen percent more. — Manager: I understand. Our band is tight, but I can move five percent — plus training budget. — Candidate: I appreciate that. Could we meet at ten percent, with a review in six months? — Manager: Ten with a six-month review… I can defend that upstairs. Agreed. — Candidate: Thank you. I'm excited to start!",
"داوطلب: ممنون بابت پیشنهاد. بر اساس پنج سال سابقه و نرخ بازار، امیدوار پانزده درصد بیشتر بودم. — مدیر: می‌فهمم. باند ما تنگ است ولی پنج درصد می‌توانم تکان بخورم — به‌علاوه بودجه آموزش. — داوطلب: ممنونم. می‌شود روی ده درصد با بازبینی شش‌ماهه توافق کنیم؟ — مدیر: ده با بازبینی شش‌ماهه… بالا می‌توانم دفاعش کنم. توافق. — داوطلب: ممنون. برای شروع هیجان‌زده‌ام!",
"on-request"],
["C1","panel-future-work","Panel: The Future of Work","میزگرد: آینده کار",
"Three speakers debate automation and jobs.","سه سخنران درباره خودکارسازی و شغل‌ها بحث می‌کنند.",360,
"Moderator: Will robots take our jobs? Economist: Some tasks, not most jobs — history shows work changes shape. Union leader: Shape matters: drivers can't become coders overnight; transitions need funding. Entrepreneur: Agreed — so let's fund reskilling from automation taxes. Economist: On that, unusually, we all agree!",
"مجری: آیا ربات‌ها شغل ما را می‌گیرند؟ اقتصاددان: بعضی وظایف، نه بیشتر شغل‌ها — تاریخ نشان می‌دهد کار شکل عوض می‌کند. رهبر اتحادیه: شکل مهم است: راننده‌ها یک‌شبه برنامه‌نویس نمی‌شوند؛ گذارها بودجه می‌خواهند. کارآفرین: موافقم — پس بازآموزی را از مالیات خودکارسازی تأمین کنیم. اقتصاددان: در این مورد، به‌طور غیرمعمول، همه موافقیم!",
"on-request"],
["C1","interview-novelist","Interview with a Novelist","مصاحبه با رمان‌نویس",
"An author discusses stories and translation.","نویسنده‌ای درباره داستان و ترجمه حرف می‌زند.",330,
"Host: Your novels cross borders easily. Why? — Novelist: Because families are the same everywhere: love, debt, dinner! Only the spices change. — Host: Do you fear translation? — Novelist: I fear bad translation. A good translator is my second author — I write the house, they rebuild it in new stone. — Host: Advice for young writers? — Novelist: Finish things. A bad ending teaches more than a perfect beginning.",
"مجری: رمان‌های شما راحت از مرزها می‌گذرند. چرا؟ — رمان‌نویس: چون خانواده‌ها همه‌جا یکی‌اند: عشق، بدهی و شام! فقط ادویه‌ها عوض می‌شود. — مجری: از ترجمه می‌ترسی؟ — رمان‌نویس: از ترجمه بد می‌ترسم. مترجم خوب نویسنده دوم من است — من خانه را می‌سازم و آن‌ها با سنگ جدید بازسازی‌اش می‌کنند. — مجری: توصیه به نویسنده‌های جوان؟ — رمان‌نویس: تمامش کنید. پایان بد بیشتر از شروع کامل می‌آموزد.",
"on-request"],
["C2","debate-ai-research","Debate: AI in Research","مناظره: هوش مصنوعی در پژوهش",
"Two scholars debate AI-assisted science.","دو پژوهشگر درباره علم با کمک هوش مصنوعی مناظره می‌کنند.",400,
"For: AI reads a million papers before breakfast; it finds links no human would. Against: It also invents citations no journal should. For: Then verify — the tool is fast, the scholar stays responsible. Against: Responsibility without time is fiction; speed will crush care. Chair: So the question is not whether to use it, but who answers when it errs.",
"موافق: هوش مصنوعی پیش از صبحانه میلیون مقاله می‌خواند؛ پیوندهایی پیدا می‌کند که هیچ انسانی نمی‌یافت. مخالف: استنادهایی هم جعل می‌کند که هیچ نشریه‌ای نباید. موافق: پس راستی‌آزمایی کن — ابزار سریع است و پژوهشگر مسئول می‌ماند. مخالف: مسئولیت بدون وقت افسانه است؛ سرعت دقت را له می‌کند. رئیس: پس سؤال این نیست که استفاده کنیم یا نه، بلکه کی وقتی خطا می‌کند جواب می‌دهد.",
"on-request"],
["C2","negotiation-harbor-deal","Negotiating the Harbor Deal","مذاکره معامله بندر",
"A high-stakes port negotiation excerpt.","بخشی از مذاکره پرریسک بندر.",380,
"Port: We offer twenty years, fixed fees, local jobs guaranteed. — Line: Twenty is short for our ships; we need thirty, with fee reviews. — Port: Thirty, if reviews are mutual and jobs double by year five. — Line: Jobs depend on cargo; guarantee cargo, we guarantee jobs. — Port: Then let's index both to volume — shared risk, shared reward. — Line: Now we're negotiating. Draft it tonight?",
"بندر: بیست سال پیشنهاد می‌دهیم، عوارض ثابت و شغل محلی تضمینی. — خط کشتیرانی: بیست برای کشتی‌های ما کوتاه است؛ سی می‌خواهیم با بازبینی عوارض. — بندر: سی، اگر بازبینی‌ها دوطرفه باشد و شغل‌ها تا سال پنج دو برابر شود. — خط: شغل به بار بستگی دارد؛ بار را تضمین کنید، شغل را تضمین می‌کنیم. — بندر: پس هر دو را به حجم وصل کنیم — ریسک مشترک، سود مشترک. — خط: حالا داریم مذاکره می‌کنیم. امشب پیش‌نویس کنیم؟",
"on-request"],
["C2","talk-translation-art","Talk: The Art of Translation","سخنرانی: هنر ترجمه",
"A literary talk on untranslatable words.","سخنرانی ادبی درباره واژه‌های ترجمه‌ناپذیر.",360,
"Every language hides rooms other languages lack. The Portuguese have saudade; we have taarof; the Japanese have komorebi. The translator's job is not to carry the room across — impossible — but to build a window facing it. A great translation does not say what the original said; it lets you stand where the original stood.",
"هر زبان اتاق‌هایی پنهان دارد که زبان‌های دیگر ندارند. پرتغالی‌ها سوداد دارند؛ ما تعارف؛ ژاپنی‌ها کوموربی. کار مترجم حمل اتاق نیست — محال — بلکه ساختن پنجره‌ای رو به آن است. ترجمه بزرگ نمی‌گوید اصل چه گفت؛ می‌گذارد آنجا بایستی که اصل ایستاده بود.",
"on-request"],
["C2","briefing-water-policy","Water Policy Briefing","توجیه سیاست آب",
"A policy briefing on river sharing.","توجیه سیاستی درباره تقسیم رودخانه.",380,
"Three provinces, one river, half the water it had. Upstream wants dams; downstream wants flow; the ministry wants peace. Our proposal: meter every canal, price water by scarcity, and pay farmers for saved drops. Nobody gets everything; everybody gets survival. The alternative is not victory for one side — it is ruin for all three, on schedule.",
"سه استان، یک رودخانه و نصف آبی که داشت. بالادست سد می‌خواهد؛ پایین‌دست جریان؛ وزارتخانه آرامش. پیشنهاد ما: هر کانال را کنتور بگذارید، آب را بر اساس کمیابی قیمت بزنید و به کشاورزان برای قطره‌های ذخیره‌شده پول بدهید. کسی همه‌چیز را نمی‌گیرد؛ همه بقا را می‌گیرند. جایگزین پیروزی یک طرف نیست — نابودی هر سه است، سر وقت.",
"on-request"],
];

/* ============================ SPEAKING (24) ============================= */
/* Row: [level, slugSuffix, titleEn, titleFa, descEn, descFa, instrEn, instrFa,
 *       contextEn, contextFa, roleEn, roleFa, objEn, objFa,
 *       [[critEn, critFa] x2], [[tipEn, tipFa] x2], topic, durationSec] */

function buildSpeaking(rows, lessonKeysByLevel) {
  const seenPerLevel = new Map();
  return rows.map(([level, suffix, tEn, tFa, dEn, dFa, iEn, iFa, cEn, cFa, rEn, rFa, oEn, oFa, crit, tips, topic, secs], i) => {
    const lvl = String(level).toUpperCase();
    const slug = `${lvl.toLowerCase()}-speaking-${suffix}`;
    const n = seenPerLevel.get(lvl) ?? 0;
    seenPerLevel.set(lvl, n + 1);
    const lessonKeys = lessonKeysByLevel.get(lvl) || [];
    return {
      _key: slug,
      _level: lvl,
      _lessonKey: lessonKeys.length ? lessonKeys[n % lessonKeys.length] : null,
      slug,
      title: L(tFa, tEn),
      description: L(dFa, dEn),
      instructions: L(iFa, iEn),
      context: L(cFa, cEn),
      role: L(rFa, rEn),
      objective: L(oFa, oEn),
      successCriteria: crit.map(([cEn2, cFa2]) => L(cFa2, cEn2)),
      preparationTips: tips.map(([tEn2, tFa2]) => L(tFa2, tEn2)),
      level: lvl,
      topic,
      durationLimitSeconds: secs,
      expectedLanguage: "en",
      order: i,
      status: "published",
    };
  });
}

const SPEAKING_ROWS = [
["A1","introduce-yourself","Introduce Yourself","خودت را معرفی کن",
"Say your name, city, and job in 30 seconds.","نام، شهر و شغلت را در ۳۰ ثانیه بگو.",
"Speak for 30 seconds. Say: name, city, job. Speak slowly and clearly.","۳۰ ثانیه صحبت کن. بگو: نام، شهر و شغل. آرام و روشن حرف بزن.",
"You meet a new classmate before class.","پیش از کلاس با هم‌کلاسی جدیدی آشنا می‌شوی.",
"You are a friendly new student.","تو دانش‌آموز جدید و صمیمی هستی.",
"Introduce yourself without stopping.","بدون توقف خودت را معرفی کن.",
[["Name, city, and job are all stated.","نام، شهر و شغل هر سه گفته شود."],["Speech is slow but continuous.","گفتار آرام ولی پیوسته باشد."]],
[["Practise the three sentences twice first.","اول سه جمله را دوبار تمرین کن."],["Smile — it relaxes your voice.","لبخند بزن — صدایت را آرام می‌کند."]],
"introductions",60],
["A1","describe-family","Describe Your Family","خانواده‌ات را توصیف کن",
"Talk about three family members.","درباره سه عضو خانواده حرف بزن.",
"Speak for 30-45 seconds about three people: who they are and one fact each.","۳۰ تا ۴۵ ثانیه درباره سه نفر حرف بزن: کی‌اند و برای هر کدام یک واقعیت.",
"Your teacher asks about your family.","معلمت درباره خانواده‌ات می‌پرسد.",
"You are a student sharing family news.","تو دانش‌آموزی هستی که خبر خانواده را می‌گویی.",
"Describe three relatives clearly.","سه خویشاوند را روشن توصیف کن.",
[["Three people are described.","سه نفر توصیف شوند."],["Possessives (my, his, her) are correct.","ملکی‌ها درست باشند."]],
[["Point at an imaginary photo as you speak.","هنگام حرف زدن به عکس خیالی اشاره کن."],["Use: This is my … He/She is …","از الگو استفاده کن: This is my … He/She is …"]],
"family",60],
["A1","my-routine","Talk About Your Routine","درباره برنامه روزانه‌ات حرف بزن",
"Describe your morning in order.","صبحت را به ترتیب توصیف کن.",
"Speak for 45 seconds. Use first, then, after that. Say four actions.","۴۵ ثانیه حرف بزن. از first و then و after that استفاده کن. چهار کار بگو.",
"A friend asks: What do you do every morning?","دوستی می‌پرسد: هر صبح چه می‌کنی؟",
"You are explaining your normal day.","داری روز معمولت را توضیح می‌دهی.",
"Narrate a routine in sequence.","یک برنامه را به ترتیب روایت کن.",
[["Four actions are ordered with linkers.","چهار کار با پیونددهنده مرتب شود."],["Present simple verbs are correct.","فعل‌های حال ساده درست باشند."]],
[["Count actions on your fingers.","کارها را با انگشت‌هایت بشمار."],["Keep verbs simple: wake up, eat, go.","فعل‌ها را ساده نگه دار."]],
"routines",60],
["A1","at-the-market","At the Market","در بازار",
"Buy two items politely.","دو قلم را مؤدبانه بخر.",
"Role-play with a partner or aloud: greet, ask for two items, ask the price, thank.","با هم‌کلاسی یا بلند بازی کن: سلام، خواستن دو قلم، پرسیدن قیمت و تشکر.",
"You are at a small food shop.","در خواربارفروشی کوچکی هستی.",
"You are a polite customer.","تو مشتری مؤدبی هستی.",
"Complete a full shop exchange.","یک تبادل کامل خرید را تمام کن.",
[["Polite phrases (please, thank you) are used.","عبارت‌های مؤدبانه به کار رود."],["A price question is asked and answered.","سؤال قیمت پرسیده و جواب داده شود."]],
[["Start every request with please.","هر درخواست را با please شروع کن."],["Practise numbers 10-100 first.","اول اعداد ۱۰ تا ۱۰۰ را تمرین کن."]],
"shopping",60],
["A2","past-trip","Describe a Past Trip","یک سفر گذشته را توصیف کن",
"Talk for one minute about a trip you took.","یک دقیقه درباره سفری که رفتی حرف بزن.",
"Speak for 60 seconds: where, when, who with, two events, one feeling.","۶۰ ثانیه حرف بزن: کجا، کی، با کی، دو رویداد و یک حس.",
"A new friend asks about your travels.","دوست جدیدی درباره سفرهایت می‌پرسد.",
"You are a traveller with good memories.","تو مسافری با خاطره‌های خوب هستی.",
"Narrate a past trip coherently.","یک سفر گذشته را منسجم روایت کن.",
[["Past simple is used throughout.","گذشته ساده در کل به کار رود."],["Sequence words order the events.","واژه‌های توالی رویدادها را مرتب کند."]],
[["Choose a real trip — details come easier.","سفر واقعی انتخاب کن — جزئیات راحت‌تر می‌آید."],["End with a feeling: It was …","با یک حس تمام کن: It was …"]],
"travel",90],
["A2","make-weekend-plan","Make a Weekend Plan","برنامه آخر هفته بچین",
"Arrange plans with a partner.","با هم‌کلاسی برنامه بچین.",
"Discuss with a partner: suggest two ideas, agree on one, fix time and place.","با هم‌کلاسی بحث کن: دو ایده پیشنهاد بده، روی یکی توافق کن و زمان و مکان را مشخص کن.",
"You call a friend on Wednesday evening.","عصر چهارشنبه به دوستی زنگ می‌زنی.",
"You are the organiser of the weekend.","تو سازمان‌دهنده آخر هفته هستی.",
"Reach a joint plan in English.","به برنامه مشترکی به انگلیسی برس.",
[["going to / will are used for the plan.","going to و will برای برنامه به کار رود."],["Time and place are clearly fixed.","زمان و مکان روشن مشخص شود."]],
[["Offer choices: Shall we … or …?","گزینه بده: Shall we … or …؟"],["Confirm at the end: So, Saturday at …","پایان تأیید کن: So, Saturday at …"]],
"plans",90],
["A2","ask-for-help","Ask for Help","کمک بخواه",
"Ask politely and explain the problem.","مؤدبانه بخواه و مشکل را توضیح بده.",
"Speak for 45 seconds: greet, explain one problem, make one polite request.","۴۵ ثانیه حرف بزن: سلام، توضیح یک مشکل و یک درخواست مؤدبانه.",
"Your bag is heavy and the bus is coming.","کیفت سنگین است و اتوبوس می‌آید.",
"You are a traveller needing help.","تو مسافری هستی که کمک لازم دارد.",
"Request help politely and clearly.","مؤدبانه و روشن کمک بخواه.",
[["The problem is explained simply.","مشکل ساده توضیح داده شود."],["Could you … please? is used.","از Could you … please استفاده شود."]],
[["Explain before asking: My bag is …","اول توضیح بده بعد بخواه."],["Always add thank you so much!","حتماً thank you so much بگو."]],
"requests",60],
["A2","order-and-pay","Order and Pay","سفارش بده و پول بده",
"Order a meal and handle the bill.","غذا سفارش بده و صورت‌حساب را مدیریت کن.",
"Role-play server and customer: order two dishes, ask one question, request the bill.","بازی گارسون و مشتری: دو غذا سفارش بده، یک سؤال بپرس و صورت‌حساب را بخواه.",
"You eat at a restaurant with a friend.","با دوستی در رستوران غذا می‌خوری.",
"You are the customer (then swap).","تو مشتری هستی (بعد عوض کنید).",
"Manage a full restaurant exchange.","یک تبادل کامل رستوران را مدیریت کن.",
[["I would like … is used for orders.","برای سفارش از I would like استفاده شود."],["The bill is requested politely.","صورت‌حساب مؤدبانه خواسته شود."]],
[["Ask about the menu: Is it spicy?","درباره منو بپرس: Is it spicy?"],["Practise: Could we have the bill?","تمرین کن: Could we have the bill?"]],
"dining",90],
["B1","state-preference","State a Preference","سلیقه‌ات را بگو",
"Compare two options and choose.","دو گزینه را مقایسه کن و انتخاب کن.",
"Speak for 60-90 seconds: present both options, state your choice, give two reasons.","۶۰ تا ۹۰ ثانیه حرف بزن: هر دو گزینه را بگو، انتخابت را اعلام کن و دو دلیل بیاور.",
"A friend asks: city or village life?","دوستی می‌پرسد: زندگی شهر یا روستا؟",
"You are giving honest personal advice.","داری توصیه شخصی صادانه می‌دهی.",
"Defend a preference with reasons.","از سلیقه‌ای با دلیل دفاع کن.",
[["Both options are fairly described.","هر دو گزینه منصفانه توصیف شود."],["Two clear reasons support the choice.","دو دلیل روشن از انتخاب حمایت کند."]],
[["Use: I prefer X because … and …","از الگو استفاده کن: I prefer X because …"],["Concede one point to the other side.","یک نکته را به طرف دیگر بده."]],
"preferences",90],
["B1","tell-a-story","Tell a Story","داستان بگو",
"Narrate a surprising event in two minutes.","رویداد شگفت‌انگیزی را در دو دقیقه روایت کن.",
"Tell a true story: background, three events, ending, feeling. Use past tenses.","داستان واقعی بگو: زمینه، سه رویداد، پایان و حس. از زمان‌های گذشته استفاده کن.",
"Friends share stories around tea.","دوستان دور چای داستان می‌گویند.",
"You are the evening storyteller.","تو داستان‌گوی شب هستی.",
"Hold attention for two minutes.","دو دقیقه توجه را نگه دار.",
[["Story has background, events, ending.","داستان زمینه، رویداد و پایان داشته باشد."],["Linkers (suddenly, luckily) are used.","پیونددهنده‌ها به کار رود."]],
[["Start in the action, not the morning.","از وسط ماجرا شروع کن نه از صبح."],["Pause before the surprise!","پیش از غافلگیری مکث کن!"]],
"storytelling",120],
["B1","explain-problem","Explain a Problem","مشکل را توضیح بده",
"Describe a problem and ask for advice.","مشکل را توصیف کن و توصیه بخواه.",
"Speak for 90 seconds: what happened, why it matters, what you tried, what you ask.","۹۰ ثانیه حرف بزن: چه شد، چرا مهم است، چه کردی و چه می‌خواهی.",
"Your laptop broke before an exam.","پیش از امتحان لپ‌تاپت خراب شد.",
"You are a worried student seeking help.","تو دانش‌آموز نگرانی هستی که کمک می‌خواهد.",
"Present a problem solvable by others.","مشکلی را بگو که دیگران بتوانند حلش کنند.",
[["Problem, cause, and attempts are clear.","مشکل، علت و تلاش‌ها روشن باشد."],["A specific question ends the talk.","گفتار با سؤال مشخصی تمام شود."]],
[["Order it: what → why → tried → ask.","مرتب کن: چه، چرا، چه کردم و چه می‌خواهم."],["One problem only — stay focused.","فقط یک مشکل — متمرکز بمان."]],
"problems",120],
["B1","give-advice","Give Advice","توصیه کن",
"Advise a friend with reasons.","به دوستی با دلیل توصیه کن.",
"Listen to a problem, then advise: show empathy, give two suggestions, warn once.","به مشکل گوش بده بعد توصیه کن: همدلی نشان بده، دو پیشنهاد بده و یک‌بار هشدار بده.",
"A friend wants to quit studying English.","دوستی می‌خواهد انگلیسی را ول کند.",
"You are a caring, honest friend.","تو دوست دلسوز و صادقی هستی.",
"Persuade gently with should and why.","آرام با should و دلیل متقاعد کن.",
[["Two suggestions each have a reason.","هر دو پیشنهاد دلیل داشته باشند."],["Tone stays kind, never bossy.","لحن مهربان بماند، نه دستوری."]],
[["Start: I understand, but …","شروع کن: I understand, but …"],["End with encouragement, not orders.","با تشویق تمام کن نه دستور."]],
"advice",120],
["B2","defend-opinion","Defend an Opinion","از نظرت دفاع کن",
"Argue a contested view for two minutes.","از نظر بحث‌برانگیزی دو دقیقه دفاع کن.",
"State a claim, give three reasons with one example, concede one point, conclude.","ادعا بگو، سه دلیل با یک مثال بیاور، یک نکته را بپذیر و نتیجه بگیر.",
"Topic: Social media does more harm than good.","موضوع: شبکه‌های اجتماعی بیشتر ضرر دارند تا فایده.",
"You are a principled debater.","تو مناظره‌کننده اصول‌مندی هستی.",
"Build a complete mini-argument live.","زنده یک استدلال کوچک کامل بساز.",
[["Claim, reasons, example, conclusion present.","ادعا، دلیل، مثال و نتیجه present باشد."],["One concession is honestly made.","یک پذیرش صادانه انجام شود."]],
[["Number reasons: first, second, finally.","دلیل‌ها را شماره کن."],["Concede to look stronger, not weaker.","بپذیر تا قوی‌تر به نظر برسی."]],
"debate",150],
["B2","solve-dispute","Solve a Dispute","اختلافی را حل کن",
"Mediate between two colleagues.","میان دو همکار میانجی‌گری کن.",
"Listen to both sides, restate each fairly, propose a compromise both can accept.","به هر دو طرف گوش بده، هر کدام را منصفانه بازگو کن و سازشی پیشنهاد بده که هر دو بپذیرند.",
"Two teammates clash over holiday shifts.","دو هم‌تیمی سر شیفت تعطیلات درگیرند.",
"You are the calm team mediator.","تو میانجی آرام تیم هستی.",
"Reach a compromise both sides own.","به سازشی برس که هر دو طرف بپذیرند.",
[["Both positions are restated fairly.","هر دو موضع منصفانه بازگو شود."],["The compromise is specific and dated.","سازش مشخص و تاریخ‌دار باشد."]],
[["Never take sides early.","زود طرف نگیر."],["Ask: What would you accept?","بپرس: What would you accept?"]],
"mediation",150],
["B2","social-issue-talk","Discuss a Social Issue","درباره مسئله اجتماعی بحث کن",
"Lead a balanced 3-minute discussion.","بحث متعادل سه‌دقیقه‌ای را رهبری کن.",
"Present an issue, voice two sides fairly, share your view with evidence, invite responses.","مسئله را بگو، دو طرف را منصفانه بگو، نظرت را با شواهد بگو و پاسخ بخواه.",
"Topic: Should cities ban old cars?","موضوع: آیا شهرها باید ماشین‌های قدیمی را ممنوع کنند؟",
"You are a fair discussion leader.","تو رهبر منصف بحث هستی.",
"Keep a discussion balanced and moving.","بحث را متعادل و روان نگه دار.",
[["Two sides are voiced before your view.","پیش از نظرت دو طرف گفته شود."],["Evidence supports your position.","شواهد از موضعت حمایت کند."]],
[["Steelperson the side you dislike.","طرفی که دوست نداری را تقویت کن."],["End by asking, not telling.","با پرسیدن تمام کن نه گفتن."]],
"society",150],
["B2","workplace-scenario","Handle a Workplace Scenario","سناریوی محیط کار را مدیریت کن",
"Deliver bad news and propose fixes.","خبر بد را برسان و راه‌حل پیشنهاد بده.",
"Role-play manager: state the problem plainly, take responsibility, propose two fixes, agree next steps.","بازی مدیر: مشکل را ساده بگو، مسئولیت بپذیر، دو راه‌حل پیشنهاد بده و گام‌های بعد را توافق کن.",
"A deadline was missed; the client waits.","ددلاین از دست رفت؛ مشتری منتظر است.",
"You are the responsible manager.","تو مدیر مسئولی هستی.",
"Turn bad news into a credible plan.","خبر بد را به برنامه معتبر تبدیل کن.",
[["Responsibility is taken, not dodged.","مسئولیت پذیرفته شود نه فرار."],["Two fixes and one deadline are agreed.","دو راه‌حل و یک ددلاین توافق شود."]],
[["Bad news first, in one sentence.","اول خبر بد در یک جمله."],["Never blame by name in public.","جلوی جمع کسی را با نام سرزنش نکن."]],
"work",150],
["C1","lead-discussion","Lead a Discussion","بحث را رهبری کن",
"Chair a 5-minute seminar discussion.","بحث سمیناری پنج‌دقیقه‌ای را اداره کن.",
"Open with a sharp question, invite three voices, challenge one idea collegially, synthesise at the end.","با سؤال تیزی شروع کن، سه صدا را دعوت کن، یک ایده را همکارانه به چالش بکش و پایان جمع‌بندی کن.",
"Seminar question: Does technology unite us?","سؤال سمینار: آیا فناوری ما را متحد می‌کند؟",
"You are the seminar chair.","تو رئیس سمینار هستی.",
"Run an inclusive, rigorous discussion.","بحث فراگیر و دقیقی اجرا کن.",
[["Three voices are explicitly invited.","سه صدا صریح دعوت شود."],["A fair synthesis closes the session.","جمع‌بندی منصفانه جلسه را ببندد."]],
[["Prepare two follow-up questions.","دو سؤال پیگیر آماده کن."],["Protect quiet voices: Sara, your view?","از صداهای آرام حمایت کن."]],
"seminars",180],
["C1","argue-case","Argue a Case","از پرونده‌ای دفاع کن",
"Present a sustained 3-minute case.","پرونده سه‌دقیقه‌ای پیوسته‌ای ارائه بده.",
"Argue: thesis, three pillars, concession-refutation, implications. No notes in the final minute.","استدلال کن: تز، سه ستون، پذیرش-رد و پیامدها. دقیقه آخر بدون یادداشت.",
"Motion: University should be free for all.","موضوع: دانشگاه باید برای همه رایگان باشد.",
"You are counsel for the motion.","تو وکیل موضوع هستی.",
"Persuade with structure, not volume.","با ساختار متقاعد کن نه با بلندی صدا.",
[["Concession-refutation is genuinely used.","پذیرش-رد واقعاً به کار رود."],["Register stays formal throughout.","سبک در کل رسمی بماند."]],
[["Write the thesis in ten words.","تز را در ده واژه بنویس."],["Practise the final 30 seconds most.","۳۰ ثانیه آخر را بیشتر تمرین کن."]],
"argumentation",180],
["C1","negotiate-deal","Negotiate a Deal","معامله‌ای مذاکره کن",
"Close a conditional agreement.","به توافق مشروطی برس.",
"Negotiate price, deadline, and revisions. Trade concessions conditionally; summarise the deal aloud.","قیمت، ددلاین و اصلاحات را مذاکره کن. امتیازها را مشروط مبادله کن و توافق را بلند خلاصه کن.",
"You are a freelancer; partner is the client.","تو فریلنسری؛ هم‌کلاسی مشتری است.",
"You are a prepared professional.","تو حرفه‌ای آماده‌ای هستی.",
"Close a deal both sides can honour.","معامله‌ای ببند که هر دو طرف بتوانند اجرا کنند.",
[["Two conditional trades are made.","دو مبادله مشروط انجام شود."],["The final deal is summarised precisely.","توافق نهایی دقیق خلاصه شود."]],
[["Know your walk-away point first.","اول نقطه خروجت را بدان."],["Silence after an offer is power.","سکوت پس از پیشنهاد قدرت است."]],
"negotiation",180],
["C1","abstract-topic","Discuss an Abstract Topic","درباره موضوع انتزاعی بحث کن",
"Sustain abstract talk for three minutes.","سه دقیقه حرف انتزاعی را نگه دار.",
"Discuss: Is privacy still possible? Define terms, give two angles, handle one challenge, conclude.","بحث کن: آیا حریم خصوصی هنوز ممکن است؟ واژه‌ها را تعریف کن، دو زاویه بگو، یک چالش را مدیریت کن و نتیجه بگیر.",
"A podcast invites your view.","پادکستی نظرت را دعوت کرده است.",
"You are a thoughtful guest speaker.","تو مهمان سخنران اندیشمندی هستی.",
"Think aloud with precision and humility.","بلند با دقت و فروتنی فکر کن.",
[["Key terms are defined, not assumed.","واژه‌های کلیدی تعریف شود نه فرض."],["Abstract claims meet concrete examples.","ادعاهای انتزاعی با مثال‌های عینی بیاید."]],
[["Define first: By privacy I mean …","اول تعریف کن: By privacy I mean …"],["Admit limits: I don't know, but …","محدودیت را بپذیر: I don't know, but …"]],
"abstraction",180],
["C2","formal-debate","Hold a Formal Debate","مناظره رسمی برگزار کن",
"Debate with models and weighing.","با مدل و سنجش مناظره کن.",
"Six minutes: model the motion, argue two clashes with mechanisms, weigh explicitly, rebut once.","شش دقیقه: موضوع را مدل کن، دو برخورد با سازوکار استدلال کن، صریح بسنج و یک‌بار رد کن.",
"Motion: This house would ban advertising to children.","موضوع: این مجلس تبلیغات برای کودکان را ممنوع می‌کند.",
"You are first speaker for the motion.","تو سخنران اول موافق هستی.",
"Win on depth, not loudness.","با عمق ببر نه با بلندی صدا.",
[["A clear model opens the case.","مدل روشنی پرونده را باز کند."],["Explicit weighing ends it.","سنجش صریحی تمامش کند."]],
[["Mechanisms beat adjectives.","سازوکارها صفت‌ها را می‌برند."],["Weigh even if you think you won.","حتی اگر فکر می‌کنی بردی بسنج."]],
"debate",180],
["C2","high-stakes-negotiation","High-Stakes Negotiation","مذاکره پرریسک",
"Negotiate under pressure with grace.","زیر فشار با وقار مذاکره کن.",
"Handle interruptions, doubt, and deadlines. Hold your line, trade smartly, close or walk away cleanly.","وقفه، تردید و ددلاین را مدیریت کن. بایست، هوشمند مبادله کن و تمیز ببند یا برو.",
"Your firm must win the contract tonight.","شرکتت امشب باید قرارداد را ببرد.",
"You are lead negotiator.","تو مذاکره‌کننده ارشد هستی.",
"Protect interests without breaking rapport.","منافع را بدون شکستن رابطه حفظ کن.",
[["Pressure never breaks politeness.","فشار هرگز ادب را نشکند."],["Every concession is priced and traded.","هر امتیازی قیمت‌گذاری و مبادله شود."]],
[["Name pressure calmly: I feel the clock too.","فشار را آرام نام ببر."],["Never split the difference blindly.","کورکورانه وسط را نگیر."]],
"negotiation",180],
["C2","keynote-speech","Deliver a Keynote","سخنرانی اصلی انجام بده",
"Give a memorable 4-minute keynote.","سخنرانی اصلی چهار‌دقیقه‌ای ماندگار انجام بده.",
"Open with a story, build three pillars with one device each, land a quotable close.","با داستان شروع کن، سه ستون هر کدام با یک ابزار بساز و پایان نقل‌کردنی بنشان.",
"Theme: What school never taught me.","موضوع: آنچه مدرسه هرگز به من نیاموخت.",
"You are the closing speaker.","تو سخنران پایانی هستی.",
"Move a room to reflection and action.","اتاقی را به تأمل و اقدام وادار کن.",
[["Three rhetorical devices are used well.","سه ابزار بلاغی خوب به کار رود."],["The close is quotable in one line.","پایان در یک خط نقل‌کردنی باشد."]],
[["Write for the ear: short, spoken, paused.","برای گوش بنویس: کوتاه، گفتاری و مکث‌دار."],["Rehearse standing, at full voice.","ایستاده و با صدای کامل تمرین کن."]],
"public-speaking",180],
["C2","rhetorical-defense","Mount a Rhetorical Defense","دفاع بلاغی بکن",
"Defend an unpopular view beautifully.","از نظر نامحبوبی زیبا دفاع کن.",
"Defend a view the room dislikes: concede its costs, reframe its value, answer the hardest question first.","از نظری که اتاق دوست ندارد دفاع کن: هزینه‌هایش را بپذیر، ارزشش را بازقاب کن و به سخت‌ترین سؤال اول جواب بده.",
"You defend: Exams should be harder.","تو دفاع می‌کنی: امتحان‌ها باید سخت‌تر شوند.",
"You are the principled dissenter.","تو مخالف اصول‌مندی هستی.",
"Earn respect without winning votes.","احترام به دست بیاور بدون بردن رأی.",
[["Costs are conceded before values.","پیش از ارزش‌ها، هزینه‌ها پذیرفته شود."],["The hardest question is faced first.","به سخت‌ترین سؤال اول جواب داده شود."]],
[["Love the room that boos you.","اتاقی که هوت می‌کند را دوست داشته باش."],["End with what you share, not split.","با مشترکات تمام کن نه اختلافات."]],
"dissent",180],
];

/* ============================= WRITING (18) ============================= */
/* Row: [level, slugSuffix, titleEn, titleFa, promptEn, promptFa, topic, taskType,
 *       instrEn, instrFa, audience, purpose, register, recLength,
 *       [features...], [[critEn, critFa] x2]] */

function buildWriting(rows, lessonKeysByLevel) {
  const seenPerLevel = new Map();
  return rows.map(([level, suffix, tEn, tFa, pEn, pFa, topic, taskType, iEn, iFa, audience, purpose, register, recLen, features, crit], i) => {
    const lvl = String(level).toUpperCase();
    const slug = `${lvl.toLowerCase()}-writing-${suffix}`;
    const n = seenPerLevel.get(lvl) ?? 0;
    seenPerLevel.set(lvl, n + 1);
    const lessonKeys = lessonKeysByLevel.get(lvl) || [];
    return {
      _key: slug,
      _level: lvl,
      _lessonKey: lessonKeys.length ? lessonKeys[n % lessonKeys.length] : null,
      slug,
      title: L(tFa, tEn),
      prompt: L(pFa, pEn),
      level: lvl,
      topic,
      taskType,
      instructions: L(iFa, iEn),
      audience,
      purpose,
      register,
      recommendedLength: recLen,
      targetLanguage: "en",
      targetLanguageFeatures: features,
      evaluationCriteria: crit.map(([cEn, cFa]) => L(cFa, cEn)),
      order: i,
      status: "published",
    };
  });
}

const WRITING_ROWS = [
["A1","form-personal-details","Personal Details Form","فرم مشخصات فردی",
"Fill in a form with your name, age, city, and phone number.","فرمی را با نام، سن، شهر و شماره تلفن پر کنید.","forms","form",
"Copy the form. Write one answer per line. Check spelling of your name and city.","فرم را کپی کنید. هر خط یک جواب. املای نام و شهر را بررسی کنید.",
"school office","identification","neutral","4-6 lines",
["be-verb", "capitalisation", "numbers"],
[["All fields are complete and spelled correctly.","همه فیلدها کامل و املا درست باشد."],["Capitals are used for names and cities.","برای نام‌ها و شهرها حرف بزرگ به کار رود."]]],
["A1","message-meet-friend","Message to Meet a Friend","پیام برای دیدن دوست",
"Write a short message inviting a friend on Friday.","پیام کوتاهی بنویسید و دوستی را جمعه دعوت کنید.","messages","simple message",
"Write 3-4 lines: greeting, invitation, time, goodbye. Use please and an emoji-free polite tone.","۳ تا ۴ خط بنویسید: سلام، دعوت، ساعت و خداحافظی. از please استفاده کنید.",
"a friend","invitation","informal","30-50 words",
["invitations", "time phrases", "polite requests"],
[["Time and place are stated.","زمان و مکان گفته شود."],["Tone is friendly and polite.","لحن دوستانه و مؤدبانه باشد."]]],
["A1","describe-room","Describe Your Room","اتاقت را توصیف کن",
"Describe your room in five sentences.","اتاقت را در پنج جمله توصیف کن.","home","basic description",
"Use there is / there are and two prepositions (on, under, next to). One idea per sentence.","از there is و there are و دو حرف اضافه مکان استفاده کنید. هر جمله یک ایده.",
"classmates","description","neutral","50-70 words",
["there-is-are", "prepositions of place", "furniture words"],
[["Five correct there is/are sentences.","پنج جمله درست there is/are."],["Prepositions are used correctly.","حروف اضافه درست به کار رود."]]],
["A2","email-thank-host","Thank-You Email","ایمیل تشکر",
"Thank a host family for a weekend visit.","از خانواده میزبان برای دیدار آخر هفته تشکر کنید.","travel","email",
"Write 80-100 words: thanks, two things you enjoyed, safe-arrival news, warm close.","۸۰ تا ۱۰۰ واژه بنویسید: تشکر، دو چیزی که لذت بردید، خبر رسیدن سالم و پایان گرم.",
"host family","thanks","polite neutral","80-100 words",
["past simple", "thank-you phrases", "email layout"],
[["Email has greeting, body, close.","ایمیل سلام، متن و پایان داشته باشد."],["Past simple verbs are correct.","فعل‌های گذشته ساده درست باشند."]]],
["A2","note-apology","Apology Note","یادداشت عذرخواهی",
"Apologise for missing a friend's party.","بابت از دست دادن مهمانی دوست عذرخواهی کنید.","relationships","short note",
"Write 60-80 words: apology, short reason, promise or repair, warm line.","۶۰ تا ۸۰ واژه بنویسید: عذرخواهی، دلیل کوتاه، قول یا جبران و خط گرم.",
"a friend","apology","friendly","60-80 words",
["apology phrases", "past simple", "will-promises"],
[["A clear sorry opens the note.","یادداشت با عذرخواهی روشن شروع شود."],["A repair or promise is offered.","جبران یا قولی پیشنهاد شود."]]],
["A2","describe-person","Describe a Person","آدمی را توصیف کن",
"Describe a family member's looks and character.","ظاهر و شخصیت عضو خانواده‌ای را توصیف کنید.","people","personal description",
"Write 80-100 words: who, appearance (have), character (be), one habit, why you like them.","۸۰ تا ۱۰۰ واژه: کی، ظاهر با have، شخصیت با be، یک عادت و چرا دوستش دارید.",
"classmates","description","neutral","80-100 words",
["have-vs-be", "adjectives", "frequency adverbs"],
[["Appearance and character are both covered.","ظاهر و شخصیت هر دو پوشش داده شود."],["have/be are used correctly.","have و be درست به کار رود."]]],
["B1","paragraph-opinion","Opinion Paragraph","پاراگراف نظر",
"Give your view: Is city life better?","نظرت را بگو: آیا زندگی شهری بهتر است؟","society","opinion paragraph",
"Write 120-150 words: clear view, two reasons, one example, short conclusion.","۱۲۰ تا ۱۵۰ واژه: نظر روشن، دو دلیل، یک مثال و نتیجه کوتاه.",
"class readers","persuasion","neutral","120-150 words",
["opinion phrases", "reason linkers", "present simple"],
[["The view is stated in sentence one.","نظر در جمله اول گفته شود."],["Two reasons plus an example support it.","دو دلیل به‌علاوه یک مثال حمایت کند."]]],
["B1","email-advice","Advice Email","ایمیل توصیه",
"Advise a friend who wants to quit English.","به دوستی که می‌خواهد انگلیسی را ول کند توصیه کنید.","relationships","informal email",
"Write 120-150 words: empathy, two suggestions with reasons, encouragement to close.","۱۲۰ تا ۱۵۰ واژه: همدلی، دو پیشنهاد با دلیل و تشویق در پایان.",
"a friend","advice","friendly","120-150 words",
["should", "reason linkers", "encouragement"],
[["Each suggestion has a reason.","هر پیشنهاد دلیلی داشته باشد."],["Tone stays supportive, not bossy.","لحن حمایتی بماند نه دستوری."]]],
["B1","review-place","Place Review","نقد مکان",
"Review a cafe, park, or shop honestly.","کافه، پارک یا مغازه‌ای را صادانه نقد کنید.","culture","review",
"Write 120-150 words: what/where, one strength, one weakness, recommendation with stars.","۱۲۰ تا ۱۵۰ واژه: چه/کجا، یک قوت، یک ضعف و توصیه با ستاره.",
"online readers","review","neutral","120-150 words",
["contrast linkers", "descriptive adjectives", "recommendations"],
[["Strength and weakness are balanced.","قوت و ضعف متعادل باشد."],["A clear verdict ends the review.","رأی روشنی نقد را تمام کند."]]],
["B2","essay-opinion","Opinion Essay","مقاله نظر",
"Phones in schools: ban or allow? Argue your case.","گوشی در مدرسه: ممنوع یا مجاز؟ از موضعت دفاع کن.","society","essay",
"Write 220-260 words: introduction with thesis, two body paragraphs, concession, conclusion.","۲۲۰ تا ۲۶۰ واژه: مقدمه با تز، دو پاراگراف بدنه، پذیرش و نتیجه.",
"general readers","argumentation","neutral-formal","220-260 words",
["thesis statements", "discourse markers", "concession"],
[["Thesis, reasons, concession, conclusion present.","تز، دلیل، پذیرش و نتیجه present باشد."],["Markers guide the reader throughout.","نشانگرها در کل خواننده را راهنمایی کند."]]],
["B2","report-survey","Survey Report","گزارش نظرسنجی",
"Report a class survey on free time.","نظرسنجی کلاس درباره اوقات فراغت را گزارش کنید.","work","report",
"Write 200-240 words: aim, method, three findings with numbers, one recommendation.","۲۰۰ تا ۲۴۰ واژه: هدف، روش، سه یافته با عدد و یک توصیه.",
"teacher / manager","information","neutral-formal","200-240 words",
["passive voice", "trend language", "report structure"],
[["Findings carry real numbers.","یافته‌ها اعداد واقعی داشته باشند."],["Passive and headings are used well.","مجهول و سرفصل‌ها خوب به کار رود."]]],
["B2","email-formal-request","Formal Request Email","ایمیل درخواست رسمی",
"Request a fee discount from an institute.","از آموزشگاهی درخواست تخفیف شهریه کنید.","work","formal email",
"Write 150-180 words: polite opening, background, clear request, thanks and close.","۱۵۰ تا ۱۸۰ واژه: شروع مؤدبانه، زمینه، درخواست روشن و تشکر و پایان.",
"institute manager","request","formal","150-180 words",
["formal register", "request phrases", "email conventions"],
[["Register stays formal throughout.","سبک در کل رسمی بماند."],["The request is specific and polite.","درخواست مشخص و مؤدبانه باشد."]]],
["C1","essay-argumentative","Argumentative Essay","مقاله استدلالی",
"Should short flights be banned? Argue rigorously.","آیا پروازهای کوتاه باید ممنوع شود؟ دقیق استدلال کن.","policy","argumentative essay",
"Write 350-400 words: thesis, three pillars, concession-refutation, implications.","۳۵۰ تا ۴۰۰ واژه: تز، سه ستون، پذیرش-رد و پیامدها.",
"educated readers","persuasion","formal","350-400 words",
["nominalisation", "concession-refutation", "complex clauses"],
[["Concession is honest and refuted fairly.","پذیرش صادانه و منصفانه رد شود."],["Nominal and complex structures appear.","ساختارهای اسمی و پیچیده دیده شود."]]],
["C1","report-analytical","Analytical Report","گزارش تحلیلی",
"Analyse why sales fell last quarter.","تحلیل کنید چرا فروش فصل گذشته افتاد.","business","formal report",
"Write 300-350 words with BLUF: recommendation first, then evidence and risks.","۳۰۰ تا ۳۵۰ واژه با BLUF: اول توصیه، بعد شواهد و ریسک‌ها.",
"executives","decision support","formal","300-350 words",
["BLUF structure", "passive reporting", "hedging"],
[["The recommendation leads the report.","توصیه در ابتدای گزارش باشد."],["Claims are hedged to the evidence.","ادعاها متناسب با شواهد محتاط شود."]]],
["C1","proposal-project","Project Proposal","پیشنهاد پروژه",
"Propose a staff English programme.","برنامه انگلیسی کارکنان را پیشنهاد دهید.","business","proposal",
"Write one page: need, plan, cost, risks, next step. Decision-makers must vote yes/no.","یک صفحه: نیاز، برنامه، هزینه، ریسک و گام بعد. تصمیم‌گیران باید بله/نه بگویند.",
"directors","approval","formal","one page",
["proposals", "cost language", "call to action"],
[["Cost and next step are explicit.","هزینه و گام بعد صریح باشد."],["One page forces ruthless clarity.","یک صفحه شفافیت بی‌رحمانه می‌طلبد."]]],
["C2","essay-critical-response","Critical Response Essay","مقاله پاسخ انتقادی",
"Respond to: Certainty is the enemy of thought.","پاسخ دهید: قطعیت دشمن اندیشه است.","ideas","critical essay",
"Write 450-500 words: interpret the claim, argue with nuance, concede limits, conclude originally.","۴۵۰ تا ۵۰۰ واژه: ادعا را تفسیر کنید، با ظرافت استدلال کنید، محدودیت‌ها را بپذیرید و اصیل نتیجه بگیرید.",
"academic readers","critique","formal academic","450-500 words",
["nuance", "hedging-boosting", "rhetorical grammar"],
[["The claim is interpreted, not repeated.","ادعا تفسیر شود نه تکرار."],["Voice is personal yet scholarly.","صدا شخصی ولی دانشگاهی باشد."]]],
["C2","paper-briefing","Briefing Paper","یادداشت توجیهی",
"Brief a minister on river sharing.","وزیری را درباره تقسیم رودخانه توجیه کنید.","policy","briefing paper",
"Write 400 words: problem in 100, options with trade-offs, one recommendation. No slogans.","۴۰۰ واژه: مشکل در ۱۰۰ واژه، گزینه‌ها با بده‌بستان و یک توصیه. بدون شعار.",
"a minister","decision","formal official","400 words",
["trade-off analysis", "precision", "recommendations"],
[["Trade-offs are explicit for each option.","بده‌بستان هر گزینه صریح باشد."],["The ask fits one sentence.","درخواست در یک جمله بگنجد."]]],
["C2","speech-persuasive","Persuasive Speech (Text)","متن سخنرانی اقناعی",
"Write a 3-minute speech: fund school libraries.","متن سخنرانی ۳دقیقه‌ای بنویسید: تأمین بودجه کتابخانه مدارس.","rhetoric","speech text",
"Write for the ear: story opening, three pillars, quotable close. Mark two pauses.","برای گوش بنویسید: شروع داستانی، سه ستون و پایان نقل‌کردنی. دو مکث علامت بزنید.",
"live audience","persuasion","oral formal","350-400 words",
["rhetorical devices", "oral style", "stylistic inversion"],
[["Two devices are used with restraint.","دو ابزار با خویشتن‌داری به کار رود."],["The text reads aloud in ~3 minutes.","متن در حدود ۳ دقیقه خوانده شود."]]],
];

/* ================= PRACTICE SETS (96) + EXERCISES (192) ================= */
/* One set per lesson (derived). Two hand-authored exercises per set.
 * Row: [lessonSlug, type, promptEn, promptFa, instrEn|null, instrFa|null, payload]
 *   mc:       [ [[id,en,fa]...], correctId ]
 *   fill:     [ [accepted...], caseSensitive ]
 *   matching: [ [[id,en,fa]...left], [[id,en,fa]...right], [[leftId,rightId]...] ]
 *   ordering: [ [[id,en,fa]...], [correctOrderIds...] ] */

function buildPracticeSets(lessons) {
  return lessons.map((lesson) => ({
    _key: `${lesson._key}-practice`,
    _lessonKey: lesson._key,
    _lessonId: null,
    slug: `${lesson.slug}-practice`,
    title: L(`تمرین: ${lesson.title.fa}`, `Practice: ${lesson.title.en}`),
    description: L(`تمرین درس «${lesson.title.fa}».`, `Practice for the lesson “${lesson.title.en}”.`),
    order: 0,
    status: "published",
  }));
}

function buildExercises(rows) {
  const orderPerSet = new Map();
  return rows.map(([lessonSlug, type, pEn, pFa, iEn, iFa, payload]) => {
    const setKey = `${lessonSlug}-practice`;
    const order = orderPerSet.get(setKey) ?? 0;
    orderPerSet.set(setKey, order + 1);
    const doc = {
      _key: `${setKey}#${order}`,
      _setKey: setKey,
      _practiceSetId: null,
      prompt: L(pFa, pEn),
      order,
      status: "published",
      exerciseType: type,
    };
    if (iEn) doc.instruction = L(iFa, iEn);
    if (type === "multiple-choice") {
      const [options, correctOptionId] = payload;
      doc.options = options.map(([id, en, fa]) => ({ id, label: L(fa, en) }));
      doc.correctOptionId = correctOptionId;
    } else if (type === "fill-blank") {
      const [acceptedAnswers, caseSensitive] = payload;
      doc.acceptedAnswers = acceptedAnswers;
      doc.caseSensitive = !!caseSensitive;
    } else if (type === "matching") {
      const [left, right, pairs] = payload;
      doc.leftItems = left.map(([id, en, fa]) => ({ id, label: L(fa, en) }));
      doc.rightItems = right.map(([id, en, fa]) => ({ id, label: L(fa, en) }));
      doc.pairs = pairs.map(([leftId, rightId]) => ({ leftId, rightId }));
    } else if (type === "ordering") {
      const [items, correctOrder] = payload;
      doc.items = items.map(([id, en, fa]) => ({ id, label: L(fa, en) }));
      doc.correctOrder = correctOrder;
    }
    return doc;
  });
}

const I_FILL = ["Type the missing word.", "واژه جاافتاده را بنویسید."];
const I_MATCH = ["Match each item with its pair.", "هر مورد را به جفتش وصل کنید."];
const I_ORDER = ["Put the words in the correct order.", "واژه‌ها را به ترتیب درست بچینید."];

const EXERCISE_ROWS = [
["a1-u1-meet-l1","multiple-choice","It is 8 in the morning. What do you say?","ساعت ۸ صبح است. چه می‌گویید؟",null,null,
 [[["o1","Good morning.","صبح بخیر."],["o2","Good night.","شب بخیر."],["o3","Goodbye.","خداحافظ."],["o4","Good evening.","عصر بخیر."]],"o1"]],
["a1-u1-meet-l1","fill-blank","Complete the greeting: “___ evening!” (at night)","سلام را کامل کنید: «… عصر!» (شب)",I_FILL[0],I_FILL[1],[["Good evening","good evening"],false]],
["a1-u1-meet-l2","matching","Match the pronoun with be.","ضمیر را به be وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","I","من"],["l2","She","او (مؤنث)"],["l3","They","آن‌ها"]],[["r1","am","am"],["r2","is","is"],["r3","are","are"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a1-u1-meet-l2","ordering","Order the introduction.","معرفی را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","I","من"],["w2","am","هستم"],["w3","a","یک"],["w4","student.","دانش‌آموز."]],["w1","w2","w3","w4"]]],
["a1-u1-meet-l3","fill-blank","___ is your name? (What)","… نام شما چیست؟",I_FILL[0],I_FILL[1],[["What","what"],false]],
["a1-u1-meet-l3","multiple-choice","___ do you live?","کجا زندگی می‌کنید؟",null,null,
 [[["o1","Where","کجا"],["o2","What","چه"],["o3","Who","کی"],["o4","How","چطور"]],"o1"]],
["a1-u1-meet-l4","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","My","نام"],["w2","name","من"],["w3","is","است"],["w4","Sara.","سارا."]],["w1","w2","w3","w4"]]],
["a1-u1-meet-l4","matching","Match greeting to time.","سلام را به زمان وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","Good morning","صبح بخیر"],["l2","Good afternoon","ظهر بخیر"],["l3","Good evening","عصر بخیر"]],[["r1","morning","صبح"],["r2","afternoon","ظهر"],["r3","evening","عصر"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a1-u2-daily-l1","multiple-choice","She ___ tea every morning.","او هر صبح چای می‌نوشد.",null,null,
 [[["o1","drinks","می‌نوشد"],["o2","drink","بنوش"],["o3","drinking","نوشیدن"],["o4","drinkes","درینکس"]],"o1"]],
["a1-u2-daily-l1","fill-blank","He ___ to work at 7. (go)","او ساعت ۷ سر کار می‌رود.",I_FILL[0],I_FILL[1],[["goes","Goes"],false]],
["a1-u2-daily-l2","matching","Match with at / on / in.","با at و on و in جفت کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","7 o'clock","ساعت هفت"],["l2","Monday","دوشنبه"],["l3","the morning","صبح"]],[["r1","at","at"],["r2","on","on"],["r3","in","in"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a1-u2-daily-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","The","کلاس"],["w2","class","مقاله"],["w3","is","است"],["w4","at nine.","ساعت نه."]],["w1","w2","w3","w4"]]],
["a1-u2-daily-l3","fill-blank","What ___ you do? (ask about job)","چه کار می‌کنی؟",I_FILL[0],I_FILL[1],[["do","Do"],false]],
["a1-u2-daily-l3","multiple-choice","She is a ___. She teaches.","او … است. درس می‌دهد.",null,null,
 [[["o1","teacher","معلم"],["o2","driver","راننده"],["o3","cook","آشپز"],["o4","farmer","کشاورز"]],"o1"]],
["a1-u2-daily-l4","ordering","Order the routine.","برنامه را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","I","من"],["w2","wake up","بیدار می‌شوم"],["w3","at","در"],["w4","six.","شش."]],["w1","w2","w3","w4"]]],
["a1-u2-daily-l4","matching","Match routine to time.","کار را به زمان وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","wake up","بیدار شدن"],["l2","lunch","ناهار"],["l3","sleep","خواب"]],[["r1","morning","صبح"],["r2","noon","ظهر"],["r3","night","شب"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a1-u3-home-l1","multiple-choice","___ name is Laleh. (my sister)","نام … لاله است. (خواهرم)",null,null,
 [[["o1","Her","او (مؤنث)"],["o2","His","او (مذکر)"],["o3","My","من"],["o4","Their","آن‌ها"]],"o1"]],
["a1-u3-home-l1","fill-blank","Sara___ brother is Ali. (possessive ’s)","برادر سارا علی است.",I_FILL[0],I_FILL[1],[["'s","’s"],false]],
["a1-u3-home-l2","matching","Match room to action.","اتاق را به کار وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","kitchen","آشپزخانه"],["l2","bedroom","اتاق خواب"],["l3","bathroom","حمام"]],[["r1","cook","پختن"],["r2","sleep","خوابیدن"],["r3","wash","شستن"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a1-u3-home-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","There","هست"],["w2","is","است"],["w3","a","یک"],["w4","lamp.","چراغ."]],["w1","w2","w3","w4"]]],
["a1-u3-home-l3","fill-blank","I ___ like hot food. (negative)","غذای تند دوست ندارم.",I_FILL[0],I_FILL[1],[["don't","do not","dont"],false]],
["a1-u3-home-l3","multiple-choice","___ you like some tea?","چای می‌خواهی؟",null,null,
 [[["o1","Would","آیا"],["o2","Do","آیا"],["o3","Does","آیا"],["o4","Are","آیا"]],"o1"]],
["a1-u3-home-l4","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","There","هست"],["w2","are","هستند"],["w3","two","دو"],["w4","chairs.","صندلی."]],["w1","w2","w3","w4"]]],
["a1-u3-home-l4","matching","Match meal to time.","وعده را به زمان وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","breakfast","صبحانه"],["l2","lunch","ناهار"],["l3","dinner","شام"]],[["r1","morning","صبح"],["r2","noon","ظهر"],["r3","evening","عصر"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a1-u4-town-l1","multiple-choice","Is there ___ milk?","شیر هست؟",null,null,
 [[["o1","any","هیچ"],["o2","some","چند"],["o3","many","زیاد"],["o4","much","زیاد"]],"o1"]],
["a1-u4-town-l1","fill-blank","How ___ is it? (price)","قیمتش چند است؟",I_FILL[0],I_FILL[1],[["much","Much"],false]],
["a1-u4-town-l2","matching","Match number to word.","عدد را به واژه وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","20","۲۰"],["l2","30","۳۰"],["l3","100","۱۰۰"]],[["r1","twenty","بیست"],["r2","thirty","سی"],["r3","one hundred","صد"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a1-u4-town-l2","ordering","Order the price.","قیمت را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","They","آن‌ها"],["w2","are","هستند"],["w3","twenty","بیست"],["w4","thousand.","هزار."]],["w1","w2","w3","w4"]]],
["a1-u4-town-l3","fill-blank","___ straight. (imperative: Go)","مستقیم برو.",I_FILL[0],I_FILL[1],[["Go","go"],false]],
["a1-u4-town-l3","multiple-choice","The bank is ___ the bakery.","بانک … نانوایی است.",null,null,
 [[["o1","next to","کنار"],["o2","under","زیر"],["o3","between","میان"],["o4","into","به درون"]],"o1"]],
["a1-u4-town-l4","ordering","Order the question.","سؤال را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Where","کجاست"],["w2","is","است"],["w3","the","همان"],["w4","bank?","بانک؟"]],["w1","w2","w3","w4"]]],
["a1-u4-town-l4","matching","Match phrase to use.","عبارت را به کاربرد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","How much?","چقدر؟"],["l2","Here you are.","بفرما."],["l3","Thank you.","ممنون."]],[["r1","price","قیمت"],["r2","giving","دادن"],["r3","thanks","تشکر"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a2-u1-past-l1","multiple-choice","We ___ our uncle yesterday.","دیروز به عمویمان سر زدیم.",null,null,
 [[["o1","visited","سر زدیم"],["o2","visit","سر می‌زنیم"],["o3","visits","سر می‌زند"],["o4","visiting","سر زدن"]],"o1"]],
["a2-u1-past-l1","fill-blank","She ___ home late. (go → past)","او دیر به خانه رفت.",I_FILL[0],I_FILL[1],[["went","Went"],false]],
["a2-u1-past-l2","matching","Match base verb to past.","مصدر را به گذشته وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","go","رفتن"],["l2","eat","خوردن"],["l3","see","دیدن"]],[["r1","went","رفت"],["r2","ate","خورد"],["r3","saw","دید"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a2-u1-past-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Then","بعد"],["w2","we","ما"],["w3","swam","شنا کردیم"],["w4","in","در"],["w5","the","همان"],["w6","lake.","دریاچه."]],["w1","w2","w3","w4","w5","w6"]]],
["a2-u1-past-l3","fill-blank","I was ___ home when I saw a dog. (walk)","داشتم به خانه می‌رفتم که سگی دیدم.",I_FILL[0],I_FILL[1],[["walking","Walking"],false]],
["a2-u1-past-l3","multiple-choice","The opposite of “first” at a story ending is ___.","متضاد «اول» در پایان داستان … است.",null,null,
 [[["o1","finally","سرانجام"],["o2","suddenly","ناگهان"],["o3","then","بعد"],["o4","when","وقتی"]],"o1"]],
["a2-u1-past-l4","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","We","ما"],["w2","travelled","سفر کردیم"],["w3","two","دو"],["w4","years","سال"],["w5","ago.","پیش."]],["w1","w2","w3","w4","w5"]]],
["a2-u1-past-l4","matching","Match base verb to past.","مصدر را به گذشته وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","drink","نوشیدن"],["l2","write","نوشتن"],["l3","take","بردن"]],[["r1","drank","نوشید"],["r2","wrote","نوشت"],["r3","took","برد"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a2-u2-plans-l1","multiple-choice","I ___ going to visit my grandmother.","می‌خواهم به مادربزرگم سر بزنم.",null,null,
 [[["o1","am","هستم"],["o2","is","است"],["o3","are","هستیم"],["o4","be","باش"]],"o1"]],
["a2-u2-plans-l1","fill-blank","They ___ going to come. (negative)","آن‌ها نمی‌خواهند بیایند.",I_FILL[0],I_FILL[1],[["aren't","are not","arent"],false]],
["a2-u2-plans-l2","matching","Match adjective to comparative.","صفت را به تفضیلی وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","cheap","ارزان"],["l2","big","بزرگ"],["l3","good","خوب"]],[["r1","cheaper","ارزان‌تر"],["r2","bigger","بزرگ‌تر"],["r3","better","بهتر"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a2-u2-plans-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","The","همان"],["w2","plane","هواپیما"],["w3","is","است"],["w4","faster","سریع‌تر"],["w5","than","از"],["w6","buses.","اتوبوس‌ها."]],["w1","w2","w3","w4","w5","w6"]]],
["a2-u2-plans-l3","fill-blank","I ___ help you. (promise)","کمکت می‌کنم. (قول)",I_FILL[0],I_FILL[1],[["will","'ll","Will"],false]],
["a2-u2-plans-l3","multiple-choice","Which sentence is a promise?","کدام جمله قول است؟",null,null,
 [[["o1","I will call tonight.","امشب زنگ می‌زنم."],["o2","I called last night.","دیشب زنگ زدم."],["o3","I call every day.","هر روز زنگ می‌زنم."],["o4","I am calling now.","الان دارم زنگ می‌زنم."]],"o1"]],
["a2-u2-plans-l4","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","I","من"],["w2","am","هستم"],["w3","going","خواهان"],["w4","to","به"],["w5","study.","درس خواندن."]],["w1","w2","w3","w4","w5"]]],
["a2-u2-plans-l4","matching","Match sentence to use.","جمله را به کاربرد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","I will help.","کمک می‌کنم."],["l2","Going to travel.","می‌خواهم سفر کنم."],["l3","It will rain.","باران می‌بارد."]],[["r1","promise","قول"],["r2","plan","برنامه"],["r3","prediction","پیش‌بینی"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a2-u3-people-l1","multiple-choice","She ___ long hair.","موهای بلندی دارد.",null,null,
 [[["o1","has","دارد"],["o2","is","است"],["o3","are","هستند"],["o4","have","دارند"]],"o1"]],
["a2-u3-people-l1","fill-blank","He ___ tall and kind. (be)","او قدبلند و مهربان است.",I_FILL[0],I_FILL[1],[["is","Is"],false]],
["a2-u3-people-l2","matching","Match adverb to percent.","قید را به درصد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","always","همیشه"],["l2","sometimes","گاهی"],["l3","never","هرگز"]],[["r1","100%","۱۰۰٪"],["r2","50%","۵۰٪"],["r3","0%","۰٪"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a2-u3-people-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","We","ما"],["w2","usually","معمولاً"],["w3","drink","می‌نوشیم"],["w4","tea.","چای."]],["w1","w2","w3","w4"]]],
["a2-u3-people-l3","fill-blank","Would you like ___ come?","می‌آیی؟",I_FILL[0],I_FILL[1],[["to","To"],false]],
["a2-u3-people-l3","multiple-choice","Sorry, I ___. I am busy.","متأسفم، نمی‌توانم. سرم شلوغ است.",null,null,
 [[["o1","can't","نمی‌توانم"],["o2","can","می‌توانم"],["o3","am","هستم"],["o4","do","می‌کنم"]],"o1"]],
["a2-u3-people-l4","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","My","برادر"],["w2","brother","من"],["w3","is","است"],["w4","taller","قدبلندتر"],["w5","than","از"],["w6","me.","من."]],["w1","w2","w3","w4","w5","w6"]]],
["a2-u3-people-l4","matching","Match phrase to function.","عبارت را به کاربرد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","I am sorry.","متأسفم."],["l2","Come to dinner.","به شام بیا."],["l3","Thank you.","ممنون."]],[["r1","apology","عذرخواهی"],["r2","invitation","دعوت"],["r3","thanks","تشکر"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a2-u4-travel-l1","multiple-choice","Could you ___ me, please?","می‌توانید کمکم کنید؟",null,null,
 [[["o1","help","کمک"],["o2","helping","کمک کردن"],["o3","to help","برای کمک"],["o4","helps","کمک می‌کند"]],"o1"]],
["a2-u4-travel-l1","fill-blank","I have a ___. My name is Karimi. (reservation)","رزرو دارم. نامم کریمی است.",I_FILL[0],I_FILL[1],[["reservation","Reservation"],false]],
["a2-u4-travel-l2","matching","Match word to meaning.","واژه را به معنا وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","menu","منو"],["l2","bill","صورت‌حساب"],["l3","waiter","گارسون"]],[["r1","list of food","فهرست غذا"],["r2","paper to pay","برگه پرداخت"],["r3","serves food","غذا می‌آورد"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["a2-u4-travel-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","I","من"],["w2","would","می‌خواهم"],["w3","like","دوست دارم"],["w4","the","همان"],["w5","chicken.","مرغ."]],["w1","w2","w3","w4","w5"]]],
["a2-u4-travel-l3","fill-blank","The ___ way is the plane. (fast → superlative)","سریع‌ترین راه هواپیماست.",I_FILL[0],I_FILL[1],[["fastest","Fastest"],false]],
["a2-u4-travel-l3","multiple-choice","Single or ___?","یک‌طرفه یا …؟",null,null,
 [[["o1","return","رفت‌وبرگشت"],["o2","back","پشت"],["o3","again","دوباره"],["o4","more","بیشتر"]],"o1"]],
["a2-u4-travel-l4","ordering","Order the exchange.","تبادل را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Which","کدام"],["w2","platform?","سکو؟"],["w3","Platform","سکوی"],["w4","three.","سه."]],["w1","w2","w3","w4"]]],
["a2-u4-travel-l4","matching","Match word to meaning.","واژه را به معنا وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","ticket","بلیت"],["l2","platform","سکو"],["l3","hotel","هتل"]],[["r1","travel paper","برگه سفر"],["r2","trains leave","قطارها می‌روند"],["r3","sleep place","جای خواب"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b1-u1-stories-l1","multiple-choice","I have ___ three countries.","سه کشور دیده‌ام.",null,null,
 [[["o1","visited","دیده‌ام"],["o2","visit","می‌بینم"],["o3","visiting","دیدن"],["o4","visits","می‌بیند"]],"o1"]],
["b1-u1-stories-l1","fill-blank","Have you ___ seen the desert?","تا حالا کویر دیده‌ای؟",I_FILL[0],I_FILL[1],[["ever","Ever"],false]],
["b1-u1-stories-l2","matching","Match tense to use.","زمان را به کاربرد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","past perfect","گذشته کامل"],["l2","past simple","گذشته ساده"],["l3","past continuous","گذشته استمراری"]],[["r1","earlier event","رویداد زودتر"],["r2","main event","رویداد اصلی"],["r3","background","زمینه"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b1-u1-stories-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","The","همان"],["w2","train","قطار"],["w3","had","بود"],["w4","already","قبلاً"],["w5","left.","رفته بود."]],["w1","w2","w3","w4","w5"]]],
["b1-u1-stories-l3","fill-blank","I have worked here ___ 2022.","از ۲۰۲۲ اینجا کار می‌کنم.",I_FILL[0],I_FILL[1],[["since","Since"],false]],
["b1-u1-stories-l3","multiple-choice","She has ___ passed the test.","او تازه قبول شده است.",null,null,
 [[["o1","just","تازه"],["o2","yesterday","دیروز"],["o3","ago","پیش"],["o4","last","گذشته"]],"o1"]],
["b1-u1-stories-l4","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","It","هوا"],["w2","was","بود"],["w3","raining","بارانی"],["w4","heavily.","شدید."]],["w1","w2","w3","w4"]]],
["b1-u1-stories-l4","matching","Match linker to use.","پیونددهنده را به کاربرد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","in the end","در پایان"],["l2","suddenly","ناگهان"],["l3","luckily","خوشبختانه"]],[["r1","finish","پایان"],["r2","surprise","غافلگیری"],["r3","good luck","شانس خوب"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b1-u2-opinions-l1","multiple-choice","I enjoy ___ at night.","از خواندن در شب لذت می‌برم.",null,null,
 [[["o1","reading","خواندن"],["o2","read","بخوان"],["o3","to read","برای خواندن"],["o4","reads","می‌خواند"]],"o1"]],
["b1-u2-opinions-l1","fill-blank","I want ___ travel.","می‌خواهم سفر کنم.",I_FILL[0],I_FILL[1],[["to","To"],false]],
["b1-u2-opinions-l2","matching","Match word to use.","واژه را به کاربرد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","who","که"],["l2","which","که"],["l3","where","کجا"]],[["r1","people","آدم‌ها"],["r2","things","چیزها"],["r3","places","مکان‌ها"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b1-u2-opinions-l2","ordering","Order the definition.","تعریف را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","A","یک"],["w2","teacher","معلم"],["w3","who","که"],["w4","explains","توضیح می‌دهد"],["w5","well.","خوب."]],["w1","w2","w3","w4","w5"]]],
["b1-u2-opinions-l3","fill-blank","I ___ with you.","با تو موافقم.",I_FILL[0],I_FILL[1],[["agree","Agree"],false]],
["b1-u2-opinions-l3","multiple-choice","Which is a SOFT disagreement?","کدام مخالفت نرم است؟",null,null,
 [[["o1","I see it differently.","جور دیگری می‌بینم."],["o2","You are wrong.","اشتباه می‌کنی."],["o3","Nonsense!","چرند!"],["o4","No!","نه!"]],"o1"]],
["b1-u2-opinions-l4","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","I","من"],["w2","prefer","ترجیح می‌دهم"],["w3","trains","قطارها"],["w4","to","به"],["w5","buses.","اتوبوس‌ها."]],["w1","w2","w3","w4","w5"]]],
["b1-u2-opinions-l4","matching","Match phrase to function.","عبارت را به کاربرد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","In my opinion","به نظر من"],["l2","because","چون"],["l3","for example","مثلاً"]],[["r1","opinion","نظر"],["r2","reason","دلیل"],["r3","example","مثال"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b1-u3-work-l1","multiple-choice","The rooms ___ cleaned daily.","اتاق‌ها روزانه تمیز می‌شوند.",null,null,
 [[["o1","are","هستند"],["o2","is","است"],["o3","be","باش"],["o4","been","بوده"]],"o1"]],
["b1-u3-work-l1","fill-blank","I have ___ answer emails.","باید به ایمیل‌ها جواب دهم.",I_FILL[0],I_FILL[1],[["to","To"],false]],
["b1-u3-work-l2","matching","Match direct to reported verb.","فعل مستقیم را به گزارش‌شده وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","am","هستم"],["l2","will","خواهم"],["l3","can","می‌توانم"]],[["r1","was","بود"],["r2","would","می‌کرد"],["r3","could","می‌توانست"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b1-u3-work-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","She","او"],["w2","said","گفت"],["w3","the","همان"],["w4","meeting","جلسه"],["w5","was moved.","منتقل شد."]],["w1","w2","w3","w4","w5"]]],
["b1-u3-work-l3","fill-blank","She ___ be tired. (sure it is true)","حتماً خسته است.",I_FILL[0],I_FILL[1],[["must","Must"],false]],
["b1-u3-work-l3","multiple-choice","It ___ rain tonight. (possible)","امشب شاید باران ببارد.",null,null,
 [[["o1","might","شاید"],["o2","must","حتماً"],["o3","can't","محال"],["o4","is","است"]],"o1"]],
["b1-u3-work-l4","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","The","همان"],["w2","report","گزارش"],["w3","was","شد"],["w4","sent.","ارسال."]],["w1","w2","w3","w4"]]],
["b1-u3-work-l4","matching","Match modal to meaning.","وجهی را به معنا وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","must","حتماً"],["l2","might","شاید"],["l3","can't","محال"]],[["r1","sure true","حتماً درست"],["r2","possible","ممکن"],["r3","sure false","حتماً غلط"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b1-u4-world-l1","multiple-choice","If I ___ time, I would travel.","اگر وقت داشتم سفر می‌کردم.",null,null,
 [[["o1","had","داشتم"],["o2","have","دارم"],["o3","will have","خواهم داشت"],["o4","has","دارد"]],"o1"]],
["b1-u4-world-l1","fill-blank","If we went in autumn, tickets ___ be cheaper.","اگر پاییز می‌رفتیم بلیت‌ها ارزان‌تر بود.",I_FILL[0],I_FILL[1],[["would","Would"],false]],
["b1-u4-world-l2","matching","Match custom to place.","رسم را به مکان وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","bow on meeting","تعظیم در دیدار"],["l2","tea first for guests","اول چای برای مهمان"],["l3","used to write letters","قبلاً نامه می‌نوشتند"]],[["r1","Japan","ژاپن"],["r2","Iran","ایران"],["r3","past habit","عادت گذشته"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b1-u4-world-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","People","مردم"],["w2","used","عادت داشتند"],["w3","to","به"],["w4","write","نوشتن"],["w5","letters.","نامه‌ها."]],["w1","w2","w3","w4","w5"]]],
["b1-u4-world-l3","fill-blank","___ the rain, we stayed.","با وجود باران ماندیم.",I_FILL[0],I_FILL[1],[["Despite","despite"],false]],
["b1-u4-world-l3","multiple-choice","The hotel was small; ___, it was clean.","هتل کوچک بود؛ اما تمیز بود.",null,null,
 [[["o1","however","اما"],["o2","because","چون"],["o3","so","پس"],["o4","and","و"]],"o1"]],
["b1-u4-world-l4","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","If","اگر"],["w2","I","من"],["w3","went","می‌رفتم"],["w4","to","به"],["w5","Brazil.","برزیل."]],["w1","w2","w3","w4","w5"]]],
["b1-u4-world-l4","matching","Match review part to content.","بخش نقد را به محتوا وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","context","زمینه"],["l2","highlights","برجسته‌ها"],["l3","verdict","رأی"]],[["r1","what/where","چه/کجا"],["r2","best moments","بهترین لحظه‌ها"],["r3","recommendation","توصیه"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b2-u1-ideas-l1","multiple-choice","___ importantly, children would be safer.","مهم‌تر از همه، بچه‌ها امن‌تر می‌شوند.",null,null,
 [[["o1","Most","ترین"],["o2","More","تر"],["o3","Much","زیاد"],["o4","Many","زیاد"]],"o1"]],
["b2-u1-ideas-l1","fill-blank","___ , air would be cleaner. (order a reason)","نخست، هوا پاک‌تر می‌شود.",I_FILL[0],I_FILL[1],[["Firstly","firstly"],false]],
["b2-u1-ideas-l2","matching","Match phrase to function.","عبارت را به کاربرد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","for example","مثلاً"],["l2","according to","طبق"],["l3","data shows","داده نشان می‌دهد"]],[["r1","example","مثال"],["r2","source","منبع"],["r3","numbers","اعداد"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b2-u1-ideas-l2","ordering","Order the cleft sentence.","جمله شکافته را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","It","این"],["w2","is","است"],["w3","the","همان"],["w4","evidence","شواهد"],["w5","that","که"],["w6","convinces.","قانع می‌کند."]],["w1","w2","w3","w4","w5","w6"]]],
["b2-u1-ideas-l3","fill-blank","___ , costs rise first. (concede)","بی‌تردید اول هزینه‌ها بالا می‌رود.",I_FILL[0],I_FILL[1],[["Admittedly","admittedly"],false]],
["b2-u1-ideas-l3","multiple-choice","Which concedes gracefully?","کدام با وقار می‌پذیرد؟",null,null,
 [[["o1","It is true that change is hard.","درست است که تغییر سخت است."],["o2","You are wrong.","اشتباه می‌کنی."],["o3","That is stupid.","احمقانه است."],["o4","No way.","محال."]],"o1"]],
["b2-u1-ideas-l4","ordering","Order the cleft sentence.","جمله شکافته را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","What","آنچه"],["w2","matters","مهم است"],["w3","most","ترین"],["w4","is","است"],["w5","safety.","امنیت."]],["w1","w2","w3","w4","w5"]]],
["b2-u1-ideas-l4","matching","Match debate part to meaning.","بخش مناظره را به معنا وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","claim","ادعا"],["l2","evidence","شواهد"],["l3","rebuttal","رد"]],[["r1","position","موضع"],["r2","proof","اثبات"],["r3","answer to opposition","پاسخ به مخالف"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b2-u2-work-l1","multiple-choice","Could we come ___ to that later?","می‌شود بعداً به آن برگردیم؟",null,null,
 [[["o1","back","بر"],["o2","behind","پشت"],["o3","after","پس"],["o4","again","دوباره"]],"o1"]],
["b2-u2-work-l1","fill-blank","Sorry to ___, but what do you mean?","ببخشید وسط حرفتان، منظورتان چیست؟",I_FILL[0],I_FILL[1],[["interrupt","Interrupt"],false]],
["b2-u2-work-l2","matching","Match signpost to place.","علامت را به جایگاه وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","Moving on","بریم سراغ"],["l2","To sum up","خلاصه"],["l3","Today I'll cover","امروز می‌گویم"]],[["r1","next point","نکته بعد"],["r2","conclusion","نتیجه"],["r3","opening","شروع"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b2-u2-work-l2","ordering","Order the signpost.","علامت را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Moving","رفتن"],["w2","on","به"],["w3","to","سوی"],["w4","sales.","فروش."]],["w1","w2","w3","w4"]]],
["b2-u2-work-l3","fill-blank","We should ___ checked the address.","باید آدرس را بررسی می‌کردیم.",I_FILL[0],I_FILL[1],[["have","Have"],false]],
["b2-u2-work-l3","multiple-choice","He ___ have forgotten. (sure it happened)","حتماً فراموش کرده است.",null,null,
 [[["o1","must","حتماً"],["o2","should","باید"],["o3","may","شاید"],["o4","can't","محال"]],"o1"]],
["b2-u2-work-l4","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","He","او"],["w2","suggested","پیشنهاد داد"],["w3","postponing","عقب انداختن"],["w4","the","همان"],["w5","launch.","رونمایی."]],["w1","w2","w3","w4","w5"]]],
["b2-u2-work-l4","matching","Match verb to meaning.","فعل را به معنا وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","suggest","پیشنهاد"],["l2","insist","اصرار"],["l3","deny","انکار"]],[["r1","propose idea","ایده دادن"],["r2","firm demand","خواست محکم"],["r3","say not true","نادرست دانستن"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b2-u3-society-l1","multiple-choice","Our data ___ collected daily.","داده‌های ما روزانه جمع می‌شود.",null,null,
 [[["o1","is","می‌شود"],["o2","are","می‌شوند"],["o3","be","باش"],["o4","been","شده"]],"o1"]],
["b2-u3-society-l1","fill-blank","Attention ___ sold to advertisers.","توجه به تبلیغ‌کننده‌ها فروخته می‌شود.",I_FILL[0],I_FILL[1],[["is","Is"],false]],
["b2-u3-society-l2","matching","Match verb to meaning.","فعل را به معنا وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","rise","بالا رفتن"],["l2","fall","افتادن"],["l3","double","دو برابر شدن"]],[["r1","go up","بالا رفتن"],["r2","go down","پایین رفتن"],["r3","×2","دو برابر"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b2-u3-society-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Having","پس از"],["w2","finished","تمام کردن"],["w3","the","همان"],["w4","survey,","نظرسنجی"],["w5","we","ما"],["w6","saw.","دیدیم."]],["w1","w2","w3","w4","w5","w6"]]],
["b2-u3-society-l3","fill-blank","If the metro had reached us, traffic ___ be lighter.","اگر مترو رسیده بود ترافیک سبک‌تر بود.",I_FILL[0],I_FILL[1],[["would","Would"],false]],
["b2-u3-society-l3","multiple-choice","Not only ___ housing dear.","نه‌تنها مسکن گران است.",null,null,
 [[["o1","is","است"],["o2","are","هستند"],["o3","be","باش"],["o4","being","بودن"]],"o1"]],
["b2-u3-society-l4","ordering","Order the inversion.","وارونگی را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Not","نه"],["w2","only","تنها"],["w3","is","است"],["w4","housing","مسکن"],["w5","dear.","گران."]],["w1","w2","w3","w4","w5"]]],
["b2-u3-society-l4","matching","Match passive to tense.","مجهول را به زمان وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","is tracked","ردیابی می‌شود"],["l2","has been leaked","لو رفته است"],["l3","will be regulated","قانونمند می‌شود"]],[["r1","present","حال"],["r2","present perfect","حال کامل"],["r3","future","آینده"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b2-u4-culture-l1","multiple-choice","The second act dragged ___.","پرده دوم کمی کش آمد.",null,null,
 [[["o1","slightly","کمی"],["o2","slight","کم"],["o3","slowness","کندی"],["o4","drag","کشش"]],"o1"]],
["b2-u4-culture-l1","fill-blank","The lighting was ___.","نورپردازی خیره‌کننده بود.",I_FILL[0],I_FILL[1],[["breathtaking","Breathtaking"],false]],
["b2-u4-culture-l2","matching","Match linker to function.","پیونددهنده را به کاربرد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","because","چون"],["l2","as a result","در نتیجه"],["l3","due to","به‌علت"]],[["r1","reason","علت"],["r2","effect","معلول"],["r3","reason phrase","عبارت علت"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["b2-u4-culture-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Due","به‌علت"],["w2","to","ِ"],["w3","drought,","خشکسالی"],["w4","supplies","عرضه"],["w5","fell.","افتاد."]],["w1","w2","w3","w4","w5"]]],
["b2-u4-culture-l3","fill-blank","The bazaar smelled ___ saffron.","بازار بوی زعفران می‌داد.",I_FILL[0],I_FILL[1],[["of","Of"],false]],
["b2-u4-culture-l3","multiple-choice","Which sentence shows the senses?","کدام جمله حس‌ها را نشان می‌دهد؟",null,null,
 [[["o1","crisp bread, sour cheese","نان برشته، پنیر ترش"],["o2","nice food","غذای خوب"],["o3","good meal","وعده خوب"],["o4","fine dish","غذای خوب"]],"o1"]],
["b2-u4-culture-l4","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","We","ما"],["w2","edit","ویرایش می‌کنیم"],["w3","reviews","نقدها"],["w4","and","و"],["w5","proposals.","پیشنهادها."]],["w1","w2","w3","w4","w5"]]],
["b2-u4-culture-l4","matching","Match text to purpose.","متن را به هدف وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","review","نقد"],["l2","proposal","پیشنهاد"],["l3","report","گزارش"]],[["r1","judge quality","داوری کیفیت"],["r2","suggest action","پیشنهاد اقدام"],["r3","present findings","ارائه یافته"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c1-u1-discourse-l1","multiple-choice","Prices rise → ___. (nominalisation)","بالا رفتن قیمت‌ها → …",null,null,
 [[["o1","inflation","تورم"],["o2","inflatement","اینفلیتمنت"],["o3","risement","رایزمنت"],["o4","costness","کاستنس"]],"o1"]],
["c1-u1-discourse-l1","fill-blank","Thesis → pillars → ___ → implications.","تز، ستون‌ها، … و پیامدها.",I_FILL[0],I_FILL[1],[["evidence","Evidence"],false]],
["c1-u1-discourse-l2","matching","Match move to function.","حرکت را به کاربرد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","while opponents note","هرچند مخالفان می‌گویند"],["l2","they overlook","نادیده می‌گیرند"],["l3","therefore","پس"]],[["r1","concede","پذیرش"],["r2","refute","رد"],["r3","conclude","نتیجه"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c1-u1-discourse-l2","ordering","Order the fronting.","پیش‌گذاری را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Equally","به‌همان‌اندازه"],["w2","important","مهم"],["w3","is","است"],["w4","the","همان"],["w5","timeline.","زمان‌بندی."]],["w1","w2","w3","w4","w5"]]],
["c1-u1-discourse-l3","fill-blank","“Dear Sir” signals ___ register.","«Dear Sir» سبک … را نشان می‌دهد.",I_FILL[0],I_FILL[1],[["formal","Formal"],false]],
["c1-u1-discourse-l3","multiple-choice","Which sentence is formal?","کدام جمله رسمی است؟",null,null,
 [[["o1","Kindly confirm receipt.","لطفاً دریافت را تأیید کنید."],["o2","Wanna grab lunch?","ناهار می‌خوری؟"],["o3","Thanks a lot!","خیلی ممنون!"],["o4","Got it.","گرفتم."]],"o1"]],
["c1-u1-discourse-l4","ordering","Order the pair.","جفت را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","People","مردم"],["w2","move","کوچ می‌کنند"],["w3","→","می‌شود"],["w4","migration.","مهاجرت."]],["w1","w2","w3","w4"]]],
["c1-u1-discourse-l4","matching","Match essay part to role.","بخش مقاله را به نقش وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","thesis","تز"],["l2","pillar","ستون"],["l3","implications","پیامدها"]],[["r1","main claim","ادعای اصلی"],["r2","supporting reason","دلیل پشتیبان"],["r3","results","نتایج"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c1-u2-academic-l1","multiple-choice","Which phrase hedges a claim?","کدام عبارت ادعا را محتاط می‌کند؟",null,null,
 [[["o1","may indicate","شاید نشان دهد"],["o2","proves","اثبات می‌کند"],["o3","certainly is","حتماً هست"],["o4","always","همیشه"]],"o1"]],
["c1-u2-academic-l1","fill-blank","The abstract is the ___ of the paper.","چکیده نقشه مقاله است.",I_FILL[0],I_FILL[1],[["map","Map"],false]],
["c1-u2-academic-l2","matching","Match word to replacement.","واژه را به جایگزینی وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","one","one"],["l2","do","do"],["l3","so","so"]],[["r1","replaces noun","جای اسم"],["r2","replaces verb","جای فعل"],["r3","replaces clause","جای بند"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c1-u2-academic-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Some","بعضی"],["w2","agree;","موافق‌اند"],["w3","others","بعضی"],["w4","don't.","نه."]],["w1","w2","w3","w4"]]],
["c1-u2-academic-l3","fill-blank","Could you say ___ about your method?","درباره روشتان بیشتر می‌گویید؟",I_FILL[0],I_FILL[1],[["more","More"],false]],
["c1-u2-academic-l3","multiple-choice","Which is a collegial challenge?","کدام چالش همکارانه است؟",null,null,
 [[["o1","I wonder whether the data supports that.","نمی‌دانم داده آن را پشتیبانی می‌کند یا نه."],["o2","That's wrong.","غلط است."],["o3","Nonsense.","چرند."],["o4","You failed.","شکست خوردی."]],"o1"]],
["c1-u2-academic-l4","ordering","Order the pair.","جفت را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","What","چه"],["w2","is","است"],["w3","known,","معلوم"],["w4","what","چه"],["w5","is","است"],["w6","contested.","مورد مناقشه."]],["w1","w2","w3","w4","w5","w6"]]],
["c1-u2-academic-l4","matching","Match review part to content.","بخش مرور را به محتوا وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","known","معلوم"],["l2","contested","مورد مناقشه"],["l3","remains","مانده"]],[["r1","established facts","واقعیت‌های ثابت"],["r2","debated claims","ادعاهای مورد بحث"],["r3","open questions","سؤال‌های باز"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c1-u3-professional-l1","multiple-choice","___ the price drops, we walk away.","مگر قیمت بیفتد، می‌رویم.",null,null,
 [[["o1","Unless","مگر"],["o2","If","اگر"],["o3","When","وقتی"],["o4","Because","چون"]],"o1"]],
["c1-u3-professional-l1","fill-blank","Interests ___, positions clash.","منافع هم‌پوشانی دارند؛ مواضع می‌جنگند.",I_FILL[0],I_FILL[1],[["overlap","Overlap"],false]],
["c1-u3-professional-l2","matching","Match frame step to question.","گام قاب را به سؤال وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","Situation","موقعیت"],["l2","Behaviour","رفتار"],["l3","Impact","اثر"]],[["r1","when/where","کی/کجا"],["r2","what happened","چه شد"],["r3","result","نتیجه"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c1-u3-professional-l2","ordering","Order the motto.","شعار را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Clear","شفاف"],["w2","is","است"],["w3","kind.","مهربانی."]],["w1","w2","w3"]]],
["c1-u3-professional-l3","fill-blank","BLUF = Bottom Line ___ Front.","اول نتیجه.",I_FILL[0],I_FILL[1],[["Up","up"],false]],
["c1-u3-professional-l3","multiple-choice","Which sentence distances the claim?","کدام جمله ادعا را دور می‌کند؟",null,null,
 [[["o1","It is expected that costs fall.","انتظار می‌رود هزینه‌ها بیفتد."],["o2","I know costs fall.","می‌دانم هزینه‌ها می‌افتد."],["o3","Costs fall!","هزینه‌ها می‌افتد!"],["o4","Trust me.","به من اعتماد کن."]],"o1"]],
["c1-u3-professional-l4","ordering","Order the commitment.","تعهد را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","I","من"],["w2","can","می‌توانم"],["w3","commit","متعهد شوم"],["w4","to","به"],["w5","Friday.","جمعه."]],["w1","w2","w3","w4","w5"]]],
["c1-u3-professional-l4","matching","Match phrase to move.","عبارت را به حرکت وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","fair challenge","چالش منصفانه"],["l2","we risk","ریسک می‌کنیم"],["l3","commit to","متعهد شدن"]],[["r1","accept doubt","پذیرش تردید"],["r2","warn cost","هشدار هزینه"],["r3","promise action","قول اقدام"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c1-u4-global-l1","multiple-choice","Carbon taxes hit the poor ___.","مالیات کربن اول به فقرا می‌خورد.",null,null,
 [[["o1","first","اول"],["o2","firstly","اولاً"],["o3","firsts","اول‌ها"],["o4","one","یک"]],"o1"]],
["c1-u4-global-l1","fill-blank","No free ___.","ناهار مجانی نیست.",I_FILL[0],I_FILL[1],[["lunch","Lunch"],false]],
["c1-u4-global-l2","matching","Match verb to force.","فعل را به بار وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","claim","ادعا"],["l2","allege","شکایت"],["l3","admit","اعتراف"]],[["r1","assert","اظهار"],["r2","accuse","اتهام"],["r3","confess","اقرار"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c1-u4-global-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Framing","قاب‌بندی"],["w2","is","است"],["w3","the","همان"],["w4","story.","داستان."]],["w1","w2","w3","w4"]]],
["c1-u4-global-l3","fill-blank","Systems are ___ to err.","سامانه‌ها حتماً خطا می‌کنند.",I_FILL[0],I_FILL[1],[["bound","Bound"],false]],
["c1-u4-global-l3","multiple-choice","Outcomes, duties, ___.","پیامدها، وظایف و …",null,null,
 [[["o1","character","شخصیت"],["o2","weather","هوا"],["o3","scores","امتیازها"],["o4","colours","رنگ‌ها"]],"o1"]],
["c1-u4-global-l4","ordering","Order the rule.","قاعده را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Evidence","شواهد"],["w2","before","پیش از"],["w3","opinion.","نظر."]],["w1","w2","w3"]]],
["c1-u4-global-l4","matching","Match rule to meaning.","قاعده را به معنا وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","evidence","شواهد"],["l2","steelperson","تقویت مخالف"],["l3","minority report","گزارش اقلیت"]],[["r1","first","اول"],["r2","before rebuttal","پیش از رد"],["r3","honoured","محترم"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c2-u1-precision-l1","multiple-choice","stubborn (bad) vs ___ (good).","لجوج بد در برابر … خوب.",null,null,
 [[["o1","resolute","مصمم"],["o2","pigheaded","کله‌شق"],["o3","obstinate","سرسخت"],["o4","bullheaded","یکدنده"]],"o1"]],
["c2-u1-precision-l1","fill-blank","Cheap (bad) vs ___. (good)","ارزانِ بد در برابر … خوب.",I_FILL[0],I_FILL[1],[["economical","Economical"],false]],
["c2-u1-precision-l2","matching","Match phrase to certainty.","عبارت را به قطعیت وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","seems","به نظر می‌رسد"],["l2","suggests","نشان می‌دهد"],["l3","undeniably","بی‌تردید"]],[["r1","low","کم"],["r2","medium","متوسط"],["r3","high","زیاد"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c2-u1-precision-l2","ordering","Order the sentence.","جمله را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Each","هر"],["w2","step","پله"],["w3","raises","بالا می‌برد"],["w4","the","همان"],["w5","stakes.","ریسک."]],["w1","w2","w3","w4","w5"]]],
["c2-u1-precision-l3","fill-blank","I'll be thirty___ minutes late.","حدود سی دقیقه دیر می‌رسم.",I_FILL[0],I_FILL[1],[["ish","-ish","Ish"],false]],
["c2-u1-precision-l3","multiple-choice","“Interesting idea” said flatly after silence means ___.","«ایده جالبی است» که خشک پس از سکوت گفته شود یعنی …",null,null,
 [[["o1","no","نه"],["o2","yes","بله"],["o3","maybe","شاید"],["o4","hello","سلام"]],"o1"]],
["c2-u1-precision-l4","ordering","Order the instruction.","دستور را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Mark","علامت بزن"],["w2","vague","مبهم"],["w3","words,","واژه‌ها"],["w4","missed","ازدست‌رفته"],["w5","hedges.","احتیاط‌ها."]],["w1","w2","w3","w4","w5"]]],
["c2-u1-precision-l4","matching","Match issue to fix.","مشکل را به اصلاح وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","vague words","واژه‌های مبهم"],["l2","unearned boosters","تقویت نابه‌جا"],["l3","tone slips","لغزش لحن"]],[["r1","sharpen","تیز کن"],["r2","cut","حذف کن"],["r3","fix","اصلاح کن"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c2-u2-rhetoric-l1","multiple-choice","“Not easy, but important” is ___.","«نه آسان، بلکه مهم» … است.",null,null,
 [[["o1","antithesis","تضاد"],["o2","parallelism","توازی"],["o3","alliteration","هم‌حروفی"],["o4","rhyme","قافیه"]],"o1"]],
["c2-u2-rhetoric-l1","fill-blank","Groups of three = ___.","سه‌گانه‌ها = …",I_FILL[0],I_FILL[1],[["tricolon","Tricolon"],false]],
["c2-u2-rhetoric-l2","matching","Match speech part to role.","بخش سخنرانی را به نقش وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","story opening","شروع داستانی"],["l2","pillars","ستون‌ها"],["l3","quotable close","پایان نقل‌کردنی"]],[["r1","hook","قلاب"],["r2","body","بدنه"],["r3","ending","پایان"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c2-u2-rhetoric-l2","ordering","Order the inversion.","وارونگی را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Never","هرگز"],["w2","have","داشته"],["w3","we","ما"],["w4","faced","روبه‌رو"],["w5","such","چنین"],["w6","a","یک"],["w7","choice.","انتخاب."]],["w1","w2","w3","w4","w5","w6","w7"]]],
["c2-u2-rhetoric-l3","fill-blank","Model → mechanism → ___.","مدل، سازوکار و …",I_FILL[0],I_FILL[1],[["weighing","Weighing"],false]],
["c2-u2-rhetoric-l3","multiple-choice","Which sentence weighs a clash?","کدام جمله برخوردی را می‌سنجد؟",null,null,
 [[["o1","We win on scale.","در مقیاس می‌بریم."],["o2","We disagree.","مخالفیم."],["o3","They are wrong.","آن‌ها اشتباه می‌کنند."],["o4","Next point.","نکته بعد."]],"o1"]],
["c2-u2-rhetoric-l4","ordering","Order the rule.","قاعده را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","One","یک"],["w2","device","ابزار"],["w3","per","در"],["w4","paragraph.","پاراگراف."]],["w1","w2","w3","w4"]]],
["c2-u2-rhetoric-l4","matching","Match principle to rule.","اصل را به قاعده وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","devices","ابزارها"],["l2","manipulation","دستکاری"],["l3","oath","سوگند"]],[["r1","serve evidence","در خدمت شواهد"],["r2","never allowed","هرگز مجاز نیست"],["r3","signed","امضاشده"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c2-u3-scholarly-l1","multiple-choice","“By X I mean …” controls ___.","«منظورم از X …» … را کنترل می‌کند.",null,null,
 [[["o1","ambiguity","ابهام"],["o2","applause","تشویق"],["o3","weather","هوا"],["o4","scores","امتیازها"]],"o1"]],
["c2-u3-scholarly-l1","fill-blank","Read with the text, then ___ it.","اول با متن بخوان، بعد در برابرش.",I_FILL[0],I_FILL[1],[["against","Against"],false]],
["c2-u3-scholarly-l2","matching","Match device to use.","ابزار را به کاربرد وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","old-to-new","کهنه‌به‌نو"],["l2","the former","اولی"],["l3","such failures","چنین شکست‌هایی"]],[["r1","information order","ترتیب اطلاعات"],["r2","first item","مورد اول"],["r3","reference back","ارجاع به قبل"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c2-u3-scholarly-l2","ordering","Order the motto.","شعار را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Respect","احترام بگذار"],["w2","the","به همان"],["w3","gap.","شکاف."]],["w1","w2","w3"]]],
["c2-u3-scholarly-l3","fill-blank","Write for the ___.","برای شکاک بنویس.",I_FILL[0],I_FILL[1],[["sceptic","skeptic","Sceptic"],false]],
["c2-u3-scholarly-l3","multiple-choice","“Far from proving X, results complicate it” shows ___.","«نه‌تنها X را اثبات نمی‌کند بلکه پیچیده‌اش می‌کند» … را نشان می‌دهد.",null,null,
 [[["o1","idiomatic syntax","نحو اصطلاحی"],["o2","bad grammar","گرامر بد"],["o3","typing error","غلط تایپی"],["o4","simple style","سبک ساده"]],"o1"]],
["c2-u3-scholarly-l4","ordering","Order the instruction.","دستور را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Respond","جواب بده"],["w2","point","نکته"],["w3","by","به"],["w4","point.","نکته."]],["w1","w2","w3","w4"]]],
["c2-u3-scholarly-l4","matching","Match report part to role.","بخش گزارش را به نقش وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","summary","خلاصه"],["l2","strengths","قوت‌ها"],["l3","verdict","رأی"]],[["r1","overview","نمای کلی"],["r2","merits","محاسن"],["r3","decision","تصمیم"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c2-u4-mastery-l1","multiple-choice","“Break the ice” fits ___.","«break the ice» به … می‌خورد.",null,null,
 [[["o1","a mixer","مهمانی"],["o2","a memo","یادداشت اداری"],["o3","a contract","قرارداد"],["o4","a will","وصیت‌نامه"]],"o1"]],
["c2-u4-mastery-l1","fill-blank","Raise ___. (collocation)","آگاهی را بالا ببر.",I_FILL[0],I_FILL[1],[["awareness","Awareness"],false]],
["c2-u4-mastery-l2","matching","Match frame to view.","قاب را به دیدگاه وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","technically","فنی"],["l2","in plain terms","به زبان ساده"],["l3","bluntly","رک"]],[["r1","expert view","دید متخصص"],["r2","simple view","دید ساده"],["r3","direct view","دید مستقیم"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
["c2-u4-mastery-l2","ordering","Order the motto.","شعار را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Never","هرگز"],["w2","drift;","سر نخور"],["w3","always","همیشه"],["w4","steer.","فرمان بده."]],["w1","w2","w3","w4"]]],
["c2-u4-mastery-l3","fill-blank","Voice is choice ___.","صدا انتخابِ تکرارشده است.",I_FILL[0],I_FILL[1],[["repeated","Repeated"],false]],
["c2-u4-mastery-l3","multiple-choice","Which line shows voice as choice?","کدام خط صدا را به‌صورت انتخاب نشان می‌دهد؟",null,null,
 [[["o1","long or short, plain or rich","بلند یا کوتاه، ساده یا غنی"],["o2","always long","همیشه بلند"],["o3","never choose","هرگز انتخاب نکن"],["o4","one style","یک سبک"]],"o1"]],
["c2-u4-mastery-l4","ordering","Order the motto.","شعار را مرتب کنید.",I_ORDER[0],I_ORDER[1],
 [[["w1","Read","بخوان"],["w2","widely,","گسترده"],["w3","write","بنویس"],["w4","daily.","روزانه."]],["w1","w2","w3","w4"]]],
["c2-u4-mastery-l4","matching","Match piece to aim.","اثر را به هدف وصل کنید.",I_MATCH[0],I_MATCH[1],
 [[["l1","speech","سخنرانی"],["l2","critique","نقد"],["l3","story","داستان"]],[["r1","persuade","اقناع"],["r2","judge","داوری"],["r3","move","تکان دادن"]],[["l1","r1"],["l2","r2"],["l3","r3"]]]],
];

/* ======================= BUILD + VALIDATE + SEED ======================= */

const EXPECTED_COUNTS = Object.freeze({
  levels: 6, courses: 6, units: 24, lessons: 96,
  vocabulary: 180, grammar: 48, reading: 24, listening: 24,
  speaking: 24, writing: 18, practiceSets: 96, exercises: 192,
});

const EXPECTED_PER_LEVEL = Object.freeze({
  lessons: 16, vocabulary: 30, grammar: 8, reading: 4,
  listening: 4, speaking: 4, writing: 3,
});

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AUDIO_RE = /^\/audio\//;

function buildDataset() {
  const levels = LEVELS.map((l) => ({ _key: l.slug, ...l }));
  const levelBySlug = new Map(levels.map((l) => [l.slug, l]));
  const courses = buildCourses();
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
  const units = buildUnits(new Map(courses.map((c) => [c.slug, true])));
  const unitBySlug = new Map(units.map((u) => [u.slug, u]));
  const lessonRows = [
    ...LESSON_ROWS_A1, ...LESSON_ROWS_A2, ...LESSON_ROWS_B1,
    ...LESSON_ROWS_B2, ...LESSON_ROWS_C1, ...LESSON_ROWS_C2,
  ];
  const lessons = buildLessons(lessonRows, new Map(units.map((u) => [u.slug, true])));
  const lessonByKey = new Map(lessons.map((l) => [l._key, l]));

  // Resolve each lesson's CEFR level through unit -> course -> level.
  const lessonLevel = new Map();
  const lessonKeysByLevel = new Map(LEVELS_ORDER.map((l) => [l, []]));
  for (const lesson of lessons) {
    const unit = unitBySlug.get(lesson._unitKey);
    const course = unit && courseBySlug.get(unit._courseKey);
    const lvl = course ? course._levelKey.toUpperCase() : null;
    lessonLevel.set(lesson._key, lvl);
    if (lvl && lessonKeysByLevel.has(lvl)) lessonKeysByLevel.get(lvl).push(lesson._key);
  }

  const vocabulary = buildVocabulary(VOCAB_ROWS, lessonKeysByLevel);
  const grammar = buildGrammar(GRAMMAR_ROWS, lessonKeysByLevel);
  const reading = buildReading(READING_ROWS, lessonKeysByLevel);
  const listening = buildListening(LISTENING_ROWS, lessonKeysByLevel);
  const speaking = buildSpeaking(SPEAKING_ROWS, lessonKeysByLevel);
  const writing = buildWriting(WRITING_ROWS, lessonKeysByLevel);
  const practiceSets = buildPracticeSets(lessons);
  const setKeyByLesson = new Map(practiceSets.map((s) => [s._lessonKey, s._key]));
  const exercises = buildExercises(EXERCISE_ROWS);

  // Cross-domain enrichment (seed-side only): every domain item knows its
  // lesson key and that lesson's practice-set key.
  for (const coll of [vocabulary, grammar, reading, listening, speaking, writing]) {
    for (const doc of coll) {
      doc._practiceSetKey = (doc._lessonKey && setKeyByLesson.get(doc._lessonKey)) || null;
    }
  }

  return {
    levels, courses, units, lessons, vocabulary, grammar, reading,
    listening, speaking, writing, practiceSets, exercises,
    levelBySlug, courseBySlug, unitBySlug, lessonByKey, lessonLevel,
    lessonKeysByLevel, setKeyByLesson,
  };
}

function checkUnique(errors, label, keys) {
  const seen = new Set();
  for (const k of keys) {
    if (seen.has(k)) fail(errors, `duplicate ${label}: ${k}`);
    seen.add(k);
  }
}

function validateDataset(ds) {
  const errors = [];
  const countOf = {
    levels: ds.levels.length, courses: ds.courses.length, units: ds.units.length,
    lessons: ds.lessons.length, vocabulary: ds.vocabulary.length, grammar: ds.grammar.length,
    reading: ds.reading.length, listening: ds.listening.length, speaking: ds.speaking.length,
    writing: ds.writing.length, practiceSets: ds.practiceSets.length, exercises: ds.exercises.length,
  };
  for (const [k, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (countOf[k] !== expected) fail(errors, `count mismatch: ${k} expected ${expected}, got ${countOf[k]}`);
  }

  // ---- levels ----
  checkUnique(errors, "level slug", ds.levels.map((l) => l.slug));
  ds.levels.forEach((l, i) => {
    if (!LEVELS_ORDER.includes(l.code)) fail(errors, `invalid level code: ${l.code}`);
    if (l.slug !== l.code.toLowerCase()) fail(errors, `level slug/code mismatch: ${l.slug}`);
    if (!SLUG_RE.test(l.slug)) fail(errors, `bad level slug: ${l.slug}`);
    if (!isLocalized(l.title) || !isLocalized(l.description)) fail(errors, `level ${l.slug}: title/description must be localized`);
    if (l.order !== i) fail(errors, `level ${l.slug}: order must be ${i}`);
    if (!STATUSES.includes(l.status)) fail(errors, `level ${l.slug}: bad status`);
  });

  // ---- courses / units / lessons: refs + sibling order ----
  checkUnique(errors, "course key", ds.courses.map((c) => `${c._levelKey}/${c.slug}`));
  for (const c of ds.courses) {
    if (!ds.levelBySlug.has(c._levelKey)) fail(errors, `course ${c.slug}: unknown level ${c._levelKey}`);
    if (!SLUG_RE.test(c.slug)) fail(errors, `bad course slug: ${c.slug}`);
    if (!isLocalized(c.title) || !isLocalized(c.description)) fail(errors, `course ${c.slug}: title/description must be localized`);
    if (!STATUSES.includes(c.status)) fail(errors, `course ${c.slug}: bad status`);
  }
  checkUnique(errors, "unit key", ds.units.map((u) => `${u._courseKey}/${u.slug}`));
  checkUnique(errors, "unit order", ds.units.map((u) => `${u._courseKey}#${u.order}`));
  for (const u of ds.units) {
    if (!ds.courseBySlug.has(u._courseKey)) fail(errors, `unit ${u.slug}: unknown course ${u._courseKey}`);
    if (!isLocalized(u.title) || !isLocalized(u.description)) fail(errors, `unit ${u.slug}: not localized`);
    if (!STATUSES.includes(u.status)) fail(errors, `unit ${u.slug}: bad status`);
  }
  checkUnique(errors, "lesson key", ds.lessons.map((l) => `${l._unitKey}/${l.slug}`));
  checkUnique(errors, "lesson order", ds.lessons.map((l) => `${l._unitKey}#${l.order}`));
  for (const l of ds.lessons) {
    if (!ds.unitBySlug.has(l._unitKey)) fail(errors, `lesson ${l.slug}: unknown unit ${l._unitKey}`);
    if (!SLUG_RE.test(l.slug)) fail(errors, `bad lesson slug: ${l.slug}`);
    if (!isLocalized(l.title) || !isLocalized(l.description)) fail(errors, `lesson ${l.slug}: not localized`);
    if (!Number.isInteger(l.estimatedDuration) || l.estimatedDuration < 1) fail(errors, `lesson ${l.slug}: bad estimatedDuration`);
    if (!Array.isArray(l.objectives) || l.objectives.length < 1 || !l.objectives.every(isLocalized)) {
      fail(errors, `lesson ${l.slug}: objectives must be 1+ localized items`);
    }
    if (!Array.isArray(l.content) || l.content.length < 1) fail(errors, `lesson ${l.slug}: content blocks missing`);
    else {
      const keys = new Set();
      l.content.forEach((b, i) => {
        if (!LESSON_BLOCK_KINDS.includes(b.kind)) fail(errors, `lesson ${l.slug}: bad block kind ${b.kind}`);
        if (b.order !== i) fail(errors, `lesson ${l.slug}: block order must be ${i}`);
        if (!isNonEmptyString(b.key) || keys.has(b.key)) fail(errors, `lesson ${l.slug}: bad/duplicate block key`);
        keys.add(b.key);
        if (!isLocalized(b.title) || !isLocalized(b.body)) fail(errors, `lesson ${l.slug}: block ${b.key} not localized`);
      });
    }
    if (!STATUSES.includes(l.status)) fail(errors, `lesson ${l.slug}: bad status`);
    if (!ds.lessonLevel.get(l._key)) fail(errors, `lesson ${l.slug}: level unresolvable`);
  }

  // ---- generic domain checks ----
  function checkDomain(coll, label, extra) {
    checkUnique(errors, `${label} _key`, coll.map((d) => d._key));
    checkUnique(errors, `${label} order`, coll.map((d) => d.order));
    for (const d of coll) {
      if (!SLUG_RE.test(d.slug)) fail(errors, `${label} ${d.slug}: bad slug`);
      if (!LEVELS_ORDER.includes(d._level || d.level)) fail(errors, `${label} ${d.slug}: bad level`);
      if (!STATUSES.includes(d.status)) fail(errors, `${label} ${d.slug}: bad status`);
      if (!Number.isInteger(d.order) || d.order < 0) fail(errors, `${label} ${d.slug}: bad order`);
      if (d._lessonKey && !ds.lessonByKey.has(d._lessonKey)) fail(errors, `${label} ${d.slug}: dangling lesson ${d._lessonKey}`);
      if (d._practiceSetKey && ![...ds.setKeyByLesson.values()].includes(d._practiceSetKey)) {
        fail(errors, `${label} ${d.slug}: dangling practice set ${d._practiceSetKey}`);
      }
      if (extra) extra(d);
    }
  }

  checkDomain(ds.vocabulary, "vocabulary", (d) => {
    if (!isNonEmptyString(d.word)) fail(errors, `vocabulary ${d.slug}: empty word`);
    if (d.normalizedWord !== d.word.toLowerCase()) fail(errors, `vocabulary ${d.slug}: normalizedWord mismatch`);
    if (!isLocalized(d.definition) || !isLocalized(d.translation)) fail(errors, `vocabulary ${d.slug}: definition/translation must be localized`);
    if (!Array.isArray(d.examples) || d.examples.length < 1 || !d.examples.every((e) => isNonEmptyString(e.sentence))) {
      fail(errors, `vocabulary ${d.slug}: need 1+ examples with sentences`);
    }
    if (d.pronunciation) {
      if (d.pronunciation.audioSrc && !AUDIO_RE.test(d.pronunciation.audioSrc)) {
        fail(errors, `vocabulary ${d.slug}: bad pronunciation audioSrc`);
      }
      if (d.pronunciation.ipa && !isNonEmptyString(d.pronunciation.ipa)) fail(errors, `vocabulary ${d.slug}: empty ipa`);
    }
  });
  checkUnique(errors, "vocab word+pos", ds.vocabulary.map((d) => `${d.normalizedWord}::${d.partOfSpeech || ""}`));

  checkDomain(ds.grammar, "grammar", (d) => {
    if (!isLocalized(d.title) || !isLocalized(d.summary) || !isLocalized(d.explanation)) {
      fail(errors, `grammar ${d.slug}: title/summary/explanation must be localized`);
    }
    if (!Array.isArray(d.examples) || d.examples.length < 1) fail(errors, `grammar ${d.slug}: need 1+ examples`);
    for (const e of d.examples || []) {
      if (!isNonEmptyString(e.sentence)) fail(errors, `grammar ${d.slug}: empty example sentence`);
      if (e.note && !isLocalized(e.note)) fail(errors, `grammar ${d.slug}: bad example note`);
    }
    if (!Array.isArray(d.commonMistakes) || d.commonMistakes.length < 1) fail(errors, `grammar ${d.slug}: need 1+ common mistakes`);
    for (const m of d.commonMistakes || []) {
      if (!isLocalized(m.mistake) || !isLocalized(m.correction)) fail(errors, `grammar ${d.slug}: mistake/correction must be localized`);
    }
  });

  checkDomain(ds.reading, "reading", (d) => {
    if (!isLocalized(d.title) || !isLocalized(d.summary)) fail(errors, `reading ${d.slug}: title/summary must be localized`);
    if (!Array.isArray(d.sections) || d.sections.length < 1) fail(errors, `reading ${d.slug}: need 1+ sections`);
    for (const s of d.sections || []) {
      if (s.heading && !isLocalized(s.heading)) fail(errors, `reading ${d.slug}: bad heading`);
      if (!Array.isArray(s.paragraphs) || s.paragraphs.length < 1 || !s.paragraphs.every(isLocalized)) {
        fail(errors, `reading ${d.slug}: need 1+ localized paragraphs per section`);
      }
    }
    if (!Number.isInteger(d.estimatedDuration) || d.estimatedDuration < 1) fail(errors, `reading ${d.slug}: bad estimatedDuration`);
  });

  checkDomain(ds.listening, "listening", (d) => {
    if (!isLocalized(d.title) || !isLocalized(d.description)) fail(errors, `listening ${d.slug}: title/description must be localized`);
    if (!AUDIO_RE.test(d.audioSrc || "")) fail(errors, `listening ${d.slug}: audioSrc must be /audio/...`);
    if (!Number.isInteger(d.durationSeconds) || d.durationSeconds < 0) fail(errors, `listening ${d.slug}: bad durationSeconds`);
    if (!isLocalized(d.transcript)) fail(errors, `listening ${d.slug}: transcript must be localized`);
    if (!TRANSCRIPT_VISIBILITY.includes(d.transcriptVisibility)) fail(errors, `listening ${d.slug}: bad transcriptVisibility`);
    if (d.status !== "draft") fail(errors, `listening ${d.slug}: must stay draft until audio exists`);
  });

  checkDomain(ds.speaking, "speaking", (d) => {
    for (const f of ["title", "description", "instructions", "context", "role", "objective"]) {
      if (!isLocalized(d[f])) fail(errors, `speaking ${d.slug}: ${f} must be localized`);
    }
    if (!Array.isArray(d.successCriteria) || d.successCriteria.length < 1 || !d.successCriteria.every(isLocalized)) {
      fail(errors, `speaking ${d.slug}: need 1+ successCriteria`);
    }
    if (!Array.isArray(d.preparationTips) || d.preparationTips.length < 1 || !d.preparationTips.every(isLocalized)) {
      fail(errors, `speaking ${d.slug}: need 1+ preparationTips`);
    }
    if (!Number.isInteger(d.durationLimitSeconds) || d.durationLimitSeconds < 15 || d.durationLimitSeconds > 180) {
      fail(errors, `speaking ${d.slug}: durationLimitSeconds must be 15-180`);
    }
    if (d.expectedLanguage !== "en") fail(errors, `speaking ${d.slug}: expectedLanguage must be en`);
  });

  checkDomain(ds.writing, "writing", (d) => {
    if (!isLocalized(d.title) || !isLocalized(d.prompt) || !isLocalized(d.instructions)) {
      fail(errors, `writing ${d.slug}: title/prompt/instructions must be localized`);
    }
    if (!isNonEmptyString(d.topic) || !isNonEmptyString(d.taskType)) fail(errors, `writing ${d.slug}: topic/taskType required`);
    if (d.targetLanguage !== "en") fail(errors, `writing ${d.slug}: targetLanguage must be en`);
    if (!Array.isArray(d.evaluationCriteria) || d.evaluationCriteria.length < 1 || !d.evaluationCriteria.every(isLocalized)) {
      fail(errors, `writing ${d.slug}: need 1+ evaluationCriteria`);
    }
  });

  // ---- practice sets ----
  checkUnique(errors, "practice set key", ds.practiceSets.map((s) => `${s._lessonKey}/${s.slug}`));
  for (const s of ds.practiceSets) {
    if (!ds.lessonByKey.has(s._lessonKey)) fail(errors, `practice set ${s.slug}: dangling lesson ${s._lessonKey}`);
    if (!isLocalized(s.title) || !isLocalized(s.description)) fail(errors, `practice set ${s.slug}: not localized`);
    if (!STATUSES.includes(s.status)) fail(errors, `practice set ${s.slug}: bad status`);
  }
  const setKeys = new Set(ds.practiceSets.map((s) => s._key));

  // ---- exercises (mirror Practice Engine evaluation rules) ----
  checkUnique(errors, "exercise key", ds.exercises.map((e) => e._key));
  checkUnique(errors, "exercise order", ds.exercises.map((e) => `${e._setKey}#${e.order}`));
  for (const e of ds.exercises) {
    if (!setKeys.has(e._setKey)) fail(errors, `exercise ${e._key}: dangling set ${e._setKey}`);
    if (!isLocalized(e.prompt)) fail(errors, `exercise ${e._key}: prompt must be localized`);
    if (e.instruction && !isLocalized(e.instruction)) fail(errors, `exercise ${e._key}: bad instruction`);
    if (!EXERCISE_TYPES.includes(e.exerciseType)) fail(errors, `exercise ${e._key}: bad type ${e.exerciseType}`);
    if (!STATUSES.includes(e.status)) fail(errors, `exercise ${e._key}: bad status`);
    if (e.exerciseType === "multiple-choice") {
      const ids = (e.options || []).map((o) => o.id);
      if (!Array.isArray(e.options) || e.options.length < 2) fail(errors, `exercise ${e._key}: mc needs 2+ options`);
      if (new Set(ids).size !== ids.length) fail(errors, `exercise ${e._key}: duplicate mc option ids`);
      if (!e.options.every((o) => isLocalized(o.label))) fail(errors, `exercise ${e._key}: mc labels must be localized`);
      if (!ids.includes(e.correctOptionId)) fail(errors, `exercise ${e._key}: correctOptionId not in options`);
    } else if (e.exerciseType === "fill-blank") {
      if (!Array.isArray(e.acceptedAnswers) || e.acceptedAnswers.length < 1 || !e.acceptedAnswers.every(isNonEmptyString)) {
        fail(errors, `exercise ${e._key}: fill needs 1+ accepted answers`);
      }
      if (typeof e.caseSensitive !== "boolean") fail(errors, `exercise ${e._key}: caseSensitive must be boolean`);
    } else if (e.exerciseType === "matching") {
      const lids = (e.leftItems || []).map((x) => x.id);
      const rids = (e.rightItems || []).map((x) => x.id);
      if (lids.length < 1 || rids.length < 1) fail(errors, `exercise ${e._key}: matching needs items on both sides`);
      if (new Set(lids).size !== lids.length || new Set(rids).size !== rids.length) {
        fail(errors, `exercise ${e._key}: duplicate matching ids`);
      }
      if (![...(e.leftItems || []), ...(e.rightItems || [])].every((x) => isLocalized(x.label))) {
        fail(errors, `exercise ${e._key}: matching labels must be localized`);
      }
      if (!Array.isArray(e.pairs) || e.pairs.length < 1) fail(errors, `exercise ${e._key}: matching needs 1+ pairs`);
      for (const p of e.pairs || []) {
        if (!lids.includes(p.leftId) || !rids.includes(p.rightId)) fail(errors, `exercise ${e._key}: pair references unknown item`);
      }
    } else if (e.exerciseType === "ordering") {
      const ids = (e.items || []).map((x) => x.id);
      if (ids.length < 2) fail(errors, `exercise ${e._key}: ordering needs 2+ items`);
      if (new Set(ids).size !== ids.length) fail(errors, `exercise ${e._key}: duplicate ordering ids`);
      if (!e.items.every((x) => isLocalized(x.label))) fail(errors, `exercise ${e._key}: ordering labels must be localized`);
      const co = e.correctOrder || [];
      if (co.length !== ids.length || new Set(co).size !== ids.length || !co.every((id) => ids.includes(id))) {
        fail(errors, `exercise ${e._key}: correctOrder must be a permutation of item ids`);
      }
    }
  }

  // ---- per-level balance ----
  const byLevel = (coll, get) => {
    const m = new Map(LEVELS_ORDER.map((l) => [l, 0]));
    for (const d of coll) m.set(get(d), (m.get(get(d)) ?? 0) + 1);
    return m;
  };
  const lvlLessons = byLevel(ds.lessons, (d) => ds.lessonLevel.get(d._key));
  const lvlVocab = byLevel(ds.vocabulary, (d) => d._level);
  const lvlGrammar = byLevel(ds.grammar, (d) => d._level);
  const lvlReading = byLevel(ds.reading, (d) => d._level);
  const lvlListening = byLevel(ds.listening, (d) => d._level);
  const lvlSpeaking = byLevel(ds.speaking, (d) => d._level);
  const lvlWriting = byLevel(ds.writing, (d) => d._level);
  for (const l of LEVELS_ORDER) {
    if (lvlLessons.get(l) !== EXPECTED_PER_LEVEL.lessons) fail(errors, `${l}: lessons ${lvlLessons.get(l)}`);
    if (lvlVocab.get(l) !== EXPECTED_PER_LEVEL.vocabulary) fail(errors, `${l}: vocabulary ${lvlVocab.get(l)}`);
    if (lvlGrammar.get(l) !== EXPECTED_PER_LEVEL.grammar) fail(errors, `${l}: grammar ${lvlGrammar.get(l)}`);
    if (lvlReading.get(l) !== EXPECTED_PER_LEVEL.reading) fail(errors, `${l}: reading ${lvlReading.get(l)}`);
    if (lvlListening.get(l) !== EXPECTED_PER_LEVEL.listening) fail(errors, `${l}: listening ${lvlListening.get(l)}`);
    if (lvlSpeaking.get(l) !== EXPECTED_PER_LEVEL.speaking) fail(errors, `${l}: speaking ${lvlSpeaking.get(l)}`);
    if (lvlWriting.get(l) !== EXPECTED_PER_LEVEL.writing) fail(errors, `${l}: writing ${lvlWriting.get(l)}`);
  }
  const stories = ds.reading.filter((d) => d._isStory);
  const storiesByLevel = byLevel(stories, (d) => d._level);
  const expectedStories = { A1: 0, A2: 2, B1: 2, B2: 2, C1: 2, C2: 2 };
  for (const l of LEVELS_ORDER) {
    if ((storiesByLevel.get(l) ?? 0) !== expectedStories[l]) fail(errors, `${l}: stories ${storiesByLevel.get(l)}`);
  }

  return { errors, countOf, perLevel: { lvlLessons, lvlVocab, lvlGrammar, lvlReading, lvlListening, lvlSpeaking, lvlWriting, storiesByLevel } };
}

/* ------------------------------ reports --------------------------------- */

function printReports(ds, stats) {
  const { countOf, perLevel } = stats;
  console.log("SAYVA Content Seed");
  console.log(`Content version: ${CONTENT_VERSION}`);
  console.log("Database: sayva");
  console.log(`Originality: ${SOURCE_META.originality} | Framework: ${SOURCE_META.framework}`);
  console.log("");
  console.log("Validation:");
  console.log("PASS");
  console.log("");
  console.log("Content counts:");
  console.log(`Levels: ${countOf.levels}`);
  console.log(`Courses: ${countOf.courses}`);
  console.log(`Units: ${countOf.units}`);
  console.log(`Lessons: ${countOf.lessons}`);
  console.log(`Vocabulary: ${countOf.vocabulary}`);
  console.log(`Grammar: ${countOf.grammar}`);
  console.log(`Listening: ${countOf.listening}`);
  console.log(`Reading: ${countOf.reading}`);
  console.log(`Speaking: ${countOf.speaking}`);
  console.log(`Writing: ${countOf.writing}`);
  console.log(`Practice Sets: ${countOf.practiceSets}`);
  console.log(`Exercises: ${countOf.exercises}`);
  console.log("");
  console.log("Per-level content:");
  for (const l of LEVELS_ORDER) {
    console.log(
      `${l}: lessons=${perLevel.lvlLessons.get(l)} vocab=${perLevel.lvlVocab.get(l)} ` +
      `grammar=${perLevel.lvlGrammar.get(l)} reading=${perLevel.lvlReading.get(l)} ` +
      `listening=${perLevel.lvlListening.get(l)} speaking=${perLevel.lvlSpeaking.get(l)} ` +
      `writing=${perLevel.lvlWriting.get(l)}`,
    );
  }
  console.log("");
  console.log("Four-skill coverage per level:");
  for (const l of LEVELS_ORDER) {
    console.log(
      `${l}: Listening=${perLevel.lvlListening.get(l)} Speaking=${perLevel.lvlSpeaking.get(l)} ` +
      `Reading=${perLevel.lvlReading.get(l)} Writing=${perLevel.lvlWriting.get(l)}`,
    );
  }
  console.log("");
  console.log("Vocabulary by level and topic:");
  for (const l of LEVELS_ORDER) {
    const topics = new Map();
    for (const d of ds.vocabulary) {
      if (d._level !== l) continue;
      topics.set(d._topic, (topics.get(d._topic) ?? 0) + 1);
    }
    console.log(`${l} (${perLevel.lvlVocab.get(l)}): ` + [...topics.entries()].map(([t, n]) => `${t}=${n}`).join(" "));
  }
  console.log("");
  console.log("Grammar topics by level:");
  for (const l of LEVELS_ORDER) {
    const topics = ds.grammar.filter((d) => d._level === l).map((d) => d.slug.replace(`${l.toLowerCase()}-grammar-`, ""));
    console.log(`${l} (${topics.length}): ${topics.join(", ")}`);
  }
  console.log("");
  console.log("Story coverage (original SAYVA stories):");
  for (const l of LEVELS_ORDER) {
    console.log(`${l} stories: ${perLevel.storiesByLevel.get(l) ?? 0}`);
  }
  console.log("");
  const byType = new Map(EXERCISE_TYPES.map((t) => [t, 0]));
  for (const e of ds.exercises) byType.set(e.exerciseType, byType.get(e.exerciseType) + 1);
  console.log("Exercise types: " + EXERCISE_TYPES.map((t) => `${t}=${byType.get(t)}`).join(" "));
  console.log(`Listening publication: draft=${ds.listening.filter((d) => d.status === "draft").length} (audio assets not generated)`);
}

/* ---------------------------- environment safety ------------------------- */

function resolveEnv() {
  const raw = process.env.MONGODB_URI || "mongodb://localhost:27017/sayva";
  let parsed = null;
  try {
    parsed = new URL(raw.replace(/:[^:@/]*@/, ":***@"));
  } catch {
    return { ok: false, raw: "[unparseable]", reason: "MONGODB_URI is not a valid URI" };
  }
  let actual = null;
  try {
    actual = new URL(raw);
  } catch {
    return { ok: false, raw: "[unparseable]", reason: "MONGODB_URI is not a valid URI" };
  }
  const protocol = actual.protocol;
  const host = actual.hostname;
  const dbName = decodeURIComponent(actual.pathname.replace(/^\//, "").split("/")[0] || "");
  if (protocol !== "mongodb:") {
    return { ok: false, uri: raw, host, dbName, reason: `protocol must be mongodb:// (got ${protocol}); Atlas (mongodb+srv) is forbidden` };
  }
  if (!LOCAL_HOSTS.has(host)) {
    return { ok: false, uri: raw, host, dbName, reason: `host must be local (${[...LOCAL_HOSTS].join("/")}); got ${host}` };
  }
  if (dbName !== EXPECTED_DB_NAME) {
    return { ok: false, uri: raw, host, dbName, reason: `database must be ${EXPECTED_DB_NAME}; got ${dbName || "(none)"}` };
  }
  void parsed;
  return { ok: true, uri: raw, host, dbName };
}

/* --------------------------------- write --------------------------------- */

function stripPrivate(doc) {
  const out = {};
  for (const [k, v] of Object.entries(doc)) {
    if (!k.startsWith("_")) out[k] = v;
  }
  return out;
}

async function seedDatabase(ds) {
  let MongoClient;
  try {
    // Lazy: dry-run and validation work with zero dependencies.
    ({ MongoClient } = await import("mongodb"));
  } catch {
    console.log("MongoDB runtime: NOT AVAILABLE (driver 'mongodb' is not installed)");
    console.log("Install dependencies and retry; nothing was written.");
    process.exitCode = 1;
    return { attempted: true, completed: false };
  }
  const env = resolveEnv();
  const client = new MongoClient(env.uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
  try {
    await client.connect();
  } catch (err) {
    console.log("MongoDB runtime: NOT AVAILABLE");
    console.log(`Connect failed: ${err && err.message ? err.message : err}`);
    console.log("Nothing was written.");
    process.exitCode = 1;
    return { attempted: true, completed: false };
  }
  const db = client.db(env.dbName);
  const upserted = {};
  try {
    async function upsertBySlug(collName, docs) {
      const coll = db.collection(collName);
      const ids = new Map();
      for (const doc of docs) {
        const body = stripPrivate(doc);
        await coll.updateOne(
          { slug: doc.slug },
          { $set: { ...body, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
          { upsert: true },
        );
        const saved = await coll.findOne({ slug: doc.slug }, { projection: { _id: 1 } });
        ids.set(doc._key, saved._id);
      }
      upserted[collName] = docs.length;
      return ids;
    }

    // 1-4. Curriculum hierarchy (dependency order).
    const levelIds = await upsertBySlug("learning_levels", ds.levels);
    const courses = ds.courses.map((c) => ({ ...c, levelId: levelIds.get(c._levelKey) }));
    for (const c of courses) {
      if (!c.levelId) throw new Error(`unresolved level for course ${c.slug}`);
    }
    const courseIds = await upsertBySlug("learning_courses", courses);
    const units = ds.units.map((u) => ({ ...u, courseId: courseIds.get(u._courseKey) }));
    for (const u of units) {
      if (!u.courseId) throw new Error(`unresolved course for unit ${u.slug}`);
    }
    const unitIds = await upsertBySlug("learning_units", units);
    const lessons = ds.lessons.map((l) => ({ ...l, unitId: unitIds.get(l._unitKey) }));
    for (const l of lessons) {
      if (!l.unitId) throw new Error(`unresolved unit for lesson ${l.slug}`);
    }
    const lessonIds = await upsertBySlug("learning_lessons", lessons);

    // 5-10. Domain content (lesson refs resolved; practice-set refs reconciled later).
    async function upsertDomain(collName, docs) {
      const withRefs = docs.map((d) => {
        const out = { ...d };
        if (d._lessonKey) out.lessonId = lessonIds.get(d._lessonKey) || undefined;
        if (out.lessonId === undefined) delete out.lessonId;
        return out;
      });
      return upsertBySlug(collName, withRefs);
    }
    await upsertDomain("vocabulary_items", ds.vocabulary);
    await upsertDomain("grammar_topics", ds.grammar);
    await upsertDomain("reading_items", ds.reading);
    await upsertDomain("listening_items", ds.listening);
    const speakingIds = await upsertDomain("speaking_scenarios", ds.speaking);
    void speakingIds;
    await upsertDomain("writing_items", ds.writing);

    // 11. Practice sets (one per lesson).
    const setColl = db.collection("practice_sets");
    const setIds = new Map();
    for (const s of ds.practiceSets) {
      const lessonId = lessonIds.get(s._lessonKey);
      if (!lessonId) throw new Error(`unresolved lesson for practice set ${s.slug}`);
      const body = { ...stripPrivate(s), lessonId };
      await setColl.updateOne(
        { lessonId, slug: s.slug },
        { $set: { ...body, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      );
      const saved = await setColl.findOne({ lessonId, slug: s.slug }, { projection: { _id: 1 } });
      setIds.set(s._key, saved._id);
    }
    upserted.practice_sets = ds.practiceSets.length;

    // 12. Exercises (discriminator key exerciseType preserved).
    const exColl = db.collection("practice_exercises");
    for (const e of ds.exercises) {
      const practiceSetId = setIds.get(e._setKey);
      if (!practiceSetId) throw new Error(`unresolved set for exercise ${e._key}`);
      const body = { ...stripPrivate(e), practiceSetId };
      await exColl.updateOne(
        { practiceSetId, order: e.order },
        { $set: { ...body, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      );
    }
    upserted.practice_exercises = ds.exercises.length;

    // 13. Cross-reference reconciliation: attach practiceSetId to domain docs.
    for (const [collName, docs] of [
      ["vocabulary_items", ds.vocabulary],
      ["grammar_topics", ds.grammar],
      ["reading_items", ds.reading],
      ["listening_items", ds.listening],
      ["writing_items", ds.writing],
    ]) {
      const coll = db.collection(collName);
      for (const d of docs) {
        if (!d._practiceSetKey) continue;
        const practiceSetId = setIds.get(d._practiceSetKey);
        if (!practiceSetId) throw new Error(`unresolved set ref for ${collName}/${d.slug}`);
        await coll.updateOne({ slug: d.slug }, { $set: { practiceSetId } });
      }
    }

    // ---- post-seed verification (query, don't trust) ----
    const verify = {};
    async function expectSlugs(collName, docs) {
      const slugs = docs.map((d) => d.slug);
      const found = await db.collection(collName).countDocuments({ slug: { $in: slugs } });
      verify[collName] = { expected: slugs.length, found };
      if (found !== slugs.length) throw new Error(`${collName}: expected ${slugs.length}, found ${found}`);
    }
    await expectSlugs("learning_levels", ds.levels);
    await expectSlugs("learning_courses", courses);
    await expectSlugs("learning_units", units);
    await expectSlugs("learning_lessons", lessons);
    await expectSlugs("vocabulary_items", ds.vocabulary);
    await expectSlugs("grammar_topics", ds.grammar);
    await expectSlugs("reading_items", ds.reading);
    await expectSlugs("listening_items", ds.listening);
    await expectSlugs("speaking_scenarios", ds.speaking);
    await expectSlugs("writing_items", ds.writing);
    await expectSlugs("practice_sets", ds.practiceSets);
    const exFound = await db.collection("practice_exercises").countDocuments({
      practiceSetId: { $in: [...setIds.values()] },
    });
    verify.practice_exercises = { expected: ds.exercises.length, foundAtLeast: exFound };
    if (exFound < ds.exercises.length) throw new Error(`practice_exercises: expected >= ${ds.exercises.length}, found ${exFound}`);

    // Reference integrity spot-checks.
    const lessonIdSet = new Set([...lessonIds.values()].map(String));
    const orphanSets = await db.collection("practice_sets").countDocuments({
      slug: { $in: ds.practiceSets.map((s) => s.slug) },
      lessonId: { $nin: [...lessonIds.values()] },
    });
    if (orphanSets !== 0) throw new Error(`practice_sets with dangling lessonId: ${orphanSets}`);
    const orphanEx = await db.collection("practice_exercises").countDocuments({
      practiceSetId: { $in: [...setIds.values()] },
    });
    void lessonIdSet;
    void orphanEx;

    console.log("");
    console.log("Seed:");
    console.log("SUCCESS");
    console.log(`Upserted: levels=${upserted.learning_levels} courses=${upserted.learning_courses} units=${upserted.learning_units} lessons=${upserted.learning_lessons}`);
    console.log(`Upserted: vocabulary=${upserted.vocabulary_items} grammar=${upserted.grammar_topics} reading=${upserted.reading_items} listening=${upserted.listening_items} speaking=${upserted.speaking_scenarios} writing=${upserted.writing_items}`);
    console.log(`Upserted: practice_sets=${upserted.practice_sets} practice_exercises=${upserted.practice_exercises}`);
    console.log("Post-seed verification: PASS (counts + slug presence + reference checks)");
    console.log("Learner data modified: NO (content collections only, upsert by stable key, no deletes)");
    return { attempted: true, completed: true };
  } finally {
    try {
      await client.close();
    } catch {
      // ignore close errors
    }
  }
}

/* --------------------------------- main ---------------------------------- */

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--help") || args.has("-h")) {
    console.log("SAYVA content seed — usage:");
    console.log("  node scripts/seed/sayva-content.seed.js --dry-run   validate + report, no writes");
    console.log("  node --env-file=.env scripts/seed/sayva-content.seed.js   validate + seed `sayva`");
    return;
  }
  const dryRun = args.has("--dry-run");
  let ds;
  try {
    ds = buildDataset();
  } catch (err) {
    console.log("SAYVA Content Seed");
    console.log("Validation:");
    console.log("FAIL (build error)");
    console.log(err && err.message ? err.message : err);
    process.exitCode = 1;
    return;
  }
  const stats = validateDataset(ds);
  if (stats.errors.length > 0) {
    console.log("SAYVA Content Seed");
    console.log("Validation:");
    console.log("FAIL");
    console.log("");
    for (const e of stats.errors.slice(0, 100)) console.log(`- ${e}`);
    if (stats.errors.length > 100) console.log(`… and ${stats.errors.length - 100} more`);
    console.log("");
    console.log("Seed: ABORTED (no writes performed)");
    process.exitCode = 1;
    return;
  }
  printReports(ds, stats);
  if (dryRun) {
    console.log("");
    console.log("Dry run: YES — no database writes performed.");
    return;
  }
  const env = resolveEnv();
  if (!env.ok) {
    console.log("");
    console.log("Environment safety: STOP");
    console.log("Expected database: sayva (mongodb://localhost:27017/sayva)");
    console.log(`Actual configured database: ${env.dbName || "(none)"} host=${env.host || "(none)"}`);
    console.log(`Reason: ${env.reason}`);
    console.log("Seed: ABORTED (no writes performed)");
    process.exitCode = 2;
    return;
  }
  console.log("");
  console.log(`MongoDB target: mongodb://${env.host}:27017/${env.dbName} — verified, proceeding.`);
  await seedDatabase(ds);
}

main().catch((err) => {
  console.log(`Seed failed: ${err && err.message ? err.message : err}`);
  process.exitCode = 1;
});










