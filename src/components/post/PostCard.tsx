"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StampPicker } from "./StampPicker";
import { toast } from "@/components/ui/Toast";

type Stamp = { id: string; name: string; emoji: string | null };
type Reaction = { id: string; type: string; userId: string; stamp: Stamp | null };
type Comment = {
  id: string; content: string; createdAt: string;
  author: { id: string; username: string; displayName: string; avatarUrl: string | null };
};
type Post = {
  id: string; content: string; imageUrl: string | null; createdAt: string;
  author: { id: string; username: string; displayName: string; avatarUrl: string | null };
  circle: { id: string; name: string } | null;
  comments: Comment[]; reactions: Reaction[];
  _count: { comments: number; reactions: number };
};

export function PostCard({ post: initial, onDelete }: { post: Post; onDelete?: (id: string) => void }) {
  const { data: session } = useSession();
  const [post, setPost] = useState(initial);
  const [showComments, setShowComments] = useState(false);
  const [showStamps, setShowStamps] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const myId = (session?.user as any)?.id;
  const isLiked = post.reactions.some((r) => r.userId === myId && r.type === "like");

  const handleReaction = async (type: string, stamp?: Stamp) => {
    if (!session) { toast("ログインしてください", "error"); return; }
    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, type, stampId: stamp?.id }),
    });
    const data = await res.json();
    if (data.action === "added") {
      setPost((p) => ({
        ...p,
        reactions: [...p.reactions, { id: data.reaction.id, type, userId: myId, stamp: stamp || null }],
        _count: { ...p._count, reactions: p._count.reactions + 1 },
      }));
    } else {
      setPost((p) => ({
        ...p,
        reactions: p.reactions.filter(
          (r) => !(r.userId === myId && r.type === type && r.stamp?.id === stamp?.id)
        ),
        _count: { ...p._count, reactions: p._count.reactions - 1 },
      }));
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText, postId: post.id }),
    });
    if (res.ok) {
      const comment = await res.json();
      setPost((p) => ({
        ...p,
        comments: [...p.comments, comment],
        _count: { ...p._count, comments: p._count.comments + 1 },
      }));
      setCommentText("");
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!confirm("投稿を削除しますか？")) return;
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    onDelete?.(post.id);
    toast("削除しました");
  };

  // スタンプ集計
  const stampCounts: Record<string, { stamp: Stamp; count: number; mine: boolean }> = {};
  post.reactions.forEach((r) => {
    if (r.type === "stamp" && r.stamp) {
      const k = r.stamp.id;
      if (!stampCounts[k]) stampCounts[k] = { stamp: r.stamp, count: 0, mine: false };
      stampCounts[k].count++;
      if (r.userId === myId) stampCounts[k].mine = true;
    }
  });

  const contentTrimmed = post.content.trim();

  return (
    <>
      <div className="card mb-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <Link href={`/profile/${post.author.username}`}>
            <Avatar user={post.author} size={44} />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${post.author.username}`}
              className="font-bold text-gray-900 hover:underline">
              {post.author.displayName}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              {post.circle && (
                <Link href={`/circles/${post.circle.id}`}
                  className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-100">
                  {post.circle.name}
                </Link>
              )}
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ja })}
              </span>
            </div>
          </div>
          {myId === post.author.id && (
            <button onClick={handleDelete}
              className="text-gray-300 hover:text-red-400 transition-colors px-2 text-sm">🗑</button>
          )}
        </div>

        {/* テキスト */}
        {contentTrimmed && contentTrimmed !== " " && (
          <div className="px-4 pb-3 text-gray-800 leading-relaxed whitespace-pre-wrap">
            {contentTrimmed}
          </div>
        )}

        {/* 画像 */}
        {post.imageUrl && (
          <div className="px-4 pb-3">
            <img
              src={post.imageUrl}
              alt=""
              onClick={() => setLightbox(true)}
              className="w-full max-h-96 object-cover rounded-xl cursor-zoom-in border border-gray-100 hover:opacity-95 transition-opacity"
            />
          </div>
        )}

        {/* スタンプリアクション */}
        {Object.values(stampCounts).length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {Object.values(stampCounts).map(({ stamp, count, mine }) => (
              <button
                key={stamp.id}
                onClick={() => handleReaction("stamp", stamp)}
                className={`flex items-center gap-1 text-sm px-2.5 py-1 rounded-full border transition-colors ${
                  mine
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{stamp.emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* アクションバー */}
        <div className="flex items-center border-t border-gray-50 px-3 py-1 gap-1">
          <button
            onClick={() => handleReaction("like")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isLiked ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span>{isLiked ? "❤️" : "🤍"}</span>
            <span>{post.reactions.filter((r) => r.type === "like").length}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <span>💬</span>
            <span>{post._count.comments}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowStamps(!showStamps)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <span>🎭</span>
              <span className="hidden sm:inline">スタンプ</span>
            </button>
            {showStamps && (
              <StampPicker
                onSelect={(stamp) => handleReaction("stamp", stamp)}
                onClose={() => setShowStamps(false)}
              />
            )}
          </div>
        </div>

        {/* コメント欄 */}
        {showComments && (
          <div className="border-t border-gray-50 px-4 pb-4 pt-3">
            {post.comments.map((c) => (
              <div key={c.id} className="flex gap-2.5 mb-3">
                <Avatar user={c.author} size={32} />
                <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="font-semibold text-sm text-gray-900 mr-2">{c.author.displayName}</span>
                  <span className="text-sm text-gray-700">{c.content}</span>
                </div>
              </div>
            ))}
            {session && (
              <div className="flex gap-2.5 mt-2">
                <Avatar user={{ displayName: session.user?.name || "?" }} size={32} />
                <div className="flex-1 flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()}
                    placeholder="コメントを追加..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim() || submitting}
                    className="btn-primary text-sm px-4 disabled:opacity-50"
                  >送信</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 画像ライトボックス */}
      {lightbox && post.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors"
            onClick={() => setLightbox(false)}
          >✕</button>
          <img
            src={post.imageUrl}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
