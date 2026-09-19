import type { LocalizedText } from "@/models/learning/types";
import type { VocabularyProgressState, ContentProgressState } from "@/models/domain/types";

export type DomainProgressResult =
  | { ok: true; state: ContentProgressState }
  | { ok: false; code: "UNAUTHORIZED" | "INVALID" | "NOT_FOUND" | "DATABASE" };

export type PracticeLink = { practiceSetId: string } | null;

export type VocabularyListItem = {
  id: string;
  slug: string;
  word: string;
  partOfSpeech?: string;
  translation: LocalizedText;
  level?: string;
  state: VocabularyProgressState;
  practice: PracticeLink;
};

export type VocabularyDetail = VocabularyListItem & {
  definition: LocalizedText;
  examples: Array<{ sentence: string; translation?: string }>;
  pronunciation?: { ipa?: string; audioSrc?: string };
};

export type GrammarListItem = {
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  level?: string;
  state: ContentProgressState | null;
  practice: PracticeLink;
};

export type GrammarDetail = GrammarListItem & {
  explanation: LocalizedText;
  examples: Array<{ sentence: string; translation?: string; note?: LocalizedText }>;
  commonMistakes: Array<{ mistake: LocalizedText; correction: LocalizedText }>;
};

export type ListeningListItem = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  durationSeconds?: number;
  level?: string;
  state: ContentProgressState | null;
  practice: PracticeLink;
};

export type ListeningDetail = ListeningListItem & {
  audioSrc: string;
  transcript?: LocalizedText;
  transcriptVisibility: "hidden" | "on-request" | "always";
};

export type ReadingListItem = {
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  level?: string;
  estimatedDuration?: number;
  state: ContentProgressState | null;
  practice: PracticeLink;
};

export type ReadingDetail = ReadingListItem & {
  sections: Array<{ heading?: LocalizedText; paragraphs: LocalizedText[] }>;
};
