import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// prepare: false is required for Supabase Transaction Pooler (port 6543)
// which does not support PostgreSQL prepared statements
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });

export type Database = typeof db;
