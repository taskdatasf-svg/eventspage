/**
 * RLS Migration Script
 * Enables Row-Level Security on all tables and adds a blanket
 * service-role policy so Prisma (which connects with the postgres
 * superuser) can still read / write every row without restriction.
 *
 * Run once:  node scripts/enable-rls.mjs
 */

import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    'postgresql://postgres.bclwlhtvolosfujrbsgy:eventsstudentforgecomm@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

const tables = ['User', 'Event', 'Registration'];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const table of tables) {
      const quoted = `"${table}"`;

      // 1. Enable RLS
      await client.query(`ALTER TABLE ${quoted} ENABLE ROW LEVEL SECURITY;`);
      console.log(`✓ RLS enabled  →  ${table}`);

      // 2. Force RLS to also apply to the table owner (postgres role)
      //    This prevents accidental bypass via the superuser connection.
      await client.query(`ALTER TABLE ${quoted} FORCE ROW LEVEL SECURITY;`);
      console.log(`✓ RLS forced   →  ${table}`);

      // 3. Drop old catch-all policies so we start clean
      const policyName = `service_role_all_${table}`;
      await client.query(
        `DROP POLICY IF EXISTS ${policyName} ON ${quoted};`
      );

      // 4. Re-create a single permissive policy that allows the
      //    Prisma / service-role Postgres user unrestricted access.
      //    All four operations (SELECT, INSERT, UPDATE, DELETE) are covered.
      await client.query(`
        CREATE POLICY ${policyName}
        ON ${quoted}
        AS PERMISSIVE
        FOR ALL
        TO postgres
        USING (true)
        WITH CHECK (true);
      `);
      console.log(`✓ Policy set   →  ${table}  (service_role_all_${table})`);
    }

    await client.query('COMMIT');
    console.log('\n✅  All tables secured with RLS + service-role bypass policy.\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Error applying RLS — transaction rolled back.', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
