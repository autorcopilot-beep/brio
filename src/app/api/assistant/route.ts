import { NextResponse } from "next/server";
import { answerWithBrioAgent } from "@/lib/agent/brio-agent";
import { createClient } from "@/lib/supabase/server";
import { rememberAgentExchange } from "@/lib/agent/memory";

function agentFailureMessage(error: unknown) {
  const status = typeof error === "object" && error !== null && "status" in error ? Number((error as { status?: unknown }).status) : 0;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if ([401, 403].includes(status) || /api key|api_key|permission|unauthenticated|invalid.*key/.test(message)) return { error: "A chave do Gemini no ambiente de produção é inválida ou não tem permissão para este modelo.", code: "GEMINI_AUTH_FAILED" };
  if (status === 404 || /model.*not found|not found.*model|unsupported model/.test(message)) return { error: "O modelo configurado para o CLOVIS não está disponível nesta conta do Gemini.", code: "GEMINI_MODEL_UNAVAILABLE" };
  if (status === 429 || /quota|rate limit|resource exhausted/.test(message)) return { error: "O Gemini atingiu o limite de uso. Aguarde alguns instantes e tente novamente.", code: "GEMINI_QUOTA_EXCEEDED" };
  return { error: "O CLOVIS não conseguiu acessar o Gemini agora. Verifique as variáveis GEMINI_API_KEY e GEMINI_MODEL no Netlify.", code: "GEMINI_REQUEST_FAILED" };
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "O assistente está pronto, mas a GEMINI_API_KEY ainda não foi configurada no servidor.", code: "GEMINI_API_KEY_NOT_CONFIGURED" }, { status: 503 });

  const body = await request.json().catch(() => null) as { message?: unknown; conversationId?: unknown; confirmed?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 4000) return NextResponse.json({ error: "A mensagem deve ter entre 1 e 4.000 caracteres." }, { status: 400 });
  const { data: preferences } = await supabase.from("ai_preferences").select("*").eq("user_id", user.id).maybeSingle();

  let conversationId = typeof body?.conversationId === "string" ? body.conversationId : "";
  if (conversationId) {
    const { data } = await supabase.from("assistant_conversations").select("id").eq("id", conversationId).eq("user_id", user.id).maybeSingle();
    if (!data) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  } else {
    const title = message.slice(0, 72);
    const { data, error } = await supabase.from("assistant_conversations").insert({ user_id: user.id, title }).select("id").single();
    if (error) return NextResponse.json({ error: "Não foi possível iniciar a conversa." }, { status: 500 });
    conversationId = data.id;
  }

  const { data: history, error: historyError } = await supabase.from("assistant_messages")
    .select("role,content").eq("conversation_id", conversationId).eq("user_id", user.id)
    .order("created_at", { ascending: true }).limit(20);
  if (historyError) return NextResponse.json({ error: "Não foi possível carregar a conversa." }, { status: 500 });
  const isConfirmation = /^(sim|ok|okay|confirmo|confirmar|pode|pode fazer|pode criar|manda|prossiga|prosseguir|pode seguir)\b/i.test(message);
  const previousUserMessage = [...(history ?? [])].reverse().find((item) => item.role === "user")?.content;
  const agentMessage = isConfirmation && previousUserMessage ? previousUserMessage : message;
  const allowWrites = /\b(crie|criar|faça|fazer|adicione|adicionar|registre|registrar|salve|salvar|monte|montar|planeje|planejar|organize|organizar|atualize|atualizar|configure|configurar|prepare|preparar|remova|remover|exclua|excluir)\b/i.test(agentMessage);
  await supabase.from("assistant_audit_events").insert({ user_id: user.id, conversation_id: conversationId, event_type: "request", input: { message, agent_message: agentMessage, confirmed: body?.confirmed === true, allow_writes: allowWrites }, duration_ms: Date.now() - startedAt });

  const { error: userMessageError } = await supabase.from("assistant_messages").insert({
    conversation_id: conversationId, user_id: user.id, role: "user", content: message,
  });
  if (userMessageError) return NextResponse.json({ error: "Não foi possível salvar sua mensagem." }, { status: 500 });

  try {
    const answer = await answerWithBrioAgent({
      supabase, userId: user.id, conversationId,
      history: (history ?? []) as { role: "user" | "assistant"; content: string }[],
      message: agentMessage, allowWrites, preferences: preferences ?? undefined,
    });
    const { data: savedMessage, error: assistantMessageError } = await supabase.from("assistant_messages").insert({
      conversation_id: conversationId, user_id: user.id, role: "assistant", content: answer.text, tool_names: answer.toolNames, action_results: answer.actions, presentation: answer.presentation,
    }).select("id").single();
    if (assistantMessageError) throw assistantMessageError;
    await supabase.from("assistant_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    if (preferences?.memory_enabled !== false) await rememberAgentExchange({ supabase, userId: user.id, conversationId, userMessage: message, assistantMessage: answer.text, actions: answer.actions }).catch((memoryError) => console.error("Brio memory indexing failed", memoryError));
    await supabase.from("assistant_audit_events").insert({ user_id: user.id, conversation_id: conversationId, event_type: "response", input: { tool_names: answer.toolNames, actions: answer.actions }, output: { text: answer.text, tool_errors: answer.toolErrors ?? [] }, duration_ms: Date.now() - startedAt });
    return NextResponse.json({ conversationId, messageId: savedMessage.id, message: answer.text, toolNames: answer.toolNames, actions: answer.actions, presentation: answer.presentation, toolErrors: answer.toolErrors ?? [] });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "GEMINI_API_KEY_NOT_CONFIGURED") {
      return NextResponse.json({ error: "O assistente está pronto, mas a GEMINI_API_KEY ainda não foi configurada no servidor.", code }, { status: 503 });
    }
    console.error("Brio agent failed", error);
    await supabase.from("assistant_audit_events").insert({ user_id: user.id, conversation_id: conversationId, event_type: "error", input: { message, agent_message: agentMessage }, output: { code }, duration_ms: Date.now() - startedAt });
    return NextResponse.json(agentFailureMessage(error), { status: 502 });
  }
}
