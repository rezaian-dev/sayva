export const speakingFlowStates = [
  "scenario",
  "preparation",
  "requesting_permission",
  "ready",
  "recording",
  "processing",
  "transcript",
  "feedback",
  "error",
] as const;

export type SpeakingFlowState = (typeof speakingFlowStates)[number];

export const audioMimeCandidates = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

export function selectSupportedAudioMimeType(isSupported: (mimeType: string) => boolean) {
  return audioMimeCandidates.find(isSupported);
}

export function isSpeakingDurationAllowed(durationSeconds: number, limitSeconds: number) {
  return Number.isFinite(durationSeconds) && durationSeconds >= 1 && durationSeconds <= limitSeconds;
}

export function canTransitionSpeakingState(from: SpeakingFlowState, to: SpeakingFlowState) {
  const transitions: Record<SpeakingFlowState, readonly SpeakingFlowState[]> = {
    scenario: ["preparation"],
    preparation: ["requesting_permission", "error"],
    requesting_permission: ["ready", "error", "preparation"],
    ready: ["recording", "preparation", "error"],
    recording: ["processing", "preparation", "error"],
    processing: ["transcript", "error"],
    transcript: ["feedback", "error"],
    feedback: ["preparation", "error"],
    error: ["preparation", "requesting_permission"],
  };
  return transitions[from].includes(to);
}

export function canRetrySpeakingAttempt(status: "started" | "recorded" | "processing" | "completed" | "failed") {
  return status === "completed" || status === "failed";
}
