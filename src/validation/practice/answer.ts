import { z } from "zod";

const idSchema = z.string().trim().min(1).max(100);

export const practiceIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
export const localeSchema = z.enum(["en", "fa"]);

export const practiceResponseSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("multiple-choice"),
    optionId: idSchema,
  }),
  z.object({
    type: z.literal("fill-blank"),
    answer: z.string().max(500),
  }),
  z.object({
    type: z.literal("matching"),
    pairs: z
      .array(z.object({ leftId: idSchema, rightId: idSchema }))
      .max(100),
  }),
  z.object({
    type: z.literal("ordering"),
    itemIds: z.array(idSchema).max(100),
  }),
]);

export const startPracticeSchema = z.object({
  practiceSetId: practiceIdSchema,
  locale: localeSchema,
});

export const submitPracticeSchema = z.object({
  sessionId: practiceIdSchema,
  exerciseId: practiceIdSchema,
  response: z.string().max(5000),
});
