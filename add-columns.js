require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL");
    return;
  }
  const sql = neon(process.env.DATABASE_URL);
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
}

run();
