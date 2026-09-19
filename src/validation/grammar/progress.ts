import { z } from "zod";

export const grammarTopicIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
export const grammarProgressSchema = z.object({
  topicId: grammarTopicIdSchema,
  state: z.enum(["in_progress", "completed"]),
});
