import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    messageId?: unknown;
    rating?: unknown;
  } | null;
  const messageId = typeof body?.messageId === "string" ? body.messageId : "";
  const rating =
    body?.rating === "like" || body?.rating === "dislike" ? body.rating : "";
  if (!messageId || !rating)
    return NextResponse.json({ error: "Feedback inválido." }, { status: 400 });
  const { data: message } = await supabase
    .from("assistant_messages")
    .select("id")
    .eq("id", messageId)
    .eq("user_id", user.id)
    .eq("role", "assistant")
    .maybeSingle();
  if (!message)
    return NextResponse.json(
      { error: "Mensagem não encontrada." },
      { status: 404 },
    );
  const { error } = await supabase
    .from("assistant_message_feedback")
    .upsert(
      { message_id: messageId, user_id: user.id, rating },
      { onConflict: "message_id,user_id" },
    );
  if (error)
    return NextResponse.json(
      { error: "Não foi possível registrar o feedback." },
      { status: 500 },
    );
  await supabase
    .from("assistant_audit_events")
    .insert({
      user_id: user.id,
      conversation_id: null,
      event_type: "response_feedback",
      input: { message_id: messageId, rating },
    });
  return NextResponse.json({ messageId, rating });
}
