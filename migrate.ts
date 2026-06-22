import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const runMigrate = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("Dropping existing tables...");
  await migrationClient.unsafe("DROP SCHEMA public CASCADE;");
  await migrationClient.unsafe("CREATE SCHEMA public;");
  await migrationClient.unsafe("GRANT ALL ON SCHEMA public TO postgres;");
  await migrationClient.unsafe("GRANT ALL ON SCHEMA public TO public;");

  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations successfully applied!");
  } catch (error) {
    console.error("Error applying migrations:", error);
  } finally {
    await migrationClient.end();
  }
};

runMigrate().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
