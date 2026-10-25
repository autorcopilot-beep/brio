import { notFound } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { AiSettings } from "@/components/assistant/ai-settings";
import { AccountSettings } from "@/components/settings/account-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";

const future: Record<string, { title: string; description: string }> = {
  notificacoes: {
    title: "Notificações",
    description: "Escolha quando e como o Brio chama sua atenção.",
  },
  aparencia: {
    title: "Aparência",
    description: "Temas, densidade e preferências visuais.",
  },
  integracoes: {
    title: "Integrações",
    description: "Conecte agenda, saúde e outros serviços.",
  },
  dados: {
    title: "Dados e exportação",
    description: "Exporte, mova ou gerencie seus registros.",
  },
};

export default async function ProfileSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  await connection();
  const { section } = await params;
  if (section === "ia") return <AiSettings />;
  if (section === "seguranca") return <SecuritySettings />;
  if (section === "conta") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return (
      <AccountSettings
        initialEmail={user?.email ?? ""}
        createdAt={user?.created_at}
      />
    );
  }
  const locked = future[section];
  if (!locked) notFound();
  return (
    <section className="relative min-h-[430px] overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_80%_15%,rgba(221,199,206,.55),transparent_35%),#fafaf7] p-7 shadow-[0_24px_70px_rgba(37,30,25,.07)] md:p-10">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-sm">
        <LockKeyhole size={19} />
      </span>
      <p className="mt-8 text-[10px] font-bold tracking-[.16em] text-[#8b5c6c]">
        MÓDULO FUTURO
      </p>
      <h2 className="mt-3 font-serif text-5xl">{locked.title}</h2>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#67615c]">
        {locked.description} A rota já está preparada e permanece bloqueada até
        a função entrar no Brio.
      </p>
      <span className="mt-8 inline-flex rounded-full bg-[#eee9e4] px-4 py-2 text-[10px] font-bold">
        EM DESENVOLVIMENTO
      </span>
    </section>
  );
}
