import { z } from "zod";

export const speakingScenarioIdSchema = z.object({
  scenarioId: z.string().regex(/^[a-f\d]{24}$/i),
});

export const speakingAttemptIdSchema = z.object({
  scenarioId: z.string().regex(/^[a-f\d]{24}$/i),
  attemptId: z.string().regex(/^[a-f\d]{24}$/i),
});
