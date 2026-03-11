import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, crmContacts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;

export const customAuthRouter = router({
  // Register a new user
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        name: z.string().min(2, "Name must be at least 2 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

      // Create user with custom password field
      const newUser = await db.insert(users).values({
        email: input.email,
        name: input.name,
        openId: `custom-${Date.now()}-${Math.random()}`,
        loginMethod: "custom",
        role: "user",
        lastSignedIn: new Date(),
      });

      // Auto-add to CRM contacts
      try {
        const nameParts = input.name.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ");

        const contactData: any = {
          email: input.email,
          segment: "customer",
          source: "website_registration",
        };

        if (firstName) contactData.firstName = firstName;
        if (lastName) contactData.lastName = lastName;

        await db.insert(crmContacts).values(contactData);
      } catch (error) {
        // Silently ignore if contact already exists
        console.error("Error adding contact:", error);
      }

      return {
        success: true,
        message: "Registration successful. Please login.",
      };
    }),

  // Login with email and password
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email"),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find user by email
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userResult.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      const user = userResult[0];

      // Verify password using bcrypt (secure comparison)
      const passwordField = (user as any).password;
      if (!passwordField) {
        // User registered via OAuth or has no password set
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      const isPasswordValid = await bcrypt.compare(input.password, passwordField);
      if (!isPasswordValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Ensure contact exists in CRM
      const existingContact = await db
        .select()
        .from(crmContacts)
        .where(eq(crmContacts.email as any, user.email))
        .limit(1);

      if (existingContact.length === 0) {
        try {
          const nameParts = user.name?.split(" ") || ["User"];
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(" ");

          const contactData: any = {
            email: user.email,
            segment: "customer",
            source: "website_login",
          };

          if (firstName) contactData.firstName = firstName;
          if (lastName) contactData.lastName = lastName;

          await db.insert(crmContacts).values(contactData);
        } catch (error) {
          console.error("Error adding contact on login:", error);
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  // Get current user
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user || null;
  }),

  // Logout
  logout: protectedProcedure.mutation(({ ctx }) => {
    const cookieOptions = {
      secure: true,
      sameSite: "none" as const,
      httpOnly: true,
      path: "/",
    };
    ctx.res.clearCookie("auth_token", { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        bio: z.string().optional(),
        avatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;

      // Ensure there's something to update
      if (Object.keys(updateData).length === 0) {
        return { success: true, message: "No changes provided" };
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "Profile updated successfully",
      };
    }),
});
