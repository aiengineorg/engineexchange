import type { NextAuthConfig } from "next-auth";

// Read directly from env to avoid importing lib/constants (which pulls in bcrypt-ts via db/utils)
const DEFAULT_SESSION_ID =
  (process.env.DEFAULT_SESSION_ID || "1784d222-27f9-4fed-a28f-f454444e760f").trim();

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: `/sessions/${DEFAULT_SESSION_ID}/discover`,
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {},
  trustHost: true, // Required for NextAuth v5 - enables automatic URL detection from request headers
  // This allows NextAuth to work with dynamic preview URLs on Vercel
} satisfies NextAuthConfig;
