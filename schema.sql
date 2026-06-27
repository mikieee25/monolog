-- ================================================================
-- Monolog — Personal Expense Tracker
-- Run this in the Supabase SQL Editor
-- ================================================================

-- Accounts (Wallets / Banks)
create table public.accounts (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete cascade not null,
  name        text        not null,
  emoji       text        not null default '💳',
  balance     numeric(12, 2) not null default 0,
  created_at  timestamptz default now()
);

-- Categories
create table public.categories (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete cascade not null,
  name        text        not null,
  type        text        not null check (type in ('income', 'expense')),
  emoji       text        not null default '📦',
  created_at  timestamptz default now()
);

-- Transactions
create table public.transactions (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references auth.users(id) on delete cascade not null,
  account_id      uuid        references public.accounts(id) on delete set null,
  category_id     uuid        references public.categories(id) on delete set null,
  amount          numeric(12, 2) not null check (amount > 0),
  type            text        not null check (type in ('income', 'expense')),
  payment_method  text        not null check (payment_method in ('cash', 'card', 'bank_transfer')),
  description     text,
  date            date        not null default current_date,
  created_at      timestamptz default now()
);

-- ================================================================
-- Row Level Security
-- ================================================================

alter table public.accounts     enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;

-- Accounts RLS
create policy "accounts: select own"  on public.accounts for select  using (auth.uid() = user_id);
create policy "accounts: insert own"  on public.accounts for insert  with check (auth.uid() = user_id);
create policy "accounts: update own"  on public.accounts for update  using (auth.uid() = user_id);
create policy "accounts: delete own"  on public.accounts for delete  using (auth.uid() = user_id);

-- Categories RLS
create policy "categories: select own" on public.categories for select  using (auth.uid() = user_id);
create policy "categories: insert own" on public.categories for insert  with check (auth.uid() = user_id);
create policy "categories: update own" on public.categories for update  using (auth.uid() = user_id);
create policy "categories: delete own" on public.categories for delete  using (auth.uid() = user_id);

-- Transactions RLS
create policy "transactions: select own" on public.transactions for select  using (auth.uid() = user_id);
create policy "transactions: insert own" on public.transactions for insert  with check (auth.uid() = user_id);
create policy "transactions: update own" on public.transactions for update  using (auth.uid() = user_id);
create policy "transactions: delete own" on public.transactions for delete  using (auth.uid() = user_id);

-- ================================================================
-- Seed default categories on new user sign-up
-- ================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.categories (user_id, name, type, emoji) values
    (new.id, 'Food & Dining',   'expense', '🍔'),
    (new.id, 'Transportation',  'expense', '🚗'),
    (new.id, 'Rent',            'expense', '🏠'),
    (new.id, 'Utilities',       'expense', '💡'),
    (new.id, 'Shopping',        'expense', '🛍️'),
    (new.id, 'Healthcare',      'expense', '🏥'),
    (new.id, 'Entertainment',   'expense', '🎬'),
    (new.id, 'Education',       'expense', '📚'),
    (new.id, 'Salary',          'income',  '💼'),
    (new.id, 'Freelance',       'income',  '💻'),
    (new.id, 'Business',        'income',  '🏢'),
    (new.id, 'Other Income',    'income',  '💰');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
