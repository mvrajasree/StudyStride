import { randomUUID } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { authError, createLocalSession, hashPassword, verifyPassword } from "./auth";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createLocalUser, getStudyWorkspace, getUserByEmail, upsertStudyWorkspace } from "./db";

const workspaceInput = z.object({
  workspaceKey: z.string().min(1).max(128),
  profile: z.record(z.string(), z.unknown()),
  tasks: z.array(z.unknown()),
  subjects: z.array(z.unknown()),
  logs: z.array(z.unknown()),
  streak: z.record(z.string(), z.unknown()),
});

const credentialsInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

function safeUser(user: NonNullable<Awaited<ReturnType<typeof getUserByEmail>>>) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

function setAuthCookie(ctx: { req: any; res: any }, token: string) {
  ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 24 * 30 });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ? safeUser(opts.ctx.user) : null),
    signup: publicProcedure.input(credentialsInput.extend({ name: z.string().trim().min(1).max(80) })).mutation(async ({ ctx, input }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) throw authError("An account with this email already exists.");
      const user = await createLocalUser({ openId: `local_${randomUUID()}`, name: input.name, email: input.email, passwordHash: await hashPassword(input.password) });
      setAuthCookie(ctx, await createLocalSession(user.openId, user.name ?? input.name));
      return safeUser(user);
    }),
    login: publicProcedure.input(credentialsInput).mutation(async ({ ctx, input }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !user.passwordHash) authError("Email or password is incorrect.");
      if (!(await verifyPassword(input.password, user.passwordHash))) authError("Email or password is incorrect.");
      setAuthCookie(ctx, await createLocalSession(user.openId, user.name ?? user.email ?? "StudyStride learner"));
      return safeUser(user);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  study: router({
    get: publicProcedure.input(z.object({ workspaceKey: z.string().min(1).max(128) })).query(({ input }) => getStudyWorkspace(input.workspaceKey)),
    save: publicProcedure.input(workspaceInput).mutation(({ input }) => upsertStudyWorkspace(input)),
  }),
});

export type AppRouter = typeof appRouter;
