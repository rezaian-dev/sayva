# SAYVA — Official Content Source Register

**Document:** `docs/content-sources.md`
**Created:** 2026-09-19
**Purpose:** Registry of the official third-party sources used as *curriculum and
pedagogical references* for the SAYVA English curriculum (A1–C2).
**Canonical content source:** `scripts/seed/sayva-content.seed.js`
**Curriculum map:** `docs/content-curriculum-map.md`

---

## 1. Copyright / Provenance Note (binding)

> SAYVA learner-facing content is original.
> Official third-party sources are used as curriculum/pedagogical references.
> Verbatim third-party lesson text, stories, definitions, examples and answer keys are not reproduced.

Consequences enforced by the seed pipeline:

- No British Council lesson text, story text, exercise text, or answer key is copied.
- No Cambridge activity text is copied.
- No Oxford dictionary definition or example sentence is copied.
- No CEFR descriptor text is copied verbatim into learner-facing lessons.
- No proprietary word list is bulk-reproduced into SAYVA.
- Every definition, example, passage, story, dialogue, transcript, scenario,
  prompt, explanation, and exercise in the seed file is original SAYVA content
  authored for this curriculum.

---

## 2. Source Role Taxonomy

Each registered source has exactly one primary role:

| Role | Meaning |
|---|---|
| `Framework` | Defines the proficiency/level architecture (what A1–C2 mean). |
| `Pedagogical reference` | Informs activity design, skill coverage, and exercise patterns. |
| `Vocabulary reference` | Informs vocabulary selection, sequencing, and prioritization. |
| `Activity reference` | Informs task types and practice formats per skill. |
| `Story-format reference` | Informs graded-story *format* expectations (length bands, level bands). Not a source of story content. |

No source below is a *content* source. All learner-facing text is original.

---

## 3. Official Source Register

### 3.1 Council of Europe — CEFR (Framework)

| Item | Detail |
|---|---|
| Source | Council of Europe — Common European Framework of Reference for Languages |
| Role | `Framework` |
| URLs | `https://www.coe.int/en/web/common-european-framework-reference-languages` |
| | `https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors` |
| | `https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions` |
| Verified | 2026-09-19 (main + descriptors pages reachable; CEFR described as the common basis for syllabuses, curriculum guidelines, teaching materials, and assessment; Companion Volume 2020 extends descriptors incl. mediation/online interaction) |
| Used for | Six-level architecture (A1–C2); can-do outcome design; skill progression; per-level scope boundaries; assessment alignment of practice content. |
| Not used for | Verbatim descriptor text is NOT copied into lessons. CEFR informs *what* each level must achieve; SAYVA authors *how* it is taught. |

### 3.2 British Council LearnEnglish (Pedagogical + Activity + Story-format reference)

| Item | Detail |
|---|---|
| Source | British Council — LearnEnglish |
| Role | `Pedagogical reference`, `Activity reference`, `Story-format reference` |
| URLs | `https://learnenglish.britishcouncil.org/` |
| | `https://learnenglish.britishcouncil.org/level/understand-your-english-level` |
| | `https://learnenglish.britishcouncil.org/free-resources/listening` |
| | `https://learnenglish.britishcouncil.org/free-resources/reading` |
| | `https://learnenglish.britishcouncil.org/free-resources/grammar` |
| | `https://learnenglish.britishcouncil.org/free-resources/vocabulary` |
| | `https://learnenglish.britishcouncil.org/free-resources/general/story-zone` |
| Verified | 2026-09-19 (all pages reachable; level framework A1–C1+ organized per skill; listening/reading level bands and text-type inventories confirmed; grammar bands A1-A2/B1-B2/C1 confirmed; vocabulary bands A1-A2/B1-B2 confirmed; Story Zone graded-story bands A2–B1 and B2–C1 confirmed) |
| Used for | Level-appropriate topic structure; grammar progression shape; vocabulary topic progression shape; listening scenario inventory (meetings, calls, announcements, lectures, …); reading text-type inventory (notices → articles → reports → specialised texts); graded-story level banding; skill activity patterns. |
| Not used for | No lesson text, story, script, exercise, or answer key copied. Story Zone informs *that* graded stories belong at A2–C1 and *what shape* they take; all SAYVA stories are new characters, plots, and settings. |

