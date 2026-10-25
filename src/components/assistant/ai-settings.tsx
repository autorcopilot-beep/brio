"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  Check,
  ChevronRight,
  Gauge,
  Link2,
  Save,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AssistantAvatar, assistantAvatarIds } from "./assistant-avatar";

type Answers = {
  response_style: string;
  decision_support: string;
  proactivity: string;
  correction_style: string;
  motivation_style: string;
};
type Pref = {
  assistant_name: string;
  assistant_avatar: string;
  user_preferred_name: string;
  preferred_model: string;
  detail_level: string;
  tone: string;
  use_context: boolean;
  memory_enabled: boolean;
  auto_actions: boolean;
  enabled_plugins: Record<string, boolean>;
  personalization_answers: Answers;
};
const defaultAnswers: Answers = {
  response_style: "balanced",
  decision_support: "recommend",
  proactivity: "suggest",
  correction_style: "gentle",
  motivation_style: "calm",
};
const defaults: Pref = {
  assistant_name: "CLOVIS",
  assistant_avatar: "avatar-5",
  user_preferred_name: "",
  preferred_model: "auto",
  detail_level: "balanced",
  tone: "acolhedor",
  use_context: true,
  memory_enabled: true,
  auto_actions: false,
  enabled_plugins: {
    dashboard: true,
    musculacao: true,
    alimentacao: true,
    corpo: true,
    mcp: false,
  },
  personalization_answers: defaultAnswers,
};

