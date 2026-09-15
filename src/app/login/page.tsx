import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { signInWithDiscord, signInWithGoogle } from "@/lib/actions";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-6 px-5 py-24 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Sign in</h1>
      <p className="max-w-[52ch] text-base leading-relaxed text-ash">
        Moonlight Cherry uses Discord or Google to sign in — no password to create or remember.
      </p>
      <div className="flex flex-col gap-3">
        <form action={signInWithDiscord}>
          <Button type="submit" variant="ghost" className="w-64 justify-start">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-white/10 font-accent text-[10px] font-bold text-moonlight">
              D
            </span>
            Continue with Discord
          </Button>
        </form>
        <form action={signInWithGoogle}>
          <Button type="submit" variant="ghost" className="w-64 justify-start">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-white/10 font-accent text-[10px] font-bold text-moonlight">
              G
            </span>
            Continue with Google
          </Button>
        </form>
      </div>
    </div>
  );
}
