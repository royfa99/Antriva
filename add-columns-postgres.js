require('dotenv').config({ path: '.env' });
const postgres = require('postgres');

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    await sql`ALTER TABLE "queues" ADD COLUMN "sort_order" real;`;
    console.log("Added sort_order");
  } catch (e) { console.log(e.message); }
  
  try {
    await sql`ALTER TABLE "queues" ADD COLUMN "is_present" boolean NOT NULL DEFAULT false;`;
    console.log("Added is_present");
  } catch (e) { console.log(e.message); }

  try {
    await sql`UPDATE "queues" SET "sort_order" = "queue_number";`;
    console.log("Updated sort_order");
  } catch (e) { console.log(e.message); }
  
  await sql.end();
}

run();
