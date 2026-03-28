export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, type, stampId } = await req.json();
  const userId = (session.user as any).id;

  const existing = await prisma.reaction.findFirst({
    where: { userId, postId, type, stampId: stampId || null },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed" });
  }

  const reaction = await prisma.reaction.create({
    data: { userId, postId, type: type || "like", stampId: stampId || null },
    include: { stamp: { select: { id: true, name: true, emoji: true } } },
  });

  // 通知
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post && post.authorId !== userId) {
    await prisma.notification.create({
      data: {
        type: "reaction",
        content: `${(session.user as any).name} がリアクションしました`,
        userId: post.authorId,
        actorId: userId,
        postId,
      },
    });
  }

  return NextResponse.json({ action: "added", reaction });
}
