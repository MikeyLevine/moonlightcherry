import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getConversationMessages } from "@/lib/messaging/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await getConversationMessages(id, session.user.id);
  if (!messages) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ messages });
}
