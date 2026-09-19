import { z } from "zod";

export const lessonIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i);

export type LessonIdInput = z.infer<typeof lessonIdSchema>;
