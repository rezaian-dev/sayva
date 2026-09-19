import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const temp = mkdtempSync(join(tmpdir(), "sayva-progress-"));
const sourcePath = "src/lib/progress/rules.ts";
const outputPath = join(temp, "rules.cjs");
writeFileSync(outputPath, ts.transpileModule(readFileSync(sourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  fileName: sourcePath,
}).outputText);
const rules = require(outputPath);
const now = new Date("2026-09-19T12:00:00.000Z");
const title = { en: "Lesson", fa: "درس" };
const lesson = { id: "lesson-1", slug: "lesson", title, description: title, levelSlug: "beginner", courseSlug: "course", unitSlug: "unit" };
const domains = (overrides = {}) => [
  { domain: "vocabulary", availableCount: 10, startedCount: 2, inProgressCount: 2, completedCount: 0, knownCount: 0, completionPercent: null },
  { domain: "grammar", availableCount: 4, startedCount: 1, inProgressCount: 1, completedCount: 0, knownCount: 0, completionPercent: 0 },
  { domain: "listening", availableCount: 4, startedCount: 0, inProgressCount: 0, completedCount: 0, knownCount: 0, completionPercent: 0 },
  { domain: "reading", availableCount: 4, startedCount: 0, inProgressCount: 0, completedCount: 0, knownCount: 0, completionPercent: 0 },
].map((item) => ({ ...item, ...(overrides[item.domain] ?? {}) }));
const learning = (currentLesson = null) => ({ level: null, completedLessons: 0, totalLessons: 2, currentLesson });

function signals(count, correct, date = now) {
  return Array.from({ length: count }, (_, index) => ({ isCorrect: index < correct, submittedAt: date }));
}

test("percentage and accuracy thresholds are explicit and deterministic", () => {
  assert.equal(rules.calculatePercent(2, 3), 67);
  assert.equal(rules.calculatePercent(0, 0), null);
  const insufficient = rules.derivePracticeSummary({ completedSessions: 1, attempts: 4, correctAnswers: 4, recentAttemptSignals: signals(4, 4), now });
  assert.equal(insufficient.accuracy, null);
  assert.equal(insufficient.recentAccuracy, null);
  assert.equal(insufficient.evidence, "insufficient");
  const developing = rules.derivePracticeSummary({ completedSessions: 2, attempts: 5, correctAnswers: 3, recentAttemptSignals: signals(5, 3), now });
  assert.equal(developing.accuracy, 60);
  assert.equal(developing.recentAccuracy, 60);
  assert.equal(developing.evidence, "developing");
  const reliable = rules.derivePracticeSummary({ completedSessions: 4, attempts: 10, correctAnswers: 5, recentAttemptSignals: signals(10, 5), now });
  assert.equal(reliable.evidence, "reliable");
});

test("recent practice only uses the bounded recent window for attention", () => {
  const old = new Date("2026-09-01T12:00:00.000Z");
  const summary = rules.derivePracticeSummary({ completedSessions: 3, attempts: 10, correctAnswers: 9, recentAttemptSignals: [...signals(5, 0), ...signals(5, 5, old)], now });
  assert.equal(summary.recentAttempts, 5);
  assert.equal(summary.recentAccuracy, 0);
  assert.equal(summary.accuracy, 90);
});

test("recommendation priority prefers the next lesson over weaker practice evidence", () => {
  const practice = rules.derivePracticeSummary({ completedSessions: 2, attempts: 5, correctAnswers: 1, recentAttemptSignals: signals(5, 1), now });
  const recommendation = rules.deriveRecommendation({ learning: learning(lesson), domains: domains(), practice });
  assert.equal(recommendation.type, "continue-learning");
  assert.equal(recommendation.priority, 100);
  assert.equal(recommendation.reason, "next-lesson");
});

test("recommendation uses a stable domain order and requires in-progress evidence", () => {
  const practice = rules.derivePracticeSummary({ completedSessions: 0, attempts: 0, correctAnswers: 0, recentAttemptSignals: [], now });
  const recommendation = rules.deriveRecommendation({ learning: learning(), domains: domains({ listening: { startedCount: 1, inProgressCount: 1 } }), practice });
  assert.equal(recommendation.type, "complete-grammar");
  assert.equal(recommendation.priority, 60);
  const noEvidence = rules.deriveRecommendation({ learning: learning(), domains: domains({ grammar: { startedCount: 0, inProgressCount: 0 }, vocabulary: { inProgressCount: 0 } }), practice });
  assert.equal(noEvidence, null);
});

test("recommendation handles vocabulary review and practice history without inventing a score", () => {
  const noRecent = rules.derivePracticeSummary({ completedSessions: 1, attempts: 2, correctAnswers: 2, recentAttemptSignals: signals(2, 2), now });
  const vocabulary = rules.deriveRecommendation({ learning: learning(), domains: domains({ grammar: { inProgressCount: 0 } }), practice: noRecent });
  assert.equal(vocabulary.type, "review-vocabulary");
  const noVocabulary = rules.deriveRecommendation({ learning: learning(), domains: domains({ grammar: { inProgressCount: 0 }, vocabulary: { inProgressCount: 0 } }), practice: noRecent });
  assert.equal(noVocabulary.type, "practice-skill");
});
