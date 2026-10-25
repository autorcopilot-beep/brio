import { createClient } from "@supabase/supabase-js";
import { agentToolDeclarations, runAgentTool } from "@/lib/agent/tools";

type JsonRpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

function rpc(id: JsonRpcRequest["id"], result: unknown, status = 200) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, result }, { status });
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string, status = 400) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { status });
}

export async function GET() {
  return Response.json({ name: "brio", version: "1.0.0", transport: "streamable-http", endpoint: "/api/mcp" });
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return rpcError(null, -32001, "Bearer token obrigatório.", 401);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return rpcError(null, -32001, "Token inválido.", 401);

  const body = await request.json().catch(() => null) as JsonRpcRequest | null;
  if (!body || body.jsonrpc !== "2.0" || !body.method) return rpcError(body?.id, -32600, "Requisição JSON-RPC inválida.");

  if (body.method === "initialize") return rpc(body.id, {
    protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "brio", version: "1.0.0" },
  });
  if (body.method === "ping") return rpc(body.id, {});
  if (body.method === "tools/list") return rpc(body.id, { tools: agentToolDeclarations.map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.parametersJsonSchema })) });
  if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
  if (body.method === "tools/call") {
    const params = body.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    try {
      const result = await runAgentTool(supabase, user.id, params?.name ?? "", params?.arguments ?? {}, params?.arguments?.confirmed_by_user === true);
      return rpc(body.id, { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao executar ferramenta.";
      return rpc(body.id, { isError: true, content: [{ type: "text", text: message }] });
    }
  }
  return rpcError(body.id, -32601, "Método não encontrado.", 404);
}
