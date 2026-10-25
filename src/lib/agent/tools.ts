import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupplementProduct } from "@/lib/catalog/product-kind";

export const agentToolDeclarations = [
  {
    name: "get_dashboard_summary",
    description: "Resume metas, hábitos, peso, alimentação de hoje e treinos recentes do usuário autenticado.",
    parametersJsonSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_workout_progress",
    description: "Lê sessões e séries de treino recentes para analisar consistência, volume, carga e RPE.",
    parametersJsonSchema: {
      type: "object",
      properties: { days: { type: "integer", minimum: 7, maximum: 180, description: "Janela de análise em dias." } },
      additionalProperties: false,
    },
  },
  {
    name: "get_nutrition_summary",
    description: "Soma calorias e macronutrientes registrados em um período e compara com as metas do perfil.",
    parametersJsonSchema: {
      type: "object",
      properties: { days: { type: "integer", minimum: 1, maximum: 90, description: "Janela de análise em dias." } },
      additionalProperties: false,
    },
  },
  {
    name: "get_body_progress",
    description: "Lê avaliações corporais e medidas registradas, em ordem cronológica, sem fazer diagnóstico clínico.",
    parametersJsonSchema: {
      type: "object",
      properties: { limit: { type: "integer", minimum: 2, maximum: 30 } },
      additionalProperties: false,
    },
  },
  {
    name: "get_food_catalog",
    description: "Busca alimentos reais do catálogo e do usuário por nome, marca ou categoria, incluindo ficha, macros e preço. Consulte antes de criar planos ou receitas; nunca invente alimento, preço ou ID.",
    parametersJsonSchema: { type: "object", additionalProperties: false, properties: {
      query: { type: "string", maxLength: 80, description: "Nome ou marca procurada, por exemplo frango, arroz ou Qualitá." },
      category: { type: "string", maxLength: 80 },
      limit: { type: "integer", minimum: 5, maximum: 100 },
    } },
  },
  {
    name: "create_weekly_meal_plan",
    description: "Cria um planejamento alimentar e sua lista de compras no módulo Alimentação. Use somente após get_food_catalog e somente quando o usuário pedir explicitamente para criar/salvar/montar o plano.",
    parametersJsonSchema: {
      type: "object", required: ["confirmed_by_user", "name", "start_date", "end_date", "meals"], additionalProperties: false,
      properties: {
        confirmed_by_user: { type: "boolean", description: "True somente quando a mensagem atual pede explicitamente para criar ou salvar o plano." },
        name: { type: "string", minLength: 2, maxLength: 120 }, start_date: { type: "string", description: "YYYY-MM-DD" }, end_date: { type: "string", description: "YYYY-MM-DD" },
        budget_brl: { type: "number", minimum: 0, maximum: 100000 },
        meals: { type: "array", minItems: 1, maxItems: 70, items: { type: "object", required: ["meal_date", "meal_type", "name", "ingredients"], additionalProperties: false, properties: {
          meal_date: { type: "string", description: "YYYY-MM-DD" }, meal_type: { type: "string", enum: ["breakfast","lunch","snack","dinner","supper","other"] }, name: { type: "string", minLength: 2, maxLength: 120 }, instructions: { type: "string", maxLength: 2000 },
          ingredients: { type: "array", minItems: 1, items: { type: "object", required: ["food_id","grams"], additionalProperties: false, properties: { food_id: { type: "string" }, grams: { type: "number", minimum: 0.1, maximum: 10000 } } } },
        } } },
      },
    },
  },
  {
    name: "add_shopping_items",
    description: "Adiciona itens reais à lista de compras. Execute somente quando o usuário pedir explicitamente para adicionar ou criar a lista.",
    parametersJsonSchema: { type: "object", required: ["confirmed_by_user", "items"], additionalProperties: false, properties: { confirmed_by_user: { type: "boolean", description: "True somente quando a mensagem atual pede explicitamente a alteração." }, items: { type: "array", minItems: 1, maxItems: 40, items: { type: "object", required: ["name"], additionalProperties: false, properties: { name: { type: "string", minLength: 1, maxLength: 120 }, quantity: { type: "number", minimum: 0 }, unit: { type: "string", maxLength: 30 }, estimated_cost_brl: { type: "number", minimum: 0 } } } } } },
  },
  {
    name: "create_workout_plan",
    description: "Cria um plano completo no módulo Musculação. Execute somente quando o usuário pedir explicitamente para criar/salvar/montar o treino.",
    parametersJsonSchema: { type: "object", required: ["confirmed_by_user", "name","days"], additionalProperties: false, properties: { confirmed_by_user: { type: "boolean", description: "True somente quando a mensagem atual pede explicitamente a alteração." }, name: { type: "string", minLength: 2, maxLength: 80 }, days: { type: "array", minItems: 1, maxItems: 14, items: { type: "object", required: ["name","exercises"], additionalProperties: false, properties: { name: { type: "string", minLength: 1, maxLength: 80 }, exercises: { type: "array", maxItems: 30, items: { type: "object", required: ["name","sets"], additionalProperties: false, properties: { name: { type: "string", minLength: 2, maxLength: 100 }, muscle_group: { type: "string", maxLength: 80 }, sets: { type: "integer", minimum: 1, maximum: 20 }, reps_min: { type: "integer", minimum: 1, maximum: 200 }, reps_max: { type: "integer", minimum: 1, maximum: 200 }, rest_seconds: { type: "integer", minimum: 0, maximum: 1800 } } } } } } } } },
  },
] as const;

function isoDateDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
}

export async function runAgentTool(supabase: SupabaseClient, userId: string, name: string, args: Record<string, unknown> = {}, allowWrites = false) {
  if (name === "get_dashboard_summary") {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    const [profile, habits, food, weight, sessions] = await Promise.all([
      supabase.from("profiles").select("objectives,calorie_goal,protein_goal_g,carb_goal_g,fat_goal_g,water_goal_ml,workout_goal_weekly").eq("user_id", userId).maybeSingle(),
      supabase.from("habit_logs").select("water_ml,sleep_hours,energy").eq("user_id", userId).eq("logged_on", today).maybeSingle(),
      supabase.from("food_entries").select("kcal,protein_g,carbs_g,fat_g").eq("user_id", userId).eq("consumed_on", today),
      supabase.from("weight_logs").select("logged_on,weight_kg").eq("user_id", userId).order("logged_on", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("workout_sessions").select("title,started_at,finished_at").eq("user_id", userId).not("finished_at", "is", null).order("finished_at", { ascending: false }).limit(5),
    ]);
    const error = [profile.error, habits.error, food.error, weight.error, sessions.error].find(Boolean);
    if (error) throw error;
    const nutrition = (food.data ?? []).reduce((total, entry) => ({
      kcal: total.kcal + Number(entry.kcal), protein_g: total.protein_g + Number(entry.protein_g),
      carbs_g: total.carbs_g + Number(entry.carbs_g), fat_g: total.fat_g + Number(entry.fat_g),
    }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
    return { date: today, profile: profile.data, habits: habits.data, nutrition, latest_weight: weight.data, recent_workouts: sessions.data ?? [] };
  }

  if (name === "get_workout_progress") {
    const days = clampInteger(args.days, 30, 7, 180);
    const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString();
    const [sessions, sets] = await Promise.all([
      supabase.from("workout_sessions").select("id,title,started_at,finished_at").eq("user_id", userId).gte("started_at", since).order("started_at"),
      supabase.from("workout_set_logs").select("session_id,exercise_name,set_number,weight_kg,reps,rpe,completed_at").eq("user_id", userId).gte("completed_at", since).order("completed_at"),
    ]);
    if (sessions.error) throw sessions.error;
    if (sets.error) throw sets.error;
    return { period_days: days, sessions: sessions.data ?? [], sets: sets.data ?? [] };
  }

  if (name === "get_nutrition_summary") {
    const days = clampInteger(args.days, 7, 1, 90);
    const since = isoDateDaysAgo(days);
    const [profile, entries] = await Promise.all([
      supabase.from("profiles").select("calorie_goal,protein_goal_g,carb_goal_g,fat_goal_g").eq("user_id", userId).maybeSingle(),
      supabase.from("food_entries").select("consumed_on,meal_type,food_name,grams,kcal,protein_g,carbs_g,fat_g").eq("user_id", userId).gte("consumed_on", since).order("consumed_on").limit(500),
    ]);
    if (profile.error) throw profile.error;
    if (entries.error) throw entries.error;
    return { period_days: days, goals: profile.data, entries: entries.data ?? [] };
  }

  if (name === "get_body_progress") {
    const limit = clampInteger(args.limit, 10, 2, 30);
    const { data, error } = await supabase.from("body_assessments")
      .select("measured_on,height_cm,weight_kg,body_fat_percent,chest_cm,waist_cm,hips_cm,arm_cm,forearm_cm,thigh_cm,calf_cm,muscularity,bone_structure,notes")
      .eq("user_id", userId).order("measured_on", { ascending: false }).limit(limit);
    if (error) throw error;
    return { assessments: (data ?? []).reverse() };
  }

  if (name === "get_food_catalog") {
    const query = typeof args.query === "string" ? args.query.trim().replace(/[,_%]/g, " ") : "";
    const category = typeof args.category === "string" ? args.category.trim() : "";
    const limit = Math.min(100, Math.max(5, Number(args.limit) || 40));
    let readyQuery = supabase.from("food_items").select("id,name,brand,category,subcategory,package_description,ingredients,allergen_statement,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,price_per_100g,source_url,data_quality_status,catalog_source,catalog_metadata").eq("is_active", true).or("user_id.eq." + userId + ",user_id.is.null");
    let referenceQuery = supabase.from("food_items").select("id,name,brand,category,package_description,ingredients,allergen_statement,price_per_100g,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,source_url,data_quality_status").eq("is_active", true).or("user_id.eq." + userId + ",user_id.is.null");
    if (query) {
      const filter = `name.ilike.%${query}%,brand.ilike.%${query}%,subcategory.ilike.%${query}%`;
      readyQuery = readyQuery.or(filter);
      referenceQuery = referenceQuery.or(filter);
    }
    if (category) { readyQuery = readyQuery.eq("category", category); referenceQuery = referenceQuery.eq("category", category); }
    const [ready, unavailable] = await Promise.all([
      readyQuery.not("kcal_per_100g", "is", null).not("protein_per_100g", "is", null).not("carbs_per_100g", "is", null).not("fat_per_100g", "is", null).not("price_per_100g", "is", null).order("name").limit(limit),
      referenceQuery.or("kcal_per_100g.is.null,protein_per_100g.is.null,carbs_per_100g.is.null,fat_per_100g.is.null,price_per_100g.is.null").order("name").limit(limit),
    ]);
    if (ready.error) throw ready.error;
    if (unavailable.error) throw unavailable.error;
    const classify = (items: Array<Record<string, unknown>>) => items.map((item) => ({
      ...item,
      product_kind: isSupplementProduct({ name: String(item.name ?? ""), category: typeof item.category === "string" ? item.category : null, subcategory: typeof item.subcategory === "string" ? item.subcategory : null }) ? "supplement" : "food",
    }));
    return { foods: classify((ready.data ?? []) as Array<Record<string, unknown>>), reference_only: classify((unavailable.data ?? []) as Array<Record<string, unknown>>), pricing_note: "Use foods para cálculos. reference_only serve apenas para ficha, ingredientes e alergênicos; nunca trate campos ausentes como zero nem use esses itens em cálculos. Suplementos são identificados por product_kind, mas isso não equivale a recomendação clínica." };
  }

  if (["create_weekly_meal_plan", "add_shopping_items", "create_workout_plan"].includes(name) && (!allowWrites || args.confirmed_by_user !== true)) {
    return { requires_confirmation: true, message: "Peça uma confirmação explícita antes de alterar os módulos." };
  }

  if (name === "create_weekly_meal_plan") {
    const { data, error } = await supabase.rpc("create_meal_plan_from_agent", { p_plan: args });
    if (error) throw error;
    return { action: "meal_plan_created", ...data };
  }

  if (name === "add_shopping_items") {
    const { data, error } = await supabase.rpc("add_shopping_items_from_agent", { p_items: args.items });
    if (error) throw error;
    return { action: "shopping_items_created", ...data };
  }

  if (name === "create_workout_plan") {
    const { data, error } = await supabase.rpc("create_workout_plan_from_agent", { p_plan: args });
    if (error) throw error;
    return { action: "workout_plan_created", ...data };
  }

  throw new Error("Ferramenta não permitida.");
}
