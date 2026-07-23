import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required.\n" +
    "  Local:    postgres://user:password@localhost:5432/sarthaksetu\n" +
    "  Docker:   postgres://sarthaksetu:password@postgres:5432/sarthaksetu\n" +
    "  See .env.example for details.",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
