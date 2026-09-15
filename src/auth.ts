import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { generateUniqueUsername } from "@/lib/users/generateUsername";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  basePath: "/auth",
  session: { strategy: "database" },
  trustHost: true,
  providers: [Discord, Google],
  pages: {
    signIn: "/login",
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const username = await generateUniqueUsername(user.name ?? user.email ?? "user");
      await prisma.user.update({ where: { id: user.id }, data: { username } });
    },
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.nsfwEnabled = user.nsfwEnabled;
      session.user.username = user.username;
      return session;
    },
  },
});
