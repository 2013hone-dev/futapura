export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { Navbar } from "@/components/ui/Navbar";
import { Feed } from "@/components/post/Feed";
import { ToastContainer } from "@/components/ui/Toast";
import { ProfileActions } from "./ProfileActions";
import { Avatar } from "@/components/ui/Avatar";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const session = await getAuthSession();
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true, username: true, displayName: true,
      avatarUrl: true, coverUrl: true, bio: true, createdAt: true,
      _count: { select: { followedBy: true, following: true, posts: true } },
    },
  });
  if (!user) notFound();

  const myId = (session?.user as any)?.id;
  const isMe = myId === user.id;
  let isFollowing = false;
  if (myId && !isMe) {
    const f = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: myId, followingId: user.id } },
    });
    isFollowing = !!f;
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Cover */}
        <div className="card overflow-hidden mb-4">
          <div className="h-32 bg-gradient-to-r from-brand-500 to-purple-500" />
          <div className="px-6 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <Avatar
                user={user}
                size={80}
                className="border-4 border-white shadow-md rounded-2xl"
              />
              <ProfileActions
                username={user.username}
                isMe={isMe}
                isFollowing={isFollowing}
                isLoggedIn={!!session}
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{user.displayName}</h1>
            <p className="text-sm text-gray-400 mt-0.5">@{user.username}</p>
            {user.bio && <p className="text-sm text-gray-700 mt-2">{user.bio}</p>}
            <div className="flex gap-6 mt-4 text-sm">
              <div><span className="font-bold text-gray-900">{user._count.posts}</span> <span className="text-gray-400">投稿</span></div>
              <div><span className="font-bold text-gray-900">{user._count.followedBy}</span> <span className="text-gray-400">フォロワー</span></div>
              <div><span className="font-bold text-gray-900">{user._count.following}</span> <span className="text-gray-400">フォロー中</span></div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <Feed authorId={user.id} />
      </main>
      <ToastContainer />
    </>
  );
}
