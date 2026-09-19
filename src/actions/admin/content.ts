"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { getAdminAccess } from "@/lib/admin/access";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GrammarTopic } from "@/models/grammar/topic";
import { ListeningItem } from "@/models/listening/item";
import { ReadingItem } from "@/models/reading/item";
import { SpeakingScenario } from "@/models/speaking/scenario";
import { VocabularyItem } from "@/models/vocabulary/item";
import { PracticeSet } from "@/models/practice/set";
import { LearningLesson } from "@/models/learning/lesson";
import {
  grammarContentSchema,
  listeningContentSchema,
  readingContentSchema,
  speakingScenarioSchema,
  statusSchema,
  vocabularyContentSchema,
} from "@/validation/admin/content";
import { normalizeVocabularyWord } from "@/lib/vocabulary/rules";

export type AdminActionResult =
  | { ok: true; id: string }
  | {
      ok: false;
      code: "UNAUTHORIZED" | "FORBIDDEN" | "INVALID" | "NOT_FOUND" | "DUPLICATE" | "DATABASE";
      fieldErrors?: Record<string, string[]>;
    };

type SchemaResult<T> = { success: true; data: T } | { success: false; result: AdminActionResult };

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function optionalValue(formData: FormData, key: string) {
  const item = value(formData, key);
  return item || undefined;
}

function jsonValue<T>(formData: FormData, key: string, fallback: unknown, parse: (value: unknown) => { success: true; data: T } | { success: false }): T | undefined {
  const raw = value(formData, key);
  if (!raw) {
    const parsedFallback = parse(fallback);
    return parsedFallback.success ? parsedFallback.data : undefined;
  }
  try {
    const parsed = parse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function fieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): AdminActionResult {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    errors[key] ??= [];
    errors[key].push(issue.message);
  }
  return { ok: false, code: "INVALID", fieldErrors: errors };
}

function invalidJson(key: string): AdminActionResult {
  return { ok: false, code: "INVALID", fieldErrors: { [key]: ["Enter valid JSON for this field."] } };
}

function duplicateOrDatabase(error: unknown, label: string): AdminActionResult {
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    return { ok: false, code: "DUPLICATE", fieldErrors: { slug: [`That ${label} slug already exists.`] } };
  }
  console.error(`Unable to save admin ${label}.`, error);
  return { ok: false, code: "DATABASE" };
}

function idFrom(valueToParse: string) {
  return Types.ObjectId.isValid(valueToParse) ? new Types.ObjectId(valueToParse) : null;
}

async function authorize(): Promise<true | "UNAUTHORIZED" | "FORBIDDEN"> {
  const access = await getAdminAccess();
  return access.ok ? true : access.code;
}

async function publishedReferenceExists(id: string | undefined, model: typeof LearningLesson | typeof PracticeSet, publishedOnly = false) {
  if (!id) return true;
  return Boolean(await model.exists({ _id: idFrom(id), ...(publishedOnly ? { status: "published" } : {}) }));
}

function localized(formData: FormData, name: string) {
  return { fa: value(formData, `${name}Fa`), en: value(formData, `${name}En`) };
}

function parseVocabulary(formData: FormData): SchemaResult<ReturnType<typeof vocabularyContentSchema.parse>> {
  const examples = jsonValue(formData, "examples", [], (input) => vocabularyContentSchema.shape.examples.safeParse(input));
  const pronunciationRaw = optionalValue(formData, "pronunciation");
  let pronunciation: unknown = undefined;
  if (pronunciationRaw) {
    try { pronunciation = JSON.parse(pronunciationRaw); } catch { return { success: false, result: invalidJson("pronunciation") }; }
  }
  const parsed = vocabularyContentSchema.safeParse({
    slug: value(formData, "slug"), word: value(formData, "word"), partOfSpeech: optionalValue(formData, "partOfSpeech"),
    definition: localized(formData, "definition"), translation: localized(formData, "translation"), examples, pronunciation,
    level: optionalValue(formData, "level"), lessonId: optionalValue(formData, "lessonId"), practiceSetId: optionalValue(formData, "practiceSetId"), order: value(formData, "order"),
  });
  return parsed.success ? parsed : { success: false, result: fieldErrors(parsed.error) };
}

function parseGrammar(formData: FormData): SchemaResult<ReturnType<typeof grammarContentSchema.parse>> {
  const examples = jsonValue(formData, "examples", [], (input) => grammarContentSchema.shape.examples.safeParse(input));
  const commonMistakes = jsonValue(formData, "commonMistakes", [], (input) => grammarContentSchema.shape.commonMistakes.safeParse(input));
  const parsed = grammarContentSchema.safeParse({
    slug: value(formData, "slug"), title: localized(formData, "title"), level: optionalValue(formData, "level"), summary: localized(formData, "summary"), explanation: localized(formData, "explanation"),
    examples, commonMistakes, lessonId: optionalValue(formData, "lessonId"), practiceSetId: optionalValue(formData, "practiceSetId"), order: value(formData, "order"),
  });
  return parsed.success ? parsed : { success: false, result: fieldErrors(parsed.error) };
}

