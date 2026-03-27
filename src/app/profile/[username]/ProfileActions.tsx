"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";

export function ProfileActions({ username, isMe, isFollowing: init, isLoggedIn }: {
  username: string; isMe: boolean; isFollowing: boolean; isLoggedIn: boolean;
}) {
  const [following, setFollowing] = useState(init);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (isMe) {
    return (
      <button
        onClick={() => router.push("/settings")}
        className="btn-secondary text-sm">
        プロフィール編集
      </button>
    );
  }

  if (!isLoggedIn) return null;

  const handleFollow = async () => {
    setLoading(true);
    const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
    const data = await res.json();
    setFollowing(data.following);
    toast(data.following ? `${username}さんをフォローしました` : "フォローを外しました");
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={following ? "btn-secondary text-sm" : "btn-primary text-sm"}>
      {loading ? "..." : following ? "フォロー中" : "フォローする"}
    </button>
  );
}
