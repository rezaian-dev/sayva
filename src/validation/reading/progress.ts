import { z } from "zod";

export const readingItemIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
export const readingProgressSchema = z.object({
  itemId: readingItemIdSchema,
  state: z.enum(["in_progress", "completed"]),
});
