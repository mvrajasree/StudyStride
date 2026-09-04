import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getStudyWorkspace, upsertStudyWorkspace } from "./db";

const workspaceInput = z.object({
  workspaceKey: z.string().min(1).max(128),
  profile: z.record(z.string(), z.unknown()),
  tasks: z.array(z.unknown()),
  subjects: z.array(z.unknown()),
  logs: z.array(z.unknown()),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
