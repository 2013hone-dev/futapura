"use client";
import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

type Circle = {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
};

const CIRCLE_COLORS = ["#4A90D9","#27AE60","#8E44AD","#E67E22","#C0392B","#16A085","#E91E63","#FF5722"];

export function CircleList({ circles: init }: { circles: Circle[] }) {
  const [circles, setCircles] = useState(init);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

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
      setShowCreate(false);
      setForm({ name: "", description: "" });
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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">マイサークル</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
          ＋ 新しいサークル
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        サークルに追加した人だけに投稿を届けることができます。追加された相手にはどのサークルかは通知されません。
      </p>

      {circles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">⭕</div>
          <p className="text-lg font-medium">サークルはまだありません</p>
          <p className="text-sm mt-1">「家族」「友達」など、届け先ごとにサークルを作りましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {circles.map(c => (
            <Link key={c.id} href={`/circles/${c.id}`}
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow block">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ background: colorOf(c.name) }}>
                {c.name.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{c.name}</p>
                {c.description && (
                  <p className="text-sm text-gray-500 truncate">{c.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{c._count.members}人</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* 作成モーダル */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新しいサークルを作成">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">サークル名 *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input" placeholder="例：友達、家族、同僚" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明（任意）</label>
            <input value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input" placeholder="メモなど" />
          </div>
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
