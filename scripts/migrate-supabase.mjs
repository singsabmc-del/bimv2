// Copy BIM school data from the OLD Supabase project to the NEW one.
// 1. Run supabase/schema.sql in the new project first.
// 2. Then, from the repo folder:
//      OLD_SUPABASE_URL=https://old.supabase.co OLD_SUPABASE_KEY=<old service_role key> \
//      NEW_SUPABASE_URL=https://new.supabase.co NEW_SUPABASE_KEY=<new service_role key> \
//      node scripts/migrate-supabase.mjs
//    Add --dry-run to only count rows.
// Keys are read from the environment only — never commit them.
import { createClient } from '@supabase/supabase-js';

const need = (k) => {
  const v = process.env[k];
  if (!v) { console.error(`Missing ${k}`); process.exit(1); }
  return v;
};
const dry = process.argv.includes('--dry-run');
const opts = { auth: { persistSession: false } };
const oldDb = createClient(need('OLD_SUPABASE_URL'), need('OLD_SUPABASE_KEY'), opts);
const newDb = createClient(need('NEW_SUPABASE_URL'), need('NEW_SUPABASE_KEY'), opts);

async function copy(table, columns) {
  const { data, error } = await oldDb.from(table).select(columns);
  if (error) throw new Error(`${table} read: ${error.message}`);
  console.log(`${table}: ${data.length} row(s)`);
  if (dry || !data.length) return;
  for (const row of data) {
    const { error: e } = await newDb.from(table).upsert(row);
    if (e) throw new Error(`${table} write ${row.id}: ${e.message}`);
  }
  const { count } = await newDb.from(table).select('id', { count: 'exact', head: true });
  console.log(`  → new project now has ${count} row(s)`);
}

try {
  await copy('bim_school_state', 'id, data, updated_at');
  await copy('bim_school_backups', 'id, title, created_at, meta, data');
  console.log(dry ? 'Dry run done.' : 'Migration done.');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
}
