import { z } from "zod";

export const speakingAttemptStatusSchema = z.enum([
  "started",
  "recorded",
  "processing",
  "completed",
  "failed",
]);
