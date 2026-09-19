export function normalizeAnswer(value: string, caseSensitive = false) {
  const normalized = value.normalize("NFC").trim().replace(/\s+/gu, " ");
  return caseSensitive ? normalized : normalized.toLocaleLowerCase("en-US");
}

export function sameStringSet(left: string[], right: string[]) {
  return left.length === right.length && new Set(left).size === left.length && left.every((value) => right.includes(value));
}
