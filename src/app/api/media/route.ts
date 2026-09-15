import { NextResponse, type NextRequest } from "next/server";
import { getViewerContext, getMediaPage, type MediaSort } from "@/lib/media/query";

const VALID_SORTS: MediaSort[] = ["trending", "recent", "most-liked"];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sortParam = searchParams.get("sort");
  const sort: MediaSort = VALID_SORTS.includes(sortParam as MediaSort) ? (sortParam as MediaSort) : "trending";
  const category = searchParams.get("category");
  const cursor = searchParams.get("cursor");

  const viewer = await getViewerContext();
  const page = await getMediaPage(sort, {
    viewer,
    take: 24,
    cursor: cursor || null,
    categorySlug: category || null,
  });

  return NextResponse.json(page);
}
