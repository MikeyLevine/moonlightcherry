import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { recordView } from "@/lib/media/views";

const ANON_COOKIE = "mc_anon";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const existingAnonId = req.cookies.get(ANON_COOKIE)?.value ?? null;
  const anonId = session?.user ? null : (existingAnonId ?? randomUUID());

  await recordView(id, { userId: session?.user?.id ?? null, anonId });

  const res = NextResponse.json({ ok: true });
  if (!session?.user && anonId && anonId !== existingAnonId) {
    res.cookies.set(ANON_COOKIE, anonId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
