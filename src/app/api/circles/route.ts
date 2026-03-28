export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json([], { status: 200 });

  const ownerId = (session.user as any).id;
  const circles = await prisma.circle.findMany({
    where: { ownerId },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(circles);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const ownerId = (session.user as any).id;
  const circle = await prisma.circle.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      isPrivate: true,
      ownerId,
    },
    include: {
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json(circle, { status: 201 });
}
