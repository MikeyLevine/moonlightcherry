/**
 * Cloudflare Turnstile verification. No-ops (always passes) when
 * TURNSTILE_SECRET_KEY isn't configured, so this ships disabled until real
 * keys are dropped into .env — see .env.example. Once a secret is set, a
 * missing/invalid token fails closed.
 */
export async function verifyTurnstile(token: string | null): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  if (!token) return { ok: false, error: "Verification required." };

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success ? { ok: true } : { ok: false, error: "Verification failed." };
  } catch {
    return { ok: false, error: "Verification service unavailable." };
  }
}

export function turnstileEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
