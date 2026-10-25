"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, History, RotateCcw, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type VisualState = { h: number; w: number; f: number; m: number; tone: number; mode: "pele" | "musculo"; autoRotate: boolean; breathing: boolean; muscleLevels: number[]; fatOffsets: number[] };
type Assessment = {
  id: string; measured_on: string; height_cm: number | null; weight_kg: number | null; body_fat_percent: number | null;
  chest_cm: number | null; waist_cm: number | null; hips_cm: number | null; arm_cm: number | null;
  forearm_cm: number | null; thigh_cm: number | null; calf_cm: number | null; muscularity: number | null;
  bone_structure: number | null; notes: string | null; visual_snapshot: Partial<VisualState>;
};

const defaultVisual: VisualState = { h: 175, w: 72, f: 20, m: 30, tone: 1, mode: "pele", autoRotate: true, breathing: true, muscleLevels: [], fatOffsets: [] };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const measurementFields = [
  ["chest_cm", "Peito"], ["waist_cm", "Cintura"], ["hips_cm", "Quadril"], ["arm_cm", "Braço"],
  ["forearm_cm", "Antebraço"], ["thigh_cm", "Coxa"], ["calf_cm", "Panturrilha"],
] as const;

function optionalNumber(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  return value ? Number(value) : null;
}

