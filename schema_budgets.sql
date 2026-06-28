-- ================================================================
-- Monolog — Personal Expense Tracker
-- Budgets Schema Migration
-- Run this in the Supabase SQL Editor
-- ================================================================

create table public.budgets (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete cascade not null,
  category_id uuid        references public.categories(id) on delete cascade not null,
  amount      numeric(12, 2) not null check (amount >= 0),
  created_at  timestamptz default now(),
  unique(user_id, category_id)
);

-- ================================================================
-- Row Level Security
-- ================================================================

alter table public.budgets enable row level security;

create policy "budgets: select own"  on public.budgets for select  using (auth.uid() = user_id);
create policy "budgets: insert own"  on public.budgets for insert  with check (auth.uid() = user_id);
create policy "budgets: update own"  on public.budgets for update  using (auth.uid() = user_id);
create policy "budgets: delete own"  on public.budgets for delete  using (auth.uid() = user_id);
