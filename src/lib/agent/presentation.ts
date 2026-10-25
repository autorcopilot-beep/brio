export type PresentationMetric = {
  label: string;
  value: string;
  detail?: string;
};
export type PresentationItem = {
  title: string;
  meta?: string;
  detail?: string;
};
export type PresentationSection = { title: string; items: PresentationItem[] };
export type PresentationChart = {
  label: string;
  unit?: string;
  points: Array<{ label: string; value: number }>;
};
export type PresentationTable = { columns: string[]; rows: string[][] };
export type AssistantPresentation = {
  context: "general" | "nutrition" | "workout" | "body" | "weekly";
  label: string;
  steps: string[];
  metrics?: PresentationMetric[];
  sections?: PresentationSection[];
  chart?: PresentationChart;
  table?: PresentationTable;
  suggestions?: string[];
};

export type ToolSnapshot = {
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
};

const number = (value: unknown) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;
const brl = (value: unknown) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    number(value),
  );
const decimal = (value: unknown, unit = "") =>
  `${number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${unit}`;
const records = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object",
      )
    : [];

function workoutPlan(snapshot: ToolSnapshot): AssistantPresentation {
  const days = records(snapshot.args.days);
  return {
    context: "workout",
    label: "PLANO DE TREINO",
    steps: [
      "Interpretou seu objetivo",
      "Estruturou a divisão muscular",
      "Salvou o plano na Musculação",
    ],
    metrics: [
      {
        label: "Divisão",
        value: `${days.length} dia${days.length === 1 ? "" : "s"}`,
      },
      {
        label: "Exercícios",
        value: String(
          days.reduce((sum, day) => sum + records(day.exercises).length, 0),
        ),
      },
      { label: "Status", value: "Sincronizado" },
    ],
    sections: days.map((day) => ({
      title: String(day.name ?? "Treino"),
      items: records(day.exercises).map((exercise) => ({
        title: String(exercise.name ?? "Exercício"),
        meta: [
          exercise.sets && `${exercise.sets} séries`,
          exercise.reps_min &&
            exercise.reps_max &&
            `${exercise.reps_min}–${exercise.reps_max} reps`,
          exercise.rest_seconds && `${exercise.rest_seconds}s descanso`,
        ]
          .filter(Boolean)
          .join(" · "),
        detail:
          typeof exercise.muscle_group === "string"
            ? exercise.muscle_group
            : undefined,
      })),
    })),
    suggestions: ["Ajustar divisão semanal", "Ver plano na Musculação"],
  };
}

