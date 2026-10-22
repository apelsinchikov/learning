-- Таблицы прогресса и защита RLS. Выполнить один раз в Supabase → SQL Editor.
-- Безопасно запускать повторно не получится: сначала удалите созданное вручную, если нужно.

create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  read boolean not null default false,
  solved boolean not null default false,
  draft_yaml text,
  draft_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_lesson text,
  updated_at timestamptz not null default now()
);

alter table public.lesson_progress enable row level security;
alter table public.user_state enable row level security;

create policy "own progress" on public.lesson_progress
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own state" on public.user_state
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Курс SQL (добавлено вместе с курсом). Уроки курса лежат в lesson_progress
-- с идентификаторами sql-..., а «текущий урок» — в этой таблице: по строке на курс.
-- Если схема выше уже применена, достаточно выполнить только этот блок
-- (он же лежит отдельно в supabase/course_state.sql).

create table if not exists public.course_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  current_lesson text,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

alter table public.course_state enable row level security;

drop policy if exists "own course state" on public.course_state;

create policy "own course state" on public.course_state
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
