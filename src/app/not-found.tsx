import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-7xl mb-4">🌀</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-6">ページが見つかりませんでした</p>
        <Link href="/" className="btn-primary">ホームへ戻る</Link>
      </div>
    </div>
  );
}
