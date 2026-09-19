import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongodb";
import { normalizeLearnerLevelSlug } from "@/lib/learning/level-map";
import { LearningCourse } from "@/models/learning/course";
import { LearningLesson } from "@/models/learning/lesson";
import { LearningLevel } from "@/models/learning/level";
import { LessonProgress } from "@/models/learning/progress";
import { LearningUnit } from "@/models/learning/unit";
import type {
  CourseRecord,
  LessonContentBlock,
  LessonRecord,
  LessonProgressRecord,
  LevelRecord,
  UnitRecord,
} from "@/models/learning/types";
import type {
  CurriculumCourse,
  CurriculumLevel,
  CurriculumUnit,
  LearningHomeData,
  LessonPageData,
  LessonSummary,
} from "@/lib/learning/types";

const published = { status: "published" as const };

type PublishedTree = {
  level: CurriculumLevel;
  courses: CurriculumCourse[];
};

function toLevel(level: LevelRecord): CurriculumLevel {
  return {
    id: level._id.toString(),
    code: level.code,
    slug: level.slug,
    title: level.title,
    description: level.description,
    order: level.order,
  };
}

function toLessonSummary(
  lesson: LessonRecord,
  levelSlug: string,
  courseSlug: string,
  unitSlug: string,
  completedLessonIds: Set<string>,
): LessonSummary {
  return {
    id: lesson._id.toString(),
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    estimatedDuration: lesson.estimatedDuration,
    completed: completedLessonIds.has(lesson._id.toString()),
    levelSlug,
    courseSlug,
    unitSlug,
  };
}

async function loadPublishedTree(
  level: LevelRecord,
  userId: string,
): Promise<PublishedTree> {
  const courses = await LearningCourse.find({
    ...published,
    levelId: level._id,
  })
    .sort({ order: 1 })
    .lean<CourseRecord[]>()
    .exec();

  const courseIds = courses.map((course) => course._id);
  const units = courseIds.length
    ? await LearningUnit.find({ ...published, courseId: { $in: courseIds } })
        .sort({ order: 1 })
        .lean<UnitRecord[]>()
        .exec()
    : [];

  const unitIds = units.map((unit) => unit._id);
  const lessons = unitIds.length
    ? await LearningLesson.find({ ...published, unitId: { $in: unitIds } })
        .sort({ order: 1 })
        .lean<LessonRecord[]>()
        .exec()
    : [];

  const lessonIds = lessons.map((lesson) => lesson._id);
  const progress = lessonIds.length
    ? await LessonProgress.find({
        userId,
        lessonId: { $in: lessonIds },
      })
        .lean<LessonProgressRecord[]>()
        .exec()
    : [];

  const completedLessonIds = new Set(
    progress
      .filter((item) => item.status === "completed")
      .map((item) => item.lessonId.toString()),
  );
  const lessonsByUnit = new Map<string, LessonSummary[]>();

  for (const lesson of lessons) {
    const unit = units.find((item) => item._id.equals(lesson.unitId));
    const course = unit
      ? courses.find((item) => item._id.equals(unit.courseId))
      : undefined;

    if (!unit || !course) {
      continue;
    }

    const summary = toLessonSummary(
      lesson,
      level.slug,
      course.slug,
      unit.slug,
      completedLessonIds,
    );
    const current = lessonsByUnit.get(unit._id.toString()) ?? [];
    current.push(summary);
    lessonsByUnit.set(unit._id.toString(), current);
  }

  const curriculumCourses = courses.map<CurriculumCourse>((course) => ({
    id: course._id.toString(),
    slug: course.slug,
    title: course.title,
    description: course.description,
    order: course.order,
    units: units
      .filter((unit) => unit.courseId.equals(course._id))
      .map<CurriculumUnit>((unit) => ({
        id: unit._id.toString(),
        slug: unit.slug,
        title: unit.title,
        description: unit.description,
        order: unit.order,
        lessons: lessonsByUnit.get(unit._id.toString()) ?? [],
      })),
  }));

  return { level: toLevel(level), courses: curriculumCourses };
}

export async function getLearningHomeData(
  userId: string,
  learnerLevel: string | null,
): Promise<LearningHomeData> {
  await connectToDatabase();

  const levels = await LearningLevel.find(published)
    .sort({ order: 1 })
    .lean<LevelRecord[]>()
    .exec();
  // Onboarding stores self-assessed labels ("beginner", "intermediate",
  // ...) — not CEFR slugs. Normalize first, then fall back to the first
  // published level so the home page never renders empty while content
  // exists.
  const wantedSlug = normalizeLearnerLevelSlug(learnerLevel);
  const currentLevelRecord = wantedSlug
    ? (levels.find((level) => level.slug === wantedSlug) ?? levels[0] ?? null)
    : (levels[0] ?? null);

  if (!currentLevelRecord) {
    return {
      levels: [],
      currentLevel: null,
      courses: [],
      currentLesson: null,
      completedLessons: 0,
      totalLessons: 0,
      learnerLevel,
    };
  }

  const tree = await loadPublishedTree(currentLevelRecord, userId);
  const lessons = tree.courses.flatMap((course) =>
    course.units.flatMap((unit) => unit.lessons),
  );

  return {
    levels: levels.map(toLevel),
    currentLevel: tree.level,
    courses: tree.courses,
    currentLesson: lessons.find((lesson) => !lesson.completed) ?? null,
    completedLessons: lessons.filter((lesson) => lesson.completed).length,
    totalLessons: lessons.length,
    learnerLevel,
  };
}

