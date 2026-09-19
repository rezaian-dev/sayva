export const vocabularyProgressStates = ["new", "learning", "known"] as const;
export type VocabularyState = (typeof vocabularyProgressStates)[number];

export function normalizeVocabularyWord(value: string) {
  return value.normalize("NFC").trim().toLocaleLowerCase("en-US").replace(/\s+/gu, " ");
}

export function isVocabularyKnown(state: VocabularyState) {
  return state === "known";
}
