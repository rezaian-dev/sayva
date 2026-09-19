import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const temp = mkdtempSync(join(tmpdir(), "sayva-speaking-"));
const sourcePath = "src/lib/speaking/rules.ts";
const outputPath = join(temp, "rules.cjs");
writeFileSync(outputPath, ts.transpileModule(readFileSync(sourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  fileName: sourcePath,
}).outputText);
const rules = require(outputPath);
const feedbackSourcePath = "src/validation/speaking/feedback.ts";
const feedbackOutputPath = join(process.cwd(), ".sayva-speaking-feedback.cjs");
writeFileSync(feedbackOutputPath, ts.transpileModule(readFileSync(feedbackSourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  fileName: feedbackSourcePath,
}).outputText);
const feedback = require(feedbackOutputPath);
unlinkSync(feedbackOutputPath);

test("speaking flow transitions are explicit", () => {
  assert.equal(rules.canTransitionSpeakingState("scenario", "preparation"), true);
  assert.equal(rules.canTransitionSpeakingState("preparation", "recording"), false);
  assert.equal(rules.canTransitionSpeakingState("processing", "feedback"), false);
  assert.equal(rules.canTransitionSpeakingState("feedback", "preparation"), true);
});

test("recording duration is bounded by the scenario limit", () => {
  assert.equal(rules.isSpeakingDurationAllowed(1, 60), true);
  assert.equal(rules.isSpeakingDurationAllowed(60, 60), true);
  assert.equal(rules.isSpeakingDurationAllowed(61, 60), false);
  assert.equal(rules.isSpeakingDurationAllowed(0, 60), false);
});

test("MIME selection uses browser capability detection order", () => {
  assert.equal(rules.selectSupportedAudioMimeType(() => false), undefined);
  assert.equal(rules.selectSupportedAudioMimeType((mime) => mime === "audio/ogg"), "audio/ogg");
  assert.equal(rules.selectSupportedAudioMimeType((mime) => mime.includes("webm")), "audio/webm;codecs=opus");
});

test("only completed and failed attempts are retryable", () => {
  assert.equal(rules.canRetrySpeakingAttempt("started"), false);
  assert.equal(rules.canRetrySpeakingAttempt("processing"), false);
  assert.equal(rules.canRetrySpeakingAttempt("completed"), true);
  assert.equal(rules.canRetrySpeakingAttempt("failed"), true);
});

test("structured feedback validation rejects missing or oversized output", () => {
  const valid = {
    overallFeedback: "You communicated the scenario clearly.",
    strengths: ["Clear main idea."],
    areasToImprove: ["Add one supporting detail."],
    grammarNotes: [],
    vocabularySuggestions: [],
    fluencyNotes: [],
    correctionExamples: [],
    nextAttemptSuggestion: "Try one longer answer next time.",
  };
  assert.equal(feedback.speakingFeedbackSchema.safeParse(valid).success, true);
  assert.equal(feedback.speakingFeedbackSchema.safeParse({ ...valid, strengths: ["a", "b", "c", "d", "e"] }).success, false);
  assert.equal(feedback.speakingFeedbackSchema.safeParse({ ...valid, unexpected: "no" }).success, false);
});
