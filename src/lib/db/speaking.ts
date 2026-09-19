import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongodb";
import { SpeakingAttempt } from "@/models/speaking/attempt";
import { SpeakingScenario } from "@/models/speaking/scenario";
import type { SpeakingAttemptRecord, SpeakingFeedbackRecord, SpeakingScenarioRecord } from "@/models/speaking/types";
import type { SpeakingAttemptView, SpeakingScenarioDetail, SpeakingScenarioListItem } from "@/lib/speaking/types";

const SCENARIO_LIMIT = 24;
const ATTEMPT_LIMIT = 10;

export async function listPublishedSpeakingScenarios(): Promise<SpeakingScenarioListItem[]> {
  await connectToDatabase();
  const records = await SpeakingScenario.find({ status: "published" })
    .sort({ order: 1, _id: 1 })
    .limit(SCENARIO_LIMIT)
    .select({ slug: 1, title: 1, description: 1, level: 1, topic: 1, durationLimitSeconds: 1, expectedLanguage: 1 })
    .lean<SpeakingScenarioRecord[]>()
    .exec();

  return records.map((record) => ({
    id: record._id.toString(),
    slug: record.slug,
    title: record.title,
    description: record.description,
    level: record.level,
    topic: record.topic,
    durationLimitSeconds: record.durationLimitSeconds,
    expectedLanguage: record.expectedLanguage,
  }));
}

export async function getPublishedSpeakingScenario(scenarioId: string): Promise<SpeakingScenarioDetail | null> {
  if (!Types.ObjectId.isValid(scenarioId)) return null;
  await connectToDatabase();
  const record = await SpeakingScenario.findOne({ _id: scenarioId, status: "published" })
    .lean<SpeakingScenarioRecord>()
    .exec();
  return record ? mapScenario(record) : null;
}

export async function listOwnedSpeakingAttempts(userId: string, scenarioId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(scenarioId)) return [];
  const records = await SpeakingAttempt.find({ userId, scenarioId: new Types.ObjectId(scenarioId) })
    .sort({ createdAt: -1, _id: -1 })
    .limit(ATTEMPT_LIMIT)
    .lean<SpeakingAttemptRecord[]>()
    .exec();
  return records.map(mapAttempt);
}

export async function createSpeakingAttempt(userId: string, scenarioId: string) {
  await connectToDatabase();
  const now = new Date();
  const record = await SpeakingAttempt.create({
    userId,
    scenarioId: new Types.ObjectId(scenarioId),
    status: "started",
    startedAt: now,
  });
  return record._id.toString();
}

export async function findOwnedSpeakingAttempt(userId: string, scenarioId: string, attemptId: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(scenarioId) || !Types.ObjectId.isValid(attemptId)) return null;
  return SpeakingAttempt.findOne({
    _id: attemptId,
    userId,
    scenarioId: new Types.ObjectId(scenarioId),
  }).lean<SpeakingAttemptRecord>().exec();
}

export async function markSpeakingAttemptRecorded(userId: string, scenarioId: string, attemptId: string) {
  await connectToDatabase();
  return SpeakingAttempt.findOneAndUpdate(
    { _id: attemptId, userId, scenarioId: new Types.ObjectId(scenarioId), status: "started" },
    { $set: { status: "recorded", recordedAt: new Date() } },
    { returnDocument: "after", runValidators: true },
  ).lean<SpeakingAttemptRecord>().exec();
}

export async function markSpeakingAttemptProcessing(userId: string, scenarioId: string, attemptId: string) {
  await connectToDatabase();
  return SpeakingAttempt.findOneAndUpdate(
    { _id: attemptId, userId, scenarioId: new Types.ObjectId(scenarioId), status: "recorded" },
    { $set: { status: "processing", processingStartedAt: new Date() } },
    { returnDocument: "after", runValidators: true },
  ).lean<SpeakingAttemptRecord>().exec();
}

export async function completeSpeakingAttempt(
  userId: string,
  scenarioId: string,
  attemptId: string,
  transcript: string,
  feedback: SpeakingFeedbackRecord,
) {
  await connectToDatabase();
  return SpeakingAttempt.findOneAndUpdate(
    { _id: attemptId, userId, scenarioId: new Types.ObjectId(scenarioId), status: "processing" },
    {
      $set: {
        status: "completed",
        transcript,
        feedback,
        completedAt: new Date(),
      },
      $unset: { failureCode: 1, failedAt: 1 },
    },
    { returnDocument: "after", runValidators: true },
  ).lean<SpeakingAttemptRecord>().exec();
}

export async function recordSpeakingTranscriptFailure(
  userId: string,
  scenarioId: string,
  attemptId: string,
  transcript: string,
  failureCode: "FEEDBACK_FAILED" | "AI_OUTPUT_INVALID",
) {
  await connectToDatabase();
  return SpeakingAttempt.findOneAndUpdate(
    { _id: attemptId, userId, scenarioId: new Types.ObjectId(scenarioId), status: "processing" },
    {
      $set: {
        status: "failed",
        transcript,
        failureCode,
        failedAt: new Date(),
      },
    },
    { returnDocument: "after", runValidators: true },
  ).lean<SpeakingAttemptRecord>().exec();
}

export async function failSpeakingAttempt(
  userId: string,
  scenarioId: string,
  attemptId: string,
  failureCode: SpeakingAttemptRecord["failureCode"],
) {
  await connectToDatabase();
  return SpeakingAttempt.findOneAndUpdate(
    {
      _id: attemptId,
      userId,
      scenarioId: new Types.ObjectId(scenarioId),
      status: { $in: ["started", "recorded", "processing"] },
    },
    { $set: { status: "failed", failureCode, failedAt: new Date() } },
    { returnDocument: "after", runValidators: true },
  ).lean<SpeakingAttemptRecord>().exec();
}

function mapScenario(record: SpeakingScenarioRecord): SpeakingScenarioDetail {
  return {
    id: record._id.toString(),
    slug: record.slug,
    title: record.title,
    description: record.description,
    instructions: record.instructions,
    context: record.context,
    role: record.role,
    objective: record.objective,
    successCriteria: record.successCriteria,
    preparationTips: record.preparationTips,
    level: record.level,
    topic: record.topic,
    durationLimitSeconds: record.durationLimitSeconds,
    expectedLanguage: record.expectedLanguage,
  };
}

function mapAttempt(record: SpeakingAttemptRecord): SpeakingAttemptView {
  return {
    id: record._id.toString(),
    scenarioId: record.scenarioId.toString(),
    status: record.status,
    transcript: record.transcript,
    feedback: record.feedback,
    failureCode: record.failureCode,
    startedAt: record.startedAt.toISOString(),
    completedAt: record.completedAt?.toISOString(),
  };
}
