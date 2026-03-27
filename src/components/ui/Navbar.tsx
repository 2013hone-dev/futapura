"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Avatar } from "./Avatar";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setUnread(data.filter((n: any) => !n.isRead).length));
  }, [session]);

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
          <div className="relative ml-auto">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2"
            >
              {unread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unread}
                </span>
              )}
              <Avatar user={{ displayName: session.user?.name || "?", avatarUrl: session.user?.image }} size={34} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <Link
                  href={`/profile/${(session.user as any).username}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  <Avatar user={{ displayName: session.user?.name || "?" }} size={32} />
                  <div>
                    <div className="font-semibold text-gray-900">{session.user?.name}</div>
                    <div className="text-xs text-gray-400">@{(session.user as any).username}</div>
                  </div>
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
