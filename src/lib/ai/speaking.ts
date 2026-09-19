import type { AppLocale } from "@/i18n/routing";
import type { SpeakingFeedback } from "@/validation/speaking/feedback";
import { speakingFeedbackSchema } from "@/validation/speaking/feedback";
import { speakingTranscriptSchema } from "@/validation/speaking/audio";
import type { SpeakingAiProvider } from "@/lib/ai/types";
import type { SpeakingScenarioDetail } from "@/lib/speaking/types";

export class SpeakingAiProviderUnavailableError extends Error {
  readonly code = "AI_PROVIDER_NOT_CONFIGURED" as const;

  constructor() {
    super("No approved AI provider is configured for SAYVA Speaking.");
    this.name = "SpeakingAiProviderUnavailableError";
  }
}

export class SpeakingAiOutputInvalidError extends Error {
  readonly code = "AI_OUTPUT_INVALID" as const;

  constructor() {
    super("The AI provider returned output that did not match the SAYVA Speaking contract.");
    this.name = "SpeakingAiOutputInvalidError";
  }
}

/**
 * Provider-neutral boundary. Phase 0–6 did not approve an AI provider, so no
 * provider client or secret is silently introduced here. A concrete provider
 * must implement SpeakingAiProvider before live transcription is enabled.
 */
export function getSpeakingAiProvider(): SpeakingAiProvider {
  throw new SpeakingAiProviderUnavailableError();
}

export async function processSpeakingAudio({
  audio,
  contentType,
  scenario,
  uiLocale,
}: {
  audio: Buffer;
  contentType: string;
  scenario: SpeakingScenarioDetail;
  uiLocale: AppLocale;
}) {
  const provider = getSpeakingAiProvider();
  const transcription = await withTimeout(
    (signal) => provider.transcribeAudio({ audio, contentType, signal }),
    45_000,
  );
  const transcriptResult = speakingTranscriptSchema.safeParse(transcription.transcript);
  if (!transcriptResult.success) throw new SpeakingAiOutputInvalidError();

  let feedback: SpeakingFeedback | null = null;
  let feedbackFailureCode: "FEEDBACK_FAILED" | "AI_OUTPUT_INVALID" = "FEEDBACK_FAILED";
  try {
    const rawFeedback = await withTimeout(
      (signal) => provider.generateFeedback({ scenario, transcript: transcriptResult.data, uiLocale, signal }),
      45_000,
    );
    const parsedFeedback = speakingFeedbackSchema.safeParse(rawFeedback);
    if (!parsedFeedback.success) throw new SpeakingAiOutputInvalidError();
    feedback = parsedFeedback.data;
  } catch (error) {
    feedbackFailureCode = error instanceof SpeakingAiOutputInvalidError ? "AI_OUTPUT_INVALID" : "FEEDBACK_FAILED";
  }

  return { transcript: transcriptResult.data, feedback, feedbackFailureCode };
}

async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  milliseconds: number,
) {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("SPEAKING_PROCESSING_TIMEOUT"));
        }, milliseconds);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
