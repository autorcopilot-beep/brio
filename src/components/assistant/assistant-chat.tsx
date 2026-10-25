/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity */
"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  Check,
  ChevronDown,
  Database,
  Dumbbell,
  Menu,
  MessageSquarePlus,
  Mic,
  Paperclip,
  Search,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  ThumbsDown,
  ThumbsUp,
  Utensils,
  X,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MessageScroller } from "@/components/ui/message-scroller";
import { AssistantPresentationCard } from "./assistant-presentation";
import { AssistantAvatar } from "./assistant-avatar";
import type { AssistantPresentation } from "@/lib/agent/presentation";

type Row = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool_names: string[];
  action_results: { url?: string }[];
  presentation?: AssistantPresentation;
  created_at?: string;
  duration_ms?: number;
};
type Conversation = { id: string; title: string; updated_at?: string };

const commands = [
  {
    command: "/resumo",
    label: "Ler meu momento",
    prompt:
      "Analise meu momento atual conectando alimentação, treino, corpo e hábitos.",
    icon: Sparkles,
  },
  {
    command: "/treino",
    label: "Planejar treino",
    prompt:
      "Analise meus treinos recentes e me ajude a planejar o próximo passo.",
    icon: Dumbbell,
  },
  {
    command: "/refeicao",
    label: "Planejar refeição",
    prompt: "Monte uma refeição usando somente itens válidos do meu catálogo.",
    icon: Utensils,
  },
  {
    command: "/corpo",
    label: "Ver evolução corporal",
    prompt:
      "Mostre minha evolução corporal recente e explique as mudanças registradas.",
    icon: Activity,
  },
];

const contextLabel = {
  general: "GERAL",
  nutrition: "ALIMENTAÇÃO",
  workout: "MUSCULAÇÃO",
  body: "CORPO",
  weekly: "VISÃO SEMANAL",
};

function inferCategory(title: string) {
  if (/trein|muscul|exerc/i.test(title)) return "MUSCULAÇÃO";
  if (/aliment|refei|prote|comida|compras/i.test(title)) return "ALIMENTAÇÃO";
  if (/corpo|peso|medida/i.test(title)) return "CORPO";
  return "REFLEXÃO";
}

function loadingLabel(text: string) {
  if (/trein|muscul|exerc|carga/i.test(text))
    return "Lendo seu histórico de treino";
  if (/aliment|refei|prote|calori|comida|catálogo|compras/i.test(text))
    return "Consultando alimentação e catálogo";
  if (/corpo|peso|medida|gordura/i.test(text))
    return "Comparando suas avaliações corporais";
  return "Relacionando seus registros";
}

function thinkingStages(text: string) {
  if (/trein|muscul|exerc|carga/i.test(text)) return ["Lendo seus treinos", "Comparando volume e progressão", "Montando uma orientação segura"];
  if (/aliment|refei|prote|calori|comida|catálogo|compras/i.test(text)) return ["Entendendo a refeição", "Consultando catálogo e preços", "Conferindo orçamento e nutrientes"];
  if (/corpo|peso|medida|gordura/i.test(text)) return ["Lendo suas avaliações", "Comparando períodos", "Traduzindo a evolução"];
  return [loadingLabel(text), "Selecionando o contexto útil", "Organizando a resposta"];
}

function ThinkingIndicator({ text }: { text: string }) {
  const stages = useMemo(() => thinkingStages(text), [text]);
  const [stage, setStage] = useState(0);
  useEffect(() => { setStage(0); const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, stages.length - 1)), 1700); return () => window.clearInterval(timer); }, [stages]);
  return <div className="mt-8 w-full max-w-5xl"><div className="flex items-center gap-3 rounded-full bg-white/75 px-4 py-3 text-xs text-[#625d58] shadow-sm"><span className="relative flex h-6 w-6 items-center justify-center"><span className="absolute h-6 w-6 animate-ping rounded-full bg-[#c38d9e]/20"/><Sparkles size={14}/></span><span key={stages[stage]} className="animate-pulse">{stages[stage]}</span><span className="ml-auto flex gap-1" aria-hidden>{[0,1,2].map(dot=><i key={dot} className="h-1 w-1 animate-bounce rounded-full bg-[#8b5c6c]" style={{animationDelay:`${dot*120}ms`}}/>)}</span></div></div>;
}

