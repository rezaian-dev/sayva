"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import type { AdminActionResult } from "@/actions/admin/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Action = (previous: AdminActionResult | null, formData: FormData) => Promise<AdminActionResult>;

export function PracticeSetForm({ action, initial = {} }: { action: Action; initial?: Record<string, string> }) { const t = useTranslations("admin"); const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null); return <form action={formAction}><Card><CardHeader><CardTitle>Practice set</CardTitle></CardHeader><CardContent className="grid gap-4"><input type="hidden" name="id" value={initial.id ?? ""} /><Field name="lessonId" label="Lesson id" value={initial.lessonId} /><Field name="slug" label={t("fields.slug")} value={initial.slug} /><div className="grid gap-4 sm:grid-cols-2"><Field name="titleFa" label={t("fields.titleFa")} value={initial.titleFa} /><Field name="titleEn" label={t("fields.titleEn")} value={initial.titleEn} /></div><div className="grid gap-4 sm:grid-cols-2"><Field name="descriptionFa" label={t("fields.descriptionFa")} value={initial.descriptionFa} /><Field name="descriptionEn" label={t("fields.descriptionEn")} value={initial.descriptionEn} /></div><Field name="order" label={t("fields.order")} value={initial.order ?? "0"} type="number" /><Button type="submit" disabled={pending}>{pending ? t("saving") : t("save")}</Button>{message(t, state)}</CardContent></Card></form>; }

export function PracticeExerciseForm({ action, initial = "" }: { action: Action; initial?: string }) { const t = useTranslations("admin"); const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null); return <form action={formAction}><Card><CardHeader><CardTitle>Practice exercise JSON</CardTitle></CardHeader><CardContent className="grid gap-4"><Textarea name="payload" defaultValue={initial} rows={18} placeholder={'{"exerciseType":"multiple-choice",...}'} required /><p className="text-caption text-muted-foreground">{t("help.json")}</p><Button type="submit" disabled={pending}>{pending ? t("saving") : t("save")}</Button>{message(t, state)}</CardContent></Card></form>; }

export function PracticeStatusForm({ id, status, action }: { id: string; status: "draft" | "published" | "archived"; action: Action }) { const t = useTranslations("admin"); const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null); return <div className="flex flex-wrap gap-2">{(["published", "draft", "archived"] as const).map((next) => <form key={next} action={formAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={next} /><Button type="submit" variant={next === "published" ? "default" : "outline"} disabled={pending || next === status}>{t(next === "published" ? "publish" : next === "draft" ? "draft" : "archive")}</Button></form>)}{message(t, state)}</div>; }
function Field({ name, label, value = "", type = "text" }: { name: string; label: string; value?: string; type?: string }) { return <label className="grid gap-2 text-body-sm"><span>{label}</span><Input name={name} defaultValue={value} type={type} required /></label>; }
function message(t: ReturnType<typeof useTranslations<"admin">>, state: AdminActionResult | null) { return state?.ok ? <p className="text-body-sm text-success" role="status">{t("saved")}</p> : state && !state.ok ? <p className="text-body-sm text-destructive" role="alert">{Object.values(state.fieldErrors ?? {}).flat().join(" ") || t(`errors.${state.code}`)}</p> : null; }
