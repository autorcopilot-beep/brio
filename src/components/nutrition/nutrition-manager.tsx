"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Apple, Check, Cuboid, ListPlus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { FoodCatalog, type FoodCatalogFood } from "@/components/nutrition/food-catalog";

type Entry = { id: string; consumed_on: string; meal_type: string; food_name: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number };
type Shopping = { id: string; name: string; quantity: number | null; unit: string | null; purchased: boolean; estimated_cost_brl: number | null };
type Goals = { calorie_goal: number | null; protein_goal_g: number | null; carb_goal_g: number | null; fat_goal_g: number | null; water_goal_ml: number | null };
type Tab = "diary" | "foods" | "shopping" | "goals";

const localToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const mealLabels: Record<string, string> = { breakfast: "Café da manhã", lunch: "Almoço", snack: "Lanche", dinner: "Jantar", supper: "Ceia", other: "Outro" };
const optionalNumber = (value: FormDataEntryValue | null) => value === null || String(value).trim() === "" ? null : Number(value);
const foodSelect = "id,user_id,name,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,price_per_100g,brand,category,subcategory,source_url,image_url,package_description,ingredients,allergen_statement,nutrition_serving_label,nutrition_raw,product_details,data_quality_status,catalog_source,catalog_metadata";

async function fetchFoodCatalog() {
  const supabase = createClient();
  const catalog: FoodCatalogFood[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("food_items").select(foodSelect).eq("is_active", true).order("name").range(from, from + 999);
    if (error) return { data: catalog, error };
    catalog.push(...((data ?? []) as FoodCatalogFood[]));
    if (!data || data.length < 1000) return { data: catalog, error: null };
  }
}

