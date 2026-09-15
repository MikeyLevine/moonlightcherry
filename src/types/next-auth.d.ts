import type { DefaultSession } from "next-auth";
import type { ModerationStatus, Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      nsfwEnabled: boolean;
      username: string | null;
      moderationStatus: ModerationStatus;
      moderationUntil: Date | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role;
    nsfwEnabled: boolean;
    username: string | null;
    moderationStatus: ModerationStatus;
    moderationUntil: Date | null;
  }
}
