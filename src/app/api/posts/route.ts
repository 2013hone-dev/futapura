export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

const postInclude = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  circle: { select: { id: true, name: true } },
  comments: {
    take: 3,
    orderBy: { createdAt: "desc" as const },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  },
  reactions: {
    include: { stamp: { select: { id: true, name: true, emoji: true } } },
  },
  _count: { select: { comments: true, reactions: true } },
};

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  const myId = (session?.user as any)?.id as string | undefined;

  const { searchParams } = new URL(req.url);
  const authorId = searchParams.get("authorId");
  const cursor = searchParams.get("cursor");
  const take = 20;

  let where: any;

  if (authorId) {
    // プロフィールページ: その人の公開投稿 + 自分が見られるサークル投稿
    if (myId && myId === authorId) {
      // 自分のプロフィール: 全投稿
      where = { authorId };
    } else if (myId) {
      // 他人のプロフィール: 公開投稿 + 自分がメンバーのサークル投稿
      const myMemberships = await prisma.circleMember.findMany({
        where: { userId: myId },
        select: { circleId: true },
      });
      const myCircleIds = myMemberships.map(m => m.circleId);
      where = {
        authorId,
        OR: [
          { visibility: "public" },
          { visibility: "circle", circleId: { in: myCircleIds } },
        ],
      };
    } else {
      // 未ログイン: 公開投稿のみ
      where = { authorId, visibility: "public" };
    }
  } else {
    // ホームフィード
    if (myId) {
      // 自分がメンバーになっているサークルのIDを取得
      const myMemberships = await prisma.circleMember.findMany({
        where: { userId: myId },
        select: { circleId: true },
      });
      const myCircleIds = myMemberships.map(m => m.circleId);
      where = {
        OR: [
          { visibility: "public" },
          { visibility: "circle", circleId: { in: myCircleIds } },
        ],
      };
    } else {
      where = { visibility: "public" };
    }
  }

  const posts = await prisma.post.findMany({
    where,
    take,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });

  const nextCursor = posts.length === take ? posts[posts.length - 1].id : null;
  return NextResponse.json({ posts, nextCursor });
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, imageUrl, circleId, visibility } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  // circleId が指定された場合は visibility を "circle" に
  const finalVisibility = circleId ? "circle" : (visibility || "public");

  // circleId が指定された場合、自分のサークルか確認
  if (circleId) {
    const circle = await prisma.circle.findUnique({ where: { id: circleId } });
    if (!circle || circle.ownerId !== (session.user as any).id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const post = await prisma.post.create({
    data: {
      content: content.trim(),
      imageUrl,
      circleId: circleId || null,
      visibility: finalVisibility,
      authorId: (session.user as any).id,
    },
    include: postInclude,
  });

  return NextResponse.json(post, { status: 201 });
}
