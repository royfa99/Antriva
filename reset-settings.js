const postgres = require("postgres");
require("dotenv").config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    await sql`UPDATE settings SET value = '[]' WHERE key = 'monitor_schedules'`;
    console.log("Settings updated to empty array.");
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

run();
