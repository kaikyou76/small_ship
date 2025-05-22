✅ Vercel への環境変数設定
現在の設定と必要な認証設定について説明します。問題の原因として、NextAuth.js（認証ライブラリ）の本番環境設定が不足している可能性が高いです。

### 現在の設定状況

```env
# .env.production
NEXT_PUBLIC_API_BASE_URL=https://backend-production.kai-kyou.workers.dev
```

### 不足している認証関連の設定

```env
# 必須設定（NextAuth.js用）
NEXTAUTH_URL=https://kaikyou-online-shop.vercel.app
NEXTAUTH_SECRET=your-strong-secret-key-here

# 推奨追加設定
NEXT_PUBLIC_NEXTAUTH_URL=https://kaikyou-online-shop.vercel.app
NEXTAUTH_URL_INTERNAL=http://localhost:3000  # 開発用
```

### 各設定値の詳細説明

| 設定キー                   | 値の例                                   | 説明                                    |
| -------------------------- | ---------------------------------------- | --------------------------------------- |
| `NEXTAUTH_URL`             | `https://kaikyou-online-shop.vercel.app` | 本番環境のベース URL（必須）            |
| `NEXTAUTH_SECRET`          | ランダムな文字列                         | セッションの暗号化用（32 文字以上推奨） |
| `NEXT_PUBLIC_NEXTAUTH_URL` | 同上                                     | クライアントサイドで参照する URL        |
| `NEXT_PUBLIC_API_BASE_URL` | 既にある設定                             | API エンドポイント                      |

### 正しい`.env.production`の完成例

```env
# API設定
NEXT_PUBLIC_API_BASE_URL=https://backend-production.kai-kyou.workers.dev

# NextAuth設定
NEXTAUTH_URL=https://kaikyou-online-shop.vercel.app
NEXTAUTH_SECRET=your-very-strong-secret-key-32-chars-minimum
NEXT_PUBLIC_NEXTAUTH_URL=https://kaikyou-online-shop.vercel.app

# オプション（開発用）
NEXTAUTH_URL_INTERNAL=http://localhost:3000
```

### 設定時の注意点

1. **`NEXTAUTH_SECRET`の生成方法**（必須）:

   ```bash
   openssl rand -base64 32
   # または
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

## Vercel で環境変数を設定する方法

1. **Vercel ダッシュボード**にログインする
   [https://vercel.com/dashboard](https://vercel.com/dashboard)

2. 対象のプロジェクトをクリック

3. 左サイドバーから「Settings」を選択

4. メニューから「Environment Variables」を選ぶ

5. 「Add New Variable」ボタンを押す

6. 変数名（例: `NEXT_PUBLIC_API_BASE_URL`）と値を入力

7. 適用したい環境（Production, Preview, Development）を選択

8. 「Save」ボタンを押して保存

---

### 追加ポイント

- 環境変数名は`NEXT_PUBLIC_`で始めるとフロントエンドにも渡せます（Next.js の場合）
- 変更した環境変数は次回のデプロイ時に反映されます
- すでにデプロイ済みの場合は、環境変数変更後に手動で再デプロイしてください

---

もし具体的にどの画面のどの操作で迷っているか教えてもらえたら、画像付きでさらに丁寧に説明しますよ！
