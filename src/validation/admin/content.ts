import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const slug = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Use letters, numbers, and hyphens");
const shortText = z.string().trim().min(1).max(500);
const longText = z.string().trim().min(1).max(5000);
const localized = z.object({ fa: longText, en: longText }).strict();
const localizedShort = z.object({ fa: shortText, en: shortText }).strict();
const contentStatus = z.enum(["draft", "published", "archived"]);
const optionalObjectId = objectId.optional();
const optionalText = z.string().trim().max(500).optional();
const order = z.coerce.number().int().min(0).max(100000);

const example = z.object({ sentence: longText, translation: z.string().trim().max(2000).optional() }).strict();
const pronunciation = z.object({ ipa: z.string().trim().max(120).optional(), audioSrc: z.string().trim().regex(/^\/audio\//).optional() }).strict();

export const vocabularyContentSchema = z.object({
  slug,
  word: shortText,
  partOfSpeech: optionalText,
  definition: localized,
  translation: localized,
  examples: z.array(example).max(20),
  pronunciation: pronunciation.optional(),
  level: optionalText,
  lessonId: optionalObjectId,
  practiceSetId: optionalObjectId,
  order,
}).strict();

const grammarExample = z.object({ sentence: longText, translation: z.string().trim().max(2000).optional(), note: localized.optional() }).strict();
const grammarMistake = z.object({ mistake: localized, correction: localized }).strict();

export const grammarContentSchema = z.object({
  slug,
  title: localizedShort,
  level: optionalText,
  summary: localized,
  explanation: localized,
  examples: z.array(grammarExample).max(30),
  commonMistakes: z.array(grammarMistake).max(30),
  lessonId: optionalObjectId,
  practiceSetId: optionalObjectId,
  order,
}).strict();

export const listeningContentSchema = z.object({
  slug,
  title: localizedShort,
  description: localized,
  audioSrc: z.string().trim().regex(/^\/audio\/[A-Za-z0-9_./-]+$/, "Audio must be a repository-local /audio path"),
  durationSeconds: z.coerce.number().int().min(0).max(7200).optional(),
  level: optionalText,
  transcript: localized.optional(),
  transcriptVisibility: z.enum(["hidden", "on-request", "always"]),
  lessonId: optionalObjectId,
  practiceSetId: optionalObjectId,
  order,
}).strict();

const readingSection = z.object({ heading: localized.optional(), paragraphs: z.array(localized).min(1).max(100) }).strict();

export const readingContentSchema = z.object({
  slug,
  title: localizedShort,
  summary: localized,
  level: optionalText,
  sections: z.array(readingSection).min(1).max(100),
  estimatedDuration: z.coerce.number().int().min(1).max(720).optional(),
  lessonId: optionalObjectId,
  practiceSetId: optionalObjectId,
  order,
}).strict();

export const speakingScenarioSchema = z.object({
  slug,
  title: localizedShort,
  description: localized,
  instructions: localized,
  context: localized,
  role: localized,
  objective: localized,
  successCriteria: z.array(localized).max(12),
  preparationTips: z.array(localized).max(12),
  level: optionalText,
  topic: optionalText,
  durationLimitSeconds: z.coerce.number().int().min(15).max(180),
  expectedLanguage: z.string().trim().min(2).max(64),
  order,
}).strict();

export const statusSchema = z.object({ id: objectId, status: contentStatus }).strict();
export const idSchema = z.object({ id: objectId }).strict();
export const adminObjectId = objectId;
export type ContentStatus = z.infer<typeof contentStatus>;

export const learningLevelSchema = z.object({
  code: z.string().trim().min(1).max(16),
  slug,
  title: localizedShort,
  description: localized,
  order,
}).strict();

export const learningCourseSchema = z.object({
  levelId: objectId,
  slug,
  title: localizedShort,
  description: localized,
  order,
}).strict();

export const learningUnitSchema = z.object({
  courseId: objectId,
  slug,
  title: localizedShort,
  description: localized,
  order,
}).strict();

const lessonBlock = z.object({ key: z.string().trim().min(1).max(120), kind: z.enum(["introduction", "explanation", "example", "summary"]), title: localizedShort, body: localized, order }).strict();
export const learningLessonSchema = z.object({
  unitId: objectId,
  slug,
  title: localizedShort,
  description: localized,
  order,
  estimatedDuration: z.coerce.number().int().min(1).max(720).optional(),
  objectives: z.array(localized).max(20),
  content: z.array(lessonBlock).max(100),
}).strict();

export const practiceSetSchema = z.object({
  lessonId: objectId,
  slug,
  title: localizedShort,
  description: localized,
  order,
}).strict();

const practiceOption = z.object({ id: z.string().trim().min(1).max(80), label: localizedShort }).strict();
const matchingItem = practiceOption;
const matchingPair = z.object({ leftId: z.string().trim().min(1).max(80), rightId: z.string().trim().min(1).max(80) }).strict();
export const practiceExerciseSchema = z.discriminatedUnion("exerciseType", [
  z.object({ exerciseType: z.literal("multiple-choice"), practiceSetId: objectId, prompt: localized, instruction: localized.optional(), order, options: z.array(practiceOption).min(2).max(20), correctOptionId: z.string().trim().min(1).max(80) }).strict(),
  z.object({ exerciseType: z.literal("fill-blank"), practiceSetId: objectId, prompt: localized, instruction: localized.optional(), order, acceptedAnswers: z.array(z.string().trim().min(1).max(500)).min(1).max(20), caseSensitive: z.boolean() }).strict(),
  z.object({ exerciseType: z.literal("matching"), practiceSetId: objectId, prompt: localized, instruction: localized.optional(), order, leftItems: z.array(matchingItem).min(1).max(50), rightItems: z.array(matchingItem).min(1).max(50), pairs: z.array(matchingPair).min(1).max(50) }).strict(),
  z.object({ exerciseType: z.literal("ordering"), practiceSetId: objectId, prompt: localized, instruction: localized.optional(), order, items: z.array(matchingItem).min(2).max(50), correctOrder: z.array(z.string().trim().min(1).max(80)).min(2).max(50) }).strict(),
]);

export { contentStatus, localized, localizedShort, objectId };
