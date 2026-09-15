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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const filePath = resolveMediaFilePath(segments);
  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    await stat(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const data = await readFile(filePath);
  const ext = filePath.split(".").pop() ?? "";
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      // Content-addressed filenames never change contents, so cache forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
