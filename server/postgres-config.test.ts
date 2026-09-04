import { describe, expect, it } from "vitest";
import { getPostgresConnectionString, getStudyWorkspace, pingPostgres } from "./db";

describe("PostgreSQL configuration", () => {
  it("prefers the project PostgreSQL secret when configured", () => {
    const original = process.env.POSTGRES_DATABASE_URL;
    process.env.POSTGRES_DATABASE_URL = "postgresql://user:password@host.example/db?sslmode=require";
    expect(getPostgresConnectionString()).toContain("postgresql://");
    if (original === undefined) delete process.env.POSTGRES_DATABASE_URL;
    else process.env.POSTGRES_DATABASE_URL = original;
  });

  it.skipIf(!process.env.POSTGRES_DATABASE_URL)("connects to the configured PostgreSQL database with a lightweight query", async () => {
    expect(await pingPostgres()).toBe(true);
  });

  it.skipIf(!process.env.POSTGRES_DATABASE_URL)("can query the migrated StudyStride workspace table", async () => {
    await expect(getStudyWorkspace("migration-check")).resolves.toBeUndefined();
  });

  it.skipIf(!process.env.POSTGRES_DATABASE_URL)("contains the Rajasree workspace saved by the app", async () => {
    const workspace = await getStudyWorkspace("rajasree-bca-sem5");
    expect(workspace).toBeDefined();
    expect((workspace?.profile as { name?: string }).name).toBe("Rajasree");
    expect(workspace?.subjects).toHaveLength(5);
    expect(workspace?.logs).toHaveLength(0);
  });
});
