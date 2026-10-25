import Link from "next/link";
import { ArrowLeft, CalendarDays, ShoppingBasket } from "lucide-react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function MealPlanningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: plans } = await supabase.from("meal_plans").select("id,name,start_date,end_date,budget_brl,estimated_cost_brl,created_by").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(12);
  const selectedIds = (plans ?? []).map((plan) => plan.id);
  const [{ data: meals }, { data: ingredients }] = selectedIds.length ? await Promise.all([
    supabase.from("meal_plan_meals").select("id,plan_id,meal_date,meal_type,name,instructions,estimated_cost_brl,kcal,protein_g").in("plan_id", selectedIds).order("meal_date").order("meal_type"),
    supabase.from("meal_plan_ingredients").select("meal_id,food_name,grams").in("plan_id", selectedIds),
  ]) : [{ data: [] }, { data: [] }];
  const mealLabels: Record<string, string> = { breakfast: "Café da manhã", lunch: "Almoço", snack: "Lanche", dinner: "Jantar", supper: "Ceia", other: "Outro" };

  return <AuthenticatedShell>
    <Link href="/alimentacao" className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={17}/> Alimentação</Link>
    <p className="mt-8 text-xs font-bold tracking-[.16em] text-[#8b5c6c]">PLANEJAMENTO</p>
    <h1 className="mt-3 text-5xl leading-none md:text-6xl">Refeições que cabem na vida real.</h1>
    <p className="mt-4 max-w-3xl text-sm leading-6 text-[#5e5a56]">Planos criados por você ou pelo assistente usam apenas alimentos, macros e preços cadastrados na sua biblioteca.</p>
    <div className="mt-8 space-y-5">{plans?.map((plan) => {
      const planMeals = (meals ?? []).filter((meal) => meal.plan_id === plan.id);
      return <section key={plan.id} className="rounded-[28px] border border-white bg-[#fafaf7] p-5 shadow-[0_14px_40px_rgba(0,0,0,.055)] md:p-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><div className="flex items-center gap-2 text-xs font-bold tracking-[.12em] text-[#8b5c6c]"><CalendarDays size={16}/>{plan.created_by === "assistant" ? "CRIADO PELO ASSISTENTE" : "PLANO"}</div><h2 className="mt-3 text-4xl">{plan.name}</h2><p className="mt-2 text-sm text-[#5e5a56]">{new Date(`${plan.start_date}T12:00:00`).toLocaleDateString("pt-BR")} — {new Date(`${plan.end_date}T12:00:00`).toLocaleDateString("pt-BR")}</p></div><div className="rounded-2xl bg-[#f4f1ec] px-4 py-3 text-right"><p className="text-xs text-[#5e5a56]">Custo estimado</p><strong className="font-serif text-2xl">{Number(plan.estimated_cost_brl).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>{plan.budget_brl != null && <p className="text-xs text-[#5e5a56]">orçamento {Number(plan.budget_brl).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>}</div></div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{planMeals.map((meal) => <article key={meal.id} className="rounded-[20px] border border-[#e9e3db] bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#8b5c6c]">{new Date(`${meal.meal_date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })} · {mealLabels[meal.meal_type]}</p><h3 className="mt-2 font-bold">{meal.name}</h3><p className="mt-1 text-xs text-[#5e5a56]">{Math.round(Number(meal.kcal))} kcal · {Number(meal.protein_g).toFixed(1)} g proteína · {Number(meal.estimated_cost_brl).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><ul className="mt-3 space-y-1 text-xs text-[#5e5a56]">{(ingredients ?? []).filter((item) => item.meal_id === meal.id).map((item, index) => <li key={`${meal.id}-${index}`}>{item.food_name} · {Number(item.grams)} g</li>)}</ul>{meal.instructions && <p className="mt-3 border-t border-[#e9e3db] pt-3 text-xs leading-5">{meal.instructions}</p>}</article>)}</div>
      </section>;
    })}{!plans?.length && <div className="rounded-[28px] border border-dashed border-[#cfc7bd] bg-white/60 p-10 text-center"><ShoppingBasket className="mx-auto text-[#8b5c6c]"/><h2 className="mt-4 text-3xl">Nenhum planejamento ainda</h2><p className="mt-2 text-sm text-[#5e5a56]">Cadastre preços por 100 g nos alimentos e peça ao assistente para montar um plano com seus critérios.</p><Link href="/assistente" className="mt-5 inline-flex rounded-2xl bg-black px-4 py-3 text-sm font-bold text-white">Conversar com o Brio</Link></div>}</div>
  </AuthenticatedShell>;
}
