export function isReadingComplete(state: "in_progress" | "completed" | null) {
  return state === "completed";
}
