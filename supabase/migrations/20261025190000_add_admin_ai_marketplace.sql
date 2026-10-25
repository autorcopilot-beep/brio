create table if not exists public.assistant_runtime_settings (
  id boolean primary key default true check (id),
  assistant_enabled boolean not null default true,
  system_prompt_appendix text not null default '',
  default_model text not null default 'auto' check (default_model in ('auto','flash','pro')),
  temperature numeric not null default 0.35 check (temperature between 0 and 1),
  max_output_tokens integer not null default 5000 check (max_output_tokens between 256 and 8192),
  updated_at timestamptz not null default now()
);

insert into public.assistant_runtime_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.assistant_capabilities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  kind text not null check (kind in ('skill','plugin','extension')),
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '',
  icon text not null default 'Sparkles',
  version text not null default '1.0.0',
  category text not null default 'general',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  prompt text not null default '',
  context text not null default '',
  activation jsonb not null default '{"keywords":[],"intents":[],"modules":[]}'::jsonb,
  knowledge jsonb not null default '{"schema_version":"brio.skill.1","knowledge":[],"procedures":[],"safety":{"limitations":[]}}'::jsonb,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_assistant_capabilities (
  user_id uuid not null references auth.users(id) on delete cascade,
  capability_id uuid not null references public.assistant_capabilities(id) on delete cascade,
  enabled boolean not null default true,
  configuration jsonb not null default '{}'::jsonb,
  installed_at timestamptz not null default now(),
  primary key (user_id, capability_id)
);

alter table public.food_items add column if not exists is_active boolean not null default true;

alter table public.assistant_runtime_settings enable row level security;
alter table public.assistant_capabilities enable row level security;
alter table public.user_assistant_capabilities enable row level security;

create policy "Authenticated users read AI runtime settings" on public.assistant_runtime_settings for select to authenticated using (true);
create policy "Admins manage AI runtime settings" on public.assistant_runtime_settings for all to authenticated using (((select auth.jwt())->'app_metadata'->>'role') = 'admin') with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy "Users read published capabilities" on public.assistant_capabilities for select to authenticated using (status = 'published' or ((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy "Admins manage capabilities" on public.assistant_capabilities for all to authenticated using (((select auth.jwt())->'app_metadata'->>'role') = 'admin') with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy "Users read own capability installs" on public.user_assistant_capabilities for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users install capabilities" on public.user_assistant_capabilities for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own capability installs" on public.user_assistant_capabilities for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users remove own capability installs" on public.user_assistant_capabilities for delete to authenticated using ((select auth.uid()) = user_id);

insert into public.assistant_capabilities (slug, kind, name, description, icon, version, category, status, prompt, context, activation, knowledge, permissions)
values
('treino-inteligente','skill','Treino inteligente','Planeja e analisa treinos usando os registros reais do usuário.','Dumbbell','1.0.0','training','published','Use progressão coerente, volume recuperável e o histórico real. Nunca invente cargas ou limitações.','Ative para planejamento, execução e análise de musculação.', '{"keywords":["treino","musculação","exercício","carga","série","repetição"],"intents":["plan_workout","review_workout"],"modules":["workout"]}', '{"schema_version":"brio.skill.1","title":"Treino inteligente","domain":"training","knowledge":[],"procedures":[],"safety":{"limitations":["Não diagnosticar lesões","Não substituir orientação profissional"]}}', '["read:workouts","write:workouts"]'),
('alimentacao-pratica','skill','Alimentação prática','Cria refeições e listas usando catálogo, orçamento e preferências reais.','Utensils','1.0.0','nutrition','published','Use somente alimentos e preços retornados pelas ferramentas. Destaque lacunas, substituições e custo total.','Ative para refeições, cardápios, compras, macros e orçamento alimentar.', '{"keywords":["alimentação","refeição","comida","proteína","caloria","cardápio","compras"],"intents":["plan_meal","shopping_list"],"modules":["nutrition"]}', '{"schema_version":"brio.skill.1","title":"Alimentação prática","domain":"nutrition","knowledge":[],"procedures":[],"safety":{"limitations":["Não prescrever tratamento nutricional","Respeitar alergênicos cadastrados"]}}', '["read:catalog","write:meal_plans","write:shopping_list"]')
on conflict (slug) do nothing;

grant select on public.assistant_runtime_settings, public.assistant_capabilities to authenticated;
grant select, insert, update, delete on public.user_assistant_capabilities to authenticated;
grant insert, update, delete on public.assistant_runtime_settings, public.assistant_capabilities to authenticated;

-- Only this address may receive the admin claim on account creation. Passwords remain in Supabase Auth.
create or replace function public.assign_brio_admin_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if lower(new.email) = 'pedro.maia@brio.com.br' then
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb;
  else
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) - 'role';
  end if;
  return new;
end;
$$;
revoke all on function public.assign_brio_admin_role() from public, anon, authenticated;
drop trigger if exists assign_brio_admin_role_before_user_write on auth.users;
create trigger assign_brio_admin_role_before_user_write before insert or update of email on auth.users for each row execute function public.assign_brio_admin_role();
