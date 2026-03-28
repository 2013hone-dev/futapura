"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  content: string;
  isRead: boolean;
  postId: string | null;
  actorId: string | null;
  createdAt: string;
  actor?: { id: string; username: string; displayName: string; avatarUrl: string | null } | null;
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "たった今";
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return `${Math.floor(diff / 86400)}日前`;
}

function typeIcon(type: string) {
  switch (type) {
    case "comment": return "💬";
    case "reaction": return "❤️";
    case "follow": return "👤";
    default: return "🔔";
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "comment": return "コメントしました";
    case "reaction": return "リアクションしました";
    case "follow": return "フォローしました";
    default: return "";
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setNotifications(data);
        setLoading(false);
        // 既読にする
        fetch("/api/notifications", { method: "PATCH" });
      });
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">通知</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🔔</div>
            <p className="text-lg font-medium">通知はありません</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`card px-4 py-3 flex items-start gap-3 ${!n.isRead ? "bg-blue-50 border-blue-100" : ""}`}
              >
                {/* タイプアイコン */}
                <span className="text-xl mt-0.5 flex-shrink-0">{typeIcon(n.type)}</span>

                {/* 本文 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{n.content.split(" が")[0]}</span>
                    {" が"}
                    <span>{typeLabel(n.type)}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>

                {/* 投稿へのリンク */}
                {n.postId && (
                  <Link
                    href={`/?post=${n.postId}`}
                    className="text-xs text-brand-500 hover:underline flex-shrink-0 mt-1"
                  >
                    投稿を見る
                  </Link>
                )}

                {/* 未読バッジ */}
                {!n.isRead && (
                  <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
