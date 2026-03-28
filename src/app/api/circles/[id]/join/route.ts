export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const existing = await prisma.circleMember.findUnique({
    where: { userId_circleId: { userId, circleId: params.id } },
  });

  if (existing) {
    if (existing.role === "owner")
      return NextResponse.json({ error: "Owner cannot leave" }, { status: 400 });
    await prisma.circleMember.delete({ where: { id: existing.id } });
    return NextResponse.json({ joined: false });
  }

  await prisma.circleMember.create({ data: { userId, circleId: params.id } });
  return NextResponse.json({ joined: true });
}
