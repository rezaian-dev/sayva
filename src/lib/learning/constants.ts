export const curriculumStatuses = [
  "draft",
  "published",
  "archived",
] as const;

export type CurriculumStatus = (typeof curriculumStatuses)[number];

export const lessonContentKinds = [
  "introduction",
  "explanation",
  "example",
  "summary",
] as const;

export type LessonContentKind = (typeof lessonContentKinds)[number];
