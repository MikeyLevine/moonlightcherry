import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { generateUniqueUsername } from "@/lib/users/generateUsername";
import { blocksSignIn } from "@/lib/admin/moderationStatus";

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
    async signIn({ user }) {
      if (!user.email) return true;
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { moderationStatus: true, moderationUntil: true },
      });
      if (existing && blocksSignIn(existing.moderationStatus, existing.moderationUntil)) {
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.nsfwEnabled = user.nsfwEnabled;
      session.user.username = user.username;
      session.user.moderationStatus = user.moderationStatus;
      session.user.moderationUntil = user.moderationUntil;
      return session;
    },
  },
});
