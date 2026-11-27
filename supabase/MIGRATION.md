# Moving BIM to a new Supabase project

1. **Create the project** in Supabase (region close to Cambodia, e.g. Singapore).
2. **Create the tables**: SQL Editor → paste `supabase/schema.sql` → Run.
3. **Copy the data** from the old project (needs both service_role keys):
   ```bash
   OLD_SUPABASE_URL=… OLD_SUPABASE_KEY=… NEW_SUPABASE_URL=… NEW_SUPABASE_KEY=… \
     node scripts/migrate-supabase.mjs --dry-run   # check counts
   OLD_SUPABASE_URL=… OLD_SUPABASE_KEY=… NEW_SUPABASE_URL=… NEW_SUPABASE_KEY=… \
     node scripts/migrate-supabase.mjs
   ```
   Do this at a quiet time (no one saving), or right after it, re-run it once.
4. **Point Vercel at the new project**: Project → Settings → Environment Variables (Production):
   | Variable | Value |
   |---|---|
   | `BIM_SUPABASE_URL` | `https://<new-ref>.supabase.co` |
   | `BIM_SUPABASE_SERVICE_ROLE_KEY` | new project's **service_role** (secret) key |
   | `BIM_POSTGRES_URL` *(optional)* | new project's connection string (Transaction pooler, port 6543) |

   Remove/replace any old `VITE_SUPABASE_URL`, `DATABASE_URL`, `BIM_SUPABASE_SECRET_KEY` values that still point at the old project.
5. **Redeploy** (Deployments → ⋯ → Redeploy) so the new variables take effect.
6. **Check**: open `https://<your-site>/api/state/version` — `lastSavedAt` should match the old project; open the app and confirm students and payments are there. Keep the old project for a week before deleting it.
