import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedShell>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[.18em] text-[#8b5c6c]">
          CENTRAL DE CONFIGURAÇÕES
        </p>
        <h1 className="mt-3 font-serif text-5xl leading-[.96] tracking-[-.03em] md:text-6xl">
          Seu Brio, do seu jeito.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#67615c]">
          Gerencie sua identidade, conta, segurança e a forma como o CLOVIS
          trabalha ao seu lado.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="self-start rounded-[26px] bg-[#eeeae4] p-3 shadow-[0_20px_60px_rgba(37,30,25,.06)] lg:sticky lg:top-24">
          <SettingsNav />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </AuthenticatedShell>
  );
}
