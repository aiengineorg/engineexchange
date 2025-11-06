import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { DUMMY_PASSWORD } from "@/lib/constants";
import { getUser, createUser } from "@/lib/db/queries";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      discordUsername?: string | null;
      discordAvatar?: string | null;
    } & DefaultSession["user"];
  }

  // biome-ignore lint/nursery/useConsistentTypeDefinitions: "Required"
  interface User {
    id?: string;
    email?: string | null;
    discordUsername?: string | null;
    discordAvatar?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    discordUsername?: string | null;
    discordAvatar?: string | null;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-ins (Discord)
      if (account?.provider === "discord" && user.email) {
        const existingUsers = await getUser(user.email);
        
        // If user doesn't exist, create them (without password for OAuth users)
        if (existingUsers.length === 0) {
          try {
            await createUser(user.email, "");
          } catch (error) {
            console.error("Failed to create user from Discord OAuth:", error);
            return false;
          }
        }
      }
      
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // For credentials provider, user.id is already set
      if (user?.id) {
        token.id = user.id;
      }

      // For OAuth providers (Discord), fetch the user ID from the database
      if (account?.provider === "discord" && user?.email) {
        const users = await getUser(user.email);
        if (users.length > 0) {
          token.id = users[0].id;
        }

        // Store Discord profile information
        // NextAuth automatically maps Discord profile to standard fields
        // Discord provides: username, global_name, id, avatar, image
        if (profile) {
          const discordProfile = profile as {
            username?: string;
            global_name?: string | null;
            name?: string;
            image?: string;
            avatar?: string;
          };
          
          // Use global_name (Discord display name) if available, otherwise username, otherwise name
          token.discordUsername = discordProfile.global_name || discordProfile.username || discordProfile.name || null;
          // NextAuth maps Discord avatar to image field
          token.discordAvatar = discordProfile.image || discordProfile.avatar || null;
        }
        
        // Also check user object as NextAuth may have already mapped it
        if (user?.name) {
          token.discordUsername = token.discordUsername || user.name;
        }
        if (user?.image) {
          token.discordAvatar = token.discordAvatar || user.image;
        }
      }

      // Preserve Discord data from user object if present
      if (user?.discordUsername) {
        token.discordUsername = user.discordUsername;
      }
      if (user?.discordAvatar) {
        token.discordAvatar = user.discordAvatar;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.discordUsername = token.discordUsername;
        session.user.discordAvatar = token.discordAvatar;
      }

      return session;
    },
  },
});
