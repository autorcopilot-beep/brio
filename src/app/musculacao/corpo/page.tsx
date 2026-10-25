import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BodyStudio } from "@/components/body/body-studio";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

export const instant = false;

export default function BodyStudioPage() {
  return <AuthenticatedShell>
    <Link href="/musculacao" className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={17}/> Musculação</Link>
    <p className="mt-8 text-xs font-bold tracking-[.16em] text-[#8b5c6c]">CORPO & MEDIDAS</p>
    <h1 className="mt-3 text-5xl leading-none md:text-6xl">Veja o corpo. Registre o que é real.</h1>
    <p className="mt-4 max-w-3xl text-sm leading-6 text-[#5e5a56]">O avatar serve para exploração anatômica e acompanhamento visual; suas avaliações guardam medidas reais e constroem um histórico comparável.</p>
    <section className="mt-8"><BodyStudio/></section>
  </AuthenticatedShell>;
}
