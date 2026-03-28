export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  const circles = await prisma.circle.findMany({
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      _count: { select: { members: true, posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(circles);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, isPrivate } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const ownerId = (session.user as any).id;
  const circle = await prisma.circle.create({
    data: {
      name: name.trim(),
      description,
      isPrivate: !!isPrivate,
      ownerId,
      members: { create: { userId: ownerId, role: "owner" } },
    },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      _count: { select: { members: true, posts: true } },
    },
  });

  return NextResponse.json(circle, { status: 201 });
}
