export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(_: NextRequest, { params }: { params: { username: string } }) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const target = await prisma.user.findUnique({ where: { username: params.username } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const followerId = (session.user as any).id;
  if (followerId === target.id)
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: target.id } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  await prisma.follow.create({ data: { followerId, followingId: target.id } });
  return NextResponse.json({ following: true });
}
