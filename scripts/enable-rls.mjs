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

      await client.query(`ALTER TABLE ${quoted} ENABLE ROW LEVEL SECURITY;`);

      await client.query(`ALTER TABLE ${quoted} FORCE ROW LEVEL SECURITY;`);

      const policyName = `service_role_all_${table}`;
      await client.query(
        `DROP POLICY IF EXISTS ${policyName} ON ${quoted};`
      );

      await client.query(`
        CREATE POLICY ${policyName}
        ON ${quoted}
        AS PERMISSIVE
        FOR ALL
        TO postgres
        USING (true)
        WITH CHECK (true);
      `);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
