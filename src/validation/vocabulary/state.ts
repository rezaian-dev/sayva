import { z } from "zod";

export const vocabularyItemIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
export const vocabularyStateSchema = z.object({
  itemId: vocabularyItemIdSchema,
  state: z.enum(["new", "learning", "known"]),
});
