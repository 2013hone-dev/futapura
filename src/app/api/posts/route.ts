export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const circleId = searchParams.get("circleId");
  const authorId = searchParams.get("authorId");
  const cursor = searchParams.get("cursor");
  const take = 20;

  const where: any = {};
  if (circleId) where.circleId = circleId;
  if (authorId) where.authorId = authorId;

  const posts = await prisma.post.findMany({
    where,
    take,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      circle: { select: { id: true, name: true } },
      comments: {
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      },
      reactions: {
        include: { stamp: { select: { id: true, name: true, emoji: true } } },
      },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  const nextCursor = posts.length === take ? posts[posts.length - 1].id : null;
  return NextResponse.json({ posts, nextCursor });
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, imageUrl, circleId, visibility } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const post = await prisma.post.create({
    data: {
      content: content.trim(),
      imageUrl,
      circleId,
      visibility: visibility || "public",
      authorId: (session.user as any).id,
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      circle: { select: { id: true, name: true } },
      comments: { include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }, take: 3, orderBy: { createdAt: "desc" as const } },
      reactions: { include: { stamp: { select: { id: true, name: true, emoji: true } } } },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}
