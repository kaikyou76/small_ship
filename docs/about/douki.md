現在の状況を正確に把握しました！`shopping-db` という D1 データベースが既に作成済みです（UUID: `f48c6205-4a37-4438-811e-1cb0d57c0e6d`）。ここから **ローカル開発とクラウド同期** をスムーズに行うための具体的な手順をご説明します。

---

### 🚀 **Step 1: ローカル開発環境の初期設定**

#### 1. **wrangler.toml の更新**

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "shopping-db"
database_id = "f48c6205-4a37-4438-811e-1cb0d57c0e6d" # 実際のUUIDを指定
preview_database_id = "f48c6205-4a37-4438-811e-1cb0d57c0e6d" # プレビュー用にも同じDBを指定
```

#### 2. **ローカル DB の初期化**

```bash
# スキーマを適用（初回のみ）
wrangler d1 execute shopping-db --local --file=./schema.sql
```

---

### 🔄 **Step 2: 双方向同期システムの構築**

#### 1. **同期スクリプトの作成**

```javascript
// scripts/sync-db.js
const { execSync } = require("child_process");

const commands = {
  push: "wrangler d1 export shopping-db --local --output=tmp/local.sqlite && wrangler d1 import shopping-db tmp/local.sqlite",
  pull: "wrangler d1 export shopping-db --output=tmp/cloud.sqlite && wrangler d1 execute shopping-db --local --file=tmp/cloud.sqlite",
};

const mode = process.argv[2];
execSync(commands[mode], { stdio: "inherit" });
```

#### 2. **package.json にコマンド追加**

```json
{
  "scripts": {
    "db:push": "node scripts/sync-db.js push",
    "db:pull": "node scripts/sync-db.js pull",
    "dev": "wrangler dev --local"
  }
}
```

---

### 💻 **Step 3: Next.js からの接続例**

```typescript
// app/api/products/route.ts
export async function GET() {
  const stmt = (env: any) => env.DB.prepare("SELECT * FROM products");

  // ローカル開発時
  if (process.env.NODE_ENV === "development") {
    const { DB } = await import("@cloudflare/workers-types");
    return Response.json(await stmt({ DB }).all());
  }

  // 本番環境
  return Response.json(await stmt(process.env).all());
}
```

---

### 📦 **データ同期の実際のワークフロー**

```bash
# 1. ローカルで開発（変更を加える）
npm run dev

# 2. 変更をクラウドに反映
npm run db:push

# 3. クラウドの最新データを取得
npm run db:pull
```

---

### 🛠 **トラブルシューティング集**

#### ❌ `Error: No such D1 database` が出る場合

```bash
# 1. バインディング確認
wrangler d1 list

# 2. ローカルDB再作成
wrangler d1 execute shopping-db --local --remote --file=schema.sql
```

#### ❌ マイグレーション競合が発生した場合

```bash
# 差分確認ツールのインストール
npm install -g sqlite3

# 差分比較
sqlite3 tmp/cloud.sqlite ".schema" > cloud_schema.txt
sqlite3 tmp/local.sqlite ".schema" > local_schema.txt
diff local_schema.txt cloud_schema.txt
```

---

### 🔥 **プロダクション環境での注意点**

1. **バックアップ自動化**

```bash
# 毎日AM3:00にバックアップ（crontabに追加）
0 3 * * * cd /path/to/project && wrangler d1 export shopping-db --output=backups/$(date +\%Y\%m\%d).sqlite
```

2. **移行ガードレール**

```sql
-- マイグレーション用チェック
BEGIN TRANSACTION;
ALTER TABLE products ADD COLUMN description TEXT;
-- エラーがなければCOMMIT
COMMIT;
```

---

この設定で **「ローカルで自由に開発 → ワンコマンドで本番反映」** という理想的なフローが実現できます。特に `db:push`/`db:pull` スクリプトは実際のプロジェクトで私が最も重宝している方法です！

さらに具体的なテーブル設計や複雑なクエリの最適化が必要な場合は、いつでも詳細をお聞かせください。
