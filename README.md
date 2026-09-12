# SplitSmart

Expense splitting for groups, built with Next.js 16, React 19, Prisma 7 and Supabase.

- GitHub: https://github.com/danmengo/splitsmart
- Live app: https://splitsmart-vgor.vercel.app

## Features

- Google OAuth and email/password authentication with email confirmation
- Groups, admin-controlled invitations, member management and notifications
- Equal, percentage and dollar-amount splits, validated on the server
- Whole-cent allocation that keeps split totals equal to the expense total
- Expense editing, paid/unpaid shares, settlement and spending dashboards
- Title-only edits preserve split records and payment status
- Financial edits are rejected while an expense has settled shares

## Local development

Use the repository root as the application directory. A separately cloned `splitsmart/`
folder is ignored by Git, TypeScript and ESLint; it is not part of this app.

1. Install Node.js 22 and run `npm ci`.
2. Copy `.env.example` to `.env` and supply your Supabase project configuration.
3. Run `npm run dev`. If Turbopack has local filesystem/package-resolution problems,
   use `npm run dev:webpack`.
4. Open http://localhost:3000.

`DATABASE_URL` is the server runtime PostgreSQL connection. `DIRECT_URL` is preferred
for Prisma migrations, with `DATABASE_URL` as a fallback. The public Supabase URL
and anon key configure authentication; no service-role key is needed by the app.
Never commit database passwords or service-role keys.

## Supabase setup

For a new backend:

1. Run `npx prisma migrate deploy` against the intended database.
2. Review and execute `supabase/bootstrap.sql` in the Supabase SQL editor. This is a
   snapshot of the existing project's RLS policies and auth-user sync trigger.
   It is not an automatically applied migration or a replacement policy design.
3. Enable Google in Supabase Authentication and configure the Google OAuth client.
4. Set the Supabase Site URL and allowed redirects to include the application origin
   and its `/auth/callback` URL, for both local development and production.
5. Keep email confirmation enabled; signup displays a confirmation message when
   Supabase returns no session.

Application data is accessed by Next.js API routes and server components through
Prisma. The current PostgreSQL role bypasses RLS, so every API must enforce its own
membership and ownership rules. The browser uses Supabase for authentication only.
The captured direct Data API policies still need a separate hardening review:
member policies reference their own table and split update privileges are broader
than just the `paid` column. Do not treat this snapshot as proof of complete RLS
security. Live policies and records were not changed by the application fixes.

## Checks

```bash
npm test
npm run lint
npm run build
npm run typecheck
```

Regression tests cover split arithmetic and validation, admin-only invites,
unauthorized expenses, preservation of settled shares, and settlement membership.
Route tests execute the real handlers with mocked authentication and database services;
they do not mutate production data. GitHub Actions runs tests, lint, build and type checks.

The schema still stores monetary fields as PostgreSQL floating-point values. New
splits are calculated in integer cents before storage; legacy records are not rewritten.
A future schema migration can move storage itself to integer cents or fixed decimals.
