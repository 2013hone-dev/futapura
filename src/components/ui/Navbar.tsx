"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Avatar } from "./Avatar";

type Notification = {
  id: string;
  type: string;
  content: string;
  isRead: boolean;
  postId: string | null;
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

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 未読数だけ定期取得
  useEffect(() => {
    if (!session) return;
    const fetchUnread = () => {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setUnread(data.filter((n: Notification) => !n.isRead).length);
          }
        });
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 60000);
    return () => clearInterval(timer);
  }, [session]);

  // 通知ドロップダウンを開く
  const openNotif = async () => {
    if (notifOpen) {
      setNotifOpen(false);
      return;
    }
    setMenuOpen(false);
    setNotifOpen(true);
    setNotifLoading(true);
    try {
      const data = await fetch("/api/notifications").then((r) => r.json());
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnread(0);
        // 既読にする
        fetch("/api/notifications", { method: "PATCH" });
      }
    } finally {
      setNotifLoading(false);
    }
  };

  // 外側クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const nav = [
    { href: "/", label: "ホーム", icon: "🏠" },
    { href: "/circles", label: "サークル", icon: "⭕" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 flex items-center h-14 gap-4">
        {/* Logo */}
        <Link href="/" className="font-display font-bold text-xl text-gray-900 mr-2">
          <span className="text-brand-500">ふたぷら</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xs hidden sm:flex items-center bg-gray-100 rounded-2xl px-3 py-1.5 gap-2">
          <span className="text-gray-400 text-sm">🔍</span>
          <input placeholder="検索..." className="bg-transparent outline-none text-sm text-gray-700 w-full" />
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                pathname === item.href
                  ? "text-brand-500 bg-blue-50"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="hidden sm:block">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right */}
        {session ? (
          <div className="relative ml-auto flex items-center gap-2">

            {/* 通知ベル → ドロップダウン */}
            <div ref={notifRef} className="relative">
              <button
                onClick={openNotif}
                className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <span className="text-xl">🔔</span>
                {unread > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {/* 通知ポップアップ */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  {/* ヘッダー */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-900 text-sm">通知</span>
                    <Link
                      href="/notifications"
                      className="text-xs text-brand-500 hover:underline"
                      onClick={() => setNotifOpen(false)}
                    >
                      すべて見る
                    </Link>
                  </div>

                  {/* 通知リスト */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                        <div className="text-3xl mb-2">🔔</div>
                        <p className="text-sm">通知はありません</p>
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
                            !n.isRead ? "bg-blue-50 hover:bg-blue-100" : ""
                          }`}
                        >
                          {/* アクターアバターまたはタイプアイコン */}
                          <div className="relative flex-shrink-0 mt-0.5">
                            {n.actor ? (
                              <Avatar
                                user={{ displayName: n.actor.displayName, avatarUrl: n.actor.avatarUrl }}
                                size={32}
                              />
                            ) : (
                              <span className="text-lg">{typeIcon(n.type)}</span>
                            )}
                            {n.actor && (
                              <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none">
                                {typeIcon(n.type)}
                              </span>
                            )}
                          </div>

                          {/* テキスト */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 leading-snug">
                              <span className="font-semibold">
                                {n.actor?.displayName || n.content.split(" が")[0]}
                              </span>
                              {" が"}
                              <span className="text-gray-600">{typeLabel(n.type)}</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                          </div>

                          {/* 投稿リンク */}
                          {n.postId && (
                            <Link
                              href={`/?post=${n.postId}`}
                              className="text-xs text-brand-500 hover:underline flex-shrink-0 mt-1 whitespace-nowrap"
                              onClick={() => setNotifOpen(false)}
                            >
                              見る →
                            </Link>
                          )}

                          {/* 未読ドット */}
                          {!n.isRead && (
                            <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* アバターメニュー */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
                className="flex items-center gap-2"
              >
                <Avatar user={{ displayName: session.user?.name || "?", avatarUrl: session.user?.image }} size={34} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <Link
                    href={`/profile/${(session.user as any).username}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Avatar user={{ displayName: session.user?.name || "?", avatarUrl: session.user?.image }} size={32} />
                    <div>
                      <div className="font-semibold text-gray-900">{session.user?.name}</div>
                      <div className="text-xs text-gray-400">@{(session.user as any).username}</div>
                    </div>
                  </Link>
                  <hr className="border-gray-100" />
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>⚙️</span>
                    <span>プロフィール編集</span>
                  </Link>
                  <hr className="border-gray-100" />
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="ml-auto flex gap-2">
            <Link href="/login" className="btn-secondary text-sm">ログイン</Link>
            <Link href="/register" className="btn-primary text-sm">登録</Link>
          </div>
        )}
      </div>
    </header>
  );
}
