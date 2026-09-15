/**
 * NOT REAL PROTECTION — PLACEHOLDER ONLY.
 *
 * This is a structural stand-in for the mandatory CSAM perceptual-hash
 * screening described in PLAN.md §4 and left as an explicit open item in
 * §20 (item 3): a real provider (e.g. Thorn Safer, or NCMEC's hash-matching
 * APIs) has to be evaluated and wired in here before this platform is safe
 * to run with real, public uploads. That is a legal/compliance decision for
 * the project owner, not something this code can decide or fake.
 *
 * Every call is logged loudly so it can never be mistaken for real coverage.
 */
export async function screenForCsam(buffer: Buffer): Promise<{ clear: boolean; reason?: string }> {
  console.warn(
    `[csam-screen] STUB — no real CSAM hash-matching is configured (received ${buffer.byteLength} bytes, ` +
      "not screened against any hash database). See PLAN.md §20 item 3."
  );
  return { clear: true };
}