function mealPlan(snapshot: ToolSnapshot): AssistantPresentation {
  const meals = records(snapshot.args.meals);
  const grouped = new Map<string, PresentationItem[]>();
  for (const meal of meals) {
    const key = String(meal.meal_date ?? "Planejamento");
    const ingredients = records(meal.ingredients);
    const item = {
      title: String(meal.name ?? "Refeição"),
      meta: `${ingredients.length} ingrediente${ingredients.length === 1 ? "" : "s"}`,
      detail:
        typeof meal.instructions === "string" ? meal.instructions : undefined,
    };
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  return {
    context: "nutrition",
    label: "PLANO ALIMENTAR",
    steps: [
      "Consultou o catálogo real",
      "Montou as refeições",
      "Salvou o plano na Alimentação",
    ],
    metrics: [
      {
        label: "Período",
        value: `${new Set(meals.map((meal) => meal.meal_date)).size} dia(s)`,
      },
      { label: "Refeições", value: String(meals.length) },
      ...(snapshot.args.budget_brl === undefined
        ? []
        : [{ label: "Orçamento", value: brl(snapshot.args.budget_brl) }]),
    ],
    sections: [...grouped.entries()]
      .slice(0, 7)
      .map(([title, items]) => ({ title, items })),
    suggestions: ["Abrir plano alimentar", "Revisar lista de compras"],
  };
}

function catalog(snapshot: ToolSnapshot): AssistantPresentation {
  const foods = records(snapshot.result.foods).slice(0, 8);
  return {
    context: "nutrition",
    label: "CATÁLOGO CONSULTADO",
    steps: ["Buscou no catálogo", "Validou preço e informação nutricional"],
    metrics: [
      {
        label: "Itens válidos",
        value: String(records(snapshot.result.foods).length),
      },
      {
        label: "Referências",
        value: String(records(snapshot.result.reference_only).length),
      },
    ],
    table: foods.length
      ? {
          columns: ["Alimento", "Marca", "Proteína", "Preço / 100 g"],
          rows: foods.map((food) => [
            String(food.name ?? "Alimento"),
            String(food.brand ?? "—"),
            food.protein_per_100g == null
              ? "—"
              : decimal(food.protein_per_100g, " g"),
            food.price_per_100g == null ? "—" : brl(food.price_per_100g),
          ]),
        }
      : undefined,
    suggestions: ["Montar uma refeição", "Comparar opções"],
  };
}

function nutrition(snapshot: ToolSnapshot): AssistantPresentation {
  const entries = records(snapshot.result.entries);
  const total = entries.reduce<{
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  }>(
    (sum, item) => ({
      kcal: sum.kcal + number(item.kcal),
      protein: sum.protein + number(item.protein_g),
      carbs: sum.carbs + number(item.carbs_g),
      fat: sum.fat + number(item.fat_g),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const daily = new Map<string, number>();
  for (const entry of entries)
    daily.set(
      String(entry.consumed_on ?? ""),
      (daily.get(String(entry.consumed_on ?? "")) ?? 0) + number(entry.kcal),
    );
  return {
    context: "nutrition",
    label: "RESUMO NUTRICIONAL",
    steps: [
      "Leu seus registros alimentares",
      "Consolidou calorias e macronutrientes",
    ],
    metrics: [
      { label: "Energia", value: decimal(total.kcal, " kcal") },
      { label: "Proteína", value: decimal(total.protein, " g") },
      { label: "Carboidratos", value: decimal(total.carbs, " g") },
      { label: "Gorduras", value: decimal(total.fat, " g") },
    ],
    chart:
      daily.size > 1
        ? {
            label: "Energia por dia",
            unit: "kcal",
            points: [...daily].map(([label, value]) => ({ label, value })),
          }
        : undefined,
    suggestions: ["Ver detalhes na Alimentação", "Ajustar a próxima refeição"],
  };
}

function body(snapshot: ToolSnapshot): AssistantPresentation {
  const assessments = records(snapshot.result.assessments);
  const current = assessments.at(-1);
  const first = assessments.at(0);
  const delta =
    current && first ? number(current.weight_kg) - number(first.weight_kg) : 0;
  return {
    context: "body",
    label: "EVOLUÇÃO CORPORAL",
    steps: ["Consultou suas avaliações", "Comparou os registros no período"],
    metrics: current
      ? [
          {
            label: "Peso atual",
            value: decimal(current.weight_kg, " kg"),
            detail:
              assessments.length > 1
                ? `${delta >= 0 ? "+" : ""}${decimal(delta, " kg")} no período`
                : undefined,
          },
          {
            label: "Gordura corporal",
            value:
              current.body_fat_percent == null
                ? "Sem registro"
                : decimal(current.body_fat_percent, "%"),
          },
          {
            label: "Cintura",
            value:
              current.waist_cm == null
                ? "Sem registro"
                : decimal(current.waist_cm, " cm"),
          },
          { label: "Avaliações", value: String(assessments.length) },
        ]
      : [{ label: "Avaliações", value: "Nenhum registro" }],
    chart:
      assessments.length > 1
        ? {
            label: "Peso registrado",
            unit: "kg",
            points: assessments.map((item) => ({
              label: String(item.measured_on ?? ""),
              value: number(item.weight_kg),
            })),
          }
        : undefined,
    suggestions: ["Registrar nova avaliação", "Abrir evolução corporal"],
  };
}

function workoutProgress(snapshot: ToolSnapshot): AssistantPresentation {
  const sessions = records(snapshot.result.sessions);
  const sets = records(snapshot.result.sets);
  const volume = sets.reduce(
    (sum, set) => sum + number(set.weight_kg) * number(set.reps),
    0,
  );
  const daily = new Map<string, number>();
  for (const set of sets) {
    const date = String(set.completed_at ?? "").slice(0, 10);
    daily.set(
      date,
      (daily.get(date) ?? 0) + number(set.weight_kg) * number(set.reps),
    );
  }
  return {
    context: "workout",
    label: "PROGRESSO DE TREINO",
    steps: ["Leu suas sessões", "Calculou consistência e volume"],
    metrics: [
      { label: "Sessões", value: String(sessions.length) },
      { label: "Séries", value: String(sets.length) },
      { label: "Volume", value: decimal(volume, " kg") },
      { label: "Período", value: `${snapshot.result.period_days ?? 30} dias` },
    ],
    chart:
      daily.size > 1
        ? {
            label: "Volume por treino",
            unit: "kg",
            points: [...daily].map(([label, value]) => ({ label, value })),
          }
        : undefined,
    sections: sessions.length
      ? [
          {
            title: "Sessões recentes",
            items: sessions
              .slice(-5)
              .reverse()
              .map((session) => ({
                title: String(session.title ?? "Treino"),
                meta: session.started_at
                  ? new Date(String(session.started_at)).toLocaleDateString(
                      "pt-BR",
                    )
                  : undefined,
              })),
          },
        ]
      : undefined,
    suggestions: ["Abrir Musculação", "Criar próximo treino"],
  };
}

function dashboard(snapshot: ToolSnapshot): AssistantPresentation {
  const nutritionData = snapshot.result.nutrition as
    | Record<string, unknown>
    | undefined;
  const habits = snapshot.result.habits as Record<string, unknown> | undefined;
  const weight = snapshot.result.latest_weight as
    | Record<string, unknown>
    | undefined;
  return {
    context: "weekly",
    label: "LEITURA DO MOMENTO",
    steps: [
      "Reuniu seus registros atuais",
      "Relacionou alimentação, hábitos e treino",
    ],
    metrics: [
      { label: "Energia", value: decimal(nutritionData?.kcal, " kcal") },
      { label: "Proteína", value: decimal(nutritionData?.protein_g, " g") },
      { label: "Água", value: decimal(habits?.water_ml, " ml") },
      {
        label: "Peso",
        value:
          weight?.weight_kg == null
            ? "Sem registro"
            : decimal(weight.weight_kg, " kg"),
      },
    ],
    suggestions: ["Planejar o restante do dia", "Ver dashboard completo"],
  };
}

export function buildAssistantPresentation(
  snapshots: ToolSnapshot[],
): AssistantPresentation {
  const preferred = [...snapshots]
    .reverse()
    .find((item) =>
      [
        "create_workout_plan",
        "create_weekly_meal_plan",
        "get_body_progress",
        "get_workout_progress",
        "get_nutrition_summary",
        "get_dashboard_summary",
        "get_food_catalog",
      ].includes(item.name),
    );
  if (!preferred)
    return {
      context: "general",
      label: "RESPOSTA DO CLOVIS",
      steps: snapshots.map((item) => `Usou ${item.name.replaceAll("_", " ")}`),
    };
  if (preferred.name === "create_workout_plan") return workoutPlan(preferred);
  if (preferred.name === "create_weekly_meal_plan") return mealPlan(preferred);
  if (preferred.name === "get_food_catalog") return catalog(preferred);
  if (preferred.name === "get_nutrition_summary") return nutrition(preferred);
  if (preferred.name === "get_body_progress") return body(preferred);
  if (preferred.name === "get_workout_progress")
    return workoutProgress(preferred);
  return dashboard(preferred);
}
