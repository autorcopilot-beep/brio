create table public.assistant_response_patterns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 2 and 80),
  response_type text not null check (response_type in ('general','meal_plan','workout_plan','nutrition_analysis','workout_analysis','body_progress','catalog','confirmation')),
  description text not null default '',
  icon text not null default 'Sparkles',
  animation text not null default 'typewriter' check (animation in ('typewriter','fade-up','stagger','none')),
  table_style text not null default 'soft' check (table_style in ('soft','compact','striped','cards')),
  interaction_mode text not null default 'suggestions' check (interaction_mode in ('suggestions','confirm','actions','none')),
  content_instructions text not null default '',
  trigger_keywords jsonb not null default '[]'::jsonb check (jsonb_typeof(trigger_keywords) = 'array'),
  layout_config jsonb not null default '{"show_metrics":true,"show_source_badge":true,"density":"comfortable"}'::jsonb,
  status text not null default 'active' check (status in ('active','inactive')),
  priority integer not null default 0 check (priority between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assistant_response_patterns enable row level security;
create policy "Authenticated users read active response patterns" on public.assistant_response_patterns for select to authenticated using (status = 'active' or ((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy "Admins manage response patterns" on public.assistant_response_patterns for all to authenticated using (((select auth.jwt())->'app_metadata'->>'role') = 'admin') with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
grant select, insert, update, delete on public.assistant_response_patterns to authenticated;

insert into public.assistant_response_patterns (slug,name,response_type,description,icon,animation,table_style,interaction_mode,content_instructions,trigger_keywords,layout_config,priority)
values
('dieta-visual','Plano alimentar visual','meal_plan','Organiza refeições, custo e macros de forma escaneável.','Utensils','stagger','cards','actions','Comece pelo objetivo e orçamento. Mostre refeições por dia, totais, substituições e lista de compras. Não exponha IDs técnicos.','["dieta","refeição","cardápio","plano alimentar","lista de compras"]','{"show_metrics":true,"show_source_badge":true,"density":"comfortable","accent":"nutrition"}',90),
('treino-estruturado','Treino estruturado','workout_plan','Apresenta divisão, exercícios, séries e progressão.','Dumbbell','stagger','striped','actions','Mostre primeiro a divisão semanal; depois exercícios em estrutura tabular com séries, repetições, descanso e observações. Não exponha IDs técnicos.','["treino","musculação","exercício","hipertrofia","força"]','{"show_metrics":true,"show_source_badge":true,"density":"comfortable","accent":"workout"}',85),
('analise-nutricional','Análise nutricional','nutrition_analysis','Destaca totais, tendências e próximos ajustes.','ChartNoAxesCombined','fade-up','compact','suggestions','Comece pela conclusão, use métricas e gráfico quando houver série temporal. Diferencie dado observado de sugestão.','["calorias","macros","proteína","nutrição","consumo"]','{"show_metrics":true,"show_source_badge":true,"density":"compact","accent":"nutrition"}',70),
('resposta-geral','Resposta geral','general','Padrão de fallback leve e orgânico.','Sparkles','typewriter','soft','suggestions','Responda de forma direta, com uma conclusão inicial e no máximo um próximo passo útil.','[]','{"show_metrics":true,"show_source_badge":true,"density":"comfortable","accent":"general"}',0);
