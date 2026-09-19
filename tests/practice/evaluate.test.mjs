import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const temp = mkdtempSync(join(tmpdir(), "sayva-practice-"));

function compile(sourcePath, outputPath, replacements = []) {
  let source = readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: sourcePath,
  }).outputText;
  let output = compiled;
  for (const [from, to] of replacements) output = output.replaceAll(from, to);
  writeFileSync(outputPath, output);
}

const normalizePath = join(temp, "normalize.cjs");
compile("src/lib/practice/normalize.ts", normalizePath);
const evaluatePath = join(temp, "evaluate.cjs");
compile("src/lib/practice/evaluate.ts", evaluatePath, [
  ["@/lib/practice/normalize", normalizePath],
]);
const scorePath = join(temp, "score.cjs");
compile("src/lib/practice/score.ts", scorePath);

const { normalizeAnswer } = require(normalizePath);
const { evaluatePracticeResponse } = require(evaluatePath);
const { calculateScore, isPracticeComplete } = require(scorePath);

const text = { en: "Text", fa: "متن" };
const base = { _id: { toString: () => "1" }, practiceSetId: { toString: () => "2" }, prompt: text, order: 0, status: "published" };

test("normalization is Unicode-aware, trims, collapses whitespace, and is case-insensitive by default", () => {
  assert.equal(normalizeAnswer("  Café  \n  MORNING  "), "café morning");
  assert.equal(normalizeAnswer("  TeSt  ", true), "TeSt");
});

test("multiple choice accepts only a known option and evaluates the answer key server-side", () => {
  const exercise = { ...base, exerciseType: "multiple-choice", options: [{ id: "a", label: text }, { id: "b", label: text }], correctOptionId: "b" };
  assert.equal(evaluatePracticeResponse(exercise, { type: "multiple-choice", optionId: "b" }).isCorrect, true);
  assert.equal(evaluatePracticeResponse(exercise, { type: "multiple-choice", optionId: "unknown" }).isCorrect, false);
});

test("fill blank uses deterministic accepted translations/answers and normalization", () => {
  const exercise = { ...base, exerciseType: "fill-blank", acceptedAnswers: ["good morning", "GOOD   MORNING"], caseSensitive: false };
  assert.equal(evaluatePracticeResponse(exercise, { type: "fill-blank", answer: " good   morning " }).isCorrect, true);
  assert.equal(evaluatePracticeResponse(exercise, { type: "fill-blank", answer: "good evening" }).isCorrect, false);
});

test("matching is order-independent but rejects incomplete or unknown pairs", () => {
  const exercise = { ...base, exerciseType: "matching", leftItems: [{ id: "l1", label: text }, { id: "l2", label: text }], rightItems: [{ id: "r1", label: text }, { id: "r2", label: text }], pairs: [{ leftId: "l1", rightId: "r1" }, { leftId: "l2", rightId: "r2" }] };
  assert.equal(evaluatePracticeResponse(exercise, { type: "matching", pairs: [{ leftId: "l2", rightId: "r2" }, { leftId: "l1", rightId: "r1" }] }).isCorrect, true);
  assert.equal(evaluatePracticeResponse(exercise, { type: "matching", pairs: [{ leftId: "l1", rightId: "r1" }] }).isCorrect, false);
});

test("ordering requires the complete known set in the exact order", () => {
  const exercise = { ...base, exerciseType: "ordering", items: [{ id: "a", label: text }, { id: "b", label: text }, { id: "c", label: text }], correctOrder: ["b", "a", "c"] };
  assert.equal(evaluatePracticeResponse(exercise, { type: "ordering", itemIds: ["b", "a", "c"] }).isCorrect, true);
  assert.equal(evaluatePracticeResponse(exercise, { type: "ordering", itemIds: ["a", "b", "c"] }).isCorrect, false);
});

test("score and completion rules are deterministic", () => {
  assert.equal(calculateScore(2, 3), 67);
  assert.equal(calculateScore(0, 0), 0);
  assert.equal(isPracticeComplete(2, 3), false);
  assert.equal(isPracticeComplete(3, 3), true);
});