function parseListening(formData: FormData): SchemaResult<ReturnType<typeof listeningContentSchema.parse>> {
  const transcriptRaw = optionalValue(formData, "transcript");
  let transcript: unknown = undefined;
  if (transcriptRaw) {
    try { transcript = JSON.parse(transcriptRaw); } catch { return { success: false, result: invalidJson("transcript") }; }
  }
  const parsed = listeningContentSchema.safeParse({
    slug: value(formData, "slug"), title: localized(formData, "title"), description: localized(formData, "description"), audioSrc: value(formData, "audioSrc"), durationSeconds: optionalValue(formData, "durationSeconds"), level: optionalValue(formData, "level"), transcript, transcriptVisibility: value(formData, "transcriptVisibility"), lessonId: optionalValue(formData, "lessonId"), practiceSetId: optionalValue(formData, "practiceSetId"), order: value(formData, "order"),
  });
  return parsed.success ? parsed : { success: false, result: fieldErrors(parsed.error) };
}

function parseReading(formData: FormData): SchemaResult<ReturnType<typeof readingContentSchema.parse>> {
  const sections = jsonValue(formData, "sections", [], (input) => readingContentSchema.shape.sections.safeParse(input));
  const parsed = readingContentSchema.safeParse({
    slug: value(formData, "slug"), title: localized(formData, "title"), summary: localized(formData, "summary"), level: optionalValue(formData, "level"), sections, estimatedDuration: optionalValue(formData, "estimatedDuration"), lessonId: optionalValue(formData, "lessonId"), practiceSetId: optionalValue(formData, "practiceSetId"), order: value(formData, "order"),
  });
  return parsed.success ? parsed : { success: false, result: fieldErrors(parsed.error) };
}

function parseSpeaking(formData: FormData): SchemaResult<ReturnType<typeof speakingScenarioSchema.parse>> {
  const successCriteria = jsonValue(formData, "successCriteria", [], (input) => speakingScenarioSchema.shape.successCriteria.safeParse(input));
  const preparationTips = jsonValue(formData, "preparationTips", [], (input) => speakingScenarioSchema.shape.preparationTips.safeParse(input));
  const parsed = speakingScenarioSchema.safeParse({
    slug: value(formData, "slug"), title: localized(formData, "title"), description: localized(formData, "description"), instructions: localized(formData, "instructions"), context: localized(formData, "context"), role: localized(formData, "role"), objective: localized(formData, "objective"), successCriteria, preparationTips, level: optionalValue(formData, "level"), topic: optionalValue(formData, "topic"), durationLimitSeconds: value(formData, "durationLimitSeconds"), expectedLanguage: value(formData, "expectedLanguage"), order: value(formData, "order"),
  });
  return parsed.success ? parsed : { success: false, result: fieldErrors(parsed.error) };
}

function revalidateAdmin() {
  revalidatePath("/[locale]/admin", "layout");
  revalidatePath("/[locale]/learn", "layout");
  revalidatePath("/[locale]/practice", "layout");
  revalidatePath("/[locale]/vocabulary", "layout");
  revalidatePath("/[locale]/grammar", "layout");
  revalidatePath("/[locale]/listening", "layout");
  revalidatePath("/[locale]/reading", "layout");
  revalidatePath("/[locale]/speaking", "layout");
}

async function ensureReferences(data: { lessonId?: string; practiceSetId?: string }, publishedOnly = false) {
  const [lessonOk, practiceOk] = await Promise.all([
    publishedReferenceExists(data.lessonId, LearningLesson, publishedOnly),
    publishedReferenceExists(data.practiceSetId, PracticeSet, publishedOnly),
  ]);
  return lessonOk && practiceOk;
}

export async function createVocabularyContent(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const access = await authorize(); if (access !== true) return { ok: false, code: access };
  const parsed = parseVocabulary(formData);
  if (!parsed.success) return parsed.result;
  if (!(await ensureReferences(parsed.data))) return { ok: false, code: "INVALID", fieldErrors: { references: ["Lesson and practice references must exist."] } };
  try {
    await connectToDatabase();
    const created = await VocabularyItem.create({ ...parsed.data, normalizedWord: normalizeVocabularyWord(parsed.data.word), status: "draft" });
    revalidateAdmin();
    return { ok: true, id: created._id.toString() };
  } catch (error) { return duplicateOrDatabase(error, "vocabulary"); }
}

