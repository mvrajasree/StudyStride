import { jsonb, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export const studyWorkspaces = pgTable("study_workspaces", {
  id: serial("id").primaryKey(),
  workspaceKey: varchar("workspaceKey", { length: 128 }).notNull().unique(),
  profile: jsonb("profile").notNull(),
  tasks: jsonb("tasks").notNull(),
  subjects: jsonb("subjects").notNull(),
  logs: jsonb("logs").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StudyWorkspace = typeof studyWorkspaces.$inferSelect;
export type InsertStudyWorkspace = typeof studyWorkspaces.$inferInsert;
