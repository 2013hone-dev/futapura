import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  const { displayName, bio } = await req.json();
  const user = await prisma.user.update({
    where: { username: params.username },
    data: { displayName, bio },
    select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
  });
  return NextResponse.json(user);
}
