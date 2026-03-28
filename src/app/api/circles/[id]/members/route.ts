export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// メンバー一覧取得
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ownerId = (session.user as any).id;
  const circle = await prisma.circle.findUnique({ where: { id: params.id } });
  if (!circle || circle.ownerId !== ownerId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.circleMember.findMany({
    where: { circleId: params.id },
    include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(members);
}

// メンバー追加（usernameで指定）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ownerId = (session.user as any).id;
  const circle = await prisma.circle.findUnique({ where: { id: params.id } });
  if (!circle || circle.ownerId !== ownerId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  if (target.id === ownerId)
    return NextResponse.json({ error: "自分自身は追加できません" }, { status: 400 });

  const existing = await prisma.circleMember.findUnique({
    where: { userId_circleId: { userId: target.id, circleId: params.id } },
  });
  if (existing) return NextResponse.json({ error: "すでに追加されています" }, { status: 409 });

  const member = await prisma.circleMember.create({
    data: { userId: target.id, circleId: params.id, role: "member" },
    include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
  });
  return NextResponse.json(member, { status: 201 });
}

// メンバー削除
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ownerId = (session.user as any).id;
  const circle = await prisma.circle.findUnique({ where: { id: params.id } });
  if (!circle || circle.ownerId !== ownerId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await req.json();
  await prisma.circleMember.deleteMany({
    where: { circleId: params.id, userId },
  });
  return NextResponse.json({ success: true });
}
