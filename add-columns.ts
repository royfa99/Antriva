import { db } from "./src/db/index";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql`ALTER TABLE "queues" ADD COLUMN "sort_order" real;`);
    console.log("Added sort_order");
  } catch(e: any) { console.log(e.message); }

  try {
    await db.execute(sql`ALTER TABLE "queues" ADD COLUMN "is_present" boolean NOT NULL DEFAULT false;`);
    console.log("Added is_present");
  } catch(e: any) { console.log(e.message); }

  try {
    await db.execute(sql`UPDATE "queues" SET "sort_order" = "queue_number";`);
    console.log("Updated sort_order");
  } catch(e: any) { console.log(e.message); }
  
  process.exit(0);
}
run();
