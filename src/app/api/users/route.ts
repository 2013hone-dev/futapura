import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, username, displayName, password } = await req.json();

  if (!email || !username || !displayName || !password)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (exists)
    return NextResponse.json({ error: "Email or username already taken" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, displayName, password: hashed },
    select: { id: true, email: true, username: true, displayName: true },
  });

  return NextResponse.json(user, { status: 201 });
}
