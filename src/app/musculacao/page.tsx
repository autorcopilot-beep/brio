import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { WorkoutManager } from "@/components/workouts/workout-manager";
import { WorkoutOverview } from "@/components/workouts/workout-overview";

export const instant = false;

export default function MusculacaoPage() {
  return <AuthenticatedShell>
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><p className="text-xs font-bold tracking-[.16em] text-[#8b5c6c]">MUSCULAÇÃO</p><h1 className="mt-3 text-5xl leading-none md:text-6xl">Treino com contexto.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[#5e5a56]">Crie seus próprios planos, registre séries reais e acompanhe a progressão sem rotinas pré-preenchidas.</p></div>
      <Link href="/musculacao/corpo" className="inline-flex h-11 items-center gap-2 self-start rounded-2xl bg-black px-4 text-sm font-bold text-white"><ScanSearch size={18}/> Corpo & medidas</Link>
    </div>
    <section className="mt-8"><WorkoutOverview/><WorkoutManager/></section>
  </AuthenticatedShell>;
}
