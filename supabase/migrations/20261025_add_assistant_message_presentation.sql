alter table public.assistant_messages
  add column if not exists presentation jsonb not null default '{}'::jsonb;

comment on column public.assistant_messages.presentation is
  'Compact structured UI payload generated from real CLOVIS tool results.';
