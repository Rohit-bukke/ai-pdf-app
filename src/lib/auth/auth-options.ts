import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { env } from "../env";
import { connectToDatabase } from "../db/mongodb";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          if (!user.email) return false;

          let dbUser = await User.findOne({ email: user.email.toLowerCase() });

          if (!dbUser) {
            dbUser = await User.create({
              name: user.name || "Learner",
              email: user.email.toLowerCase(),
              image: user.image || "",
              role: "USER",
            });
          }

          // Attach database ID to user object for jwt callback
          user.id = dbUser._id.toString();
          return true;
        } catch (error) {
          console.error("[NextAuth] signIn error:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      // If token does not have role or id (subsequent requests), refresh from DB
      if (token.email && (!token.id || !token.role)) {
        try {
          await connectToDatabase();
          const dbUser = await User.findOne({ email: token.email.toLowerCase() });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("[NextAuth] jwt callback DB sync error:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") || "USER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
};
