# バックエンド（Cloudflare Workers）の設定ファイル

kaikyou-shop\backend\wrangler.jsonc

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "backend",
  "main": "src/worker.ts",
  "compatibility_date": "2025-04-18",

  // ====================
  // ✅ Cloudflare D1 データベース設定
  // ====================
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "shopping-db",
      "database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973",
      "preview_database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973" // 追加
    }
  ],

  // ====================
  // ✅ CloudflareR2 バケット設定 （開発用）
  // ====================
  "r2_buckets": [
    {
      "binding": "R2_BUCKET",
      "bucket_name": "dev-bucket",
      "preview_bucket_name": "preview-bucket"
    }
  ],

  // ====================
  // ✅ 環境変数（開発用）
  // ====================
  "vars": {
    "JWT_SECRET": "local_dev_secret_do_not_use_in_prod",
    "JWT_ISSUER": "kaikyou-shop-dev",
    "JWT_AUDIENCE": "kaikyou-shop-users-dev",
    "ENVIRONMENT": "development",
    "R2_PUBLIC_DOMAIN": "localhost:8787/assets"
  },

  // ====================
  // ✅ 本番環境設定
  // ====================
  "env": {
    "production": {
      "vars": {
        "JWT_SECRET": "{{ JWT_SECRET_PRODUCTION }}",
        "JWT_ISSUER": "kaikyou-shop",
        "JWT_AUDIENCE": "kaikyou-shop-users",
        "ENVIRONMENT": "production",
        "R2_PUBLIC_DOMAIN": "assets.example.com"
      },
      "r2_buckets": [
        {
          "binding": "R2_BUCKET",
          "bucket_name": "production-bucket"
        }
      ],
      // 本番用D1設定（必要に応じて追加）
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "shopping-db",
          "database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973"
        }
      ]
    }
  }
}
```

以下に `wrangler.jsonc` の各行を一行ずつ分析します 👇

---

```json
{
```

👉 設定ファイルの開始（JSONC 形式：JSON + コメント可）。

---

```json
  "$schema": "node_modules/wrangler/config-schema.json",
```

👉 設定内容の構文チェック用スキーマを指定。VS Code などで補完が効くようになる。

---

```json
  "name": "backend",
```

👉 Workers の名前。Cloudflare ダッシュボードでもこの名前で表示される。

---

```json
  "main": "src/worker.ts",
```

👉 エントリーポイントとなる TypeScript ファイル。ここから Workers が実行される。

---

```json
  "compatibility_date": "2025-04-18",
```

👉 使用する Cloudflare API の互換性の日付（将来の仕様変更に対する安全弁）。

---

### ✅ D1 データベース設定

```json
  "d1_databases": [
```

👉 D1 データベースの一覧定義を開始。

---

```json
    {
      "binding": "DB",
```

👉 Workers 内で `env.DB` という名前でこの DB にアクセスできるようになる。

---

```json
      "database_name": "shopping-db",
```

👉 使用する D1 データベースの名前。

---

```json
      "database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973",
```

👉 本番用・開発用の両方で使う D1 のユニークな ID。

---

```json
      "preview_database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973"
```

👉 プレビュー環境用の D1 ID。開発・テストでも同じ DB を使う場合はこうなる。

---

```json
    }
  ],
```

👉 D1 設定の終了。

---

### ✅ Cloudflare R2（オブジェクトストレージ）設定

```json
  "r2_buckets": [
```

👉 R2 バケット（S3 のようなストレージ）の定義開始。

---

```json
    {
      "binding": "R2_BUCKET",
```

👉 Workers 内で `env.R2_BUCKET` でアクセスする変数名。

---

```json
      "bucket_name": "dev-bucket",
```

👉 開発環境で使う R2 のバケット名。

---

```json
      "preview_bucket_name": "preview-bucket"
```

👉 プレビュー環境用のバケット名。

---

```json
    }
  ],
```

👉 R2 設定の終了。

---

### ✅ 開発環境用の環境変数

```json
  "vars": {
```

👉 開発環境用の変数定義の開始。

---

```json
    "JWT_SECRET": "local_dev_secret_do_not_use_in_prod",
```

👉 開発用の JWT 署名鍵。**本番では絶対に使わないように！**

---

```json
    "JWT_ISSUER": "kaikyou-shop-dev",
    "JWT_AUDIENCE": "kaikyou-shop-users-dev",
```

👉 JWT の発行者・利用者の名前。バリデーションで使用。

---

```json
    "ENVIRONMENT": "development",
```

👉 現在の環境を明示。ロギングや挙動の分岐で使える。

---

```json
    "R2_PUBLIC_DOMAIN": "localhost:8787/assets"
```

👉 R2 に保存したファイルを取得するローカル用 URL。

---

```json
  },
```

👉 `vars` 終了。

---

### ✅ 本番環境の設定

```json
  "env": {
```

👉 複数の環境設定を切り替えるためのブロック（ここでは "production" のみ）。

---

```json
    "production": {
```

👉 本番環境の設定ブロック開始。

---

```json
      "vars": {
        "JWT_SECRET": "{{ JWT_SECRET_PRODUCTION }}",
```

👉 本番用の秘密鍵（デプロイ時に CI から注入する想定）。

---

```json
        "JWT_ISSUER": "kaikyou-shop",
        "JWT_AUDIENCE": "kaikyou-shop-users",
        "ENVIRONMENT": "production",
        "R2_PUBLIC_DOMAIN": "assets.example.com"
```

👉 本番環境用の JWT 情報と、R2 で配信するファイルのドメイン。

---

```json
      },
```

👉 `vars` 終了。

---

```json
      "r2_buckets": [
        {
          "binding": "R2_BUCKET",
          "bucket_name": "production-bucket"
        }
      ],
```

👉 本番用の R2 バケット設定。

---

```json
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "shopping-db",
          "database_id": "d53ad56f-f646-44dc-8dbf-3d2d15d76973"
        }
      ]
```

👉 本番用の D1 データベース設定（開発と同じ DB を使っている）。

---

```json
    }
  }
}
```

👉 すべての設定の終了！

---

### 要約すると：

- `main`, `compatibility_date`, `name` でベースの設定。
- `d1_databases`, `r2_buckets` で Cloudflare サービスと接続。
- `vars` と `env.production.vars` で環境別の変数管理。
- `env.production` で本番環境を明示的に切り分け可能。

---
