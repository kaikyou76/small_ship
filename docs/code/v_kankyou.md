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

2. **Vercel への環境変数設定**:

   - Vercel ダッシュボード → プロジェクト → Settings → Environment Variables
   - すべての変数を追加（本番環境用）

3. **NextAuth 設定ファイルの確認**:

   ```ts
   // auth.ts または [...nextauth].ts
   export const authOptions: NextAuthOptions = {
     providers: [...],
     secret: process.env.NEXTAUTH_SECRET,
     basePath: process.env.NEXTAUTH_URL,
   }
   ```

4. **本番環境での動作確認手順**:

   ```bash
   # 1. ビルド
   npm run build

   # 2. 本番モードで起動
   npm run start

   # 3. ブラウザで確認
   open http://localhost:3000/register
   ```

この設定後、Vercel で再デプロイを実行すれば、`/register`ページが正しく動作するはずです。特に`NEXTAUTH_SECRET`はセキュリティ上非常に重要なので、必ず強力なキーを設定してください。
