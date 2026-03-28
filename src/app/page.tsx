export const dynamic = 'force-dynamic';
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/ui/Navbar";
import { Feed } from "@/components/post/Feed";
import { ToastContainer } from "@/components/ui/Toast";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const userId = (session.user as any).id;

  // 自分が参加しているサークル一覧
  const myCircles = await prisma.circleMember.findMany({
    where: { userId },
    include: { circle: { select: { id: true, name: true } } },
  });
  const circles = myCircles.map(m => m.circle);

  // おすすめユーザー（フォローしていない人）
  const following = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
  const followingIds = following.map(f => f.followingId);
  const suggestions = await prisma.user.findMany({
    where: { id: { notIn: [...followingIds, userId] } },
    take: 3,
    select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
  });

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 flex gap-6">
        {/* Left sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0 space-y-4">
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">マイサークル</p>
            {circles.length === 0 ? (
              <p className="text-sm text-gray-400">まだ参加していません</p>
            ) : (
              circles.map(c => (
                <Link key={c.id} href={`/circles/${c.id}`}
                  className="flex items-center gap-2 py-2 text-sm text-gray-700 hover:text-brand-500 transition-colors">
                  <span className="text-base">⭕</span>{c.name}
                </Link>
              ))
            )}
            <Link href="/circles" className="mt-3 block text-xs text-brand-500 hover:underline">
              サークルを探す →
            </Link>
          </div>
        </aside>

        {/* Feed */}
        <div className="flex-1 min-w-0">
          <Feed circles={circles} />
        </div>

        {/* Right sidebar */}
        {suggestions.length > 0 && (
          <aside className="hidden xl:block w-60 flex-shrink-0">
            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">おすすめユーザー</p>
              <div className="space-y-3">
                {suggestions.map(u => (
                  <Link key={u.id} href={`/profile/${u.username}`}
                    className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-1.5 -mx-1.5 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {u.displayName.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.displayName}</p>
                      <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </main>
      <ToastContainer />
    </>
  );
}
