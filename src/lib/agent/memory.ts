import { GoogleGenAI } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";

const EMBEDDING_MODEL = "gemini-embedding-001";
const embeddingCache = new Map<string, { values: number[]; expiresAt: number }>();

async function embed(text: string, taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const cacheKey = taskType + ":" + text.trim().toLowerCase().slice(0, 1000);
  const cached = embeddingCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.values;
  const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 6_000, retryOptions: { attempts: 1, initialDelay: 0.2, maxDelay: 0.5, expBase: 2, jitter: 0.2 } } });
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text.slice(0, 12000),
    config: { taskType, outputDimensionality: 768 },
  });
  const values = response.embeddings?.[0]?.values ?? null;
  if (values) {
    embeddingCache.set(cacheKey, { values, expiresAt: Date.now() + 5 * 60_000 });
    if (embeddingCache.size > 100) embeddingCache.delete(embeddingCache.keys().next().value!);
  }
  return values;
}

export async function findRelevantMemories(supabase: SupabaseClient, query: string) {
  const embedding = await Promise.race([
    embed(query, "RETRIEVAL_QUERY"),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 4_500)),
  ]);
  if (!embedding) return [];
  const { data, error } = await supabase.rpc("match_brio_memories", {
    query_embedding: embedding, match_threshold: 0.62, match_count: 6,
  });
  if (error) throw error;
  return (data ?? []) as Array<{ content: string; metadata: Record<string, unknown>; similarity: number }>;
}

export async function rememberAgentExchange({
  supabase, userId, conversationId, userMessage, assistantMessage, actions,
}: {
  supabase: SupabaseClient; userId: string; conversationId: string; userMessage: string; assistantMessage: string; actions: unknown[];
}) {
  const content = `Pedido do usuário: ${userMessage}\nResposta do Brio: ${assistantMessage}`.slice(0, 12000);
  const embedding = await embed(content, "RETRIEVAL_DOCUMENT");
  if (!embedding) return;
  const { error } = await supabase.from("assistant_memories").insert({
    user_id: userId, source_type: actions.length ? "action" : "conversation", source_id: conversationId,
    content, metadata: { actions }, embedding,
  });
  if (error) throw error;
}