export function NutritionManager() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("diary");
  const [date, setDate] = useState(localToday());
  const [foods, setFoods] = useState<FoodCatalogFood[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [shopping, setShopping] = useState<Shopping[]>([]);
  const [goals, setGoals] = useState<Goals>({ calorie_goal: null, protein_goal_g: null, carb_goal_g: null, fat_goal_g: null, water_goal_ml: null });
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(true);
  const catalogLoaded = useRef(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    const [foodResult, entryResult, shoppingResult, goalResult] = await Promise.all([
      catalogLoaded.current ? Promise.resolve({ data: null, error: null }) : fetchFoodCatalog(),
      supabase.from("food_entries").select("id,consumed_on,meal_type,food_name,grams,kcal,protein_g,carbs_g,fat_g").eq("consumed_on", date).order("created_at"),
      supabase.from("shopping_items").select("id,name,quantity,unit,purchased,estimated_cost_brl").order("purchased").order("created_at"),
      supabase.from("profiles").select("calorie_goal,protein_goal_g,carb_goal_g,fat_goal_g,water_goal_ml").eq("user_id", user.id).single(),
    ]);
    if (foodResult.data) {
      setFoods(foodResult.data as FoodCatalogFood[]);
      catalogLoaded.current = true;
    }
    setEntries((entryResult.data ?? []) as Entry[]);
    setShopping((shoppingResult.data ?? []) as Shopping[]);
    if (goalResult.data) setGoals(goalResult.data as Goals);
    setMessage(foodResult.error ? "Não foi possível carregar o catálogo completo." : undefined);
    setLoading(false);
  }, [date, router]);

  useEffect(() => { const frame = requestAnimationFrame(() => void load()); return () => cancelAnimationFrame(frame); }, [load]);
  const totals = useMemo(() => entries.reduce((sum, item) => ({ kcal: sum.kcal + Number(item.kcal), protein: sum.protein + Number(item.protein_g), carbs: sum.carbs + Number(item.carbs_g), fat: sum.fat + Number(item.fat_g) }), { kcal: 0, protein: 0, carbs: 0, fat: 0 }), [entries]);

  async function withUser(action: (id: string) => PromiseLike<{ error: { message: string } | null }>, success?: string) {
    setMessage(undefined);
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) return;
    const { error } = await action(user.id);
    setMessage(error ? "Não foi possível salvar esta alteração." : success);
    await load();
  }

  async function createFood(data: FormData) {
    await withUser((userId) => createClient().from("food_items").insert({
      user_id: userId, name: String(data.get("name")), kcal_per_100g: optionalNumber(data.get("kcal")), protein_per_100g: optionalNumber(data.get("protein")), carbs_per_100g: optionalNumber(data.get("carbs")), fat_per_100g: optionalNumber(data.get("fat")), price_per_100g: optionalNumber(data.get("price")),
      data_quality_status: ["kcal", "protein", "carbs", "fat", "price"].every((key) => optionalNumber(data.get(key)) !== null) ? "complete" : "partial",
    }), "Alimento salvo.");
  }

  async function addEntry(data: FormData) {
    const food = foods.find((item) => item.id === String(data.get("food")));
    if (!food) return;
    if ([food.kcal_per_100g, food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g].some((value) => value == null)) { setMessage("Este alimento ainda não possui macronutrientes completos e não pode entrar no diário."); return; }
    const grams = Number(data.get("grams"));
    const ratio = grams / 100;
    await withUser((userId) => createClient().from("food_entries").insert({ user_id: userId, food_item_id: food.id, consumed_on: date, meal_type: String(data.get("meal")), food_name: food.name, grams, kcal: Number(food.kcal_per_100g) * ratio, protein_g: Number(food.protein_per_100g) * ratio, carbs_g: Number(food.carbs_per_100g) * ratio, fat_g: Number(food.fat_per_100g) * ratio }), "Registro adicionado ao diário.");
  }

  async function addCatalogFoodToShopping(food: FoodCatalogFood) { await withUser((userId) => createClient().from("shopping_items").insert({ user_id: userId, name: food.name, quantity: 1, unit: food.package_description || "un.", estimated_cost_brl: null }), "Alimento adicionado à lista de compras."); }
  async function removeEntry(id: string) { await withUser(() => createClient().from("food_entries").delete().eq("id", id)); }
  async function addShopping(data: FormData) { await withUser((userId) => createClient().from("shopping_items").insert({ user_id: userId, name: String(data.get("name")), quantity: optionalNumber(data.get("quantity")), unit: String(data.get("unit")) || null })); }
  async function toggleShopping(item: Shopping) { await withUser(() => createClient().from("shopping_items").update({ purchased: !item.purchased }).eq("id", item.id)); }
  async function removeShopping(id: string) { await withUser(() => createClient().from("shopping_items").delete().eq("id", id)); }
  async function saveGoals(data: FormData) { await withUser((userId) => createClient().from("profiles").update({ calorie_goal: optionalNumber(data.get("calories")), protein_goal_g: optionalNumber(data.get("protein")), carb_goal_g: optionalNumber(data.get("carbs")), fat_goal_g: optionalNumber(data.get("fat")), water_goal_ml: optionalNumber(data.get("water")), updated_at: new Date().toISOString() }).eq("user_id", userId), "Metas atualizadas."); }

  if (loading) return <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-[24px] bg-white" />)}</div>;

  return <div>
    <div className="flex flex-wrap gap-2">{[["diary", "Diário"], ["foods", "Catálogo"], ["shopping", "Compras"], ["goals", "Metas"]].map(([value, label]) => <button key={value} onClick={() => setTab(value as Tab)} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === value ? "bg-black text-white" : "bg-[#e9e3db]"}`}>{label}</button>)}<Link href="/alimentacao/prato" className="inline-flex items-center gap-2 rounded-full bg-[#e9e3db] px-4 py-2 text-sm font-bold"><Cuboid size={15}/> Prato 3D</Link></div>
    {message && <p role="status" className="mt-4 rounded-xl bg-[#e9e3db] p-3 text-sm">{message}</p>}

    {tab === "diary" && <DiaryTab date={date} setDate={setDate} totals={totals} goals={goals} foods={foods} entries={entries} selectedFoodId={selectedFoodId} setSelectedFoodId={setSelectedFoodId} addEntry={addEntry} removeEntry={removeEntry} />}
    {tab === "foods" && <div className="mt-6"><FoodCatalog foods={foods} onCreateFood={createFood} onAddToDiary={(foodId) => { setSelectedFoodId(foodId); setTab("diary"); setMessage("Alimento selecionado. Informe a quantidade para registrar."); }} onAddToShopping={(food) => void addCatalogFoodToShopping(food)} /></div>}
    {tab === "shopping" && <ShoppingTab shopping={shopping} addShopping={addShopping} toggleShopping={toggleShopping} removeShopping={removeShopping} />}
    {tab === "goals" && <GoalsTab goals={goals} saveGoals={saveGoals} />}
  </div>;
}

function DiaryTab({ date, setDate, totals, goals, foods, entries, selectedFoodId, setSelectedFoodId, addEntry, removeEntry }: { date: string; setDate: (value: string) => void; totals: { kcal: number; protein: number; carbs: number; fat: number }; goals: Goals; foods: FoodCatalogFood[]; entries: Entry[]; selectedFoodId: string; setSelectedFoodId: (value: string) => void; addEntry: (data: FormData) => Promise<void>; removeEntry: (id: string) => Promise<void> }) {
  return <div className="mt-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Energia", totals.kcal, "kcal", goals.calorie_goal], ["Proteína", totals.protein, "g", goals.protein_goal_g], ["Carboidratos", totals.carbs, "g", goals.carb_goal_g], ["Gorduras", totals.fat, "g", goals.fat_goal_g]].map(([label, value, unit, goal]) => <article key={String(label)} className="rounded-[24px] bg-white p-5"><p className="text-sm font-bold text-[#5e5a56]">{label}</p><p className="mt-5 font-serif text-3xl">{Math.round(Number(value))} {unit}</p><p className="mt-1 text-xs text-[#5e5a56]">{goal ? `meta ${goal} ${unit}` : "sem meta definida"}</p>{goal && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e9e3db]"><div className="h-full rounded-full bg-[#c38d9e]" style={{ width: `${Math.min(100, Number(value) / Number(goal) * 100)}%` }} /></div>}</article>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[.65fr_1.35fr]"><form action={addEntry} className="h-fit rounded-[24px] bg-white p-5"><div className="flex items-center gap-2"><ListPlus size={20} /><h2 className="font-serif text-3xl">Registrar alimento</h2></div><label className="mt-5 block text-sm font-bold">Data<input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="mt-2 h-11 w-full rounded-xl border border-[#d9d2ca] px-3" /></label><label className="mt-4 block text-sm font-bold">Refeição<select name="meal" className="mt-2 h-11 w-full rounded-xl border border-[#d9d2ca] px-3">{Object.entries(mealLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="mt-4 block text-sm font-bold">Alimento<select name="food" value={selectedFoodId} onChange={(event) => setSelectedFoodId(event.target.value)} required className="mt-2 h-11 w-full rounded-xl border border-[#d9d2ca] px-3"><option value="">Selecione</option>{foods.filter((food) => food.kcal_per_100g != null && food.protein_per_100g != null && food.carbs_per_100g != null && food.fat_per_100g != null).map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}</select></label><label className="mt-4 block text-sm font-bold">Quantidade em gramas<input name="grams" type="number" min="0.1" max="10000" step="0.1" required className="mt-2 h-11 w-full rounded-xl border border-[#d9d2ca] px-3" /></label><Button className="mt-5 w-full rounded-xl">Registrar</Button></form><section className="rounded-[24px] bg-white p-5"><h2 className="font-serif text-3xl">Diário de {new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR")}</h2>{entries.length ? <div className="mt-5 space-y-6">{Object.keys(mealLabels).map((group) => { const items = entries.filter((item) => item.meal_type === group); if (!items.length) return null; return <div key={group}><h3 className="text-sm font-bold uppercase tracking-wider text-[#8b5c6c]">{mealLabels[group]}</h3><div className="mt-2 divide-y divide-[#e9e3db]">{items.map((item) => <div key={item.id} className="flex items-center justify-between py-3"><div><p className="font-bold">{item.food_name}</p><p className="text-xs text-[#5e5a56]">{Number(item.grams)} g · {Math.round(Number(item.kcal))} kcal · {Number(item.protein_g).toFixed(1)} g proteína</p></div><button onClick={() => removeEntry(item.id)} className="rounded-xl p-2 hover:bg-[#f4f1ec]" aria-label="Excluir registro"><Trash2 size={17} /></button></div>)}</div></div>; })}</div> : <Empty text="Nenhum alimento registrado nesta data." />}</section></div></div>;
}

function ShoppingTab({ shopping, addShopping, toggleShopping, removeShopping }: { shopping: Shopping[]; addShopping: (data: FormData) => Promise<void>; toggleShopping: (item: Shopping) => Promise<void>; removeShopping: (id: string) => Promise<void> }) { return <div className="mt-6 grid gap-5 lg:grid-cols-[.7fr_1.3fr]"><form action={addShopping} className="h-fit rounded-[24px] bg-white p-5"><div className="flex items-center gap-2"><ShoppingBasket size={20} /><h2 className="font-serif text-3xl">Adicionar à lista</h2></div><input name="name" required placeholder="Item" className="mt-5 h-11 w-full rounded-xl border border-[#d9d2ca] px-3" /><div className="mt-2 grid grid-cols-2 gap-2"><input name="quantity" type="number" min="0.01" step="0.01" placeholder="Quantidade" className="h-11 rounded-xl border border-[#d9d2ca] px-3" /><input name="unit" placeholder="Unidade (kg, un.)" className="h-11 rounded-xl border border-[#d9d2ca] px-3" /></div><Button className="mt-4 w-full rounded-xl"><Plus size={17} /> Adicionar</Button></form><section className="rounded-[24px] bg-white p-5"><h2 className="font-serif text-3xl">Lista de compras</h2>{shopping.length ? <div className="mt-5 divide-y divide-[#e9e3db]">{shopping.map((item) => <div key={item.id} className="flex items-center gap-3 py-4"><button onClick={() => toggleShopping(item)} className={`grid h-7 w-7 place-items-center rounded-full border ${item.purchased ? "border-black bg-black text-white" : "border-[#9b958e]"}`}>{item.purchased && <Check size={15} />}</button><div className="flex-1"><p className={`font-bold ${item.purchased ? "line-through opacity-50" : ""}`}>{item.name}</p>{item.quantity && <p className="text-xs text-[#5e5a56]">{item.quantity} {item.unit}{item.estimated_cost_brl != null ? ` · R$ ${Number(item.estimated_cost_brl).toFixed(2)}` : ""}</p>}</div><button onClick={() => removeShopping(item.id)} className="rounded-xl p-2" aria-label="Excluir item"><Trash2 size={17} /></button></div>)}</div> : <Empty text="Sua lista está vazia." />}</section></div>; }
function GoalsTab({ goals, saveGoals }: { goals: Goals; saveGoals: (data: FormData) => Promise<void> }) { return <form action={saveGoals} className="mt-6 max-w-2xl rounded-[24px] bg-white p-6"><h2 className="font-serif text-3xl">Metas pessoais</h2><p className="mt-2 text-sm text-[#5e5a56]">Metas são opcionais e podem ser alteradas. O Brio não calcula prescrição clínica.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><GoalInput name="calories" label="Energia (kcal)" value={goals.calorie_goal} /><GoalInput name="protein" label="Proteína (g)" value={goals.protein_goal_g} /><GoalInput name="carbs" label="Carboidratos (g)" value={goals.carb_goal_g} /><GoalInput name="fat" label="Gorduras (g)" value={goals.fat_goal_g} /><GoalInput name="water" label="Água (ml)" value={goals.water_goal_ml} /></div><Button className="mt-6 rounded-xl">Salvar metas</Button></form>; }
function GoalInput({ name, label, value }: { name: string; label: string; value: number | null }) { return <label className="text-sm font-bold">{label}<input name={name} type="number" min="0" defaultValue={value ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#d9d2ca] px-3 font-normal" /></label>; }
function Empty({ text }: { text: string }) { return <div className="mt-5 rounded-2xl border border-dashed border-[#cfc7bd] p-6 text-center"><Apple className="mx-auto text-[#8b5c6c]" /><p className="mt-3 text-sm text-[#5e5a56]">{text}</p></div>; }
