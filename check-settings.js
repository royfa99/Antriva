const postgres = require("postgres");
require("dotenv").config();
async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const res = await sql`SELECT key, value FROM settings WHERE key LIKE 'admin_access_%'`;
    console.log(res);
  } finally {
    await sql.end();
  }
}
run();
