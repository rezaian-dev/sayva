import type { SpeakingAttemptStatus, SpeakingFailureCode, SpeakingFeedbackRecord, SpeakingScenarioRecord } from "@/models/speaking/types";
import type { LocalizedText } from "@/models/learning/types";

export type SpeakingScenarioListItem = Pick<SpeakingScenarioRecord, "slug" | "title" | "description" | "level" | "topic" | "durationLimitSeconds" | "expectedLanguage"> & {
  id: string;
};

export type SpeakingScenarioDetail = Omit<SpeakingScenarioRecord, "_id" | "createdAt" | "updatedAt" | "status" | "order"> & {
  id: string;
};

export type SpeakingAttemptView = {
  id: string;
  scenarioId: string;
  status: SpeakingAttemptStatus;
  transcript?: string;
  feedback?: SpeakingFeedbackRecord;
  failureCode?: SpeakingFailureCode;
  startedAt: string;
  completedAt?: string;
};

export type SpeakingResultView = {
  scenario: SpeakingScenarioDetail;
  attempt: SpeakingAttemptView;
};

export type SpeakingLocalizedField = LocalizedText;
