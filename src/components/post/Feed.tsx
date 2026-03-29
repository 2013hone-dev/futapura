"use client";
import { useState, useCallback } from "react";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";
import { Spinner } from "@/components/ui/Spinner";

type Post = any;
type Circle = { id: string; name: string };

export function Feed({
  circleId,
  authorId,
  circles,
  initialPosts,
  initialCursor,
}: {
  circleId?: string;
  authorId?: string;
  circles?: Circle[];
  initialPosts?: Post[];
  initialCursor?: string | null;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts ?? []);
  const [cursor, setCursor] = useState<string | null>(initialCursor ?? null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialPosts ? initialPosts.length === 20 : true
  );

  const loadPosts = useCallback(async (reset = false) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (circleId) params.set("circleId", circleId);
    if (authorId) params.set("authorId", authorId);
    if (!reset && cursor) params.set("cursor", cursor);

    const res = await fetch(`/api/posts?${params}`);
    const data = await res.json();
    setPosts((p) => reset ? data.posts : [...p, ...data.posts]);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setLoading(false);
  }, [circleId, authorId, cursor]);

  // initialPostsが渡されていない場合のみ初回ロードを実行
  const [initialized, setInitialized] = useState(!!initialPosts);
  if (!initialized) {
    setInitialized(true);
    loadPosts(true);
  }

  const handleNewPost = (post: Post) => setPosts((p) => [post, ...p]);
  const handleDelete = (id: string) => setPosts((p) => p.filter((x) => x.id !== id));

  return (
    <div>
      <PostComposer circles={circles} onPost={handleNewPost} />
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={handleDelete} />
      ))}
      {loading && (
        <div className="flex justify-center py-8"><Spinner /></div>
      )}
      {!loading && hasMore && (
        <button
          onClick={() => loadPosts()}
          className="w-full py-3 text-sm text-brand-500 hover:text-brand-700 font-medium"
        >もっと読み込む</button>
      )}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>まだ投稿がありません</p>
        </div>
      )}
    </div>
  );
}
