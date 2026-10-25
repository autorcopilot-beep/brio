import { AssistantChat } from "@/components/assistant/assistant-chat";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

export const instant = false;

export default function AssistantPage() {
  return <AuthenticatedShell>
    <p className="text-[10px] font-bold tracking-[.18em] text-[#795c64]">ASSISTENTE REFLEXIVO · INTELIGÊNCIA PESSOAL</p>
    <h1 className="mt-3 font-serif text-5xl font-normal leading-[.96] tracking-[-.035em] md:text-6xl">Clareza a partir do que é seu.</h1>
    <p className="mt-4 max-w-2xl text-sm leading-6 text-[#66615c]">O CLOVIS cruza seus registros, explica padrões e transforma contexto em próximos passos — sempre com você no controle.</p>
    <section className="mt-7"><AssistantChat/></section>
  </AuthenticatedShell>;
}
