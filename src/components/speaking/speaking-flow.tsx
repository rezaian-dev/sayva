"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, LoaderCircle, Mic, Square, Trash2 } from "lucide-react";

import { cancelSpeakingAttempt, startSpeakingAttempt } from "@/actions/speaking";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { canTransitionSpeakingState, isSpeakingDurationAllowed, selectSupportedAudioMimeType, type SpeakingFlowState } from "@/lib/speaking/rules";
import type { SpeakingFeedback } from "@/validation/speaking/feedback";
import type { SpeakingScenarioDetail } from "@/lib/speaking/types";

const flowSteps = ["scenario", "preparation", "requesting_permission", "ready", "recording", "processing", "transcript", "feedback"] as const;

type UploadResult =
  | { ok: true; status: "transcript" | "completed"; attemptId: string; transcript: string; feedback: SpeakingFeedback | null }
  | { ok: false; code: string };

type PermissionErrorCode = "denied" | "dismissed" | "noMicrophone" | "unsupported" | "secure" | "unavailable";

export function SpeakingFlow({ scenario, locale }: { scenario: SpeakingScenarioDetail; locale: AppLocale }) {
  const t = useTranslations("speaking");
  const [flowState, setFlowState] = useState<SpeakingFlowState>("scenario");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<PermissionErrorCode | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const elapsedRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelRequestedRef = useRef(false);

  const transition = useCallback((next: SpeakingFlowState) => {
    setFlowState((current) => canTransitionSpeakingState(current, next) ? next : current);
  }, []);

  const releaseStream = useCallback((activeStream: MediaStream | null) => {
    activeStream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  }, []);

  const resetToPreparation = useCallback(() => {
    releaseStream(stream);
    recorderRef.current = null;
    chunksRef.current = [];
    cancelRequestedRef.current = false;
    setAttemptId(null);
    elapsedRef.current = 0;
    setElapsedSeconds(0);
    setErrorCode(null);
    setPermissionError(null);
    setTranscript(null);
    setFeedback(null);
    setFlowState("preparation");
  }, [releaseStream, stream]);

  useEffect(() => {
    return () => {
      cancelRequestedRef.current = true;
      if (recorderRef.current) {
        recorderRef.current.onstop = null;
        if (recorderRef.current.state !== "inactive") recorderRef.current.stop();
      }
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
  }, []);

  useEffect(() => {
    if (flowState === "recording" && elapsedSeconds >= scenario.durationLimitSeconds) {
      stopRecording();
    }
  }, [elapsedSeconds, flowState, scenario.durationLimitSeconds, stopRecording]);

  useEffect(() => {
    if (flowState !== "recording") return;
    const timer = window.setInterval(() => setElapsedSeconds((value) => {
      const next = value + 1;
      elapsedRef.current = next;
      return next;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [flowState]);

  const requestPermission = async () => {
    setErrorCode(null);
    setPermissionError(null);
    transition("requesting_permission");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setPermissionError("unsupported");
      transition("error");
      return;
    }
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const result = await startSpeakingAttempt(scenario.id);
      if (!result.ok) {
        releaseStream(nextStream);
        setErrorCode(result.code);
        transition("error");
        return;
      }
      setAttemptId(result.attemptId);
      setStream(nextStream);
      transition("ready");
    } catch (error) {
      setPermissionError(getPermissionErrorCode(error));
      transition("error");
    }
  };

  const startRecording = () => {
    if (!stream || !attemptId || typeof MediaRecorder === "undefined") {
      setErrorCode("ATTEMPT_NOT_ACCEPTING_AUDIO");
      transition("error");
      return;
    }
    const supportedMimeType = selectSupportedAudioMimeType((mimeType) => MediaRecorder.isTypeSupported(mimeType));
    try {
      const recorder = supportedMimeType ? new MediaRecorder(stream, { mimeType: supportedMimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      cancelRequestedRef.current = false;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        cancelRequestedRef.current = true;
        recorder.onstop = null;
        setErrorCode("PROCESSING_FAILED");
        releaseStream(stream);
        transition("error");
      };
      recorder.onstop = () => {
        const responseAttemptId = attemptId;
        const wasCancelled = cancelRequestedRef.current;
        const recordedBlob = new Blob(chunksRef.current, { type: recorder.mimeType || supportedMimeType || "audio/webm" });
        recorderRef.current = null;
        chunksRef.current = [];
        releaseStream(stream);
        if (wasCancelled) {
          void cancelSpeakingAttempt(scenario.id, responseAttemptId);
          setAttemptId(null);
          elapsedRef.current = 0;
          setElapsedSeconds(0);
          transition("preparation");
          return;
        }
        void submitRecording(responseAttemptId, recordedBlob);
      };
      elapsedRef.current = 0;
      setElapsedSeconds(0);
      recorder.start();
      transition("recording");
    } catch {
      releaseStream(stream);
      setErrorCode("PROCESSING_FAILED");
      transition("error");
    }
  };

  const submitRecording = async (responseAttemptId: string, blob: Blob) => {
    const recordedDurationSeconds = elapsedRef.current;
    if (!isSpeakingDurationAllowed(recordedDurationSeconds, scenario.durationLimitSeconds)) {
      setErrorCode("RECORDING_LIMIT_EXCEEDED");
      transition("error");
      return;
    }
    transition("processing");
    const formData = new FormData();
    formData.set("audio", blob, "speaking-response");
    formData.set("durationSeconds", String(recordedDurationSeconds));
    try {
      const response = await fetch(`/api/speaking/${scenario.id}/${responseAttemptId}/audio`, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
        headers: { "x-sayva-locale": locale },
      });
      const payload = await response.json() as UploadResult;
      if (!response.ok || !payload.ok) {
        setErrorCode(payload.ok ? "PROCESSING_FAILED" : payload.code);
        transition("error");
        return;
      }
      setAttemptId(payload.attemptId);
      setTranscript(payload.transcript);
      setFeedback(payload.feedback);
      transition("transcript");
    } catch {
      setErrorCode("PROCESSING_FAILED");
      transition("error");
    }
  };

  const cancelRecording = () => {
    cancelRequestedRef.current = true;
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      recorder.stop();
    } else if (attemptId) {
      void cancelSpeakingAttempt(scenario.id, attemptId);
      resetToPreparation();
    } else {
      resetToPreparation();
    }
  };

  const permissionMessage = permissionError === "denied" ? t("permission.denied") : permissionError === "dismissed" ? t("permission.dismissed") : permissionError === "noMicrophone" ? t("permission.noMicrophone") : permissionError === "unsupported" ? t("permission.unsupported") : permissionError === "secure" ? t("permission.secure") : permissionError === "unavailable" ? t("permission.unavailable") : null;
  const processingMessage = errorCode === "UNAUTHORIZED" ? t("errors.UNAUTHORIZED") : errorCode === "INVALID" ? t("errors.INVALID") : errorCode === "NOT_FOUND" ? t("errors.NOT_FOUND") : errorCode === "DATABASE" ? t("errors.DATABASE") : errorCode === "AI_PROVIDER_NOT_CONFIGURED" ? t("errors.AI_PROVIDER_NOT_CONFIGURED") : errorCode === "AI_OUTPUT_INVALID" ? t("errors.AI_OUTPUT_INVALID") : errorCode === "TRANSCRIPTION_FAILED" ? t("errors.TRANSCRIPTION_FAILED") : errorCode === "FEEDBACK_FAILED" ? t("errors.FEEDBACK_FAILED") : errorCode === "PROCESSING_TIMEOUT" ? t("errors.PROCESSING_TIMEOUT") : errorCode === "INVALID_AUDIO" ? t("errors.INVALID_AUDIO") : errorCode === "AUDIO_REQUIRED" ? t("errors.AUDIO_REQUIRED") : errorCode === "AUDIO_TOO_LARGE" ? t("errors.AUDIO_TOO_LARGE") : errorCode === "RECORDING_LIMIT_EXCEEDED" ? t("errors.RECORDING_LIMIT_EXCEEDED") : errorCode === "ATTEMPT_NOT_ACCEPTING_AUDIO" ? t("errors.ATTEMPT_NOT_ACCEPTING_AUDIO") : t("errors.PROCESSING_FAILED");
  const displayError = permissionMessage ?? processingMessage;
  const flowLabel = (state: SpeakingFlowState) => {
    switch (state) {
      case "scenario": return t("flow.scenario");
      case "preparation": return t("flow.preparation");
      case "requesting_permission": return t("flow.requesting_permission");
      case "ready": return t("flow.ready");
      case "recording": return t("flow.recording");
      case "processing": return t("flow.processing");
      case "transcript": return t("flow.transcript");
      case "feedback": return t("flow.feedback");
      case "error": return t("flow.error");
    }
  };
  const resultHref = attemptId ? `/speaking/${scenario.id}/results/${attemptId}` : `/speaking/${scenario.id}`;
  const currentStepIndex = flowState === "error" ? 0 : flowSteps.indexOf(flowState);

  return (
    <section aria-labelledby="speaking-flow-title" className="border-t border-border/70 pt-8">
      <h2 id="speaking-flow-title" className="sr-only">{flowLabel(flowState)}</h2>
      <ol aria-label={t("navigationLabel")} className="flex gap-2 overflow-x-auto pb-2">
        {flowSteps.map((step) => {
          const active = step === flowState;
          const completed = flowSteps.indexOf(step) < currentStepIndex;
          return <li key={step} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-caption ${active ? "border-primary bg-primary/10 text-foreground" : completed ? "border-success/30 text-success" : "border-border text-muted-foreground"}`} aria-current={active ? "step" : undefined}>{completed ? <Check aria-hidden className="size-3.5" /> : null}{flowLabel(step)}</li>;
        })}
      </ol>
      <div className="mt-5" aria-live="polite">
        {flowState === "scenario" ? <FlowCard title={t("home.title")} description={t("scenario.preparationDescription")}><Button type="button" onClick={() => transition("preparation")}>{t("scenario.begin")}</Button></FlowCard> : null}
        {flowState === "preparation" ? <FlowCard title={t("scenario.preparation")} description={t("scenario.preparationDescription")}><div className="grid gap-4"><p className="text-body">{t("scenario.instructions")}: {scenario.instructions[locale]}</p>{scenario.preparationTips.length ? <div><h3 className="text-h3">{t("scenario.tips")}</h3><ul className="mt-3 grid gap-2">{scenario.preparationTips.map((tip, index) => <li key={index} className="flex gap-3 text-body-sm"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />{tip[locale]}</li>)}</ul></div> : null}<Button type="button" onClick={requestPermission}><Mic aria-hidden className="size-4" />{t("scenario.continuePermission")}</Button></div></FlowCard> : null}
        {flowState === "requesting_permission" ? <FlowCard title={t("permission.title")} description={t("permission.requesting")}><LoaderCircle aria-hidden className="size-5 animate-spin" /></FlowCard> : null}
        {flowState === "ready" ? <FlowCard title={t("ready.title")} description={t("ready.description")}><div className="grid gap-4"><p className="text-body-sm text-muted-foreground">{t("ready.reminder")}: {scenario.objective[locale]}</p><div className="flex flex-wrap gap-3"><Button type="button" onClick={startRecording}><Mic aria-hidden className="size-4" />{t("ready.start")}</Button><Button type="button" variant="outline" onClick={resetToPreparation}>{t("ready.back")}</Button></div></div></FlowCard> : null}
        {flowState === "recording" ? <FlowCard title={t("recording.title")} description={t("recording.status")}><div className="grid gap-4"><p className="font-en text-4xl font-bold" dir="ltr">{formatSeconds(elapsedSeconds)}</p><p className="text-body-sm text-muted-foreground">{t("recording.limit", { count: scenario.durationLimitSeconds })}</p><div className="flex flex-wrap gap-3"><Button type="button" onClick={stopRecording}><Square aria-hidden className="size-4" />{t("recording.stop")}</Button><Button type="button" variant="outline" onClick={cancelRecording}><Trash2 aria-hidden className="size-4" />{t("recording.cancel")}</Button></div></div></FlowCard> : null}
        {flowState === "processing" ? <FlowCard title={t("processing.title")} description={t("processing.description")}><p className="flex items-center gap-2 text-body-sm" role="status"><LoaderCircle aria-hidden className="size-4 animate-spin" />{t("processing.status")}</p></FlowCard> : null}
        {flowState === "transcript" ? <FlowCard title={t("transcript.title")} description={t("transcript.description")}><div className="grid gap-4"><p className="whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-4 text-body" dir="ltr">{transcript}</p>{feedback ? <Button type="button" onClick={() => transition("feedback")}>{t("transcript.viewFeedback")}</Button> : <><p className="text-body-sm text-muted-foreground">{t("feedback.description")}</p><Button type="button" onClick={resetToPreparation}>{t("transcript.retry")}</Button></>}</div></FlowCard> : null}
        {flowState === "feedback" && feedback ? <FeedbackCard feedback={feedback} resultHref={resultHref} onRetry={resetToPreparation} /> : null}
        {flowState === "error" ? <FlowCard title={t("flow.error")} description={displayError}><div className="flex flex-wrap gap-3"><Button type="button" onClick={resetToPreparation}>{t("permission.tryAgain")}</Button><Link href={resultHref} className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-body-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{t("scenario.savedResult")}</Link></div></FlowCard> : null}
      </div>
    </section>
  );
}

function FlowCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7"><div className="grid gap-5"><div><h3 className="text-h2">{title}</h3><p className="text-body-sm mt-2 text-muted-foreground">{description}</p></div>{children}</div></div>;
}

function FeedbackCard({ feedback, resultHref, onRetry }: { feedback: SpeakingFeedback; resultHref: string; onRetry: () => void }) {
  const t = useTranslations("speaking.feedback");
  const sections = [["strengths", feedback.strengths], ["areasToImprove", feedback.areasToImprove], ["grammarNotes", feedback.grammarNotes], ["vocabularySuggestions", feedback.vocabularySuggestions], ["fluencyNotes", feedback.fluencyNotes]] as const;
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7"><div className="grid gap-5"><div><h3 className="text-h2">{t("title")}</h3><p className="text-body-sm mt-2 text-muted-foreground">{t("description")}</p></div><p className="text-body">{feedback.overallFeedback}</p>{sections.map(([key, items]) => items.length ? <section key={key} aria-labelledby={`flow-feedback-${key}`}><h4 id={`flow-feedback-${key}`} className="text-h3">{t(key)}</h4><ul className="mt-2 grid gap-2">{items.map((item, index) => <li key={index} className="flex gap-3 text-body-sm"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />{item}</li>)}</ul></section> : null)}{feedback.correctionExamples.length ? <section><h4 className="text-h3">{t("corrections")}</h4><div className="mt-2 grid gap-3">{feedback.correctionExamples.map((item, index) => <div key={index} className="rounded-xl border border-border bg-muted/30 p-4 text-body-sm"><p><strong>{t("original")}:</strong> <span dir="ltr">{item.original}</span></p><p className="mt-2"><strong>{t("improved")}:</strong> <span dir="ltr">{item.improved}</span></p><p className="mt-2 text-caption text-muted-foreground">{item.explanation}</p></div>)}</div></section> : null}<div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><h4 className="text-h3">{t("nextAttempt")}</h4><p className="mt-2 text-body-sm">{feedback.nextAttemptSuggestion}</p></div><div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={onRetry}><Trash2 aria-hidden className="size-4" />{t("retry")}</Button><Link href={resultHref} className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-body-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{t("savedResult")}</Link><Link href="/speaking" className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-body-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{t("continue")}</Link></div></div></div>;
}

function formatSeconds(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function getPermissionErrorCode(error: unknown): PermissionErrorCode {
  if (!(error instanceof DOMException)) return "unavailable";
  if (error.name === "NotAllowedError") return "denied";
  if (error.name === "NotFoundError") return "noMicrophone";
  if (error.name === "SecurityError" || error.name === "TypeError") return "secure";
  if (error.name === "AbortError") return "dismissed";
  return "unavailable";
}
