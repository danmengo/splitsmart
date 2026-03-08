# SplitSmart

A production-grade expense splitting app for managing shared costs across groups.

**Live:** https://splitsmart-vgor.vercel.app

## Features

- Email/password and Google OAuth authentication
- Create groups and invite members by email
- Add expenses with equal or percentage-based splits
- Edit and delete expenses (payer only)
- Mark individual splits as paid/unpaid
- Settle up between two users at once
- Interactive spending dashboard with charts and balance overview
- Notifications with unread badge, mark read / mark all read
- Admin controls: delete group, remove members
- Members can leave groups
- Loading skeletons for improved UX

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma 7 (with Neon adapter)
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Charts:** Recharts
- **Deployment:** Vercel

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Set up environment variables in `.env`:

```
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.
