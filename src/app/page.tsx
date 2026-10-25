import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Feather, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const principles = [
  ["Clareza", "Um espaço sereno para enxergar o que vem agora."],
  ["Ritmo", "Rotinas que se adaptam à vida, e não o contrário."],
  ["Cuidado", "Organização como uma forma de estar presente."],
];

export default function Home() {
  return <main className="min-h-screen bg-[#fafaf7] text-black">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-12">
      <Link href="/" aria-label="Brio, início"><Image src="/brand/brio-logo-dark.svg" alt="Brio" width={120} height={51} priority /></Link>
      <div className="flex items-center gap-5"><Link href="/login" className="text-sm font-bold tracking-wide hover:text-[#5e5a56]">Entrar</Link><Link href="/login"><Button className="hidden md:inline-flex">Começar agora</Button></Link></div>
    </header>
    <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-16 md:grid-cols-12 md:px-12 md:pb-36 md:pt-24">
      <div className="md:col-span-8"><p className="mb-8 flex items-center gap-2 text-xs font-bold tracking-[.16em]"><Feather size={16} strokeWidth={1.5}/> ORGANIZAR PARA VIVER MELHOR</p><h1 className="max-w-4xl text-6xl leading-[.9] tracking-[-.055em] md:text-[7.5rem]">Mais espaço para<br/><em className="font-normal">o que importa.</em></h1><p className="mt-10 max-w-xl text-lg font-light leading-8 text-[#5e5a56] md:text-xl">Brio é um lugar para organizar os seus ritmos, rotinas e cuidados — com clareza, propósito e respeito pelo seu tempo.</p><div className="mt-10 flex flex-wrap gap-3"><Link href="/login"><Button className="gap-3 px-6">Criar meu espaço <ArrowUpRight size={17} strokeWidth={1.5}/></Button></Link><a href="#brio" className="inline-flex min-h-11 items-center px-2 text-sm font-bold tracking-wide underline underline-offset-4">Conhecer o Brio</a></div></div>
      <aside className="relative hidden min-h-80 border border-[#e9e3db] bg-[#e9e3db] p-7 md:col-span-4 md:block"><div className="absolute bottom-7 left-7 right-7 border-t border-black pt-4"><p className="font-serif text-3xl">um passo de cada vez.</p><p className="mt-2 text-xs font-bold tracking-[.14em]">SEU RITMO É SUFICIENTE</p></div><Sparkles className="absolute right-8 top-8" size={35} strokeWidth={1}/></aside>
    </section>
    <section id="brio" className="border-y border-black bg-black px-6 py-20 text-[#fafaf7] md:px-12"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold tracking-[.16em] text-[#e8a87c]">O QUE GUIA O BRIO</p><div className="mt-8 grid gap-8 md:grid-cols-3">{principles.map(([title,description], index)=><article key={title} className="border-t border-[#5e5a56] pt-5"><span className="text-sm text-[#e8a87c]">0{index + 1}</span><h2 className="mt-10 text-5xl">{title}</h2><p className="mt-4 max-w-xs text-sm leading-6 text-[#e9e3db]">{description}</p></article>)}</div></div></section>
    <section className="mx-auto grid max-w-7xl gap-10 px-6 py-24 md:grid-cols-2 md:px-12 md:py-32"><div><p className="text-xs font-bold tracking-[.16em]">COMEÇAR PELO AGORA</p><h2 className="mt-5 text-5xl leading-none md:text-6xl">A vida não precisa caber numa lista.</h2></div><div className="self-end"><p className="text-lg font-light leading-8 text-[#5e5a56]">Comece com uma rotina, uma escolha ou um cuidado. Dashboard, Musculação e Alimentação trabalham juntos para transformar seus próprios registros em clareza.</p><ul className="mt-8 space-y-3 border-t border-[#e9e3db] pt-6 text-sm">{["Sem fórmulas de produtividade", "Feito para a vida real", "Seu espaço, seu compasso"].map(item=><li className="flex gap-3" key={item}><Check size={18} strokeWidth={1.5}/>{item}</li>)}</ul></div></section>
    <footer className="border-t border-[#e9e3db] px-6 py-8 md:px-12"><div className="mx-auto flex max-w-7xl items-center justify-between"><Image src="/brand/brio-logo-dark.svg" alt="Brio" width={84} height={36}/><span className="text-xs text-[#5e5a56]">Feito para a vida real.</span></div></footer>
  </main>;
}
