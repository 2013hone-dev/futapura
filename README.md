# Círculo — サークル型SNS

Google+のようなサークル機能を持つSNSアプリです。

## 必要なもの
- **Node.js 18以上** → https://nodejs.org からダウンロード
- **Git**（任意）

## 🚀 起動手順（5ステップ）

### 1. 依存パッケージをインストール
```bash
npm install
```

### 2. データベースを初期化
```bash
npx prisma db push
```

### 3. サンプルデータを投入
```bash
npm run db:seed
```

### 4. 開発サーバーを起動
```bash
npm run dev
```

### 5. ブラウザで開く
http://localhost:3000 を開く

---

## デモアカウント（すぐ試せます）
| メールアドレス | パスワード | 名前 |
|---|---|---|
| alice@example.com | password123 | 田中 美咲 |
| bob@example.com | password123 | 佐藤 拓也 |
| carol@example.com | password123 | 山田 花子 |

---

## 機能一覧
- ✅ メール/パスワード認証（登録・ログイン）
- ✅ 投稿・タイムライン（無限スクロール）
- ✅ いいね・コメント（リアルタイム反映）
- ✅ スタンプリアクション 🎭
- ✅ サークル作成・参加・投稿
- ✅ プロフィールページ
- ✅ フォロー/フォロワー
- ✅ 通知システム

## データベース管理
```bash
# ブラウザでDBの中身を確認できます
npx prisma studio
```

## ファイル構成
```
src/
├── app/                # ページ（Next.js App Router）
│   ├── page.tsx        # ホーム（タイムライン）
│   ├── login/          # ログイン
│   ├── register/       # 新規登録
│   ├── circles/        # サークル一覧・詳細
│   └── profile/        # プロフィール
├── components/         # UIコンポーネント
│   ├── post/           # 投稿関連
│   ├── circle/         # サークル関連
│   └── ui/             # 共通UI
├── lib/                # DB・認証
└── types/              # TypeScript型定義
prisma/
├── schema.prisma       # DBスキーマ
└── seed.ts             # サンプルデータ
```
