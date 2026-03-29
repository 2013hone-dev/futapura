export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchPosts, postInclude } from "@/lib/getPosts";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  const myId = (session?.user as any)?.id as string | undefined;

  const { searchParams } = new URL(req.url);
  const authorId = searchParams.get("authorId") ?? undefined;
  const cursor = searchParams.get("cursor") ?? undefined;

  const result = await fetchPosts({ myId, authorId, cursor, take: 20 });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, imageUrl, circleId, visibility } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const finalVisibility = circleId ? "circle" : (visibility || "public");

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
