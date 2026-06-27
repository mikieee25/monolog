create table public.recurring_transactions (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references auth.users(id) on delete cascade not null,
  account_id      uuid        references public.accounts(id) on delete set null,
  category_id     uuid        references public.categories(id) on delete set null,
  amount          numeric(12, 2) not null check (amount > 0),
  type            text        not null check (type in ('income', 'expense')),
  payment_method  text        not null check (payment_method in ('cash', 'card', 'bank_transfer')),
  description     text,
  recurrence_day  integer     not null check (recurrence_day between 1 and 31),
  last_processed  date,
  created_at      timestamptz default now()
);

alter table public.recurring_transactions enable row level security;

create policy "recurring: select own" on public.recurring_transactions for select  using (auth.uid() = user_id);
create policy "recurring: insert own" on public.recurring_transactions for insert  with check (auth.uid() = user_id);
create policy "recurring: update own" on public.recurring_transactions for update  using (auth.uid() = user_id);
create policy "recurring: delete own" on public.recurring_transactions for delete  using (auth.uid() = user_id);