const questions = [
  {
    key: "response_style",
    number: "01",
    title: "Como você prefere receber respostas?",
    description: "Define a estrutura inicial da explicação.",
    options: [
      ["concise", "Direto ao ponto"],
      ["balanced", "Resumo + detalhes"],
      ["analytical", "Análise completa"],
    ],
  },
  {
    key: "decision_support",
    number: "02",
    title: "Quando houver escolhas, o que o CLOVIS deve fazer?",
    description: "Controla quanto o assistente participa da decisão.",
    options: [
      ["ask", "Fazer perguntas"],
      ["recommend", "Recomendar uma opção"],
      ["compare", "Comparar alternativas"],
    ],
  },
  {
    key: "proactivity",
    number: "03",
    title: "Quão proativo ele deve ser?",
    description: "Sugestões nunca ignoram suas permissões.",
    options: [
      ["reactive", "Só responder"],
      ["suggest", "Sugerir próximos passos"],
      ["proactive", "Antecipar necessidades"],
    ],
  },
  {
    key: "correction_style",
    number: "04",
    title: "Como prefere receber correções?",
    description: "Útil quando um plano ou registro pode melhorar.",
    options: [
      ["gentle", "Com delicadeza"],
      ["direct", "De forma direta"],
      ["evidence", "Com dados e justificativa"],
    ],
  },
  {
    key: "motivation_style",
    number: "05",
    title: "Que tipo de incentivo funciona melhor?",
    description: "Ajusta o tom em hábitos, treino e alimentação.",
    options: [
      ["calm", "Calmo e realista"],
      ["celebrate", "Celebrar progresso"],
      ["challenge", "Desafiar com respeito"],
    ],
  },
] as const;

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 rounded-full transition ${on ? "bg-[#1c1b1a]" : "bg-[#d9d4ce]"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${on ? "left-6" : "left-1"}`}
      />
    </button>
  );
}

export function AiSettings() {
  const [form, setForm] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    createClient()
      .from("ai_preferences")
      .select("*")
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setForm({
            ...defaults,
            ...data,
            enabled_plugins: {
              ...defaults.enabled_plugins,
              ...data.enabled_plugins,
            },
            personalization_answers: {
              ...defaultAnswers,
              ...data.personalization_answers,
            },
          });
        setLoading(false);
      });
  }, []);
  function update<K extends keyof Pref>(key: K, value: Pref[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }
  function answer(key: keyof Answers, value: string) {
    update("personalization_answers", {
      ...form.personalization_answers,
      [key]: value,
    });
  }
  async function save() {
    setError("");
    const {
      data: { user },
    } = await createClient().auth.getUser();
    if (!user) return setError("Sessão inválida.");
    const { error: saveError } = await createClient()
      .from("ai_preferences")
      .upsert({
        user_id: user.id,
        ...form,
        updated_at: new Date().toISOString(),
      });
    if (saveError) setError("Não foi possível salvar suas preferências.");
    else setSaved(true);
  }
  if (loading)
    return (
      <div className="min-h-[420px] animate-pulse rounded-[30px] bg-white/60" />
    );
  const inputClass =
    "mt-2 h-12 w-full rounded-2xl bg-[#f1eee9] px-4 text-sm font-normal outline-none ring-[#c9a6af] focus:ring-2";
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_88%_10%,rgba(220,191,200,.6),transparent_34%),#fafaf7] p-5 shadow-[0_24px_70px_rgba(37,30,25,.07)] md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[.16em] text-[#8b5c6c]">
              INTELIGÊNCIA ARTIFICIAL
            </p>
            <h2 className="mt-2 font-serif text-4xl">
              Dê uma identidade ao seu assistente.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6d6761]">
              Essas escolhas mudam de verdade como o CLOVIS se apresenta,
              organiza respostas e conversa com você.
            </p>
          </div>
          <div className="flex min-w-[260px] items-center gap-4 rounded-[24px] bg-white/75 p-4 shadow-sm backdrop-blur">
            <AssistantAvatar id={form.assistant_avatar} size={62} />
            <div>
              <p className="text-[9px] font-bold tracking-[.14em] text-[#8b5c6c]">
                SEU ASSISTENTE
              </p>
              <p className="mt-1 font-serif text-2xl">
                {form.assistant_name || "CLOVIS"}
              </p>
              <p className="text-[10px] text-[#77716b]">
                Olá
                {form.user_preferred_name
                  ? `, ${form.user_preferred_name}`
                  : ""}
                . Vamos organizar isso juntos.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-7">
          <p className="text-xs font-bold">Escolha um avatar</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {assistantAvatarIds.map((id, index) => (
              <button
                key={id}
                type="button"
                onClick={() => update("assistant_avatar", id)}
                aria-label={`Escolher avatar ${index + 1}`}
                className={`rounded-full p-1 transition ${form.assistant_avatar === id ? "bg-black shadow-lg ring-4 ring-[#dcc7cd]" : "hover:-translate-y-1"}`}
              >
                <AssistantAvatar
                  id={id}
                  size={54}
                  className={form.assistant_avatar === id ? "ring-black" : ""}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold">
            Nome do assistente
            <input
              maxLength={30}
              value={form.assistant_name}
              onChange={(event) => update("assistant_name", event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-bold">
            Como ele deve chamar você?
            <input
              maxLength={50}
              value={form.user_preferred_name}
              onChange={(event) =>
                update("user_preferred_name", event.target.value)
              }
              placeholder="Seu nome ou apelido"
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-[30px] bg-[#1d1c1b] p-5 text-white shadow-[0_28px_80px_rgba(22,18,16,.16)] md:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10">
            <Brain size={19} />
          </span>
          <div>
            <p className="text-[10px] font-bold tracking-[.16em] text-[#e0aebc]">
              PERSONALIZAÇÃO EM 5 PERGUNTAS
            </p>
            <h2 className="mt-2 font-serif text-4xl">
              Ensine sua preferência, não seus dados.
            </h2>
            <p className="mt-3 max-w-2xl text-xs leading-5 text-white/55">
              Este perfil orienta o estilo da resposta. Você pode mudar tudo a
              qualquer momento.
            </p>
          </div>
        </div>
        <div className="mt-8 space-y-3">
          {questions.map((question) => (
            <article
              key={question.key}
              className="grid gap-4 rounded-[22px] bg-white/[.06] p-4 lg:grid-cols-[44px_1fr_1.35fr] lg:items-center"
            >
              <span className="font-serif text-2xl text-white/30">
                {question.number}
              </span>
              <div>
                <h3 className="font-sans text-sm font-bold">
                  {question.title}
                </h3>
                <p className="mt-1 text-[10px] text-white/45">
                  {question.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {question.options.map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => answer(question.key, value)}
                    className={`rounded-full px-3 py-2 text-[10px] font-bold transition ${form.personalization_answers[question.key] === value ? "bg-white text-black" : "bg-white/[.07] text-white/65 hover:bg-white/[.13]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-[28px] bg-[#fafaf7] p-5 shadow-[0_20px_60px_rgba(37,30,25,.06)]">
          <div className="flex items-center gap-3">
            <Gauge size={18} />
            <h3 className="font-sans text-sm font-bold">
              Modelo e profundidade
            </h3>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold">
              Modelo
              <select
                value={form.preferred_model}
                onChange={(event) =>
                  update("preferred_model", event.target.value)
                }
                className={inputClass}
              >
                <option value="auto">Automático · Flash/Pro</option>
                <option value="flash">Flash · rápido</option>
                <option value="pro">Pro · complexo</option>
                <option value="llama">Llama local · aberto</option>
              </select>
            </label>
            <label className="text-xs font-bold">
              Nível de detalhe
              <select
                value={form.detail_level}
                onChange={(event) => update("detail_level", event.target.value)}
                className={inputClass}
              >
                <option value="concise">Conciso</option>
                <option value="balanced">Equilibrado</option>
                <option value="deep">Profundo</option>
              </select>
            </label>
            <label className="text-xs font-bold sm:col-span-2">
              Tom principal
              <select
                value={form.tone}
                onChange={(event) => update("tone", event.target.value)}
                className={inputClass}
              >
                <option value="acolhedor">Acolhedor</option>
                <option value="direto">Direto</option>
                <option value="tecnico">Técnico</option>
              </select>
            </label>
          </div>
        </section>
        <section className="rounded-[28px] bg-[#edf0e7] p-5">
          <div className="flex items-center gap-3">
            <SlidersHorizontal size={18} />
            <h3 className="font-sans text-sm font-bold">
              Contexto e autonomia
            </h3>
          </div>
          <div className="mt-5 space-y-4">
            {(
              [
                [
                  "use_context",
                  "Usar contexto dos módulos",
                  "Cruza registros relevantes.",
                ],
                [
                  "memory_enabled",
                  "Memória vetorial",
                  "Recupera conversas úteis.",
                ],
                [
                  "auto_actions",
                  "Ações automáticas",
                  "Executa pedidos explícitos no módulo.",
                ],
              ] as const
            ).map(([key, label, description]) => (
              <div
                key={key}
                className="flex items-center gap-4 rounded-2xl bg-white/65 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">{label}</p>
                  <p className="mt-1 text-[10px] text-[#756f69]">
                    {description}
                  </p>
                </div>
                <Toggle
                  on={form[key]}
                  onChange={(value) => update(key, value)}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[28px] bg-[#fafaf7] p-5 shadow-[0_20px_60px_rgba(37,30,25,.06)]">
        <div className="flex items-center gap-3">
          <Link2 size={18} />
          <div>
            <h3 className="font-sans text-sm font-bold">Conectores do Brio</h3>
            <p className="mt-1 text-[10px] text-[#77716b]">
              Escolha os módulos que podem fornecer contexto ao CLOVIS.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(form.enabled_plugins).map(([key, on]) => (
            <button
              type="button"
              key={key}
              onClick={() =>
                update("enabled_plugins", {
                  ...form.enabled_plugins,
                  [key]: !on,
                })
              }
              className={`flex items-center gap-3 rounded-2xl p-3 text-left ${on ? "bg-[#1d1c1b] text-white" : "bg-[#f1eee9]"}`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-full ${on ? "bg-white/10" : "bg-white"}`}
              >
                {on ? <Check size={14} /> : <Sparkles size={14} />}
              </span>
              <span className="flex-1 text-xs font-bold capitalize">
                {key === "mcp" ? "Apps externos (MCP)" : key}
              </span>
              <ChevronRight size={13} className="opacity-40" />
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-[#f4e5e8] p-4 text-xs text-[#765963]"
        >
          {error}
        </p>
      )}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          onClick={() => void save()}
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-bold text-white shadow-xl"
        >
          <Save size={14} />
          {saved ? "Preferências salvas" : "Salvar personalização"}
        </button>
      </div>
    </div>
  );
}
