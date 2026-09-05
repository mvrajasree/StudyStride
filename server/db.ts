import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { studyWorkspaces, type InsertStudyWorkspace, type InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getPostgresConnectionString() {
  const projectUrl = process.env.POSTGRES_DATABASE_URL;
  if (projectUrl?.startsWith("postgres://") || projectUrl?.startsWith("postgresql://")) return projectUrl;
  const builtInUrl = process.env.DATABASE_URL;
  if (builtInUrl?.startsWith("postgres://") || builtInUrl?.startsWith("postgresql://")) return builtInUrl;
  return undefined;
}

export function getDb() {
  if (!_db) {
    const connectionString = getPostgresConnectionString();
    if (!connectionString) return null;
    _pool = new Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 30_000,
      ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    });
    _db = drizzle(_pool);
  }
  return _db;
}

export async function pingPostgres() {
  if (!_pool) getDb();
  if (!_pool) return false;
  const result = await _pool.query("select 1 as ok");
  return result.rows[0]?.ok === 1;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = getDb();
  if (!db) {
    console.warn("[Database] PostgreSQL is not configured; cannot upsert user");
    return;
  }

  const values: InsertUser = { openId: user.openId, name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: user.lastSignedIn ?? new Date() };
  if (user.role) values.role = user.role;
  else if (user.openId === ENV.ownerOpenId) values.role = "admin";

  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: { name: values.name, email: values.email, loginMethod: values.loginMethod, lastSignedIn: values.lastSignedIn, ...(values.role ? { role: values.role } : {}) },
  });
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createLocalUser(input: { openId: string; name: string; email: string; passwordHash: string }) {
  const db = getDb();
  if (!db) throw new Error("PostgreSQL is not configured");
  const result = await db.insert(users).values({ ...input, loginMethod: "password" }).returning();
  return result[0];
}

export async function getStudyWorkspace(workspaceKey: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(studyWorkspaces).where(eq(studyWorkspaces.workspaceKey, workspaceKey)).limit(1);
  return result[0];
}

export async function upsertStudyWorkspace(workspace: InsertStudyWorkspace) {
  const db = getDb();
  if (!db) throw new Error("PostgreSQL is not configured");
  const result = await db.insert(studyWorkspaces).values(workspace).onConflictDoUpdate({
    target: studyWorkspaces.workspaceKey,
    set: { profile: workspace.profile, tasks: workspace.tasks, subjects: workspace.subjects, logs: workspace.logs, streak: workspace.streak, updatedAt: new Date() },
  }).returning();
  return result[0];
}
