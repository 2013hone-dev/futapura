import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, postId, parentId } = await req.json();
  if (!content?.trim() || !postId)
    return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      postId,
      parentId,
      authorId: (session.user as any).id,
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  // 通知（投稿者が自分でない場合）
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post && post.authorId !== (session.user as any).id) {
    await prisma.notification.create({
      data: {
        type: "comment",
        content: `${(session.user as any).name} がコメントしました`,
        userId: post.authorId,
        actorId: (session.user as any).id,
        postId,
      },
    });
  }

  return NextResponse.json(comment, { status: 201 });
}
