import type { LessonContentKind } from "@/lib/learning/constants";
import type { LocalizedText } from "@/models/learning/types";

export type LessonSummary = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
  estimatedDuration?: number;
  completed: boolean;
  levelSlug: string;
  courseSlug: string;
  unitSlug: string;
};

export type CurriculumUnit = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
  lessons: LessonSummary[];
};

export type CurriculumCourse = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
  units: CurriculumUnit[];
};

export type CurriculumLevel = {
  id: string;
  code: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
};

export type LearningHomeData = {
  levels: CurriculumLevel[];
  currentLevel: CurriculumLevel | null;
  courses: CurriculumCourse[];
  currentLesson: LessonSummary | null;
  completedLessons: number;
  totalLessons: number;
  learnerLevel: string | null;
};

export type LessonPageData = {
  level: CurriculumLevel;
  course: CurriculumCourse;
  unit: CurriculumUnit;
  lesson: LessonSummary & {
    objectives: LocalizedText[];
    content: Array<{
      key: string;
      kind: LessonContentKind;
      title: LocalizedText;
      body: LocalizedText;
      order: number;
    }>;
  };
  completed: boolean;
  previousLesson: LessonSummary | null;
  nextLesson: LessonSummary | null;
};
