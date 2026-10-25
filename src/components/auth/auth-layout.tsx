import Image from "next/image";
import Link from "next/link";

export function AuthLayout({ eyebrow, title, description, children }: { eyebrow:string; title:string; description:string; children:React.ReactNode }) {
  return <main className="grid min-h-screen bg-[#fafaf7] lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden bg-black p-12 text-[#fafaf7] lg:flex lg:flex-col">
      <Link href="/"><Image src="/brand/brio-logo-light.svg" alt="Brio" width={120} height={52} priority /></Link>
      <div className="my-auto max-w-xl"><p className="text-xs font-bold tracking-[.18em] text-[#e8a87c]">SEU RITMO, SEU ESPAÇO</p><p className="mt-6 font-serif text-7xl leading-[.92]">Organize a vida<br/><em>sem se apertar.</em></p><p className="mt-8 max-w-md text-base font-light leading-7 text-[#e9e3db]">Clareza para escolher o próximo passo. Cuidado para respeitar o caminho.</p></div>
      <p className="text-xs tracking-wide text-[#e9e3db]">BRIO · FEITO PARA A VIDA REAL</p>
    </section>
    <section className="flex items-center justify-center px-6 py-12 sm:px-10"><div className="w-full max-w-md"><Link href="/" className="mb-14 inline-block lg:hidden"><Image src="/brand/brio-logo-dark.svg" alt="Brio" width={108} height={46}/></Link><p className="text-xs font-bold tracking-[.16em] text-[#8b5c6c]">{eyebrow}</p><h1 className="mt-4 text-5xl leading-none">{title}</h1><p className="mt-4 max-w-sm text-sm leading-6 text-[#5e5a56]">{description}</p>{children}</div></section>
  </main>;
}
