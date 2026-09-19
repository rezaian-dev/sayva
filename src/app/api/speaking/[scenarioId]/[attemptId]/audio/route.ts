import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/session";
import { processSpeakingAudio, SpeakingAiOutputInvalidError, SpeakingAiProviderUnavailableError } from "@/lib/ai/speaking";
import { completeSpeakingAttempt, failSpeakingAttempt, findOwnedSpeakingAttempt, getPublishedSpeakingScenario, markSpeakingAttemptProcessing, markSpeakingAttemptRecorded, recordSpeakingTranscriptFailure } from "@/lib/db/speaking";
import { isSpeakingDurationAllowed } from "@/lib/speaking/rules";
import { speakingAudioMetadataSchema } from "@/validation/speaking/audio";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 4_000_000;
const allowedContentTypes = new Set(["audio/webm", "audio/mp4", "audio/ogg"]);

type AudioRouteContext = { params: Promise<{ scenarioId: string; attemptId: string }> };

export async function POST(request: Request, { params }: AudioRouteContext) {
  const { scenarioId, attemptId } = await params;
  const session = await getServerSession();
  if (!session?.user?.id) return jsonError("UNAUTHORIZED", 401);

  const scenario = await getPublishedSpeakingScenario(scenarioId);
  if (!scenario) return jsonError("NOT_FOUND", 404);
  const attempt = await findOwnedSpeakingAttempt(session.user.id, scenarioId, attemptId);
  if (!attempt) return jsonError("NOT_FOUND", 404);
  if (attempt.status !== "started") return jsonError("ATTEMPT_NOT_ACCEPTING_AUDIO", 409);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("INVALID_REQUEST", 400);
  }

  const audio = formData.get("audio");
  const durationResult = Number(formData.get("durationSeconds"));
  if (!(audio instanceof File)) return jsonError("AUDIO_REQUIRED", 400);
  const contentType = audio.type.split(";", 1)[0]?.toLowerCase() ?? "";
  const metadata = speakingAudioMetadataSchema.safeParse({
    contentType,
    sizeBytes: audio.size,
    durationSeconds: durationResult,
  });
  if (!metadata.success || !allowedContentTypes.has(contentType)) {
    await failSpeakingAttempt(session.user.id, scenarioId, attemptId, "INVALID_AUDIO");
    return jsonError("INVALID_AUDIO", 400);
  }
  if (!isSpeakingDurationAllowed(durationResult, scenario.durationLimitSeconds)) {
    await failSpeakingAttempt(session.user.id, scenarioId, attemptId, "INVALID_AUDIO");
    return jsonError("RECORDING_LIMIT_EXCEEDED", 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    await failSpeakingAttempt(session.user.id, scenarioId, attemptId, "INVALID_AUDIO");
    return jsonError("AUDIO_TOO_LARGE", 413);
  }

  const recorded = await markSpeakingAttemptRecorded(session.user.id, scenarioId, attemptId);
  if (!recorded) return jsonError("ATTEMPT_NOT_ACCEPTING_AUDIO", 409);
  const processing = await markSpeakingAttemptProcessing(session.user.id, scenarioId, attemptId);
  if (!processing) return jsonError("ATTEMPT_NOT_ACCEPTING_AUDIO", 409);

  try {
    const result = await processSpeakingAudio({
      audio: Buffer.from(await audio.arrayBuffer()),
      contentType,
      scenario,
      uiLocale: getUiLocale(request),
    });
    if (!result.feedback) {
      await recordSpeakingTranscriptFailure(
        session.user.id,
        scenarioId,
        attemptId,
        result.transcript,
        result.feedbackFailureCode,
      );
      return NextResponse.json({
        ok: true,
        status: "transcript",
        attemptId,
        transcript: result.transcript,
        feedback: null,
      });
    }
    const completed = await completeSpeakingAttempt(
      session.user.id,
      scenarioId,
      attemptId,
      result.transcript,
      result.feedback,
    );
    if (!completed) return jsonError("ATTEMPT_NOT_ACCEPTING_AUDIO", 409);
    return NextResponse.json({
      ok: true,
      status: "completed",
      attemptId,
      transcript: result.transcript,
      feedback: result.feedback,
    });
  } catch (error) {
    const failureCode = error instanceof SpeakingAiProviderUnavailableError
      ? "AI_PROVIDER_NOT_CONFIGURED"
      : error instanceof SpeakingAiOutputInvalidError
        ? "AI_OUTPUT_INVALID"
        : error instanceof Error && error.message === "SPEAKING_PROCESSING_TIMEOUT"
          ? "PROCESSING_TIMEOUT"
          : "PROCESSING_FAILED";
    await failSpeakingAttempt(session.user.id, scenarioId, attemptId, failureCode);
    const status = failureCode === "AI_PROVIDER_NOT_CONFIGURED" ? 503 : 502;
    return jsonError(failureCode, status);
  }
}

function getUiLocale(request: Request) {
  const header = request.headers.get("x-sayva-locale");
  return header === "en" ? "en" : "fa";
}

function jsonError(code: string, status: number) {
  return NextResponse.json({ ok: false, code }, { status });
}
