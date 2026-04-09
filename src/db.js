const { Pool } = require("pg");

const config = {
  max: process.env.PGPOOL_MAX ? Number(process.env.PGPOOL_MAX) : 10,
};

// Important: only set optional fields when defined.
// Passing `password: undefined` can override the password parsed from `DATABASE_URL`.
if (process.env.DATABASE_URL) config.connectionString = process.env.DATABASE_URL;
if (process.env.PGHOST) config.host = process.env.PGHOST;
if (process.env.PGPORT) config.port = Number(process.env.PGPORT);
if (process.env.PGUSER) config.user = process.env.PGUSER;
if (process.env.PGPASSWORD) config.password = process.env.PGPASSWORD;
if (process.env.PGDATABASE) config.database = process.env.PGDATABASE;

const pool = new Pool(config);

async function dbPing() {
  const client = await pool.connect();
  try {
    const r = await client.query("select 1 as ok");
    return { ok: true, result: r.rows[0] };
  } finally {
    client.release();
  }
}

module.exports = { pool, dbPing };
