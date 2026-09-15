import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

/** Generates a unique username from a display name (typically the OAuth
 * profile name), since Discord/Google don't provide one and every account
 * needs a working /u/[username] profile URL from the moment it's created. */
export async function generateUniqueUsername(seed: string): Promise<string> {
  const base = slugify(seed) || "user";
  let candidate = base;
  let suffix = 0;

  while (await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }

  return candidate;
}
