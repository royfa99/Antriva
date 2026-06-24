const postgres = require("postgres");
require("dotenv").config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const s = await sql`SELECT * FROM schedules WHERE id = 'ab2367a8-dba5-42a2-bc07-364cb2fb4d07'`;
    console.log("Monitor schedule:", s);
    
    const all = await sql`SELECT * FROM schedules`;
    console.log("All schedules:", all);
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

run();
