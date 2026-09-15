"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithDiscord() {
  await signIn("discord", { redirectTo: "/" });
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function doSignOut() {
  await signOut({ redirectTo: "/" });
}