### 3.3 Cambridge English — Activities for Learners (Pedagogical + Activity reference)

| Item | Detail |
|---|---|
| Source | Cambridge English — Activities for Learners |
| Role | `Pedagogical reference`, `Activity reference` |
| URL | `https://www.cambridgeenglish.org/learning-english/activities-for-learners/` |
| Verified | 2026-09-19 — page currently returns the Cambridge error page ("moved or does not exist"). Role retained from the curriculum brief: Basic (A1–A2), Independent (B1–B2), Proficient (C1–C2) activity bands across grammar, listening, pronunciation, reading, speaking, vocabulary, writing. |
| Used for | Activity-design cross-check: skill coverage per band, pronunciation as a support system, writing task-type ladder. |
| Not used for | No activity text copied. Because the page has moved, Cambridge is a *minor corroborating* reference in this cycle; CEFR + British Council carry the primary design weight. |

### 3.4 Oxford Learner's Dictionaries — Word Lists (Vocabulary reference)

| Item | Detail |
|---|---|
| Source | Oxford University Press — Oxford Learner's Dictionaries word lists |
| Role | `Vocabulary reference` |
| URLs | `https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000` |
| | `https://www.oxfordlearnersdictionaries.com/about/wordlists/` |
| Verified | 2026-09-19 (both pages reachable; Oxford 3000 = core words, CEFR A1–B2; Oxford 5000 = 3000 + 2000 advanced words, B2–C1; Oxford Phrase List = 650 phrases A1–C1 incl. idioms, phrasal verbs, collocations; OPAL academic lexicon for EAP confirmed) |
| Used for | Vocabulary prioritization and CEFR-aware sequencing: core everyday vocabulary concentrated A1–B2; advanced/abstract/academic vocabulary concentrated B2–C1; collocations and phrasal verbs emphasized B1+; academic/professional lexis emphasized C1–C2. SAYVA level tags use `levelBasis: "CEFR-aligned curriculum design"` and never claim to be official Oxford levels. |
| Not used for | No dictionary definitions, example sentences, pronunciations, or list data copied. No bulk reproduction of any proprietary list. |

---

## 4. How References Become Content (authoring methodology)

```text
Official source
→ identify level / skill / topic
→ define learning objective
→ create ORIGINAL SAYVA content
→ create ORIGINAL examples
→ connect practice
→ validate level fit
→ validate language quality
→ persist via single seed script
```

Explicitly forbidden:

```text
Official page → copy → paste into database   (NEVER)
```

---

## 5. Provenance in the Seed File

The seed file embeds a concise machine-readable registry (`CONTENT_SOURCES`)
and stamps every content group with:

```js
sourceMeta: {
  framework: "CEFR",
  referenceSources: [
    "Council of Europe CEFR",
    "British Council LearnEnglish",
    "Cambridge English",
    "Oxford Learner's Dictionaries"
  ],
  originality: "original-sayva-content"
}
```

`sourceMeta` is seed-side traceability metadata. Persisted MongoDB documents
contain only fields defined by the existing Mongoose schemas (existing schema
wins); no copyrighted source text is stored anywhere.

---

## 6. Verification Log

| Date | Check | Result |
|---|---|---|
| 2026-09-19 | CEFR main page reachable | PASS |
| 2026-09-19 | CEFR descriptors page reachable | PASS |
| 2026-09-19 | British Council LearnEnglish home reachable | PASS |
| 2026-09-19 | British Council level framework reachable | PASS |
| 2026-09-19 | British Council listening/reading/grammar/vocabulary hubs reachable | PASS |
| 2026-09-19 | British Council Story Zone reachable (A2–B1 / B2–C1 bands) | PASS |
| 2026-09-19 | Cambridge activities URL | MOVED (error page) — retained as minor corroborating reference, nothing copied |
| 2026-09-19 | Oxford 3000/5000 about page reachable | PASS |
| 2026-09-19 | Oxford word lists about page reachable (3000/5000/Phrase List/OPAL) | PASS |
| 2026-09-19 | Originality audit of seed content | All learner-facing text original to SAYVA |
