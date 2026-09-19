export function isGrammarComplete(state: "in_progress" | "completed" | null) {
  return state === "completed";
}
