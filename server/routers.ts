import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { customAuthRouter } from "./features/custom-auth";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { eventsRouter } from "./features/events";
import { coursesRouter } from "./features/courses";
import { classesRouter } from "./features/classes";
import { instructorsRouter } from "./features/instructors";
import { adminRouter } from "./features/admin";
import { adminAuthRouter } from "./features/admin-auth";
import { crmRouter } from "./features/crm";
import { uploadsRouter } from "./features/uploads";
import { paymentsRouter } from "./features/payments";
import { qrcodeRouter } from "./features/qrcode";
import { emailMarketingRouter } from "./features/emailMarketing";
import { subscriptionsRouter } from "./features/subscriptions";
import { stripeSyncRouter } from "./features/stripeSync";
import { promotersRouter } from "./features/promoters";
import { lessonsRouter } from "./features/lessons";
import { ticketsRouter } from "./features/tickets";
import { financialsRouter } from "./features/financials";
import { checkoutRouter } from "./features/checkout";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: customAuthRouter,

  events: eventsRouter,
  courses: coursesRouter,
  lessons: lessonsRouter,
  tickets: ticketsRouter,
  classes: classesRouter,
  instructors: instructorsRouter,
  adminAuth: adminAuthRouter,
  admin: adminRouter,
  crm: crmRouter,
  uploads: uploadsRouter,
  payments: paymentsRouter,
  checkout: checkoutRouter,
  qrcode: qrcodeRouter,
  emailMarketing: emailMarketingRouter,
  subscriptions: subscriptionsRouter,
  stripeSync: stripeSyncRouter,
  promoters: promotersRouter,
  financials: financialsRouter,
});

export type AppRouter = typeof appRouter;
