import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { Navbar } from "@/components/ui/Navbar";
import { ToastContainer } from "@/components/ui/Toast";
import { CircleList } from "@/components/circle/CircleList";

export default async function CirclesPage() {
  const session = await getAuthSession();
  const circles = await prisma.circle.findMany({
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      _count: { select: { members: true, posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const myId = (session?.user as any)?.id;
  const myMemberships = myId
    ? await prisma.circleMember.findMany({ where: { userId: myId }, select: { circleId: true } })
    : [];
  const joinedIds = myMemberships.map(m => m.circleId);

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <CircleList circles={circles} joinedIds={joinedIds} isLoggedIn={!!session} />
      </main>
      <ToastContainer />
    </>
  );
}
