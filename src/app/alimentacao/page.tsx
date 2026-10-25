import Link from "next/link";
import { CalendarDays, ChefHat } from "lucide-react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { NutritionManager } from "@/components/nutrition/nutrition-manager";

export const instant = false;

export default function AlimentacaoPage() {
  return <AuthenticatedShell>
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-bold tracking-[.16em] text-[#8b5c6c]">ALIMENTAÇÃO</p><h1 className="mt-3 text-5xl leading-none md:text-6xl">Comer com mais contexto.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[#5e5a56]">Explore o catálogo, confira ficha, origem e preço observado, registre refeições e converse com o CLOVIS sem transformar ausência de dados em estimativa.</p></div><div className="flex flex-wrap gap-2"><Link href="/alimentacao/planejamento" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-black px-4 text-sm font-bold"><CalendarDays size={18}/> Planejamento</Link><Link href="/alimentacao/receitas" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-black px-4 text-sm font-bold text-white"><ChefHat size={18}/> Receitas</Link></div></div>
    <section className="mt-8"><NutritionManager/></section>
  </AuthenticatedShell>;
}
