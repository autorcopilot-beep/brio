import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { PlateStudio } from "@/components/nutrition/plate-studio";

export const instant = false;

export default function PlateStudioPage() {
  return <AuthenticatedShell>
    <Link href="/alimentacao" className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={17}/> Alimentação</Link>
    <p className="mt-8 text-xs font-bold tracking-[.16em] text-[#8b5c6c]">PRATO 3D</p>
    <h1 className="mt-3 text-5xl leading-none md:text-6xl">Monte antes de servir.</h1>
    <p className="mt-4 max-w-3xl text-sm leading-6 text-[#5e5a56]">Visualize proporções, ajuste quantidades e transforme a montagem em receita ou registro real no diário.</p>
    <section className="mt-8"><PlateStudio/></section>
  </AuthenticatedShell>;
}
