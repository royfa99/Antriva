require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    await client.query(`ALTER TABLE "queues" ADD COLUMN "sort_order" real;`);
    console.log("Added sort_order");
  } catch (e) { console.log(e.message); }
  
  try {
    await client.query(`ALTER TABLE "queues" ADD COLUMN "is_present" boolean NOT NULL DEFAULT false;`);
    console.log("Added is_present");
  } catch (e) { console.log(e.message); }

  try {
    await client.query(`UPDATE "queues" SET "sort_order" = "queue_number";`);
    console.log("Updated sort_order");
  } catch (e) { console.log(e.message); }
  
  await client.end();
}

run();