export function BodyStudio() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [visual, setVisual] = useState<VisualState>(defaultVisual);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>();
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: preferences }, { data: history, error }] = await Promise.all([
      supabase.from("body_visual_preferences").select("height_cm,weight_kg,body_fat_percent,muscularity,skin_tone,view_mode,auto_rotate,breathing,muscle_levels,fat_offsets").maybeSingle(),
      supabase.from("body_assessments").select("id,measured_on,height_cm,weight_kg,body_fat_percent,chest_cm,waist_cm,hips_cm,arm_cm,forearm_cm,thigh_cm,calf_cm,muscularity,bone_structure,notes,visual_snapshot").order("measured_on", { ascending: false }).limit(100),
    ]);
    if (preferences) {
      const next: VisualState = { h: Number(preferences.height_cm), w: Number(preferences.weight_kg), f: Number(preferences.body_fat_percent), m: Number(preferences.muscularity), tone: Number(preferences.skin_tone), mode: preferences.view_mode === "muscle" ? "musculo" : "pele", autoRotate: preferences.auto_rotate, breathing: preferences.breathing, muscleLevels: Object.values(preferences.muscle_levels ?? {}).map(Number), fatOffsets: Object.values(preferences.fat_offsets ?? {}).map(Number) };
      setVisual(next);
      iframeRef.current?.contentWindow?.postMessage({ type: "brio-body-settings", value: next }, location.origin);
    }
    setAssessments((history ?? []) as Assessment[]);
    if (error) setMessage("Não foi possível carregar seu histórico corporal.");
    setLoading(false);
  }, []);

  useEffect(() => { const frame = requestAnimationFrame(() => void load()); return () => cancelAnimationFrame(frame); }, [load]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== location.origin || event.data?.type !== "brio-body-change") return;
      setVisual((current) => ({ ...current, ...(event.data.value as Partial<VisualState>) }));
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  function syncViewer(next: VisualState) {
    setVisual(next);
    iframeRef.current?.contentWindow?.postMessage({ type: "brio-body-settings", value: next }, location.origin);
  }

  async function saveVisual() {
    setMessage(undefined);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("body_visual_preferences").upsert({
      user_id: user.id, height_cm: visual.h, weight_kg: visual.w, body_fat_percent: visual.f,
      muscularity: visual.m, skin_tone: visual.tone, view_mode: visual.mode === "musculo" ? "muscle" : "skin",
      auto_rotate: visual.autoRotate, breathing: visual.breathing,
      muscle_levels: Object.fromEntries(visual.muscleLevels.map((value, index) => [index, value])),
      fat_offsets: Object.fromEntries(visual.fatOffsets.map((value, index) => [index, value])), updated_at: new Date().toISOString(),
    });
    setMessage(error ? "Não foi possível salvar a visualização." : "Visualização salva.");
  }

  async function saveAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(undefined);
    const data = new FormData(event.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const measuredOn = String(data.get("measured_on"));
    const payload = {
      user_id: user.id, measured_on: measuredOn,
      height_cm: optionalNumber(data, "height_cm"), weight_kg: optionalNumber(data, "weight_kg"),
      body_fat_percent: optionalNumber(data, "body_fat_percent"), muscularity: optionalNumber(data, "muscularity"),
      bone_structure: optionalNumber(data, "bone_structure"), notes: String(data.get("notes") ?? "").trim() || null,
      ...Object.fromEntries(measurementFields.map(([key]) => [key, optionalNumber(data, key)])), visual_snapshot: visual,
    };
    const { error } = await supabase.from("body_assessments").upsert(payload, { onConflict: "user_id,measured_on" });
    if (!error && payload.weight_kg) await supabase.from("weight_logs").upsert({ user_id: user.id, logged_on: measuredOn, weight_kg: payload.weight_kg }, { onConflict: "user_id,logged_on" });
    setMessage(error ? "Não foi possível salvar a avaliação. Revise os valores." : "Avaliação salva no histórico.");
    if (!error) { setFormKey((key) => key + 1); await load(); }
  }

  async function removeAssessment(id: string) {
    const { error } = await createClient().from("body_assessments").delete().eq("id", id);
    setMessage(error ? "Não foi possível remover a avaliação." : "Avaliação removida.");
    if (!error) await load();
  }

  function restoreAssessment(assessment: Assessment) {
    const snapshot = assessment.visual_snapshot ?? {};
    syncViewer({
      ...visual,
      h: Number(snapshot.h ?? assessment.height_cm ?? visual.h), w: Number(snapshot.w ?? assessment.weight_kg ?? visual.w),
      f: Number(snapshot.f ?? assessment.body_fat_percent ?? visual.f), m: Number(snapshot.m ?? assessment.muscularity ?? visual.m),
    });
    setMessage(`Avaliação de ${new Date(`${assessment.measured_on}T12:00:00`).toLocaleDateString("pt-BR")} aplicada ao avatar. Salve a visualização se quiser mantê-la.`);
  }

  const progress = useMemo(() => {
    if (assessments.length < 2) return null;
    const [current, previous] = assessments;
    const delta = (key: "weight_kg" | "waist_cm" | "body_fat_percent") => current[key] != null && previous[key] != null ? Number(current[key]) - Number(previous[key]) : null;
    return { weight: delta("weight_kg"), waist: delta("waist_cm"), fat: delta("body_fat_percent") };
  }, [assessments]);

  if (loading) return <p className="rounded-2xl bg-white p-6 text-sm">Carregando o estúdio corporal…</p>;

  return <div className="space-y-5">
    {message && <p role="status" className="rounded-2xl bg-[#c38d9e]/15 p-4 text-sm">{message}</p>}
    <section className="rounded-[28px] border border-white bg-[#fafaf7] p-3 shadow-[0_14px_40px_rgba(0,0,0,.055)] md:p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 px-1 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><SlidersHorizontal size={18}/><h2 className="text-2xl">Exploração visual</h2></div><p className="mt-1 text-sm text-[#5e5a56]">Gire, amplie, selecione músculos e ajuste a representação do corpo.</p></div><button onClick={saveVisual} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-4 text-sm font-bold text-white"><Save size={17}/> Salvar visualização</button></div>
      <iframe ref={iframeRef} onLoad={() => syncViewer(visual)} title="Estúdio corporal 3D interativo" src="/body-studio/index.html" className="h-[920px] w-full rounded-[22px] border-0 md:h-[790px]"/>
      <p className="mt-3 px-1 text-xs leading-5 text-[#5e5a56]">Representação visual aproximada para acompanhamento pessoal. Não estima composição corporal nem substitui avaliação clínica. O material recebido contém atualmente uma base corporal masculina; a licença do modelo-base deve ser validada antes de distribuição comercial.</p>
    </section>

    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <form key={formKey} onSubmit={saveAssessment} className="rounded-[28px] border border-white bg-[#fafaf7] p-5 shadow-[0_14px_40px_rgba(0,0,0,.055)] md:p-6">
        <div className="flex items-center gap-3"><Activity size={20}/><div><h2 className="text-3xl">Nova avaliação</h2><p className="text-sm text-[#5e5a56]">Campos vazios permanecem sem dado; nada é estimado.</p></div></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field name="measured_on" label="Data" type="date" defaultValue={today()} required/>
          <Field name="height_cm" label="Altura (cm)" defaultValue={visual.h} min={120} max={230}/>
          <Field name="weight_kg" label="Peso (kg)" defaultValue={visual.w} min={20} max={400}/>
          <Field name="body_fat_percent" label="Gordura informada (%)" defaultValue={visual.f} min={2} max={70}/>
          <Field name="muscularity" label="Desenvolvimento visual" defaultValue={visual.m} min={0} max={100} step={1}/>
          <Field name="bone_structure" label="Estrutura óssea visual" min={0} max={100} step={1}/>
          {measurementFields.map(([name, label]) => <Field key={name} name={name} label={`${label} (cm)`} min={10} max={250}/>)}
        </div>
        <label className="mt-4 block text-sm font-bold">Observações<textarea name="notes" maxLength={2000} rows={4} placeholder="Contexto da medição, horário ou condições relevantes" className="mt-2 w-full rounded-2xl border border-[#d9d2ca] bg-white p-3 font-normal outline-none focus:border-[#8b5c6c]"/></label>
        <button className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-black px-5 text-sm font-bold text-white"><Save size={17}/> Salvar avaliação</button>
      </form>

      <section className="rounded-[28px] border border-white bg-[#fafaf7] p-5 shadow-[0_14px_40px_rgba(0,0,0,.055)] md:p-6">
        <div className="flex items-center gap-3"><History size={20}/><div><h2 className="text-3xl">Evolução corporal</h2><p className="text-sm text-[#5e5a56]">Histórico real das avaliações salvas.</p></div></div>
        {progress && <div className="mt-5 grid grid-cols-3 gap-2">{[["Peso", progress.weight, "kg"], ["Cintura", progress.waist, "cm"], ["Gordura", progress.fat, "pp"]].map(([label, value, unit]) => <div key={label as string} className="rounded-2xl bg-[#f4f1ec] p-3"><p className="text-xs text-[#5e5a56]">{label}</p><p className="mt-1 font-serif text-xl">{value == null ? "—" : `${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(1)} ${unit}`}</p></div>)}</div>}
        <div className="mt-5 max-h-[520px] divide-y divide-[#e9e3db] overflow-y-auto">{assessments.map((assessment) => <article key={assessment.id} className="py-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{new Date(`${assessment.measured_on}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p><p className="mt-1 text-xs text-[#5e5a56]">{assessment.weight_kg ? `${assessment.weight_kg} kg` : "Peso não informado"}{assessment.waist_cm ? ` · cintura ${assessment.waist_cm} cm` : ""}{assessment.body_fat_percent ? ` · ${assessment.body_fat_percent}%` : ""}</p></div><div className="flex"><button onClick={() => restoreAssessment(assessment)} title="Aplicar ao avatar" aria-label="Aplicar avaliação ao avatar" className="rounded-xl p-2 hover:bg-[#f4f1ec]"><RotateCcw size={16}/></button><button onClick={() => void removeAssessment(assessment.id)} title="Remover avaliação" aria-label="Remover avaliação" className="rounded-xl p-2 text-[#8b5c6c] hover:bg-[#f4f1ec]"><Trash2 size={16}/></button></div></div>{assessment.notes && <p className="mt-2 text-sm leading-5 text-[#5e5a56]">{assessment.notes}</p>}</article>)}{!assessments.length && <p className="py-8 text-sm text-[#5e5a56]">Nenhuma avaliação salva. Registre a primeira quando tiver medidas reais.</p>}</div>
      </section>
    </div>
  </div>;
}

function Field({ name, label, type = "number", defaultValue, min, max, step = 0.1, required = false }: { name: string; label: string; type?: string; defaultValue?: string | number; min?: number; max?: number; step?: number; required?: boolean }) {
  return <label className="text-sm font-bold">{label}<input name={name} type={type} defaultValue={defaultValue} min={min} max={max} step={type === "number" ? step : undefined} required={required} className="mt-2 h-11 w-full rounded-xl border border-[#d9d2ca] bg-white px-3 font-normal outline-none focus:border-[#8b5c6c]"/></label>;
}
