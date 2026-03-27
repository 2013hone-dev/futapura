"use client";
import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

type Circle = {
  id: string; name: string; description: string | null; isPrivate: boolean;
  owner: { id: string; username: string; displayName: string; avatarUrl: string | null };
  _count: { members: number; posts: number };
};

const CIRCLE_COLORS = ["#4A90D9","#27AE60","#8E44AD","#E67E22","#C0392B","#16A085","#E91E63","#FF5722"];

export function CircleList({ circles: init, joinedIds: initJoined, isLoggedIn }: {
  circles: Circle[]; joinedIds: string[]; isLoggedIn: boolean;
}) {
  const [circles, setCircles] = useState(init);
  const [joined, setJoined] = useState<Set<string>>(new Set(initJoined));
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isPrivate: false });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleJoin = async (id: string) => {
    if (!isLoggedIn) { toast("ログインが必要です", "error"); return; }
    const res = await fetch(`/api/circles/${id}/join`, { method: "POST" });
    const data = await res.json();
    setJoined(s => {
      const n = new Set(s);
      data.joined ? n.add(id) : n.delete(id);
      return n;
    });
    toast(data.joined ? "参加しました！" : "退出しました");
    router.refresh();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const circle = await res.json();
      setCircles(c => [circle, ...c]);
      setJoined(s => new Set([...s, circle.id]));
      setShowCreate(false);
      setForm({ name: "", description: "", isPrivate: false });
      toast("サークルを作成しました！");
      router.refresh();
    } else {
      toast("作成に失敗しました", "error");
    }
    setCreating(false);
  };

  const colorOf = (name: string) => CIRCLE_COLORS[name.charCodeAt(0) % CIRCLE_COLORS.length];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">サークル</h1>
        {isLoggedIn && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            ＋ 新しいサークル
          </button>
        )}
      </div>

      {circles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">⭕</div>
          <p className="text-lg font-medium">まだサークルがありません</p>
          <p className="text-sm mt-1">最初のサークルを作ってみましょう！</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {circles.map(c => (
            <div key={c.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ background: colorOf(c.name) }}>
                  {c.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/circles/${c.id}`}
                    className="font-bold text-gray-900 hover:text-brand-500 transition-colors">
                    {c.name}
                    {c.isPrivate && <span className="ml-2 text-xs text-gray-400 font-normal">🔒</span>}
                  </Link>
                  {c.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{c.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {c._count.members}人 · {c._count.posts}投稿
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleJoin(c.id)}
                className={joined.has(c.id) ? "btn-secondary text-sm w-full" : "btn-primary text-sm w-full"}>
                {joined.has(c.id) ? "参加中" : "参加する"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 作成モーダル */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新しいサークルを作成">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">サークル名 *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input" placeholder="例：写真好きの集い" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input resize-none" rows={3} placeholder="サークルの説明を書いてください" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isPrivate}
              onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))}
              className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-700">🔒 プライベートサークル（招待制）</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 btn-secondary">
              キャンセル
            </button>
            <button type="submit" disabled={creating || !form.name.trim()} className="flex-1 btn-primary disabled:opacity-60">
              {creating ? "作成中..." : "作成する"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
