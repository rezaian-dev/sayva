import { z } from "zod";

export const speakingAudioContentTypes = [
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
] as const;

export const speakingAudioMetadataSchema = z.object({
  contentType: z.enum(speakingAudioContentTypes),
  sizeBytes: z.number().int().positive().max(4_000_000),
  durationSeconds: z.number().finite().min(1).max(180),
});

export const speakingTranscriptSchema = z.string().trim().min(1).max(12_000);
