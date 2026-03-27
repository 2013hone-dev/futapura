import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      username: "alice",
      displayName: "田中 美咲",
      password,
      bio: "写真と旅行が好きです🌸",
      avatarUrl: null,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      username: "bob",
      displayName: "佐藤 拓也",
      password,
      bio: "エンジニア。コーヒー☕とコード",
      avatarUrl: null,
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      email: "carol@example.com",
      username: "carol",
      displayName: "山田 花子",
      password,
      bio: "料理研究家🍳",
      avatarUrl: null,
    },
  });

  // フォロー関係
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
    update: {},
    create: { followerId: alice.id, followingId: bob.id },
  });
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: bob.id, followingId: alice.id } },
    update: {},
    create: { followerId: bob.id, followingId: alice.id },
  });
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: carol.id, followingId: alice.id } },
    update: {},
    create: { followerId: carol.id, followingId: alice.id },
  });

  // サークル
  const circle = await prisma.circle.upsert({
    where: { id: "circle-friends" },
    update: {},
    create: {
      id: "circle-friends",
      name: "写真好きの集い",
      description: "日常の写真をシェアするサークルです",
      ownerId: alice.id,
    },
  });

  await prisma.circleMember.upsert({
    where: { userId_circleId: { userId: alice.id, circleId: circle.id } },
    update: {},
    create: { userId: alice.id, circleId: circle.id, role: "owner" },
  });
  await prisma.circleMember.upsert({
    where: { userId_circleId: { userId: bob.id, circleId: circle.id } },
    update: {},
    create: { userId: bob.id, circleId: circle.id },
  });

  // スタンプパック
  const pack = await prisma.stampPack.upsert({
    where: { id: "pack-basic" },
    update: {},
    create: {
      id: "pack-basic",
      name: "基本スタンプ",
      description: "よく使うスタンプセット",
    },
  });

  const stampData = [
    { id: "stamp-1", name: "いいね", emoji: "👍", imageUrl: "" },
    { id: "stamp-2", name: "最高", emoji: "🎉", imageUrl: "" },
    { id: "stamp-3", name: "笑える", emoji: "😂", imageUrl: "" },
    { id: "stamp-4", name: "かわいい", emoji: "🥰", imageUrl: "" },
    { id: "stamp-5", name: "すごい", emoji: "🔥", imageUrl: "" },
    { id: "stamp-6", name: "悲しい", emoji: "😢", imageUrl: "" },
  ];

  for (const s of stampData) {
    await prisma.stamp.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, packId: pack.id },
    });
  }

  // 投稿
  const post1 = await prisma.post.create({
    data: {
      content: "今日は渋谷でランチ🍜 新しくできたラーメン屋さん、スープが絶品でした！また行きたい。",
      authorId: alice.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      content: "新しいプロジェクトがついにキックオフ✨ チームの皆さんよろしくお願いします！",
      authorId: bob.id,
    },
  });

  await prisma.post.create({
    data: {
      content: "週末に箱根へ行ってきました🗻 富士山が綺麗に見えて最高の気分！",
      authorId: carol.id,
    },
  });

  // コメント
  await prisma.comment.create({
    data: { content: "どこのお店ですか？気になる！", authorId: bob.id, postId: post1.id },
  });
  await prisma.comment.create({
    data: { content: "私も行きたい〜！", authorId: carol.id, postId: post1.id },
  });

  // リアクション
  await prisma.reaction.create({
    data: { userId: bob.id, postId: post1.id, type: "like" },
  });
  await prisma.reaction.create({
    data: { userId: carol.id, postId: post1.id, type: "like" },
  });
  await prisma.reaction.create({
    data: { userId: alice.id, postId: post2.id, type: "like" },
  });

  console.log("✅ シードデータ投入完了");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
