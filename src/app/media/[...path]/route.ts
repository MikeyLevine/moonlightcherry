import { readFile, stat } from "fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { resolveMediaFilePath } from "@/lib/media/storage";

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  gif: "image/gif",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const filePath = resolveMediaFilePath(segments);
  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  let size: number;
  try {
    size = (await stat(filePath)).size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  // The path itself is content-addressed (checksum-derived), so it's already
  // a valid strong identity for this exact byte content — no need to hash
  // the file contents to get a real ETag.
  const etag = `"${segments.join("/")}-${size}"`;
  const cacheHeaders = {
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
  };

  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: cacheHeaders });
  }

  const data = await readFile(filePath);
  const ext = filePath.split(".").pop() ?? "";
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(data), {
    headers: { "Content-Type": contentType, ...cacheHeaders },
  });
}
