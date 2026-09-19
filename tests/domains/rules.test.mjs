import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const temp = mkdtempSync(join(tmpdir(), "sayva-domains-"));

function compile(sourcePath, outputName) {
  const outputPath = join(temp, outputName);
  const source = readFileSync(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: sourcePath,
  }).outputText;
  writeFileSync(outputPath, output);
  return require(outputPath);
}

const vocabulary = compile("src/lib/vocabulary/rules.ts", "vocabulary.cjs");
const grammar = compile("src/lib/grammar/rules.ts", "grammar.cjs");
const listening = compile("src/lib/listening/rules.ts", "listening.cjs");
const reading = compile("src/lib/reading/rules.ts", "reading.cjs");

test("vocabulary word identity normalization is deterministic", () => {
  assert.equal(vocabulary.normalizeVocabularyWord("  Café  MORNING "), "café morning");
  assert.equal(vocabulary.isVocabularyKnown("known"), true);
  assert.equal(vocabulary.isVocabularyKnown("learning"), false);
});

test("grammar completion remains separate from mastery", () => {
  assert.equal(grammar.isGrammarComplete("completed"), true);
  assert.equal(grammar.isGrammarComplete("in_progress"), false);
  assert.equal(grammar.isGrammarComplete(null), false);
});

test("listening and reading completion require an explicit completed state", () => {
  assert.equal(listening.isListeningComplete("in_progress"), false);
  assert.equal(listening.isListeningComplete("completed"), true);
  assert.equal(reading.isReadingComplete(null), false);
  assert.equal(reading.isReadingComplete("completed"), true);
});
