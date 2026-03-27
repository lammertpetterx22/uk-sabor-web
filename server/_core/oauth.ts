import { COOKIE_NAME, ONE_DAY_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { sendWelcomeEmail } from "../features/email";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      const { isNewUser } = await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Send welcome email to new users (async, don't wait for it)
      if (isNewUser && userInfo.email && userInfo.name) {
        console.log("[OAuth] 📧 New user registered, sending welcome email to:", userInfo.email);
        console.log("[OAuth] 🔑 RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);

        sendWelcomeEmail({
          to: userInfo.email,
          userName: userInfo.name,
        }).then((success) => {
          if (success) {
            console.log("[OAuth] ✅ Welcome email sent successfully to:", userInfo.email);
          } else {
            console.error("[OAuth] ❌ Welcome email returned false for:", userInfo.email);
          }
        }).catch((error) => {
          console.error("[OAuth] ❌ Failed to send welcome email:", error);
        });
      } else if (!isNewUser) {
        console.log("[OAuth] ℹ️  Existing user logged in, no welcome email sent:", userInfo.email);
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_DAY_MS, // 24h auto-logout
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_DAY_MS });


      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
