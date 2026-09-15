import { NextResponse, type NextRequest } from "next/server";
import { getViewerContext, getRandomMediaId } from "@/lib/media/query";

export async function GET(req: NextRequest) {
  const viewer = await getViewerContext();
  const id = await getRandomMediaId(viewer);

  if (!id) {
    return NextResponse.redirect(new URL("/gallery", req.url));
  }

  return NextResponse.redirect(new URL(`/i/${id}`, req.url));
}
