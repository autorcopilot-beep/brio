"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Save, Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PlateFood = {
  id: string;
  name: string;
  category: string | null;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
};

type PlateItem = { foodId: string; grams: number };

export function PlateStudio() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [foods, setFoods] = useState<PlateFood[]>([]);
  const [items, setItems] = useState<PlateItem[]>([]);
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
  const [mealName, setMealName] = useState("Meu prato");
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(true);

  const sendData = useCallback((nextFoods = foods, nextGoal = calorieGoal) => {
    iframeRef.current?.contentWindow?.postMessage({
      type: "brio-plate-data",
      value: {
        calorieGoal: nextGoal,
        foods: nextFoods.map((food) => ({ id: food.id, name: food.name, category: food.category, kcal: food.kcal_per_100g, protein: food.protein_per_100g, carbs: food.carbs_per_100g, fat: food.fat_per_100g })),
      },
    }, location.origin);
  }, [foods, calorieGoal]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: catalog, error }, { data: profile }] = await Promise.all([
        supabase.from("food_items").select("id,name,category,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g").not("kcal_per_100g", "is", null).not("protein_per_100g", "is", null).not("carbs_per_100g", "is", null).not("fat_per_100g", "is", null).order("name").limit(600),
        supabase.from("profiles").select("calorie_goal").eq("user_id", user.id).maybeSingle(),
      ]);
      const nextFoods = (catalog ?? []).map((food) => ({ ...food, kcal_per_100g: Number(food.kcal_per_100g), protein_per_100g: Number(food.protein_per_100g), carbs_per_100g: Number(food.carbs_per_100g), fat_per_100g: Number(food.fat_per_100g) })) as PlateFood[];
      const nextGoal = profile?.calorie_goal == null ? null : Number(profile.calorie_goal);
      setFoods(nextFoods); setCalorieGoal(nextGoal); setLoading(false);
      setMessage(error ? "Não foi possível carregar a biblioteca de alimentos." : undefined);
    }
    void load();
  }, []);

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== location.origin) return;
      if (event.data?.type === "brio-plate-ready") sendData();
      if (event.data?.type === "brio-plate-change") setItems(Array.isArray(event.data.value?.items) ? event.data.value.items : []);
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [sendData]);

  const totals = useMemo(() => items.reduce((sum, item) => {
    const food = foods.find((candidate) => candidate.id === item.foodId);
    if (!food) return sum;
    const ratio = Number(item.grams) / 100;
    return { grams: sum.grams + Number(item.grams), kcal: sum.kcal + food.kcal_per_100g * ratio, protein: sum.protein + food.protein_per_100g * ratio, carbs: sum.carbs + food.carbs_per_100g * ratio, fat: sum.fat + food.fat_per_100g * ratio };
  }, { grams: 0, kcal: 0, protein: 0, carbs: 0, fat: 0 }), [items, foods]);

  async function saveRecipe() {
    if (!items.length || !mealName.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: recipe, error } = await supabase.from("recipes").insert({ user_id: user.id, name: mealName.trim(), servings: 1, instructions: "Montado no Prato 3D do Brio." }).select("id").single();
    if (error || !recipe) { setMessage("Não foi possível salvar a refeição."); return; }
    const { error: ingredientError } = await supabase.from("recipe_items").insert(items.map((item) => ({ user_id: user.id, recipe_id: recipe.id, food_item_id: item.foodId, grams: item.grams })));
    if (ingredientError) { await supabase.from("recipes").delete().eq("id", recipe.id); setMessage("Não foi possível salvar os ingredientes."); return; }
    setMessage("Refeição salva em Receitas.");
  }

  async function logMeal() {
    if (!items.length) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    const { error } = await supabase.from("food_entries").insert({ user_id: user.id, consumed_on: today, meal_type: "other", food_name: mealName.trim() || "Prato 3D", grams: totals.grams, kcal: totals.kcal, protein_g: totals.protein, carbs_g: totals.carbs, fat_g: totals.fat });
    setMessage(error ? "Não foi possível registrar o prato no diário." : "Prato registrado no diário de hoje.");
  }

  function askClovis() {
    const description = items.map((item) => `${foods.find((food) => food.id === item.foodId)?.name ?? "alimento"} (${item.grams} g)`).join(", ");
    window.dispatchEvent(new CustomEvent("brio:assistant:prompt", { detail: { prompt: `Analise este prato usando os dados reais do catálogo: ${description}. Considere minhas metas e sugira ajustes práticos, sem inventar dados.` } }));
  }

  return <div className="space-y-5">
    {message && <p role="status" className="rounded-2xl bg-[#c38d9e]/15 p-4 text-sm">{message}</p>}
    <section className="rounded-[28px] border border-white bg-[#fafaf7] p-3 shadow-[0_14px_40px_rgba(0,0,0,.055)] md:p-5">
      <div className="mb-4 px-1"><div className="flex items-center gap-2"><Utensils size={18}/><h2 className="text-2xl">Montagem visual</h2></div><p className="mt-1 text-sm text-[#5e5a56]">Escolha alimentos reais do catálogo, ajuste as gramas e veja a composição no prato.</p></div>
      {loading ? <div className="h-[720px] animate-pulse rounded-[22px] bg-[#eee9e2]"/> : foods.length ? <iframe ref={iframeRef} onLoad={() => sendData()} title="Prato 3D interativo" src="/plate-studio/index.html" className="h-[960px] w-full rounded-[22px] border-0 md:h-[820px]"/> : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-[#5e5a56]">Nenhum alimento com macronutrientes completos está disponível para montar o prato.</div>}
      <p className="mt-3 px-1 text-xs leading-5 text-[#5e5a56]">A forma 3D é uma aproximação visual. Quantidades e macronutrientes vêm da biblioteca do Brio; ela não substitui orientação nutricional individual.</p>
    </section>
    <section className="rounded-[28px] bg-white p-5 md:p-6"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-xs font-bold tracking-[.12em] text-[#8b5c6c]">PRATO ATUAL</p><h2 className="mt-2 font-serif text-3xl">{Math.round(totals.kcal)} kcal · {Math.round(totals.grams)} g</h2><p className="mt-2 text-sm text-[#5e5a56]">{totals.protein.toFixed(1)} g proteína · {totals.carbs.toFixed(1)} g carboidratos · {totals.fat.toFixed(1)} g gorduras</p></div><label className="text-sm font-bold">Nome da refeição<input value={mealName} onChange={(event) => setMealName(event.target.value)} maxLength={120} className="mt-2 h-11 w-full rounded-xl border px-3 font-normal lg:w-72"/></label></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={!items.length} onClick={() => void saveRecipe()} className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><Save size={16}/> Salvar em Receitas</button><button type="button" disabled={!items.length} onClick={() => void logMeal()} className="rounded-2xl border border-black px-4 py-3 text-sm font-bold disabled:opacity-40">Registrar hoje</button><button type="button" disabled={!items.length} onClick={askClovis} className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold disabled:opacity-40"><Bot size={16}/> Analisar com CLOVIS</button></div></section>
  </div>;
}