export async function updateVocabularyContent(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const access = await authorize(); if (access !== true) return { ok: false, code: access };
  const id = idFrom(value(formData, "id")); const parsed = parseVocabulary(formData);
  if (!id) return { ok: false, code: "INVALID" }; if (!parsed.success) return parsed.result;
  if (!(await ensureReferences(parsed.data))) return { ok: false, code: "INVALID", fieldErrors: { references: ["Lesson and practice references must exist."] } };
  try { await connectToDatabase(); const updated = await VocabularyItem.findByIdAndUpdate(id, { $set: { ...parsed.data, normalizedWord: normalizeVocabularyWord(parsed.data.word) } }, { returnDocument: "after", runValidators: true }).exec(); if (!updated) return { ok: false, code: "NOT_FOUND" }; revalidateAdmin(); return { ok: true, id: id.toString() }; } catch (error) { return duplicateOrDatabase(error, "vocabulary"); }
}

export async function setVocabularyStatus(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { return setDomainStatus("vocabulary", VocabularyItem, statusSchema, formData); }

export async function createGrammarContent(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { const access = await authorize(); if (access !== true) return { ok: false, code: access }; const parsed = parseGrammar(formData); if (!parsed.success) return parsed.result; if (!(await ensureReferences(parsed.data))) return { ok: false, code: "INVALID", fieldErrors: { references: ["Lesson and practice references must exist."] } }; try { await connectToDatabase(); const created = await GrammarTopic.create({ ...parsed.data, status: "draft" }); revalidateAdmin(); return { ok: true, id: created._id.toString() }; } catch (error) { return duplicateOrDatabase(error, "grammar"); } }
export async function updateGrammarContent(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { const access = await authorize(); if (access !== true) return { ok: false, code: access }; const id = idFrom(value(formData, "id")); const parsed = parseGrammar(formData); if (!id) return { ok: false, code: "INVALID" }; if (!parsed.success) return parsed.result; if (!(await ensureReferences(parsed.data))) return { ok: false, code: "INVALID", fieldErrors: { references: ["Lesson and practice references must exist."] } }; try { await connectToDatabase(); const updated = await GrammarTopic.findByIdAndUpdate(id, { $set: parsed.data }, { returnDocument: "after", runValidators: true }).exec(); if (!updated) return { ok: false, code: "NOT_FOUND" }; revalidateAdmin(); return { ok: true, id: id.toString() }; } catch (error) { return duplicateOrDatabase(error, "grammar"); } }
export async function setGrammarStatus(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { return setDomainStatus("grammar", GrammarTopic, statusSchema, formData); }

export async function createListeningContent(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { const access = await authorize(); if (access !== true) return { ok: false, code: access }; const parsed = parseListening(formData); if (!parsed.success) return parsed.result; if (!(await ensureReferences(parsed.data))) return { ok: false, code: "INVALID", fieldErrors: { references: ["Lesson and practice references must exist."] } }; try { await connectToDatabase(); const created = await ListeningItem.create({ ...parsed.data, status: "draft" }); revalidateAdmin(); return { ok: true, id: created._id.toString() }; } catch (error) { return duplicateOrDatabase(error, "listening"); } }
export async function updateListeningContent(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { const access = await authorize(); if (access !== true) return { ok: false, code: access }; const id = idFrom(value(formData, "id")); const parsed = parseListening(formData); if (!id) return { ok: false, code: "INVALID" }; if (!parsed.success) return parsed.result; if (!(await ensureReferences(parsed.data))) return { ok: false, code: "INVALID", fieldErrors: { references: ["Lesson and practice references must exist."] } }; try { await connectToDatabase(); const updated = await ListeningItem.findByIdAndUpdate(id, { $set: parsed.data }, { returnDocument: "after", runValidators: true }).exec(); if (!updated) return { ok: false, code: "NOT_FOUND" }; revalidateAdmin(); return { ok: true, id: id.toString() }; } catch (error) { return duplicateOrDatabase(error, "listening"); } }
export async function setListeningStatus(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { return setDomainStatus("listening", ListeningItem, statusSchema, formData); }

export async function createReadingContent(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { const access = await authorize(); if (access !== true) return { ok: false, code: access }; const parsed = parseReading(formData); if (!parsed.success) return parsed.result; if (!(await ensureReferences(parsed.data))) return { ok: false, code: "INVALID", fieldErrors: { references: ["Lesson and practice references must exist."] } }; try { await connectToDatabase(); const created = await ReadingItem.create({ ...parsed.data, status: "draft" }); revalidateAdmin(); return { ok: true, id: created._id.toString() }; } catch (error) { return duplicateOrDatabase(error, "reading"); } }
export async function updateReadingContent(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { const access = await authorize(); if (access !== true) return { ok: false, code: access }; const id = idFrom(value(formData, "id")); const parsed = parseReading(formData); if (!id) return { ok: false, code: "INVALID" }; if (!parsed.success) return parsed.result; if (!(await ensureReferences(parsed.data))) return { ok: false, code: "INVALID", fieldErrors: { references: ["Lesson and practice references must exist."] } }; try { await connectToDatabase(); const updated = await ReadingItem.findByIdAndUpdate(id, { $set: parsed.data }, { returnDocument: "after", runValidators: true }).exec(); if (!updated) return { ok: false, code: "NOT_FOUND" }; revalidateAdmin(); return { ok: true, id: id.toString() }; } catch (error) { return duplicateOrDatabase(error, "reading"); } }
export async function setReadingStatus(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { return setDomainStatus("reading", ReadingItem, statusSchema, formData); }

export async function createSpeakingScenario(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { const access = await authorize(); if (access !== true) return { ok: false, code: access }; const parsed = parseSpeaking(formData); if (!parsed.success) return parsed.result; try { await connectToDatabase(); const created = await SpeakingScenario.create({ ...parsed.data, status: "draft" }); revalidateAdmin(); return { ok: true, id: created._id.toString() }; } catch (error) { return duplicateOrDatabase(error, "Speaking scenario"); } }
export async function updateSpeakingScenario(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { const access = await authorize(); if (access !== true) return { ok: false, code: access }; const id = idFrom(value(formData, "id")); const parsed = parseSpeaking(formData); if (!id) return { ok: false, code: "INVALID" }; if (!parsed.success) return parsed.result; try { await connectToDatabase(); const updated = await SpeakingScenario.findByIdAndUpdate(id, { $set: parsed.data }, { returnDocument: "after", runValidators: true }).exec(); if (!updated) return { ok: false, code: "NOT_FOUND" }; revalidateAdmin(); return { ok: true, id: id.toString() }; } catch (error) { return duplicateOrDatabase(error, "Speaking scenario"); } }
export async function setSpeakingStatus(_previous: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> { return setDomainStatus("speaking", SpeakingScenario, statusSchema, formData); }

type StatusModel = typeof VocabularyItem | typeof GrammarTopic | typeof ListeningItem | typeof ReadingItem | typeof SpeakingScenario;
async function setDomainStatus(label: string, model: StatusModel, schema: typeof statusSchema, formData: FormData): Promise<AdminActionResult> {
  const access = await authorize(); if (access !== true) return { ok: false, code: access };
  const parsed = schema.safeParse({ id: value(formData, "id"), status: value(formData, "status") });
  if (!parsed.success) return fieldErrors(parsed.error);
  try {
    await connectToDatabase();
    const existing = await model.findById(parsed.data.id).lean<Record<string, unknown>>().exec();
    if (!existing) return { ok: false, code: "NOT_FOUND" };
    if (parsed.data.status === "published" && (!isPublishable(label, existing) || !(await ensureReferences({ lessonId: existing.lessonId ? String(existing.lessonId) : undefined, practiceSetId: existing.practiceSetId ? String(existing.practiceSetId) : undefined }, true)))) return { ok: false, code: "INVALID", fieldErrors: { status: ["This content is incomplete or has unpublished references."] } };
    const updated = await model.findByIdAndUpdate(parsed.data.id, { $set: { status: parsed.data.status } }, { returnDocument: "after", runValidators: true }).exec();
    if (!updated) return { ok: false, code: "NOT_FOUND" };
    revalidateAdmin(); return { ok: true, id: parsed.data.id };
  } catch (error) { return duplicateOrDatabase(error, label); }
}

function isPublishable(label: string, valueToCheck: Record<string, unknown>) {
  const localizedFields = label === "vocabulary" ? ["word", "definition", "translation"] : label === "grammar" ? ["title", "summary", "explanation"] : label === "listening" ? ["title", "description", "audioSrc"] : label === "reading" ? ["title", "summary", "sections"] : ["title", "description", "instructions", "context", "role", "objective", "expectedLanguage"];
  if (localizedFields.some((key) => !valueToCheck[key])) return false;
  if (label === "listening" && typeof valueToCheck.audioSrc === "string" && !valueToCheck.audioSrc.startsWith("/audio/")) return false;
  if (label === "reading" && (!Array.isArray(valueToCheck.sections) || valueToCheck.sections.length === 0)) return false;
  if (label === "speaking" && (!Array.isArray(valueToCheck.successCriteria) || valueToCheck.successCriteria.length === 0)) return false;
  return true;
}
