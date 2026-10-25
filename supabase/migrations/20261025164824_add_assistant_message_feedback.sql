create table if not exists public.assistant_message_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.assistant_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating text not null check (rating in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

alter table public.assistant_message_feedback enable row level security;

create policy "Users select own assistant feedback" on public.assistant_message_feedback
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own assistant feedback" on public.assistant_message_feedback
  for insert to authenticated with check ((select auth.uid()) = user_id and exists (
    select 1 from public.assistant_messages m where m.id = message_id and m.user_id = (select auth.uid())
  ));
create policy "Users update own assistant feedback" on public.assistant_message_feedback
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
