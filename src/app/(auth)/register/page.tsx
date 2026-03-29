"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", displayName: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const WEAK_PASSWORDS = ["password","password123","123456","12345678","qwerty","abc123","111111","000000","iloveyou","welcome","monkey","dragon","master","letmein","sunshine","princess","admin","login","pass"];

  const checkPasswordStrength = (pw: string): string | null => {
    if (pw.length < 8) return "パスワードは8文字以上にしてください";
    if (WEAK_PASSWORDS.includes(pw.toLowerCase())) return "このパスワードは危険です。より複雑なパスワードを使用してください";
    if (!/[a-zA-Z]/.test(pw)) return "パスワードには英字を含めてください";
    if (!/[0-9]/.test(pw)) return "パスワードには数字を含めてください";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const pwError = checkPasswordStrength(form.password);
    if (pwError) { setError(pwError); setLoading(false); return; }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "登録に失敗しました");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/");
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold">
            <span className="text-brand-500">ふたぷら</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">みんなでつながるSNS</p>
        </div>
        <div className="card p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">アカウント作成</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
              <input value={form.displayName} onChange={set("displayName")}
                className="input" placeholder="山田 花子" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
              <input value={form.username} onChange={set("username")}
                className="input" placeholder="hanako" pattern="[a-zA-Z0-9_]+" required />
              <p className="text-xs text-gray-400 mt-1">半角英数字・アンダースコアのみ</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input type="email" value={form.email} onChange={set("email")}
                className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input type="password" value={form.password} onChange={set("password")}
                className="input" placeholder="英字・数字を含む8文字以上" minLength={8} required />
              {form.password.length > 0 && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => {
                      const len = form.password.length;
                      const hasLetter = /[a-zA-Z]/.test(form.password);
                      const hasNum = /[0-9]/.test(form.password);
                      const hasSymbol = /[^a-zA-Z0-9]/.test(form.password);
                      const score = (len >= 8 ? 1 : 0) + (hasLetter ? 1 : 0) + (hasNum ? 1 : 0) + (hasSymbol ? 1 : 0);
                      const color = score <= 1 ? "bg-red-400" : score === 2 ? "bg-orange-400" : score === 3 ? "bg-yellow-400" : "bg-green-400";
                      return <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? color : "bg-gray-200"}`} />;
                    })}
                  </div>
                  <p className="text-xs text-gray-400">英字・数字・記号を組み合わせると安全です</p>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 text-base disabled:opacity-60">
              {loading ? "作成中..." : "アカウントを作成"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-brand-500 hover:underline font-medium">ログイン</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
