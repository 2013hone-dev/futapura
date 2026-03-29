export const dynamic = 'force-dynamic';
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchPosts } from "@/lib/getPosts";
import { Navbar } from "@/components/ui/Navbar";
import { Feed } from "@/components/post/Feed";
import { ToastContainer } from "@/components/ui/Toast";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";

export default async function HomePage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const userId = (session.user as any).id;

  // すべてのDBクエリを並列実行
  const [myOwnedCircles, following, initialPostsData] = await Promise.all([
    prisma.circle.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),
    fetchPosts({ myId: userId, take: 20 }),
  ]);

  const followingIds = following.map(f => f.followingId);

  // おすすめユーザー（フォローしていない人）
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
            {myOwnedCircles.length === 0 ? (
              <p className="text-sm text-gray-400">まだ作成していません</p>
            ) : (
              myOwnedCircles.map(c => (
                <Link key={c.id} href={`/circles/${c.id}`}
                  className="flex items-center gap-2 py-2 text-sm text-gray-700 hover:text-brand-500 transition-colors">
                  <span className="text-base">⭕</span>{c.name}
                </Link>
              ))
            )}
            <Link href="/circles" className="mt-3 block text-xs text-brand-500 hover:underline">
              サークルを管理 →
            </Link>
          </div>
        </aside>

        {/* Feed */}
        <div className="flex-1 min-w-0">
          <Feed
            circles={myOwnedCircles}
            initialPosts={initialPostsData.posts}
            initialCursor={initialPostsData.nextCursor}
          />
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
                    <Avatar user={u} size={36} />
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
