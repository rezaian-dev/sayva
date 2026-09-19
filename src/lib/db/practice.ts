import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongodb";
import { LearningLesson } from "@/models/learning/lesson";
import { PracticeExercise } from "@/models/practice/exercise";
import { PracticeSession } from "@/models/practice/session";
import { PracticeSet } from "@/models/practice/set";
import type {
  PracticeExerciseRecord,
  PracticeSessionRecord,
  PracticeSetRecord,
} from "@/models/practice/types";
import type {
  PracticeHomeData,
  PracticePageData,
  PracticeSetSummary,
  PublicPracticeExercise,
} from "@/lib/practice/types";
const published = { status: "published" as const };

function toSetSummary(
  set: PracticeSetRecord,
  exerciseCount: number,
  active: boolean,
): PracticeSetSummary {
  return {
    id: set._id.toString(),
    lessonId: set.lessonId.toString(),
    slug: set.slug,
    title: set.title,
    description: set.description,
    exerciseCount,
    active,
  };
}

function toPublicExercise(exercise: PracticeExerciseRecord): PublicPracticeExercise {
  const base = {
    id: exercise._id.toString(),
    prompt: exercise.prompt,
    instruction: exercise.instruction,
    order: exercise.order,
  };

  switch (exercise.exerciseType) {
    case "multiple-choice":
      return { ...base, exerciseType: exercise.exerciseType, options: exercise.options };
    case "fill-blank":
      return { ...base, exerciseType: exercise.exerciseType };
    case "matching":
      return {
        ...base,
        exerciseType: exercise.exerciseType,
        leftItems: exercise.leftItems,
        rightItems: exercise.rightItems,
      };
    case "ordering":
      return { ...base, exerciseType: exercise.exerciseType, items: exercise.items };
  }
}

function sessionAnsweredIds(session: PracticeSessionRecord) {
  return new Set(session.attempts.map((attempt) => attempt.exerciseId.toString()));
}

async function findPublishedSet(practiceSetId: string) {
  if (!Types.ObjectId.isValid(practiceSetId)) return null;

  const setId = new Types.ObjectId(practiceSetId);
  const set = await PracticeSet.findOne({ ...published, _id: setId })
    .lean<PracticeSetRecord>()
    .exec();
  if (!set) return null;

  const lesson = await LearningLesson.exists({ ...published, _id: set.lessonId });
  return lesson ? set : null;
}

export async function getPracticeHomeData(
  userId: string,
): Promise<PracticeHomeData> {
  await connectToDatabase();

  const sets = await PracticeSet.find(published)
    .sort({ order: 1, _id: 1 })
    .lean<PracticeSetRecord[]>()
    .exec();
  const lessonIds = sets.map((set) => set.lessonId);
  const publishedLessons = lessonIds.length
    ? await LearningLesson.find({ ...published, _id: { $in: lessonIds } })
        .select({ _id: 1 })
        .lean<{ _id: Types.ObjectId }[]>()
        .exec()
    : [];
  const publishedLessonIds = new Set(publishedLessons.map((lesson) => lesson._id.toString()));
  const publishedSets = sets.filter((set) => publishedLessonIds.has(set.lessonId.toString()));

  const activeSessions = userId
    ? await PracticeSession.find({
        userId,
        status: "active",
        practiceSetId: { $in: publishedSets.map((set) => set._id) },
      })
        .select({ practiceSetId: 1 })
        .lean<Array<Pick<PracticeSessionRecord, "practiceSetId">>>()
        .exec()
    : [];
  const activeSetIds = new Set(activeSessions.map((session) => session.practiceSetId.toString()));
  const exerciseCounts = await Promise.all(
    publishedSets.map((set) =>
      PracticeExercise.countDocuments({ ...published, practiceSetId: set._id }).exec(),
    ),
  );

  return {
    sets: publishedSets.map((set, index) =>
      toSetSummary(set, exerciseCounts[index], activeSetIds.has(set._id.toString())),
    ),
  };
}

export async function getPracticePageData(
  userId: string,
  practiceSetId: string,
): Promise<PracticePageData | null> {
  await connectToDatabase();
  const set = await findPublishedSet(practiceSetId);
  if (!set) return null;

  const exercises = await PracticeExercise.find({
    ...published,
    practiceSetId: set._id,
  })
    .sort({ order: 1, _id: 1 })
    .lean<PracticeExerciseRecord[]>()
    .exec();
  const activeSession = await PracticeSession.findOne({
    userId,
    practiceSetId: set._id,
    status: "active",
  })
    .lean<PracticeSessionRecord>()
    .exec();
  const exerciseById = new Map(exercises.map((exercise) => [exercise._id.toString(), exercise]));
  const answeredIds = activeSession ? sessionAnsweredIds(activeSession) : new Set<string>();
  const currentExercise = activeSession
    ? activeSession.exerciseOrder
        .map((exerciseId) => exerciseById.get(exerciseId.toString()))
        .find((exercise) => exercise && !answeredIds.has(exercise._id.toString()))
    : null;

  return {
    set: toSetSummary(set, exercises.length, Boolean(activeSession)),
    session: activeSession
      ? {
          id: activeSession._id.toString(),
          status: activeSession.status,
          answeredCount: activeSession.attempts.length,
          totalCount: activeSession.exerciseOrder.length,
          scorePercent: activeSession.result?.scorePercent ?? null,
        }
      : null,
    currentExercise: currentExercise ? toPublicExercise(currentExercise) : null,
  };
}

export async function getPracticeResultData(userId: string, practiceSetId: string) {
  await connectToDatabase();
  const set = await findPublishedSet(practiceSetId);
  if (!set) return null;

  const session = await PracticeSession.findOne({
    userId,
    practiceSetId: set._id,
    status: "completed",
  })
    .sort({ completedAt: -1, updatedAt: -1 })
    .lean<PracticeSessionRecord>()
    .exec();
  if (!session?.result) return null;

  return {
    set: toSetSummary(set, session.result.totalCount, false),
    sessionId: session._id.toString(),
    result: session.result,
  };
}

export async function getPracticeSetForStart(practiceSetId: string) {
  await connectToDatabase();
  const set = await findPublishedSet(practiceSetId);
  if (!set) return null;

  const exercises = await PracticeExercise.find({
    ...published,
    practiceSetId: set._id,
  })
    .sort({ order: 1, _id: 1 })
    .select({ _id: 1 })
    .lean<Array<Pick<PracticeExerciseRecord, "_id">>>()
    .exec();

  return { set, exerciseIds: exercises.map((exercise) => exercise._id) };
}
