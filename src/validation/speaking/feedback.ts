import { z } from "zod";

const feedbackLine = z.string().trim().min(1).max(500);

export const speakingFeedbackSchema = z.object({
  overallFeedback: z.string().trim().min(1).max(1600),
  strengths: z.array(feedbackLine).max(4),
  areasToImprove: z.array(feedbackLine).max(4),
  grammarNotes: z.array(feedbackLine).max(4),
  vocabularySuggestions: z.array(feedbackLine).max(4),
  fluencyNotes: z.array(feedbackLine).max(4),
  correctionExamples: z.array(
    z.object({
      original: feedbackLine,
      improved: feedbackLine,
      explanation: feedbackLine,
    }).strict(),
  ).max(4),
  nextAttemptSuggestion: z.string().trim().min(1).max(800),
}).strict();

export type SpeakingFeedback = z.infer<typeof speakingFeedbackSchema>;
