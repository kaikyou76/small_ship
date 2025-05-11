`kaikyou-shop` プロジェクトを **Cloudflare Workers** にデプロイする流れについて、フロントエンド（Next.js）とバックエンド（Cloudflare Workers）両方のセットアップからデプロイまでを順を追って説明します。

### 1. **フロントエンド（Next.js）のビルドとデプロイ**

フロントエンドは Next.js で構築されています。これをデプロイするには、Vercel や Netlify、もしくは任意のサーバーにデプロイできます。Vercel にデプロイする場合を例にとって説明します。

#### 1.1 **フロントエンドのビルド**

フロントエンドをビルドして、デプロイ準備を整えます。以下のコマンドを実行して、Next.js プロジェクトをビルドします。

```bash
cd frontend
npm run build
```

これにより、`out/` フォルダが生成され、Next.js アプリが本番環境用に最適化されます。

#### 1.2 **Vercel へのデプロイ**

Vercel でのデプロイは非常に簡単です。以下の手順でデプロイを行います。

1. [Vercel](https://vercel.com) にサインインし、ダッシュボードから新しいプロジェクトを作成します。
2. GitHub や GitLab のリポジトリをリンクします。
3. プロジェクトを Vercel にデプロイします。

Vercel にリンクされた Git リポジトリが自動的にビルドされ、デプロイされます。ビルドの後、フロントエンドが本番環境に公開されます。

---

### 2. **バックエンド（Cloudflare Workers）のデプロイ**

バックエンド部分は Cloudflare Workers にデプロイされます。`backend/` フォルダにあるコードを Cloudflare Workers にデプロイする手順を見ていきます。

### 💡 前提：Cloudflare のログインと認証が済んでいること

#### 2.1 **Cloudflare Workers の設定**

バックエンドで使う `wrangler.jsonc` が必要です。`backend/wrangler.jsonc` に以下のような設定がされているはずです。

```json
{
  "name": "kaikyou-shop",
  "type": "javascript", // または "typescript" に変更する
  "account_id": "YOUR_ACCOUNT_ID", // Cloudflare のダッシュボードで確認
  "workers_dev": true, // 本番環境デプロイ時には false に設定
  "compatibility_date": "2025-05-04", // 本番環境に合わせた日付を設定
  "env": {
    "production": {
      "route": "https://your-shop.com/*", // 本番環境の URL
      "zone_id": "YOUR_ZONE_ID" // Cloudflare のゾーン ID
    }
  }
}
```

ここで重要な部分は 独自ドメインの場合、`account_id` と `zone_id` は必要となります。これらは Cloudflare のダッシュボードから取得できます。

#### 2.2 **Cloudflare Workers へデプロイ**

まず一度だけログインが必要：

```bash
wrangler login
```

**理由：** Cloudflare アカウントと `wrangler` CLI を紐づけ、本番環境にデプロイする権限を得るため。

---

### ① （任意）本番環境でのビルド確認：

```bash
wrangler deploy --env production --dry-run --outdir=dist
```

**目的：** 本番設定でビルドと設定の整合性を事前検証。ファイルは `dist/` に出力され、エラーがあればここで分かります。

- `--dry-run`: 実際のデプロイはしない。
- `--env production`: `wrangler.jsonc` の `env.production` を使って検証。
- `--outdir=dist`: 結果をローカルに保存。

---

### ② 本番へ実際にデプロイ：

```bash
wrangler deploy --env production
```

**理由：** `--env production` 付きで初めて、本番用環境変数（例：`JWT_SECRET`）・R2 バケット・D1 DB を使用してデプロイされます。

---

## 🔁 まとめ：おすすめの流れ

```bash
cd backend

# 1. Cloudflare にログイン（初回のみ）
wrangler login

# 2. 本番環境で dry-run ビルド（任意）
wrangler deploy --env production --dry-run --outdir=dist

# 3. 本番にデプロイ
wrangler deploy --env production
```

これにより、バックエンドが本番環境にデプロイされます。

> ✅ `wrangler publish` は `deploy` の旧名です（今は `deploy` が推奨されます）。

---

#### 2.4 **バックエンドの確認**

デプロイ後、以下のコマンドで Cloudflare Workers のログをリアルタイムで確認できます。

```bash
wrangler tail --env production
```

これにより、実際にバックエンドが正しく動作しているかどうかを確認できます。

---

### 3. **フロントエンドとバックエンドの連携**

フロントエンドとバックエンドを連携させるために、フロントエンドの環境変数（`.env.local`）にバックエンド API の URL を設定します。例えば、`NEXT_PUBLIC_API_URL` を設定して、バックエンドの API を参照するようにします。

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-cloudflare-worker-url.com/api
```

これにより、フロントエンドのコードはバックエンド API にリクエストを送信できるようになります。

---

### 4. **デプロイ後の確認**

- **フロントエンド**: Vercel などで公開された URL にアクセスして、アプリが正常に表示されるか確認します。
- **バックエンド**: Cloudflare Workers の URL（例えば `https://your-cloudflare-worker-url.com`）にアクセスして、API が正しく動作するか確認します。

---

### 5. **Git リポジトリにコードをプッシュ**

もし Git リポジトリを使用している場合、フロントエンドとバックエンド両方の変更をコミットし、リモートリポジトリにプッシュします。

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

これにより、コードが Git リポジトリにプッシュされ、CI/CD パイプラインで自動的にデプロイされる場合もあります。

---

これで、`kaikyou-shop` のフロントエンドとバックエンドの両方を本番環境にデプロイする準備が整いました！
