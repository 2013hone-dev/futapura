import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // 種類チェック
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type))
    return NextResponse.json({ error: "JPG/PNG/GIF/WEBPのみ対応しています" }, { status: 400 });

  // サイズチェック（5MB以下）
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "ファイルサイズは5MB以下にしてください" }, { status: 400 });

  // Base64データURLに変換（Vercelのサーバーレス環境対応）
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  return NextResponse.json({ url: dataUrl });
}
