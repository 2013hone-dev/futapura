export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { Navbar } from "@/components/ui/Navbar";
import { Feed } from "@/components/post/Feed";
import { ToastContainer } from "@/components/ui/Toast";
import { CircleJoinButton } from "./CircleJoinButton";
import { Avatar } from "@/components/ui/Avatar";

export default async function CirclePage({ params }: { params: { id: string } }) {
  const session = await getAuthSession();
  const circle = await prisma.circle.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      members: {
        take: 8,
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      },
      _count: { select: { members: true, posts: true } },
    },
  });
  if (!circle) notFound();

  const myId = (session?.user as any)?.id;
  const isMember = circle.members.some(m => m.userId === myId);

  const COLORS = ["#4A90D9","#27AE60","#8E44AD","#E67E22","#C0392B","#16A085"];
  const bg = COLORS[circle.name.charCodeAt(0) % COLORS.length];

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="card overflow-hidden mb-6">
          <div className="h-24" style={{ background: `linear-gradient(135deg, ${bg}, ${bg}99)` }} />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-8 mb-4">
              <div className="w-16 h-16 rounded-2xl border-4 border-white shadow flex items-center justify-center text-white text-xl font-bold"
                style={{ background: bg }}>
                {circle.name.slice(0, 2)}
              </div>
              <CircleJoinButton
                circleId={circle.id}
                isMember={isMember}
                isLoggedIn={!!session}
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {circle.name}
              {circle.isPrivate && <span className="ml-2 text-sm font-normal text-gray-400">🔒</span>}
            </h1>
            {circle.description && <p className="text-sm text-gray-600 mt-1">{circle.description}</p>}
            <div className="flex gap-4 mt-3 text-sm text-gray-500">
              <span>{circle._count.members}人のメンバー</span>
              <span>{circle._count.posts}投稿</span>
            </div>

            {/* メンバー一覧 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">メンバー</p>
              <div className="flex gap-2 flex-wrap">
                {circle.members.map(m => (
                  <Avatar key={m.id} user={m.user} size={32} />
                ))}
                {circle._count.members > 8 && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    +{circle._count.members - 8}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <Feed circleId={circle.id} circles={[{ id: circle.id, name: circle.name }]} />
      </main>
      <ToastContainer />
    </>
  );
}
