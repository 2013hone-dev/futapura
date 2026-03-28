"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { toast, ToastContainer } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const username = (session?.user as any)?.username;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && username && !loaded) {
      fetch(`/api/users/${username}`)
        .then(r => r.json())
        .then(data => {
          setDisplayName(data.displayName ?? "");
          setBio(data.bio ?? "");
          setAvatarUrl(data.avatarUrl ?? null);
          setLoaded(true);
        });
    }
  }, [status, username, loaded, router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (data.url) {
      setAvatarUrl(data.url);
    } else {
      toast(data.error ?? "アップロードに失敗しました");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!username) return;
    setSaving(true);
    const res = await fetch(`/api/users/${username}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio, avatarUrl }),
    });
    if (res.ok) {
      toast("プロフィールを更新しました");
      setTimeout(() => router.push(`/profile/${username}`), 800);
    } else {
      toast("更新に失敗しました");
    }
    setSaving(false);
  };

  if (status === "loading" || !loaded) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="card p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">プロフィール編集</h1>

          {/* アバター */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar
                user={{ displayName: displayName || "?", avatarUrl }}
                size={96}
                className="border-4 border-white shadow-md"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-brand-500 hover:bg-brand-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
              >
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-gray-400 mt-2">JPG / PNG / GIF / WEBP（5MB以下）</p>
          </div>

          {/* フォーム */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
              <input
                className="input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={50}
                placeholder="表示名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={200}
                placeholder="自己紹介を入力してください"
              />
              <p className="text-xs text-gray-400 text-right mt-0.5">{bio.length}/200</p>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => router.back()}
              className="btn-secondary flex-1"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !displayName.trim()}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </main>
      <ToastContainer />
    </>
  );
}
