export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const packs = await prisma.stampPack.findMany({
    include: { stamps: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(packs);
}
