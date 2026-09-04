import { defineConfig } from "drizzle-kit";

const connectionString = process.env.POSTGRES_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString?.startsWith("postgres://") && !connectionString?.startsWith("postgresql://")) {
  throw new Error("A PostgreSQL connection string is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
