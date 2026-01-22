import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { DUMMY_PASSWORD } from "@/lib/constants";
import { getUser, createUser, updateUserDiscordId, getUserByDiscordId } from "@/lib/db/queries";
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
  secret: process.env.AUTH_SECRET,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        url: "https://discord.com/api/oauth2/authorize",
        params: {
          scope: "identify email guilds.join",
        },
      },
      // Note: With trustHost: true, NextAuth automatically detects the redirect URI
      // from request headers. For preview deployments, add the preview URL to Discord:
      // https://your-preview-url.vercel.app/api/auth/callback/discord
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
        try {
          const discordProfile = profile as { id?: string } | undefined;
          const discordId = discordProfile?.id;

          const existingUsers = await getUser(user.email);

          // If user doesn't exist, create them (without password for OAuth users)
          if (existingUsers.length === 0) {
            try {
              await createUser(user.email, "", discordId);
            } catch (error) {
              console.error("Failed to create user from Discord OAuth:", error);
              return false;
            }
          } else if (discordId) {
            // Update existing user's Discord ID if it's missing or changed
            const [existingUser] = existingUsers;
            if (existingUser.discordId !== discordId) {
              try {
                await updateUserDiscordId(existingUser.id, discordId);
              } catch (error) {
                console.error("Failed to update Discord ID:", error);
                // Don't fail sign-in if update fails
              }
            }
          }

          // Add user to Discord server if we have the access token and Discord ID
          if (account.access_token && discordId) {
            try {
              const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
              const response = await fetch(`${baseUrl}/api/discord/add-to-guild`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: discordId,
                  accessToken: account.access_token,
                }),
              });

              if (response.ok) {
                console.log("Successfully added user to Discord server");
              } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("Failed to add user to Discord server:", errorData);
              }
            } catch (error) {
              console.error("Error calling add-to-guild API:", error);
              // Don't fail sign-in if adding to guild fails
            }
          }
        } catch (error) {
          console.error("Error during Discord sign-in:", error);
          // If there's a database error, still allow sign-in to proceed
          // The user might be created in the JWT callback instead
          return true;
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
        const discordProfile = profile as { id?: string } | undefined;
        const discordId = discordProfile?.id;

        // First try to find user by Discord ID
        let dbUser = discordId ? await getUserByDiscordId(discordId) : null;

        // Fall back to finding by email (normal flow)
        if (!dbUser) {
          const users = await getUser(user.email);
          if (users.length > 0) {
            dbUser = users[0];
          }
        }

        if (dbUser) {
          token.id = dbUser.id;
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
