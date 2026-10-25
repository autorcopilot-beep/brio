import { Bot, CheckCircle2, CircleAlert, Network } from "lucide-react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { FeatureFlagPanel } from "@/components/forms/feature-flag-panel";

export const instant = false;

export default function AdminPage() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  return <AuthenticatedShell requireAdmin>
    <p className="text-xs font-bold tracking-[.16em] text-[#8b5c6c]">ADMINISTRAÇÃO</p>
    <h1 className="mt-3 text-5xl leading-none">Controle da plataforma</h1>
    <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5e5a56]">Acesso restrito por papel imutável no Supabase. Usuários comuns nunca recebem privilégios administrativos no cadastro.</p>
    <div className="mt-8 grid max-w-5xl gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-[24px] border border-white bg-[#fafaf7] p-6 shadow-[0_14px_40px_rgba(0,0,0,.055)]"><h2 className="text-3xl">Módulos do produto</h2><p className="mt-2 text-sm text-[#5e5a56]">Libere, bloqueie ou oculte módulos para todos os usuários.</p><FeatureFlagPanel/></section>
      <aside className="space-y-4">
        <section className="rounded-[24px] border border-white bg-[#fafaf7] p-6 shadow-[0_14px_40px_rgba(0,0,0,.055)]"><div className="flex items-center gap-3"><Bot size={20}/><h2 className="text-2xl">Gemini</h2></div><div className={`mt-5 flex items-center gap-2 rounded-2xl p-4 text-sm ${geminiConfigured ? "bg-[#dfe8df]" : "bg-[#e8a87c]/20"}`}>{geminiConfigured ? <CheckCircle2 size={18}/> : <CircleAlert size={18}/>}<strong>{geminiConfigured ? "Chave configurada" : "Chave pendente"}</strong></div><p className="mt-3 text-xs leading-5 text-[#5e5a56]">A chave fica somente no servidor em <code>GEMINI_API_KEY</code>. Ela nunca é enviada ao navegador nem salva no banco.</p></section>
        <section className="rounded-[24px] border border-white bg-[#fafaf7] p-6 shadow-[0_14px_40px_rgba(0,0,0,.055)]"><div className="flex items-center gap-3"><Network size={20}/><h2 className="text-2xl">MCP do Brio</h2></div><p className="mt-4 text-sm leading-6 text-[#5e5a56]">Endpoint Streamable HTTP em <code className="rounded bg-[#f4f1ec] px-1.5 py-1">/api/mcp</code>, protegido por token Bearer do Supabase. Expõe apenas ferramentas de leitura dos dados do próprio usuário.</p></section>
      </aside>
    </div>
  </AuthenticatedShell>;
}
