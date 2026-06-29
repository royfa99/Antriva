import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Cache the connection in development to prevent connection exhaustion from HMR
const queryClient = (globalThis as any).postgresClient || postgres(connectionString, { 
    prepare: false // Required for Supabase transaction pooler (port 6543)
});

if (process.env.NODE_ENV !== "production") {
  (globalThis as any).postgresClient = queryClient;
}

export const db = drizzle(queryClient, { schema });
