import type { LocalizedText } from "@/models/learning/types";
import type { PracticeExerciseType } from "@/models/practice/types";

export type PublicPracticeExercise = {
  id: string;
  exerciseType: PracticeExerciseType;
  prompt: LocalizedText;
  instruction?: LocalizedText;
  order: number;
} & (
  | {
      exerciseType: "multiple-choice";
      options: Array<{ id: string; label: LocalizedText }>;
    }
  | {
      exerciseType: "fill-blank";
    }
  | {
      exerciseType: "matching";
      leftItems: Array<{ id: string; label: LocalizedText }>;
      rightItems: Array<{ id: string; label: LocalizedText }>;
    }
  | {
      exerciseType: "ordering";
      items: Array<{ id: string; label: LocalizedText }>;
    }
);

export type PracticeSetSummary = {
  id: string;
  lessonId: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  exerciseCount: number;
  active: boolean;
};

export type PracticeHomeData = {
  sets: PracticeSetSummary[];
};

export type PracticePageData = {
  set: PracticeSetSummary;
  session: {
    id: string;
    status: "active" | "completed";
    answeredCount: number;
    totalCount: number;
    scorePercent: number | null;
  } | null;
  currentExercise: PublicPracticeExercise | null;
};

export type SubmitPracticeResult =
  | {
      ok: true;
      isCorrect: boolean;
      completed: boolean;
      answeredCount: number;
      totalCount: number;
    }
  | {
      ok: false;
      code:
        | "UNAUTHORIZED"
        | "INVALID"
        | "NOT_FOUND"
        | "NOT_ACTIVE"
        | "ALREADY_SUBMITTED"
        | "DATABASE";
    };
