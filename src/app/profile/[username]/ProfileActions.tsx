"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";

type Circle = { id: string; name: string };

export function ProfileActions({ username, isMe, isFollowing: init, isLoggedIn, myCircles, targetUsername }: {
  username: string;
  isMe: boolean;
  isFollowing: boolean;
  isLoggedIn: boolean;
  myCircles?: Circle[];
  targetUsername?: string;
}) {
  const [following, setFollowing] = useState(init);
  const [loading, setLoading] = useState(false);
  const [showCircleMenu, setShowCircleMenu] = useState(false);
  const [addingCircle, setAddingCircle] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowCircleMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isMe) {
    return (
      <button onClick={() => router.push("/settings")} className="btn-secondary text-sm">
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

  const handleAddToCircle = async (circle: Circle) => {
    setAddingCircle(circle.id);
    const res = await fetch(`/api/circles/${circle.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: targetUsername || username }),
    });
    const data = await res.json();
    if (res.ok) {
      toast(`「${circle.name}」に追加しました`);
    } else {
      toast(data.error || "追加に失敗しました", "error");
    }
    setAddingCircle(null);
    setShowCircleMenu(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* サークルに追加 */}
      {myCircles && myCircles.length > 0 && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowCircleMenu(v => !v)}
            className="btn-secondary text-sm flex items-center gap-1"
            title="サークルに追加"
          >
            ⭕ <span className="hidden sm:inline">サークル</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {showCircleMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
              <p className="text-xs text-gray-400 px-3 py-2 border-b border-gray-50">サークルに追加</p>
              {myCircles.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleAddToCircle(c)}
                  disabled={addingCircle === c.id}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <span>⭕</span>
                  <span className="truncate">{c.name}</span>
                  {addingCircle === c.id && <span className="ml-auto text-xs text-gray-400">追加中...</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* フォローボタン */}
      <button
        onClick={handleFollow}
        disabled={loading}
        className={following ? "btn-secondary text-sm" : "btn-primary text-sm"}
      >
        {loading ? "..." : following ? "フォロー中" : "フォローする"}
      </button>
    </div>
  );
}
