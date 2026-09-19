import type { Types } from "mongoose";

import type {
  CurriculumStatus,
  LessonContentKind,
} from "@/lib/learning/constants";

export type LocalizedText = {
  fa: string;
  en: string;
};

export type LevelRecord = {
  _id: Types.ObjectId;
  code: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
  status: CurriculumStatus;
};

export type CourseRecord = {
  _id: Types.ObjectId;
  levelId: Types.ObjectId;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
  status: CurriculumStatus;
};

export type UnitRecord = {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
  status: CurriculumStatus;
};

export type LessonContentBlock = {
  key: string;
  kind: LessonContentKind;
  title: LocalizedText;
  body: LocalizedText;
  order: number;
};

export type LessonRecord = {
  _id: Types.ObjectId;
  unitId: Types.ObjectId;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
  status: CurriculumStatus;
  estimatedDuration?: number;
  objectives: LocalizedText[];
  content: LessonContentBlock[];
};

export type LessonProgressRecord = {
  _id: Types.ObjectId;
  userId: string;
  lessonId: Types.ObjectId;
  status: "in_progress" | "completed";
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
