"use client";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "@/components/ui/Toast";

type Circle = { id: string; name: string };
type Post = any;

export function PostComposer({ circles = [], onPost }: { circles?: Circle[]; onPost?: (p: Post) => void }) {
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const [circleId, setCircleId] = useState("");
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!session) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 種類チェック
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast("JPG/PNG/GIF/WEBPのみ対応しています", "error");
      return;
    }
    // サイズチェック
    if (file.size > 5 * 1024 * 1024) {
      toast("ファイルサイズは5MB以下にしてください", "error");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setFocused(true);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if ((!text.trim() && !imageFile) || submitting) return;
    setSubmitting(true);

    let imageUrl: string | undefined;

    // 画像アップロード
    if (imageFile) {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", imageFile);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "画像のアップロードに失敗しました", "error");
        setSubmitting(false);
        setUploading(false);
        return;
      }
      imageUrl = data.url;
      setUploading(false);
    }

    // 投稿
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: text.trim() || " ",
        imageUrl,
        circleId: circleId || undefined,
      }),
    });

    if (res.ok) {
      const post = await res.json();
      onPost?.(post);
      setText("");
      setCircleId("");
      setFocused(false);
      removeImage();
      toast("投稿しました！");
    } else {
      toast("投稿に失敗しました", "error");
    }
    setSubmitting(false);
  };

  const canSubmit = (text.trim() || imageFile) && !submitting;

  return (
    <div className="card p-4 mb-4">
      <div className="flex gap-3">
        <Avatar user={{ displayName: session.user?.name || "?" }} size={44} />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="今どうしてる？"
            rows={focused ? 3 : 1}
            className="w-full resize-none outline-none text-base text-gray-800 placeholder-gray-400 transition-all"
          />

          {/* 画像プレビュー */}
          {imagePreview && (
            <div className="relative mt-2 inline-block">
              <img
                src={imagePreview}
                alt="プレビュー"
                className="max-h-48 rounded-xl object-cover border border-gray-200"
              />
              <button
                onClick={removeImage}
                className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {focused && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
              {/* 画像ボタン */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors"
                title="画像を添付"
              >
                <span className="text-lg">🖼️</span>
                <span className="hidden sm:inline">画像</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* サークル選択 */}
              {circles.length > 0 && (
                <select
                  value={circleId}
                  onChange={(e) => setCircleId(e.target.value)}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 text-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">🌐 全体公開</option>
                  {circles.map((c) => (
                    <option key={c.id} value={c.id}>⭕ {c.name}</option>
                  ))}
                </select>
              )}

              <div className="flex-1" />

              <button
                onClick={() => { setFocused(false); setText(""); removeImage(); }}
                className="btn-secondary text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn-primary text-sm disabled:opacity-50 min-w-[72px]"
              >
                {uploading ? "アップ中..." : submitting ? "投稿中..." : "投稿"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
