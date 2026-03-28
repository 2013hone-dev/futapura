export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true, username: true, displayName: true,
      avatarUrl: true, coverUrl: true, bio: true, createdAt: true,
      _count: { select: { followedBy: true, following: true, posts: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUsername = (session.user as any).username;
  if (sessionUsername !== params.username)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { displayName, bio, avatarUrl } = await req.json();
  const user = await prisma.user.update({
    where: { username: params.username },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
  });
  return NextResponse.json(user);
}
