import mongoose, { Schema } from "mongoose";

import { contentStatusValues, localizedTextSchema, practiceReferenceFields } from "@/models/domain/common";
import type { ListeningItemRecord } from "@/models/listening/types";

const listeningItemSchema = new Schema<ListeningItemRecord>(
  {
    slug: { type: String, required: true, trim: true },
    title: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    audioSrc: { type: String, required: true, match: /^\/audio\//, trim: true },
    durationSeconds: { type: Number, min: 0 },
    level: { type: String, trim: true },
    transcript: { type: localizedTextSchema },
    transcriptVisibility: {
      type: String,
      enum: ["hidden", "on-request", "always"],
      required: true,
      default: "on-request",
    },
    ...practiceReferenceFields,
    order: { type: Number, required: true, min: 0 },
    status: { type: String, enum: contentStatusValues, required: true, default: "draft" },
  },
  { collection: "listening_items", timestamps: true, strict: true },
);

listeningItemSchema.index({ slug: 1 }, { unique: true });
listeningItemSchema.index({ status: 1, order: 1, _id: 1 });
listeningItemSchema.index({ level: 1, status: 1, order: 1 });

export const ListeningItem =
  mongoose.models.ListeningItem ??
  mongoose.model<ListeningItemRecord>("ListeningItem", listeningItemSchema);
