"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Apple, Brain, ChevronLeft, ChevronRight, Clock3, Dumbbell, House, LayoutDashboard, LockKeyhole, LogOut, Menu, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { Brand } from "./brand";
import { productModules, type ModuleKey } from "@/lib/modules";
import { createClient } from "@/lib/supabase/client";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FloatingAssistant } from "@/components/assistant/floating-assistant";

type Flag={key:string;enabled:boolean;visibility:"available"|"locked"|"hidden"};
type Profile={fullName:string;email:string;avatarUrl?:string;isAdmin:boolean};
const moduleIcons={dashboard:LayoutDashboard,musculacao:Dumbbell,alimentacao:Apple,assistente:Sparkles,tempo:Clock3,casa:House,mente:Brain,financas:WalletCards};

export function AppShell({children,profile,flags}:{children:React.ReactNode;profile:Profile;flags:Flag[]}) {
  const pathname=usePathname(); const router=useRouter();
  const isAssistantRoute=pathname.startsWith("/assistente");
  const [collapsed,setCollapsed]=useState(false); const [mobileOpen,setMobileOpen]=useState(false); const [navigating,setNavigating]=useState(false);
  useEffect(()=>{const frame=requestAnimationFrame(()=>setNavigating(false));return()=>cancelAnimationFrame(frame)},[pathname]);
  useEffect(()=>{const frame=requestAnimationFrame(()=>setCollapsed(localStorage.getItem("brio:sidebar-collapsed")==="true"));return()=>cancelAnimationFrame(frame)},[]);
  function toggle(){setCollapsed(value=>{localStorage.setItem("brio:sidebar-collapsed",String(!value));return !value})}
  async function logout(){await createClient().auth.signOut();router.replace("/login");router.refresh()}
  const modules=productModules.map(module=>{const flag=flags.find(item=>item.key===module.key);return{...module,available:flag?.enabled??module.available,visibility:flag?.visibility??(module.available?"available":"locked")}}).filter(module=>module.visibility!=="hidden");
  const navigation=modules.map(module=>{const Icon=moduleIcons[module.key as ModuleKey];const active=pathname.startsWith(`/${module.key}`);return <Link key={module.key} title={collapsed?module.label:undefined} href={module.available?`/${module.key}`:"#"} aria-disabled={!module.available} onClick={()=>{if(module.available&&!active)setNavigating(true)}} className={`flex h-12 items-center rounded-2xl transition ${collapsed?"justify-center":"gap-3 px-3"} ${active?"bg-black text-[#fafaf7]":"text-[#5e5a56] hover:bg-[#e9e3db]"} ${!module.available?"cursor-not-allowed opacity-45":""}`}><Icon size={20} strokeWidth={1.5}/>{!collapsed&&<><span className="flex-1 text-sm font-bold">{module.label}</span>{!module.available&&<LockKeyhole size={15}/>}</>}</Link>});
  return <div className="min-h-screen bg-[#f4f1ec] p-3 md:p-4">
    <aside className={`fixed inset-y-4 left-4 z-30 hidden flex-col rounded-[28px] border border-white/70 bg-[#fafaf7]/95 p-3 shadow-[0_18px_60px_rgba(0,0,0,.08)] backdrop-blur-xl transition-[width] duration-300 md:flex ${collapsed?"w-20":"w-64"}`}>
      <div className={`flex h-12 items-center ${collapsed?"justify-center":"justify-between px-2"}`}><Brand compact={collapsed}/>{!collapsed&&<button onClick={toggle} aria-label="Recolher menu" className="grid h-9 w-9 place-items-center rounded-xl text-[#5e5a56] hover:bg-[#e9e3db]"><ChevronLeft size={19}/></button>}</div>
      {collapsed&&<button onClick={toggle} aria-label="Expandir menu" className="mx-auto mt-3 grid h-9 w-9 place-items-center rounded-xl text-[#5e5a56] hover:bg-[#e9e3db]"><ChevronRight size={19}/></button>}
      <nav className="mt-7 space-y-1">{navigation}</nav>
      <div className="mt-auto space-y-2">{profile.isAdmin&&<Link href="/admin" title="Admin" className={`flex h-11 items-center rounded-2xl text-[#5e5a56] hover:bg-[#e9e3db] ${collapsed?"justify-center":"gap-3 px-3"}`}><ShieldCheck size={19}/>{!collapsed&&<span className="text-sm font-bold">Admin</span>}</Link>}<button onClick={logout} title="Sair" className={`flex h-11 w-full items-center rounded-2xl text-[#5e5a56] hover:bg-[#e9e3db] ${collapsed?"justify-center":"gap-3 px-3"}`}><LogOut size={19}/>{!collapsed&&<span className="text-sm font-bold">Sair</span>}</button></div>
    </aside>
    <div className={`transition-[padding] duration-300 ${collapsed?"md:pl-20":"md:pl-64"}`}>
      <header className="sticky top-3 z-20 mx-auto flex h-16 max-w-7xl items-center justify-between rounded-[22px] border border-white/80 bg-[#fafaf7]/90 px-4 shadow-[0_12px_35px_rgba(0,0,0,.07)] backdrop-blur-xl md:top-4 md:px-5"><button onClick={()=>setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl md:hidden" aria-label="Abrir menu"><Menu size={22}/></button><div className="hidden md:block"><p className="text-xs font-bold tracking-[.12em] text-[#8b5c6c]">SEU ESPAÇO</p><p className="text-sm text-[#5e5a56]">{new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"numeric",month:"long"}).format(new Date())}</p></div><Link href="/profile" className="flex items-center gap-3 rounded-full py-1 pl-3 pr-1 hover:bg-[#e9e3db]"><span className="hidden text-right sm:block"><strong className="block text-sm">{profile.fullName}</strong><small className="block max-w-40 truncate text-[#5e5a56]">{profile.email}</small></span>{profile.avatarUrl?<Image src={profile.avatarUrl} alt="Foto de perfil" width={42} height={42} className="h-10 w-10 rounded-full object-cover" unoptimized/>:<span className="grid h-10 w-10 place-items-center rounded-full bg-black text-xs font-bold text-white">{profile.fullName.slice(0,2).toUpperCase()}</span>}</Link></header>
      <main className={`mx-auto px-1 py-7 pb-24 md:py-9 ${isAssistantRoute?"max-w-[1600px] md:px-3":"max-w-7xl md:px-5"}`}><Breadcrumb items={[{label:"Seu espaço"}]}/>{children}</main>
    </div>
    {mobileOpen&&<div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden" onClick={()=>setMobileOpen(false)}><aside className="h-full w-[84%] max-w-xs rounded-r-[28px] bg-[#fafaf7] p-5" onClick={event=>event.stopPropagation()}><div className="flex items-center justify-between"><Brand/><button onClick={()=>setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl"><ChevronLeft/></button></div><nav className="mt-10 space-y-2">{modules.map(module=>{const Icon=moduleIcons[module.key as ModuleKey];return <Link onClick={()=>{setMobileOpen(false);if(module.available&&!pathname.startsWith(`/${module.key}`))setNavigating(true)}} key={module.key} href={module.available?`/${module.key}`:"#"} className="flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-[#5e5a56] hover:bg-[#e9e3db]"><Icon size={20}/>{module.label}{!module.available&&<LockKeyhole className="ml-auto" size={15}/>}</Link>})}</nav></aside></div>}
    {navigating&&<div className="fixed inset-0 z-[60] grid place-items-center bg-[#f4f1ec]/70 backdrop-blur-[2px]" role="status" aria-live="polite"><div className="flex items-center gap-3 rounded-2xl border border-white bg-[#fafaf7] px-5 py-4 text-sm font-bold text-[#171717] shadow-[0_18px_60px_rgba(0,0,0,.12)]"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d9d2ca] border-t-[#8b5c6c]"/> Abrindo seu espaço…</div></div>}
    <FloatingAssistant />
  </div>;
}
