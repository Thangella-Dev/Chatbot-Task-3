const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Create `.env` (Copy-Item .env.example .env) and set DATABASE_URL.");
  }

  const { pool } = require("../src/db");
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    // eslint-disable-next-line no-console
    console.log("Applying", file);
    await pool.query(sql);
  }

  // eslint-disable-next-line no-console
  console.log("Migrations complete.");
  await pool.end();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
