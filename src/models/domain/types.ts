import type { Types } from "mongoose";

export const domainProgressNames = [
  "vocabulary",
  "grammar",
  "listening",
  "reading",
] as const;

export type DomainProgressName = (typeof domainProgressNames)[number];
export type VocabularyProgressState = "new" | "learning" | "known";
export type ContentProgressState = "in_progress" | "completed";
export type DomainProgressState = VocabularyProgressState | ContentProgressState;

export type LearnerDomainProgressRecord = {
  _id: Types.ObjectId;
  userId: string;
  domain: DomainProgressName;
  contentId: Types.ObjectId;
  state: DomainProgressState;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
