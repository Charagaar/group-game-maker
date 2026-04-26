# New Supabase Project Setup

This app is already wired to load hints and facts from `public.game_categories` (`hint_1`, `hint_2`, `puzzle_fact`).
Use this guide to move to a new Supabase project quickly.

## 1) Create a new Supabase project

1. Open your Supabase dashboard.
2. Click `New project`.
3. Pick organization, project name, database password, and region.
4. Wait for provisioning to finish.

## 2) Run the bootstrap SQL (one-time)

1. In your new project, open `SQL Editor`.
2. Copy the file:
   - `supabase/new-project-bootstrap.sql`
3. Run it.

This creates the schema your app expects:
- `public.game_categories` with `hint_1`, `hint_2`, `puzzle_fact`
- `public.game_sessions`
- `public.user_roles`
- role helper functions and policies
- analytics views used by `/statistics`

## 3) Point the app to the new project

1. In Supabase, open `Project Settings -> API`.
2. Copy:
   - `Project URL`
   - `anon public key`
3. In this repo, create/update `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_ANON_KEY
```

You can also use `VITE_SUPABASE_ANON_KEY` instead of `VITE_SUPABASE_PUBLISHABLE_KEY`.

## 4) Create your first admin

Option A (recommended):
1. Go to `/auth` in your app and sign up with your email/password.
2. In Supabase SQL Editor, run:

```sql
select public.grant_admin_to_user('your-email@example.com');
```

Option B:
- Sign in at `/auth`, then open `/bootstrap` and use `Grant Admin To Current User`.

## 5) Verify hints/facts save correctly

1. Login at `/auth`.
2. Open `/admin`.
3. Edit `Hint 1`, `Hint 2`, and `Post-Game Fact`.
4. Save changes.
5. Reload and confirm the values persist.

## 6) Optional: migrate old data

If you want old categories/hints/facts copied over, export rows from old project `public.game_categories` and insert into new project.
