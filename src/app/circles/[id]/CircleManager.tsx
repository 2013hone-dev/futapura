"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "@/components/ui/Toast";
import Link from "next/link";

type Member = {
  id: string;
  userId: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
};
type Circle = {
  id: string;
  name: string;
  description: string | null;
  members: Member[];
};

const CIRCLE_COLORS = ["#4A90D9","#27AE60","#8E44AD","#E67E22","#C0392B","#16A085","#E91E63","#FF5722"];

export function CircleManager({ circle: init }: { circle: Circle }) {
  const [members, setMembers] = useState<Member[]>(init.members);
  const [username, setUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  const colorOf = (name: string) => CIRCLE_COLORS[name.charCodeAt(0) % CIRCLE_COLORS.length];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setAdding(true);
    const res = await fetch(`/api/circles/${init.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setMembers(m => [...m, data]);
      setUsername("");
      toast(`${data.user.displayName}さんを追加しました`);
      router.refresh();
    } else {
      toast(data.error || "追加に失敗しました", "error");
    }
    setAdding(false);
  };

  const handleRemove = async (member: Member) => {
    if (!confirm(`${member.user.displayName}さんをサークルから外しますか？`)) return;
    const res = await fetch(`/api/circles/${init.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: member.userId }),
    });
    if (res.ok) {
      setMembers(m => m.filter(x => x.id !== member.id));
      toast("メンバーを外しました");
      router.refresh();
    } else {
      toast("失敗しました", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/circles" className="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
          style={{ background: colorOf(init.name) }}>
          {init.name.slice(0, 2)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{init.name}</h1>
          {init.description && <p className="text-sm text-gray-500">{init.description}</p>}
        </div>
      </div>

      {/* メンバー追加 */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">メンバーを追加</p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="input flex-1"
            placeholder="ユーザー名（@以降）を入力"
          />
          <button type="submit" disabled={adding || !username.trim()} className="btn-primary disabled:opacity-60 whitespace-nowrap">
            {adding ? "追加中..." : "追加"}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">追加された相手にはどのサークルに入れられたかは通知されません。</p>
      </div>

      {/* メンバー一覧 */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">
          メンバー <span className="text-gray-400 font-normal">({members.length}人)</span>
        </p>
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">まだメンバーがいません</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {members.map(m => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <Avatar user={m.user} size={40} />
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${m.user.username}`}
                    className="text-sm font-semibold text-gray-900 hover:text-brand-500 transition-colors">
                    {m.user.displayName}
                  </Link>
                  <p className="text-xs text-gray-400">@{m.user.username}</p>
                </div>
                <button
                  onClick={() => handleRemove(m)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  外す
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
