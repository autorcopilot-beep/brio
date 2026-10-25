"use client";
import { useEffect, useState } from "react";
import { CalendarCheck, Dumbbell, Flame, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DataList } from "@/components/ui/data-list";

type Session = { id: string; title: string; started_at: string; finished_at: string | null };
export function WorkoutOverview() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [planCount, setPlanCount] = useState(0);
  const [setCount, setSetCount] = useState(0);
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [{ data: sessionData }, { count: plans }, { count: sets }] = await Promise.all([
        supabase.from("workout_sessions").select("id,title,started_at,finished_at").order("started_at", { ascending: false }).limit(4),
        supabase.from("workout_plans").select("id", { count: "exact", head: true }),
        supabase.from("workout_set_logs").select("id", { count: "exact", head: true }),
      ]);
      setSessions((sessionData ?? []) as Session[]);
      setPlanCount(plans ?? 0);
      setSetCount(sets ?? 0);
    };
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, []);
  const completed = sessions.filter((session) => session.finished_at);
  return <section className="mb-7 space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric icon={<Dumbbell size={17}/>} label="Planos criados" value={planCount}/>
      <Metric icon={<CalendarCheck size={17}/>} label="Treinos recentes" value={completed.length}/>
      <Metric icon={<Target size={17}/>} label="Séries registradas" value={setCount}/>
    </div>
    <div className="grid gap-4 lg:grid-cols-[1fr_.42fr]">
      <div className="rounded-[24px] border border-white bg-[#fafaf7] p-5 shadow-[0_14px_40px_rgba(0,0,0,.045)]">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold tracking-[.13em] text-[#8b5c6c]">LINHA DO TEMPO</p><h2 className="mt-1 text-2xl">Seus treinos recentes</h2></div><Flame size={20} className="text-[#c38d9e]"/></div>
        <DataList items={completed.map((session) => ({ label: session.title, meta: new Date(session.started_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }), detail: "Sessão concluída" }))} empty="Ainda não há treinos concluídos."/>
      </div>
      <div className="rounded-[24px] bg-black p-5 text-white"><p className="text-xs font-bold tracking-[.13em] text-[#d9d2ca]">PRÓXIMO PASSO</p><h2 className="mt-2 font-serif text-3xl">Registre o que realmente aconteceu.</h2><p className="mt-3 text-sm leading-6 text-[#d9d2ca]">Comece uma sessão, registre carga e repetições e deixe sua progressão nascer dos seus dados.</p></div>
    </div>
  </section>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="flex items-center gap-3 rounded-[20px] border border-white bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.035)]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f4f1ec] text-[#8b5c6c]">{icon}</span><div><p className="text-xl font-bold">{value}</p><p className="text-xs text-[#6f6963]">{label}</p></div></div>;
}
