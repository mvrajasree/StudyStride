import { defineConfig } from "drizzle-kit";

const connectionString = process.env.POSTGRES_DATABASE_URL;
if (!connectionString?.startsWith("postgres://") && !connectionString?.startsWith("postgresql://")) {
  throw new Error("POSTGRES_DATABASE_URL must be set to a PostgreSQL connection string to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