export async function getLevelCurriculum(
  userId: string,
  levelSlug: string,
): Promise<PublishedTree | null> {
  await connectToDatabase();
  const level = await LearningLevel.findOne({ ...published, slug: levelSlug })
    .lean<LevelRecord>()
    .exec();

  return level ? loadPublishedTree(level, userId) : null;
}

export async function getCourseCurriculum(
  userId: string,
  levelSlug: string,
  courseSlug: string,
): Promise<{ level: CurriculumLevel; course: CurriculumCourse } | null> {
  const tree = await getLevelCurriculum(userId, levelSlug);
  const course = tree?.courses.find((item) => item.slug === courseSlug);
  return tree && course ? { level: tree.level, course } : null;
}

export async function getUnitCurriculum(
  userId: string,
  levelSlug: string,
  courseSlug: string,
  unitSlug: string,
): Promise<{
  level: CurriculumLevel;
  course: CurriculumCourse;
  unit: CurriculumUnit;
} | null> {
  const courseData = await getCourseCurriculum(userId, levelSlug, courseSlug);
  const unit = courseData?.course.units.find((item) => item.slug === unitSlug);
  return courseData && unit ? { ...courseData, unit } : null;
}

export async function getLessonPageData(
  userId: string,
  levelSlug: string,
  courseSlug: string,
  unitSlug: string,
  lessonSlug: string,
): Promise<LessonPageData | null> {
  await connectToDatabase();

  const level = await LearningLevel.findOne({ ...published, slug: levelSlug })
    .lean<LevelRecord>()
    .exec();
  if (!level) return null;

  const course = await LearningCourse.findOne({
    ...published,
    levelId: level._id,
    slug: courseSlug,
  })
    .lean<CourseRecord>()
    .exec();
  if (!course) return null;

  const unit = await LearningUnit.findOne({
    ...published,
    courseId: course._id,
    slug: unitSlug,
  })
    .lean<UnitRecord>()
    .exec();
  if (!unit) return null;

  const lesson = await LearningLesson.findOne({
    ...published,
    unitId: unit._id,
    slug: lessonSlug,
  })
    .lean<LessonRecord>()
    .exec();
  if (!lesson) return null;

  const siblingLessons = await LearningLesson.find({
    ...published,
    unitId: unit._id,
  })
    .sort({ order: 1 })
    .lean<LessonRecord[]>()
    .exec();
  const progress = await LessonProgress.find({
    userId,
    lessonId: { $in: siblingLessons.map((item) => item._id) },
  })
    .lean<LessonProgressRecord[]>()
    .exec();
  const completedLessonIds = new Set(
    progress
      .filter((item) => item.status === "completed")
      .map((item) => item.lessonId.toString()),
  );
  const lessonSummaries = siblingLessons.map((item) =>
    toLessonSummary(
      item,
      level.slug,
      course.slug,
      unit.slug,
      completedLessonIds,
    ),
  );
  const currentIndex = lessonSummaries.findIndex(
    (item) => item.id === lesson._id.toString(),
  );

  return {
    level: toLevel(level),
    course: {
      id: course._id.toString(),
      slug: course.slug,
      title: course.title,
      description: course.description,
      order: course.order,
      units: [],
    },
    unit: {
      id: unit._id.toString(),
      slug: unit.slug,
      title: unit.title,
      description: unit.description,
      order: unit.order,
      lessons: lessonSummaries,
    },
    lesson: {
      ...lessonSummaries[currentIndex],
      objectives: lesson.objectives,
      content: lesson.content as LessonContentBlock[],
    },
    completed: completedLessonIds.has(lesson._id.toString()),
    previousLesson: currentIndex > 0 ? lessonSummaries[currentIndex - 1] : null,
    nextLesson:
      currentIndex >= 0 && currentIndex < lessonSummaries.length - 1
        ? lessonSummaries[currentIndex + 1]
        : null,
  };
}

export async function findPublishedLessonForCompletion(lessonId: string) {
  if (!Types.ObjectId.isValid(lessonId)) return null;

  await connectToDatabase();
  const lessonObjectId = new Types.ObjectId(lessonId);
  const lesson = await LearningLesson.findOne({
    ...published,
    _id: lessonObjectId,
  })
    .lean<LessonRecord>()
    .exec();
  if (!lesson) return null;

  const unit = await LearningUnit.findOne({
    ...published,
    _id: lesson.unitId,
  })
    .lean<UnitRecord>()
    .exec();
  if (!unit) return null;

  const course = await LearningCourse.findOne({
    ...published,
    _id: unit.courseId,
  })
    .lean<CourseRecord>()
    .exec();
  if (!course) return null;

  const level = await LearningLevel.findOne({
    ...published,
    _id: course.levelId,
  })
    .lean<LevelRecord>()
    .exec();
  if (!level) return null;

  return { level, course, unit, lesson };
}
