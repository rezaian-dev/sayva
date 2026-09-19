import type { AppLocale } from "@/i18n/routing";
import type { SpeakingFeedback } from "@/validation/speaking/feedback";
import type { SpeakingScenarioDetail } from "@/lib/speaking/types";

export type SpeakingTranscriptionResult = {
  transcript: string;
};

export type SpeakingFeedbackInput = {
  scenario: SpeakingScenarioDetail;
  transcript: string;
  uiLocale: AppLocale;
};

export interface SpeakingAiProvider {
  transcribeAudio(input: {
    audio: Buffer;
    contentType: string;
    signal: AbortSignal;
  }): Promise<SpeakingTranscriptionResult>;
  generateFeedback(input: SpeakingFeedbackInput & { signal: AbortSignal }): Promise<SpeakingFeedback>;
}
