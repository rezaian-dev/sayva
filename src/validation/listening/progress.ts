import { z } from "zod";

export const listeningItemIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
export const listeningProgressSchema = z.object({
  itemId: listeningItemIdSchema,
  state: z.enum(["in_progress", "completed"]),
});
