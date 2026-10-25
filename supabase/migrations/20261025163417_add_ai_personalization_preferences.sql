alter table public.ai_preferences
  add column if not exists assistant_avatar text not null default 'avatar-5',
  add column if not exists user_preferred_name text not null default '',
  add column if not exists personalization_answers jsonb not null default '{"response_style":"balanced","decision_support":"recommend","proactivity":"suggest","correction_style":"gentle","motivation_style":"calm"}'::jsonb;

comment on column public.ai_preferences.personalization_answers is
  'Five user-controlled CLOVIS communication preferences.';
