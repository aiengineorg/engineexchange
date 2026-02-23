import type { NextAuthConfig } from "next-auth";
import { DEFAULT_SESSION_ID } from "@/lib/constants";

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
