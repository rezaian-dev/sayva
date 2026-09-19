import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const temp = mkdtempSync(join(tmpdir(), "sayva-submit-"));

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

const scorePath = join(temp, "score.cjs");
compile("src/lib/practice/score.ts", scorePath);
const submitPath = join(temp, "submit-update.cjs");
compile("src/lib/practice/submit-update.ts", submitPath, [
  ["@/lib/practice/score", scorePath],
]);

const { buildAttemptAppendUpdate } = require(submitPath);

const submittedAt = new Date("2026-01-01T00:00:00.000Z");
const previous = (isCorrect) => ({ isCorrect });

test("mid-session append keeps the session active without result fields", () => {
  const attempt = { learnerId: "u1", isCorrect: false };
  const out = buildAttemptAppendUpdate({
    previousAttempts: [previous(true)],
    attempt,
    totalCount: 3,
    submittedAt,
  });
  assert.equal(out.answeredCount, 2);
  assert.equal(out.correctCount, 1);
  assert.equal(out.completed, false);
  // Regression guard: plain operators only — Mongoose rejects array-form
  // (aggregation pipeline) updates.
  assert.deepEqual(Object.keys(out.update).sort(), ["$push", "$set"]);
  assert.equal(out.update.$push.attempts, attempt);
  assert.equal(out.update.$set.currentIndex, 2);
  assert.equal(out.update.$set.status, "active");
  assert.ok(!("completedAt" in out.update.$set));
  assert.ok(!("result" in out.update.$set));
});

test("final attempt completes the session with deterministic result math", () => {
  const attempt = { learnerId: "u1", isCorrect: true };
  const out = buildAttemptAppendUpdate({
    previousAttempts: [previous(true), previous(true)],
    attempt,
    totalCount: 3,
    submittedAt,
  });
  assert.equal(out.answeredCount, 3);
  assert.equal(out.correctCount, 3);
  assert.equal(out.completed, true);
  assert.equal(out.update.$set.status, "completed");
  assert.equal(out.update.$set.completedAt, submittedAt);
  assert.deepEqual(out.update.$set.result, {
    correctCount: 3,
    totalCount: 3,
    scorePercent: 100,
    completedAt: submittedAt,
  });
});

test("score rounds like the previous aggregation math (2/3 -> 67)", () => {
  const attempt = { learnerId: "u1", isCorrect: false };
  const out = buildAttemptAppendUpdate({
    previousAttempts: [previous(true), previous(true)],
    attempt,
    totalCount: 3,
    submittedAt,
  });
  assert.equal(out.completed, true);
  assert.equal(out.update.$set.result.scorePercent, 67);
});

test("first attempt starts the counts at one", () => {
  const attempt = { learnerId: "u1", isCorrect: true };
  const out = buildAttemptAppendUpdate({
    previousAttempts: [],
    attempt,
    totalCount: 2,
    submittedAt,
  });
  assert.equal(out.answeredCount, 1);
  assert.equal(out.correctCount, 1);
  assert.equal(out.completed, false);
  assert.equal(out.update.$set.currentIndex, 1);
});
