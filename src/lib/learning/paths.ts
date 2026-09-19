export function learningLevelPath(levelSlug: string) {
  return `/learn/${levelSlug}`;
}

export function learningCoursePath(levelSlug: string, courseSlug: string) {
  return `/learn/${levelSlug}/${courseSlug}`;
}

export function learningUnitPath(
  levelSlug: string,
  courseSlug: string,
  unitSlug: string,
) {
  return `/learn/${levelSlug}/${courseSlug}/${unitSlug}`;
}

export function learningLessonPath(
  levelSlug: string,
  courseSlug: string,
  unitSlug: string,
  lessonSlug: string,
) {
  return `/learn/${levelSlug}/${courseSlug}/${unitSlug}/${lessonSlug}`;
}
