export function isListeningComplete(state: "in_progress" | "completed" | null) {
  return state === "completed";
}