function Prose({ content }: { content: string }) {
  const lines = content
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => line.trim());
  const blocks: Array<{ type: "list" | "text"; lines: string[] }> = [];
  for (const line of lines) {
    const isList = /^\s*[-*]\s+/.test(line);
    const current = blocks.at(-1);
    if (isList && current?.type === "list") current.lines.push(line);
    else blocks.push({ type: isList ? "list" : "text", lines: [line] });
  }
  const clean = (value: string) =>
    value
      .replace(/^\s*[-*]\s+/, "")
      .replace(/\*\*/g, "")
      .replaceAll("`", "");
  return (
    <div className="space-y-4 text-[14px] leading-7 text-[#2d2b29]">
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul key={index} className="grid gap-2 sm:grid-cols-2">
            {block.lines.map((line, itemIndex) => (
              <li
                key={itemIndex}
                className="flex gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(38,31,25,.05)]"
              >
                <Check className="mt-1 shrink-0 text-[#8b5c6c]" size={14} />
                <span>{clean(line)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>{clean(block.lines[0])}</p>
        ),
      )}
    </div>
  );
}

function ConversationRail({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRemove,
  mobileOpen,
  onClose,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRemove: (id: string) => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      className={`${mobileOpen ? "fixed inset-0 z-50 block bg-[#f5f2ed] p-5" : "hidden"} min-h-[640px] bg-[#f1eee8]/90 lg:block lg:rounded-[26px] lg:p-4 lg:shadow-[0_22px_60px_rgba(36,30,24,.07)]`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-[.16em] text-[#756f69]">
          DIÁLOGOS ANTERIORES
        </p>
        <button onClick={onClose} className="p-2 lg:hidden">
          <X size={17} />
        </button>
      </div>
      <button
        onClick={onNew}
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1b1a19] text-xs font-bold text-white"
      >
        <MessageSquarePlus size={15} /> Novo diálogo
      </button>
      <label className="mt-3 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-[#7a756f] shadow-sm">
        <Search size={14} />
        <input
          placeholder="Buscar diálogos"
          className="min-w-0 flex-1 bg-transparent text-xs outline-none"
        />
      </label>
      <div className="mt-5 space-y-2">
        {conversations.map((item) => (
          <article
            key={item.id}
            className={`group relative rounded-md border p-3 transition ${activeId === item.id ? "border-[#d5d0c8] bg-white shadow-sm" : "border-transparent hover:bg-white/70"}`}
          >
            <button
              onClick={() => {
                onSelect(item.id);
                onClose();
              }}
              className="w-full pr-6 text-left"
            >
              <div className="flex items-center justify-between gap-2 text-[9px] font-bold tracking-[.12em] text-[#8b5c6c]">
                <span>{inferCategory(item.title)}</span>
                <span className="text-[#99938c]">
                  {item.updated_at
                    ? new Date(item.updated_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })
                    : ""}
                </span>
              </div>
              <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5">
                {item.title}
              </h3>
            </button>
            <button
              onClick={() => onRemove(item.id)}
              aria-label={`Apagar ${item.title}`}
              className="absolute bottom-2 right-2 rounded p-1.5 text-[#99938c] opacity-0 hover:bg-[#f2e5e6] group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          </article>
        ))}
      </div>
      {!conversations.length && (
        <p className="mt-8 text-center text-xs leading-5 text-[#85807a]">
          Seus diálogos aparecerão aqui conforme você conversa.
        </p>
      )}
      <div className="mt-6 rounded-[20px] bg-[#ded7cf]/55 p-4">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[.12em]">
          <Database size={13} /> MEMÓRIA AUTÔNOMA
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[#716c66]">
          O CLOVIS recupera apenas o contexto útil e mantém cada registro
          vinculado à sua conta.
        </p>
      </div>
    </aside>
  );
}

export function AssistantChat() {
  const [messages, setMessages] = useState<Row[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [revealingId, setRevealingId] = useState("");
  const [error, setError] = useState("");
  const [railOpen, setRailOpen] = useState(false);
  const [assistantIdentity, setAssistantIdentity] = useState({
    name: "CLOVIS",
    avatar: "avatar-5",
  });
  const [feedbacks, setFeedbacks] = useState<
    Record<string, "like" | "dislike">
  >({});
  const started = useRef(0);

  const activeContext = useMemo(
    () =>
      [...messages].reverse().find((item) => item.presentation)?.presentation
        ?.context ?? "general",
    [messages],
  );
  const loadConversations = useCallback(async () => {
    const { data } = await createClient()
      .from("assistant_conversations")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);
    setConversations((data ?? []) as Conversation[]);
  }, []);
  const loadMessages = useCallback(async (id: string) => {
    if (!id) return setMessages([]);
    const { data } = await createClient()
      .from("assistant_messages")
      .select(
        "id,role,content,tool_names,action_results,presentation,created_at",
      )
      .eq("conversation_id", id)
      .order("created_at");
    const rows = (data ?? []) as Row[];
    setMessages(rows);
    const ids = rows
      .filter((row) => row.role === "assistant")
      .map((row) => row.id);
    if (ids.length) {
      const { data: feedback } = await createClient()
        .from("assistant_message_feedback")
        .select("message_id,rating")
        .in("message_id", ids);
      setFeedbacks(
        Object.fromEntries(
          (feedback ?? []).map((item) => [item.message_id, item.rating]),
        ) as Record<string, "like" | "dislike">,
      );
    } else setFeedbacks({});
  }, []);
  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);
  useEffect(() => {
    createClient()
      .from("ai_preferences")
      .select("assistant_name,assistant_avatar")
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setAssistantIdentity({
            name: data.assistant_name || "CLOVIS",
            avatar: data.assistant_avatar || "avatar-5",
          });
      });
  }, []);
  useEffect(() => {
    void loadMessages(conversationId);
  }, [conversationId, loadMessages]);

  function newConversation() {
    setConversationId("");
    setMessages([]);
    setError("");
    setRailOpen(false);
  }
  async function removeConversation(id: string) {
    await createClient().from("assistant_conversations").delete().eq("id", id);
    if (id === conversationId) newConversation();
    await loadConversations();
  }

  async function sendFeedback(messageId: string, rating: "like" | "dislike") {
    const response = await fetch("/api/assistant/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, rating }),
    });
    if (response.ok)
      setFeedbacks((current) => ({ ...current, [messageId]: rating }));
  }

  async function send(value: string) {
    let text = value.trim();
    if (!text || loading) return;
    if (text.startsWith("/")) {
      const command = commands.find(
        (item) => item.command === text.split(/\s+/)[0].toLowerCase(),
      );
      if (!command)
        return setError("Comando não reconhecido. Escolha um atalho da lista.");
      text = command.prompt;
    }
    setDraft("");
    setError("");
    setLoading(true);
    started.current = performance.now();
    setMessages((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        tool_names: [],
        action_results: [],
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId || undefined,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        conversationId?: string;
        messageId?: string;
        message?: string;
        toolNames?: string[];
        actions?: { url?: string }[];
        presentation?: AssistantPresentation;
      };
      if (!response.ok || !payload.message || !payload.conversationId)
        throw new Error(payload.error || "Não foi possível responder.");
      setConversationId(payload.conversationId);
      const responseId = payload.messageId ?? crypto.randomUUID();
      const completedAt = new Date().toISOString();
      setMessages((items) => [
        ...items,
        {
          id: responseId,
          role: "assistant",
          content: "",
          tool_names: payload.toolNames ?? [],
          action_results: payload.actions ?? [],
          created_at: completedAt,
          duration_ms: performance.now() - started.current,
        },
      ]);
      setLoading(false);
      setRevealingId(responseId);
      const words = payload.message.match(/\S+\s*/g) ?? [payload.message];
      let visible = "";
      for (let index = 0; index < words.length; index += 3) {
        visible += words.slice(index, index + 3).join("");
        const current = visible;
        setMessages((items) => items.map((item) => item.id === responseId ? { ...item, content: current } : item));
        await new Promise((resolve) => window.setTimeout(resolve, 24));
      }
      setMessages((items) => items.map((item) => item.id === responseId ? { ...item, content: payload.message!, presentation: payload.presentation } : item));
      setRevealingId("");
      await loadConversations();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível responder.",
      );
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  return (
    <div className="relative min-h-[640px] lg:grid lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-5">
      <ConversationRail
        conversations={conversations}
        activeId={conversationId}
        onSelect={setConversationId}
        onNew={newConversation}
        onRemove={(id) => void removeConversation(id)}
        mobileOpen={railOpen}
        onClose={() => setRailOpen(false)}
      />
      <section className="relative flex min-h-[640px] min-w-0 flex-col overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_82%_10%,rgba(224,205,210,.32),transparent_30%),radial-gradient(circle_at_8%_78%,rgba(226,217,202,.42),transparent_32%),#f9f8f5] shadow-[0_28px_80px_rgba(36,30,24,.08)]">
        <header className="relative z-10 mx-3 mt-3 flex h-12 items-center gap-3 rounded-full bg-white/75 px-3 shadow-sm backdrop-blur-xl md:mx-5 md:mt-5 md:px-4">
          <button
            onClick={() => setRailOpen(true)}
            aria-label="Abrir diálogos"
            className="rounded-full p-2 hover:bg-[#efede8] lg:hidden"
          >
            <Menu size={17} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <AssistantAvatar id={assistantIdentity.avatar} size={30} />
            <p className="truncate text-[10px] font-bold tracking-[.14em]">
              {assistantIdentity.name.toUpperCase()} ·{" "}
              {contextLabel[activeContext]}
            </p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-[#edf1e9] px-2.5 py-1 text-[9px] font-semibold text-[#617064] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7a9b7e]" />{" "}
            Sincronizado
          </span>
          <Link
            href="/profile/ia"
            aria-label="Configurações da IA"
            className="rounded-full p-2 hover:bg-[#efede8]"
          >
            <Settings2 size={16} />
          </Link>
        </header>

        <MessageScroller
          loading={loading}
          className="flex-1 px-4 py-7 md:px-8 lg:px-10"
        >
          {!messages.length && (
            <div className="mr-auto flex min-h-[360px] w-full max-w-4xl flex-col justify-center">
              <p className="text-[10px] font-bold tracking-[.16em] text-[#8b5c6c]">
                COMECE POR UMA LEITURA OU AÇÃO
              </p>
              <h2 className="mt-3 max-w-xl font-serif text-4xl leading-[1.05] tracking-[-.025em] md:text-5xl">
                O que merece sua atenção agora?
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[#6c6761]">
                Pergunte livremente ou use um atalho. O canvas se adapta ao tipo
                de resposta e aos seus dados.
              </p>
              <div className="mt-7 grid auto-rows-[92px] gap-3 sm:grid-cols-2">
                {commands.map((command, index) => {
                  const Icon = command.icon;
                  return (
                    <button
                      key={command.command}
                      onClick={() => void send(command.command)}
                      className={`group flex items-end gap-3 rounded-[22px] p-4 text-left text-xs font-semibold shadow-[0_16px_45px_rgba(36,30,24,.07)] transition hover:-translate-y-0.5 ${index === 0 ? "bg-[#1d1c1b] text-white sm:row-span-2" : index === 1 ? "bg-[#eee7e9]" : index === 2 ? "bg-[#edf0e7]" : "bg-white"}`}
                    >
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-full ${index === 0 ? "bg-white/12" : "bg-white/70"}`}
                      >
                        <Icon size={16} />
                      </span>
                      <span>
                        {command.label}
                        <small
                          className={`mt-1 block text-[9px] font-normal ${index === 0 ? "text-white/45" : "text-[#8a837c]"}`}
                        >
                          {command.command}
                        </small>
                      </span>
                      <span className="ml-auto text-lg font-light opacity-45">
                        ↗
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="w-full max-w-5xl space-y-10">
            {messages.map((item) =>
              item.role === "user" ? (
                <div key={item.id} className="flex justify-end">
                  <div className="max-w-[88%] rounded-[22px] rounded-br-md bg-[#1b1a19] px-4 py-3 text-sm leading-6 text-white shadow-lg md:max-w-[70%]">
                    {item.content}
                    <time className="mt-1 block text-right text-[9px] text-white/55">
                      {item.created_at &&
                        new Date(item.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </time>
                  </div>
                </div>
              ) : (
                <article key={item.id}>
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-[.15em] text-[#795c64]">
                    <AssistantAvatar id={assistantIdentity.avatar} size={30} />
                    {item.presentation?.label ?? "CLOVIS"}
                  </div>
                  <div className="mt-4">
                    <Prose content={item.content} />
                    {revealingId === item.id && <span className="mt-1 inline-block h-5 w-0.5 animate-pulse bg-[#8b5c6c]" aria-label="CLOVIS está escrevendo" />}
                  </div>
                  <AssistantPresentationCard
                    presentation={item.presentation}
                    actionUrl={
                      item.action_results?.find((action) => action.url)?.url
                    }
                    onSuggestion={(value) => void send(value)}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[#8b857f]">
                    {item.created_at && (
                      <span>
                        {new Date(item.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                    {item.duration_ms && (
                      <span>
                        · Pensou por{" "}
                        {(item.duration_ms / 1000).toFixed(1).replace(".", ",")}
                        s
                      </span>
                    )}
                    {item.tool_names?.length > 0 && (
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-1">
                          <Database size={11} /> {item.tool_names.length}{" "}
                          consulta(s){" "}
                          <ChevronDown
                            size={11}
                            className="transition group-open:rotate-180"
                          />
                        </summary>
                        <div className="mt-2 rounded-md border border-[#e1ded8] bg-white p-3">
                          {(item.presentation?.steps ?? item.tool_names).map(
                            (step) => (
                              <p
                                key={step}
                                className="flex items-center gap-2 py-1"
                              >
                                <Check size={11} />
                                {step.replaceAll("_", " ")}
                              </p>
                            ),
                          )}
                        </div>
                      </details>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/55 px-1 py-0.5">
                      <button
                        type="button"
                        aria-label="Gostei da resposta"
                        onClick={() => void sendFeedback(item.id, "like")}
                        className={`rounded-full p-1.5 transition hover:bg-[#e7efe7] ${feedbacks[item.id] === "like" ? "bg-[#dcebdc] text-[#46654b]" : ""}`}
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label="Não gostei da resposta"
                        onClick={() => void sendFeedback(item.id, "dislike")}
                        className={`rounded-full p-1.5 transition hover:bg-[#f2e1e4] ${feedbacks[item.id] === "dislike" ? "bg-[#f0d9de] text-[#815260]" : ""}`}
                      >
                        <ThumbsDown size={12} />
                      </button>
                    </span>
                  </div>
                </article>
              ),
            )}
          </div>

          {loading && <ThinkingIndicator text={messages.at(-1)?.content ?? draft}/>} 
          {error && (
            <p
              role="alert"
              className="mt-6 max-w-4xl rounded-2xl bg-[#f5e9eb] p-3 text-xs"
            >
              {error}
            </p>
          )}
        </MessageScroller>

        <form
          onSubmit={submit}
          className="sticky bottom-0 bg-gradient-to-t from-[#f9f8f5] via-[#f9f8f5]/95 to-transparent p-4 pt-8 backdrop-blur-[2px] md:px-8"
        >
          <div className="max-w-5xl rounded-[24px] bg-white/90 p-2 shadow-[0_20px_60px_rgba(28,24,20,.12)] ring-1 ring-black/[.04] backdrop-blur-xl">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (draft.trim()) void send(draft);
                }
              }}
              rows={3}
              placeholder="Pergunte ao CLOVIS… Use / para atalhos"
              className="min-h-20 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 outline-none"
            />
            {draft.startsWith("/") && (
              <div className="mb-2 grid gap-1 rounded-2xl bg-[#f3f0eb] p-2">
                {commands
                  .filter((item) =>
                    item.command.startsWith(
                      draft.split(/\s+/)[0].toLowerCase(),
                    ),
                  )
                  .map((item) => (
                    <button
                      type="button"
                      key={item.command}
                      onClick={() => setDraft(item.command)}
                      className="flex items-center rounded-xl px-2 py-2 text-left text-xs hover:bg-white"
                    >
                      <span className="font-bold">{item.command}</span>
                      <span className="ml-3 text-[#77716b]">{item.label}</span>
                    </button>
                  ))}
              </div>
            )}
            <div className="flex items-center gap-1 pt-2">
              <button
                type="button"
                aria-label="Adicionar arquivo"
                className="rounded-full p-2 text-[#716c66] hover:bg-[#f1efeb]"
              >
                <Paperclip size={16} />
              </button>
              <button
                type="button"
                aria-label="Usar voz"
                className="rounded-full p-2 text-[#716c66] hover:bg-[#f1efeb]"
              >
                <Mic size={16} />
              </button>
              <span className="ml-1 hidden text-[10px] text-[#99938c] sm:block">
                Enter para enviar · Shift + Enter para quebrar linha
              </span>
              <button
                disabled={!draft.trim() || loading}
                aria-label="Enviar"
                className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-[#1b1a19] text-white disabled:opacity-30"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
