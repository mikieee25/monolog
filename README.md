# Monolog

A clean, minimalist personal expense tracker built as a mobile-first PWA. Designed to feel like a native iPhone app — constrained layout, dark mode, zero charts, just clear numbers and fast interactions.

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

---

## Features

- **Dashboard** — Total balance across all accounts + this month's spending at a glance
- **Transaction feed** — Grouped by Today / Yesterday / date, with category emoji, description, and payment method
- **Instant optimistic updates** — Tap "Add", the balance and list update immediately before the server responds
- **SSR hydration** — First paint is data-filled with no spinner, via TanStack Query's `HydrationBoundary`
- **Skeleton loading** — Pixel-matched shimmer layout shown while the server streams
- **Wallets & Banks** — Add multiple accounts (BPI, GCash, Cash, etc.) with emoji icons and starting balances
- **Custom categories** — Add expense/income categories with emojis
- **Row Level Security** — All data is private per user; Supabase RLS enforces this at the database level
- **PWA ready** — Add to iPhone Home Screen for a standalone app experience (no Safari chrome)
- **Philippine Peso formatting** — All amounts in ₱

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database + Auth | Supabase (PostgreSQL + RLS) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Data fetching | TanStack Query v5 |
| Language | TypeScript |

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/mikieee25/monolog.git
cd monolog
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste + run the contents of [`schema.sql`](./schema.sql)
   - Creates `accounts`, `categories`, and `transactions` tables
   - Enables Row Level Security on all three
   - Seeds 12 default categories automatically on sign-up

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase project under **Settings → API**.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`. Sign up, add a wallet, then start logging.

### PWA — Add to iPhone Home Screen

1. Open the app in Safari on your iPhone
2. Tap the **Share** button → **Add to Home Screen**
3. It opens in standalone mode with no browser chrome

## Project Structure

```
monolog/
├── app/
│   ├── actions.ts          # All server actions (auth + CRUD)
│   ├── layout.tsx          # Root layout — dark shell, Inter font, QueryProvider
│   ├── loading.tsx         # SSR skeleton (shown while page.tsx streams)
│   ├── manifest.ts         # PWA Web App Manifest
│   ├── page.tsx            # SSR prefetch + HydrationBoundary
│   └── login/page.tsx      # Email/password auth
├── components/
│   ├── Dashboard.tsx       # Client orchestrator — holds modal state
│   ├── BalanceSummary.tsx  # Total balance + monthly spending
│   ├── TransactionFeed.tsx # Grouped transaction list
│   ├── AddTransactionModal.tsx  # With optimistic updates + rollback
│   ├── ManageWalletsModal.tsx
│   ├── ManageCategoriesModal.tsx
│   ├── QuickActionsBar.tsx # Fixed bottom bar
│   ├── EmojiPicker.tsx     # Preset emoji grid (no external library)
│   ├── skeletons/          # Shimmer placeholders
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── get-query-client.ts # QueryClient factory (new per server req, singleton on client)
│   ├── query-keys.ts       # Centralized TanStack Query key factory
│   ├── supabase/           # Server + client Supabase helpers
│   ├── types.ts            # Shared TypeScript types
│   └── utils.ts            # cn(), formatCurrency(), formatDateLabel()
├── providers/
│   └── query-provider.tsx  # TanStack QueryClientProvider
├── proxy.ts                # Auth guard — session refresh + redirect (Next.js 16)
└── schema.sql              # Full DB schema — run this in Supabase
```

## Data Flow

```
Server Component (page.tsx)
  └─ prefetchQuery × 5 in parallel
       └─ dehydrate() → HydrationBoundary
            └─ Dashboard (Client)
                 ├─ BalanceSummary    ← useSuspenseQuery (data already hydrated)
                 └─ TransactionFeed  ← useSuspenseQuery (data already hydrated)

Add Transaction
  └─ useMutation → optimistic UI update
       ├─ success: server confirms, cache invalidated
       └─ error: rolled back silently
```

## License

MIT
