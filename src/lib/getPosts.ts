import { prisma } from "./prisma";

export const postInclude = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  circle: { select: { id: true, name: true } },
  comments: {
    take: 3,
    orderBy: { createdAt: "asc" as const },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  },
  reactions: {
    include: { stamp: { select: { id: true, name: true, emoji: true } } },
  },
  _count: { select: { comments: true, reactions: true } },
};

export async function fetchPosts({
  myId,
  authorId,
  cursor,
  take = 20,
}: {
  myId?: string;
  authorId?: string;
  cursor?: string;
  take?: number;
}) {
  let where: any;

  if (authorId) {
    if (myId && myId === authorId) {
      where = { authorId };
    } else if (myId) {
      const myMemberships = await prisma.circleMember.findMany({
        where: { userId: myId },
        select: { circleId: true },
      });
      const myCircleIds = myMemberships.map((m) => m.circleId);
      where = {
        authorId,
        OR: [
          { visibility: "public" },
          { visibility: "circle", circleId: { in: myCircleIds } },
        ],
      };
    } else {
      where = { authorId, visibility: "public" };
    }
  } else {
    if (myId) {
      const myMemberships = await prisma.circleMember.findMany({
        where: { userId: myId },
        select: { circleId: true },
      });
      const myCircleIds = myMemberships.map((m) => m.circleId);
      where = {
        OR: [
          { visibility: "public" },
          { visibility: "circle", circleId: { in: myCircleIds } },
        ],
      };
    } else {
      where = { visibility: "public" };
    }
  }

  const posts = await prisma.post.findMany({
    where,
    take,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });

  const nextCursor = posts.length === take ? posts[posts.length - 1].id : null;
  return { posts, nextCursor };
}
