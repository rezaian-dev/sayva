"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import type { AdminContentDomain } from "@/lib/db/admin";
import type { ContentStatus } from "@/models/domain/common";
import type { AdminActionResult } from "@/actions/admin/content";

export type AdminContentFormValues = Record<string, unknown> & { id?: string; status?: ContentStatus };
type AdminAction = (previous: AdminActionResult | null, formData: FormData) => Promise<AdminActionResult>;

function text(values: AdminContentFormValues, key: string) {
  const value = values[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
function nestedText(values: AdminContentFormValues, key: string, language: "fa" | "en") {
  const value = values[key];
  if (!value || typeof value !== "object") return "";
  const nested = value as Record<string, unknown>;
  return typeof nested[language] === "string" ? nested[language] as string : "";
}
function json(values: AdminContentFormValues, key: string, fallback: unknown) {
  const value = values[key] ?? fallback;
  return JSON.stringify(value, null, 2);
}

export function AdminContentForm({ domain, initial, action, isEdit }: { domain: AdminContentDomain; initial: AdminContentFormValues; action: AdminAction; isEdit: boolean }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);
  useEffect(() => { if (state?.ok && !isEdit) router.replace(`/admin/${domain}/${state.id}`); }, [domain, isEdit, router, state]);
  const errorText = state && !state.ok ? Object.values(state.fieldErrors ?? {}).flat().join(" ") || t(`errors.${state.code}`) : null;
  const title = isEdit ? t("edit") : t("new");
  return <form action={formAction} className="grid gap-6"><input type="hidden" name="id" value={text(initial, "id")} /><Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="grid gap-5"><div className="grid gap-4 sm:grid-cols-2"><Field label={t("fields.slug")} name="slug" defaultValue={text(initial, "slug")} required /><Field label={t("fields.order")} name="order" type="number" defaultValue={text(initial, "order") || "0"} required /></div>{renderFields(domain, initial, t)}</CardContent></Card><div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={pending}>{pending ? t("saving") : t("save")}</Button>{state?.ok ? <p className="text-body-sm text-success" role="status">{t("saved")}</p> : null}{errorText ? <p className="text-body-sm text-destructive" role="alert">{errorText}</p> : null}</div></form>;
}

function renderFields(domain: AdminContentDomain, values: AdminContentFormValues, t: ReturnType<typeof useTranslations<"admin">>) {
  if (domain === "vocabulary") return <><div className="grid gap-4 sm:grid-cols-2"><Field label={t("fields.word")} name="word" defaultValue={text(values, "word")} required /><Field label={t("fields.partOfSpeech")} name="partOfSpeech" defaultValue={text(values, "partOfSpeech")} /></div><LocalizedPair labelFa={t("fields.definitionFa")} labelEn={t("fields.definitionEn")} name="definition" values={values} /><LocalizedPair labelFa={t("fields.translationFa")} labelEn={t("fields.translationEn")} name="translation" values={values} /><JsonField t={t} name="examples" label={t("fields.examples")} value={json(values, "examples", [])} /><JsonField t={t} name="pronunciation" label={t("fields.pronunciation")} value={json(values, "pronunciation", {})} /><References t={t} values={values} />;</>;
  if (domain === "grammar") return <><LocalizedPair labelFa={t("fields.titleFa")} labelEn={t("fields.titleEn")} name="title" values={values} /><LocalizedPair labelFa={t("fields.summaryFa")} labelEn={t("fields.summaryEn")} name="summary" values={values} /><LocalizedPair labelFa={t("fields.explanationFa")} labelEn={t("fields.explanationEn")} name="explanation" values={values} multiline /><JsonField t={t} name="examples" label={t("fields.examples")} value={json(values, "examples", [])} /><JsonField t={t} name="commonMistakes" label={t("fields.commonMistakes")} value={json(values, "commonMistakes", [])} /><References t={t} values={values} />;</>;
  if (domain === "listening") return <><LocalizedPair labelFa={t("fields.titleFa")} labelEn={t("fields.titleEn")} name="title" values={values} /><LocalizedPair labelFa={t("fields.descriptionFa")} labelEn={t("fields.descriptionEn")} name="description" values={values} multiline /><div className="grid gap-4 sm:grid-cols-2"><Field label={t("fields.audioSrc")} name="audioSrc" defaultValue={text(values, "audioSrc")} required /><Field label={t("fields.durationSeconds")} name="durationSeconds" type="number" defaultValue={text(values, "durationSeconds")} /></div><label className="grid gap-2 text-body-sm"><span>{t("fields.transcriptVisibility")}</span><select name="transcriptVisibility" defaultValue={text(values, "transcriptVisibility") || "on-request"} className="h-10 rounded-lg border border-input bg-background px-3"><option value="hidden">hidden</option><option value="on-request">on-request</option><option value="always">always</option></select></label><JsonField t={t} name="transcript" label={t("fields.transcript")} value={json(values, "transcript", {})} /><References t={t} values={values} /><p className="text-caption text-muted-foreground">{t("help.audio")}</p></>;
  if (domain === "reading") return <><LocalizedPair labelFa={t("fields.titleFa")} labelEn={t("fields.titleEn")} name="title" values={values} /><LocalizedPair labelFa={t("fields.summaryFa")} labelEn={t("fields.summaryEn")} name="summary" values={values} multiline /><Field label={t("fields.durationSeconds")} name="estimatedDuration" type="number" defaultValue={text(values, "estimatedDuration")} /><JsonField t={t} name="sections" label={t("fields.sections")} value={json(values, "sections", [])} /><References t={t} values={values} />;</>;
  return <><LocalizedPair labelFa={t("fields.titleFa")} labelEn={t("fields.titleEn")} name="title" values={values} /><LocalizedPair labelFa={t("fields.descriptionFa")} labelEn={t("fields.descriptionEn")} name="description" values={values} multiline /><LocalizedPair labelFa={t("fields.instructionsFa")} labelEn={t("fields.instructionsEn")} name="instructions" values={values} multiline /><LocalizedPair labelFa={t("fields.contextFa")} labelEn={t("fields.contextEn")} name="context" values={values} multiline /><LocalizedPair labelFa={t("fields.roleFa")} labelEn={t("fields.roleEn")} name="role" values={values} /><LocalizedPair labelFa={t("fields.objectiveFa")} labelEn={t("fields.objectiveEn")} name="objective" values={values} /><div className="grid gap-4 sm:grid-cols-2"><Field label={t("fields.topic")} name="topic" defaultValue={text(values, "topic")} /><Field label={t("fields.expectedLanguage")} name="expectedLanguage" defaultValue={text(values, "expectedLanguage") || "en"} required /><Field label={t("fields.durationLimitSeconds")} name="durationLimitSeconds" type="number" defaultValue={text(values, "durationLimitSeconds") || "60"} required /></div><JsonField t={t} name="successCriteria" label={t("fields.successCriteria")} value={json(values, "successCriteria", [])} /><JsonField t={t} name="preparationTips" label={t("fields.preparationTips")} value={json(values, "preparationTips", [])} /></>;
}

function LocalizedPair({ name, values, labelFa, labelEn, multiline = false }: { name: string; values: AdminContentFormValues; labelFa: string; labelEn: string; multiline?: boolean }) { return <div className="grid gap-4 sm:grid-cols-2"><Field label={labelFa} name={`${name}Fa`} defaultValue={nestedText(values, name, "fa")} multiline={multiline} required /><Field label={labelEn} name={`${name}En`} defaultValue={nestedText(values, name, "en")} multiline={multiline} required /></div>; }
function References({ t, values }: { t: ReturnType<typeof useTranslations<"admin">>; values: AdminContentFormValues }) { return <div className="grid gap-4 sm:grid-cols-2"><Field label={t("fields.level")} name="level" defaultValue={text(values, "level")} /><Field label={t("fields.lessonId")} name="lessonId" defaultValue={text(values, "lessonId")} /><Field label={t("fields.practiceSetId")} name="practiceSetId" defaultValue={text(values, "practiceSetId")} /></div>; }
function JsonField({ t, name, label, value }: { t: ReturnType<typeof useTranslations<"admin">>; name: string; label: string; value: string }) { return <label className="grid gap-2 text-body-sm"><span>{label}</span><Textarea name={name} defaultValue={value} rows={6} aria-describedby={`${name}-help`} /><span id={`${name}-help`} className="text-caption text-muted-foreground">{t("help.json")}</span></label>; }
function Field({ label, name, defaultValue, type = "text", required = false, multiline = false }: { label: string; name: string; defaultValue: string; type?: string; required?: boolean; multiline?: boolean }) { return <label className="grid gap-2 text-body-sm"><span>{label}</span>{multiline ? <Textarea name={name} defaultValue={defaultValue} rows={4} required={required} /> : <Input name={name} type={type} defaultValue={defaultValue} required={required} />}</label>; }

export function AdminStatusForm({ id, status, action }: { id: string; status: ContentStatus; action: AdminAction }) {
  const t = useTranslations("admin");
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);
  return <Card className="mt-6"><CardHeader><CardTitle>{t("status")}: {t(`statuses.${status}`)}</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2"><form action={formAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="published" /><Button type="submit" disabled={pending || status === "published"}>{t("publish")}</Button></form><form action={formAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="draft" /><Button type="submit" variant="outline" disabled={pending || status === "draft"}>{t("draft")}</Button></form><form action={formAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="archived" /><Button type="submit" variant="outline" disabled={pending || status === "archived"}>{t("archive")}</Button></form></div>{state && !state.ok ? <p className="mt-3 text-body-sm text-destructive" role="alert">{Object.values(state.fieldErrors ?? {}).flat().join(" ") || t(`errors.${state.code}`)}</p> : state?.ok ? <p className="mt-3 text-body-sm text-success" role="status">{t("saved")}</p> : null}</CardContent></Card>;
}
