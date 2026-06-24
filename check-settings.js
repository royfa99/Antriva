const postgres = require("postgres");
require("dotenv").config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const settings = await sql`SELECT * FROM settings`;
    console.log(settings);
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

run();
